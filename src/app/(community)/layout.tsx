import { getTenantFromHeaders } from "@/lib/tenant"
import { redirect } from "next/navigation"
import { CommunityLayoutClient } from "@/components/community/community-layout-client"
import { Tenant } from "@/providers/tenant-provider"

export default async function CommunityLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const tenant = await getTenantFromHeaders()

  // If no tenant, redirect to main domain
  // This shouldn't happen if middleware is working correctly
  if (!tenant) {
    redirect("https://orbit.app.br")
  }

  return <CommunityLayoutClient tenant={tenant as Tenant}>{children}</CommunityLayoutClient>
}
