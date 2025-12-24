"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight, CheckCircle2, Circle, PlayCircle, Clock, Lock } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import type { ModuleWithLessonsProgress, EnrollmentWithProgress, LessonWithProgress } from "@/lib/types/enrollment"

interface CoursePlayerSidebarProps {
  enrollment: EnrollmentWithProgress
  modules: ModuleWithLessonsProgress[]
  currentLessonId?: string
  onLessonSelect: (lessonId: string) => void
}

export function CoursePlayerSidebar({
  enrollment,
  modules,
  currentLessonId,
  onLessonSelect,
}: CoursePlayerSidebarProps) {
  const [expandedModules, setExpandedModules] = useState<Set<string>>(() => {
    // Initially expand the module containing the current lesson
    const modulesSet = new Set<string>()
    if (currentLessonId) {
      for (const module of modules) {
        if (module.lessons.some((l) => l.id === currentLessonId)) {
          modulesSet.add(module.module_id)
          break
        }
      }
    }
    // If no current lesson, expand first module
    if (modulesSet.size === 0 && modules.length > 0) {
      modulesSet.add(modules[0].module_id)
    }
    return modulesSet
  })

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev)
      if (next.has(moduleId)) {
        next.delete(moduleId)
      } else {
        next.add(moduleId)
      }
      return next
    })
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return null
    const mins = Math.floor(seconds / 60)
    return `${mins} min`
  }

  const getModuleProgress = (module: ModuleWithLessonsProgress) => {
    const completed = module.lessons.filter((l) => l.progress_status === "completed").length
    return {
      completed,
      total: module.lessons.length,
      percentage: module.lessons.length > 0 ? Math.round((completed / module.lessons.length) * 100) : 0,
    }
  }

  return (
    <div className="flex flex-col h-full bg-background border-r">
      {/* Course Progress Header */}
      <div className="p-4 border-b">
        <h2 className="font-semibold text-sm truncate mb-2">{enrollment.course_title}</h2>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <span>
            {enrollment.completed_lessons_count} de {enrollment.total_lessons_count} aulas
          </span>
        </div>
        <Progress value={enrollment.progress_percentage} className="h-2" />
        <p className="text-xs text-muted-foreground mt-1">{enrollment.progress_percentage}% concluido</p>
      </div>

      {/* Modules List */}
      <div className="flex-1 overflow-y-auto">
        {modules.map((module) => {
          const isExpanded = expandedModules.has(module.module_id)
          const progress = getModuleProgress(module)

          return (
            <div key={module.module_id} className="border-b last:border-b-0">
              {/* Module Header */}
              <button
                onClick={() => toggleModule(module.module_id)}
                className="w-full flex items-center gap-2 p-3 hover:bg-muted/50 transition-colors text-left"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{module.module_title}</p>
                  <p className="text-xs text-muted-foreground">
                    {progress.completed}/{progress.total} aulas
                  </p>
                </div>
                {progress.percentage === 100 && (
                  <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                )}
              </button>

              {/* Lessons List */}
              {isExpanded && (
                <div className="pb-2">
                  {module.lessons.map((lesson) => (
                    <LessonItem
                      key={lesson.id}
                      lesson={lesson}
                      isActive={lesson.id === currentLessonId}
                      onClick={() => onLessonSelect(lesson.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

interface LessonItemProps {
  lesson: LessonWithProgress
  isActive: boolean
  onClick: () => void
}

function LessonItem({ lesson, isActive, onClick }: LessonItemProps) {
  const isCompleted = lesson.progress_status === "completed"
  const hasVideo = !!lesson.video_id
  const duration = lesson.video_duration
    ? `${Math.floor(lesson.video_duration / 60)} min`
    : lesson.duration_minutes
    ? `${lesson.duration_minutes} min`
    : null

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-start gap-3 px-4 py-2 text-left transition-colors",
        isActive
          ? "bg-primary/10 border-l-2 border-primary"
          : "hover:bg-muted/50 border-l-2 border-transparent"
      )}
    >
      {/* Status Icon */}
      <div className="flex-shrink-0 mt-0.5">
        {isCompleted ? (
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        ) : isActive ? (
          <PlayCircle className="h-4 w-4 text-primary" />
        ) : (
          <Circle className="h-4 w-4 text-muted-foreground" />
        )}
      </div>

      {/* Lesson Info */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-sm truncate",
            isActive ? "font-medium text-primary" : "",
            isCompleted ? "text-muted-foreground" : ""
          )}
        >
          {lesson.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          {hasVideo && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <PlayCircle className="h-3 w-3" />
              Video
            </span>
          )}
          {duration && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {duration}
            </span>
          )}
          {lesson.is_free_preview && (
            <span className="text-xs text-blue-600 dark:text-blue-400">Preview</span>
          )}
        </div>
      </div>
    </button>
  )
}
