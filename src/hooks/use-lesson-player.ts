"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useTenant } from "@/providers/tenant-provider"
import { createTenantApi } from "@/lib/api"
import { useCallback, useRef } from "react"

// ============================================================================
// LESSON PLAYER HOOKS
// ============================================================================

// Get lesson for player with progress
export function useLessonPlayer(lessonId: string) {
  const { tenant } = useTenant()
  const api = tenant ? createTenantApi(tenant.slug) : null

  return useQuery({
    queryKey: ["learn", "lesson", lessonId],
    queryFn: () => api!.learn.getLesson(lessonId),
    enabled: !!api && !!lessonId,
  })
}

// Mark lesson as complete
export function useMarkLessonComplete() {
  const { tenant } = useTenant()
  const queryClient = useQueryClient()
  const api = tenant ? createTenantApi(tenant.slug) : null

  return useMutation({
    mutationFn: (lessonId: string) => api!.learn.completeLesson(lessonId),
    onSuccess: (data, lessonId) => {
      // Invalidate lesson query
      queryClient.invalidateQueries({ queryKey: ["learn", "lesson", lessonId] })
      // Invalidate enrollment/progress queries
      queryClient.invalidateQueries({ queryKey: ["enrollments"] })
      queryClient.invalidateQueries({ queryKey: ["course"] })
    },
  })
}

// Unmark lesson as complete
export function useUnmarkLessonComplete() {
  const { tenant } = useTenant()
  const queryClient = useQueryClient()
  const api = tenant ? createTenantApi(tenant.slug) : null

  return useMutation({
    mutationFn: (lessonId: string) => api!.learn.uncompleteLesson(lessonId),
    onSuccess: (data, lessonId) => {
      queryClient.invalidateQueries({ queryKey: ["learn", "lesson", lessonId] })
      queryClient.invalidateQueries({ queryKey: ["enrollments"] })
      queryClient.invalidateQueries({ queryKey: ["course"] })
    },
  })
}

// Update video progress with debouncing
export function useUpdateVideoProgress() {
  const { tenant } = useTenant()
  const api = tenant ? createTenantApi(tenant.slug) : null
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastUpdateRef = useRef<number>(0)

  const updateProgress = useMutation({
    mutationFn: ({
      lessonId,
      watchDurationSeconds,
      videoTotalSeconds,
    }: {
      lessonId: string
      watchDurationSeconds: number
      videoTotalSeconds?: number
    }) => api!.learn.updateVideoProgress(lessonId, watchDurationSeconds, videoTotalSeconds),
  })

  // Debounced update function - updates every 10 seconds
  const debouncedUpdate = useCallback(
    (lessonId: string, watchDurationSeconds: number, videoTotalSeconds?: number) => {
      const now = Date.now()
      const timeSinceLastUpdate = now - lastUpdateRef.current

      // Clear any pending timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      // If it's been more than 10 seconds since last update, update immediately
      if (timeSinceLastUpdate >= 10000) {
        lastUpdateRef.current = now
        updateProgress.mutate({ lessonId, watchDurationSeconds, videoTotalSeconds })
      } else {
        // Otherwise, schedule an update
        timeoutRef.current = setTimeout(() => {
          lastUpdateRef.current = Date.now()
          updateProgress.mutate({ lessonId, watchDurationSeconds, videoTotalSeconds })
        }, 10000 - timeSinceLastUpdate)
      }
    },
    [updateProgress]
  )

  // Force immediate update (e.g., when pausing or navigating away)
  const forceUpdate = useCallback(
    (lessonId: string, watchDurationSeconds: number, videoTotalSeconds?: number) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      lastUpdateRef.current = Date.now()
      updateProgress.mutate({ lessonId, watchDurationSeconds, videoTotalSeconds })
    },
    [updateProgress]
  )

  return {
    ...updateProgress,
    debouncedUpdate,
    forceUpdate,
  }
}

// Combined hook for lesson player state management
export function useLessonPlayerState(lessonId: string) {
  const lessonQuery = useLessonPlayer(lessonId)
  const markComplete = useMarkLessonComplete()
  const unmarkComplete = useUnmarkLessonComplete()
  const videoProgress = useUpdateVideoProgress()

  const isCompleted =
    lessonQuery.data?.lesson?.progress_status === "completed" ||
    (lessonQuery.data as { lesson?: { progress_status?: string } })?.lesson?.progress_status ===
      "completed"

  return {
    lesson: lessonQuery.data?.lesson,
    enrollmentId: lessonQuery.data?.enrollment_id,
    previousLesson: lessonQuery.data?.previous_lesson,
    nextLesson: lessonQuery.data?.next_lesson,
    isPreview: lessonQuery.data?.is_preview,
    isLoading: lessonQuery.isLoading,
    error: lessonQuery.error,
    isCompleted,
    markComplete: () => markComplete.mutate(lessonId),
    unmarkComplete: () => unmarkComplete.mutate(lessonId),
    updateVideoProgress: (watchDurationSeconds: number, videoTotalSeconds?: number) =>
      videoProgress.debouncedUpdate(lessonId, watchDurationSeconds, videoTotalSeconds),
    forceUpdateVideoProgress: (watchDurationSeconds: number, videoTotalSeconds?: number) =>
      videoProgress.forceUpdate(lessonId, watchDurationSeconds, videoTotalSeconds),
    isMarkingComplete: markComplete.isPending,
    isUnmarkingComplete: unmarkComplete.isPending,
  }
}
