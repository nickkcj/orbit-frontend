import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { QueryProvider } from "@/providers/query-provider"
import { TenantProvider } from "@/providers/tenant-provider"
import { getTenantFromHeaders } from "@/lib/tenant"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Orbit",
  description: "Community platform",
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Get tenant from headers (set by middleware)
  const tenantInfo = await getTenantFromHeaders()

  return (
    <html lang="pt-BR" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <QueryProvider>
          <TenantProvider
            slug={tenantInfo?.slug}
            initialTenant={
              tenantInfo
                ? {
                    id: tenantInfo.id,
                    slug: tenantInfo.slug,
                    name: tenantInfo.name,
                    description: null,
                    logo_url: null,
                    settings: null,
                    status: "active",
                  }
                : null
            }
          >
            {children}
          </TenantProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
