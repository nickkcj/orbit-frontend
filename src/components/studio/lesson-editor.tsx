"use client"

import { useState, useEffect } from "react"
import { Loader2, Video, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { VideoSelector } from "./video-selector"
import type { Lesson, CreateLessonRequest, UpdateLessonRequest } from "@/lib/types/course"

interface LessonEditorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  lesson?: Lesson
  onSave: (data: CreateLessonRequest | UpdateLessonRequest) => Promise<void>
  isLoading?: boolean
}

export function LessonEditor({
  open,
  onOpenChange,
  lesson,
  onSave,
  isLoading,
}: LessonEditorProps) {
  const isEditing = !!lesson
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [content, setContent] = useState("")
  const [contentFormat, setContentFormat] = useState<string>("markdown")
  const [videoId, setVideoId] = useState<string | undefined>()
  const [videoTitle, setVideoTitle] = useState<string | undefined>()
  const [durationMinutes, setDurationMinutes] = useState<number | undefined>()
  const [isFreePreview, setIsFreePreview] = useState(false)
  const [showVideoSelector, setShowVideoSelector] = useState(false)

  useEffect(() => {
    if (open && lesson) {
      setTitle(lesson.title)
      setDescription(lesson.description || "")
      setContent(lesson.content || "")
      setContentFormat(lesson.content_format || "markdown")
      setVideoId(lesson.video_id)
      setVideoTitle(lesson.video_title)
      setDurationMinutes(lesson.duration_minutes)
      setIsFreePreview(lesson.is_free_preview)
    } else if (open) {
      setTitle("")
      setDescription("")
      setContent("")
      setContentFormat("markdown")
      setVideoId(undefined)
      setVideoTitle(undefined)
      setDurationMinutes(undefined)
      setIsFreePreview(false)
    }
  }, [open, lesson])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSave({
      title,
      description: description || undefined,
      content: content || undefined,
      content_format: contentFormat,
      video_id: videoId,
      duration_minutes: durationMinutes,
      is_free_preview: isFreePreview,
    })
    onOpenChange(false)
  }

  const handleVideoSelect = (id: string, title: string) => {
    setVideoId(id)
    setVideoTitle(title)
    setShowVideoSelector(false)
  }

  const handleRemoveVideo = () => {
    setVideoId(undefined)
    setVideoTitle(undefined)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Editar Aula" : "Nova Aula"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Atualize as informações da aula."
                : "Adicione uma nova aula ao módulo."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Bem-vindo ao curso"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição (opcional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Uma breve descrição do que será abordado..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Vídeo</Label>
              {videoId ? (
                <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                  <Video className="h-5 w-5 text-primary" />
                  <span className="flex-1 text-sm truncate">
                    {videoTitle || videoId}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={handleRemoveVideo}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowVideoSelector(true)}
                >
                  <Video className="h-4 w-4 mr-2" />
                  Selecionar Vídeo
                </Button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contentFormat">Formato do Conteúdo</Label>
                <Select value={contentFormat} onValueChange={setContentFormat}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="markdown">Markdown</SelectItem>
                    <SelectItem value="html">HTML</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duração (minutos)</Label>
                <Input
                  id="duration"
                  type="number"
                  min={0}
                  value={durationMinutes || ""}
                  onChange={(e) =>
                    setDurationMinutes(
                      e.target.value ? parseInt(e.target.value) : undefined
                    )
                  }
                  placeholder="Ex: 15"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Conteúdo (opcional)</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Conteúdo adicional da aula em formato texto..."
                rows={4}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-muted rounded-md">
              <div>
                <Label htmlFor="freePreview" className="font-medium">
                  Aula Gratuita
                </Label>
                <p className="text-xs text-muted-foreground">
                  Permitir visualização sem matrícula
                </p>
              </div>
              <Switch
                id="freePreview"
                checked={isFreePreview}
                onCheckedChange={setIsFreePreview}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading || !title.trim()}>
                {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isEditing ? "Salvar" : "Criar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <VideoSelector
        open={showVideoSelector}
        onOpenChange={setShowVideoSelector}
        onSelect={handleVideoSelect}
      />
    </>
  )
}
