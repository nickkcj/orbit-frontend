"use client"

import { PlayCircle, FileText, Clock, Eye } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { Lesson } from "@/lib/types/course"

interface LessonItemProps {
  lesson: Lesson
  onClick?: () => void
  isActive?: boolean
}

export function LessonItem({ lesson, onClick, isActive }: LessonItemProps) {
  const hasVideo = !!lesson.video_id
  const duration = lesson.duration_minutes || lesson.video_duration

  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 p-4 text-left hover:bg-muted/50 transition-colors ${
        isActive ? "bg-muted" : ""
      }`}
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
        {hasVideo ? (
          <PlayCircle className="h-4 w-4 text-primary" />
        ) : (
          <FileText className="h-4 w-4 text-muted-foreground" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">{lesson.title}</span>
          {lesson.is_free_preview && (
            <Badge variant="secondary" className="text-xs">
              <Eye className="h-3 w-3 mr-1" />
              Preview
            </Badge>
          )}
        </div>
        {lesson.description && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {lesson.description}
          </p>
        )}
      </div>
      {duration && duration > 0 && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>{duration} min</span>
        </div>
      )}
    </button>
  )
}
