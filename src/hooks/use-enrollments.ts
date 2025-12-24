"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useTenant } from "@/providers/tenant-provider"
import { createTenantApi } from "@/lib/api"

// ============================================================================
// ENROLLMENT HOOKS
// ============================================================================

// Get enrollment status for a course
export function useEnrollmentStatus(courseId: string) {
  const { tenant } = useTenant()
  const api = tenant ? createTenantApi(tenant.slug) : null

  return useQuery({
    queryKey: ["enrollment", courseId],
    queryFn: () => api!.enrollments.getStatus(courseId),
    enabled: !!api && !!courseId,
  })
}

// List my enrollments
export function useMyEnrollments(limit = 20, offset = 0) {
  const { tenant } = useTenant()
  const api = tenant ? createTenantApi(tenant.slug) : null

  return useQuery({
    queryKey: ["enrollments", "my", limit, offset],
    queryFn: () => api!.enrollments.list(limit, offset),
    enabled: !!api,
  })
}

// Get continue learning courses
export function useContinueLearning(limit = 5) {
  const { tenant } = useTenant()
  const api = tenant ? createTenantApi(tenant.slug) : null

  return useQuery({
    queryKey: ["enrollments", "continue", limit],
    queryFn: () => api!.enrollments.getContinueLearning(limit),
    enabled: !!api,
  })
}

// Get course progress with full details
export function useCourseProgress(courseId: string) {
  const { tenant } = useTenant()
  const api = tenant ? createTenantApi(tenant.slug) : null

  return useQuery({
    queryKey: ["course", courseId, "progress"],
    queryFn: () => api!.enrollments.getProgress(courseId),
    enabled: !!api && !!courseId,
  })
}

// Enroll in a course
export function useEnrollInCourse() {
  const { tenant } = useTenant()
  const queryClient = useQueryClient()
  const api = tenant ? createTenantApi(tenant.slug) : null

  return useMutation({
    mutationFn: (courseId: string) => api!.enrollments.enroll(courseId),
    onSuccess: (_, courseId) => {
      queryClient.invalidateQueries({ queryKey: ["enrollment", courseId] })
      queryClient.invalidateQueries({ queryKey: ["enrollments"] })
      queryClient.invalidateQueries({ queryKey: ["course", courseId] })
    },
  })
}

// Drop enrollment from a course
export function useDropEnrollment() {
  const { tenant } = useTenant()
  const queryClient = useQueryClient()
  const api = tenant ? createTenantApi(tenant.slug) : null

  return useMutation({
    mutationFn: (courseId: string) => api!.enrollments.drop(courseId),
    onSuccess: (_, courseId) => {
      queryClient.invalidateQueries({ queryKey: ["enrollment", courseId] })
      queryClient.invalidateQueries({ queryKey: ["enrollments"] })
      queryClient.invalidateQueries({ queryKey: ["course", courseId, "progress"] })
    },
  })
}

// Admin: List enrollments for a course
export function useCourseEnrollments(courseId: string, limit = 20, offset = 0) {
  const { tenant } = useTenant()
  const api = tenant ? createTenantApi(tenant.slug) : null

  return useQuery({
    queryKey: ["course", courseId, "enrollments", limit, offset],
    queryFn: () => api!.enrollments.listByCourse(courseId, limit, offset),
    enabled: !!api && !!courseId,
  })
}
