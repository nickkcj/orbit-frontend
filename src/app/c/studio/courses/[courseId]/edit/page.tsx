"use client"

import { use, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Loader2,
  Save,
  Eye,
  Globe,
  GlobeLock,
  Settings,
  Upload,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { CourseBuilder } from "@/components/studio"
import {
  useCourseStructure,
  useUpdateCourse,
  usePublishCourse,
  useUnpublishCourse,
} from "@/hooks/use-courses"
import { useTenant } from "@/providers/tenant-provider"
import { createTenantApi } from "@/lib/api"

interface EditCoursePageProps {
  params: Promise<{
    courseId: string
  }>
}

export default function EditCoursePage({ params }: EditCoursePageProps) {
  const { courseId } = use(params)
  const router = useRouter()
  const { tenant } = useTenant()

  const { data: structure, isLoading, error } = useCourseStructure(courseId)
  const updateCourse = useUpdateCourse(courseId)
  const publishCourse = usePublishCourse(courseId)
  const unpublishCourse = useUnpublishCourse(courseId)

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [thumbnailUrl, setThumbnailUrl] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Initialize form when data loads
  if (structure && !hasUnsavedChanges && title === "") {
    setTitle(structure.course.title)
    setDescription(structure.course.description || "")
    setThumbnailUrl(structure.course.thumbnail_url || "")
  }

  const handleSaveSettings = async () => {
    await updateCourse.mutateAsync({
      title,
      description: description || undefined,
      thumbnail_url: thumbnailUrl || undefined,
    })
    setHasUnsavedChanges(false)
  }

  const handleThumbnailUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0]
    if (!file || !tenant) return

    setIsUploading(true)
    try {
      const api = createTenantApi(tenant.slug)
      const { upload_url } = await api.uploads.presignImage({
        filename: file.name,
        content_type: file.type,
      })

      await fetch(upload_url, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      })

      const finalUrl = upload_url.split("?")[0]
      setThumbnailUrl(finalUrl)
      setHasUnsavedChanges(true)
    } catch (error) {
      console.error("Failed to upload thumbnail:", error)
    } finally {
      setIsUploading(false)
    }
  }

  const handlePublish = async () => {
    await publishCourse.mutateAsync()
  }

  const handleUnpublish = async () => {
    await unpublishCourse.mutateAsync()
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !structure) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h2 className="text-xl font-semibold mb-2">Erro ao carregar curso</h2>
        <p className="text-muted-foreground mb-4">
          Não foi possível carregar os dados do curso.
        </p>
        <Button asChild>
          <Link href="/studio/courses">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Link>
        </Button>
      </div>
    )
  }

  const { course, modules } = structure

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/studio/courses">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{course.title}</h1>
              <Badge
                variant={
                  course.status === "published" ? "default" : "secondary"
                }
              >
                {course.status === "published"
                  ? "Publicado"
                  : course.status === "draft"
                  ? "Rascunho"
                  : "Arquivado"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {course.module_count}{" "}
              {course.module_count === 1 ? "módulo" : "módulos"} •{" "}
              {course.lesson_count}{" "}
              {course.lesson_count === 1 ? "aula" : "aulas"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/courses/${course.id}`} target="_blank">
              <Eye className="h-4 w-4 mr-2" />
              Visualizar
            </Link>
          </Button>
          {course.status === "draft" ? (
            <Button
              size="sm"
              onClick={handlePublish}
              disabled={publishCourse.isPending}
            >
              {publishCourse.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Globe className="h-4 w-4 mr-2" />
              )}
              Publicar
            </Button>
          ) : (
            <Button
              size="sm"
              variant="secondary"
              onClick={handleUnpublish}
              disabled={unpublishCourse.isPending}
            >
              {unpublishCourse.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <GlobeLock className="h-4 w-4 mr-2" />
              )}
              Despublicar
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="content" className="space-y-6">
        <TabsList>
          <TabsTrigger value="content">Conteúdo</TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Configurações
          </TabsTrigger>
        </TabsList>

        {/* Content Tab */}
        <TabsContent value="content" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Módulos e Aulas</CardTitle>
              <CardDescription>
                Organize o conteúdo do seu curso arrastando e soltando os
                elementos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CourseBuilder
                courseId={courseId}
                modules={modules}
                isLoading={isLoading}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações do Curso</CardTitle>
              <CardDescription>
                Configure as informações básicas do seu curso.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Título do Curso</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value)
                    setHasUnsavedChanges(true)
                  }}
                  placeholder="Ex: Curso Completo de JavaScript"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value)
                    setHasUnsavedChanges(true)
                  }}
                  placeholder="Descreva o que os alunos vão aprender..."
                  rows={4}
                />
              </div>

              {/* Thumbnail */}
              <div className="space-y-2">
                <Label>Thumbnail</Label>
                {thumbnailUrl ? (
                  <div className="relative max-w-md">
                    <img
                      src={thumbnailUrl}
                      alt="Thumbnail"
                      className="w-full aspect-video rounded-lg object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setThumbnailUrl("")
                        setHasUnsavedChanges(true)
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed rounded-lg p-8 max-w-md">
                    <label className="flex flex-col items-center justify-center cursor-pointer">
                      {isUploading ? (
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      ) : (
                        <>
                          <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                          <span className="text-sm text-muted-foreground">
                            Clique para fazer upload
                          </span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={handleThumbnailUpload}
                        className="hidden"
                        disabled={isUploading}
                      />
                    </label>
                  </div>
                )}
              </div>

              {/* Save Button */}
              <div className="flex justify-end pt-4">
                <Button
                  onClick={handleSaveSettings}
                  disabled={!hasUnsavedChanges || updateCourse.isPending}
                >
                  {updateCourse.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Salvar Alterações
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
