// app/api/sections/route.ts
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { eq } from "drizzle-orm";
import { section } from "@/db/schema";
import { db } from "@/db";
import { auth } from "@/lib/auth";

// GET - Fetch all sections (public access)
export async function GET() {
  try {
    // Fetch sections ordered by the order field (default ascending)
    const sections = await db.select().from(section).orderBy(section.order);
    return NextResponse.json(sections);
  } catch (error) {
    console.error("Error fetching sections:", error);
    return NextResponse.json({ error: "Failed to fetch sections" }, { status: 500 });
  }
}

// POST - Create a new section (admin only)
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
    const { title, description, order } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const newSection = await db.insert(section).values({
      id: uuidv4(),
      title,
      description,
      order: order || 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdById: userId, // Use the userId from the session
    }).returning();

    return NextResponse.json(newSection[0], { status: 201 });
  } catch (error) {
    console.error("Error creating section:", error);
    return NextResponse.json({ error: "Failed to create section" }, { status: 500 });
  }
}

// PUT - Update an existing section (admin only)
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
    const { id, title, description, order } = body;

    if (!id || !title) {
      return NextResponse.json({ error: "ID and title are required" }, { status: 400 });
    }

    const updatedSection = await db.update(section)
      .set({
        title,
        description,
        order: order !== undefined ? order : 0,
        updatedAt: new Date(),
      })
      .where(eq(section.id, id))
      .returning();

    if (updatedSection.length === 0) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 });
    }

    return NextResponse.json(updatedSection[0]);
  } catch (error) {
    console.error("Error updating section:", error);
    return NextResponse.json({ error: "Failed to update section" }, { status: 500 });
  }
}

// DELETE - Remove a section (admin only)
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

    // Check if section exists before deleting
    const existingSection = await db.select().from(section).where(eq(section.id, id));
    
    if (existingSection.length === 0) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 });
    }

    await db.delete(section).where(eq(section.id, id));
    return NextResponse.json({ success: true, message: "Section deleted successfully" });
  } catch (error) {
    console.error("Error deleting section:", error);
    return NextResponse.json({ error: "Failed to delete section" }, { status: 500 });
  }
}
