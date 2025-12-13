'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { Button } from './ui/Button'
import { Input } from './ui/Input'

interface AddHomeModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (homeData: any) => Promise<void>
}

export default function AddHomeModal({ isOpen, onClose, onAdd }: AddHomeModalProps) {
  const [name, setName] = useState('')
  const [addressLine1, setAddressLine1] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  console.log('AddHomeModal render - isOpen:', isOpen)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('Home name is required')
      return
    }

    setIsLoading(true)
    try {
      await onAdd({
        name: name.trim(),
        address_line1: addressLine1.trim() || undefined,
        city: city.trim() || undefined,
        state: state.trim() || undefined,
        postal_code: postalCode.trim() || undefined,
      })
      
      // Reset form
      setName('')
      setAddressLine1('')
      setCity('')
      setState('')
      setPostalCode('')
      onClose()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create home')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Add New Home</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <Input
            label="Home Name"
            placeholder="e.g., Main House, Vacation Home"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />

          <Input
            label="Address (Optional)"
            placeholder="123 Main Street"
            value={addressLine1}
            onChange={(e) => setAddressLine1(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="City (Optional)"
              placeholder="San Francisco"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />

            <Input
              label="State (Optional)"
              placeholder="CA"
              value={state}
              onChange={(e) => setState(e.target.value)}
            />
          </div>

          <Input
            label="Zip Code (Optional)"
            placeholder="94102"
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value)}
          />

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !name.trim()}
              className="flex-1"
            >
              {isLoading ? 'Creating...' : 'Create Home'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
