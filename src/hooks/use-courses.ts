"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useTenant } from "@/providers/tenant-provider"
import { createTenantApi } from "@/lib/api"
import type {
  Course,
  Module,
  Lesson,
  CourseStructure,
  CreateCourseRequest,
  UpdateCourseRequest,
  CreateModuleRequest,
  UpdateModuleRequest,
  CreateLessonRequest,
  UpdateLessonRequest,
} from "@/lib/types/course"

// ============================================================================
// COURSE HOOKS
// ============================================================================

export function useCourses(params?: { status?: string; limit?: number; offset?: number }) {
  const { tenant } = useTenant()
  const api = tenant ? createTenantApi(tenant.slug) : null

  return useQuery({
    queryKey: ["courses", tenant?.slug, params],
    queryFn: () => api!.courses.list(params),
    enabled: !!api,
  })
}

export function useCourse(courseId: string) {
  const { tenant } = useTenant()
  const api = tenant ? createTenantApi(tenant.slug) : null

  return useQuery({
    queryKey: ["course", courseId],
    queryFn: () => api!.courses.get(courseId),
    enabled: !!api && !!courseId,
  })
}

export function useCourseStructure(courseId: string) {
  const { tenant } = useTenant()
  const api = tenant ? createTenantApi(tenant.slug) : null

  return useQuery({
    queryKey: ["course", courseId, "structure"],
    queryFn: () => api!.courses.getStructure(courseId),
    enabled: !!api && !!courseId,
  })
}

export function useCreateCourse() {
  const { tenant } = useTenant()
  const queryClient = useQueryClient()
  const api = tenant ? createTenantApi(tenant.slug) : null

  return useMutation({
    mutationFn: (data: CreateCourseRequest) => api!.courses.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] })
    },
  })
}

export function useUpdateCourse(courseId: string) {
  const { tenant } = useTenant()
  const queryClient = useQueryClient()
  const api = tenant ? createTenantApi(tenant.slug) : null

  return useMutation({
    mutationFn: (data: UpdateCourseRequest) => api!.courses.update(courseId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course", courseId] })
      queryClient.invalidateQueries({ queryKey: ["courses"] })
    },
  })
}

export function usePublishCourse(courseId: string) {
  const { tenant } = useTenant()
  const queryClient = useQueryClient()
  const api = tenant ? createTenantApi(tenant.slug) : null

  return useMutation({
    mutationFn: () => api!.courses.publish(courseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course", courseId] })
      queryClient.invalidateQueries({ queryKey: ["courses"] })
    },
  })
}

export function useUnpublishCourse(courseId: string) {
  const { tenant } = useTenant()
  const queryClient = useQueryClient()
  const api = tenant ? createTenantApi(tenant.slug) : null

  return useMutation({
    mutationFn: () => api!.courses.unpublish(courseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course", courseId] })
      queryClient.invalidateQueries({ queryKey: ["courses"] })
    },
  })
}

export function useDeleteCourse() {
  const { tenant } = useTenant()
  const queryClient = useQueryClient()
  const api = tenant ? createTenantApi(tenant.slug) : null

  return useMutation({
    mutationFn: (courseId: string) => api!.courses.delete(courseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] })
    },
  })
}

// ============================================================================
// MODULE HOOKS
// ============================================================================

export function useModules(courseId: string) {
  const { tenant } = useTenant()
  const api = tenant ? createTenantApi(tenant.slug) : null

  return useQuery({
    queryKey: ["modules", courseId],
    queryFn: () => api!.modules.list(courseId),
    enabled: !!api && !!courseId,
  })
}

export function useCreateModule(courseId: string) {
  const { tenant } = useTenant()
  const queryClient = useQueryClient()
  const api = tenant ? createTenantApi(tenant.slug) : null

  return useMutation({
    mutationFn: (data: CreateModuleRequest) => api!.modules.create(courseId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modules", courseId] })
      queryClient.invalidateQueries({ queryKey: ["course", courseId] })
    },
  })
}

export function useUpdateModule(courseId: string) {
  const { tenant } = useTenant()
  const queryClient = useQueryClient()
  const api = tenant ? createTenantApi(tenant.slug) : null

  return useMutation({
    mutationFn: ({ moduleId, data }: { moduleId: string; data: UpdateModuleRequest }) =>
      api!.modules.update(moduleId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modules", courseId] })
      queryClient.invalidateQueries({ queryKey: ["course", courseId] })
    },
  })
}

export function useReorderModule(courseId: string) {
  const { tenant } = useTenant()
  const queryClient = useQueryClient()
  const api = tenant ? createTenantApi(tenant.slug) : null

  return useMutation({
    mutationFn: ({ moduleId, position }: { moduleId: string; position: number }) =>
      api!.modules.reorder(moduleId, position),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modules", courseId] })
      queryClient.invalidateQueries({ queryKey: ["course", courseId] })
    },
  })
}

export function useDeleteModule(courseId: string) {
  const { tenant } = useTenant()
  const queryClient = useQueryClient()
  const api = tenant ? createTenantApi(tenant.slug) : null

  return useMutation({
    mutationFn: (moduleId: string) => api!.modules.delete(moduleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modules", courseId] })
      queryClient.invalidateQueries({ queryKey: ["course", courseId] })
    },
  })
}

// ============================================================================
// LESSON HOOKS
// ============================================================================

export function useLessons(moduleId: string) {
  const { tenant } = useTenant()
  const api = tenant ? createTenantApi(tenant.slug) : null

  return useQuery({
    queryKey: ["lessons", moduleId],
    queryFn: () => api!.lessons.list(moduleId),
    enabled: !!api && !!moduleId,
  })
}

export function useLesson(lessonId: string) {
  const { tenant } = useTenant()
  const api = tenant ? createTenantApi(tenant.slug) : null

  return useQuery({
    queryKey: ["lesson", lessonId],
    queryFn: () => api!.lessons.get(lessonId),
    enabled: !!api && !!lessonId,
  })
}

export function useCreateLesson(courseId: string) {
  const { tenant } = useTenant()
  const queryClient = useQueryClient()
  const api = tenant ? createTenantApi(tenant.slug) : null

  return useMutation({
    mutationFn: ({ moduleId, data }: { moduleId: string; data: CreateLessonRequest }) =>
      api!.lessons.create(moduleId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lessons"] })
      queryClient.invalidateQueries({ queryKey: ["modules", courseId] })
      queryClient.invalidateQueries({ queryKey: ["course", courseId] })
    },
  })
}

export function useUpdateLesson(courseId: string) {
  const { tenant } = useTenant()
  const queryClient = useQueryClient()
  const api = tenant ? createTenantApi(tenant.slug) : null

  return useMutation({
    mutationFn: ({ lessonId, data }: { lessonId: string; data: UpdateLessonRequest }) =>
      api!.lessons.update(lessonId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lessons"] })
      queryClient.invalidateQueries({ queryKey: ["course", courseId] })
    },
  })
}

export function useReorderLesson(courseId: string) {
  const { tenant } = useTenant()
  const queryClient = useQueryClient()
  const api = tenant ? createTenantApi(tenant.slug) : null

  return useMutation({
    mutationFn: ({ lessonId, position }: { lessonId: string; position: number }) =>
      api!.lessons.reorder(lessonId, position),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lessons"] })
      queryClient.invalidateQueries({ queryKey: ["course", courseId] })
    },
  })
}

export function useDeleteLesson(courseId: string) {
  const { tenant } = useTenant()
  const queryClient = useQueryClient()
  const api = tenant ? createTenantApi(tenant.slug) : null

  return useMutation({
    mutationFn: (lessonId: string) => api!.lessons.delete(lessonId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lessons"] })
      queryClient.invalidateQueries({ queryKey: ["modules", courseId] })
      queryClient.invalidateQueries({ queryKey: ["course", courseId] })
    },
  })
}
