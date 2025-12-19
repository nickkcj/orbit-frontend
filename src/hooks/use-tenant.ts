"use client"

import { useQuery } from "@tanstack/react-query"
import { tenantsApi } from "@/lib/api"
import { Tenant } from "@/providers/tenant-provider"

export function useTenantBySlug(slug: string | null) {
  const {
    data: tenant,
    isLoading,
    error,
    refetch,
  } = useQuery<Tenant>({
    queryKey: ["tenant", slug],
    queryFn: () => tenantsApi.getBySlug(slug!),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  })

  return {
    tenant: tenant || null,
    isLoading,
    error: error as Error | null,
    refetch,
  }
}
