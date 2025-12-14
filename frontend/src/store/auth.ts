'use client'

import { create } from 'zustand'
import { api } from '@/lib/api'

interface User {
  id: string
  email: string
  fullName?: string
  phone?: string
  timezone?: string
}

interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (data: {
    email: string
    password: string
    fullName: string
  }) => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (email: string, password: string) => {
    const data = await api.login(email, password)
    localStorage.setItem('accessToken', data.accessToken)
    localStorage.setItem('refreshToken', data.refreshToken)
    set({ user: data.user, isAuthenticated: true })
  },

  signup: async (signupData) => {
    const data = await api.signup(signupData)
    localStorage.setItem('accessToken', data.accessToken)
    localStorage.setItem('refreshToken', data.refreshToken)
    set({ user: data.user, isAuthenticated: true })
  },

  logout: async () => {
    await api.logout()
    set({ user: null, isAuthenticated: false })
  },

  checkAuth: async () => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      set({ isLoading: false, isAuthenticated: false })
      return
    }

    try {
      const userData = await api.getCurrentUser()
      // Map backend field names to frontend
      const user = {
        id: userData.id,
        email: userData.email,
        fullName: userData.full_name,
        phone: userData.phone,
        timezone: userData.timezone,
      }
      set({ user, isAuthenticated: true, isLoading: false })
    } catch {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      set({ user: null, isAuthenticated: false, isLoading: false })
    }
  },
}))
