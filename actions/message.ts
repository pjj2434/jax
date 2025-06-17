'use server'

import { db } from '@/db';
import { messageBanner } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { revalidatePath } from 'next/cache';

export type MessageBannerData = {
  message: string;
  isActive: boolean;
  backgroundColor: string;
  textColor: string;
  showCloseButton: boolean;
};

export async function getBannerData(): Promise<MessageBannerData | null> {
  try {
    const banners = await db.select().from(messageBanner).limit(1);
    
    if (banners.length === 0) {
      // Create a default banner if none exists
      const defaultBanner = {
        id: nanoid(),
        message: "Welcome to First Jax",
        isActive: false,
        backgroundColor: "#3B82F6",
        textColor: "#FFFFFF",
        showCloseButton: true,
        updatedAt: new Date(),
      };
      
      await db.insert(messageBanner).values(defaultBanner);
      
      return {
        message: defaultBanner.message,
        isActive: defaultBanner.isActive,
        backgroundColor: defaultBanner.backgroundColor,
        textColor: defaultBanner.textColor,
        showCloseButton: defaultBanner.showCloseButton,
      };
    }
    
    return {
      message: banners[0].message,
      isActive: banners[0].isActive,
      backgroundColor: banners[0].backgroundColor,
      textColor: banners[0].textColor,
      showCloseButton: banners[0].showCloseButton,
    };
  } catch (error) {
    console.error('Error fetching banner data:', error);
    return null;
  }
}

export async function updateBannerData(data: MessageBannerData): Promise<{ success: boolean; message?: string }> {
  try {
    // Check if a banner record exists
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
      // Create new banner record
      await db.insert(messageBanner).values({
        id: nanoid(),
        ...bannerData,
      });
    } else {
      // Update existing banner record
      await db.update(messageBanner)
        .set(bannerData)
        .where(eq(messageBanner.id, existingBanners[0].id));
    }
    
    // Revalidate all paths to ensure immediate update
    revalidatePath('/', 'layout');
    revalidatePath('/admin/banner', 'page');
    
    return { success: true };
  } catch (error) {
    console.error('Error updating banner data:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'An unknown error occurred'
    };
  }
}
