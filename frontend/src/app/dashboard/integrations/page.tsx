'use client'

import { useState, useEffect } from 'react'
import { Plug, Plus, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'

interface Ecosystem {
  id: string
  name: string
  provider: string
  logo_url: string | null
  capabilities: any
}

interface UserConnection {
  id: string
  ecosystem_id: string
  connection_status: string
  last_sync_at: string | null
  error_message: string | null
  ecosystem: Ecosystem
}

export default function IntegrationsPage() {
  const [connections, setConnections] = useState<UserConnection[]>([])
  const [availableEcosystems, setAvailableEcosystems] = useState<Ecosystem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadIntegrations()
  }, [])

  const loadIntegrations = async () => {
    try {
      const homeId = localStorage.getItem('currentHomeId') || 'default'
      
      // Load user's connections
      const connectionsResponse = await api.get(`/ecosystem-connections`, {
        params: { homeId },
      })
      setConnections(connectionsResponse.data || [])

      // Load available ecosystems
      const ecosystemsResponse = await api.get('/ecosystems')
      setAvailableEcosystems(ecosystemsResponse.data || [])
    } catch (error: any) {
      console.error('Failed to load integrations:', error)
      toast.error('Failed to load integrations')
    } finally {
      setIsLoading(false)
    }
  }

  const connectEcosystem = async (ecosystemId: string) => {
    try {
      const homeId = localStorage.getItem('currentHomeId') || 'default'
      
      // Initiate OAuth flow
      const response = await api.post('/ecosystem-connections/connect', {
        ecosystem_id: ecosystemId,
        home_id: homeId,
      })

      if (response.data.authorization_url) {
        // Redirect to OAuth provider
        window.location.href = response.data.authorization_url
      } else {
        toast.success('Integration connected successfully')
        loadIntegrations()
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to connect integration')
    }
  }

  const disconnectIntegration = async (connectionId: string) => {
    if (!confirm('Are you sure you want to disconnect this integration?')) return

    try {
      await api.delete(`/ecosystem-connections/${connectionId}`)
      toast.success('Integration disconnected')
      loadIntegrations()
    } catch (error: any) {
      toast.error('Failed to disconnect integration')
    }
  }

  const syncIntegration = async (connectionId: string) => {
    try {
      await api.post(`/ecosystem-connections/${connectionId}/sync`)
      toast.success('Sync initiated')
      loadIntegrations()
    } catch (error: any) {
      toast.error('Failed to sync integration')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const connectedIds = connections.map((c) => c.ecosystem_id)
  const unconnectedEcosystems = availableEcosystems.filter(
    (e) => !connectedIds.includes(e.id)
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Integrations</h1>
        <p className="text-gray-600 mt-1">
          Connect your smart home ecosystems and devices
        </p>
      </div>

      {/* Connected Integrations */}
      {connections.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Connected ({connections.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {connections.map((connection) => (
              <Card key={connection.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      {connection.ecosystem.logo_url ? (
                        <img
                          src={connection.ecosystem.logo_url}
                          alt={connection.ecosystem.name}
                          className="w-12 h-12 rounded-lg"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                          <Plug className="w-6 h-6 text-gray-500" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {connection.ecosystem.name}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {connection.ecosystem.provider}
                        </p>
                      </div>
                    </div>
                    {connection.connection_status === 'connected' ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    )}
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Status</span>
                      <span
                        className={`font-medium ${
                          connection.connection_status === 'connected'
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {connection.connection_status}
                      </span>
                    </div>
                    {connection.last_sync_at && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Last Sync</span>
                        <span className="text-gray-900">
                          {new Date(connection.last_sync_at).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {connection.error_message && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-xs text-red-600">
                        {connection.error_message}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={() => syncIntegration(connection.id)}
                      variant="secondary"
                      size="sm"
                      className="flex-1"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Sync
                    </Button>
                    <Button
                      onClick={() => disconnectIntegration(connection.id)}
                      variant="secondary"
                      size="sm"
                    >
                      Disconnect
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Available Integrations */}
      {unconnectedEcosystems.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Available Integrations
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {unconnectedEcosystems.map((ecosystem) => (
              <Card key={ecosystem.id}>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    {ecosystem.logo_url ? (
                      <img
                        src={ecosystem.logo_url}
                        alt={ecosystem.name}
                        className="w-12 h-12 rounded-lg"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                        <Plug className="w-6 h-6 text-gray-500" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {ecosystem.name}
                      </h3>
                      <p className="text-xs text-gray-500">{ecosystem.provider}</p>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 mb-4">
                    Connect your {ecosystem.name} devices to NEXA for unified control
                    and monitoring.
                  </p>

                  <Button
                    onClick={() => connectEcosystem(ecosystem.id)}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Connect
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {connections.length === 0 && unconnectedEcosystems.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Plug className="w-16 h-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No integrations available
            </h3>
            <p className="text-gray-600 text-center">
              Check back later for new integration options
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
