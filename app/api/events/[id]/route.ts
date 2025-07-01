// app/api/events/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { event } from "@/db/schema";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { auth } from "@/lib/auth";
import { deleteUploadThingFiles } from "@/lib/uploadthing";

// GET - Fetch a single event by ID (public access)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const eventData = await db.select().from(event).where(eq(event.id, id));
    
    if (eventData.length === 0) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json(eventData[0], {
      headers: {
        'Cache-Control': 's-maxage=31536000, stale-while-revalidate'
      }
    });
  } catch (error) {
    console.error("Error fetching event:", error);
    return NextResponse.json({ error: "Failed to fetch event" }, { status: 500 });
  }
}

// PUT - Update an existing event (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Use the request headers directly for authentication
    const data = await auth.api.getSession({
      headers: request.headers
    });
    
    // Check if user is authenticated
    if (!data || !data.session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { 
      title, 
      description, 
      eventDate, 
      location, 
      maxAttendees, 
      isActive, 
      sectionId,
      showCapacity,
      eventType,
      allowSignups,
      participantsPerSignup,
      featuredImage,
      galleryImages,
      detailedContent
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
        showCapacity: showCapacity !== undefined ? showCapacity : true,
        eventType: eventType || "event",
        allowSignups: allowSignups !== undefined ? allowSignups : true,
        participantsPerSignup: participantsPerSignup || 1,
        featuredImage: featuredImage || null,
        galleryImages: galleryImages || null,
        detailedContent: detailedContent || null,
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
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Use the request headers directly for authentication
    const data = await auth.api.getSession({
      headers: request.headers
    });
    
    // Check if user is authenticated
    if (!data || !data.session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    // Check if event exists before deleting
    const existingEvent = await db.select().from(event).where(eq(event.id, id));
    
    if (existingEvent.length === 0) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Collect all image URLs to delete from UploadThing
    const imageUrls: string[] = [];
    
    // Add featured image if it exists
    if (existingEvent[0].featuredImage) {
      imageUrls.push(existingEvent[0].featuredImage);
    }
    
    // Add gallery images if they exist
    if (existingEvent[0].galleryImages) {
      try {
        const galleryImages = JSON.parse(existingEvent[0].galleryImages);
        if (Array.isArray(galleryImages)) {
          imageUrls.push(...galleryImages);
        }
      } catch (error) {
        console.error('Error parsing gallery images:', error);
      }
    }

    // Delete the event from database
    await db.delete(event).where(eq(event.id, id));

    // Delete images from UploadThing (don't wait for this to complete)
    if (imageUrls.length > 0) {
      // Use the deleteUploadThingFiles function directly since we're already server-side
      import('@/lib/uploadthing').then(({ deleteUploadThingFiles }) => {
        deleteUploadThingFiles(imageUrls).catch(error => {
          console.error('Error deleting images from UploadThing:', error);
        });
      }).catch(error => {
        console.error('Error importing deleteUploadThingFiles:', error);
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Event deleted successfully" 
    });
  } catch (error) {
    console.error("Error deleting event:", error);
    return NextResponse.json({ error: "Failed to delete event" }, { status: 500 });
  }
}
