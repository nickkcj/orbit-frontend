"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useParams } from "next/navigation"
import { useTenant } from "@/providers/tenant-provider"
import { createTenantApi } from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Clock, User, MessageCircle, Reply, ChevronDown, ChevronUp, Heart } from "lucide-react"
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
  video_url?: string
  created_at: string
  updated_at: string
}

interface Comment {
  id: string
  post_id: string
  author_id: string
  author_name?: string
  author_avatar?: string
  content: string
  parent_id?: string
  reply_count: number
  like_count: number
  created_at: string
}

export default function PostDetailPage() {
  const params = useParams()
  const postId = params.id as string
  const { tenant } = useTenant()
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const [newComment, setNewComment] = useState("")
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState("")
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set())

  const api = tenant ? createTenantApi(tenant.slug) : null

  // Fetch post
  const { data: post, isLoading: postLoading } = useQuery({
    queryKey: ["post", tenant?.slug, postId],
    queryFn: async () => {
      if (!api) return null
      return api.posts.get(postId)
    },
    enabled: !!tenant && !!postId,
  })

  // Fetch comments
  const { data: comments, isLoading: commentsLoading } = useQuery({
    queryKey: ["comments", tenant?.slug, postId],
    queryFn: async () => {
      if (!api) return []
      return api.comments.listByPost(postId)
    },
    enabled: !!tenant && !!postId,
  })

  // Fetch like status
  const { data: likeStatus } = useQuery({
    queryKey: ["postLike", tenant?.slug, postId],
    queryFn: async () => {
      if (!api || !user) return { liked: false, like_count: 0 }
      return api.likes.getPostLikeStatus(postId)
    },
    enabled: !!tenant && !!postId && !!user,
  })

  // Like/unlike mutation
  const likeMutation = useMutation({
    mutationFn: async () => {
      if (!api) throw new Error("API not initialized")
      if (likeStatus?.liked) {
        return api.likes.unlikePost(postId)
      } else {
        return api.likes.likePost(postId)
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["postLike", tenant?.slug, postId], data)
    },
  })

  // Create comment mutation
  const createCommentMutation = useMutation({
    mutationFn: async (data: { content: string; parent_id?: string }) => {
      if (!api) throw new Error("API not initialized")
      return api.comments.create({
        post_id: postId,
        content: data.content,
        parent_id: data.parent_id,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", tenant?.slug, postId] })
      setNewComment("")
      setReplyContent("")
      setReplyingTo(null)
    },
  })

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return
    createCommentMutation.mutate({ content: newComment })
  }

  const handleSubmitReply = (parentId: string) => {
    if (!replyContent.trim()) return
    createCommentMutation.mutate({ content: replyContent, parent_id: parentId })
  }

  const toggleReplies = (commentId: string) => {
    const newExpanded = new Set(expandedReplies)
    if (newExpanded.has(commentId)) {
      newExpanded.delete(commentId)
    } else {
      newExpanded.add(commentId)
    }
    setExpandedReplies(newExpanded)
  }

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

  const formatRelativeDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return "agora"
    if (minutes < 60) return `${minutes}min`
    if (hours < 24) return `${hours}h`
    if (days < 7) return `${days}d`
    return date.toLocaleDateString("pt-BR")
  }

  if (postLoading) {
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

      {/* Video Player */}
      {(post as Post).video_url && (
        <div className="aspect-video bg-black rounded-lg overflow-hidden">
          <video
            src={(post as Post).video_url}
            controls
            className="w-full h-full"
            poster={(post as Post).cover_image_url}
          >
            Seu navegador não suporta vídeos.
          </video>
        </div>
      )}

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

        {/* Like button */}
        <div className="flex items-center gap-4 mt-8 pt-6 border-t border-border">
          <Button
            variant={likeStatus?.liked ? "default" : "outline"}
            size="sm"
            onClick={() => likeMutation.mutate()}
            disabled={!user || likeMutation.isPending}
            className="gap-2"
          >
            <Heart
              className={`h-4 w-4 ${likeStatus?.liked ? "fill-current" : ""}`}
            />
            {likeStatus?.like_count || (post as any).like_count || 0}
          </Button>
          {!user && (
            <span className="text-sm text-muted-foreground">
              <Link href="/login" className="text-primary hover:underline">
                Faça login
              </Link>{" "}
              para curtir
            </span>
          )}
        </div>
      </article>

      {/* Comments section */}
      <Card className="mt-12">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <MessageCircle className="h-5 w-5" />
            <h2 className="text-xl font-semibold">
              Comentários {comments?.length > 0 && `(${comments.length})`}
            </h2>
          </div>

          {/* New comment form */}
          {user ? (
            <form onSubmit={handleSubmitComment} className="mb-6">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary min-h-[100px] resize-none"
                placeholder="Escreva um comentário..."
              />
              <div className="flex justify-end mt-2">
                <Button
                  type="submit"
                  disabled={!newComment.trim() || createCommentMutation.isPending}
                >
                  {createCommentMutation.isPending ? "Enviando..." : "Comentar"}
                </Button>
              </div>
            </form>
          ) : (
            <div className="mb-6 p-4 bg-muted/50 rounded-lg text-center">
              <p className="text-muted-foreground">
                <Link href="/login" className="text-primary hover:underline">
                  Faça login
                </Link>{" "}
                para comentar
              </p>
            </div>
          )}

          {/* Comments list */}
          {commentsLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : !comments || comments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhum comentário ainda.</p>
              <p className="text-sm mt-1">Seja o primeiro a comentar!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment: Comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  api={api}
                  user={user}
                  tenantSlug={tenant?.slug || ""}
                  replyingTo={replyingTo}
                  setReplyingTo={setReplyingTo}
                  replyContent={replyContent}
                  setReplyContent={setReplyContent}
                  handleSubmitReply={handleSubmitReply}
                  isSubmitting={createCommentMutation.isPending}
                  expandedReplies={expandedReplies}
                  toggleReplies={toggleReplies}
                  formatRelativeDate={formatRelativeDate}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

interface CommentItemProps {
  comment: Comment
  api: ReturnType<typeof createTenantApi> | null
  user: { id: string; name: string; email: string } | null
  tenantSlug: string
  replyingTo: string | null
  setReplyingTo: (id: string | null) => void
  replyContent: string
  setReplyContent: (content: string) => void
  handleSubmitReply: (parentId: string) => void
  isSubmitting: boolean
  expandedReplies: Set<string>
  toggleReplies: (id: string) => void
  formatRelativeDate: (date: string) => string
}

function CommentItem({
  comment,
  api,
  user,
  tenantSlug,
  replyingTo,
  setReplyingTo,
  replyContent,
  setReplyContent,
  handleSubmitReply,
  isSubmitting,
  expandedReplies,
  toggleReplies,
  formatRelativeDate,
}: CommentItemProps) {
  const isExpanded = expandedReplies.has(comment.id)
  const queryClient = useQueryClient()

  // Fetch replies when expanded
  const { data: replies } = useQuery({
    queryKey: ["replies", comment.id],
    queryFn: async () => {
      if (!api) return []
      return api.comments.getReplies(comment.id)
    },
    enabled: isExpanded && comment.reply_count > 0,
  })

  // Comment like status
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(comment.like_count || 0)

  // Like/unlike comment mutation
  const likeCommentMutation = useMutation({
    mutationFn: async () => {
      if (!api) throw new Error("API not initialized")
      if (liked) {
        return api.likes.unlikeComment(comment.id)
      } else {
        return api.likes.likeComment(comment.id)
      }
    },
    onSuccess: (data) => {
      setLiked(data.liked)
      setLikeCount(data.like_count)
    },
  })

  return (
    <div className="border-l-2 border-border pl-4">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
          <span className="text-xs font-semibold text-primary-foreground">
            {(comment.author_name || "U").charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">
              {comment.author_name || "Usuário"}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatRelativeDate(comment.created_at)}
            </span>
          </div>
          <p className="text-sm mt-1 whitespace-pre-wrap">{comment.content}</p>

          {/* Actions */}
          <div className="flex items-center gap-3 mt-2">
            <button
              onClick={() => user && likeCommentMutation.mutate()}
              disabled={!user || likeCommentMutation.isPending}
              className={`text-xs flex items-center gap-1 ${
                liked ? "text-red-500" : "text-muted-foreground hover:text-foreground"
              } ${!user ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <Heart className={`h-3 w-3 ${liked ? "fill-current" : ""}`} />
              {likeCount > 0 && likeCount}
            </button>
            {user && (
              <button
                onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                <Reply className="h-3 w-3" />
                Responder
              </button>
            )}
            {comment.reply_count > 0 && (
              <button
                onClick={() => toggleReplies(comment.id)}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="h-3 w-3" />
                    Ocultar respostas
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3" />
                    Ver {comment.reply_count} {comment.reply_count === 1 ? "resposta" : "respostas"}
                  </>
                )}
              </button>
            )}
          </div>

          {/* Reply form */}
          {replyingTo === comment.id && (
            <div className="mt-3">
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary min-h-[80px] resize-none text-sm"
                placeholder="Escreva sua resposta..."
                autoFocus
              />
              <div className="flex justify-end gap-2 mt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setReplyingTo(null)
                    setReplyContent("")
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleSubmitReply(comment.id)}
                  disabled={!replyContent.trim() || isSubmitting}
                >
                  {isSubmitting ? "Enviando..." : "Responder"}
                </Button>
              </div>
            </div>
          )}

          {/* Replies */}
          {isExpanded && replies && replies.length > 0 && (
            <div className="mt-4 space-y-3">
              {replies.map((reply: Comment) => (
                <div key={reply.id} className="flex items-start gap-3 pl-4 border-l border-border/50">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary/70 to-accent/70 flex items-center justify-center shrink-0">
                    <span className="text-xs font-semibold text-primary-foreground">
                      {(reply.author_name || "U").charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {reply.author_name || "Usuário"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatRelativeDate(reply.created_at)}
                      </span>
                    </div>
                    <p className="text-sm mt-1">{reply.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
