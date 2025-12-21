"use client"

import { useState, useEffect } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useTenant } from "@/providers/tenant-provider"
import { useAuth } from "@/hooks/use-auth"
import { createTenantApi } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Palette, Image as ImageIcon, Upload, Check, Loader2 } from "lucide-react"
import Link from "next/link"

export default function SettingsPage() {
  const { tenant } = useTenant()
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const [primaryColor, setPrimaryColor] = useState("#7c3aed")
  const [accentColor, setAccentColor] = useState("#06b6d4")
  const [bannerUrl, setBannerUrl] = useState("")
  const [logoUrl, setLogoUrl] = useState("")
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)

  const api = tenant ? createTenantApi(tenant.slug) : null

  // Load current settings
  useEffect(() => {
    if (tenant?.settings?.theme) {
      setPrimaryColor(tenant.settings.theme.primaryColor || "#7c3aed")
      setAccentColor(tenant.settings.theme.accentColor || "#06b6d4")
      setBannerUrl(tenant.settings.theme.bannerUrl || "")
    }
    if (tenant?.logo_url) {
      setLogoUrl(tenant.logo_url)
    }
  }, [tenant])

  // Update theme mutation
  const updateThemeMutation = useMutation({
    mutationFn: async () => {
      if (!api) throw new Error("API not initialized")
      return api.settings.updateTheme({
        primaryColor,
        accentColor,
        bannerUrl,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant"] })
    },
  })

  // Update logo mutation
  const updateLogoMutation = useMutation({
    mutationFn: async (url: string) => {
      if (!api) throw new Error("API not initialized")
      return api.settings.updateLogo(url)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant"] })
    },
  })

  // Handle file upload for banner
  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !api) return

    setUploadingBanner(true)
    try {
      // Get presigned URL
      const { upload_url, file_key } = await api.uploads.presign({
        filename: file.name,
        content_type: file.type,
      })

      // Upload to R2
      await fetch(upload_url, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      })

      // Construct the public URL
      const publicUrl = `https://pub-orbit.r2.dev/${file_key}`
      setBannerUrl(publicUrl)
    } catch (error) {
      console.error("Failed to upload banner:", error)
    } finally {
      setUploadingBanner(false)
    }
  }

  // Handle file upload for logo
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !api) return

    setUploadingLogo(true)
    try {
      // Get presigned URL
      const { upload_url, file_key } = await api.uploads.presign({
        filename: file.name,
        content_type: file.type,
      })

      // Upload to R2
      await fetch(upload_url, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      })

      // Construct the public URL and update logo
      const publicUrl = `https://pub-orbit.r2.dev/${file_key}`
      setLogoUrl(publicUrl)
      await updateLogoMutation.mutateAsync(publicUrl)
    } catch (error) {
      console.error("Failed to upload logo:", error)
    } finally {
      setUploadingLogo(false)
    }
  }

  // If not logged in
  if (!user) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-2">Acesso restrito</h2>
        <p className="text-muted-foreground mb-4">
          Faça login para acessar as configurações.
        </p>
        <Link href="/login">
          <Button>Fazer login</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Configurações</h1>
        <p className="text-muted-foreground mt-2">
          Personalize a aparência da sua comunidade
        </p>
      </div>

      {/* Theme Colors */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Cores do Tema
          </CardTitle>
          <CardDescription>
            Escolha as cores principais da sua comunidade
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="primaryColor">Cor Principal</Label>
              <div className="flex gap-2">
                <div
                  className="w-10 h-10 rounded-lg border border-border"
                  style={{ backgroundColor: primaryColor }}
                />
                <Input
                  id="primaryColor"
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-full h-10"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Usada em botões, links e destaques
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="accentColor">Cor de Destaque</Label>
              <div className="flex gap-2">
                <div
                  className="w-10 h-10 rounded-lg border border-border"
                  style={{ backgroundColor: accentColor }}
                />
                <Input
                  id="accentColor"
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="w-full h-10"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Usada em elementos secundários
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Logo
          </CardTitle>
          <CardDescription>
            A logo aparece no header da comunidade
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-xl border border-border bg-muted flex items-center justify-center overflow-hidden">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1">
              <Label htmlFor="logo-upload" className="cursor-pointer">
                <div className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors w-fit">
                  {uploadingLogo ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  <span>Upload Logo</span>
                </div>
                <Input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoUpload}
                  disabled={uploadingLogo}
                />
              </Label>
              <p className="text-xs text-muted-foreground mt-2">
                Recomendado: 200x200px, PNG ou JPG
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Banner */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Banner
          </CardTitle>
          <CardDescription>
            O banner aparece no topo da página da comunidade
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="w-full h-32 rounded-xl border border-border bg-muted flex items-center justify-center overflow-hidden">
              {bannerUrl ? (
                <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover" />
              ) : (
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
            <div className="flex items-center gap-4">
              <Label htmlFor="banner-upload" className="cursor-pointer">
                <div className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors w-fit">
                  {uploadingBanner ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  <span>Upload Banner</span>
                </div>
                <Input
                  id="banner-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleBannerUpload}
                  disabled={uploadingBanner}
                />
              </Label>
              <p className="text-xs text-muted-foreground">
                Recomendado: 1920x400px, PNG ou JPG
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={() => updateThemeMutation.mutate()}
          disabled={updateThemeMutation.isPending}
          size="lg"
        >
          {updateThemeMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : updateThemeMutation.isSuccess ? (
            <>
              <Check className="h-4 w-4 mr-2" />
              Salvo!
            </>
          ) : (
            "Salvar Configurações"
          )}
        </Button>
      </div>
    </div>
  )
}
