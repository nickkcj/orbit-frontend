"use client"

import React, { useState, useRef, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useTenant } from "@/providers/tenant-provider"
import { useAuth } from "@/hooks/use-auth"
import { createTenantApi } from "@/lib/api"
import { Bell, MessageCircle, Reply, UserPlus, Check, X } from "lucide-react"
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

export function NotificationBell() {
  const { tenant } = useTenant()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const api = tenant ? createTenantApi(tenant.slug) : null

  // Get unread count
  const { data: countData } = useQuery({
    queryKey: ["notifications", "count", tenant?.slug],
    queryFn: async () => {
      if (!api) return { count: 0 }
      return api.notifications.getUnreadCount()
    },
    enabled: !!tenant && !!user,
    refetchInterval: 30000, // Poll every 30 seconds
  })

  // Get notifications when dropdown is open
  const { data: notifications } = useQuery({
    queryKey: ["notifications", tenant?.slug],
    queryFn: async () => {
      if (!api) return []
      return api.notifications.list(10, 0) as Promise<Notification[]>
    },
    enabled: !!tenant && !!user && isOpen,
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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

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

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "comment":
        return <MessageCircle className="h-4 w-4 text-blue-400" />
      case "reply":
        return <Reply className="h-4 w-4 text-purple-400" />
      case "welcome":
        return <UserPlus className="h-4 w-4 text-green-400" />
      default:
        return <Bell className="h-4 w-4 text-primary" />
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read_at) {
      markReadMutation.mutate(notification.id)
    }
    setIsOpen(false)
  }

  if (!user) return null

  const unreadCount = countData?.count || 0

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-lg shadow-xl z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-border">
            <h3 className="font-semibold">Notificações</h3>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllReadMutation.mutate()}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                <Check className="h-3 w-3" />
                Marcar todas como lidas
              </button>
            )}
          </div>

          {/* Notifications list */}
          <div className="max-h-96 overflow-y-auto">
            {!notifications || notifications.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhuma notificação</p>
              </div>
            ) : (
              <div>
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`block p-3 hover:bg-muted/50 transition-colors border-b border-border/50 last:border-0 ${
                      !notification.read_at ? "bg-primary/5" : ""
                    }`}
                  >
                    {notification.data.post_id ? (
                      <Link
                        href={`/posts/${notification.data.post_id}`}
                        onClick={() => handleNotificationClick(notification)}
                        className="block"
                      >
                        <NotificationContent
                          notification={notification}
                          getIcon={getNotificationIcon}
                          formatDate={formatRelativeDate}
                        />
                      </Link>
                    ) : (
                      <div onClick={() => handleNotificationClick(notification)} className="cursor-pointer">
                        <NotificationContent
                          notification={notification}
                          getIcon={getNotificationIcon}
                          formatDate={formatRelativeDate}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications && notifications.length > 0 && (
            <div className="p-2 border-t border-border">
              <Link
                href="/notifications"
                className="block text-center text-sm text-primary hover:underline py-1"
                onClick={() => setIsOpen(false)}
              >
                Ver todas as notificações
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function NotificationContent({
  notification,
  getIcon,
  formatDate,
}: {
  notification: Notification
  getIcon: (type: string) => React.ReactNode
  formatDate: (date: string) => string
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5">{getIcon(notification.type)}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{notification.title}</p>
        {notification.message && (
          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
            {notification.message}
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          {formatDate(notification.created_at)}
        </p>
      </div>
      {!notification.read_at && (
        <div className="w-2 h-2 bg-primary rounded-full mt-2 shrink-0" />
      )}
    </div>
  )
}
