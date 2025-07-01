import { generateUploadDropzone, generateUploadButton } from "@uploadthing/react";
import type { OurFileRouter } from "./uploadthing";

export const UploadDropzone = generateUploadDropzone<OurFileRouter>({
  url: "/api/uploadthing",
});

export const UploadButton = generateUploadButton<OurFileRouter>({
  url: "/api/uploadthing",
}); 