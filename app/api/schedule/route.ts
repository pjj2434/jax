// app/api/schedule/route.ts
import { NextRequest, NextResponse } from "next/server";
import { schedule, event } from "@/db/schema";
import { v4 as uuidv4 } from "uuid";
import { eq, desc, asc } from "drizzle-orm";
import { db } from "@/db";
import { auth } from "@/lib/auth";
import { revalidateTag, unstable_cache } from 'next/cache';

// GET - Fetch schedule (public access)
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const eventId = url.searchParams.get("eventId");
    
    // Use unstable_cache for schedule fetches
    const getSchedule = unstable_cache(
      async (eventId?: string) => {
        let scheduleQuery;
        if (eventId) {
          scheduleQuery = await db.select().from(schedule).where(eq(schedule.eventId, eventId));
        } else {
          scheduleQuery = await db.select().from(schedule).orderBy(asc(schedule.order));
        }
        
        // Get the full event details for each schedule item
        const scheduleWithEvents = await Promise.all(
          scheduleQuery.map(async (scheduleItem) => {
            const eventData = await db.select().from(event).where(eq(event.id, scheduleItem.eventId));
            return {
              ...scheduleItem,
              event: eventData[0] || null
            };
          })
        );
        
        return scheduleWithEvents;
      },
      ['schedule-fetch'],
      { tags: ['schedule'] }
    );

    const result = await getSchedule(eventId || undefined);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching schedule:", error);
    return NextResponse.json({ error: "Failed to fetch schedule" }, { status: 500 });
  }
}

// POST - Add event to schedule (admin only)
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const data = await auth.api.getSession({
      headers: request.headers
    });
    
    if (!data || !data.session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { eventId } = body;

    if (!eventId) {
      return NextResponse.json({ error: "Event ID is required" }, { status: 400 });
    }

    // Check if event exists
    const eventData = await db.select().from(event).where(eq(event.id, eventId));
    if (eventData.length === 0) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Check if already in schedule
    const existingSchedule = await db.select().from(schedule).where(eq(schedule.eventId, eventId));
    if (existingSchedule.length > 0) {
      return NextResponse.json({ error: "Event already in schedule" }, { status: 400 });
    }

    // Get the highest order number
    const maxOrder = await db.select().from(schedule).orderBy(desc(schedule.order)).limit(1);
    const nextOrder = maxOrder.length > 0 ? maxOrder[0].order + 1 : 0;

    // Add to schedule
    const newScheduleItem = await db.insert(schedule).values({
      id: uuidv4(),
      eventId,
      order: nextOrder,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    revalidateTag('schedule');

    return NextResponse.json(newScheduleItem[0], { status: 201 });
  } catch (error) {
    console.error("Error adding to schedule:", error);
    return NextResponse.json({ error: "Failed to add to schedule" }, { status: 500 });
  }
}

// DELETE - Remove event from schedule (admin only)
export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const data = await auth.api.getSession({
      headers: request.headers
    });
    
    if (!data || !data.session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const eventId = url.searchParams.get("eventId");

    if (!eventId) {
      return NextResponse.json({ error: "Event ID is required" }, { status: 400 });
    }

    // Remove from schedule
    await db.delete(schedule).where(eq(schedule.eventId, eventId));

    revalidateTag('schedule');

    return NextResponse.json({ 
      success: true, 
      message: "Event removed from schedule" 
    });
  } catch (error) {
    console.error("Error removing from schedule:", error);
    return NextResponse.json({ error: "Failed to remove from schedule" }, { status: 500 });
  }
} 