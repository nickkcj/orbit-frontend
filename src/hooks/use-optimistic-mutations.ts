"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createTenantApi } from "@/lib/api"
import { useCallback } from "react"

// Types
interface Post {
  id: string
  title: string
  content: string
  author_id: string
  author_name: string
  like_count: number
  comment_count: number
  liked?: boolean
  created_at: string
  updated_at: string
}

interface Comment {
  id: string
  post_id: string
  author_id: string
  author_name: string
  content: string
  like_count: number
  liked?: boolean
  created_at: string
}

interface OptimisticContext<T> {
  previousData: T | undefined
}

// Hook for optimistic post likes
export function useOptimisticLike(tenantSlug: string) {
  const queryClient = useQueryClient()
  const api = createTenantApi(tenantSlug)

  const likeMutation = useMutation({
    mutationFn: async ({ postId, isLiked }: { postId: string; isLiked: boolean }) => {
      if (isLiked) {
        return api.likes.unlikePost(postId)
      } else {
        return api.likes.likePost(postId)
      }
    },

    // Optimistic update - runs before the mutation
    onMutate: async ({ postId, isLiked }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["posts", tenantSlug] })
      await queryClient.cancelQueries({ queryKey: ["post", postId] })

      // Snapshot the previous value
      const previousPosts = queryClient.getQueryData<Post[]>(["posts", tenantSlug])
      const previousPost = queryClient.getQueryData<Post>(["post", postId])

      // Optimistically update the posts list
      queryClient.setQueryData<Post[]>(["posts", tenantSlug], (old) => {
        if (!old) return old
        return old.map((post) => {
          if (post.id === postId) {
            return {
              ...post,
              liked: !isLiked,
              like_count: isLiked ? post.like_count - 1 : post.like_count + 1,
            }
          }
          return post
        })
      })

      // Optimistically update the single post
      queryClient.setQueryData<Post>(["post", postId], (old) => {
        if (!old) return old
        return {
          ...old,
          liked: !isLiked,
          like_count: isLiked ? old.like_count - 1 : old.like_count + 1,
        }
      })

      // Return context with previous values for rollback
      return { previousPosts, previousPost }
    },

    // Rollback on error
    onError: (_err, { postId }, context) => {
      if (context?.previousPosts) {
        queryClient.setQueryData(["posts", tenantSlug], context.previousPosts)
      }
      if (context?.previousPost) {
        queryClient.setQueryData(["post", postId], context.previousPost)
      }
    },

    // Always refetch after error or success to sync with server
    onSettled: (_data, _error, { postId }) => {
      queryClient.invalidateQueries({ queryKey: ["posts", tenantSlug] })
      queryClient.invalidateQueries({ queryKey: ["post", postId] })
    },
  })

  const toggleLike = useCallback(
    (postId: string, isLiked: boolean) => {
      likeMutation.mutate({ postId, isLiked })
    },
    [likeMutation]
  )

  return {
    toggleLike,
    isLoading: likeMutation.isPending,
  }
}

// Hook for optimistic comment likes
export function useOptimisticCommentLike(tenantSlug: string, postId: string) {
  const queryClient = useQueryClient()
  const api = createTenantApi(tenantSlug)

  return useMutation({
    mutationFn: async ({ commentId, isLiked }: { commentId: string; isLiked: boolean }) => {
      if (isLiked) {
        return api.likes.unlikeComment(commentId)
      } else {
        return api.likes.likeComment(commentId)
      }
    },

    onMutate: async ({ commentId, isLiked }) => {
      await queryClient.cancelQueries({ queryKey: ["comments", postId] })

      const previousComments = queryClient.getQueryData<Comment[]>(["comments", postId])

      queryClient.setQueryData<Comment[]>(["comments", postId], (old) => {
        if (!old) return old
        return old.map((comment) => {
          if (comment.id === commentId) {
            return {
              ...comment,
              liked: !isLiked,
              like_count: isLiked ? comment.like_count - 1 : comment.like_count + 1,
            }
          }
          return comment
        })
      })

      return { previousComments }
    },

    onError: (_err, _vars, context) => {
      if (context?.previousComments) {
        queryClient.setQueryData(["comments", postId], context.previousComments)
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", postId] })
    },
  })
}

// Hook for optimistic comment creation
export function useOptimisticComment(tenantSlug: string, postId: string, currentUser: { id: string; name: string }) {
  const queryClient = useQueryClient()
  const api = createTenantApi(tenantSlug)

  return useMutation({
    mutationFn: async (data: { content: string; parent_id?: string }) => {
      return api.comments.create({ post_id: postId, ...data })
    },

    onMutate: async (newComment) => {
      await queryClient.cancelQueries({ queryKey: ["comments", postId] })

      const previousComments = queryClient.getQueryData<Comment[]>(["comments", postId])

      // Create optimistic comment with temporary ID
      const optimisticComment: Comment = {
        id: `temp-${Date.now()}`,
        post_id: postId,
        author_id: currentUser.id,
        author_name: currentUser.name,
        content: newComment.content,
        like_count: 0,
        liked: false,
        created_at: new Date().toISOString(),
      }

      queryClient.setQueryData<Comment[]>(["comments", postId], (old) => {
        return old ? [optimisticComment, ...old] : [optimisticComment]
      })

      // Update post comment count
      queryClient.setQueryData<Post>(["post", postId], (old) => {
        if (!old) return old
        return { ...old, comment_count: old.comment_count + 1 }
      })

      return { previousComments }
    },

    onError: (_err, _vars, context) => {
      if (context?.previousComments) {
        queryClient.setQueryData(["comments", postId], context.previousComments)
      }
      // Revert comment count
      queryClient.setQueryData<Post>(["post", postId], (old) => {
        if (!old) return old
        return { ...old, comment_count: Math.max(0, old.comment_count - 1) }
      })
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", postId] })
      queryClient.invalidateQueries({ queryKey: ["post", postId] })
    },
  })
}

// Hook for optimistic comment deletion
export function useOptimisticDeleteComment(tenantSlug: string, postId: string) {
  const queryClient = useQueryClient()
  const api = createTenantApi(tenantSlug)

  return useMutation({
    mutationFn: async (commentId: string) => {
      return api.comments.delete(commentId)
    },

    onMutate: async (commentId) => {
      await queryClient.cancelQueries({ queryKey: ["comments", postId] })

      const previousComments = queryClient.getQueryData<Comment[]>(["comments", postId])

      queryClient.setQueryData<Comment[]>(["comments", postId], (old) => {
        return old ? old.filter((c) => c.id !== commentId) : []
      })

      // Update post comment count
      queryClient.setQueryData<Post>(["post", postId], (old) => {
        if (!old) return old
        return { ...old, comment_count: Math.max(0, old.comment_count - 1) }
      })

      return { previousComments }
    },

    onError: (_err, _vars, context) => {
      if (context?.previousComments) {
        queryClient.setQueryData(["comments", postId], context.previousComments)
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", postId] })
      queryClient.invalidateQueries({ queryKey: ["post", postId] })
    },
  })
}

// Hook for optimistic post creation
export function useOptimisticCreatePost(tenantSlug: string, currentUser: { id: string; name: string }) {
  const queryClient = useQueryClient()
  const api = createTenantApi(tenantSlug)

  return useMutation({
    mutationFn: async (data: { title: string; content: string; category_id?: string }) => {
      return api.posts.create(data)
    },

    onMutate: async (newPost) => {
      await queryClient.cancelQueries({ queryKey: ["posts", tenantSlug] })

      const previousPosts = queryClient.getQueryData<Post[]>(["posts", tenantSlug])

      const optimisticPost: Post = {
        id: `temp-${Date.now()}`,
        title: newPost.title,
        content: newPost.content,
        author_id: currentUser.id,
        author_name: currentUser.name,
        like_count: 0,
        comment_count: 0,
        liked: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      queryClient.setQueryData<Post[]>(["posts", tenantSlug], (old) => {
        return old ? [optimisticPost, ...old] : [optimisticPost]
      })

      return { previousPosts }
    },

    onError: (_err, _vars, context) => {
      if (context?.previousPosts) {
        queryClient.setQueryData(["posts", tenantSlug], context.previousPosts)
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["posts", tenantSlug] })
    },
  })
}

// Hook for optimistic post deletion
export function useOptimisticDeletePost(tenantSlug: string) {
  const queryClient = useQueryClient()
  const api = createTenantApi(tenantSlug)

  return useMutation({
    mutationFn: async (postId: string) => {
      return api.posts.delete(postId)
    },

    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: ["posts", tenantSlug] })

      const previousPosts = queryClient.getQueryData<Post[]>(["posts", tenantSlug])

      queryClient.setQueryData<Post[]>(["posts", tenantSlug], (old) => {
        return old ? old.filter((p) => p.id !== postId) : []
      })

      return { previousPosts }
    },

    onError: (_err, _vars, context) => {
      if (context?.previousPosts) {
        queryClient.setQueryData(["posts", tenantSlug], context.previousPosts)
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["posts", tenantSlug] })
    },
  })
}

// Hook for optimistic notification mark as read
export function useOptimisticMarkRead(tenantSlug: string) {
  const queryClient = useQueryClient()
  const api = createTenantApi(tenantSlug)

  return useMutation({
    mutationFn: async (notificationId: string) => {
      return api.notifications.markRead(notificationId)
    },

    onMutate: async (notificationId) => {
      await queryClient.cancelQueries({ queryKey: ["notifications", tenantSlug] })
      await queryClient.cancelQueries({ queryKey: ["notifications", "count", tenantSlug] })

      const previousNotifications = queryClient.getQueryData<Array<{ id: string; read: boolean }>>(
        ["notifications", tenantSlug]
      )
      const previousCount = queryClient.getQueryData<{ count: number }>(
        ["notifications", "count", tenantSlug]
      )

      // Mark as read in list
      queryClient.setQueryData<Array<{ id: string; read: boolean }>>(
        ["notifications", tenantSlug],
        (old) => {
          if (!old) return old
          return old.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
        }
      )

      // Decrement count
      queryClient.setQueryData<{ count: number }>(
        ["notifications", "count", tenantSlug],
        (old) => {
          if (!old) return old
          return { count: Math.max(0, old.count - 1) }
        }
      )

      return { previousNotifications, previousCount }
    },

    onError: (_err, _vars, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(["notifications", tenantSlug], context.previousNotifications)
      }
      if (context?.previousCount) {
        queryClient.setQueryData(["notifications", "count", tenantSlug], context.previousCount)
      }
    },
  })
}

// Hook for optimistic mark all as read
export function useOptimisticMarkAllRead(tenantSlug: string) {
  const queryClient = useQueryClient()
  const api = createTenantApi(tenantSlug)

  return useMutation({
    mutationFn: async () => {
      return api.notifications.markAllRead()
    },

    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["notifications", tenantSlug] })
      await queryClient.cancelQueries({ queryKey: ["notifications", "count", tenantSlug] })

      const previousNotifications = queryClient.getQueryData<Array<{ id: string; read: boolean }>>(
        ["notifications", tenantSlug]
      )
      const previousCount = queryClient.getQueryData<{ count: number }>(
        ["notifications", "count", tenantSlug]
      )

      // Mark all as read
      queryClient.setQueryData<Array<{ id: string; read: boolean }>>(
        ["notifications", tenantSlug],
        (old) => {
          if (!old) return old
          return old.map((n) => ({ ...n, read: true }))
        }
      )

      // Set count to 0
      queryClient.setQueryData<{ count: number }>(
        ["notifications", "count", tenantSlug],
        { count: 0 }
      )

      return { previousNotifications, previousCount }
    },

    onError: (_err, _vars, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(["notifications", tenantSlug], context.previousNotifications)
      }
      if (context?.previousCount) {
        queryClient.setQueryData(["notifications", "count", tenantSlug], context.previousCount)
      }
    },
  })
}
