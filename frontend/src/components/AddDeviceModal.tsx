'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { Button } from './ui/Button'
import { X, Lightbulb, Thermometer, Lock, Video, Shield, Zap } from 'lucide-react'

interface AddDeviceModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (device: any) => void
  homeId: string
}

const DEVICE_TYPES = [
  { value: 'light', label: 'Smart Light', icon: Lightbulb, color: 'text-yellow-600' },
  { value: 'thermostat', label: 'Thermostat', icon: Thermometer, color: 'text-blue-600' },
  { value: 'lock', label: 'Smart Lock', icon: Lock, color: 'text-gray-600' },
  { value: 'camera', label: 'Security Camera', icon: Video, color: 'text-red-600' },
  { value: 'switch', label: 'Smart Switch', icon: Zap, color: 'text-green-600' },
  { value: 'sensor_motion', label: 'Motion Sensor', icon: Shield, color: 'text-purple-600' },
  { value: 'sensor_contact', label: 'Contact Sensor', icon: Shield, color: 'text-indigo-600' },
  { value: 'other', label: 'Other Device', icon: Zap, color: 'text-gray-600' },
]

export default function AddDeviceModal({ isOpen, onClose, onAdd, homeId }: AddDeviceModalProps) {
  const [formData, setFormData] = useState({
    device_name: '',
    device_type: 'light',
    manufacturer_device_id: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await onAdd(formData)
      setFormData({
        device_name: '',
        device_type: 'light',
        manufacturer_device_id: '',
      })
      onClose()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add device')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Add Smart Device</h2>
            <p className="text-sm text-gray-600 mt-1">
              Connect a new device to your smart home
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Device Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Device Name
            </label>
            <input
              type="text"
              value={formData.device_name}
              onChange={(e) => setFormData({ ...formData, device_name: e.target.value })}
              placeholder="e.g., Living Room Light, Front Door Lock"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>

          {/* Device Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Device Type
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {DEVICE_TYPES.map((type) => {
                const Icon = type.icon
                const isSelected = formData.device_type === type.value
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, device_type: type.value })}
                    className={`p-4 border-2 rounded-lg transition-all hover:border-primary-500 ${
                      isSelected
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <Icon className={`w-8 h-8 mx-auto mb-2 ${type.color}`} />
                    <p className="text-xs font-medium text-gray-900 text-center">
                      {type.label}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Manufacturer ID (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Device ID (Optional)
            </label>
            <input
              type="text"
              value={formData.manufacturer_device_id}
              onChange={(e) => setFormData({ ...formData, manufacturer_device_id: e.target.value })}
              placeholder="Serial number or manufacturer device ID"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter the device's serial number if available for better identification
            </p>
          </div>

          {/* Setup Instructions */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <h3 className="font-medium text-blue-900 mb-2">Setup Instructions</h3>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Put your device in pairing mode (usually by pressing a button)</li>
                <li>Enter the device name and select the type above</li>
                <li>Click "Add Device" to register it with NEXA</li>
                <li>The device will appear in your dashboard</li>
              </ol>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !formData.device_name}
            >
              {isLoading ? 'Adding Device...' : 'Add Device'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
