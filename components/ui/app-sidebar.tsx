"use client"

import {  MessageSquare, CalendarDays, TableOfContents, Users } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { NavUser } from "./nev-user"

// Menu items
const items = [
  {
   title: "Sections",
   url: "/sections",
   icon: TableOfContents  ,
 },
  {
    title: "Events",
    url: "/events",
    icon: CalendarDays ,
  },
  {
    title: "Signups",
    url: "/signups",
    icon: Users  ,
  },
  
  {
    title: "Banner",
    url: "/banner",
    icon: MessageSquare  ,
  }

]

export function AppSidebar() {
  const path = usePathname()

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild
                    isActive={path.includes(item.url)}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
        <NavUser/>
    </Sidebar>
  )
}
