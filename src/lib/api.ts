import axios from "axios"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

export const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: {
    "Content-Type": "application/json",
  },
})

// Interceptor para adicionar token em todas as requests
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

// Interceptor para tratar erros de auth
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("token")
        localStorage.removeItem("user")
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
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token")
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
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
      updateMe: async (data: { display_name?: string; bio?: string }) => {
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
  }
}
