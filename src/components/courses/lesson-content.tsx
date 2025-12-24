"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { StreamVideoPlayer } from "@/components/stream-video-player"
import { useTenant } from "@/providers/tenant-provider"
import { useLessonPlayerState } from "@/hooks/use-lesson-player"
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Circle,
  Loader2,
  AlertCircle,
  Clock,
  BookOpen,
} from "lucide-react"
import { cn } from "@/lib/utils"
import ReactMarkdown from "react-markdown"

interface LessonContentProps {
  lessonId: string
  onNavigate: (lessonId: string) => void
}

export function LessonContent({ lessonId, onNavigate }: LessonContentProps) {
  const { tenant } = useTenant()
  const {
    lesson,
    previousLesson,
    nextLesson,
    isPreview,
    isLoading,
    error,
    isCompleted,
    markComplete,
    unmarkComplete,
    updateVideoProgress,
    forceUpdateVideoProgress,
    isMarkingComplete,
    isUnmarkingComplete,
  } = useLessonPlayerState(lessonId)

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
          <h2 className="text-lg font-semibold mb-2">Erro ao carregar aula</h2>
          <p className="text-muted-foreground">
            {error instanceof Error ? error.message : "Ocorreu um erro inesperado"}
          </p>
        </div>
      </div>
    )
  }

  if (!lesson) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold mb-2">Aula nao encontrada</h2>
        </div>
      </div>
    )
  }

  const hasVideo = !!lesson.video_id && lesson.video_playback_url
  const hasContent = !!lesson.content

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Video Player */}
      {hasVideo && tenant && (
        <div className="w-full bg-black">
          <div className="max-w-5xl mx-auto">
            <StreamVideoPlayer
              tenantSlug={tenant.slug}
              videoId={lesson.video_id!}
              autoPlay
              controls
            />
          </div>
        </div>
      )}

      {/* Lesson Header & Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-start justify-between gap-4 mb-2">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  {lesson.module_title}
                </p>
                <h1 className="text-2xl font-bold">{lesson.title}</h1>
              </div>
              {isPreview && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                  Preview
                </Badge>
              )}
            </div>

            {lesson.description && (
              <p className="text-muted-foreground mt-2">{lesson.description}</p>
            )}

            {/* Duration */}
            {(lesson.video_duration || lesson.duration_minutes) && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-2">
                <Clock className="h-4 w-4" />
                {lesson.video_duration
                  ? `${Math.floor(lesson.video_duration / 60)} minutos`
                  : `${lesson.duration_minutes} minutos`}
              </div>
            )}
          </div>

          {/* Content */}
          {hasContent && (
            <div className="prose prose-neutral dark:prose-invert max-w-none mb-8">
              {lesson.content_format === "markdown" ? (
                <ReactMarkdown>{lesson.content || ""}</ReactMarkdown>
              ) : lesson.content_format === "html" ? (
                <div dangerouslySetInnerHTML={{ __html: lesson.content || "" }} />
              ) : (
                <pre className="whitespace-pre-wrap">{lesson.content}</pre>
              )}
            </div>
          )}

          {/* Empty state when no video and no content */}
          {!hasVideo && !hasContent && (
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-4" />
              <p>Esta aula ainda nao possui conteudo.</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation Bar */}
      {!isPreview && (
        <div className="border-t bg-background p-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
            {/* Previous Button */}
            <Button
              variant="outline"
              onClick={() => previousLesson && onNavigate(previousLesson.id)}
              disabled={!previousLesson}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Anterior</span>
            </Button>

            {/* Complete Button */}
            <Button
              variant={isCompleted ? "outline" : "default"}
              onClick={isCompleted ? unmarkComplete : markComplete}
              disabled={isMarkingComplete || isUnmarkingComplete}
              className={cn(
                "flex items-center gap-2",
                isCompleted && "border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-950"
              )}
            >
              {isMarkingComplete || isUnmarkingComplete ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isCompleted ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <Circle className="h-4 w-4" />
              )}
              <span>{isCompleted ? "Concluida" : "Marcar como concluida"}</span>
            </Button>

            {/* Next Button */}
            <Button
              onClick={() => nextLesson && onNavigate(nextLesson.id)}
              disabled={!nextLesson}
              className="flex items-center gap-2"
            >
              <span className="hidden sm:inline">Proxima</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Preview CTA */}
      {isPreview && (
        <div className="border-t bg-muted/50 p-4">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-sm text-muted-foreground mb-2">
              Esta e uma aula de preview. Matricule-se para acessar todo o conteudo.
            </p>
            <Button>Matricular-se no curso</Button>
          </div>
        </div>
      )}
    </div>
  )
}
