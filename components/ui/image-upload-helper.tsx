"use client";

import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { isSupportedImageFormat, getFileSizeInMB, isValidImageSize } from "@/lib/image-utils";
import { AlertCircle, CheckCircle } from "lucide-react";

interface ImageUploadHelperProps {
  file: File | null;
  maxSizeMB?: number;
}

export function ImageUploadHelper({ file, maxSizeMB = 8 }: ImageUploadHelperProps) {
  if (!file) return null;

  // Validate file
  const formatValid = isSupportedImageFormat(file.name);
  const sizeValid = isValidImageSize(file.size);
  const fileSizeMB = getFileSizeInMB(file.size);

  if (formatValid && sizeValid) {
    return (
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          ✓ {file.name} ({fileSizeMB}MB) - Ready to upload
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="border-red-200 bg-red-50">
      <AlertCircle className="h-4 w-4 text-red-600" />
      <AlertDescription className="text-red-800">
        {!formatValid && `❌ Unsupported format. Please use PNG, JPG, HEIC, or WebP.`}
        {!sizeValid && `❌ File too large (${fileSizeMB}MB). Maximum size is ${maxSizeMB}MB.`}
      </AlertDescription>
    </Alert>
  );
}

// Helper text for upload components
export const uploadHelperText = {
  supportedFormats: "Supported formats: PNG, JPG, JPEG, HEIC, HEIF, WebP",
  maxSize: "Maximum file size: 8MB",
  recommended: "Recommended: WebP format for best compression",
}; 