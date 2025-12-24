"use client"

import { useState, useEffect, useRef } from "react"
import { useQuery } from "@tanstack/react-query"
import { Play, Pause, Volume2, VolumeX, Maximize, Loader2, AlertCircle } from "lucide-react"
import { createTenantApi, Video } from "@/lib/api"
import { Button } from "@/components/ui/button"

interface StreamVideoPlayerProps {
  tenantSlug: string
  videoId: string
  autoPlay?: boolean
  muted?: boolean
  controls?: boolean
  className?: string
}

// Cloudflare Stream customer subdomain - should be configured per account
const STREAM_SUBDOMAIN = process.env.NEXT_PUBLIC_CLOUDFLARE_STREAM_SUBDOMAIN || "customer-abcdefgh"

export function StreamVideoPlayer({
  tenantSlug,
  videoId,
  autoPlay = false,
  muted = false,
  controls = true,
  className = "",
}: StreamVideoPlayerProps) {
  const api = createTenantApi(tenantSlug)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [isPlaying, setIsPlaying] = useState(autoPlay)
  const [isMuted, setIsMuted] = useState(muted)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Fetch video details
  const { data: video, isLoading: videoLoading, error: videoError } = useQuery({
    queryKey: ["video", videoId],
    queryFn: () => api.videos.get(videoId),
  })

  // Fetch playback token
  const { data: tokenData, isLoading: tokenLoading, error: tokenError } = useQuery({
    queryKey: ["video-token", videoId],
    queryFn: () => api.videos.getPlaybackToken(videoId),
    enabled: !!video && video.status === "ready",
    staleTime: 30 * 60 * 1000, // Token valid for 30 minutes
    refetchInterval: 25 * 60 * 1000, // Refresh every 25 minutes
  })

  const isLoading = videoLoading || tokenLoading
  const error = videoError || tokenError

  // Build Cloudflare Stream embed URL with signed token
  const getEmbedUrl = () => {
    if (!tokenData?.token) return null

    const params = new URLSearchParams({
      autoplay: autoPlay ? "true" : "false",
      muted: isMuted ? "true" : "false",
      preload: "auto",
      controls: controls ? "true" : "false",
    })

    // Cloudflare Stream signed URL format
    return `https://${STREAM_SUBDOMAIN}.cloudflarestream.com/${tokenData.token}/iframe?${params.toString()}`
  }

  const toggleFullscreen = () => {
    if (!iframeRef.current) return

    if (!document.fullscreenElement) {
      iframeRef.current.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  // Handle fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange)
  }, [])

  // Loading state
  if (isLoading) {
    return (
      <div className={`relative aspect-video bg-muted rounded-lg flex items-center justify-center ${className}`}>
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className={`relative aspect-video bg-muted rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-center text-muted-foreground">
          <AlertCircle className="h-8 w-8 mx-auto mb-2" />
          <p className="text-sm">Erro ao carregar video</p>
        </div>
      </div>
    )
  }

  // Video still processing
  if (video && video.status !== "ready") {
    return (
      <div className={`relative aspect-video bg-muted rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-center text-muted-foreground">
          <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin" />
          <p className="text-sm">
            {video.status === "processing"
              ? "Processando video..."
              : video.status === "failed"
              ? "Falha no processamento"
              : "Aguardando upload..."}
          </p>
        </div>
      </div>
    )
  }

  const embedUrl = getEmbedUrl()

  if (!embedUrl) {
    return (
      <div className={`relative aspect-video bg-muted rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-center text-muted-foreground">
          <AlertCircle className="h-8 w-8 mx-auto mb-2" />
          <p className="text-sm">Token de reproducao indisponivel</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative aspect-video bg-black rounded-lg overflow-hidden group ${className}`}>
      {/* Cloudflare Stream iframe */}
      <iframe
        ref={iframeRef}
        src={embedUrl}
        className="absolute inset-0 w-full h-full"
        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
      />

      {/* Custom overlay controls (optional - Stream has its own) */}
      {!controls && (
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="lg"
            variant="ghost"
            className="h-16 w-16 rounded-full bg-black/50 hover:bg-black/70"
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? (
              <Pause className="h-8 w-8 text-white" />
            ) : (
              <Play className="h-8 w-8 text-white" />
            )}
          </Button>
        </div>
      )}

      {/* Bottom controls bar */}
      {!controls && (
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                className="text-white hover:bg-white/20"
                onClick={() => setIsMuted(!isMuted)}
              >
                {isMuted ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>
            </div>

            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/20"
              onClick={toggleFullscreen}
            >
              <Maximize className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// Simple thumbnail component for video lists
interface VideoThumbnailProps {
  video: Video
  onClick?: () => void
  className?: string
}

export function VideoThumbnail({ video, onClick, className = "" }: VideoThumbnailProps) {
  const formatDuration = (seconds?: number) => {
    if (!seconds) return "--:--"
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div
      className={`relative aspect-video bg-muted rounded-lg overflow-hidden cursor-pointer group ${className}`}
      onClick={onClick}
    >
      {video.thumbnail_url ? (
        <img
          src={video.thumbnail_url}
          alt={video.title}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <Play className="h-8 w-8 text-muted-foreground" />
        </div>
      )}

      {/* Play overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="h-12 w-12 rounded-full bg-white/90 flex items-center justify-center">
          <Play className="h-6 w-6 text-black ml-1" />
        </div>
      </div>

      {/* Duration badge */}
      {video.duration_seconds && (
        <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/80 rounded text-xs text-white font-medium">
          {formatDuration(video.duration_seconds)}
        </div>
      )}

      {/* Processing badge */}
      {video.status !== "ready" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="text-center text-white">
            <Loader2 className="h-6 w-6 mx-auto mb-1 animate-spin" />
            <span className="text-xs">Processando</span>
          </div>
        </div>
      )}
    </div>
  )
}

// Video card component for lists
interface VideoCardProps {
  video: Video
  tenantSlug: string
  onPlay?: () => void
  onDelete?: () => void
}

export function VideoCard({ video, tenantSlug, onPlay, onDelete }: VideoCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  }

  return (
    <div className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
      <VideoThumbnail video={video} onClick={onPlay} />

      <div className="p-3">
        <h3 className="font-medium text-sm truncate">{video.title}</h3>
        {video.description && (
          <p className="text-xs text-muted-foreground truncate mt-1">
            {video.description}
          </p>
        )}
        <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
          <span>{video.uploader_name}</span>
          <span>{formatDate(video.created_at)}</span>
        </div>
      </div>
    </div>
  )
}
