'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Bell, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { formatDate, formatTime } from '@/lib/utils'

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<any[]>([])
  const [homes, setHomes] = useState<any[]>([])
  const [selectedHome, setSelectedHome] = useState<string>('')
  const [filter, setFilter] = useState<'all' | 'active' | 'resolved'>('all')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadHomes()
  }, [])

  useEffect(() => {
    if (selectedHome) {
      loadAlerts(selectedHome)
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

  const loadAlerts = async (hId: string) => {
    try {
      const data = await api.getAlerts(hId)
      setAlerts(data)
    } catch (error) {
      console.error('Failed to load alerts:', error)
    }
  }

  const handleResolve = async (id: string) => {
    try {
      await api.resolveAlert(id)
      loadAlerts(selectedHome)
    } catch (error) {
      console.error('Failed to resolve alert:', error)
    }
  }

  const filteredAlerts = alerts.filter((alert) => {
    if (filter === 'all') return true
    return alert.status === filter
  })

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-700'
      case 'warning':
        return 'bg-yellow-100 text-yellow-700'
      case 'info':
        return 'bg-blue-100 text-blue-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return XCircle
      case 'warning':
        return AlertTriangle
      default:
        return Bell
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Alerts</h1>
        <p className="text-gray-600 mt-2">Monitor and manage system alerts</p>
      </div>

      {/* Controls */}
      <div className="mb-6 flex items-center gap-4">
        {homes.length > 1 && (
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
        )}

        <div className="flex items-center gap-2">
          {(['all', 'active', 'resolved'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${
                filter === f
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts List */}
      {filteredAlerts.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No alerts to display
            </h3>
            <p className="text-gray-600">
              {filter === 'all'
                ? 'All systems are running smoothly'
                : `No ${filter} alerts at the moment`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredAlerts.map((alert) => {
            const SeverityIcon = getSeverityIcon(alert.severity)
            
            return (
              <Card key={alert.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          alert.severity === 'critical' ? 'bg-red-100' :
                          alert.severity === 'warning' ? 'bg-yellow-100' : 'bg-blue-100'
                        }`}>
                          <SeverityIcon className={`w-5 h-5 ${
                            alert.severity === 'critical' ? 'text-red-600' :
                            alert.severity === 'warning' ? 'text-yellow-600' : 'text-blue-600'
                          }`} />
                        </div>
                        
                        <div className="ml-3 flex-1">
                          <div className="flex items-center">
                            <h3 className="font-semibold text-gray-900">{alert.title}</h3>
                            <span className={`ml-3 px-2 py-1 text-xs rounded-full capitalize ${
                              getSeverityColor(alert.severity)
                            }`}>
                              {alert.severity}
                            </span>
                            {alert.status === 'resolved' && (
                              <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                                Resolved
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                        </div>
                      </div>

                      <div className="ml-13 space-y-1 text-sm text-gray-600">
                        <p>
                          <span className="font-medium">Device:</span> {alert.deviceName || 'N/A'}
                        </p>
                        <p>
                          <span className="font-medium">Time:</span>{' '}
                          {formatDate(alert.createdAt)} at {formatTime(alert.createdAt)}
                        </p>
                      </div>
                    </div>

                    {alert.status === 'active' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResolve(alert.id)}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Resolve
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
