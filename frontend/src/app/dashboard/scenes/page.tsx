'use client'

import { useState, useEffect } from 'react'
import { Play, Plus, Edit2, Trash2, Star, StarOff, Palette } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'

interface Scene {
  id: string
  name: string
  description: string | null
  icon: string | null
  color: string | null
  device_states: any[]
  is_favorite: boolean
  activation_count: number
  last_activated_at: string | null
}

export default function ScenesPage() {
  const [scenes, setScenes] = useState<Scene[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingScene, setEditingScene] = useState<Scene | null>(null)

  useEffect(() => {
    loadScenes()
  }, [])

  const loadScenes = async () => {
    try {
      // TODO: Replace with actual home ID from context/store
      const homeId = localStorage.getItem('currentHomeId') || 'default'
      const response = await api.get(`/homes/${homeId}/scenes`)
      setScenes(response.data)
    } catch (error: any) {
      console.error('Failed to load scenes:', error)
      toast.error('Failed to load scenes')
    } finally {
      setIsLoading(false)
    }
  }

  const activateScene = async (sceneId: string) => {
    try {
      await api.post(`/scenes/${sceneId}/activate`)
      toast.success('Scene activated!')
      loadScenes()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to activate scene')
    }
  }

  const toggleFavorite = async (scene: Scene) => {
    try {
      await api.patch(`/scenes/${scene.id}`, {
        is_favorite: !scene.is_favorite,
      })
      toast.success(scene.is_favorite ? 'Removed from favorites' : 'Added to favorites')
      loadScenes()
    } catch (error: any) {
      toast.error('Failed to update favorite status')
    }
  }

  const deleteScene = async (sceneId: string) => {
    if (!confirm('Are you sure you want to delete this scene?')) return

    try {
      await api.delete(`/scenes/${sceneId}`)
      toast.success('Scene deleted')
      loadScenes()
    } catch (error: any) {
      toast.error('Failed to delete scene')
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Scenes</h1>
          <p className="text-gray-600 mt-1">
            Control multiple devices with a single tap
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Scene
        </Button>
      </div>

      {/* Favorite Scenes */}
      {scenes.some((s) => s.is_favorite) && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Favorites</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {scenes
              .filter((s) => s.is_favorite)
              .map((scene) => (
                <SceneCard
                  key={scene.id}
                  scene={scene}
                  onActivate={() => activateScene(scene.id)}
                  onToggleFavorite={() => toggleFavorite(scene)}
                  onEdit={() => setEditingScene(scene)}
                  onDelete={() => deleteScene(scene.id)}
                />
              ))}
          </div>
        </div>
      )}

      {/* All Scenes */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">All Scenes</h2>
        {scenes.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Palette className="w-16 h-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No scenes yet</h3>
              <p className="text-gray-600 text-center mb-6 max-w-md">
                Create your first scene to control multiple devices at once. Perfect for morning routines,
                movie nights, or bedtime.
              </p>
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Scene
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {scenes.map((scene) => (
              <SceneCard
                key={scene.id}
                scene={scene}
                onActivate={() => activateScene(scene.id)}
                onToggleFavorite={() => toggleFavorite(scene)}
                onEdit={() => setEditingScene(scene)}
                onDelete={() => deleteScene(scene.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function SceneCard({
  scene,
  onActivate,
  onToggleFavorite,
  onEdit,
  onDelete,
}: {
  scene: Scene
  onActivate: () => void
  onToggleFavorite: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const deviceCount = scene.device_states?.length || 0

  return (
    <Card 
      className="hover:shadow-lg transition-shadow cursor-pointer"
      style={{ borderLeftColor: scene.color || '#6366f1', borderLeftWidth: '4px' }}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            {scene.icon && <span className="text-2xl">{scene.icon}</span>}
            <div>
              <CardTitle className="text-lg">{scene.name}</CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                {deviceCount} {deviceCount === 1 ? 'device' : 'devices'}
              </p>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggleFavorite()
            }}
            className="text-gray-400 hover:text-yellow-500 transition-colors"
          >
            {scene.is_favorite ? (
              <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
            ) : (
              <StarOff className="w-5 h-5" />
            )}
          </button>
        </div>
        {scene.description && (
          <p className="text-sm text-gray-600 mt-2">{scene.description}</p>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <span>Used {scene.activation_count || 0} times</span>
          {scene.last_activated_at && (
            <span>
              Last: {new Date(scene.last_activated_at).toLocaleDateString()}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={onActivate} className="flex-1">
            <Play className="w-4 h-4 mr-2" />
            Activate
          </Button>
          <Button onClick={onEdit} variant="secondary" size="sm">
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button onClick={onDelete} variant="secondary" size="sm">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
