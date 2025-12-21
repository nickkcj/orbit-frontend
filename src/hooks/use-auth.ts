"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { authApi, setAuthCookie, getAuthToken, clearAuthToken } from "@/lib/api"
import { useRouter } from "next/navigation"

interface User {
  id: string
  email: string
  name: string
  avatar_url: string | null
}

interface AuthResponse {
  token: string
  user: User
}

export function useAuth() {
  const queryClient = useQueryClient()
  const router = useRouter()

  const { data: user, isLoading } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: authApi.me,
    retry: false,
    enabled: typeof window !== "undefined" && !!getAuthToken(),
  })

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data: AuthResponse) => {
      // Save to both cookie (for cross-subdomain) and localStorage (for backward compat)
      setAuthCookie(data.token)
      localStorage.setItem("token", data.token)
      localStorage.setItem("user", JSON.stringify(data.user))
      queryClient.setQueryData(["auth", "me"], data.user)
      router.push("/dashboard")
    },
  })

  const registerMutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: (data: AuthResponse) => {
      // Save to both cookie (for cross-subdomain) and localStorage (for backward compat)
      setAuthCookie(data.token)
      localStorage.setItem("token", data.token)
      localStorage.setItem("user", JSON.stringify(data.user))
      queryClient.setQueryData(["auth", "me"], data.user)
      router.push("/dashboard")
    },
  })

  const logout = () => {
    clearAuthToken()
    queryClient.clear()
    router.push("/login")
  }

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login: loginMutation.mutate,
    loginError: loginMutation.error,
    isLoggingIn: loginMutation.isPending,
    register: registerMutation.mutate,
    registerError: registerMutation.error,
    isRegistering: registerMutation.isPending,
    logout,
  }
}
