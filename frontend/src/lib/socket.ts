'use client'

import { io, Socket } from 'socket.io-client'

class SocketService {
  private socket: Socket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5

  connect(token: string) {
    if (this.socket?.connected) {
      return this.socket
    }

    const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3001'

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
    })

    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected:', this.socket?.id)
      this.reconnectAttempts = 0
    })

    this.socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason)
    })

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error)
      this.reconnectAttempts++
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached')
        this.disconnect()
      }
    })

    return this.socket
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.reconnectAttempts = 0
    }
  }

  subscribeToHome(homeId: string) {
    if (!this.socket) return

    this.socket.emit('subscribe:home', { homeId }, (response: any) => {
      console.log('Subscribed to home:', response)
    })
  }

  unsubscribeFromHome(homeId: string) {
    if (!this.socket) return

    this.socket.emit('unsubscribe:home', { homeId }, (response: any) => {
      console.log('Unsubscribed from home:', response)
    })
  }

  subscribeToDevice(deviceId: string) {
    if (!this.socket) return

    this.socket.emit('subscribe:device', { deviceId }, (response: any) => {
      console.log('Subscribed to device:', response)
    })
  }

  unsubscribeFromDevice(deviceId: string) {
    if (!this.socket) return

    this.socket.emit('unsubscribe:device', { deviceId }, (response: any) => {
      console.log('Unsubscribed from device:', response)
    })
  }

  onDeviceStateChange(callback: (data: any) => void) {
    if (!this.socket) return

    this.socket.on('device:state-change', callback)
  }

  onDeviceTelemetry(callback: (data: any) => void) {
    if (!this.socket) return

    this.socket.on('device:telemetry', callback)
  }

  onAlertNew(callback: (data: any) => void) {
    if (!this.socket) return

    this.socket.on('alert:new', callback)
  }

  offDeviceStateChange(callback: (data: any) => void) {
    if (!this.socket) return

    this.socket.off('device:state-change', callback)
  }

  offDeviceTelemetry(callback: (data: any) => void) {
    if (!this.socket) return

    this.socket.off('device:telemetry', callback)
  }

  offAlertNew(callback: (data: any) => void) {
    if (!this.socket) return

    this.socket.off('alert:new', callback)
  }

  getSocket() {
    return this.socket
  }

  isConnected() {
    return this.socket?.connected || false
  }
}

export const socketService = new SocketService()
