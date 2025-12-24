"use client"

import { use, useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2, AlertCircle, BookOpen, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CoursePlayerSidebar } from "@/components/courses/course-player-sidebar"
import { LessonContent } from "@/components/courses/lesson-content"
import { useCourseProgress } from "@/hooks/use-enrollments"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface LearnPageProps {
  params: Promise<{
    courseId: string
  }>
}

export default function LearnPage({ params }: LearnPageProps) {
  const { courseId } = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()
  const lessonParam = searchParams.get("lesson")

  const { data: playerData, isLoading, error } = useCourseProgress(courseId)

  const [currentLessonId, setCurrentLessonId] = useState<string | null>(lessonParam)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // When player data loads, set the current lesson if not already set
  useEffect(() => {
    if (!playerData) return

    // If no lesson is selected
    if (!currentLessonId) {
      // Try to use next_lesson (resume) or first lesson
      if (playerData.next_lesson) {
        setCurrentLessonId(playerData.next_lesson.id)
      } else if (playerData.modules.length > 0 && playerData.modules[0].lessons.length > 0) {
        setCurrentLessonId(playerData.modules[0].lessons[0].id)
      }
    }
  }, [playerData, currentLessonId])

  // Update URL when lesson changes
  const handleLessonSelect = (lessonId: string) => {
    setCurrentLessonId(lessonId)
    router.replace(`/c/courses/${courseId}/learn?lesson=${lessonId}`, { scroll: false })
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Voce nao esta matriculado neste curso."

    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="text-center max-w-md px-4">
          <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
          <h1 className="text-xl font-semibold mb-2">Acesso negado</h1>
          <p className="text-muted-foreground mb-6">{errorMessage}</p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" asChild>
              <Link href={`/c/courses/${courseId}`}>Ver detalhes do curso</Link>
            </Button>
            <Button asChild>
              <Link href="/courses">Voltar aos cursos</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!playerData) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="text-center">
          <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-xl font-semibold mb-2">Curso nao encontrado</h1>
          <Button asChild>
            <Link href="/courses">Voltar aos cursos</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 flex bg-background">
      {/* Mobile sidebar toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-80 transition-transform lg:relative lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <CoursePlayerSidebar
          enrollment={playerData.enrollment}
          modules={playerData.modules}
          currentLessonId={currentLessonId || undefined}
          onLessonSelect={(lessonId) => {
            handleLessonSelect(lessonId)
            // Close sidebar on mobile after selection
            if (window.innerWidth < 1024) {
              setSidebarOpen(false)
            }
          }}
        />
      </div>

      {/* Backdrop for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {currentLessonId ? (
          <LessonContent lessonId={currentLessonId} onNavigate={handleLessonSelect} />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-lg font-semibold mb-2">Selecione uma aula</h2>
              <p className="text-muted-foreground">
                Escolha uma aula no menu lateral para comecar.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
