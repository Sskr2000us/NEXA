'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/store/auth'
import { SocketProvider } from '@/contexts/SocketContext'
import { Home, Zap, Settings, Activity, Bell, LogOut, Palette, BarChart3, Plug, Users, Menu, X, Brain, Shield, Building2, Mic, ShoppingCart, Wrench } from 'lucide-react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, isLoading, isAuthenticated, checkAuth, logout } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isLoading, isAuthenticated, router])

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Devices', href: '/dashboard/devices', icon: Zap },
    { name: 'Predictive AI', href: '/dashboard/predictive', icon: Brain },
    { name: 'Self-Healing', href: '/dashboard/self-healing', icon: Wrench },
    { name: 'Security', href: '/dashboard/security', icon: Shield },
    { name: 'Energy Optimizer', href: '/dashboard/energy-optimizer', icon: Activity },
    { name: 'Voice Assistant', href: '/dashboard/voice-assistant', icon: Mic },
    { name: 'Scenes', href: '/dashboard/scenes', icon: Palette },
    { name: 'Automations', href: '/dashboard/automations', icon: Settings },
    { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
    { name: 'Family', href: '/dashboard/family', icon: Users },
    { name: 'Marketplace', href: '/dashboard/marketplace', icon: ShoppingCart },
    { name: 'Installer', href: '/dashboard/installer', icon: Wrench },
    { name: 'OEM Partners', href: '/dashboard/partners', icon: Building2 },
    { name: 'Integrations', href: '/dashboard/integrations', icon: Plug },
    { name: 'Notifications', href: '/dashboard/notifications', icon: Bell },
  ]

  return (
    <SocketProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Mobile Header */}
        <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 z-40">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6 text-gray-600" />
            ) : (
              <Menu className="w-6 h-6 text-gray-600" />
            )}
          </button>
          <h1 className="text-xl font-bold text-primary-600">NEXA</h1>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
              <span className="text-primary-600 font-semibold text-sm">
                {user?.fullName?.split(' ').map(n => n[0]).join('') || user?.email?.[0].toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div
          className={`fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out z-40 ${
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0 lg:top-0 top-16`}
        >
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="hidden lg:flex items-center h-16 px-6 border-b border-gray-200">
              <h1 className="text-2xl font-bold text-primary-600">NEXA</h1>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-primary-50 text-primary-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                )
              })}
            </nav>

            {/* User section */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-primary-600 font-semibold">
                    {user?.fullName?.split(' ').map(n => n[0]).join('') || user?.email?.[0].toUpperCase()}
                  </span>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.fullName || 'User'}
                  </p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
              </div>
              <button
                onClick={() => window.location.href='/dashboard/settings'}
                className="flex items-center w-full px-4 py-2 mb-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Users className="w-4 h-4 mr-2" />
                Settings
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Desktop Header */}
        <div className="hidden lg:block fixed top-0 left-64 right-0 h-16 bg-white border-b border-gray-200 z-30">
          <div className="h-full px-6 flex items-center justify-end">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-50 cursor-pointer" onClick={() => setIsMobileMenuOpen(true)}>
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-primary-600 font-semibold">
                    {user?.fullName?.split(' ').map(n => n[0]).join('') || user?.email?.[0].toUpperCase()}
                  </span>
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.fullName || 'User'}
                  </p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="lg:pl-64 pt-16 lg:pt-16">
          <main className="p-4 md:p-8">{children}</main>
        </div>
      </div>
    </SocketProvider>
  )
}
