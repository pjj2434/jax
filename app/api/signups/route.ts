// app/api/signups/route.ts
import { NextRequest, NextResponse } from "next/server";
import { signup, event } from "@/db/schema";
import { v4 as uuidv4 } from "uuid";
import { eq, count } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { revalidatePath } from 'next/cache';
import { sendSignupConfirmation } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";

// GET - Fetch signups (admin only)
export async function GET(request: NextRequest) {
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
    const eventId = url.searchParams.get("eventId");
    
    let signups;
    
    // Filter by event if provided
    if (eventId) {
      signups = await db.select().from(signup).where(eq(signup.eventId, eventId));
    } else {
      signups = await db.select().from(signup);
    }
    
    // Sort by creation date
    signups.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    
    return NextResponse.json(signups, {
      headers: {
        'Cache-Control': 's-maxage=31536000, stale-while-revalidate'
      }
    });
  } catch (error) {
    console.error("Error fetching signups:", error);
    return NextResponse.json({ error: "Failed to fetch signups" }, { status: 500 });
  }
}

// app/api/signups/route.ts - Updated POST method
export async function POST(request: NextRequest) {
  try {
    // Rate limiting for signups
    const clientIP = request.headers.get('x-forwarded-for') || request.ip || 'unknown';
    if (!rateLimit(`signup:${clientIP}`, 5, 300000)) { // 5 signups per 5 minutes per IP
      return NextResponse.json({ 
        error: "Too many signup attempts. Please try again later." 
      }, { status: 429 });
    }

    const body = await request.json();
    const { name, email, phone, eventId, notes, additionalParticipants } = body;

    // Validate required fields
    if (!name || !email || !phone || !eventId) {
      return NextResponse.json({ 
        error: "Name, email, phone, and eventId are required" 
      }, { status: 400 });
    }

    // Check if event exists and is active
    const eventData = await db.select().from(event).where(eq(event.id, eventId));
    
    if (eventData.length === 0) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    
    if (!eventData[0].isActive) {
      return NextResponse.json({ error: "Event is not active" }, { status: 400 });
    }
    
    // Check if event allows signups
    if (!eventData[0].allowSignups) {
      return NextResponse.json({ error: "This event is not accepting signups" }, { status: 400 });
    }
    
    // Check capacity only if showCapacity is true and maxAttendees is set
    if (eventData[0].showCapacity && eventData[0].maxAttendees) {
      const attendeeCount = await db
        .select({ count: count() })
        .from(signup)
        .where(eq(signup.eventId, eventId));
      
      // Calculate total participants including additional ones
      let additionalCount = 0;
      if (additionalParticipants) {
        try {
          const parsedParticipants = typeof additionalParticipants === 'string' 
            ? JSON.parse(additionalParticipants) 
            : additionalParticipants;
            
          // Count only participants with at least a name
          additionalCount = parsedParticipants.filter((p: any) => p.name?.trim()).length;
        } catch (e) {
          console.error("Error parsing additional participants:", e);
        }
      }
      
      const totalParticipants = attendeeCount[0].count + 1 + additionalCount;
      
      if (totalParticipants > eventData[0].maxAttendees) {
        return NextResponse.json({ error: "Event is full" }, { status: 400 });
      }
    }

    // Create the signup
    const newSignup = await db.insert(signup).values({
      id: uuidv4(),
      name,
      email,
      phone,
      eventId,
      notes: notes || null,
      status: "registered",
      createdAt: new Date(),
      updatedAt: new Date(),
      additionalParticipants: additionalParticipants || null,
    }).returning();

    // Send confirmation emails
    try {
      // Send email to primary participant
      await sendSignupConfirmation(
        email,
        name,
        eventData[0].title,
        eventData[0].eventDate,
        eventData[0].location
      );

      // Send emails to additional participants
      if (additionalParticipants) {
        try {
          const parsedParticipants = typeof additionalParticipants === 'string' 
            ? JSON.parse(additionalParticipants) 
            : additionalParticipants;
            
          for (const participant of parsedParticipants) {
            if (participant.email && participant.name) {
              await sendSignupConfirmation(
                participant.email,
                participant.name,
                eventData[0].title,
                eventData[0].eventDate,
                eventData[0].location
              );
            }
          }
        } catch (e) {
          console.error("Error sending emails to additional participants:", e);
        }
      }
    } catch (emailError) {
      console.error("Error sending confirmation emails:", emailError);
      // Don't fail the signup if email fails
    }

    revalidatePath('/');
    revalidatePath('/admin/signups');
    revalidatePath('/admin/events');

    return NextResponse.json(newSignup[0], { status: 201 });
  } catch (error) {
    console.error("Error creating signup:", error);
    return NextResponse.json({ error: "Failed to create signup" }, { status: 500 });
  }
}


// PUT - Update a signup status (admin only)
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
    const { id, status, notes } = body;

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const updatedSignup = await db.update(signup)
      .set({
        status: status || "registered",
        notes,
        updatedAt: new Date(),
      })
      .where(eq(signup.id, id))
      .returning();

    if (updatedSignup.length === 0) {
      return NextResponse.json({ error: "Signup not found" }, { status: 404 });
    }

    revalidatePath('/');
    revalidatePath('/admin/signups');
    revalidatePath('/admin/events');

    return NextResponse.json(updatedSignup[0]);
  } catch (error) {
    console.error("Error updating signup:", error);
    return NextResponse.json({ error: "Failed to update signup" }, { status: 500 });
  }
}

// DELETE - Remove a signup (admin only)
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

    await db.delete(signup).where(eq(signup.id, id));

    revalidatePath('/');
    revalidatePath('/admin/signups');
    revalidatePath('/admin/events');

    return NextResponse.json({ 
      success: true, 
      message: "Signup deleted successfully" 
    });
  } catch (error) {
    console.error("Error deleting signup:", error);
    return NextResponse.json({ error: "Failed to delete signup" }, { status: 500 });
  }
}
