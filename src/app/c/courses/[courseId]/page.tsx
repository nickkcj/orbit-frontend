"use client"

import { use } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, BookOpen, Clock, User, Calendar, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ModuleAccordion } from "@/components/courses"
import { EnrollButton } from "@/components/courses/enroll-button"
import { useCourseStructure } from "@/hooks/use-courses"

interface CoursePageProps {
  params: Promise<{
    courseId: string
  }>
}

export default function CoursePage({ params }: CoursePageProps) {
  const { courseId } = use(params)
  const { data: structure, isLoading } = useCourseStructure(courseId)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("pt-BR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!structure) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Curso não encontrado</h2>
        <p className="text-muted-foreground mb-4">
          O curso que você procura não existe ou foi removido.
        </p>
        <Button asChild>
          <Link href="/courses">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar aos cursos
          </Link>
        </Button>
      </div>
    )
  }

  const { course, modules } = structure

  return (
    <div className="space-y-8">
      {/* Back Button */}
      <Button variant="ghost" size="sm" asChild>
        <Link href="/courses">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar aos cursos
        </Link>
      </Button>

      {/* Course Header */}
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2">
            {course.status !== "published" && (
              <Badge variant="secondary">
                {course.status === "draft" ? "Rascunho" : "Arquivado"}
              </Badge>
            )}
          </div>
          <h1 className="text-3xl font-bold">{course.title}</h1>
          {course.description && (
            <p className="text-lg text-muted-foreground">{course.description}</p>
          )}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {course.author_name && (
              <span className="flex items-center gap-1">
                <User className="h-4 w-4" />
                {course.author_name}
              </span>
            )}
            <span className="flex items-center gap-1">
              <BookOpen className="h-4 w-4" />
              {course.module_count} {course.module_count === 1 ? "módulo" : "módulos"}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {course.lesson_count} {course.lesson_count === 1 ? "aula" : "aulas"}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {formatDate(course.created_at)}
            </span>
          </div>

          {/* Enroll/Continue Button */}
          {course.status === "published" && (
            <div className="pt-4">
              <EnrollButton
                courseId={course.id}
                courseSlug={course.slug}
                size="lg"
              />
            </div>
          )}
        </div>

        {/* Thumbnail */}
        <div className="relative aspect-video lg:aspect-[4/3] rounded-lg overflow-hidden bg-muted">
          {course.thumbnail_url ? (
            <Image
              src={course.thumbnail_url}
              alt={course.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <BookOpen className="h-16 w-16 text-muted-foreground" />
            </div>
          )}
        </div>
      </div>

      {/* Course Content */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Conteúdo do Curso</h2>
        {modules.length > 0 ? (
          <div className="space-y-3">
            {modules.map((moduleWithLessons, index) => (
              <ModuleAccordion
                key={moduleWithLessons.module.id}
                module={moduleWithLessons.module}
                lessons={moduleWithLessons.lessons}
                defaultOpen={index === 0}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-lg">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-1">Sem conteúdo ainda</h3>
            <p className="text-sm text-muted-foreground">
              Este curso ainda não possui módulos ou aulas.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
