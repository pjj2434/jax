import { NextResponse } from 'next/server';
import { db } from '@/db';
import { messageBanner } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const banners = await db.select().from(messageBanner).limit(1);
    
    if (banners.length === 0) {
      return NextResponse.json({ 
        message: "Welcome to First Impressions Resume Writing!",
        isActive: false,
        backgroundColor: "#3B82F6",
        textColor: "#FFFFFF",
        showCloseButton: true,
      });
    }
    
    return NextResponse.json({
      message: banners[0].message,
      isActive: banners[0].isActive,
      backgroundColor: banners[0].backgroundColor,
      textColor: banners[0].textColor,
      showCloseButton: banners[0].showCloseButton,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch banner data' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();
    
    const existingBanners = await db.select({ id: messageBanner.id }).from(messageBanner).limit(1);
    
    const bannerData = {
      message: data.message,
      isActive: data.isActive,
      backgroundColor: data.backgroundColor,
      textColor: data.textColor,
      showCloseButton: data.showCloseButton,
      updatedAt: new Date(),
    };

    if (existingBanners.length === 0) {
      await db.insert(messageBanner).values({
        id: nanoid(),
        ...bannerData,
      });
    } else {
      await db.update(messageBanner)
        .set(bannerData)
        .where(eq(messageBanner.id, existingBanners[0].id));
    }
    
    // Revalidate all paths to ensure immediate update
    revalidatePath('/', 'layout');
    revalidatePath('/admin/banner', 'page');
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update banner data' }, { status: 500 });
  }
} 