"use client"

import Image from "next/image"
import Link from "next/link"
import { Clock, BookOpen, User } from "lucide-react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Course } from "@/lib/types/course"

interface CourseCardProps {
  course: Course
  href?: string
}

export function CourseCard({ course, href }: CourseCardProps) {
  const cardContent = (
    <Card className="group overflow-hidden transition-all hover:shadow-lg">
      <div className="relative aspect-video overflow-hidden">
        {course.thumbnail_url ? (
          <Image
            src={course.thumbnail_url}
            alt={course.title}
            fill
            className="object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted">
            <BookOpen className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
        {course.status !== "published" && (
          <Badge
            variant={course.status === "draft" ? "secondary" : "outline"}
            className="absolute right-2 top-2"
          >
            {course.status === "draft" ? "Rascunho" : "Arquivado"}
          </Badge>
        )}
      </div>
      <CardContent className="p-4">
        <h3 className="line-clamp-2 font-semibold leading-tight group-hover:text-primary">
          {course.title}
        </h3>
        {course.description && (
          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
            {course.description}
          </p>
        )}
      </CardContent>
      <CardFooter className="flex items-center justify-between border-t px-4 py-3">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <BookOpen className="h-4 w-4" />
            {course.module_count} {course.module_count === 1 ? "módulo" : "módulos"}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {course.lesson_count} {course.lesson_count === 1 ? "aula" : "aulas"}
          </span>
        </div>
        {course.author_name && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            <span className="truncate max-w-[100px]">{course.author_name}</span>
          </div>
        )}
      </CardFooter>
    </Card>
  )

  if (href) {
    return (
      <Link href={href} className="block">
        {cardContent}
      </Link>
    )
  }

  return cardContent
}
