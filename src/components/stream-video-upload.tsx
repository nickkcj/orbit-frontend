"use client"

import { useState, useRef, useCallback } from "react"
import { Upload, X, Film, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createTenantApi, VideoUploadResponse } from "@/lib/api"

interface StreamVideoUploadProps {
  tenantSlug: string
  onUploadComplete?: (videoId: string) => void
  onError?: (error: string) => void
  maxSizeMB?: number
}

type UploadStatus =
  | "idle"
  | "getting-url"
  | "uploading"
  | "confirming"
  | "processing"
  | "success"
  | "error"

const ALLOWED_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-msvideo",
  "video/x-matroska",
]

const ALLOWED_EXTENSIONS = [".mp4", ".webm", ".mov", ".avi", ".mkv"]

export function StreamVideoUpload({
  tenantSlug,
  onUploadComplete,
  onError,
  maxSizeMB = 500,
}: StreamVideoUploadProps) {
  const [status, setStatus] = useState<UploadStatus>("idle")
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [videoId, setVideoId] = useState<string | null>(null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      const ext = file.name.split(".").pop()?.toLowerCase()
      if (!ext || !ALLOWED_EXTENSIONS.includes(`.${ext}`)) {
        return `Formato nao suportado. Use: ${ALLOWED_EXTENSIONS.join(", ")}`
      }
    }

    const sizeMB = file.size / (1024 * 1024)
    if (sizeMB > maxSizeMB) {
      return `Arquivo muito grande. Maximo: ${maxSizeMB}MB`
    }

    return null
  }

  const handleFileSelect = (file: File) => {
    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      onError?.(validationError)
      return
    }

    setError(null)
    setSelectedFile(file)
    setStatus("idle")
    setProgress(0)
    setVideoId(null)

    // Auto-fill title from filename
    if (!title) {
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "")
      setTitle(nameWithoutExt)
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }, [title])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const uploadFile = async () => {
    if (!selectedFile || !title.trim()) {
      setError("Titulo e obrigatorio")
      return
    }

    try {
      setStatus("getting-url")
      setProgress(0)
      setError(null)

      const tenantApi = createTenantApi(tenantSlug)

      // Step 1: Get upload URL from backend
      const uploadData: VideoUploadResponse = await tenantApi.videos.initiateUpload({
        title: title.trim(),
        description: description.trim() || undefined,
      })

      setVideoId(uploadData.video_id)
      setStatus("uploading")

      // Step 2: Upload directly to Cloudflare Stream
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()

        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            const percent = Math.round((e.loaded / e.total) * 100)
            setProgress(percent)
          }
        })

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve()
          } else {
            reject(new Error(`Upload failed: ${xhr.status}`))
          }
        })

        xhr.addEventListener("error", () => {
          reject(new Error("Erro de rede durante upload"))
        })

        // Cloudflare Stream direct upload expects multipart form data
        const formData = new FormData()
        formData.append("file", selectedFile)

        xhr.open("POST", uploadData.upload_url)
        xhr.send(formData)
      })

      // Step 3: Confirm upload with backend
      setStatus("confirming")
      await tenantApi.videos.confirmUpload(uploadData.video_id, uploadData.stream_uid)

      setStatus("processing")

      // The video is now processing on Cloudflare Stream
      // Webhook will update status when ready
      setTimeout(() => {
        setStatus("success")
        onUploadComplete?.(uploadData.video_id)
      }, 1000)

    } catch (err) {
      setStatus("error")
      const message = err instanceof Error ? err.message : "Erro ao fazer upload"
      setError(message)
      onError?.(message)
    }
  }

  const reset = () => {
    setStatus("idle")
    setProgress(0)
    setError(null)
    setSelectedFile(null)
    setVideoId(null)
    setTitle("")
    setDescription("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024)
    return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(1)} KB`
  }

  const getStatusMessage = () => {
    switch (status) {
      case "getting-url":
        return "Preparando upload..."
      case "uploading":
        return `Enviando... ${progress}%`
      case "confirming":
        return "Confirmando upload..."
      case "processing":
        return "Processando video... Isso pode levar alguns minutos."
      case "success":
        return "Video enviado com sucesso!"
      case "error":
        return error || "Erro ao enviar video"
      default:
        return ""
    }
  }

  const isUploading = ["getting-url", "uploading", "confirming", "processing"].includes(status)

  return (
    <div className="w-full space-y-4">
      {/* Title Input */}
      <div className="space-y-2">
        <Label htmlFor="video-title">Titulo do Video *</Label>
        <Input
          id="video-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Digite o titulo do video"
          disabled={isUploading}
        />
      </div>

      {/* Description Input */}
      <div className="space-y-2">
        <Label htmlFor="video-description">Descricao (opcional)</Label>
        <Input
          id="video-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Digite uma descricao"
          disabled={isUploading}
        />
      </div>

      {/* Drop Zone */}
      {!selectedFile && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${isDragOver
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary/50"
            }
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={ALLOWED_EXTENSIONS.join(",")}
            onChange={handleInputChange}
            className="hidden"
          />
          <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-sm font-medium mb-1">
            Arraste um video ou clique para selecionar
          </p>
          <p className="text-xs text-muted-foreground">
            MP4, WebM, MOV, AVI, MKV - Maximo {maxSizeMB}MB
          </p>
        </div>
      )}

      {/* Selected File */}
      {selectedFile && (
        <div className="border rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-muted rounded">
              <Film className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{selectedFile.name}</p>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(selectedFile.size)}
              </p>

              {/* Progress Bar */}
              {isUploading && (
                <div className="mt-2">
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${status === "uploading" ? progress : 100}%` }}
                    />
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <p className="text-xs text-muted-foreground">
                      {getStatusMessage()}
                    </p>
                  </div>
                </div>
              )}

              {/* Success */}
              {status === "success" && (
                <div className="flex items-center gap-1 mt-2 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-xs">{getStatusMessage()}</span>
                </div>
              )}

              {/* Error */}
              {status === "error" && (
                <div className="flex items-center gap-1 mt-2 text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-xs">{getStatusMessage()}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {status === "idle" && (
                <Button
                  size="sm"
                  onClick={uploadFile}
                  disabled={!title.trim()}
                >
                  Enviar
                </Button>
              )}
              {!isUploading && (
                <Button size="sm" variant="ghost" onClick={reset}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Validation Error (without file selected) */}
      {error && !selectedFile && (
        <div className="flex items-center gap-1 mt-2 text-destructive">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Video ID for debugging */}
      {videoId && status === "success" && (
        <p className="text-xs text-muted-foreground mt-2 font-mono">
          video_id: {videoId}
        </p>
      )}
    </div>
  )
}
