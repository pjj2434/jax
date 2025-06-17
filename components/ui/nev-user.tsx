"use client"

import { BadgeCheck,  ChevronsUpDown, LogOut,  } from "lucide-react"
// Bell,CreditCard,Sparkles 
import { Avatar, AvatarFallback  } from "@/components/ui/avatar"
// AvatarImage
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar"
import { authClient, useSession } from "@/lib/auth-client"
import { useRouter } from "next/navigation";
import { useState } from "react"
//   const sessionData = useSession();

export function NavUser() {
    // Access session data
    const { data: sessionData } = useSession()
    const { isMobile } = useSidebar()
    const router = useRouter()
    const [pending, setPending] = useState(false)
  
    const handleSignOut = async () => {
      try {
        setPending(true)
        await authClient.signOut({
          fetchOptions: {
            onSuccess: () => {
              router.push("/")
              router.refresh()
            },
          },
        })
      } catch (error) {
        console.error("Error signing out:", error)
      } finally {
        setPending(false)
      }
    }
    const handleAccount = async () => {
        try {
          setPending(true)
          
          // Just perform the navigation (signing out logic will be handled elsewhere if necessary)
          router.push("/vendors")
          router.refresh()  // Refresh the page if needed
          
        } catch (error) {
          console.error("Error during navigation:", error)
        } finally {
          setPending(false)
        }
      }
      
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              {/* <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg">CN</AvatarFallback>
              </Avatar> */}
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{sessionData?.user.name|| 'Guest'}</span>
                <span className="truncate text-xs">{sessionData?.user.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  {/* <AvatarImage src={user.avatar} alt={user.name} /> */}
                  <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  {/* <span className="truncate font-semibold">{user.name}</span>
                  <span className="truncate text-xs">{user.email}</span> */}
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
             
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={handleAccount} disabled={pending}>
                <BadgeCheck />
                Account
              </DropdownMenuItem>
              
              
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} disabled={pending}>
              <LogOut />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
// pending={pending} onClick={handleSignOut}
