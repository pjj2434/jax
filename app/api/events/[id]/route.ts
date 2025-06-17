// app/api/events/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { event } from "@/db/schema";
import { eq } from "drizzle-orm";
import { db } from "@/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // In Next.js App Router, params is not a promise, so we don't need to await it
    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const eventData = await db.select().from(event).where(eq(event.id, id));
    
    if (eventData.length === 0) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json(eventData[0]);
  } catch (error) {
    console.error("Error fetching event:", error);
    return NextResponse.json({ error: "Failed to fetch event" }, { status: 500 });
  }
}
