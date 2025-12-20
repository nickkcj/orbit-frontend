"use client"

import { ReactNode } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { TenantProvider, Tenant, useTenant } from "@/providers/tenant-provider"
import { ThemeProvider } from "@/providers/theme-provider"
import { useAuth } from "@/hooks/use-auth"
import { NotificationBell } from "./notification-bell"
import { Settings } from "lucide-react"

interface CommunityLayoutClientProps {
  children: ReactNode
  tenant: Tenant
}

function CommunityHeader() {
  const { tenant } = useTenant()
  const { user } = useAuth()

  if (!tenant) return null

  const bannerUrl = tenant.settings?.theme?.bannerUrl
  const logoUrl = tenant.logo_url

  return (
    <>
      {/* Banner */}
      {bannerUrl && (
        <div
          className="w-full h-48 bg-cover bg-center"
          style={{ backgroundImage: `url(${bannerUrl})` }}
        >
          <div className="w-full h-full bg-gradient-to-b from-transparent to-background/80" />
        </div>
      )}

      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={tenant.name}
                className="w-9 h-9 rounded-lg object-cover"
              />
            ) : (
              <Image
                src="/images/orbit_logo.png"
                alt={tenant.name}
                width={36}
                height={36}
              />
            )}
            <span className="font-semibold text-lg">{tenant.name}</span>
          </div>

          <nav className="flex items-center gap-4">
            <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
              Inicio
            </Link>
            <Link href="/posts" className="text-muted-foreground hover:text-foreground transition-colors">
              Posts
            </Link>
            <Link href="/members" className="text-muted-foreground hover:text-foreground transition-colors">
              Membros
            </Link>
            <Link href="/upload" className="text-muted-foreground hover:text-foreground transition-colors">
              Upload
            </Link>
            {user && (
              <>
                <NotificationBell />
                <Link href="/settings" className="text-muted-foreground hover:text-foreground transition-colors">
                  <Settings className="h-5 w-5" />
                </Link>
              </>
            )}
            {user ? (
              <Link href="/profile" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <span className="text-xs font-medium text-primary-foreground">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              </Link>
            ) : (
              <Link href="/login">
                <Button size="sm">Entrar</Button>
              </Link>
            )}
          </nav>
        </div>
      </header>
    </>
  )
}

export function CommunityLayoutClient({ children, tenant }: CommunityLayoutClientProps) {
  return (
    <TenantProvider initialTenant={tenant}>
      <ThemeProvider>
        <div className="min-h-screen bg-background">
          <CommunityHeader />
          <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
        </div>
      </ThemeProvider>
    </TenantProvider>
  )
}
