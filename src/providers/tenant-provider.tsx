"use client"

import { createContext, useContext, ReactNode } from "react"
import { useQuery } from "@tanstack/react-query"
import { tenantsApi } from "@/lib/api"

export interface ThemeSettings {
  primaryColor?: string
  accentColor?: string
  bannerUrl?: string
}

export interface TenantSettings {
  theme?: ThemeSettings
}

export interface Tenant {
  id: string
  slug: string
  name: string
  description: string | null
  logo_url: string | null
  settings: TenantSettings | null
  status: string
}

interface TenantContextType {
  tenant: Tenant | null
  isLoading: boolean
  error: Error | null
}

const TenantContext = createContext<TenantContextType>({
  tenant: null,
  isLoading: false,
  error: null,
})

interface TenantProviderProps {
  children: ReactNode
  initialTenant?: Tenant | null
  slug?: string | null
}

export function TenantProvider({
  children,
  initialTenant = null,
  slug = null,
}: TenantProviderProps) {
  const {
    data: tenant,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["tenant", slug],
    queryFn: () => (slug ? tenantsApi.getBySlug(slug) : null),
    enabled: !!slug && !initialTenant,
    initialData: initialTenant,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  return (
    <TenantContext.Provider
      value={{
        tenant: tenant || initialTenant,
        isLoading,
        error: error as Error | null,
      }}
    >
      {children}
    </TenantContext.Provider>
  )
}

export function useTenant() {
  const context = useContext(TenantContext)
  if (context === undefined) {
    throw new Error("useTenant must be used within a TenantProvider")
  }
  return context
}
