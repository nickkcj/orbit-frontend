"use client"

import { useState } from "react"
import { VideoUpload } from "@/components/video-upload"
import { useTenant } from "@/providers/tenant-provider"

const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "https://pub-orbit-videos.r2.dev"

export default function UploadTestPage() {
  const { tenant, isLoading } = useTenant()
  const [uploadedVideoKey, setUploadedVideoKey] = useState<string | null>(null)

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!tenant) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Tenant não encontrado</p>
      </div>
    )
  }

  const videoUrl = uploadedVideoKey ? `${R2_PUBLIC_URL}/${uploadedVideoKey}` : null

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Upload de Vídeo</h1>
      <p className="text-muted-foreground mb-8">
        Faça upload de vídeos para sua comunidade
      </p>

      <VideoUpload
        tenantSlug={tenant.slug}
        onUploadComplete={(fileKey) => {
          console.log("Upload complete:", fileKey)
          setUploadedVideoKey(fileKey)
        }}
        onError={(error) => {
          console.error("Upload error:", error)
        }}
      />

      {/* Show uploaded video */}
      {videoUrl && (
        <div className="mt-8 space-y-4">
          <h2 className="text-lg font-semibold">Vídeo Enviado</h2>
          <div className="aspect-video bg-black rounded-lg overflow-hidden">
            <video
              src={videoUrl}
              controls
              className="w-full h-full"
            >
              Seu navegador não suporta vídeos.
            </video>
          </div>
          <p className="text-xs text-muted-foreground break-all">
            URL: {videoUrl}
          </p>
        </div>
      )}
    </div>
  )
}
