// components/ui/upload-button.tsx
"use client";

import { useState } from "react";
import { UploadDropzone } from "@/lib/uploadthing-client";
import { Loader2 } from "lucide-react";

interface UploadButtonProps {
  endpoint: "eventImage" | "galleryImages";
  onClientUploadComplete?: (res: any) => void;
  onUploadError?: (error: Error) => void;
}

export function UploadButton({
  endpoint,
  onClientUploadComplete,
  onUploadError,
}: UploadButtonProps) {
  const [isUploading, setIsUploading] = useState(false);

  return (
    <div className="w-full">
      <UploadDropzone
        endpoint={endpoint}
        onClientUploadComplete={(res) => {
          console.log("Upload completed:", res);
          setIsUploading(false);
          if (onClientUploadComplete) onClientUploadComplete(res);
        }}
        onUploadError={(error: Error) => {
          console.error("Upload error:", error);
          setIsUploading(false);
          if (onUploadError) onUploadError(error);
        }}
        onUploadBegin={() => {
          console.log("Upload beginning for endpoint:", endpoint);
          setIsUploading(true);
        }}
        onUploadProgress={(progress) => {
          console.log("Upload progress:", progress);
        }}
        className="border-dashed border-2 border-gray-300 rounded-lg p-6 ut-label:text-lg ut-allowed-content:text-sm ut-button:bg-primary ut-button:text-white ut-button:hover:bg-primary/90 ut-upload-icon:text-primary"
        content={{
          allowedContent: "Images up to 10MB",
          label: "Drop images here or click to browse",
        }}
        config={{
          mode: "auto",
        }}
      />
      
      {isUploading && (
        <div className="flex justify-center mt-2">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="ml-2 text-sm text-gray-500">Uploading...</span>
        </div>
      )}
    </div>
  );
}
