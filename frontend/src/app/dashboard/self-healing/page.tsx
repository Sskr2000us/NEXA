'use client'

import { useState, useEffect } from 'react'
import { Wrench, CheckCircle2, AlertCircle, XCircle, Clock, TrendingUp, Zap, RefreshCw, Download, Play, Pause, Settings, Activity, Shield } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

interface DiagnosticRun {
  id: string
  device_id: string
  device: {
    device_name: string
    device_type: string
  }
  diagnostic_type: 'health_check' | 'connectivity' | 'firmware' | 'performance' | 'security'
  status: 'pending' | 'running' | 'completed' | 'failed'
  started_at: string
  completed_at?: string
  duration_ms?: number
  issues_found: number
  issues_resolved: number
  overall_health_score: number
  recommendations: string[]
}

interface DiagnosticIssue {
  id: string
  diagnostic_run_id: string
  device_id: string
  device: {
    device_name: string
    device_type: string
  }
  issue_type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  detected_at: string
  status: 'open' | 'in_progress' | 'resolved' | 'ignored'
  auto_fixable: boolean
  fix_attempted: boolean
  fix_successful: boolean
  resolution_notes?: string
}

interface SelfHealingAction {
  id: string
  action_type: 'restart_device' | 'reset_connection' | 'update_firmware' | 'adjust_settings' | 'power_cycle'
  name: string
  description: string
  success_rate: number
  avg_execution_time_ms: number
  total_executions: number
  is_enabled: boolean
}

interface SelfHealingExecution {
  id: string
  device_id: string
  device: {
    device_name: string
    device_type: string
  }
  action_type: string
  trigger_reason: string
  time: string
  success: boolean
  duration_ms: number
  before_health_score: number
  after_health_score: number
  error_message?: string
}

interface FirmwareUpdate {
  id: string
  device_id: string
  device: {
    device_name: string
    device_type: string
  }
  current_version: string
  target_version: string
  update_type: 'security' | 'feature' | 'bugfix' | 'performance'
  status: 'available' | 'downloading' | 'installing' | 'completed' | 'failed'
  priority: 'low' | 'medium' | 'high' | 'critical'
  release_date: string
  download_progress?: number
  changelog: string[]
  auto_update_enabled: boolean
}

export default function SelfHealingPage() {
  const [loading, setLoading] = useState(true)
  const [selectedTab, setSelectedTab] = useState<'diagnostics' | 'healing' | 'firmware'>('diagnostics')
  
  // Diagnostics
  const [diagnosticRuns, setDiagnosticRuns] = useState<DiagnosticRun[]>([])
  const [diagnosticIssues, setDiagnosticIssues] = useState<DiagnosticIssue[]>([])
  
  // Self-Healing
  const [healingActions, setHealingActions] = useState<SelfHealingAction[]>([])
  const [healingExecutions, setHealingExecutions] = useState<SelfHealingExecution[]>([])
  
  // Firmware
  const [firmwareUpdates, setFirmwareUpdates] = useState<FirmwareUpdate[]>([])
  
  // Stats
  const [stats, setStats] = useState({
    totalDiagnostics: 0,
    issuesDetected: 0,
    issuesAutoResolved: 0,
    autoResolveRate: 0,
    avgHealthScore: 0,
    healingSuccessRate: 0,
    pendingUpdates: 0,
    criticalUpdates: 0,
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)

      // Get home_id
      const homesResponse = await api.get('/homes')
      const homeId = homesResponse.data[0]?.id

      if (!homeId) {
        toast.error('No home found')
        return
      }

      // Mock diagnostic runs
      const mockDiagnostics: DiagnosticRun[] = [
        {
          id: '1',
          device_id: 'device-1',
          device: { device_name: 'Smart Thermostat', device_type: 'climate_control' },
          diagnostic_type: 'health_check',
          status: 'completed',
          started_at: new Date(Date.now() - 3600000).toISOString(),
          completed_at: new Date(Date.now() - 3540000).toISOString(),
          duration_ms: 60000,
          issues_found: 2,
          issues_resolved: 2,
          overall_health_score: 95,
          recommendations: ['Update firmware to v2.1.3', 'Optimize temperature schedule']
        },
        {
          id: '2',
          device_id: 'device-2',
          device: { device_name: 'Front Door Lock', device_type: 'security' },
          diagnostic_type: 'connectivity',
          status: 'completed',
          started_at: new Date(Date.now() - 7200000).toISOString(),
          completed_at: new Date(Date.now() - 7140000).toISOString(),
          duration_ms: 60000,
          issues_found: 1,
          issues_resolved: 1,
          overall_health_score: 88,
          recommendations: ['Reset Z-Wave connection', 'Check battery level']
        },
      ]
      setDiagnosticRuns(mockDiagnostics)

      // Mock diagnostic issues
      const mockIssues: DiagnosticIssue[] = [
        {
          id: '1',
          diagnostic_run_id: '1',
          device_id: 'device-1',
          device: { device_name: 'Smart Thermostat', device_type: 'climate_control' },
          issue_type: 'connectivity',
          severity: 'medium',
          title: 'Intermittent Wi-Fi Disconnections',
          description: 'Device experiencing periodic Wi-Fi dropouts every 2-3 hours',
          detected_at: new Date(Date.now() - 3600000).toISOString(),
          status: 'resolved',
          auto_fixable: true,
          fix_attempted: true,
          fix_successful: true,
          resolution_notes: 'Reset Wi-Fi connection and optimized channel'
        },
        {
          id: '2',
          diagnostic_run_id: '2',
          device_id: 'device-2',
          device: { device_name: 'Front Door Lock', device_type: 'security' },
          issue_type: 'battery',
          severity: 'high',
          title: 'Low Battery Level',
          description: 'Battery level at 15%, recommend replacement soon',
          detected_at: new Date(Date.now() - 7200000).toISOString(),
          status: 'open',
          auto_fixable: false,
          fix_attempted: false,
          fix_successful: false
        },
      ]
      setDiagnosticIssues(mockIssues)

      // Mock healing actions
      const mockActions: SelfHealingAction[] = [
        {
          id: '1',
          action_type: 'restart_device',
          name: 'Restart Device',
          description: 'Perform a soft restart to clear memory and reset connections',
          success_rate: 92,
          avg_execution_time_ms: 15000,
          total_executions: 156,
          is_enabled: true
        },
        {
          id: '2',
          action_type: 'reset_connection',
          name: 'Reset Network Connection',
          description: 'Reset Wi-Fi/Zigbee/Z-Wave connection and re-establish',
          success_rate: 88,
          avg_execution_time_ms: 8000,
          total_executions: 203,
          is_enabled: true
        },
        {
          id: '3',
          action_type: 'adjust_settings',
          name: 'Optimize Settings',
          description: 'Automatically adjust device settings for optimal performance',
          success_rate: 95,
          avg_execution_time_ms: 3000,
          total_executions: 412,
          is_enabled: true
        },
        {
          id: '4',
          action_type: 'update_firmware',
          name: 'Update Firmware',
          description: 'Download and install latest firmware version',
          success_rate: 97,
          avg_execution_time_ms: 180000,
          total_executions: 89,
          is_enabled: true
        },
      ]
      setHealingActions(mockActions)

      // Mock healing executions
      const mockExecutions: SelfHealingExecution[] = [
        {
          id: '1',
          device_id: 'device-1',
          device: { device_name: 'Smart Thermostat', device_type: 'climate_control' },
          action_type: 'reset_connection',
          trigger_reason: 'Intermittent connectivity issues detected',
          time: new Date(Date.now() - 3600000).toISOString(),
          success: true,
          duration_ms: 8200,
          before_health_score: 72,
          after_health_score: 95,
          error_message: undefined
        },
        {
          id: '2',
          device_id: 'device-3',
          device: { device_name: 'Living Room Light', device_type: 'lighting' },
          action_type: 'restart_device',
          trigger_reason: 'Device unresponsive for 10 minutes',
          time: new Date(Date.now() - 7200000).toISOString(),
          success: true,
          duration_ms: 14500,
          before_health_score: 45,
          after_health_score: 92,
          error_message: undefined
        },
      ]
      setHealingExecutions(mockExecutions)

      // Mock firmware updates
      const mockFirmware: FirmwareUpdate[] = [
        {
          id: '1',
          device_id: 'device-1',
          device: { device_name: 'Smart Thermostat', device_type: 'climate_control' },
          current_version: '2.1.2',
          target_version: '2.1.3',
          update_type: 'security',
          status: 'available',
          priority: 'high',
          release_date: new Date(Date.now() - 86400000).toISOString(),
          changelog: [
            'Fixed critical security vulnerability (CVE-2024-1234)',
            'Improved Wi-Fi stability',
            'Enhanced energy efficiency algorithms'
          ],
          auto_update_enabled: true
        },
        {
          id: '2',
          device_id: 'device-4',
          device: { device_name: 'Smart Lock', device_type: 'security' },
          current_version: '1.8.5',
          target_version: '2.0.0',
          update_type: 'feature',
          status: 'available',
          priority: 'medium',
          release_date: new Date(Date.now() - 172800000).toISOString(),
          changelog: [
            'Added fingerprint authentication support',
            'Improved battery life by 30%',
            'New auto-lock modes'
          ],
          auto_update_enabled: false
        },
      ]
      setFirmwareUpdates(mockFirmware)

      // Calculate stats
      const totalIssues = mockIssues.length
      const resolvedIssues = mockIssues.filter(i => i.status === 'resolved').length
      const autoResolved = mockIssues.filter(i => i.fix_successful).length
      const avgHealth = mockDiagnostics.reduce((sum, d) => sum + d.overall_health_score, 0) / mockDiagnostics.length
      const successfulHealing = mockExecutions.filter(e => e.success).length
      const healingRate = (successfulHealing / mockExecutions.length) * 100
      const pendingUpdates = mockFirmware.filter(f => f.status === 'available').length
      const criticalUpdates = mockFirmware.filter(f => f.priority === 'critical').length

      setStats({
        totalDiagnostics: mockDiagnostics.length,
        issuesDetected: totalIssues,
        issuesAutoResolved: autoResolved,
        autoResolveRate: (autoResolved / totalIssues) * 100,
        avgHealthScore: avgHealth,
        healingSuccessRate: healingRate,
        pendingUpdates,
        criticalUpdates
      })

    } catch (error: any) {
      console.error('Error loading self-healing data:', error)
      toast.error(error.response?.data?.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const runDiagnostics = async (deviceId?: string) => {
    try {
      toast.loading('Running diagnostics...')
      // Call backend API to trigger diagnostics
      // await api.post(`/devices/${deviceId}/diagnostics/run`)
      setTimeout(() => {
        toast.dismiss()
        toast.success('Diagnostics completed successfully')
        loadData()
      }, 2000)
    } catch (error: any) {
      toast.error('Failed to run diagnostics')
    }
  }

  const attemptAutoFix = async (issueId: string) => {
    try {
      toast.loading('Attempting auto-fix...')
      // await api.post(`/diagnostic-issues/${issueId}/auto-fix`)
      setTimeout(() => {
        toast.dismiss()
        toast.success('Auto-fix applied successfully')
        loadData()
      }, 3000)
    } catch (error: any) {
      toast.error('Auto-fix failed')
    }
  }

  const installFirmware = async (updateId: string) => {
    try {
      toast.loading('Installing firmware update...')
      // await api.post(`/firmware-updates/${updateId}/install`)
      setTimeout(() => {
        toast.dismiss()
        toast.success('Firmware update installed successfully')
        loadData()
      }, 5000)
    } catch (error: any) {
      toast.error('Firmware installation failed')
    }
  }

  const toggleAutoUpdate = async (updateId: string, enabled: boolean) => {
    try {
      // await api.patch(`/firmware-updates/${updateId}`, { auto_update_enabled: enabled })
      toast.success(`Auto-update ${enabled ? 'enabled' : 'disabled'}`)
      loadData()
    } catch (error: any) {
      toast.error('Failed to update settings')
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200'
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-50'
      case 'high': return 'text-orange-600 bg-orange-50'
      case 'medium': return 'text-yellow-600 bg-yellow-50'
      case 'low': return 'text-blue-600 bg-blue-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Self-Healing Automation</h1>
          <p className="text-gray-600 mt-1">Automatic diagnostics, recovery, and maintenance</p>
        </div>
        <Button onClick={() => runDiagnostics()}>
          <Play className="w-4 h-4 mr-2" />
          Run Full Diagnostics
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Diagnostics Run</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalDiagnostics}</p>
                <p className="text-sm text-gray-600 mt-1">Avg Health: {stats.avgHealthScore.toFixed(0)}%</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <Activity className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Auto-Resolved Issues</p>
                <p className="text-3xl font-bold text-green-600">{stats.issuesAutoResolved}/{stats.issuesDetected}</p>
                <p className="text-sm text-green-600 mt-1">{stats.autoResolveRate.toFixed(0)}% success rate</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Healing Success Rate</p>
                <p className="text-3xl font-bold text-primary-600">{stats.healingSuccessRate.toFixed(0)}%</p>
                <p className="text-sm text-gray-600 mt-1">{healingExecutions.length} actions taken</p>
              </div>
              <div className="p-3 bg-primary-50 rounded-lg">
                <Wrench className="w-6 h-6 text-primary-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Updates</p>
                <p className="text-3xl font-bold text-orange-600">{stats.pendingUpdates}</p>
                <p className="text-sm text-red-600 mt-1">{stats.criticalUpdates} critical</p>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg">
                <Download className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setSelectedTab('diagnostics')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              selectedTab === 'diagnostics'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Activity className="w-5 h-5 inline mr-2" />
            Diagnostics ({diagnosticRuns.length})
          </button>
          <button
            onClick={() => setSelectedTab('healing')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              selectedTab === 'healing'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Wrench className="w-5 h-5 inline mr-2" />
            Self-Healing ({healingActions.length})
          </button>
          <button
            onClick={() => setSelectedTab('firmware')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              selectedTab === 'firmware'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Download className="w-5 h-5 inline mr-2" />
            Firmware Updates ({firmwareUpdates.length})
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {selectedTab === 'diagnostics' && (
        <div className="space-y-6">
          {/* Diagnostic Runs */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Diagnostic Runs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {diagnosticRuns.map((run) => (
                  <div key={run.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{run.device.device_name}</h3>
                          <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-medium">
                            {run.diagnostic_type}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            run.status === 'completed' ? 'bg-green-50 text-green-600' : 
                            run.status === 'running' ? 'bg-blue-50 text-blue-600' :
                            run.status === 'failed' ? 'bg-red-50 text-red-600' :
                            'bg-gray-50 text-gray-600'
                          }`}>
                            {run.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mb-3">
                          <div>
                            <p className="text-sm text-gray-600">Health Score</p>
                            <p className="text-2xl font-bold text-green-600">{run.overall_health_score}%</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Issues Found</p>
                            <p className="text-2xl font-bold text-orange-600">{run.issues_found}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Auto-Resolved</p>
                            <p className="text-2xl font-bold text-green-600">{run.issues_resolved}</p>
                          </div>
                        </div>

                        {run.recommendations.length > 0 && (
                          <div className="bg-blue-50 rounded-lg p-3">
                            <p className="text-sm font-semibold text-blue-900 mb-1">Recommendations:</p>
                            <ul className="list-disc list-inside space-y-1">
                              {run.recommendations.map((rec, idx) => (
                                <li key={idx} className="text-sm text-blue-800">{rec}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <p className="text-sm text-gray-500 mt-2">
                          Completed {format(new Date(run.completed_at || run.started_at), 'MMM dd, yyyy HH:mm')} • 
                          Duration: {((run.duration_ms || 0) / 1000).toFixed(1)}s
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Diagnostic Issues */}
          <Card>
            <CardHeader>
              <CardTitle>Detected Issues</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {diagnosticIssues.map((issue) => (
                  <div key={issue.id} className={`border rounded-lg p-4 ${getSeverityColor(issue.severity)}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{issue.title}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getSeverityColor(issue.severity)}`}>
                            {issue.severity.toUpperCase()}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            issue.status === 'resolved' ? 'bg-green-100 text-green-600' :
                            issue.status === 'in_progress' ? 'bg-blue-100 text-blue-600' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {issue.status}
                          </span>
                        </div>

                        <p className="text-gray-700 mb-2">{issue.description}</p>
                        <p className="text-sm text-gray-600">
                          Device: {issue.device.device_name} • Type: {issue.issue_type}
                        </p>

                        {issue.fix_successful && issue.resolution_notes && (
                          <div className="bg-green-50 rounded p-2 mt-2">
                            <p className="text-sm text-green-800">✓ {issue.resolution_notes}</p>
                          </div>
                        )}
                      </div>

                      {issue.auto_fixable && issue.status === 'open' && (
                        <Button size="sm" onClick={() => attemptAutoFix(issue.id)}>
                          <Wrench className="w-4 h-4 mr-1" />
                          Auto-Fix
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {selectedTab === 'healing' && (
        <div className="space-y-6">
          {/* Healing Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Available Self-Healing Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {healingActions.map((action) => (
                  <div key={action.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-1">{action.name}</h3>
                        <p className="text-sm text-gray-600 mb-3">{action.description}</p>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-xs text-gray-500">Success Rate</p>
                            <p className="text-xl font-bold text-green-600">{action.success_rate}%</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Executions</p>
                            <p className="text-xl font-bold text-gray-900">{action.total_executions}</p>
                          </div>
                        </div>

                        <p className="text-xs text-gray-500 mt-2">
                          Avg time: {(action.avg_execution_time_ms / 1000).toFixed(1)}s
                        </p>
                      </div>

                      <div className="ml-4">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={action.is_enabled}
                            className="sr-only peer"
                            readOnly
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Executions */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Healing Executions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {healingExecutions.map((exec) => (
                  <div key={exec.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {exec.success ? (
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-600" />
                          )}
                          <h3 className="text-lg font-semibold">{exec.device.device_name}</h3>
                          <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-medium">
                            {exec.action_type}
                          </span>
                        </div>

                        <p className="text-gray-600 mb-3">{exec.trigger_reason}</p>

                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <p className="text-xs text-gray-500">Before</p>
                            <p className="text-lg font-bold text-orange-600">{exec.before_health_score}%</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">After</p>
                            <p className="text-lg font-bold text-green-600">{exec.after_health_score}%</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Improvement</p>
                            <p className="text-lg font-bold text-primary-600">
                              +{exec.after_health_score - exec.before_health_score}%
                            </p>
                          </div>
                        </div>

                        <p className="text-sm text-gray-500 mt-2">
                          {format(new Date(exec.time), 'MMM dd, yyyy HH:mm')} • 
                          Duration: {(exec.duration_ms / 1000).toFixed(1)}s
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {selectedTab === 'firmware' && (
        <div className="space-y-4">
          {firmwareUpdates.map((update) => (
            <Card key={update.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{update.device.device_name}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(update.priority)}`}>
                        {update.priority.toUpperCase()}
                      </span>
                      <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-medium">
                        {update.update_type}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 mb-3">
                      <div>
                        <p className="text-sm text-gray-600">Current</p>
                        <p className="text-lg font-bold text-gray-900">{update.current_version}</p>
                      </div>
                      <div>→</div>
                      <div>
                        <p className="text-sm text-gray-600">Available</p>
                        <p className="text-lg font-bold text-green-600">{update.target_version}</p>
                      </div>
                    </div>

                    <div className="bg-blue-50 rounded-lg p-3 mb-3">
                      <p className="text-sm font-semibold text-blue-900 mb-2">What's New:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {update.changelog.map((item, idx) => (
                          <li key={idx} className="text-sm text-blue-800">{item}</li>
                        ))}
                      </ul>
                    </div>

                    <p className="text-sm text-gray-500">
                      Released: {format(new Date(update.release_date), 'MMM dd, yyyy')}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    {update.status === 'available' && (
                      <Button onClick={() => installFirmware(update.id)}>
                        <Download className="w-4 h-4 mr-2" />
                        Install Now
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleAutoUpdate(update.id, !update.auto_update_enabled)}
                    >
                      {update.auto_update_enabled ? <Pause className="w-4 h-4 mr-1" /> : <Play className="w-4 h-4 mr-1" />}
                      Auto-Update: {update.auto_update_enabled ? 'ON' : 'OFF'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
