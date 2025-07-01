// app/blank-layout.tsx
import React from "react";
import { Toaster } from "sonner";

export default function BlankLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white">
      {children}
      <Toaster position="top-center" />
    </div>
  );
}
