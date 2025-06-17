// app/api/events/route.ts
import { NextRequest, NextResponse } from "next/server";
import { event, signup } from "@/db/schema";
import { v4 as uuidv4 } from "uuid";
import { eq, count } from "drizzle-orm";
import { db } from "@/db";
import { auth } from "@/lib/auth";

// GET - Fetch events (public access)
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    const sectionId = url.searchParams.get("sectionId");
    
    // If an ID is provided, return a single event with attendee count
    if (id) {
      // Get the event
      const eventData = await db.select().from(event).where(eq(event.id, id));
      
      if (eventData.length === 0) {
        return NextResponse.json({ error: "Event not found" }, { status: 404 });
      }
      
      // Get the attendee count for this event
      const attendeeCount = await db
        .select({ count: count() })
        .from(signup)
        .where(eq(signup.eventId, id));
      
      // Return the event with attendee count
      return NextResponse.json({
        ...eventData[0],
        attendeeCount: attendeeCount[0]?.count || 0
      });
    }
    
    // Otherwise, return all events with attendee counts
    let events;
    
    // Filter by section if provided
    if (sectionId) {
      events = await db.select().from(event).where(eq(event.sectionId, sectionId));
    } else {
      events = await db.select().from(event);
    }
    
    // Get attendee counts for all events
    const attendeeCounts = await db
      .select({
        eventId: signup.eventId,
        count: count()
      })
      .from(signup)
      .groupBy(signup.eventId);
    
    // Create a map of event IDs to attendee counts
    const attendeeCountMap = new Map();
    attendeeCounts.forEach(item => {
      attendeeCountMap.set(item.eventId, item.count);
    });
    
    // Add attendee count to each event
    const eventsWithCounts = events.map(event => ({
      ...event,
      attendeeCount: attendeeCountMap.get(event.id) || 0
    }));
    
    // Sort the results in memory
    eventsWithCounts.sort((a, b) => {
      if (!a.eventDate) return 1;
      if (!b.eventDate) return -1;
      return new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime();
    });
    
    return NextResponse.json(eventsWithCounts);
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}

// POST - Create a new event (admin only)
export async function POST(request: NextRequest) {
  try {
    // Use the request headers directly for authentication
    const data = await auth.api.getSession({
      headers: request.headers
    });
    
    // Check if user is authenticated
    if (!data || !data.session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the userId from the session
    const userId = data.session.userId;

    const body = await request.json();
    const { 
      title, 
      description, 
      eventDate, 
      location, 
      maxAttendees, 
      isActive, 
      sectionId,
      showCapacity // New field for capacity toggle
    } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const newEvent = await db.insert(event).values({
      id: uuidv4(),
      title,
      description,
      eventDate: eventDate ? new Date(eventDate) : null,
      location,
      maxAttendees,
      isActive: isActive !== undefined ? isActive : true,
      sectionId,
      showCapacity: showCapacity !== undefined ? showCapacity : true, // Default to true if not specified
      createdAt: new Date(),
      updatedAt: new Date(),
      createdById: userId,
    }).returning();

    return NextResponse.json(newEvent[0], { status: 201 });
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }
}

// PUT - Update an existing event (admin only)
export async function PUT(request: NextRequest) {
  try {
    // Use the request headers directly for authentication
    const data = await auth.api.getSession({
      headers: request.headers
    });
    
    // Check if user is authenticated
    if (!data || !data.session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { 
      id, 
      title, 
      description, 
      eventDate, 
      location, 
      maxAttendees, 
      isActive, 
      sectionId,
      showCapacity // New field for capacity toggle
    } = body;

    if (!id || !title) {
      return NextResponse.json({ error: "ID and title are required" }, { status: 400 });
    }

    const updatedEvent = await db.update(event)
      .set({
        title,
        description,
        eventDate: eventDate ? new Date(eventDate) : null,
        location,
        maxAttendees,
        isActive: isActive !== undefined ? isActive : true,
        sectionId,
        showCapacity: showCapacity !== undefined ? showCapacity : true, // Default to true if not specified
        updatedAt: new Date(),
      })
      .where(eq(event.id, id))
      .returning();

    if (updatedEvent.length === 0) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json(updatedEvent[0]);
  } catch (error) {
    console.error("Error updating event:", error);
    return NextResponse.json({ error: "Failed to update event" }, { status: 500 });
  }
}

// DELETE - Remove an event (admin only)
export async function DELETE(request: NextRequest) {
  try {
    // Use the request headers directly for authentication
    const data = await auth.api.getSession({
      headers: request.headers
    });
    
    // Check if user is authenticated
    if (!data || !data.session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    // Check if event exists before deleting
    const existingEvent = await db.select().from(event).where(eq(event.id, id));
    
    if (existingEvent.length === 0) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    await db.delete(event).where(eq(event.id, id));
    return NextResponse.json({ 
      success: true, 
      message: "Event deleted successfully" 
    });
  } catch (error) {
    console.error("Error deleting event:", error);
    return NextResponse.json({ error: "Failed to delete event" }, { status: 500 });
  }
}
