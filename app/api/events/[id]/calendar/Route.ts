// app/api/events/[id]/calendar/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { event } from "@/db/schema";
import { eq } from "drizzle-orm";
import ical from "ical-generator";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    // Fetch the event
    const eventData = await db.select().from(event).where(eq(event.id, id));
    
    if (eventData.length === 0) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    
    const eventDetails = eventData[0];
    
    // Only create calendar if event has a date
    if (!eventDetails.eventDate) {
      return NextResponse.json({ error: "Event has no date" }, { status: 400 });
    }
    
    // Create calendar
    const calendar = ical({ name: 'JAX Darts Bar Event' });
    
    // Create event start and end times
    const startDate = new Date(eventDetails.eventDate);
    const endDate = new Date(startDate);
    endDate.setHours(endDate.getHours() + 2); // Default to 2 hours duration
    
    // Add event to calendar
    calendar.createEvent({
      start: startDate,
      end: endDate,
      summary: eventDetails.title,
      description: eventDetails.description || '',
      location: eventDetails.location || 'JAX Darts Bar',
      url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://jax-green.vercel.app'}/events/${id}`,
    });
    
    // Generate iCal file
    const icalString = calendar.toString();
    
    // Return as downloadable file
    return new NextResponse(icalString, {
      headers: {
        'Content-Type': 'text/calendar',
        'Content-Disposition': `attachment; filename="event-${id}.ics"`,
      },
    });
  } catch (error) {
    console.error("Error generating calendar:", error);
    return NextResponse.json({ error: "Failed to generate calendar" }, { status: 500 });
  }
}
