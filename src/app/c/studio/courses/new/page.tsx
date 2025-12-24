"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Loader2, Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useCreateCourse } from "@/hooks/use-courses"
import { useTenant } from "@/providers/tenant-provider"
import { createTenantApi } from "@/lib/api"

export default function NewCoursePage() {
  const router = useRouter()
  const { tenant } = useTenant()
  const createCourse = useCreateCourse()

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [thumbnailUrl, setThumbnailUrl] = useState("")
  const [isUploading, setIsUploading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const course = await createCourse.mutateAsync({
      title,
      description: description || undefined,
      thumbnail_url: thumbnailUrl || undefined,
    })

    router.push(`/studio/courses/${course.id}/edit`)
  }

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !tenant) return

    setIsUploading(true)
    try {
      const api = createTenantApi(tenant.slug)
      const { upload_url } = await api.uploads.presignImage({
        filename: file.name,
        content_type: file.type,
      })

      // Upload to presigned URL
      await fetch(upload_url, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      })

      // Extract the final URL (without query params)
      const finalUrl = upload_url.split("?")[0]
      setThumbnailUrl(finalUrl)
    } catch (error) {
      console.error("Failed to upload thumbnail:", error)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back Button */}
      <Button variant="ghost" size="sm" asChild>
        <Link href="/studio/courses">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Link>
      </Button>

      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle>Novo Curso</CardTitle>
          <CardDescription>
            Crie um novo curso para sua comunidade. Você poderá adicionar módulos e aulas depois.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Título do Curso *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Curso Completo de JavaScript"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva o que os alunos vão aprender neste curso..."
                rows={4}
              />
            </div>

            {/* Thumbnail */}
            <div className="space-y-2">
              <Label>Thumbnail</Label>
              {thumbnailUrl ? (
                <div className="relative">
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
                    onClick={() => setThumbnailUrl("")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-dashed rounded-lg p-8">
                  <label className="flex flex-col items-center justify-center cursor-pointer">
                    {isUploading ? (
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    ) : (
                      <>
                        <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                        <span className="text-sm text-muted-foreground">
                          Clique para fazer upload
                        </span>
                        <span className="text-xs text-muted-foreground mt-1">
                          PNG, JPG ou WebP (16:9 recomendado)
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

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/studio/courses")}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={!title.trim() || createCourse.isPending}
              >
                {createCourse.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Criar Curso
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
