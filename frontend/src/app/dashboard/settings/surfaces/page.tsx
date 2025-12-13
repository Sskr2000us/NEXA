'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Plus, Trash2, Edit2 } from 'lucide-react'

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
  const [surfaces, setSurfaces] = [useState<Surface[]>([])
  const [homes, setHomes] = useState<any[]>([])
  const [selectedHome, setSelectedHome] = useState<string>('')
  const [loading, setLoading] = useState(true)
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
      const data = await api.getHomes()
      setHomes(data)
      if (data.length > 0) {
        setSelectedHome(data[0].id)
      }
    } catch (error) {
      console.error('Failed to load homes:', error)
    }
  }

  const loadSurfaces = async () => {
    if (!selectedHome) return
    
    try {
      setLoading(true)
      const data = await api.getSurfaces(selectedHome)
      setSurfaces(data)
    } catch (error) {
      console.error('Failed to load surfaces:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
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

      setShowForm(false)
      setFormData({
        name: '',
        type: 'smart_display',
        provider: 'google',
        location: '',
        capabilities: [],
      })
      loadSurfaces()
    } catch (error) {
      console.error('Failed to create surface:', error)
      alert('Failed to create surface')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this surface?')) return

    try {
      await api.deleteSurface(id)
      loadSurfaces()
    } catch (error) {
      console.error('Failed to delete surface:', error)
      alert('Failed to delete surface')
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
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Surfaces</h1>
        <p className="text-gray-600">
          Manage client interfaces where NEXA can display information and respond to commands
        </p>
      </div>

      {/* Home Selector */}
      {homes.length > 1 && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Home
          </label>
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
        </div>
      )}

      {/* Add Surface Button */}
      <div className="mb-6">
        <Button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Surface</span>
        </Button>
      </div>

      {/* Add Surface Form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Add New Surface</h2>
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

            <div className="flex space-x-3">
              <Button type="submit">Add Surface</Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Surfaces List */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading surfaces...</div>
      ) : surfaces.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-600 mb-2">No surfaces registered yet</p>
          <p className="text-sm text-gray-500">
            Add your smart displays, voice assistants, or other client interfaces
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {surfaces.map((surface) => (
            <div
              key={surface.id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="text-3xl">{getTypeIcon(surface.type)}</div>
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">{surface.name}</h3>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                      <span className="capitalize">{surface.provider}</span>
                      <span>•</span>
                      <span className="capitalize">{surface.type.replace('_', ' ')}</span>
                      {surface.location && (
                        <>
                          <span>•</span>
                          <span>{surface.location}</span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 mt-2">
                      {surface.capabilities.map((cap) => (
                        <span
                          key={cap}
                          className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded"
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
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
