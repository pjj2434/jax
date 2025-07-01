// lib/uploadthing.ts
import { createUploadthing, type FileRouter } from "uploadthing/next";
 
const f = createUploadthing();

// Utility function to delete files from UploadThing (server-side)
export async function deleteUploadThingFile(fileUrl: string) {
  try {
    // Extract the file key from the URL
    const urlParts = fileUrl.split('/');
    const fileKey = urlParts[urlParts.length - 1];
    
    if (!fileKey) {
      console.error('Could not extract file key from URL:', fileUrl);
      return false;
    }

    console.log('Attempting to delete file with key:', fileKey);

    // Call UploadThing's delete API directly
    const response = await fetch(`https://uploadthing.com/api/deleteFiles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Uploadthing-Api-Key': process.env.UPLOADTHING_SECRET || '',
        'X-Uploadthing-App-Id': process.env.UPLOADTHING_APP_ID || '',
      },
      body: JSON.stringify({
        fileKeys: [fileKey],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to delete file from UploadThing:', response.status, errorText);
      return false;
    }

    const result = await response.json();
    console.log('Successfully deleted file from UploadThing:', fileKey, result);
    return true;
  } catch (error) {
    console.error('Error deleting file from UploadThing:', error);
    return false;
  }
}

// Utility function to delete multiple files (server-side)
export async function deleteUploadThingFiles(fileUrls: string[]) {
  const results = await Promise.allSettled(
    fileUrls.map(url => deleteUploadThingFile(url))
  );
  
  const successful = results.filter(
    result => result.status === 'fulfilled' && result.value === true
  ).length;
  
  console.log(`Deleted ${successful}/${fileUrls.length} files from UploadThing`);
  return successful;
}

// Client-side function to delete files (uses API route)
export async function deleteUploadThingFileClient(fileUrl: string) {
  try {
    console.log('Attempting to delete file (client):', fileUrl);

    const response = await fetch('/api/uploadthing/delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileUrls: [fileUrl],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Failed to delete file:', errorData);
      return false;
    }

    const result = await response.json();
    console.log('Delete result:', result);
    
    return result.summary.successful > 0;
  } catch (error) {
    console.error('Error deleting file from UploadThing:', error);
    return false;
  }
}
 
export const uploadRouter = {
  // Define file routes
  eventImage: f({ 
    image: { 
      maxFileSize: "8MB", 
      maxFileCount: 1,
      // Accept common image formats
      acceptedTypes: ["image/png", "image/jpeg", "image/jpg", "image/heic", "image/heif", "image/webp"]
    } 
  })
    .middleware(async () => {
      // Verify authentication here if needed
      return { userId: "admin" };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Event image upload complete:", file.url);
      return { url: file.url };
    }),
    
  galleryImages: f({ 
    image: { 
      maxFileSize: "8MB", 
      maxFileCount: 10,
      // Accept common image formats
      acceptedTypes: ["image/png", "image/jpeg", "image/jpg", "image/heic", "image/heif", "image/webp"]
    } 
  })
    .middleware(async () => {
      return { userId: "admin" };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Gallery image upload complete:", file.url);
      return { url: file.url };
    }),
} satisfies FileRouter;
 
export type OurFileRouter = typeof uploadRouter;
