"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useEnrollmentStatus, useEnrollInCourse } from "@/hooks/use-enrollments"
import { Loader2, CheckCircle2, Play } from "lucide-react"
import { useRouter } from "next/navigation"

interface EnrollButtonProps {
  courseId: string
  courseSlug?: string
  size?: "default" | "sm" | "lg"
  className?: string
}

export function EnrollButton({ courseId, courseSlug, size = "default", className }: EnrollButtonProps) {
  const router = useRouter()
  const { data: statusData, isLoading: statusLoading } = useEnrollmentStatus(courseId)
  const enrollMutation = useEnrollInCourse()

  const handleEnroll = async () => {
    try {
      await enrollMutation.mutateAsync(courseId)
      // After enrolling, navigate to the course player
      if (courseSlug) {
        router.push(`/c/courses/${courseId}/learn`)
      }
    } catch (error) {
      console.error("Failed to enroll:", error)
    }
  }

  const handleContinue = () => {
    router.push(`/c/courses/${courseId}/learn`)
  }

  if (statusLoading) {
    return (
      <Button disabled size={size} className={className}>
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        Carregando...
      </Button>
    )
  }

  if (statusData?.enrolled) {
    const enrollment = statusData.enrollment
    const isCompleted = enrollment?.status === "completed"
    const progress = enrollment?.progress_percentage || 0

    if (isCompleted) {
      return (
        <div className={`flex items-center gap-2 ${className}`}>
          <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Concluido
          </Badge>
          <Button size={size} variant="outline" onClick={handleContinue}>
            Revisar
          </Button>
        </div>
      )
    }

    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Button size={size} onClick={handleContinue}>
          <Play className="h-4 w-4 mr-2" />
          {progress > 0 ? `Continuar (${progress}%)` : "Comecar"}
        </Button>
      </div>
    )
  }

  return (
    <Button
      size={size}
      className={className}
      onClick={handleEnroll}
      disabled={enrollMutation.isPending}
    >
      {enrollMutation.isPending ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Matriculando...
        </>
      ) : (
        "Matricular-se"
      )}
    </Button>
  )
}

// Compact version for course cards
export function EnrollBadge({ courseId }: { courseId: string }) {
  const { data: statusData, isLoading } = useEnrollmentStatus(courseId)

  if (isLoading || !statusData?.enrolled) {
    return null
  }

  const enrollment = statusData.enrollment
  const isCompleted = enrollment?.status === "completed"
  const progress = enrollment?.progress_percentage || 0

  if (isCompleted) {
    return (
      <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
        <CheckCircle2 className="h-3 w-3 mr-1" />
        Concluido
      </Badge>
    )
  }

  return (
    <Badge variant="secondary">
      {progress}% completo
    </Badge>
  )
}
