// app/api/uploadthing/route.ts
import { createRouteHandler } from "uploadthing/next";
import { uploadRouter } from "@/lib/uploadthing";
 
console.log("UploadThing API route loaded");
console.log("UPLOADTHING_APP_ID:", process.env.UPLOADTHING_APP_ID ? "Set" : "Not set");
console.log("UPLOADTHING_SECRET:", process.env.UPLOADTHING_SECRET ? "Set" : "Not set");
console.log("UPLOADTHING_TOKEN:", process.env.UPLOADTHING_TOKEN ? "Set" : "Not set");

// Export routes for Next App Router
export const { GET, POST } = createRouteHandler({
  router: uploadRouter,
  config: {
    uploadthingId: process.env.UPLOADTHING_APP_ID,
    uploadthingSecret: process.env.UPLOADTHING_SECRET,
  },
});
