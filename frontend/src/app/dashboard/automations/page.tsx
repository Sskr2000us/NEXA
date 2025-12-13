'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import AutomationBuilder from '@/components/AutomationBuilder'
import { Settings, Power, Plus, Clock, Edit2, Trash2, AlertCircle, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AutomationsPage() {
  const [automations, setAutomations] = useState<any[]>([])
  const [homes, setHomes] = useState<any[]>([])
  const [selectedHome, setSelectedHome] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [showBuilder, setShowBuilder] = useState(false)
  const [editingAutomation, setEditingAutomation] = useState<any>(null)

  useEffect(() => {
    loadHomes()
  }, [])

  useEffect(() => {
    if (selectedHome) {
      loadAutomations(selectedHome)
    }
  }, [selectedHome])

  const loadHomes = async () => {
    try {
      const homesData = await api.getHomes()
      setHomes(homesData)
      if (homesData.length > 0) {
        setSelectedHome(homesData[0].id)
      }
    } catch (error) {
      console.error('Failed to load homes:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadAutomations = async (hId: string) => {
    try {
      const data = await api.getAutomations(hId)
      setAutomations(data)
    } catch (error) {
      console.error('Failed to load automations:', error)
    }
  }

  const handleToggle = async (id: string, enabled: boolean) => {
    try {
      await api.toggleAutomation(id, !enabled)
      toast.success(enabled ? 'Automation disabled' : 'Automation enabled')
      loadAutomations(selectedHome)
    } catch (error) {
      console.error('Failed to toggle automation:', error)
      toast.error('Failed to toggle automation')
    }
  }

  const handleSave = async (automationData: any) => {
    try {
      if (editingAutomation) {
        await api.patch(`/automations/${editingAutomation.id}`, automationData)
        toast.success('Automation updated')
      } else {
        await api.post('/automations', {
          ...automationData,
          home_id: selectedHome,
        })
        toast.success('Automation created')
      }
      setShowBuilder(false)
      setEditingAutomation(null)
      loadAutomations(selectedHome)
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save automation')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this automation?')) return

    try {
      await api.delete(`/automations/${id}`)
      toast.success('Automation deleted')
      loadAutomations(selectedHome)
    } catch (error) {
      toast.error('Failed to delete automation')
    }
  }

  const openBuilder = (automation?: any) => {
    setEditingAutomation(automation || null)
    setShowBuilder(true)
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
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Automations</h1>
          <p className="text-gray-600 mt-2">Create and manage automation rules</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Create Automation
        </Button>
      </div>

      {/* Home Selector */}
      {homes.length > 1 && (
        <div className="mb-6">
          <select
            value={selectedHome}
            onChange={(e) => setSelectedHome(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {homes.map((home) => (
              <option key={home.id} value={home.id}>
                {home.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Automations List */}
      {automations.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No automations yet
            </h3>
            <p className="text-gray-600 mb-4">
              Create your first automation to make your home smarter
            </p>
            <Button onClick={() => openBuilder()}>
              <Plus className="w-4 h-4 mr-2" />
              Create Automation
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {automations.map((automation) => (
            <Card key={automation.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      {automation.health_status === 'healthy' ? (
                        <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-orange-600 mr-2" />
                      )}
                      <h3 className="font-semibold text-gray-900">{automation.name}</h3>
                      {automation.is_enabled ? (
                        <span className="ml-3 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                          Active
                        </span>
                      ) : (
                        <span className="ml-3 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                          Inactive
                        </span>
                      )}
                    </div>
                    
                    {automation.description && (
                      <p className="text-sm text-gray-600 mb-4">{automation.description}</p>
                    )}

                    <div className="space-y-2">
                      <div className="flex items-center text-sm">
                        <span className="font-medium text-gray-700 mr-2">Triggers:</span>
                        <span className="text-gray-600">
                          {automation.triggers?.length || 0} trigger(s)
                        </span>
                      </div>
                      
                      {automation.last_executed_at && (
                        <div className="flex items-center text-sm">
                          <Clock className="w-4 h-4 text-gray-600 mr-2" />
                          <span className="text-gray-600">
                            Last run: {new Date(automation.last_executed_at).toLocaleString()}
                          </span>
                        </div>
                      )}
                      
                      <div className="flex items-center text-sm">
                        <span className="font-medium text-gray-700 mr-2">Actions:</span>
                        <span className="text-gray-600">
                          {automation.actions?.length || 0} action(s)
                        </span>
                      </div>

                      {automation.total_executions > 0 && (
                        <div className="flex items-center text-sm">
                          <span className="font-medium text-gray-700 mr-2">Success Rate:</span>
                          <span className="text-gray-600">
                            {automation.success_count || 0}/{automation.total_executions} ({Math.round((automation.success_count / automation.total_executions) * 100)}%)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => openBuilder(automation)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleDelete(automation.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={automation.is_enabled ? 'outline' : 'primary'}
                      size="sm"
                      onClick={() => handleToggle(automation.id, automation.is_enabled)}
                    >
                      <Power className="w-4 h-4 mr-2" />
                      {automation.is_enabled ? 'Disable' : 'Enable'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Automation Builder Modal */}
      <AutomationBuilder
        isOpen={showBuilder}
        onClose={() => {
          setShowBuilder(false)
          setEditingAutomation(null)
        }}
        onSave={handleSave}
        automation={editingAutomation}
      />
    </div>
  )
}

