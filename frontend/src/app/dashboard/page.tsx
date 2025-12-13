'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Home, Zap, Activity, Bell, Plus } from 'lucide-react'
import AddHomeModal from '@/components/AddHomeModal'
import toast from 'react-hot-toast'

export default function DashboardPage() {
  const [stats, setStats] = useState({
    homes: 0,
    devices: 0,
    activeAutomations: 0,
    alerts: 0,
  })
  const [homes, setHomes] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const homesData = await api.getHomes()
      setHomes(homesData)
      
      // Calculate stats
      let totalDevices = 0
      let totalAutomations = 0
      let totalAlerts = 0

      for (const home of homesData) {
        const devices = await api.getDevices(home.id)
        const automations = await api.getAutomations(home.id)
        const alerts = await api.getAlerts(home.id)
        
        totalDevices += devices.length
        totalAutomations += automations.filter((a: any) => a.enabled).length
        totalAlerts += alerts.filter((a: any) => a.status === 'active').length
      }

      setStats({
        homes: homesData.length,
        devices: totalDevices,
        activeAutomations: totalAutomations,
        alerts: totalAlerts,
      })
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddHome = async (homeData: any) => {
    try {
      await api.createHome(homeData)
      toast.success('Home created successfully!')
      await loadDashboardData()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create home')
      throw error
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div>
      <AddHomeModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddHome}
      />

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome to your smart home control center</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Homes</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.homes}</p>
            </div>
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <Home className="w-6 h-6 text-primary-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Devices</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.devices}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Zap className="w-6 h-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Automations</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.activeAutomations}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Alerts</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.alerts}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <Bell className="w-6 h-6 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Homes List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Your Homes</CardTitle>
          <Button size="sm" onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Home
          </Button>
        </CardHeader>
        <CardContent>
          {homes.length === 0 ? (
            <div className="text-center py-12">
              <Home className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No homes yet
              </h3>
              <p className="text-gray-600 mb-4">
                Get started by adding your first home
              </p>
              <Button onClick={() => setShowAddModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Home
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {homes.map((home) => (
                <div
                  key={home.id}
                  className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 transition-colors cursor-pointer"
                >
                  <h4 className="font-semibold text-gray-900">{home.name}</h4>
                  <p className="text-sm text-gray-600 mt-1">{home.address}</p>
                  <div className="flex items-center mt-3 text-sm text-gray-500">
                    <Zap className="w-4 h-4 mr-1" />
                    <span>{home.deviceCount || 0} devices</span>
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
