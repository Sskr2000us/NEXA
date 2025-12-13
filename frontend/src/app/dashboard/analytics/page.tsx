'use client'

import { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, TrendingDown, Zap, Activity as ActivityIcon, Calendar } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | '90d'>('7d')
  const [isLoading, setIsLoading] = useState(true)
  const [energyData, setEnergyData] = useState<any[]>([])
  const [deviceActivity, setDeviceActivity] = useState<any[]>([])
  const [automationStats, setAutomationStats] = useState<any>(null)
  const [insights, setInsights] = useState<any[]>([])

  useEffect(() => {
    loadAnalytics()
  }, [timeRange])

  const loadAnalytics = async () => {
    try {
      const homeId = localStorage.getItem('currentHomeId') || 'default'
      
      // Load energy usage data
      const energyResponse = await api.get(`/telemetry/energy-usage`, {
        params: { homeId, timeRange },
      })
      setEnergyData(energyResponse.data || [])

      // Load device activity
      const activityResponse = await api.get(`/telemetry/device-activity`, {
        params: { homeId, timeRange },
      })
      setDeviceActivity(activityResponse.data || [])

      // Load automation statistics
      const automationResponse = await api.get(`/automations/statistics`, {
        params: { homeId, timeRange },
      })
      setAutomationStats(automationResponse.data)

      // Load AI insights
      const insightsResponse = await api.get(`/insights`, {
        params: { homeId, status: 'new' },
      })
      setInsights(insightsResponse.data?.slice(0, 5) || [])

    } catch (error: any) {
      console.error('Failed to load analytics:', error)
      toast.error('Failed to load analytics data')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const totalEnergy = energyData.reduce((sum, d) => sum + (d.energy_kwh || 0), 0)
  const avgDaily = energyData.length > 0 ? (totalEnergy / energyData.length).toFixed(2) : '0'
  const estimatedCost = (totalEnergy * 0.13).toFixed(2) // $0.13/kWh average

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-1">
            Insights and trends for your smart home
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {(['24h', '7d', '30d', '90d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                timeRange === range
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}
            >
              {range === '24h' ? '24 Hours' : range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Energy</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {totalEnergy.toFixed(1)} kWh
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Avg {avgDaily} kWh/day
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Zap className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Estimated Cost</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  ${estimatedCost}
                </p>
                <p className="text-sm text-green-600 mt-1 flex items-center">
                  <TrendingDown className="w-4 h-4 mr-1" />
                  12% vs last period
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Automation Runs</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {automationStats?.total_executions || 0}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {automationStats?.success_rate || 0}% success rate
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <ActivityIcon className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Energy Usage Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Energy Usage Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={energyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="time" 
                tickFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(value) => new Date(value).toLocaleString()}
                formatter={(value: any) => [`${value.toFixed(2)} kWh`, 'Energy']}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="energy_kwh" 
                stroke="#6366f1" 
                strokeWidth={2}
                name="Energy (kWh)"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Device Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Top Active Devices</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={deviceActivity.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="device_name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="event_count" fill="#6366f1" name="Events" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* AI Insights */}
      {insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>AI-Powered Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {insights.map((insight) => (
                <div
                  key={insight.id}
                  className="flex items-start space-x-4 p-4 bg-blue-50 rounded-lg border border-blue-200"
                >
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{insight.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
                    {insight.potential_savings_annual && (
                      <p className="text-sm font-medium text-green-600 mt-2">
                        Potential savings: ${insight.potential_savings_annual}/year
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
