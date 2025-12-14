'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Plus, Trash2, Edit2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface Surface {
  id: string
  home_id: string
  name: string
  type: 'smart_display' | 'web_app' | 'mobile_app' | 'voice_assistant'
  provider: 'google' | 'amazon' | 'apple' | 'nexa'
  location?: string
  capabilities: string[]
  status: 'online' | 'offline' | 'unknown'
  created_at: string
}

export default function SurfacesPage() {
  const [surfaces, setSurfaces] = useState<Surface[]>([])
  const [homes, setHomes] = useState<any[]>([])
  const [selectedHome, setSelectedHome] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [loadingHomes, setLoadingHomes] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    type: 'smart_display' as const,
    provider: 'google' as const,
    location: '',
    capabilities: [] as string[],
  })

  useEffect(() => {
    loadHomes()
  }, [])

  useEffect(() => {
    if (selectedHome) {
      loadSurfaces()
    }
  }, [selectedHome])

  const loadHomes = async () => {
    try {
      setLoadingHomes(true)
      const data = await api.getHomes()
      setHomes(data)
      if (data.length > 0) {
        setSelectedHome(data[0].id)
      } else {
        toast.error('No homes found. Please create a home first.')
      }
    } catch (error: any) {
      console.error('Failed to load homes:', error)
      toast.error(error.response?.data?.message || 'Failed to load homes')
    } finally {
      setLoadingHomes(false)
    }
  }

  const loadSurfaces = async () => {
    if (!selectedHome) return
    
    try {
      setLoading(true)
      const data = await api.getSurfaces(selectedHome)
      setSurfaces(data)
    } catch (error: any) {
      console.error('Failed to load surfaces:', error)
      toast.error(error.response?.data?.message || 'Failed to load surfaces')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedHome) {
      toast.error('Please select a home first')
      return
    }

    if (!formData.name.trim()) {
      toast.error('Please enter a surface name')
      return
    }
    
    try {
      const capabilities = formData.type === 'smart_display' 
        ? ['voice', 'screen', 'touch']
        : formData.type === 'voice_assistant'
        ? ['voice']
        : ['screen']

      await api.createSurface({
        home_id: selectedHome,
        ...formData,
        capabilities,
      })

      toast.success('Surface added successfully!')
      setShowForm(false)
      setFormData({
        name: '',
        type: 'smart_display',
        provider: 'google',
        location: '',
        capabilities: [],
      })
      loadSurfaces()
    } catch (error: any) {
      console.error('Failed to create surface:', error)
      toast.error(error.response?.data?.message || 'Failed to create surface')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this surface?')) return

    try {
      await api.deleteSurface(id)
      toast.success('Surface deleted successfully')
      loadSurfaces()
    } catch (error: any) {
      console.error('Failed to delete surface:', error)
      toast.error(error.response?.data?.message || 'Failed to delete surface')
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'smart_display':
        return '📺'
      case 'voice_assistant':
        return '🔊'
      case 'web_app':
        return '🌐'
      case 'mobile_app':
        return '📱'
      default:
        return '📟'
    }
  }

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto overflow-y-auto h-full">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Surfaces</h1>
        <p className="text-sm sm:text-base text-gray-600">
          Manage client interfaces where NEXA can display information and respond to commands
        </p>
      </div>

      {/* Home Selector */}
      <div className="mb-4 sm:mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Home
        </label>
        {loadingHomes ? (
          <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
            Loading homes...
          </div>
        ) : homes.length === 0 ? (
          <div className="w-full px-4 py-2 border border-red-300 rounded-lg bg-red-50 text-red-600">
            No homes found. Please create a home first.
          </div>
        ) : (
          <select
            value={selectedHome}
            onChange={(e) => setSelectedHome(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {homes.map((home) => (
              <option key={home.id} value={home.id}>
                {home.home_name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Add Surface Button */}
      <div className="mb-4 sm:mb-6">
        <Button
          onClick={() => setShowForm(!showForm)}
          disabled={!selectedHome || loadingHomes}
          className="flex items-center space-x-2 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Surface</span>
        </Button>
      </div>

      {/* Add Surface Form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 mb-4 sm:mb-6 max-h-[70vh] sm:max-h-[600px] overflow-y-auto">
          <h2 className="text-base sm:text-lg font-semibold mb-4">Add New Surface</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Surface Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Kitchen Display"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type *
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="smart_display">Smart Display (Nest Hub, Echo Show)</option>
                <option value="voice_assistant">Voice Assistant (Google Home, Alexa)</option>
                <option value="web_app">Web App (Browser)</option>
                <option value="mobile_app">Mobile App</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Provider *
              </label>
              <select
                value={formData.provider}
                onChange={(e) => setFormData({ ...formData, provider: e.target.value as any })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="google">Google</option>
                <option value="amazon">Amazon</option>
                <option value="apple">Apple</option>
                <option value="nexa">NEXA</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g., Kitchen"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              <Button type="submit" className="w-full sm:w-auto">Add Surface</Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="w-full sm:w-auto">
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Surfaces List */}
      {loading ? (
        <div className="text-center py-12 text-gray-500 text-sm sm:text-base">Loading surfaces...</div>
      ) : surfaces.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 sm:p-8 text-center">
          <p className="text-gray-600 mb-2 text-sm sm:text-base">No surfaces registered yet</p>
          <p className="text-xs sm:text-sm text-gray-500">
            Add your smart displays, voice assistants, or other client interfaces
          </p>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {surfaces.map((surface) => (
            <div
              key={surface.id}
              className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 hover:border-gray-300 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start space-x-2 sm:space-x-4 flex-1 min-w-0">
                  <div className="text-2xl sm:text-3xl flex-shrink-0">{getTypeIcon(surface.type)}</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base sm:text-lg text-gray-900 truncate">{surface.name}</h3>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-2 text-xs sm:text-sm text-gray-600">
                      <span className="capitalize">{surface.provider}</span>
                      <span className="hidden sm:inline">•</span>
                      <span className="capitalize">{surface.type.replace('_', ' ')}</span>
                      {surface.location && (
                        <>
                          <span className="hidden sm:inline">•</span>
                          <span className="truncate">{surface.location}</span>
                        </>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {surface.capabilities.map((cap) => (
                        <span
                          key={cap}
                          className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded whitespace-nowrap"
                        >
                          {cap}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(surface.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
