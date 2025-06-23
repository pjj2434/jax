// app/api/uploadthing/route.ts
import { createRouteHandler } from "uploadthing/next";
import { uploadRouter } from "@/lib/uploadthing";
 
// Export routes for Next App Router
export const { GET, POST } = createRouteHandler({
  router: uploadRouter,
});
