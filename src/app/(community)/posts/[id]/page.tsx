"use client"

import { useQuery } from "@tanstack/react-query"
import { useParams } from "next/navigation"
import { useTenant } from "@/providers/tenant-provider"
import { createTenantApi } from "@/lib/api"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Clock, User, MessageCircle } from "lucide-react"
import Link from "next/link"

interface Post {
  id: string
  title: string
  content: string
  status: string
  author_id: string
  author_name?: string
  category_id?: string
  category_name?: string
  created_at: string
  updated_at: string
}

export default function PostDetailPage() {
  const params = useParams()
  const postId = params.id as string
  const { tenant } = useTenant()

  const { data: post, isLoading } = useQuery({
    queryKey: ["post", tenant?.slug, postId],
    queryFn: async () => {
      if (!tenant) return null
      const api = createTenantApi(tenant.slug)
      return api.posts.get(postId)
    },
    enabled: !!tenant && !!postId,
  })

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("pt-BR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!post) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-2">Post não encontrado</h2>
        <p className="text-muted-foreground mb-4">
          Este post não existe ou foi removido.
        </p>
        <Link href="/posts">
          <Button>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para posts
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back button */}
      <Link href="/posts">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
      </Link>

      {/* Post content */}
      <article>
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
          <div className="flex items-center gap-4 text-muted-foreground">
            <span className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <User className="h-4 w-4 text-primary-foreground" />
              </div>
              {(post as Post).author_name || "Autor"}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {formatDate(post.created_at)}
            </span>
            {(post as Post).category_name && (
              <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                {(post as Post).category_name}
              </span>
            )}
          </div>
        </header>

        <div className="prose prose-invert max-w-none">
          <p className="text-lg leading-relaxed whitespace-pre-wrap">
            {post.content}
          </p>
        </div>
      </article>

      {/* Comments section */}
      <Card className="mt-12">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <MessageCircle className="h-5 w-5" />
            <h2 className="text-xl font-semibold">Comentários</h2>
          </div>
          <div className="text-center py-8 text-muted-foreground">
            <p>Nenhum comentário ainda.</p>
            <p className="text-sm mt-1">Seja o primeiro a comentar!</p>
          </div>
          <div className="mt-4">
            <textarea
              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary min-h-[100px] resize-none"
              placeholder="Escreva um comentário..."
            />
            <div className="flex justify-end mt-2">
              <Button>Comentar</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
