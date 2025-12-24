"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Search, Video, Clock, Check, Loader2, AlertCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useTenant } from "@/providers/tenant-provider"
import { createTenantApi, type Video as VideoType } from "@/lib/api"

interface VideoSelectorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (videoId: string, videoTitle: string) => void
  selectedVideoId?: string
}

export function VideoSelector({
  open,
  onOpenChange,
  onSelect,
  selectedVideoId,
}: VideoSelectorProps) {
  const { tenant } = useTenant()
  const api = tenant ? createTenantApi(tenant.slug) : null
  const [search, setSearch] = useState("")

  const { data: videos, isLoading, error } = useQuery({
    queryKey: ["videos", tenant?.slug],
    queryFn: () => api!.videos.list(100, 0),
    enabled: !!api && open,
  })

  const filteredVideos = videos?.filter(
    (video) =>
      video.status === "ready" &&
      video.title.toLowerCase().includes(search.toLowerCase())
  )

  const formatDuration = (seconds?: number) => {
    if (!seconds) return null
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Selecionar Vídeo</DialogTitle>
          <DialogDescription>
            Escolha um vídeo já enviado para adicionar à aula.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar vídeos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <AlertCircle className="h-8 w-8 mb-2" />
              <p>Erro ao carregar vídeos</p>
            </div>
          ) : filteredVideos && filteredVideos.length > 0 ? (
            <div className="space-y-2">
              {filteredVideos.map((video) => (
                <button
                  key={video.id}
                  onClick={() => onSelect(video.id, video.title)}
                  className={`flex w-full items-center gap-3 p-3 rounded-lg border transition-colors hover:bg-muted/50 ${
                    selectedVideoId === video.id
                      ? "border-primary bg-primary/5"
                      : "border-transparent"
                  }`}
                >
                  <div className="relative h-16 w-28 flex-shrink-0 rounded bg-muted overflow-hidden">
                    {video.thumbnail_url ? (
                      <img
                        src={video.thumbnail_url}
                        alt={video.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Video className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    {video.duration_seconds && (
                      <Badge
                        variant="secondary"
                        className="absolute bottom-1 right-1 text-xs"
                      >
                        {formatDuration(video.duration_seconds)}
                      </Badge>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <h4 className="font-medium truncate">{video.title}</h4>
                    {video.description && (
                      <p className="text-sm text-muted-foreground truncate">
                        {video.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Enviado por {video.uploader_name || "Desconhecido"}
                    </p>
                  </div>
                  {selectedVideoId === video.id && (
                    <Check className="h-5 w-5 text-primary flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Video className="h-8 w-8 mb-2" />
              <p>
                {search
                  ? "Nenhum vídeo encontrado"
                  : "Nenhum vídeo disponível"}
              </p>
              <p className="text-xs mt-1">
                Faça upload de vídeos na seção de Mídia
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-2 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
