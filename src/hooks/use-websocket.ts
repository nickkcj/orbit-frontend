"use client"

import { useEffect, useRef, useCallback, useState, useMemo } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useTenant } from "@/providers/tenant-provider"
import { useAuth } from "@/hooks/use-auth"
import { getAuthToken } from "@/lib/api"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"
const WS_URL = API_URL.replace("http://", "ws://").replace("https://", "wss://")

// Message types
export type MessageType =
  | "notification:new"
  | "post:created"
  | "post:updated"
  | "post:deleted"
  | "comment:created"
  | "comment:deleted"
  | "like:updated"
  | "video:ready"
  | "video:failed"
  | "member:joined"
  | "member:left"
  | "connected"
  | "ping"
  | "pong"
  | "error"

export interface WebSocketMessage<T = unknown> {
  type: MessageType
  payload: T
  timestamp: string
}

// Payload types
export interface NotificationPayload {
  id: string
  notification_type: string
  title: string
  message: string
  data?: Record<string, unknown>
  created_at: string
}

export interface PostPayload {
  id: string
  title: string
  author_id: string
  author_name: string
  category_id?: string
  created_at: string
}

export interface CommentPayload {
  id: string
  post_id: string
  author_id: string
  author_name: string
  content?: string
  parent_id?: string
  created_at: string
}

export interface LikePayload {
  target_type: "post" | "comment"
  target_id: string
  like_count: number
  user_id: string
}

export interface VideoPayload {
  id: string
  title: string
  status: "ready" | "failed"
  thumbnail_url?: string
  playback_url?: string
  error_message?: string
}

export interface MemberPayload {
  user_id: string
  user_name: string
  role_name: string
  action: "joined" | "left"
}

export interface ErrorPayload {
  code: string
  message: string
}

// Event handlers interface
export interface WebSocketEventHandlers {
  onNotification?: (payload: NotificationPayload) => void
  onPostCreated?: (payload: PostPayload) => void
  onPostUpdated?: (payload: PostPayload) => void
  onPostDeleted?: (payload: { id: string }) => void
  onCommentCreated?: (payload: CommentPayload) => void
  onCommentDeleted?: (payload: { id: string; post_id: string }) => void
  onLikeUpdated?: (payload: LikePayload) => void
  onVideoReady?: (payload: VideoPayload) => void
  onVideoFailed?: (payload: VideoPayload) => void
  onMemberJoined?: (payload: MemberPayload) => void
  onMemberLeft?: (payload: MemberPayload) => void
  onConnected?: () => void
  onDisconnected?: () => void
  onError?: (payload: ErrorPayload) => void
  onAnyMessage?: (message: WebSocketMessage) => void
}

// Connection state
export type ConnectionState = "connecting" | "connected" | "disconnected" | "reconnecting" | "failed"

const RECONNECT_DELAYS = [1000, 2000, 4000, 8000, 16000, 30000] // Exponential backoff
const PING_INTERVAL = 25000 // 25 seconds
const PONG_TIMEOUT = 10000 // 10 seconds to receive pong

export function useWebSocket(handlers: WebSocketEventHandlers = {}) {
  const { tenant } = useTenant()
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectAttemptRef = useRef(0)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()
  const pingIntervalRef = useRef<NodeJS.Timeout>()
  const pongTimeoutRef = useRef<NodeJS.Timeout>()
  const handlersRef = useRef(handlers)

  // Keep handlers ref updated
  useEffect(() => {
    handlersRef.current = handlers
  }, [handlers])

  const [connectionState, setConnectionState] = useState<ConnectionState>("disconnected")
  const [lastError, setLastError] = useState<string | null>(null)
  const [useFallback, setUseFallback] = useState(false)
  const [messageCount, setMessageCount] = useState(0)

  // Legacy isConnected for backward compatibility
  const isConnected = connectionState === "connected"

  const handleMessage = useCallback(
    (message: WebSocketMessage) => {
      setMessageCount((c) => c + 1)

      // Call onAnyMessage for debugging/logging
      handlersRef.current.onAnyMessage?.(message)

      switch (message.type) {
        case "notification:new":
          queryClient.invalidateQueries({ queryKey: ["notifications"] })
          handlersRef.current.onNotification?.(message.payload as NotificationPayload)
          break

        case "post:created":
          queryClient.invalidateQueries({ queryKey: ["posts"] })
          handlersRef.current.onPostCreated?.(message.payload as PostPayload)
          break

        case "post:updated": {
          const postPayload = message.payload as PostPayload
          queryClient.invalidateQueries({ queryKey: ["posts"] })
          queryClient.invalidateQueries({ queryKey: ["post", postPayload.id] })
          handlersRef.current.onPostUpdated?.(postPayload)
          break
        }

        case "post:deleted": {
          const deletePayload = message.payload as { id: string }
          queryClient.invalidateQueries({ queryKey: ["posts"] })
          queryClient.removeQueries({ queryKey: ["post", deletePayload.id] })
          handlersRef.current.onPostDeleted?.(deletePayload)
          break
        }

        case "comment:created": {
          const commentPayload = message.payload as CommentPayload
          queryClient.invalidateQueries({
            queryKey: ["comments", commentPayload.post_id],
          })
          // Update comment count on post
          queryClient.setQueryData(
            ["post", commentPayload.post_id],
            (old: Record<string, unknown> | undefined) =>
              old ? { ...old, comment_count: ((old.comment_count as number) || 0) + 1 } : old
          )
          handlersRef.current.onCommentCreated?.(commentPayload)
          break
        }

        case "comment:deleted": {
          const deletePayload = message.payload as { id: string; post_id: string }
          queryClient.invalidateQueries({
            queryKey: ["comments", deletePayload.post_id],
          })
          handlersRef.current.onCommentDeleted?.(deletePayload)
          break
        }

        case "like:updated": {
          const likePayload = message.payload as LikePayload
          if (likePayload.target_type === "post") {
            // Update in posts list
            queryClient.setQueryData(
              ["posts"],
              (old: Array<Record<string, unknown>> | undefined) =>
                old?.map((post) =>
                  post.id === likePayload.target_id
                    ? { ...post, like_count: likePayload.like_count }
                    : post
                )
            )
            // Update single post
            queryClient.setQueryData(
              ["post", likePayload.target_id],
              (old: Record<string, unknown> | undefined) =>
                old ? { ...old, like_count: likePayload.like_count } : old
            )
          } else {
            // Update comment like count
            queryClient.invalidateQueries({ queryKey: ["comments"] })
          }
          handlersRef.current.onLikeUpdated?.(likePayload)
          break
        }

        case "video:ready": {
          const videoPayload = message.payload as VideoPayload
          queryClient.invalidateQueries({ queryKey: ["videos"] })
          queryClient.invalidateQueries({ queryKey: ["video", videoPayload.id] })
          handlersRef.current.onVideoReady?.(videoPayload)
          break
        }

        case "video:failed": {
          const videoPayload = message.payload as VideoPayload
          queryClient.invalidateQueries({ queryKey: ["video", videoPayload.id] })
          handlersRef.current.onVideoFailed?.(videoPayload)
          break
        }

        case "member:joined": {
          const memberPayload = message.payload as MemberPayload
          queryClient.invalidateQueries({ queryKey: ["members"] })
          handlersRef.current.onMemberJoined?.(memberPayload)
          break
        }

        case "member:left": {
          const memberPayload = message.payload as MemberPayload
          queryClient.invalidateQueries({ queryKey: ["members"] })
          handlersRef.current.onMemberLeft?.(memberPayload)
          break
        }

        case "connected":
          console.log("[WebSocket] Connection confirmed")
          break

        case "pong":
          // Clear pong timeout
          if (pongTimeoutRef.current) {
            clearTimeout(pongTimeoutRef.current)
            pongTimeoutRef.current = undefined
          }
          break

        case "error":
          const errorPayload = message.payload as ErrorPayload
          setLastError(errorPayload.message)
          handlersRef.current.onError?.(errorPayload)
          break

        default:
          console.log("[WebSocket] Unknown message type:", message.type)
      }
    },
    [queryClient]
  )

  const sendMessage = useCallback((type: string, payload: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, payload, timestamp: new Date().toISOString() }))
      return true
    }
    return false
  }, [])

  const startPingInterval = useCallback(() => {
    pingIntervalRef.current = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "ping" }))

        // Set pong timeout
        pongTimeoutRef.current = setTimeout(() => {
          console.log("[WebSocket] Pong timeout, reconnecting...")
          wsRef.current?.close(4000, "Pong timeout")
        }, PONG_TIMEOUT)
      }
    }, PING_INTERVAL)
  }, [])

  const stopPingInterval = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current)
      pingIntervalRef.current = undefined
    }
    if (pongTimeoutRef.current) {
      clearTimeout(pongTimeoutRef.current)
      pongTimeoutRef.current = undefined
    }
  }, [])

  const connect = useCallback(() => {
    if (!tenant || !user) return

    const token = getAuthToken()
    if (!token) return

    setConnectionState("connecting")

    // Build WebSocket URL with auth params
    const wsUrl = new URL("/ws", WS_URL)
    wsUrl.searchParams.set("token", token)
    wsUrl.searchParams.set("tenant", tenant.slug)

    const ws = new WebSocket(wsUrl.toString())
    wsRef.current = ws

    ws.onopen = () => {
      console.log("[WebSocket] Connected")
      setConnectionState("connected")
      setLastError(null)
      reconnectAttemptRef.current = 0
      startPingInterval()
      handlersRef.current.onConnected?.()
    }

    ws.onclose = (event) => {
      console.log("[WebSocket] Disconnected:", event.code, event.reason)
      setConnectionState("disconnected")
      wsRef.current = null
      stopPingInterval()
      handlersRef.current.onDisconnected?.()

      // Reconnect with exponential backoff (unless clean close or max attempts)
      if (event.code !== 1000 && reconnectAttemptRef.current < RECONNECT_DELAYS.length) {
        setConnectionState("reconnecting")
        const delay = RECONNECT_DELAYS[reconnectAttemptRef.current]
        console.log(`[WebSocket] Reconnecting in ${delay}ms... (attempt ${reconnectAttemptRef.current + 1})`)
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectAttemptRef.current++
          connect()
        }, delay)
      } else if (reconnectAttemptRef.current >= RECONNECT_DELAYS.length) {
        setConnectionState("failed")
        setUseFallback(true)
      }
    }

    ws.onerror = () => {
      console.error("[WebSocket] Error occurred")
      setLastError("Connection error")
    }

    ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data)
        handleMessage(message)
      } catch (err) {
        console.error("[WebSocket] Failed to parse message:", err)
      }
    }
  }, [tenant, user, handleMessage, startPingInterval, stopPingInterval])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    stopPingInterval()
    if (wsRef.current) {
      wsRef.current.close(1000, "Client disconnect")
      wsRef.current = null
    }
    setConnectionState("disconnected")
  }, [stopPingInterval])

  const reconnect = useCallback(() => {
    disconnect()
    reconnectAttemptRef.current = 0
    setUseFallback(false)
    setTimeout(connect, 100)
  }, [disconnect, connect])

  // Connect on mount, disconnect on unmount
  useEffect(() => {
    connect()
    return () => disconnect()
  }, [connect, disconnect])

  // Polling fallback when WebSocket fails
  useEffect(() => {
    if (!useFallback) return

    console.log("[WebSocket] Using polling fallback")
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ["notifications", "count"] })
    }, 30000) // 30 second polling

    return () => clearInterval(interval)
  }, [useFallback, queryClient])

  // Connection stats for debugging
  const stats = useMemo(() => ({
    state: connectionState,
    messageCount,
    reconnectAttempts: reconnectAttemptRef.current,
    usingFallback: useFallback,
  }), [connectionState, messageCount, useFallback])

  return {
    // Connection state
    isConnected,
    connectionState,
    lastError,
    useFallback,
    stats,

    // Actions
    disconnect,
    reconnect,
    sendMessage,
  }
}

// Hook for subscribing to specific message types
export function useWebSocketMessage<T>(
  type: MessageType,
  callback: (payload: T) => void
) {
  const callbackRef = useRef(callback)

  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  const handlers = useMemo(() => ({
    onAnyMessage: (message: WebSocketMessage) => {
      if (message.type === type) {
        callbackRef.current(message.payload as T)
      }
    }
  }), [type])

  return useWebSocket(handlers)
}
