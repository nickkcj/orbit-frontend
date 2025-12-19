"use client"

import { useState, useRef, useCallback } from "react"
import { Upload, X, Film, CheckCircle, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createTenantApi } from "@/lib/api"

interface VideoUploadProps {
  tenantSlug: string
  onUploadComplete?: (fileKey: string) => void
  onError?: (error: string) => void
  maxSizeMB?: number
}

type UploadStatus = "idle" | "getting-url" | "uploading" | "success" | "error"

const ALLOWED_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-msvideo",
  "video/x-matroska",
]

const ALLOWED_EXTENSIONS = [".mp4", ".webm", ".mov", ".avi", ".mkv"]

export function VideoUpload({
  tenantSlug,
  onUploadComplete,
  onError,
  maxSizeMB = 500,
}: VideoUploadProps) {
  const [status, setStatus] = useState<UploadStatus>("idle")
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileKey, setFileKey] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  const validateFile = (file: File): string | null => {
    // Check type
    if (!ALLOWED_TYPES.includes(file.type)) {
      const ext = file.name.split(".").pop()?.toLowerCase()
      if (!ext || !ALLOWED_EXTENSIONS.includes(`.${ext}`)) {
        return `Formato não suportado. Use: ${ALLOWED_EXTENSIONS.join(", ")}`
      }
    }

    // Check size
    const sizeMB = file.size / (1024 * 1024)
    if (sizeMB > maxSizeMB) {
      return `Arquivo muito grande. Máximo: ${maxSizeMB}MB`
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
    setFileKey(null)
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }, [])

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
    if (!selectedFile) return

    try {
      setStatus("getting-url")
      setProgress(0)

      // Get presigned URL from backend
      const tenantApi = createTenantApi(tenantSlug)
      const { upload_url, file_key } = await tenantApi.uploads.presign({
        filename: selectedFile.name,
        content_type: selectedFile.type || undefined,
      })

      setStatus("uploading")

      // Upload directly to R2
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
          reject(new Error("Network error during upload"))
        })

        xhr.open("PUT", upload_url)
        xhr.setRequestHeader("Content-Type", selectedFile.type || "application/octet-stream")
        xhr.send(selectedFile)
      })

      setStatus("success")
      setFileKey(file_key)
      onUploadComplete?.(file_key)
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
    setFileKey(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024)
    return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(1)} KB`
  }

  return (
    <div className="w-full">
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
            Arraste um vídeo ou clique para selecionar
          </p>
          <p className="text-xs text-muted-foreground">
            MP4, WebM, MOV, AVI, MKV • Máximo {maxSizeMB}MB
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
              {(status === "uploading" || status === "getting-url") && (
                <div className="mt-2">
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {status === "getting-url"
                      ? "Preparando upload..."
                      : `Enviando... ${progress}%`
                    }
                  </p>
                </div>
              )}

              {/* Success */}
              {status === "success" && (
                <div className="flex items-center gap-1 mt-2 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-xs">Upload concluído!</span>
                </div>
              )}

              {/* Error */}
              {status === "error" && error && (
                <div className="flex items-center gap-1 mt-2 text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-xs">{error}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {status === "idle" && (
                <Button size="sm" onClick={uploadFile}>
                  Enviar
                </Button>
              )}
              {(status === "idle" || status === "success" || status === "error") && (
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

      {/* File Key for debugging */}
      {fileKey && (
        <p className="text-xs text-muted-foreground mt-2 font-mono break-all">
          file_key: {fileKey}
        </p>
      )}
    </div>
  )
}
