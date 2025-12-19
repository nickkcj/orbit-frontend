"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useTenant } from "@/providers/tenant-provider"
import { createTenantApi } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, MessageCircle, Clock, User } from "lucide-react"
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

export default function PostsPage() {
  const { tenant } = useTenant()
  const [showCreateModal, setShowCreateModal] = useState(false)

  const { data: posts, isLoading } = useQuery({
    queryKey: ["posts", tenant?.slug],
    queryFn: async () => {
      if (!tenant) return []
      const api = createTenantApi(tenant.slug)
      return api.posts.list(20, 0)
    },
    enabled: !!tenant,
  })

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("pt-BR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Posts</h1>
          <p className="text-muted-foreground mt-1">
            Conteúdo exclusivo da comunidade
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Post
        </Button>
      </div>

      {/* Posts list */}
      {!posts || posts.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Nenhum post ainda</h3>
            <p className="text-muted-foreground mb-4">
              Seja o primeiro a publicar conteúdo nesta comunidade.
            </p>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar primeiro post
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {posts.map((post: Post) => (
            <Link key={post.id} href={`/posts/${post.id}`}>
              <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h2 className="text-xl font-semibold mb-2 truncate">
                        {post.title}
                      </h2>
                      <p className="text-muted-foreground line-clamp-2 mb-4">
                        {post.content}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {post.author_name || "Autor"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {formatDate(post.created_at)}
                        </span>
                        {post.category_name && (
                          <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs">
                            {post.category_name}
                          </span>
                        )}
                      </div>
                    </div>
                    {post.status === "draft" && (
                      <span className="px-2 py-1 bg-yellow-500/10 text-yellow-500 rounded text-xs font-medium">
                        Rascunho
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Create Modal - simplified inline form for now */}
      {showCreateModal && (
        <CreatePostModal
          tenantSlug={tenant?.slug || ""}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  )
}

function CreatePostModal({
  tenantSlug,
  onClose,
}: {
  tenantSlug: string
  onClose: () => void
}) {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) return

    setIsSubmitting(true)
    try {
      const api = createTenantApi(tenantSlug)
      await api.posts.create({ title, content })
      window.location.reload()
    } catch (error) {
      console.error("Failed to create post:", error)
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl">
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold mb-6">Novo Post</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Título</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Título do post"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Conteúdo</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary min-h-[200px] resize-none"
                placeholder="Escreva o conteúdo do seu post..."
                required
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Publicando..." : "Publicar"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
