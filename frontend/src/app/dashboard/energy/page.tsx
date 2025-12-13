'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Activity, TrendingUp, TrendingDown, Zap } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function EnergyPage() {
  const [homes, setHomes] = useState<any[]>([])
  const [selectedHome, setSelectedHome] = useState<string>('')
  const [period, setPeriod] = useState('24h')
  const [energyData, setEnergyData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadHomes()
  }, [])

  useEffect(() => {
    if (selectedHome) {
      loadEnergyData(selectedHome, period)
    }
  }, [selectedHome, period])

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

  const loadEnergyData = async (hId: string, p: string) => {
    try {
      const data = await api.getEnergyConsumption(hId, p)
      setEnergyData(data)
    } catch (error) {
      console.error('Failed to load energy data:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const mockChartData = [
    { time: '00:00', consumption: 2.5 },
    { time: '04:00', consumption: 1.8 },
    { time: '08:00', consumption: 3.2 },
    { time: '12:00', consumption: 4.5 },
    { time: '16:00', consumption: 5.1 },
    { time: '20:00', consumption: 4.8 },
    { time: '24:00', consumption: 3.2 },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Energy Monitoring</h1>
        <p className="text-gray-600 mt-2">Track and optimize your energy consumption</p>
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
        
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="24h">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
        </select>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Consumption</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {energyData?.totalConsumption || '24.5'} kWh
              </p>
              <p className="text-sm text-gray-600 mt-1">Today</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Zap className="w-6 h-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Estimated Cost</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                ${energyData?.estimatedCost || '3.92'}
              </p>
              <div className="flex items-center mt-1 text-sm text-green-600">
                <TrendingDown className="w-4 h-4 mr-1" />
                <span>12% vs yesterday</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Peak Usage</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {energyData?.peakUsage || '5.1'} kW
              </p>
              <p className="text-sm text-gray-600 mt-1">At 16:00</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Energy Consumption Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis label={{ value: 'kWh', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="consumption"
                  stroke="#0ea5e9"
                  strokeWidth={2}
                  dot={{ fill: '#0ea5e9' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Top Consumers */}
      <Card>
        <CardHeader>
          <CardTitle>Top Energy Consumers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { name: 'HVAC System', consumption: 12.5, percentage: 51 },
              { name: 'Water Heater', consumption: 6.2, percentage: 25 },
              { name: 'Lighting', consumption: 3.8, percentage: 16 },
              { name: 'Other', consumption: 2.0, percentage: 8 },
            ].map((device) => (
              <div key={device.name} className="flex items-center">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900">{device.name}</span>
                    <span className="text-sm text-gray-600">{device.consumption} kWh</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full"
                      style={{ width: `${device.percentage}%` }}
                    />
                  </div>
                </div>
                <span className="ml-4 text-sm font-medium text-gray-600">
                  {device.percentage}%
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
