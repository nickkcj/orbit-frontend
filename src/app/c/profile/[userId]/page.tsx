"use client"

import { useQuery } from "@tanstack/react-query"
import { useParams } from "next/navigation"
import { useTenant } from "@/providers/tenant-provider"
import { useAuth } from "@/hooks/use-auth"
import { createTenantApi } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { User, FileText, Calendar, ArrowLeft } from "lucide-react"
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
  published_at: string | null
}

export default function UserProfilePage() {
  const params = useParams()
  const userId = params.userId as string
  const { tenant } = useTenant()
  const { user } = useAuth()

  const api = tenant ? createTenantApi(tenant.slug) : null

  // Redirect to own profile if viewing self
  const isOwnProfile = user?.id === userId

  // Fetch profile
  const { data: profile, isLoading: profileLoading, error } = useQuery({
    queryKey: ["profile", userId, tenant?.slug],
    queryFn: async () => {
      if (!api) return null
      return api.profile.get(userId) as Promise<Profile>
    },
    enabled: !!tenant && !!userId,
  })

  // Fetch public posts
  const { data: posts } = useQuery({
    queryKey: ["profile", "posts", userId, tenant?.slug],
    queryFn: async () => {
      if (!api) return []
      const allPosts = await api.profile.getPosts(userId) as Post[]
      // Only show published posts for public profiles
      return allPosts.filter((p) => p.status === "published")
    },
    enabled: !!tenant && !!userId,
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

  if (profileLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="text-center py-12">
        <User className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h2 className="text-2xl font-bold mb-2">Perfil não encontrado</h2>
        <p className="text-muted-foreground mb-4">
          Este usuário não existe ou não faz parte desta comunidade.
        </p>
        <Link href="/members">
          <Button>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Ver membros
          </Button>
        </Link>
      </div>
    )
  }

  // If viewing own profile, show link to edit
  if (isOwnProfile) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">
            Este é o seu perfil.
          </p>
          <Link href="/profile">
            <Button>Ver e editar meu perfil</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back button */}
      <Link href="/members">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Membros
        </Button>
      </Link>

      {/* Profile Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
              {profile.user_avatar ? (
                <img
                  src={profile.user_avatar}
                  alt={profile.user_name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-3xl font-bold text-primary-foreground">
                  {(profile.display_name || profile.user_name || "U").charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold">
                  {profile.display_name || profile.user_name}
                </h1>
                <span
                  className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getRoleBadgeColor(
                    profile.role_slug
                  )}`}
                >
                  {profile.role_name}
                </span>
              </div>

              {profile.bio && (
                <p className="text-muted-foreground mb-4">{profile.bio}</p>
              )}

              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  {profile.post_count || 0} posts
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Membro desde {formatDate(profile.joined_at)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Posts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Posts de {profile.display_name || profile.user_name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!posts || posts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Este usuário ainda não publicou nenhum post.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {posts.map((post) => (
                <Link key={post.id} href={`/posts/${post.id}`}>
                  <div className="p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                    <h3 className="font-medium">{post.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {post.published_at
                        ? formatDate(post.published_at)
                        : formatDate(post.created_at)}
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
