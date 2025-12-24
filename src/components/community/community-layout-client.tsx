"use client"

import { ReactNode } from "react"
import { TenantProvider, Tenant } from "@/providers/tenant-provider"
import { ThemeProvider } from "@/providers/theme-provider"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "./app-sidebar"
import { NotificationBell } from "./notification-bell"
import { Separator } from "@/components/ui/separator"

interface CommunityLayoutClientProps {
  children: ReactNode
  tenant: Tenant
}

export function CommunityLayoutClient({ children, tenant }: CommunityLayoutClientProps) {
  return (
    <TenantProvider initialTenant={tenant}>
      <ThemeProvider>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            {/* Top bar with trigger and notifications */}
            <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <div className="flex-1" />
              <NotificationBell />
            </header>

            <main className="flex-1 p-6">
              <div className="max-w-6xl mx-auto">{children}</div>
            </main>
          </SidebarInset>
        </SidebarProvider>
      </ThemeProvider>
    </TenantProvider>
  )
}
