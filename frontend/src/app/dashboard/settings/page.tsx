'use client'

import { useState, useEffect } from 'react'
import { User, Bell, Home, Shield, Palette, Users, Mail } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { api } from '@/lib/api'
import { useAuth } from '@/store/auth'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')
  const [isLoading, setIsLoading] = useState(false)

  // Profile state
  const [fullName, setFullName] = useState(user?.fullName || '')
  const [email, setEmail] = useState(user?.email || '')
  const [phone, setPhone] = useState('')
  const [timezone, setTimezone] = useState('America/Los_Angeles')

  // Notification preferences
  const [notificationPrefs, setNotificationPrefs] = useState({
    push_enabled: true,
    email_enabled: true,
    sms_enabled: false,
    device_alerts_enabled: true,
    security_alerts_enabled: true,
    energy_alerts_enabled: true,
    automation_alerts_enabled: true,
    predictive_alerts_enabled: true,
    quiet_hours_enabled: false,
    quiet_hours_start: '22:00',
    quiet_hours_end: '07:00',
  })

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '')
      setEmail(user.email || '')
    }
    loadNotificationPreferences()
  }, [user])

  const loadNotificationPreferences = async () => {
    try {
      const response = await api.get('/notifications/preferences')
      if (response.data) {
        setNotificationPrefs(response.data)
      }
    } catch (error: any) {
      console.error('Failed to load notification preferences:', error)
    }
  }

  const updateProfile = async () => {
    setIsLoading(true)
    try {
      await api.patch('/auth/profile', {
        full_name: fullName,
        phone,
        timezone,
      })
      toast.success('Profile updated successfully')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update profile')
    } finally {
      setIsLoading(false)
    }
  }

  const updateNotificationPreferences = async () => {
    setIsLoading(true)
    try {
      await api.patch('/notifications/preferences', notificationPrefs)
      toast.success('Notification preferences updated')
    } catch (error: any) {
      toast.error('Failed to update preferences')
    } finally {
      setIsLoading(false)
    }
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'homes', label: 'Homes & Members', icon: Home },
    { id: 'security', label: 'Security', icon: Shield },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">
          Manage your account and preferences
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-64 flex-shrink-0">
          <Card>
            <CardContent className="p-4">
              <nav className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                        activeTab === tab.id
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="w-5 h-5 mr-3" />
                      {tab.label}
                    </button>
                  )
                })}
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeTab === 'profile' && (
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  label="Full Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                />
                <Input
                  label="Email"
                  type="email"
                  value={email}
                  disabled
                  helper="Contact support to change your email"
                />
                <Input
                  label="Phone Number"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 123-4567"
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Timezone
                  </label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="America/Los_Angeles">Pacific Time (PT)</option>
                    <option value="America/Denver">Mountain Time (MT)</option>
                    <option value="America/Chicago">Central Time (CT)</option>
                    <option value="America/New_York">Eastern Time (ET)</option>
                  </select>
                </div>
                <Button onClick={updateProfile} disabled={isLoading}>
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </Button>
              </CardContent>
            </Card>
          )}

          {activeTab === 'notifications' && (
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">
                    Channels
                  </h3>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={notificationPrefs.push_enabled}
                        onChange={(e) =>
                          setNotificationPrefs({
                            ...notificationPrefs,
                            push_enabled: e.target.checked,
                          })
                        }
                        className="w-4 h-4 text-primary-600 rounded"
                      />
                      <span className="ml-3 text-sm text-gray-700">
                        Push Notifications
                      </span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={notificationPrefs.email_enabled}
                        onChange={(e) =>
                          setNotificationPrefs({
                            ...notificationPrefs,
                            email_enabled: e.target.checked,
                          })
                        }
                        className="w-4 h-4 text-primary-600 rounded"
                      />
                      <span className="ml-3 text-sm text-gray-700">
                        Email Notifications
                      </span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={notificationPrefs.sms_enabled}
                        onChange={(e) =>
                          setNotificationPrefs({
                            ...notificationPrefs,
                            sms_enabled: e.target.checked,
                          })
                        }
                        className="w-4 h-4 text-primary-600 rounded"
                      />
                      <span className="ml-3 text-sm text-gray-700">
                        SMS Notifications
                      </span>
                    </label>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">
                    Alert Types
                  </h3>
                  <div className="space-y-3">
                    {[
                      { key: 'device_alerts_enabled', label: 'Device Alerts' },
                      { key: 'security_alerts_enabled', label: 'Security Alerts' },
                      { key: 'energy_alerts_enabled', label: 'Energy Alerts' },
                      { key: 'automation_alerts_enabled', label: 'Automation Alerts' },
                      { key: 'predictive_alerts_enabled', label: 'Predictive Maintenance' },
                    ].map((item) => (
                      <label key={item.key} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={notificationPrefs[item.key as keyof typeof notificationPrefs] as boolean}
                          onChange={(e) =>
                            setNotificationPrefs({
                              ...notificationPrefs,
                              [item.key]: e.target.checked,
                            })
                          }
                          className="w-4 h-4 text-primary-600 rounded"
                        />
                        <span className="ml-3 text-sm text-gray-700">
                          {item.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="flex items-center mb-3">
                    <input
                      type="checkbox"
                      checked={notificationPrefs.quiet_hours_enabled}
                      onChange={(e) =>
                        setNotificationPrefs({
                          ...notificationPrefs,
                          quiet_hours_enabled: e.target.checked,
                        })
                      }
                      className="w-4 h-4 text-primary-600 rounded"
                    />
                    <span className="ml-3 text-sm font-semibold text-gray-900">
                      Quiet Hours
                    </span>
                  </label>
                  {notificationPrefs.quiet_hours_enabled && (
                    <div className="grid grid-cols-2 gap-4 pl-7">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">
                          Start Time
                        </label>
                        <input
                          type="time"
                          value={notificationPrefs.quiet_hours_start}
                          onChange={(e) =>
                            setNotificationPrefs({
                              ...notificationPrefs,
                              quiet_hours_start: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">
                          End Time
                        </label>
                        <input
                          type="time"
                          value={notificationPrefs.quiet_hours_end}
                          onChange={(e) =>
                            setNotificationPrefs({
                              ...notificationPrefs,
                              quiet_hours_end: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <Button onClick={updateNotificationPreferences} disabled={isLoading}>
                  {isLoading ? 'Saving...' : 'Save Preferences'}
                </Button>
              </CardContent>
            </Card>
          )}

          {activeTab === 'homes' && (
            <Card>
              <CardHeader>
                <CardTitle>Homes & Members</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Manage your homes and invite family members
                </p>
                <Button variant="secondary">
                  <Users className="w-4 h-4 mr-2" />
                  Invite Member
                </Button>
              </CardContent>
            </Card>
          )}

          {activeTab === 'security' && (
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Manage your account security and privacy
                </p>
                <Button variant="secondary">
                  Change Password
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
