"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Loader2,
  Plus,
  BookOpen,
  Search,
  Filter,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  Globe,
  GlobeLock,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Card, CardContent } from "@/components/ui/card"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useTenant } from "@/providers/tenant-provider"
import { createTenantApi } from "@/lib/api"
import { useCourses, useDeleteCourse } from "@/hooks/use-courses"
import type { Course } from "@/lib/types/course"

export default function StudioCoursesPage() {
  const { tenant } = useTenant()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data: courses, isLoading } = useCourses({ limit: 100 })
  const deleteCourse = useDeleteCourse()

  const publishMutation = useMutation({
    mutationFn: async (courseId: string) => {
      const api = createTenantApi(tenant!.slug)
      return api.courses.publish(courseId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] })
    },
  })

  const unpublishMutation = useMutation({
    mutationFn: async (courseId: string) => {
      const api = createTenantApi(tenant!.slug)
      return api.courses.unpublish(courseId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] })
    },
  })

  const filteredCourses = courses?.filter((course) => {
    const matchesSearch = course.title
      .toLowerCase()
      .includes(search.toLowerCase())
    const matchesStatus =
      statusFilter === "all" || course.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handlePublish = (courseId: string) => {
    publishMutation.mutate(courseId)
  }

  const handleUnpublish = (courseId: string) => {
    unpublishMutation.mutate(courseId)
  }

  const handleDelete = async () => {
    if (deleteId) {
      await deleteCourse.mutateAsync(deleteId)
      setDeleteId(null)
    }
  }

  const getStatusBadge = (status: Course["status"]) => {
    switch (status) {
      case "published":
        return (
          <Badge variant="default" className="bg-green-500 hover:bg-green-600">
            Publicado
          </Badge>
        )
      case "draft":
        return <Badge variant="secondary">Rascunho</Badge>
      case "archived":
        return <Badge variant="outline">Arquivado</Badge>
    }
  }

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Meus Cursos</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie e crie cursos para sua comunidade
          </p>
        </div>
        <Button asChild>
          <Link href="/studio/courses/new">
            <Plus className="h-4 w-4 mr-2" />
            Novo Curso
          </Link>
        </Button>
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
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="draft">Rascunho</SelectItem>
            <SelectItem value="published">Publicado</SelectItem>
            <SelectItem value="archived">Arquivado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Courses List */}
      {!filteredCourses || filteredCourses.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Nenhum curso ainda</h3>
            <p className="text-muted-foreground mb-4">
              Crie seu primeiro curso e comece a compartilhar conhecimento.
            </p>
            <Button asChild>
              <Link href="/studio/courses/new">
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Curso
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredCourses.map((course) => (
            <Card key={course.id} className="hover:border-primary/50 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {/* Thumbnail */}
                  <div className="relative h-20 w-32 flex-shrink-0 rounded-md overflow-hidden bg-muted">
                    {course.thumbnail_url ? (
                      <img
                        src={course.thumbnail_url}
                        alt={course.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <BookOpen className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold truncate">{course.title}</h3>
                      {getStatusBadge(course.status)}
                    </div>
                    {course.description && (
                      <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                        {course.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>
                        {course.module_count}{" "}
                        {course.module_count === 1 ? "módulo" : "módulos"}
                      </span>
                      <span>
                        {course.lesson_count}{" "}
                        {course.lesson_count === 1 ? "aula" : "aulas"}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/studio/courses/${course.id}/edit`}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Editar
                      </Link>
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/courses/${course.id}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            Visualizar
                          </Link>
                        </DropdownMenuItem>
                        {course.status === "draft" && (
                          <DropdownMenuItem
                            onClick={() => handlePublish(course.id)}
                          >
                            <Globe className="h-4 w-4 mr-2" />
                            Publicar
                          </DropdownMenuItem>
                        )}
                        {course.status === "published" && (
                          <DropdownMenuItem
                            onClick={() => handleUnpublish(course.id)}
                          >
                            <GlobeLock className="h-4 w-4 mr-2" />
                            Despublicar
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setDeleteId(course.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Curso</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este curso? Todos os módulos e
              aulas serão removidos permanentemente. Esta ação não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteCourse.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
