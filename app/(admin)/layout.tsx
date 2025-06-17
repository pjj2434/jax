// app/dashboard/layout.tsx


import { AppSidebar } from "@/components/ui/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Toaster } from "sonner";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const data = await auth.api.getSession({
    headers: await headers()
  });
    
  // Redirect to login if not authenticated
  if (!data || !data.session) {
    // Redirect to the login page
    redirect("/login");
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <SidebarProvider>
        <div className="flex-shrink-0">
          <AppSidebar />
        </div>
        
        <div className="flex-1 overflow-auto">
          <SidebarInset>
            {children}
          </SidebarInset>
        </div>
        
        <Toaster />
      </SidebarProvider>
    </div>
  );
}