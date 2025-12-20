"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useTenant } from "@/providers/tenant-provider"
import { useAuth } from "@/hooks/use-auth"
import { createTenantApi } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Bell, MessageCircle, Reply, UserPlus, Check, Trash2 } from "lucide-react"
import Link from "next/link"

interface Notification {
  id: string
  type: string
  title: string
  message: string
  data: {
    post_id?: string
    post_title?: string
    comment_id?: string
    author_name?: string
  }
  read_at: string | null
  created_at: string
}

export default function NotificationsPage() {
  const { tenant } = useTenant()
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const api = tenant ? createTenantApi(tenant.slug) : null

  // Get all notifications
  const { data: notifications, isLoading } = useQuery({
    queryKey: ["notifications", "all", tenant?.slug],
    queryFn: async () => {
      if (!api) return []
      return api.notifications.list(50, 0) as Promise<Notification[]>
    },
    enabled: !!tenant && !!user,
  })

  // Mark as read mutation
  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!api) throw new Error("API not initialized")
      return api.notifications.markRead(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
    },
  })

  // Mark all as read mutation
  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      if (!api) throw new Error("API not initialized")
      return api.notifications.markAllRead()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!api) throw new Error("API not initialized")
      return api.notifications.delete(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
    },
  })

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return "agora"
    if (minutes < 60) return `há ${minutes} minutos`
    if (hours < 24) return `há ${hours} horas`
    if (days < 7) return `há ${days} dias`
    return date.toLocaleDateString("pt-BR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "comment":
        return <MessageCircle className="h-5 w-5 text-blue-400" />
      case "reply":
        return <Reply className="h-5 w-5 text-purple-400" />
      case "welcome":
        return <UserPlus className="h-5 w-5 text-green-400" />
      default:
        return <Bell className="h-5 w-5 text-primary" />
    }
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-2">Acesso restrito</h2>
        <p className="text-muted-foreground mb-4">
          Faça login para ver suas notificações.
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

  const unreadCount = notifications?.filter((n) => !n.read_at).length || 0

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notificações</h1>
          <p className="text-muted-foreground mt-1">
            {unreadCount > 0
              ? `${unreadCount} não lidas`
              : "Todas as notificações lidas"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
          >
            <Check className="h-4 w-4 mr-2" />
            Marcar todas como lidas
          </Button>
        )}
      </div>

      {/* Notifications list */}
      <Card>
        <CardContent className="p-0">
          {!notifications || notifications.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Nenhuma notificação</h3>
              <p className="text-sm">
                Você receberá notificações quando alguém interagir com seu conteúdo.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-muted/50 transition-colors ${
                    !notification.read_at ? "bg-primary/5" : ""
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      {notification.data.post_id ? (
                        <Link
                          href={`/posts/${notification.data.post_id}`}
                          onClick={() => {
                            if (!notification.read_at) {
                              markReadMutation.mutate(notification.id)
                            }
                          }}
                          className="block"
                        >
                          <p className="font-medium">{notification.title}</p>
                          {notification.message && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {notification.message}
                            </p>
                          )}
                        </Link>
                      ) : (
                        <div
                          onClick={() => {
                            if (!notification.read_at) {
                              markReadMutation.mutate(notification.id)
                            }
                          }}
                          className="cursor-pointer"
                        >
                          <p className="font-medium">{notification.title}</p>
                          {notification.message && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {notification.message}
                            </p>
                          )}
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDate(notification.created_at)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {!notification.read_at && (
                        <div className="w-2 h-2 bg-primary rounded-full" />
                      )}
                      <button
                        onClick={() => deleteMutation.mutate(notification.id)}
                        className="p-1 text-muted-foreground hover:text-red-500 transition-colors"
                        title="Excluir notificação"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
