"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, PlayCircle, FileText, Pencil, Trash2, Clock, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Lesson } from "@/lib/types/course"

interface SortableLessonProps {
  lesson: Lesson
  onEdit: () => void
  onDelete: () => void
}

export function SortableLesson({ lesson, onEdit, onDelete }: SortableLessonProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lesson.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const hasVideo = !!lesson.video_id
  const duration = lesson.duration_minutes || lesson.video_duration

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 p-2 bg-muted/50 rounded-md ${
        isDragging ? "shadow-md ring-2 ring-primary" : ""
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none p-1 hover:bg-muted rounded"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>
      <div className="flex h-6 w-6 items-center justify-center rounded bg-background">
        {hasVideo ? (
          <PlayCircle className="h-3.5 w-3.5 text-primary" />
        ) : (
          <FileText className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">{lesson.title}</span>
          {lesson.is_free_preview && (
            <Badge variant="secondary" className="text-xs h-5">
              <Eye className="h-3 w-3 mr-1" />
              Preview
            </Badge>
          )}
        </div>
      </div>
      {duration && duration > 0 && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>{duration} min</span>
        </div>
      )}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onEdit}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-destructive hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}
