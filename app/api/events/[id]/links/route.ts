// app/api/events/[id]/links/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { quickLink } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    // Fetch quick links for the event
    const links = await db
      .select()
      .from(quickLink)
      .where(eq(quickLink.eventId, id))
      .orderBy(quickLink.order);

    return NextResponse.json(links);
  } catch (error) {
    console.error("Error fetching quick links:", error);
    return NextResponse.json({ error: "Failed to fetch quick links" }, { status: 500 });
  }
}
