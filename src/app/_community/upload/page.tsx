"use client"

import { VideoUpload } from "@/components/video-upload"
import { useTenant } from "@/providers/tenant-provider"

export default function UploadTestPage() {
  const { tenant, isLoading } = useTenant()

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

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Upload de Vídeo</h1>
      <p className="text-muted-foreground mb-8">
        Teste de upload direto para Cloudflare R2
      </p>

      <VideoUpload
        tenantSlug={tenant.slug}
        onUploadComplete={(fileKey) => {
          console.log("Upload complete:", fileKey)
        }}
        onError={(error) => {
          console.error("Upload error:", error)
        }}
      />
    </div>
  )
}
