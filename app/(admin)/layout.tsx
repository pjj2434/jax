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

  // Mobile sidebar toggle state (client only)
  // This will be a no-op on the server, but will work on the client
  // You may want to move this to a client component if you want full interactivity
  // For now, we just add responsive classes

  return (
    <div className="flex h-screen overflow-hidden flex-col sm:flex-row">
      <SidebarProvider>
        {/* Sidebar: hidden on mobile, visible on sm+ */}
        <div className="sm:flex-shrink-0 hidden sm:block">
          <AppSidebar />
        </div>
        {/* Mobile sidebar trigger (optional) */}
        <div className="sm:hidden flex items-center justify-between p-2 bg-background border-b">
          {/* You can add a sidebar open button here if you want a drawer */}
        </div>
        <div className="flex-1 overflow-auto max-w-full">
          <SidebarInset>
            {children}
          </SidebarInset>
        </div>
        <Toaster />
      </SidebarProvider>
    </div>
  );
}