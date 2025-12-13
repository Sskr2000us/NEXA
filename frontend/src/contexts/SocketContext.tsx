'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { socketService } from '@/lib/socket'
import { useAuth } from '@/store/auth'
import toast from 'react-hot-toast'

interface SocketContextType {
  isConnected: boolean
  subscribeToHome: (homeId: string) => void
  unsubscribeFromHome: (homeId: string) => void
  subscribeToDevice: (deviceId: string) => void
  unsubscribeFromDevice: (deviceId: string) => void
}

const SocketContext = createContext<SocketContextType | undefined>(undefined)

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    if (isAuthenticated) {
      const token = localStorage.getItem('accessToken')
      if (token) {
        const socket = socketService.connect(token)
        
        socket.on('connect', () => {
          setIsConnected(true)
        })

        socket.on('disconnect', () => {
          setIsConnected(false)
        })

        // Global alert handler
        socketService.onAlertNew((alert) => {
          const severity = alert.severity || 'info'
          const message = alert.title || alert.message

          if (severity === 'critical' || severity === 'high') {
            toast.error(message, { duration: 6000 })
          } else if (severity === 'warning' || severity === 'medium') {
            toast(message, { icon: '⚠️', duration: 4000 })
          } else {
            toast.success(message, { duration: 3000 })
          }
        })
      }
    } else {
      socketService.disconnect()
      setIsConnected(false)
    }

    return () => {
      socketService.disconnect()
    }
  }, [isAuthenticated])

  const subscribeToHome = (homeId: string) => {
    socketService.subscribeToHome(homeId)
  }

  const unsubscribeFromHome = (homeId: string) => {
    socketService.unsubscribeFromHome(homeId)
  }

  const subscribeToDevice = (deviceId: string) => {
    socketService.subscribeToDevice(deviceId)
  }

  const unsubscribeFromDevice = (deviceId: string) => {
    socketService.unsubscribeFromDevice(deviceId)
  }

  return (
    <SocketContext.Provider
      value={{
        isConnected,
        subscribeToHome,
        unsubscribeFromHome,
        subscribeToDevice,
        unsubscribeFromDevice,
      }}
    >
      {children}
    </SocketContext.Provider>
  )
}

export function useSocket() {
  const context = useContext(SocketContext)
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}
