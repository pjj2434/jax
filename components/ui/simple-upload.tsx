"use client";

import { useState } from "react";
import { UploadButton } from "@/lib/uploadthing-client";
import { Loader2 } from "lucide-react";

interface SimpleUploadProps {
  endpoint: "eventImage" | "galleryImages";
  onClientUploadComplete?: (res: any) => void;
  onUploadError?: (error: Error) => void;
}

export function SimpleUpload({
  endpoint,
  onClientUploadComplete,
  onUploadError,
}: SimpleUploadProps) {
  const [isUploading, setIsUploading] = useState(false);

  return (
    <div className="w-full">
      <UploadButton
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
        className="ut-button:bg-primary ut-button:text-white ut-button:hover:bg-primary/90"
        content={{
          button: "Choose Image",
          allowedContent: "Images up to 10MB",
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