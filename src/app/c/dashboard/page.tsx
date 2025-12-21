"use client"

import { useQuery } from "@tanstack/react-query"
import { useTenant } from "@/providers/tenant-provider"
import { useAuth } from "@/hooks/use-auth"
import { createTenantApi } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Users,
  FileText,
  MessageCircle,
  Eye,
  TrendingUp,
  Crown,
  BarChart3,
} from "lucide-react"
import Link from "next/link"

interface DashboardData {
  stats: {
    total_members: number
    total_posts: number
    total_comments: number
    total_views: number
  }
  members_growth: { date: string; count: number }[]
  posts_growth: { date: string; count: number }[]
  top_posts: {
    id: string
    title: string
    view_count: number
    like_count: number
    comment_count: number
  }[]
  recent_members: {
    user_id: string
    display_name: string
    user_name: string
    avatar_url?: string
    joined_at: string
  }[]
}

export default function DashboardPage() {
  const { tenant } = useTenant()
  const { user } = useAuth()

  const api = tenant ? createTenantApi(tenant.slug) : null

  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard", tenant?.slug],
    queryFn: async () => {
      if (!api) return null
      return api.analytics.getDashboard() as Promise<DashboardData>
    },
    enabled: !!tenant && !!user,
  })

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M"
    if (num >= 1000) return (num / 1000).toFixed(1) + "K"
    return num.toString()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "numeric",
      month: "short",
    })
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-2">Acesso restrito</h2>
        <p className="text-muted-foreground mb-4">
          Faça login para acessar o dashboard.
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
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h2 className="text-2xl font-bold mb-2">Acesso negado</h2>
        <p className="text-muted-foreground mb-4">
          Apenas administradores podem acessar o dashboard.
        </p>
        <Link href="/">
          <Button>Voltar ao início</Button>
        </Link>
      </div>
    )
  }

  const stats = data?.stats
  const topPosts = data?.top_posts || []
  const recentMembers = data?.recent_members || []

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Visão geral da sua comunidade
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Membros</p>
                <p className="text-3xl font-bold mt-1">
                  {formatNumber(stats?.total_members || 0)}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Posts</p>
                <p className="text-3xl font-bold mt-1">
                  {formatNumber(stats?.total_posts || 0)}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <FileText className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Comentários</p>
                <p className="text-3xl font-bold mt-1">
                  {formatNumber(stats?.total_comments || 0)}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                <MessageCircle className="h-6 w-6 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Visualizações</p>
                <p className="text-3xl font-bold mt-1">
                  {formatNumber(stats?.total_views || 0)}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                <Eye className="h-6 w-6 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Two column layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Posts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Posts mais vistos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topPosts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhum post publicado ainda</p>
              </div>
            ) : (
              <div className="space-y-4">
                {topPosts.map((post, index) => (
                  <Link
                    key={post.id}
                    href={`/posts/${post.id}`}
                    className="block"
                  >
                    <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-primary">
                          {index + 1}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{post.title}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {post.view_count}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="h-3 w-3" />
                            {post.comment_count}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Members */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Membros recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentMembers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhum membro ainda</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentMembers.map((member) => (
                  <Link
                    key={member.user_id}
                    href={`/profile/${member.user_id}`}
                    className="block"
                  >
                    <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
                        {member.avatar_url ? (
                          <img
                            src={member.avatar_url}
                            alt={member.display_name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-sm font-bold text-primary-foreground">
                            {member.display_name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {member.display_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Entrou em {formatDate(member.joined_at)}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Ações rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Link href="/posts">
              <Button variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Criar post
              </Button>
            </Link>
            <Link href="/members">
              <Button variant="outline">
                <Users className="h-4 w-4 mr-2" />
                Ver membros
              </Button>
            </Link>
            <Link href="/settings">
              <Button variant="outline">
                <Crown className="h-4 w-4 mr-2" />
                Configurações
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
