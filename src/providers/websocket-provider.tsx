"use client"

import { createContext, useContext, ReactNode } from "react"
import { useWebSocket } from "@/hooks/use-websocket"

interface WebSocketContextType {
  isConnected: boolean
  lastError: string | null
  useFallback: boolean
}

const WebSocketContext = createContext<WebSocketContextType>({
  isConnected: false,
  lastError: null,
  useFallback: false,
})

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const { isConnected, lastError, useFallback } = useWebSocket({
    onNotification: (payload) => {
      // Could show toast notification here
      console.log("[WebSocket] New notification:", payload.title)
    },
  })

  return (
    <WebSocketContext.Provider value={{ isConnected, lastError, useFallback }}>
      {children}
    </WebSocketContext.Provider>
  )
}

export function useWebSocketStatus() {
  return useContext(WebSocketContext)
}
