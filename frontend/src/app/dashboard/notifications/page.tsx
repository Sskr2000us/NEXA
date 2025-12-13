'use client'

import { useState, useEffect } from 'react'
import { Bell, CheckCheck, Trash2, Filter, Settings as SettingsIcon } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'

interface Notification {
  id: string
  notification_type: string
  subject: string | null
  body: string
  status: string
  read_at: string | null
  created_at: string
  priority: string
  related_device_id: string | null
  related_alert_id: string | null
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadNotifications()
  }, [filter])

  const loadNotifications = async () => {
    try {
      const response = await api.get('/notifications', {
        params: { status: filter === 'unread' ? 'unread' : undefined },
      })
      setNotifications(response.data)
    } catch (error: any) {
      console.error('Failed to load notifications:', error)
      toast.error('Failed to load notifications')
    } finally {
      setIsLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      await api.patch(`/notifications/${notificationId}/read`)
      loadNotifications()
    } catch (error: any) {
      toast.error('Failed to mark as read')
    }
  }

  const markAllAsRead = async () => {
    try {
      await api.post('/notifications/mark-all-read')
      toast.success('All notifications marked as read')
      loadNotifications()
    } catch (error: any) {
      toast.error('Failed to mark all as read')
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      await api.delete(`/notifications/${notificationId}`)
      toast.success('Notification deleted')
      loadNotifications()
    } catch (error: any) {
      toast.error('Failed to delete notification')
    }
  }

  const unreadCount = notifications.filter((n) => !n.read_at).length

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
          <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600 mt-1">
            Stay updated with your smart home activity
            {unreadCount > 0 && (
              <span className="ml-2 px-2 py-1 text-xs font-semibold bg-primary-100 text-primary-800 rounded-full">
                {unreadCount} new
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="secondary"
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
          >
            <CheckCheck className="w-4 h-4 mr-2" />
            Mark All Read
          </Button>
          <Button variant="secondary" onClick={() => window.location.href = '/dashboard/settings?tab=notifications'}>
            <SettingsIcon className="w-4 h-4 mr-2" />
            Preferences
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 border-b border-gray-200">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            filter === 'all'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            filter === 'unread'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {notifications.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Bell className="w-16 h-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {filter === 'unread' ? 'No unread notifications' : 'No notifications'}
              </h3>
              <p className="text-gray-600 text-center">
                {filter === 'unread'
                  ? 'You\'re all caught up!'
                  : 'Notifications about your devices and home will appear here'}
              </p>
            </CardContent>
          </Card>
        ) : (
          notifications.map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              onMarkAsRead={() => markAsRead(notification.id)}
              onDelete={() => deleteNotification(notification.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}

function NotificationCard({
  notification,
  onMarkAsRead,
  onDelete,
}: {
  notification: Notification
  onMarkAsRead: () => void
  onDelete: () => void
}) {
  const isUnread = !notification.read_at
  const priorityColors = {
    critical: 'border-red-500',
    high: 'border-orange-500',
    normal: 'border-blue-500',
    low: 'border-gray-300',
  }

  const priorityColor = priorityColors[notification.priority as keyof typeof priorityColors] || priorityColors.normal

  return (
    <Card className={`${isUnread ? 'bg-blue-50' : ''} border-l-4 ${priorityColor}`}>
      <CardContent className="py-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              {isUnread && (
                <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
              )}
              <span className="text-xs text-gray-500 uppercase tracking-wide">
                {notification.notification_type.replace('_', ' ')}
              </span>
              <span className="text-xs text-gray-400">•</span>
              <span className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
              </span>
            </div>
            {notification.subject && (
              <h4 className="font-semibold text-gray-900 mb-1">
                {notification.subject}
              </h4>
            )}
            <p className="text-gray-700 text-sm">{notification.body}</p>
          </div>
          <div className="flex items-center space-x-2 ml-4">
            {isUnread && (
              <button
                onClick={onMarkAsRead}
                className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
                title="Mark as read"
              >
                <CheckCheck className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={onDelete}
              className="p-2 text-gray-400 hover:text-red-600 transition-colors"
              title="Delete"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
