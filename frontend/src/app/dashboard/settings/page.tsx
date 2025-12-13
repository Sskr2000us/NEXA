'use client'

import { useState, useEffect } from 'react'
import { User, Bell, Home, Shield, Palette, Users, Mail, Link2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { api } from '@/lib/api'
import { useAuth } from '@/store/auth'
import toast from 'react-hot-toast'
import { useSearchParams } from 'next/navigation'

export default function SettingsPage() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState('profile')
  const [isLoading, setIsLoading] = useState(false)

  // Profile state
  const [fullName, setFullName] = useState(user?.fullName || '')
  const [email, setEmail] = useState(user?.email || '')
  const [phone, setPhone] = useState('')
  const [timezone, setTimezone] = useState('America/Los_Angeles')

  // Google Integration state
  const [googleStatus, setGoogleStatus] = useState<any>(null)
  const [loadingGoogle, setLoadingGoogle] = useState(false)

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
    loadGoogleIntegrationStatus()

    // Check for OAuth callback parameters
    const googleParam = searchParams.get('google')
    if (googleParam === 'connected') {
      toast.success('Successfully connected to Google Home!')
      setActiveTab('integrations')
      loadGoogleIntegrationStatus()
    } else if (googleParam === 'error') {
      toast.error('Failed to connect to Google Home')
      setActiveTab('integrations')
    }
  }, [user, searchParams])

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

  const loadGoogleIntegrationStatus = async () => {
    try {
      const response = await api.getGoogleIntegrationStatus()
      setGoogleStatus(response)
    } catch (error: any) {
      console.error('Failed to load Google integration status:', error)
    }
  }

  const handleConnectGoogle = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/integrations/google/auth`
  }

  const handleDisconnectGoogle = async () => {
    setLoadingGoogle(true)
    try {
      await api.disconnectGoogleIntegration()
      toast.success('Disconnected from Google Home')
      loadGoogleIntegrationStatus()
    } catch (error: any) {
      toast.error('Failed to disconnect from Google Home')
    } finally {
      setLoadingGoogle(false)
    }
  }

  const handleSyncGoogleDevices = async () => {
    setLoadingGoogle(true)
    try {
      const response = await api.syncGoogleDevices()
      toast.success(`Synced ${response.deviceCount || 0} devices from Google Home`)
      loadGoogleIntegrationStatus()
    } catch (error: any) {
      toast.error('Failed to sync devices')
    } finally {
      setLoadingGoogle(false)
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
    { id: 'integrations', label: 'Integrations', icon: Link2 },
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

          {activeTab === 'integrations' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Smart Home Integrations</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    Connect your smart home platforms to control all devices in one place
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Google Home Integration */}
                  <div className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-white border border-gray-200 rounded-lg flex items-center justify-center">
                          <svg className="w-6 h-6" viewBox="0 0 24 24">
                            <path
                              fill="#4285F4"
                              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                              fill="#34A853"
                              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                              fill="#FBBC05"
                              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            />
                            <path
                              fill="#EA4335"
                              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                          </svg>
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">Google Home</h3>
                          <p className="text-sm text-gray-600">
                            Connect your Google Home devices and control them via NEXA
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {googleStatus?.isConnected && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                            Connected
                          </span>
                        )}
                      </div>
                    </div>

                    {googleStatus?.isConnected ? (
                      <div className="space-y-4">
                        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Status</span>
                            <span className="font-medium text-green-600">Active</span>
                          </div>
                          {googleStatus?.lastSynced && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Last Synced</span>
                              <span className="font-medium">
                                {new Date(googleStatus.lastSynced).toLocaleString()}
                              </span>
                            </div>
                          )}
                          {googleStatus?.deviceCount !== undefined && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Devices</span>
                              <span className="font-medium">{googleStatus.deviceCount}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex space-x-3">
                          <Button
                            onClick={handleSyncGoogleDevices}
                            disabled={loadingGoogle}
                            variant="secondary"
                            className="flex-1"
                          >
                            {loadingGoogle ? 'Syncing...' : 'Sync Devices'}
                          </Button>
                          <Button
                            onClick={handleDisconnectGoogle}
                            disabled={loadingGoogle}
                            variant="outline"
                            className="flex-1"
                          >
                            Disconnect
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <p className="text-sm text-gray-600">
                          Connect your Google Home account to import and control your devices through NEXA.
                        </p>
                        <Button
                          onClick={handleConnectGoogle}
                          disabled={loadingGoogle}
                          className="w-full"
                        >
                          Connect Google Home
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Amazon Alexa - Coming Soon */}
                  <div className="border border-gray-200 rounded-lg p-6 opacity-60">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-white border border-gray-200 rounded-lg flex items-center justify-center">
                          <svg className="w-6 h-6" viewBox="0 0 24 24">
                            <path
                              fill="#00CAFF"
                              d="M15.93 17.09c-.18.14-.44.11-.58-.05-1.5-1.76-1.76-2.57-2.49-4.22-.2-.42-.21-.58-.03-.98l3.01-5.27c.11-.19.02-.43-.18-.52-.19-.08-.42 0-.52.18L12.1 11.5c-.1.17-.32.23-.49.13l-4.62-2.67c-.18-.1-.24-.32-.14-.5.1-.17.32-.23.5-.13l3.89 2.25c.17.1.39.04.48-.13l2.97-5.18c.1-.17.32-.23.5-.13.17.1.23.32.13.49l-2.97 5.18c-.1.17-.04.39.13.48l4.62 2.67c.18.1.24.32.14.5-.1.17-.32.23-.5.13l-3.89-2.25c-.17-.1-.39-.04-.48.13l-2.97 5.18c-.1.17-.04.39.13.48 1.76 1.02 2.42 1.06 4.48 2.53.16.12.19.35.07.51z"
                            />
                          </svg>
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">Amazon Alexa</h3>
                          <p className="text-sm text-gray-600">
                            Control your Alexa-enabled devices through NEXA
                          </p>
                        </div>
                      </div>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                        Coming Soon
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      Amazon Alexa integration will be available soon.
                    </p>
                  </div>

                  {/* Apple HomeKit - Coming Soon */}
                  <div className="border border-gray-200 rounded-lg p-6 opacity-60">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-white border border-gray-200 rounded-lg flex items-center justify-center">
                          <svg className="w-6 h-6" viewBox="0 0 24 24">
                            <path
                              fill="#000000"
                              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"
                            />
                          </svg>
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">Apple HomeKit</h3>
                          <p className="text-sm text-gray-600">
                            Integrate your HomeKit accessories with NEXA
                          </p>
                        </div>
                      </div>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                        Coming Soon
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      Apple HomeKit integration will be available soon.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
