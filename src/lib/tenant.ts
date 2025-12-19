import { headers } from "next/headers"

export interface TenantInfo {
  slug: string
  id: string
  name: string
}

/**
 * Get tenant info from request headers (set by middleware)
 * Use this in Server Components and Server Actions
 */
export async function getTenantFromHeaders(): Promise<TenantInfo | null> {
  const headersList = await headers()

  const slug = headersList.get("x-tenant-slug")
  const id = headersList.get("x-tenant-id")
  const name = headersList.get("x-tenant-name")

  if (!slug || !id) {
    return null
  }

  return { slug, id, name: name || slug }
}

/**
 * Check if current request is on a tenant subdomain
 */
export async function isTenantRequest(): Promise<boolean> {
  const tenant = await getTenantFromHeaders()
  return tenant !== null
}
