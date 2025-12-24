"use client"

import Link from "next/link"
import Image from "next/image"
import { useContinueLearning } from "@/hooks/use-enrollments"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Loader2, BookOpen, Play, ChevronRight } from "lucide-react"
import type { ContinueLearningCourse } from "@/lib/types/enrollment"

interface ContinueLearningProps {
  limit?: number
  showTitle?: boolean
  className?: string
}

export function ContinueLearning({ limit = 3, showTitle = true, className }: ContinueLearningProps) {
  const { data: courses, isLoading } = useContinueLearning(limit)

  if (isLoading) {
    return (
      <div className={className}>
        {showTitle && (
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Continuar aprendendo</h2>
          </div>
        )}
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (!courses || courses.length === 0) {
    return null // Don't show section if no courses in progress
  }

  return (
    <div className={className}>
      {showTitle && (
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Continuar aprendendo</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/enrollments">
              Ver todos
              <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => (
          <ContinueLearningCard key={course.id} course={course} />
        ))}
      </div>
    </div>
  )
}

interface ContinueLearningCardProps {
  course: ContinueLearningCourse
}

function ContinueLearningCard({ course }: ContinueLearningCardProps) {
  return (
    <Link href={`/c/courses/${course.course_id}/learn`}>
      <Card className="overflow-hidden hover:shadow-md transition-shadow h-full">
        {/* Thumbnail */}
        <div className="relative aspect-video bg-muted">
          {course.course_thumbnail ? (
            <Image
              src={course.course_thumbnail}
              alt={course.course_title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <BookOpen className="h-10 w-10 text-muted-foreground" />
            </div>
          )}
          {/* Play overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity">
            <div className="h-12 w-12 rounded-full bg-white/90 flex items-center justify-center">
              <Play className="h-6 w-6 text-black ml-1" />
            </div>
          </div>
        </div>

        <CardContent className="p-4">
          {/* Title */}
          <h3 className="font-semibold line-clamp-2 mb-1">{course.course_title}</h3>

          {/* Resume info */}
          {course.last_lesson_title && (
            <p className="text-sm text-muted-foreground line-clamp-1 mb-3">
              {course.last_module_title && `${course.last_module_title}: `}
              {course.last_lesson_title}
            </p>
          )}

          {/* Progress */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>
                {course.completed_lessons_count} de {course.total_lessons_count} aulas
              </span>
              <span>{course.progress_percentage}%</span>
            </div>
            <Progress value={course.progress_percentage} className="h-1.5" />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

// Compact version for smaller spaces
export function ContinueLearningCompact({ limit = 5, className }: { limit?: number; className?: string }) {
  const { data: courses, isLoading } = useContinueLearning(limit)

  if (isLoading) {
    return (
      <div className={className}>
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!courses || courses.length === 0) {
    return null
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {courses.map((course) => (
        <Link
          key={course.id}
          href={`/c/courses/${course.course_id}/learn`}
          className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
        >
          {/* Thumbnail */}
          <div className="relative h-12 w-16 rounded overflow-hidden bg-muted flex-shrink-0">
            {course.course_thumbnail ? (
              <Image
                src={course.course_thumbnail}
                alt={course.course_title}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{course.course_title}</p>
            <div className="flex items-center gap-2">
              <Progress value={course.progress_percentage} className="h-1 flex-1" />
              <span className="text-xs text-muted-foreground">{course.progress_percentage}%</span>
            </div>
          </div>

          <Play className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        </Link>
      ))}
    </div>
  )
}
