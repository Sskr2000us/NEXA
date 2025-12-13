'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, TrendingUp, TrendingDown, Activity, DollarSign, Wrench, Calendar, AlertCircle, CheckCircle2, Clock, Zap } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

interface FailurePrediction {
  id: string
  device_id: string
  device: {
    device_name: string
    device_type: string
    manufacturer?: string
  }
  failure_type: string
  risk_score: number
  confidence_score: number
  predicted_failure_date: string
  estimated_cost: number
  preventive_actions: string[]
  primary_indicators: Record<string, any>
  prediction_status: 'active' | 'resolved' | 'expired' | 'false_positive'
  created_at: string
}

interface Anomaly {
  id: string
  device_id: string
  device: {
    device_name: string
    device_type: string
  }
  anomaly_type: string
  anomaly_score: number
  severity: 'info' | 'warning' | 'critical'
  description: string
  detected_at: string
  resolved_at?: string
}

interface DeviceHealth {
  device_id: string
  device_name: string
  device_type: string
  health_score: number
  is_online: boolean
  total_errors_30d: number
  critical_issues: number
  highest_failure_risk: number
  active_predictions: number
  anomalies_last_7_days: number
}

export default function PredictiveMaintenancePage() {
  const [predictions, setPredictions] = useState<FailurePrediction[]>([])
  const [anomalies, setAnomalies] = useState<Anomaly[]>([])
  const [deviceHealthList, setDeviceHealthList] = useState<DeviceHealth[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTab, setSelectedTab] = useState<'predictions' | 'anomalies' | 'health'>('predictions')
  const [timeRange, setTimeRange] = useState(30) // days

  // Summary stats
  const [stats, setStats] = useState({
    totalPredictions: 0,
    highRiskDevices: 0,
    potentialCostSavings: 0,
    criticalAnomalies: 0,
    averageHealthScore: 0,
  })

  useEffect(() => {
    loadData()
  }, [timeRange])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Get home_id from user's first home (you may want to add home selection)
      const homesResponse = await api.get('/homes')
      const homeId = homesResponse.data[0]?.id

      if (!homeId) {
        toast.error('No home found')
        return
      }

      // Load failure predictions
      const predictionsResponse = await api.get(`/homes/${homeId}/predictions`)
      const activePredictions = predictionsResponse.data.filter(
        (p: FailurePrediction) => p.prediction_status === 'active'
      )
      setPredictions(activePredictions)

      // Load anomalies
      const anomaliesResponse = await api.get(`/homes/${homeId}/anomalies`, {
        params: { days: timeRange }
      })
      setAnomalies(anomaliesResponse.data)

      // Load device health (from insights)
      const insightsResponse = await api.get(`/homes/${homeId}/insights`, {
        params: { category: 'health' }
      })
      
      // Mock device health data (you can create a dedicated endpoint)
      const healthData: DeviceHealth[] = []
      setDeviceHealthList(healthData)

      // Calculate stats
      const highRisk = activePredictions.filter((p: FailurePrediction) => p.risk_score >= 70).length
      const totalCost = activePredictions.reduce((sum: number, p: FailurePrediction) => sum + (p.estimated_cost || 0), 0)
      const criticalAnomaliesCount = anomaliesResponse.data.filter((a: Anomaly) => a.severity === 'critical').length

      setStats({
        totalPredictions: activePredictions.length,
        highRiskDevices: highRisk,
        potentialCostSavings: totalCost,
        criticalAnomalies: criticalAnomaliesCount,
        averageHealthScore: 0, // Calculate from device health
      })

    } catch (error: any) {
      console.error('Error loading predictive data:', error)
      toast.error(error.response?.data?.message || 'Failed to load predictive data')
    } finally {
      setLoading(false)
    }
  }

  const getRiskColor = (score: number) => {
    if (score >= 80) return 'text-red-600 bg-red-50'
    if (score >= 60) return 'text-orange-600 bg-orange-50'
    if (score >= 40) return 'text-yellow-600 bg-yellow-50'
    return 'text-green-600 bg-green-50'
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50'
      case 'warning': return 'text-orange-600 bg-orange-50'
      case 'info': return 'text-blue-600 bg-blue-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getHealthColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 70) return 'text-yellow-600'
    if (score >= 50) return 'text-orange-600'
    return 'text-red-600'
  }

  const markAsResolved = async (predictionId: string) => {
    try {
      // You'll need to add this endpoint to backend
      await api.patch(`/predictions/${predictionId}`, {
        prediction_status: 'resolved'
      })
      toast.success('Prediction marked as resolved')
      loadData()
    } catch (error: any) {
      toast.error('Failed to update prediction')
    }
  }

  const markAsFalsePositive = async (predictionId: string) => {
    try {
      await api.patch(`/predictions/${predictionId}`, {
        prediction_status: 'false_positive'
      })
      toast.success('Marked as false positive')
      loadData()
    } catch (error: any) {
      toast.error('Failed to update prediction')
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
          <h1 className="text-3xl font-bold text-gray-900">Predictive Maintenance</h1>
          <p className="text-gray-600 mt-1">AI-powered device health and failure prediction</p>
        </div>
        <div className="flex gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(parseInt(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          <Button onClick={loadData}>
            <Activity className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Predictions</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalPredictions}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">High Risk Devices</p>
                <p className="text-3xl font-bold text-red-600">{stats.highRiskDevices}</p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Potential Savings</p>
                <p className="text-3xl font-bold text-green-600">${stats.potentialCostSavings.toFixed(0)}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Critical Anomalies</p>
                <p className="text-3xl font-bold text-orange-600">{stats.criticalAnomalies}</p>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg">
                <Zap className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Health Score</p>
                <p className="text-3xl font-bold text-green-600">{stats.averageHealthScore || '-'}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <Activity className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setSelectedTab('predictions')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              selectedTab === 'predictions'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <AlertTriangle className="w-5 h-5 inline mr-2" />
            Failure Predictions ({predictions.length})
          </button>
          <button
            onClick={() => setSelectedTab('anomalies')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              selectedTab === 'anomalies'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Activity className="w-5 h-5 inline mr-2" />
            Anomalies ({anomalies.length})
          </button>
          <button
            onClick={() => setSelectedTab('health')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              selectedTab === 'health'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Wrench className="w-5 h-5 inline mr-2" />
            Device Health
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {selectedTab === 'predictions' && (
        <div className="space-y-4">
          {predictions.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">All Clear!</h3>
                <p className="text-gray-600">No active failure predictions. Your devices are healthy.</p>
              </CardContent>
            </Card>
          ) : (
            predictions.map((prediction) => (
              <Card key={prediction.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {prediction.device.device_name}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRiskColor(prediction.risk_score)}`}>
                          {prediction.risk_score}% Risk
                        </span>
                        <span className="text-sm text-gray-500">{prediction.device.device_type}</span>
                      </div>

                      <p className="text-gray-700 mb-3">
                        <strong>Failure Type:</strong> {prediction.failure_type}
                      </p>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">
                            Expected: {format(new Date(prediction.predicted_failure_date), 'MMM dd, yyyy')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <DollarSign className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">
                            Est. Cost: ${prediction.estimated_cost?.toFixed(2) || 'N/A'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Activity className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">
                            Confidence: {(prediction.confidence_score * 100).toFixed(0)}%
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">
                            Detected: {format(new Date(prediction.created_at), 'MMM dd, yyyy')}
                          </span>
                        </div>
                      </div>

                      {prediction.preventive_actions && prediction.preventive_actions.length > 0 && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                          <h4 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
                            <Wrench className="w-4 h-4" />
                            Recommended Actions
                          </h4>
                          <ul className="list-disc list-inside space-y-1">
                            {prediction.preventive_actions.map((action, idx) => (
                              <li key={idx} className="text-sm text-blue-800">{action}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => markAsResolved(prediction.id)}
                      >
                        Mark Resolved
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => markAsFalsePositive(prediction.id)}
                      >
                        False Positive
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {selectedTab === 'anomalies' && (
        <div className="space-y-4">
          {anomalies.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Anomalies Detected</h3>
                <p className="text-gray-600">All devices are operating within normal parameters.</p>
              </CardContent>
            </Card>
          ) : (
            anomalies.map((anomaly) => (
              <Card key={anomaly.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {anomaly.device.device_name}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getSeverityColor(anomaly.severity)}`}>
                          {anomaly.severity.toUpperCase()}
                        </span>
                        <span className="text-sm text-gray-500">{anomaly.device.device_type}</span>
                      </div>

                      <p className="text-gray-700 mb-2">
                        <strong>Type:</strong> {anomaly.anomaly_type}
                      </p>
                      <p className="text-gray-600 mb-3">{anomaly.description}</p>

                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>Score: {anomaly.anomaly_score.toFixed(2)}</span>
                        <span>Detected: {format(new Date(anomaly.detected_at), 'MMM dd, yyyy HH:mm')}</span>
                        {anomaly.resolved_at && (
                          <span className="text-green-600">
                            ✓ Resolved: {format(new Date(anomaly.resolved_at), 'MMM dd, yyyy')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {selectedTab === 'health' && (
        <div className="space-y-4">
          <Card>
            <CardContent className="text-center py-12">
              <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Device Health Dashboard</h3>
              <p className="text-gray-600">Comprehensive device health monitoring coming soon...</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
