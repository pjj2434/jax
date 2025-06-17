// app/blank-layout.tsx
import { Navbar } from "@/components/nav";
import React from "react";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-black">
<Navbar/>
      {children}
    </div>
  );
}
