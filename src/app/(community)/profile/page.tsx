"use client"

import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useTenant } from "@/providers/tenant-provider"
import { useAuth } from "@/hooks/use-auth"
import { createTenantApi } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User, FileText, Calendar, Edit2, Save, X, Loader2 } from "lucide-react"
import Link from "next/link"

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

interface Post {
  id: string
  title: string
  status: string
  created_at: string
}

export default function MyProfilePage() {
  const { tenant } = useTenant()
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const [isEditing, setIsEditing] = useState(false)
  const [displayName, setDisplayName] = useState("")
  const [bio, setBio] = useState("")

  const api = tenant ? createTenantApi(tenant.slug) : null

  // Fetch profile
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile", "me", tenant?.slug],
    queryFn: async () => {
      if (!api) return null
      return api.profile.getMe() as Promise<Profile>
    },
    enabled: !!tenant && !!user,
  })

  // Fetch posts
  const { data: posts } = useQuery({
    queryKey: ["profile", "posts", user?.id, tenant?.slug],
    queryFn: async () => {
      if (!api || !user) return []
      return api.profile.getPosts(user.id) as Promise<Post[]>
    },
    enabled: !!tenant && !!user,
  })

  // Update form when profile loads
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || profile.user_name || "")
      setBio(profile.bio || "")
    }
  }, [profile])

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      if (!api) throw new Error("API not initialized")
      return api.profile.updateMe({ display_name: displayName, bio })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", "me"] })
      setIsEditing(false)
    },
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  }

  const getRoleBadgeColor = (roleSlug: string) => {
    switch (roleSlug) {
      case "owner":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50"
      case "admin":
        return "bg-red-500/20 text-red-400 border-red-500/50"
      case "moderator":
        return "bg-blue-500/20 text-blue-400 border-blue-500/50"
      default:
        return "bg-primary/20 text-primary border-primary/50"
    }
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-2">Acesso restrito</h2>
        <p className="text-muted-foreground mb-4">
          Faça login para ver seu perfil.
        </p>
        <Link href="/login">
          <Button>Fazer login</Button>
        </Link>
      </div>
    )
  }

  if (profileLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Profile Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
              {profile?.user_avatar ? (
                <img
                  src={profile.user_avatar}
                  alt={profile.user_name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-3xl font-bold text-primary-foreground">
                  {(profile?.display_name || profile?.user_name || "U").charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="displayName">Nome de exibição</Label>
                    <Input
                      id="displayName"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Seu nome na comunidade"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <textarea
                      id="bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Conte um pouco sobre você..."
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary min-h-[100px] resize-none"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => updateProfileMutation.mutate()}
                      disabled={updateProfileMutation.isPending}
                    >
                      {updateProfileMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Salvar
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setIsEditing(false)
                        setDisplayName(profile?.display_name || profile?.user_name || "")
                        setBio(profile?.bio || "")
                      }}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl font-bold">
                      {profile?.display_name || profile?.user_name}
                    </h1>
                    <span
                      className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getRoleBadgeColor(
                        profile?.role_slug || ""
                      )}`}
                    >
                      {profile?.role_name}
                    </span>
                  </div>

                  {profile?.bio && (
                    <p className="text-muted-foreground mb-4">{profile.bio}</p>
                  )}

                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      {profile?.post_count || 0} posts
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Membro desde {profile?.joined_at && formatDate(profile.joined_at)}
                    </span>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit2 className="h-4 w-4 mr-2" />
                    Editar perfil
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Posts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Meus Posts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!posts || posts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Você ainda não publicou nenhum post.</p>
              <Link href="/posts">
                <Button variant="outline" className="mt-4">
                  Criar meu primeiro post
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {posts.map((post) => (
                <Link key={post.id} href={`/posts/${post.id}`}>
                  <div className="p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">{post.title}</h3>
                      <span
                        className={`px-2 py-0.5 text-xs rounded-full ${
                          post.status === "published"
                            ? "bg-green-500/20 text-green-400"
                            : "bg-yellow-500/20 text-yellow-400"
                        }`}
                      >
                        {post.status === "published" ? "Publicado" : "Rascunho"}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {formatDate(post.created_at)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
