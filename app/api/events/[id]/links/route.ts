// app/api/events/[id]/links/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { quickLink } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { revalidateTag, unstable_cache } from 'next/cache';
import { v4 as uuidv4 } from "uuid";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    // Use unstable_cache for quick links fetch, scoped to this event ID
    const getQuickLinks = unstable_cache(
      async () => {
        return await db
          .select()
          .from(quickLink)
          .where(eq(quickLink.eventId, id))
          .orderBy(quickLink.order);
      },
      ['quick-links-fetch', id],
      { tags: [`quick-links-${id}`] }
    );

    const links = await getQuickLinks();
    return NextResponse.json(links);
  } catch (error) {
    console.error("Error fetching quick links:", error);
    return NextResponse.json({ error: "Failed to fetch quick links" }, { status: 500 });
  }
}

// POST - Create/Update quick links for an event
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

    const { id } = await params;
    const body = await request.json();
    const { quickLinks } = body;

    if (!id) {
      return NextResponse.json({ error: "Event ID is required" }, { status: 400 });
    }

    // Delete existing quick links for this event
    await db.delete(quickLink).where(eq(quickLink.eventId, id));

    // Insert new quick links
    if (quickLinks && Array.isArray(quickLinks) && quickLinks.length > 0) {
      const linksToInsert = quickLinks
        .filter((link: any) => link.title && link.url)
        .map((link: any, index: number) => ({
          id: uuidv4(),
          eventId: id,
          title: link.title,
          url: link.url,
          order: index,
          createdAt: new Date(),
        }));

      if (linksToInsert.length > 0) {
        await db.insert(quickLink).values(linksToInsert);
      }
    }

    revalidateTag('events');
    revalidateTag(`quick-links-${id}`);
    return NextResponse.json({ success: true, message: "Quick links updated successfully" });
  } catch (error) {
    console.error("Error updating quick links:", error);
    return NextResponse.json({ error: "Failed to update quick links" }, { status: 500 });
  }
}
