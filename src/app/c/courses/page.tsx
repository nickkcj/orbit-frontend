"use client"

import { useState } from "react"
import { Loader2, BookOpen, Search, Filter } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CourseCard } from "@/components/courses"
import { useCourses } from "@/hooks/use-courses"

export default function CoursesPage() {
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<string>("all")

  const { data: courses, isLoading } = useCourses({
    status: status === "all" ? undefined : status,
    limit: 50,
  })

  const filteredCourses = courses?.filter((course) =>
    course.title.toLowerCase().includes(search.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Cursos</h1>
        <p className="text-muted-foreground mt-1">
          Explore os cursos disponíveis na comunidade
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar cursos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filtrar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="published">Publicados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Courses Grid */}
      {!filteredCourses || filteredCourses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-lg">
          <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="font-semibold text-lg mb-1">Nenhum curso encontrado</h3>
          <p className="text-sm text-muted-foreground">
            {search
              ? "Tente buscar por outro termo"
              : "Ainda não há cursos disponíveis"}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCourses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              href={`/courses/${course.id}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
