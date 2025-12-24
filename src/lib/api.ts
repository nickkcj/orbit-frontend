import axios from "axios"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"
const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN || "orbit.app.br"

// Cookie helpers for cross-subdomain auth
export function setAuthCookie(token: string) {
  if (typeof window === "undefined") return
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toUTCString() // 7 days
  document.cookie = `auth_token=${token}; path=/; domain=.${BASE_DOMAIN}; expires=${expires}; SameSite=Lax`
}

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null

  // Try cookie first (works across subdomains)
  const cookies = document.cookie.split(";")
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split("=")
    if (name === "auth_token" && value) {
      return value
    }
  }

  // Fallback to localStorage (for backward compatibility)
  return localStorage.getItem("token")
}

export function clearAuthToken() {
  if (typeof window === "undefined") return
  // Clear cookie
  document.cookie = `auth_token=; path=/; domain=.${BASE_DOMAIN}; expires=Thu, 01 Jan 1970 00:00:00 GMT`
  // Clear localStorage
  localStorage.removeItem("token")
  localStorage.removeItem("user")
}

export const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: {
    "Content-Type": "application/json",
  },
})

// Interceptor para adicionar token em todas as requests
api.interceptors.request.use((config) => {
  const token = getAuthToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Interceptor para tratar erros de auth
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        clearAuthToken()
        window.location.href = "/login"
      }
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authApi = {
  register: async (data: { email: string; password: string; name: string }) => {
    const response = await api.post("/auth/register", data)
    return response.data
  },

  login: async (data: { email: string; password: string }) => {
    const response = await api.post("/auth/login", data)
    return response.data
  },

  me: async () => {
    const response = await api.get("/auth/me")
    return response.data
  },
}

// Tenants API
export const tenantsApi = {
  list: async () => {
    const response = await api.get("/tenants")
    return response.data
  },

  getBySlug: async (slug: string) => {
    const response = await api.get(`/tenants/${slug}`)
    return response.data
  },

  create: async (data: { slug: string; name: string; description?: string }) => {
    const response = await api.post("/tenants", data)
    return response.data
  },
}

// ============================================
// TENANT-SCOPED API (for subdomain requests)
// ============================================

// Create tenant-scoped API instance
export function createTenantApi(tenantSlug: string) {
  const tenantApi = axios.create({
    baseURL: `${API_URL}/api/v1`,
    headers: {
      "Content-Type": "application/json",
      "X-Tenant-Slug": tenantSlug,
    },
  })

  // Add token interceptor
  tenantApi.interceptors.request.use((config) => {
    const token = getAuthToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  })

  return {
    // Posts
    posts: {
      list: async (limit = 20, offset = 0) => {
        const response = await tenantApi.get("/posts", {
          params: { limit, offset },
        })
        return response.data
      },
      get: async (id: string) => {
        const response = await tenantApi.get(`/posts/${id}`)
        return response.data
      },
      create: async (data: {
        title: string
        content: string
        category_id?: string
      }) => {
        const response = await tenantApi.post("/posts", data)
        return response.data
      },
      update: async (
        id: string,
        data: { title?: string; content?: string; category_id?: string }
      ) => {
        const response = await tenantApi.put(`/posts/${id}`, data)
        return response.data
      },
      publish: async (id: string) => {
        const response = await tenantApi.post(`/posts/${id}/publish`)
        return response.data
      },
      delete: async (id: string) => {
        await tenantApi.delete(`/posts/${id}`)
      },
    },

    // Categories
    categories: {
      list: async () => {
        const response = await tenantApi.get("/categories")
        return response.data
      },
      create: async (data: {
        name: string
        description?: string
        icon?: string
      }) => {
        const response = await tenantApi.post("/categories", data)
        return response.data
      },
    },

    // Members
    members: {
      list: async () => {
        const response = await tenantApi.get("/members")
        return response.data
      },
      join: async (displayName?: string) => {
        const response = await tenantApi.post("/members", {
          display_name: displayName,
        })
        return response.data
      },
      get: async (userId: string) => {
        const response = await tenantApi.get(`/members/${userId}`)
        return response.data
      },
    },

    // Comments
    comments: {
      listByPost: async (postId: string) => {
        const response = await tenantApi.get(`/posts/${postId}/comments`)
        return response.data
      },
      getReplies: async (commentId: string) => {
        const response = await tenantApi.get(`/comments/${commentId}/replies`)
        return response.data
      },
      create: async (data: {
        post_id: string
        content: string
        parent_id?: string
      }) => {
        const response = await tenantApi.post("/comments", data)
        return response.data
      },
      delete: async (id: string) => {
        await tenantApi.delete(`/comments/${id}`)
      },
    },

    // Uploads
    uploads: {
      presign: async (data: { filename: string; content_type?: string }) => {
        const response = await tenantApi.post<{
          upload_url: string
          file_key: string
          expires_in: number
        }>("/uploads/presign", data)
        return response.data
      },
      presignImage: async (data: { filename: string; content_type?: string }) => {
        const response = await tenantApi.post<{
          upload_url: string
          file_key: string
          expires_in: number
        }>("/uploads/presign-image", data)
        return response.data
      },
    },

    // Settings
    settings: {
      updateTheme: async (theme: {
        primaryColor?: string
        accentColor?: string
        bannerUrl?: string
      }) => {
        const response = await tenantApi.put("/settings", { theme })
        return response.data
      },
      updateLogo: async (logoUrl: string) => {
        const response = await tenantApi.put("/settings/logo", { logo_url: logoUrl })
        return response.data
      },
    },

    // Profile
    profile: {
      get: async (userId: string) => {
        const response = await tenantApi.get(`/profile/${userId}`)
        return response.data
      },
      getPosts: async (userId: string) => {
        const response = await tenantApi.get(`/profile/${userId}/posts`)
        return response.data
      },
      getMe: async () => {
        const response = await tenantApi.get("/profile/me")
        return response.data
      },
      updateMe: async (data: { display_name?: string; bio?: string; avatar_url?: string }) => {
        const response = await tenantApi.put("/profile/me", data)
        return response.data
      },
    },

    // Notifications
    notifications: {
      list: async (limit = 20, offset = 0) => {
        const response = await tenantApi.get("/notifications", {
          params: { limit, offset },
        })
        return response.data
      },
      getUnreadCount: async () => {
        const response = await tenantApi.get<{ count: number }>("/notifications/unread/count")
        return response.data
      },
      markRead: async (id: string) => {
        await tenantApi.post(`/notifications/${id}/read`)
      },
      markAllRead: async () => {
        await tenantApi.post("/notifications/read-all")
      },
      delete: async (id: string) => {
        await tenantApi.delete(`/notifications/${id}`)
      },
    },

    // Analytics
    analytics: {
      getDashboard: async () => {
        const response = await tenantApi.get("/analytics/dashboard")
        return response.data
      },
      getStats: async () => {
        const response = await tenantApi.get("/analytics/stats")
        return response.data
      },
      getMembersGrowth: async (days = 30) => {
        const response = await tenantApi.get("/analytics/members/growth", {
          params: { days },
        })
        return response.data
      },
      getTopPosts: async (limit = 10) => {
        const response = await tenantApi.get("/analytics/posts/top", {
          params: { limit },
        })
        return response.data
      },
    },

    // Likes
    likes: {
      likePost: async (postId: string) => {
        const response = await tenantApi.post<{ liked: boolean; like_count: number }>(
          `/posts/${postId}/like`
        )
        return response.data
      },
      unlikePost: async (postId: string) => {
        const response = await tenantApi.delete<{ liked: boolean; like_count: number }>(
          `/posts/${postId}/like`
        )
        return response.data
      },
      getPostLikeStatus: async (postId: string) => {
        const response = await tenantApi.get<{ liked: boolean; like_count: number }>(
          `/posts/${postId}/like`
        )
        return response.data
      },
      likeComment: async (commentId: string) => {
        const response = await tenantApi.post<{ liked: boolean; like_count: number }>(
          `/comments/${commentId}/like`
        )
        return response.data
      },
      unlikeComment: async (commentId: string) => {
        const response = await tenantApi.delete<{ liked: boolean; like_count: number }>(
          `/comments/${commentId}/like`
        )
        return response.data
      },
    },

    // Videos (Cloudflare Stream)
    videos: {
      list: async (limit = 20, offset = 0) => {
        const response = await tenantApi.get<Video[]>("/videos", {
          params: { limit, offset },
        })
        return response.data
      },
      get: async (id: string) => {
        const response = await tenantApi.get<Video>(`/videos/${id}`)
        return response.data
      },
      initiateUpload: async (data: { title: string; description?: string }) => {
        const response = await tenantApi.post<VideoUploadResponse>("/videos", data)
        return response.data
      },
      confirmUpload: async (id: string, streamUid: string) => {
        const response = await tenantApi.post(`/videos/${id}/confirm`, {
          stream_uid: streamUid,
        })
        return response.data
      },
      getPlaybackToken: async (id: string) => {
        const response = await tenantApi.get<{ token: string }>(`/videos/${id}/token`)
        return response.data
      },
      delete: async (id: string) => {
        await tenantApi.delete(`/videos/${id}`)
      },
    },

    // Roles & Permissions
    roles: {
      list: async () => {
        const response = await tenantApi.get<Role[]>("/roles")
        return response.data
      },
      get: async (id: string) => {
        const response = await tenantApi.get<Role>(`/roles/${id}`)
        return response.data
      },
      create: async (data: CreateRoleRequest) => {
        const response = await tenantApi.post<Role>("/roles", data)
        return response.data
      },
      update: async (id: string, data: UpdateRoleRequest) => {
        const response = await tenantApi.put<Role>(`/roles/${id}`, data)
        return response.data
      },
      delete: async (id: string) => {
        await tenantApi.delete(`/roles/${id}`)
      },
      setPermissions: async (id: string, permissions: string[]) => {
        const response = await tenantApi.put<Role>(`/roles/${id}/permissions`, {
          permissions,
        })
        return response.data
      },
    },

    permissions: {
      list: async () => {
        const response = await tenantApi.get<Permission[]>("/permissions")
        return response.data
      },
    },
  }
}

// Types
export interface Video {
  id: string
  tenant_id: string
  uploader_id: string
  uploader_name?: string
  title: string
  description?: string
  thumbnail_url?: string
  duration_seconds?: number
  status: "pending" | "uploading" | "processing" | "ready" | "failed"
  created_at: string
}

export interface VideoUploadResponse {
  video_id: string
  upload_url: string
  stream_uid: string
}

// Roles & Permissions Types
export interface Permission {
  id: string
  code: string
  name: string
  description?: string
  category: string
}

export interface Role {
  id: string
  tenant_id: string
  slug: string
  name: string
  description?: string
  priority: number
  is_default: boolean
  is_system: boolean
  permissions?: Permission[]
}

export interface CreateRoleRequest {
  slug: string
  name: string
  description?: string
  priority?: number
  is_default?: boolean
  permissions?: string[]
}

export interface UpdateRoleRequest {
  name?: string
  description?: string
  priority?: number
}
