// lib/uploadthing.ts
import { createUploadthing, type FileRouter } from "uploadthing/next";
 
const f = createUploadthing();
 
export const uploadRouter = {
  // Define file routes
  eventImage: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async () => {
      // Verify authentication here if needed
      return { userId: "admin" };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { url: file.url };
    }),
    
  galleryImages: f({ image: { maxFileSize: "4MB", maxFileCount: 10 } })
    .middleware(async () => {
      return { userId: "admin" };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { url: file.url };
    }),
} satisfies FileRouter;
 
export type OurFileRouter = typeof uploadRouter;
