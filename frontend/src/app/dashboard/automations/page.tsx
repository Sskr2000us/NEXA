'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Settings, Power, Plus, Clock } from 'lucide-react'

export default function AutomationsPage() {
  const [automations, setAutomations] = useState<any[]>([])
  const [homes, setHomes] = useState<any[]>([])
  const [selectedHome, setSelectedHome] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)

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
      loadAutomations(selectedHome)
    } catch (error) {
      console.error('Failed to toggle automation:', error)
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
            <Button>
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
                      <Settings className="w-5 h-5 text-gray-600 mr-2" />
                      <h3 className="font-semibold text-gray-900">{automation.name}</h3>
                      {automation.enabled ? (
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
                        <span className="font-medium text-gray-700 mr-2">Trigger:</span>
                        <span className="text-gray-600 capitalize">
                          {automation.trigger?.type || 'N/A'}
                        </span>
                      </div>
                      
                      {automation.schedule && (
                        <div className="flex items-center text-sm">
                          <Clock className="w-4 h-4 text-gray-600 mr-2" />
                          <span className="text-gray-600">
                            Scheduled: {automation.schedule}
                          </span>
                        </div>
                      )}
                      
                      <div className="flex items-center text-sm">
                        <span className="font-medium text-gray-700 mr-2">Actions:</span>
                        <span className="text-gray-600">
                          {automation.actions?.length || 0} action(s)
                        </span>
                      </div>
                    </div>
                  </div>

                  <Button
                    variant={automation.enabled ? 'outline' : 'primary'}
                    size="sm"
                    onClick={() => handleToggle(automation.id, automation.enabled)}
                  >
                    <Power className="w-4 h-4 mr-2" />
                    {automation.enabled ? 'Disable' : 'Enable'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
