// app/api/events/route.ts
import { NextRequest, NextResponse } from "next/server";
import { event, signup, schedule } from "@/db/schema";
import { v4 as uuidv4 } from "uuid";
import { eq, count, desc } from "drizzle-orm";
import { db } from "@/db";
import { auth } from "@/lib/auth";
import { revalidateTag, unstable_cache } from 'next/cache';
import { deleteUploadThingFiles } from "@/lib/uploadthing";
import { revalidatePath } from 'next/cache';

// GET - Fetch events (public access for unauthenticated, all events for authenticated users)
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    const sectionId = url.searchParams.get("sectionId");
    
    // Check if user is authenticated (admin)
    const data = await auth.api.getSession({
      headers: request.headers
    });
    const isAdmin = data && data.session;
    
    // Use unstable_cache for event fetches
    const getEvent = unstable_cache(
      async (id: string) => {
        const eventData = await db.select().from(event).where(eq(event.id, id));
        if (eventData.length === 0) return null;
        const attendeeCount = await db
          .select({ count: count() })
          .from(signup)
          .where(eq(signup.eventId, id));
        return {
          ...eventData[0],
          attendeeCount: attendeeCount[0]?.count || 0
        };
      },
      ['event-fetch'],
      { tags: ['events', 'event-detail'] }
    );

    const getEvents = unstable_cache(
      async (sectionId?: string, includeInactive: boolean = false) => {
        let events;
        if (sectionId) {
          events = await db.select().from(event).where(eq(event.sectionId, sectionId));
        } else {
          events = await db.select().from(event);
        }
        
        // Only filter out inactive events for public users
        if (!includeInactive) {
          events = events.filter(event => event.isActive);
        }
        const attendeeCounts = await db
          .select({ eventId: signup.eventId, count: count() })
          .from(signup)
          .groupBy(signup.eventId);
        const attendeeCountMap = new Map();
        attendeeCounts.forEach(item => {
          attendeeCountMap.set(item.eventId, item.count);
        });
        const eventsWithCounts = events.map(event => ({
          ...event,
          attendeeCount: attendeeCountMap.get(event.id) || 0
        }));
        eventsWithCounts.sort((a, b) => {
          if (!a.eventDate) return 1;
          if (!b.eventDate) return -1;
          return new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime();
        });
        return eventsWithCounts;
      },
      ['events-fetch'],
      { tags: ['events'] }
    );

    if (id && id.trim() !== '') {
      const result = await getEvent(id);
      if (!result) {
        return NextResponse.json({ error: "Event not found" }, { status: 404 });
      }
      return NextResponse.json(result);
    }
    const result = await getEvents(sectionId || undefined, isAdmin);
    return NextResponse.json(result);
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
      showCapacity, // New field for capacity toggle
      detailedContent, // Add this
      eventType,
      logoType,
      allowSignups,
      participantsPerSignup,
      featuredImage,
      galleryImages,
      quickLinks,
      addToSchedule
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
      detailedContent, // Add this
      eventType: eventType || "event",
      logoType: logoType || "jsl",
      allowSignups: allowSignups !== undefined ? allowSignups : true,
      participantsPerSignup: participantsPerSignup || 1,
      featuredImage: featuredImage || null,
      galleryImages: galleryImages || null,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdById: userId,
    }).returning();

    revalidateTag('events');
    revalidateTag('event-detail');
    revalidateTag('schedule');
    revalidatePath(`/events/${newEvent[0].id}`);

    // Handle schedule addition if requested
    console.log('POST API received addToSchedule:', addToSchedule); // Debug log
    if (addToSchedule) {
      try {
        console.log('Adding new event to schedule:', newEvent[0].id); // Debug log
        
        try {
          // Check if already in schedule
          const existingSchedule = await db.select().from(schedule).where(eq(schedule.eventId, newEvent[0].id));
          console.log('POST - Existing schedule items:', existingSchedule); // Debug log
          
          if (existingSchedule.length === 0) {
            // Get the highest order number
            const maxOrder = await db.select().from(schedule).orderBy(desc(schedule.order)).limit(1);
            const nextOrder = maxOrder.length > 0 ? maxOrder[0].order + 1 : 0;
            console.log('POST - Next order number:', nextOrder); // Debug log

            // Add to schedule
            const newScheduleItem = await db.insert(schedule).values({
              id: uuidv4(),
              eventId: newEvent[0].id,
              order: nextOrder,
              createdAt: new Date(),
              updatedAt: new Date(),
            }).returning();
            
            console.log('POST - Successfully added to schedule:', newScheduleItem); // Debug log
          } else {
            console.log('POST - Event already in schedule, skipping'); // Debug log
          }
        } catch (dbError) {
          console.error('POST - Database error adding to schedule:', dbError); // Debug log
        }
      } catch (error) {
        console.error('Error adding to schedule:', error);
      }
    }

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
      showCapacity, // New field for capacity toggle
      detailedContent, // Add this
      eventType,
      logoType,
      allowSignups,
      participantsPerSignup,
      featuredImage,
      galleryImages,
      quickLinks,
      addToSchedule
    } = body;

    console.log('PUT API - Full body received:', body); // Debug log
    console.log('PUT API - addToSchedule value:', addToSchedule); // Debug log

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
        detailedContent, // Add this
        eventType: eventType || "event",
        logoType: logoType || "jsl",
        allowSignups: allowSignups !== undefined ? allowSignups : true,
        participantsPerSignup: participantsPerSignup || 1,
        featuredImage: featuredImage || null,
        galleryImages: galleryImages || null,
        updatedAt: new Date(),
      })
      .where(eq(event.id, id))
      .returning();

    if (updatedEvent.length === 0) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    revalidateTag('events');
    revalidateTag('event-detail');
    revalidateTag('schedule');
    revalidatePath(`/events/${updatedEvent[0].id}`);

    // Handle schedule addition/removal if requested
    console.log('API received addToSchedule:', addToSchedule); // Debug log
    if (addToSchedule !== undefined) {
      try {
        if (addToSchedule) {
          console.log('Adding event to schedule:', updatedEvent[0].id); // Debug log
          
          try {
            // Check if already in schedule
            const existingSchedule = await db.select().from(schedule).where(eq(schedule.eventId, updatedEvent[0].id));
            console.log('Existing schedule items:', existingSchedule); // Debug log
            
            if (existingSchedule.length === 0) {
              // Get the highest order number
              const maxOrder = await db.select().from(schedule).orderBy(desc(schedule.order)).limit(1);
              const nextOrder = maxOrder.length > 0 ? maxOrder[0].order + 1 : 0;
              console.log('Next order number:', nextOrder); // Debug log

              // Add to schedule
              const newScheduleItem = await db.insert(schedule).values({
                id: uuidv4(),
                eventId: updatedEvent[0].id,
                order: nextOrder,
                createdAt: new Date(),
                updatedAt: new Date(),
              }).returning();
              
              console.log('Successfully added to schedule:', newScheduleItem); // Debug log
            } else {
              console.log('Event already in schedule, skipping'); // Debug log
            }
          } catch (dbError) {
            console.error('Database error adding to schedule:', dbError); // Debug log
          }
        } else {
          console.log('Removing event from schedule:', updatedEvent[0].id); // Debug log
          // Remove from schedule
          await db.delete(schedule).where(eq(schedule.eventId, updatedEvent[0].id));
        }
      } catch (error) {
        console.error('Error updating schedule:', error);
      }
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

    revalidateTag('events');
    revalidateTag('event-detail');

    return NextResponse.json({ 
      success: true, 
      message: "Event deleted successfully" 
    });
  } catch (error) {
    console.error("Error deleting event:", error);
    return NextResponse.json({ error: "Failed to delete event" }, { status: 500 });
  }
}
