// components/ui/upload-button.tsx
"use client";

import { useState } from "react";
import { UploadDropzone } from "@uploadthing/react";
import { OurFileRouter } from "@/lib/uploadthing";
import { Loader2 } from "lucide-react";

interface UploadButtonProps {
  endpoint: keyof OurFileRouter;
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
      {/* Add the generic type parameter <OurFileRouter, any> */}
      <UploadDropzone<OurFileRouter, any>
        endpoint={endpoint}
        onClientUploadComplete={(res) => {
          setIsUploading(false);
          if (onClientUploadComplete) onClientUploadComplete(res);
        }}
        onUploadError={(error: Error) => {
          setIsUploading(false);
          if (onUploadError) onUploadError(error);
        }}
        onUploadBegin={() => {
          setIsUploading(true);
        }}
        className="border-dashed border-2 border-gray-300 rounded-lg p-4 ut-label:text-sm ut-allowed-content:text-xs"
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
