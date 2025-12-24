"use client"

import { useState, useEffect, useRef } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useTenant } from "@/providers/tenant-provider"
import { useAuth } from "@/hooks/use-auth"
import { createTenantApi } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import {
  Camera,
  User,
  Bell,
  Link2,
  Save,
  Loader2,
  ArrowLeft,
  Check,
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

interface Profile {
  id: string
  user_id: string
  display_name: string | null
  bio: string | null
  user_name: string
  user_avatar: string | null
  role_slug: string
  role_name: string
  post_count: number
  joined_at: string
}

export default function ProfileSettingsPage() {
  const { tenant } = useTenant()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Form state
  const [displayName, setDisplayName] = useState("")
  const [bio, setBio] = useState("")
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  // Social links
  const [twitter, setTwitter] = useState("")
  const [linkedin, setLinkedin] = useState("")
  const [github, setGithub] = useState("")

  // Notification prefs
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(true)

  const api = tenant ? createTenantApi(tenant.slug) : null

  // Fetch profile
  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", "me", tenant?.slug],
    queryFn: async () => {
      if (!api) return null
      return api.profile.getMe() as Promise<Profile>
    },
    enabled: !!tenant && !!user,
  })

  // Load profile data into form
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || profile.user_name || "")
      setBio(profile.bio || "")
      setAvatarUrl(profile.user_avatar)
      setAvatarPreview(profile.user_avatar)
    }
  }, [profile])

  // Update profile mutation
  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!api) throw new Error("API not initialized")
      return api.profile.updateMe({
        display_name: displayName,
        bio,
        avatar_url: avatarUrl || undefined,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", "me"] })
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] })
      toast.success("Perfil atualizado com sucesso!")
    },
    onError: () => {
      toast.error("Erro ao atualizar perfil")
    },
  })

  // Avatar upload handler
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !api) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione uma imagem")
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("A imagem deve ter no maximo 5MB")
      return
    }

    // Show preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setAvatarPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    setUploadingAvatar(true)
    try {
      // Get presigned URL
      const { upload_url, file_key } = await api.uploads.presignImage({
        filename: file.name,
        content_type: file.type,
      })

      // Upload to R2
      await fetch(upload_url, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      })

      // Get public URL
      const publicUrl = `https://pub-f7d49cbbe51b47b0b7e77d1e0c422cf9.r2.dev/${file_key}`
      setAvatarUrl(publicUrl)
      toast.success("Foto enviada com sucesso!")
    } catch (error) {
      console.error("Failed to upload avatar:", error)
      toast.error("Erro ao enviar foto")
      setAvatarPreview(avatarUrl)
    } finally {
      setUploadingAvatar(false)
    }
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">
          Faca login para acessar as configuracoes.
        </p>
        <Link href="/login">
          <Button>Fazer login</Button>
        </Link>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/profile">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Configuracoes do Perfil</h1>
          <p className="text-muted-foreground">
            Gerencie suas informacoes pessoais
          </p>
        </div>
      </div>

      {/* Avatar Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Foto do Perfil
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={avatarPreview || undefined} />
                <AvatarFallback className="text-2xl bg-gradient-to-br from-primary to-accent text-primary-foreground">
                  {displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <Button
                size="icon"
                variant="outline"
                className="absolute bottom-0 right-0 h-8 w-8 rounded-full"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
              >
                {uploadingAvatar ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
            </div>
            <div className="text-sm text-muted-foreground">
              <p>Clique no icone para alterar sua foto.</p>
              <p>Formatos aceitos: JPG, PNG, GIF, WebP (max 5MB)</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Informacoes Basicas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">Nome de exibicao</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Como voce quer ser chamado"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Conte um pouco sobre voce..."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Social Links */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Links Sociais
          </CardTitle>
          <CardDescription>
            Adicione links para suas redes sociais (em breve)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="twitter">Twitter/X</Label>
            <Input
              id="twitter"
              value={twitter}
              onChange={(e) => setTwitter(e.target.value)}
              placeholder="https://twitter.com/usuario"
              disabled
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="linkedin">LinkedIn</Label>
            <Input
              id="linkedin"
              value={linkedin}
              onChange={(e) => setLinkedin(e.target.value)}
              placeholder="https://linkedin.com/in/usuario"
              disabled
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="github">GitHub</Label>
            <Input
              id="github"
              value={github}
              onChange={(e) => setGithub(e.target.value)}
              placeholder="https://github.com/usuario"
              disabled
            />
          </div>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Preferencias de Notificacao
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Notificacoes por email</p>
              <p className="text-sm text-muted-foreground">
                Receba atualizacoes importantes por email
              </p>
            </div>
            <Switch
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
              disabled
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Notificacoes push</p>
              <p className="text-sm text-muted-foreground">
                Receba notificacoes em tempo real
              </p>
            </div>
            <Switch
              checked={pushNotifications}
              onCheckedChange={setPushNotifications}
              disabled
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end pb-6">
        <Button
          onClick={() => updateMutation.mutate()}
          disabled={updateMutation.isPending}
          size="lg"
        >
          {updateMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Salvar alteracoes
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
