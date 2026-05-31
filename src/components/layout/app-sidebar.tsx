"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  FileText,
  Truck,
  Users,
  LogOut,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { signOut } from "next-auth/react"
import type { Role } from "@/generated/prisma/enums"

const adminNavItems = [
  { title: "แดชบอร์ด", url: "/dashboard", icon: LayoutDashboard },
  { title: "บิลขนส่ง", url: "/bills", icon: FileText },
  { title: "รถขนส่ง", url: "/vehicles", icon: Truck },
  { title: "พนักงาน", url: "/drivers", icon: Users },
]

const driverNavItems = [
  { title: "แดชบอร์ด", url: "/dashboard", icon: LayoutDashboard },
  { title: "บิลของฉัน", url: "/bills", icon: FileText },
]

interface AppSidebarProps {
  user: {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
    role: Role
  }
}

export function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname()
  const navItems = user.role === "ADMIN" ? adminNavItems : driverNavItems

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <span className="text-sm font-semibold">JG Logistics</span>
            <span className="text-xs text-muted-foreground">จตุรโชคกรุ๊ป</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>เมนู</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton render={<Link href={item.url} />} isActive={pathname === item.url}>
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.image ?? undefined} />
            <AvatarFallback>{user.name?.[0] ?? "U"}</AvatarFallback>
          </Avatar>
          <div className="flex flex-1 flex-col overflow-hidden">
            <span className="truncate text-sm font-medium">{user.name}</span>
            <span className="truncate text-xs text-muted-foreground">
              {user.role === "ADMIN" ? "ผู้ดูแลระบบ" : "พนักงานขนส่ง"}
            </span>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
