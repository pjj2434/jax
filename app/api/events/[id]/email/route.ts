import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { signup, event } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { sendBulkEmail } from "@/lib/email";

// POST - Send bulk email to all participants of an event (admin only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const data = await auth.api.getSession({
      headers: request.headers
    });
    
    if (!data || !data.session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: eventId } = await params;
    const body = await request.json();
    const { subject, message } = body;

    if (!eventId) {
      return NextResponse.json({ error: "Event ID is required" }, { status: 400 });
    }

    if (!subject || !message) {
      return NextResponse.json({ error: "Subject and message are required" }, { status: 400 });
    }

    // Get event details
    const eventData = await db.select().from(event).where(eq(event.id, eventId));
    
    if (eventData.length === 0) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Get all signups for this event
    const signups = await db.select().from(signup).where(eq(signup.eventId, eventId));

    if (signups.length === 0) {
      return NextResponse.json({ error: "No participants found for this event" }, { status: 400 });
    }

    // Collect all participant emails
    const participantEmails: string[] = [];

    for (const signupRecord of signups) {
      // Add primary participant email
      if (signupRecord.email) {
        participantEmails.push(signupRecord.email);
      }

      // Add additional participants' emails
      if (signupRecord.additionalParticipants) {
        try {
          const additionalParticipants = typeof signupRecord.additionalParticipants === 'string' 
            ? JSON.parse(signupRecord.additionalParticipants) 
            : signupRecord.additionalParticipants;
            
          for (const participant of additionalParticipants) {
            if (participant.email) {
              participantEmails.push(participant.email);
            }
          }
        } catch (e) {
          console.error("Error parsing additional participants:", e);
        }
      }
    }

    // Remove duplicates
    const uniqueEmails = [...new Set(participantEmails)];

    if (uniqueEmails.length === 0) {
      return NextResponse.json({ error: "No valid email addresses found" }, { status: 400 });
    }

    // Send bulk email
    await sendBulkEmail(
      uniqueEmails,
      subject,
      message,
      eventData[0].title
    );

    return NextResponse.json({ 
      success: true, 
      message: `Email sent to ${uniqueEmails.length} participants`,
      recipientCount: uniqueEmails.length
    });
  } catch (error) {
    console.error("Error sending bulk email:", error);
    return NextResponse.json({ error: "Failed to send bulk email" }, { status: 500 });
  }
} 