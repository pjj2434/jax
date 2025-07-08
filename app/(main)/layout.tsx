// app/blank-layout.tsx
import React from "react";
import { Toaster } from "sonner";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-black">
      <Toaster/>
      {children}
    </div>
  );
}
