'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Zap, Power, Thermometer, Lightbulb, Lock, Plus } from 'lucide-react'
import AddDeviceModal from '@/components/AddDeviceModal'

export default function DevicesPage() {
  const searchParams = useSearchParams()
  const homeId = searchParams.get('homeId')
  
  const [devices, setDevices] = useState<any[]>([])
  const [homes, setHomes] = useState<any[]>([])
  const [selectedHome, setSelectedHome] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    loadHomes()
  }, [])

  useEffect(() => {
    if (selectedHome) {
      loadDevices(selectedHome)
    }
  }, [selectedHome])

  const loadHomes = async () => {
    try {
      const homesData = await api.getHomes()
      setHomes(homesData)
      if (homesData.length > 0) {
        setSelectedHome(homeId || homesData[0].id)
      }
    } catch (error) {
      console.error('Failed to load homes:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadDevices = async (hId: string) => {
    try {
      const devicesData = await api.getDevices(hId)
      setDevices(devicesData)
    } catch (error) {
      console.error('Failed to load devices:', error)
    }
  }

  const handleToggleDevice = async (deviceId: string, currentState: boolean) => {
    try {
      await api.controlDevice(deviceId, currentState ? 'turnOff' : 'turnOn')
      loadDevices(selectedHome)
    } catch (error) {
      console.error('Failed to control device:', error)
    }
  }

  const handleAddDevice = async (deviceData: any) => {
    await api.createDevice(selectedHome, deviceData)
    await loadDevices(selectedHome)
  }

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'light':
        return Lightbulb
      case 'thermostat':
        return Thermometer
      case 'lock':
        return Lock
      default:
        return Zap
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
          <h1 className="text-3xl font-bold text-gray-900">Devices</h1>
          <p className="text-gray-600 mt-2">Manage and control your smart home devices</p>
        </div>
        {homes.length > 0 && (
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Device
          </Button>
        )}
      </div>

      {/* No Homes - Show Create Home First */}
      {homes.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Create a home first
            </h3>
            <p className="text-gray-600 mb-4">
              You need to create a home before adding devices
            </p>
            <Button onClick={() => window.location.href = '/dashboard'}>
              Go to Dashboard to Create Home
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Add Device Modal */}
          <AddDeviceModal
            isOpen={showAddModal}
            onClose={() => setShowAddModal(false)}
            onAdd={handleAddDevice}
            homeId={selectedHome}
          />

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

          {/* Devices Grid */}
          {devices.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Zap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No devices yet
            </h3>
            <p className="text-gray-600 mb-4">
              Add your first device to get started
            </p>
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Device
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {devices.map((device) => {
            const DeviceIcon = getDeviceIcon(device.type)
            const isOnline = device.status === 'online'
            const isPoweredOn = device.state?.power === 'on'

            return (
              <Card key={device.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        isPoweredOn ? 'bg-primary-100' : 'bg-gray-100'
                      }`}>
                        <DeviceIcon className={`w-6 h-6 ${
                          isPoweredOn ? 'text-primary-600' : 'text-gray-400'
                        }`} />
                      </div>
                      <div className="ml-3">
                        <h3 className="font-semibold text-gray-900">{device.name}</h3>
                        <p className="text-sm text-gray-500 capitalize">{device.type}</p>
                      </div>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${
                      isOnline ? 'bg-green-500' : 'bg-gray-300'
                    }`} />
                  </div>

                  {device.type === 'thermostat' && device.state?.temperature && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-gray-900">
                        {device.state.temperature}°
                      </p>
                      <p className="text-sm text-gray-600">
                        Target: {device.state.targetTemperature}°
                      </p>
                    </div>
                  )}

                  {device.type === 'light' && device.state?.brightness && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-600 mb-2">
                        Brightness: {device.state.brightness}%
                      </p>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary-600 h-2 rounded-full"
                          style={{ width: `${device.state.brightness}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <Button
                    variant={isPoweredOn ? 'outline' : 'primary'}
                    size="sm"
                    className="w-full"
                    onClick={() => handleToggleDevice(device.id, isPoweredOn)}
                    disabled={!isOnline}
                  >
                    <Power className="w-4 h-4 mr-2" />
                    {isPoweredOn ? 'Turn Off' : 'Turn On'}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
        </>
      )}
