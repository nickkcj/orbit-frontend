"use client"

import {
  Home,
  FileText,
  Users,
  Upload,
  BarChart3,
  Settings,
  GraduationCap,
  BookOpen,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useTenant } from "@/providers/tenant-provider"
import { useAuth } from "@/hooks/use-auth"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { UserDropdown } from "./user-dropdown"

const navItems = [
  { title: "Inicio", url: "/", icon: Home },
  { title: "Posts", url: "/posts", icon: FileText },
  { title: "Cursos", url: "/courses", icon: GraduationCap },
  { title: "Membros", url: "/members", icon: Users },
  { title: "Upload", url: "/upload", icon: Upload },
]

const adminItems = [
  { title: "Dashboard", url: "/dashboard", icon: BarChart3 },
  { title: "Studio", url: "/studio/courses", icon: BookOpen },
  { title: "Configuracoes", url: "/settings", icon: Settings },
]

export function AppSidebar() {
  const { tenant } = useTenant()
  const { user } = useAuth()
  const pathname = usePathname()

  const isActive = (url: string) => {
    if (url === "/") {
      return pathname === "/" || pathname === ""
    }
    return pathname.startsWith(url)
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  {tenant?.logo_url ? (
                    <img
                      src={tenant.logo_url}
                      alt={tenant.name}
                      className="size-6 rounded object-cover"
                    />
                  ) : (
                    <Image
                      src="/images/orbit_logo.png"
                      alt="Orbit"
                      width={24}
                      height={24}
                      className="rounded"
                    />
                  )}
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {tenant?.name || "Orbit"}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    Comunidade
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegacao</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                  >
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {user && (
          <SidebarGroup>
            <SidebarGroupLabel>Administracao</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.url)}
                      tooltip={item.title}
                    >
                      <Link href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        {user && <UserDropdown user={user} />}
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
