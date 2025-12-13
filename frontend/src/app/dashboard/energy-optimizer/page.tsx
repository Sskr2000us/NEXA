'use client'

import { useState, useEffect } from 'react'
import { Zap, DollarSign, TrendingDown, TrendingUp, Leaf, Clock, Sun, Moon, Battery, AlertCircle, CheckCircle2, Target, Lightbulb } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'
import { format, subDays } from 'date-fns'

interface EnergyRecommendation {
  id: string
  type: 'load_shift' | 'device_optimization' | 'automation' | 'peak_reduction'
  title: string
  description: string
  estimated_savings_monthly: number
  estimated_savings_yearly: number
  effort_level: 'easy' | 'medium' | 'hard'
  payback_period_months?: number
  devices_affected: string[]
  implementation_steps: string[]
  priority: 'high' | 'medium' | 'low'
}

interface EnergyUsage {
  timestamp: string
  kwh: number
  cost: number
  peak_hours: boolean
  off_peak_hours: boolean
}

interface DeviceEnergyBreakdown {
  device_name: string
  device_type: string
  energy_kwh: number
  cost: number
  percentage: number
}

export default function EnergyOptimizationPage() {
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState(30) // days
  const [energyData, setEnergyData] = useState<EnergyUsage[]>([])
  const [deviceBreakdown, setDeviceBreakdown] = useState<DeviceEnergyBreakdown[]>([])
  const [recommendations, setRecommendations] = useState<EnergyRecommendation[]>([])

  // Summary stats
  const [stats, setStats] = useState({
    currentMonthUsage: 0,
    currentMonthCost: 0,
    previousMonthUsage: 0,
    previousMonthCost: 0,
    peakUsagePercentage: 0,
    offPeakUsagePercentage: 0,
    carbonFootprint: 0,
    potentialMonthlySavings: 0,
    potentialYearlySavings: 0,
  })

  const [utilityRates, setUtilityRates] = useState({
    peak_rate: 0.35, // $/kWh
    off_peak_rate: 0.12, // $/kWh
    standard_rate: 0.22, // $/kWh
    peak_hours_start: '16:00',
    peak_hours_end: '21:00',
  })

  useEffect(() => {
    loadData()
  }, [timeRange])

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

      // Mock energy data (replace with real API call)
      const mockEnergyData = generateMockEnergyData(timeRange)
      setEnergyData(mockEnergyData)

      // Mock device breakdown
      const mockDeviceBreakdown: DeviceEnergyBreakdown[] = [
        { device_name: 'HVAC System', device_type: 'climate_control', energy_kwh: 450, cost: 135, percentage: 40 },
        { device_name: 'Water Heater', device_type: 'appliance', energy_kwh: 225, cost: 67.5, percentage: 20 },
        { device_name: 'Refrigerator', device_type: 'appliance', energy_kwh: 180, cost: 54, percentage: 16 },
        { device_name: 'Washing Machine', device_type: 'appliance', energy_kwh: 90, cost: 27, percentage: 8 },
        { device_name: 'Lighting', device_type: 'lighting', energy_kwh: 67.5, cost: 20.25, percentage: 6 },
        { device_name: 'Entertainment', device_type: 'media', energy_kwh: 56.25, cost: 16.88, percentage: 5 },
        { device_name: 'Other', device_type: 'other', energy_kwh: 56.25, cost: 16.88, percentage: 5 },
      ]
      setDeviceBreakdown(mockDeviceBreakdown)

      // Generate AI recommendations
      const mockRecommendations: EnergyRecommendation[] = [
        {
          id: '1',
          type: 'load_shift',
          title: 'Shift AC Usage to Off-Peak Hours',
          description: 'Pre-cool your home during off-peak hours (10 PM - 4 PM) when electricity is 66% cheaper. Use smart thermostat scheduling to reduce peak-hour usage.',
          estimated_savings_monthly: 45,
          estimated_savings_yearly: 540,
          effort_level: 'easy',
          devices_affected: ['HVAC System'],
          implementation_steps: [
            'Enable smart thermostat scheduling',
            'Set pre-cooling from 12 PM to 3 PM',
            'Raise temperature 2-3°F during peak hours (4 PM - 9 PM)',
            'Allow natural cooling after 9 PM'
          ],
          priority: 'high'
        },
        {
          id: '2',
          type: 'device_optimization',
          title: 'Optimize Water Heater Schedule',
          description: 'Heat water during off-peak hours only. Modern tank water heaters can maintain temperature for 6-8 hours without reheating.',
          estimated_savings_monthly: 28,
          estimated_savings_yearly: 336,
          effort_level: 'easy',
          devices_affected: ['Water Heater'],
          implementation_steps: [
            'Install smart water heater controller',
            'Set heating schedule: 6-8 AM and 6-8 PM only',
            'Lower temperature from 140°F to 120°F',
            'Enable vacation mode when away'
          ],
          priority: 'high'
        },
        {
          id: '3',
          type: 'automation',
          title: 'Automate Lighting Based on Occupancy',
          description: 'Reduce lighting energy by 40% with motion sensors and daylight harvesting. Lights only turn on when needed.',
          estimated_savings_monthly: 12,
          estimated_savings_yearly: 144,
          effort_level: 'medium',
          payback_period_months: 8,
          devices_affected: ['Lighting'],
          implementation_steps: [
            'Install motion sensors in low-traffic areas',
            'Enable daylight sensors near windows',
            'Set auto-off timer to 5 minutes',
            'Create away-mode automation'
          ],
          priority: 'medium'
        },
        {
          id: '4',
          type: 'peak_reduction',
          title: 'Reduce Peak Demand Charges',
          description: 'Your peak demand is 8.2 kW. Reduce by 2 kW to save on demand charges. Stagger high-power appliance usage.',
          estimated_savings_monthly: 32,
          estimated_savings_yearly: 384,
          effort_level: 'easy',
          devices_affected: ['HVAC System', 'Water Heater', 'Washing Machine', 'Dryer'],
          implementation_steps: [
            'Never run multiple high-power appliances simultaneously',
            'Schedule laundry for off-peak hours',
            'Use HVAC setback during peak demand',
            'Enable demand response automation'
          ],
          priority: 'high'
        },
        {
          id: '5',
          type: 'device_optimization',
          title: 'Upgrade to LED Lighting',
          description: 'Replace 15 remaining incandescent bulbs with LEDs. 85% energy reduction with 10-year lifespan.',
          estimated_savings_monthly: 8,
          estimated_savings_yearly: 96,
          effort_level: 'easy',
          payback_period_months: 6,
          devices_affected: ['Lighting'],
          implementation_steps: [
            'Purchase 15 smart LED bulbs (~$120)',
            'Replace all incandescent bulbs',
            'Connect to smart hub',
            'Enable scheduling and dimming'
          ],
          priority: 'low'
        },
      ]
      setRecommendations(mockRecommendations)

      // Calculate stats
      const totalEnergy = mockEnergyData.reduce((sum, d) => sum + d.kwh, 0)
      const totalCost = mockEnergyData.reduce((sum, d) => sum + d.cost, 0)
      const peakEnergy = mockEnergyData.filter(d => d.peak_hours).reduce((sum, d) => sum + d.kwh, 0)
      const offPeakEnergy = mockEnergyData.filter(d => d.off_peak_hours).reduce((sum, d) => sum + d.kwh, 0)
      const carbonFootprint = totalEnergy * 0.42 // kg CO2 per kWh (US average)
      const potentialSavings = mockRecommendations.reduce((sum, r) => sum + r.estimated_savings_monthly, 0)

      setStats({
        currentMonthUsage: totalEnergy,
        currentMonthCost: totalCost,
        previousMonthUsage: totalEnergy * 1.08, // 8% higher last month
        previousMonthCost: totalCost * 1.08,
        peakUsagePercentage: (peakEnergy / totalEnergy) * 100,
        offPeakUsagePercentage: (offPeakEnergy / totalEnergy) * 100,
        carbonFootprint,
        potentialMonthlySavings: potentialSavings,
        potentialYearlySavings: potentialSavings * 12,
      })

    } catch (error: any) {
      console.error('Error loading energy data:', error)
      toast.error(error.response?.data?.message || 'Failed to load energy data')
    } finally {
      setLoading(false)
    }
  }

  const generateMockEnergyData = (days: number): EnergyUsage[] => {
    const data: EnergyUsage[] = []
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i)
      const isPeakHour = date.getHours() >= 16 && date.getHours() <= 21
      const isOffPeakHour = date.getHours() >= 22 || date.getHours() <= 6

      data.push({
        timestamp: date.toISOString(),
        kwh: isPeakHour ? 1.8 + Math.random() * 0.4 : 1.2 + Math.random() * 0.3,
        cost: isPeakHour ? 0.63 + Math.random() * 0.14 : 0.26 + Math.random() * 0.06,
        peak_hours: isPeakHour,
        off_peak_hours: isOffPeakHour,
      })
    }
    return data
  }

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case 'easy': return 'text-green-600 bg-green-50'
      case 'medium': return 'text-yellow-600 bg-yellow-50'
      case 'hard': return 'text-red-600 bg-red-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-4 border-red-500'
      case 'medium': return 'border-l-4 border-yellow-500'
      case 'low': return 'border-l-4 border-green-500'
      default: return ''
    }
  }

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6b7280']

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
          <h1 className="text-3xl font-bold text-gray-900">Energy Optimization</h1>
          <p className="text-gray-600 mt-1">AI-powered energy savings and cost reduction</p>
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
            <Zap className="w-4 h-4 mr-2" />
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
                <p className="text-sm text-gray-600">Current Usage</p>
                <p className="text-3xl font-bold text-gray-900">{stats.currentMonthUsage.toFixed(0)} kWh</p>
                <p className="text-sm text-green-600 flex items-center gap-1 mt-1">
                  <TrendingDown className="w-4 h-4" />
                  {(((stats.previousMonthUsage - stats.currentMonthUsage) / stats.previousMonthUsage) * 100).toFixed(1)}% vs last month
                </p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <Zap className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Current Cost</p>
                <p className="text-3xl font-bold text-gray-900">${stats.currentMonthCost.toFixed(2)}</p>
                <p className="text-sm text-green-600 flex items-center gap-1 mt-1">
                  <TrendingDown className="w-4 h-4" />
                  ${(stats.previousMonthCost - stats.currentMonthCost).toFixed(2)} saved
                </p>
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
                <p className="text-sm text-gray-600">Potential Savings</p>
                <p className="text-3xl font-bold text-orange-600">${stats.potentialMonthlySavings.toFixed(0)}/mo</p>
                <p className="text-sm text-gray-600 mt-1">
                  ${stats.potentialYearlySavings.toFixed(0)}/year
                </p>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg">
                <Target className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Carbon Footprint</p>
                <p className="text-3xl font-bold text-gray-900">{stats.carbonFootprint.toFixed(0)} kg</p>
                <p className="text-sm text-gray-600 mt-1">
                  CO₂ this month
                </p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <Leaf className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Peak Usage</p>
                <p className="text-3xl font-bold text-red-600">{stats.peakUsagePercentage.toFixed(0)}%</p>
                <p className="text-sm text-gray-600 mt-1">
                  Off-peak: {stats.offPeakUsagePercentage.toFixed(0)}%
                </p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Energy Usage Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Energy Usage Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={energyData.slice(-30)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={(value) => format(new Date(value), 'MMM dd')}
                />
                <YAxis label={{ value: 'kWh', angle: -90, position: 'insideLeft' }} />
                <Tooltip 
                  labelFormatter={(value) => format(new Date(value), 'MMM dd, yyyy')}
                  formatter={(value: any) => [`${value.toFixed(2)} kWh`, 'Usage']}
                />
                <Legend />
                <Line type="monotone" dataKey="kwh" stroke="#3b82f6" name="Energy Usage" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Device Energy Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Energy Consumption by Device</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={deviceBreakdown}
                  dataKey="percentage"
                  nameKey="device_name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(entry) => `${entry.device_name}: ${entry.percentage}%`}
                >
                  {deviceBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => `${value}%`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* AI Recommendations */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-6 h-6 text-yellow-500" />
                AI-Powered Recommendations
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Save up to ${stats.potentialMonthlySavings.toFixed(0)}/month with these optimizations
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recommendations.map((rec) => (
              <div key={rec.id} className={`bg-white border rounded-lg p-6 ${getPriorityColor(rec.priority)}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{rec.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getEffortColor(rec.effort_level)}`}>
                        {rec.effort_level.toUpperCase()}
                      </span>
                      <span className="text-sm font-medium text-green-600">
                        ${rec.estimated_savings_monthly}/mo savings
                      </span>
                    </div>

                    <p className="text-gray-700 mb-4">{rec.description}</p>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-green-50 rounded-lg p-3">
                        <p className="text-sm text-gray-600">Monthly Savings</p>
                        <p className="text-2xl font-bold text-green-600">${rec.estimated_savings_monthly}</p>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-3">
                        <p className="text-sm text-gray-600">Yearly Savings</p>
                        <p className="text-2xl font-bold text-blue-600">${rec.estimated_savings_yearly}</p>
                      </div>
                    </div>

                    {rec.payback_period_months && (
                      <p className="text-sm text-gray-600 mb-3">
                        <Clock className="w-4 h-4 inline mr-1" />
                        Payback period: {rec.payback_period_months} months
                      </p>
                    )}

                    <div className="mb-3">
                      <p className="text-sm font-semibold text-gray-700 mb-2">Devices Affected:</p>
                      <div className="flex flex-wrap gap-2">
                        {rec.devices_affected.map((device, idx) => (
                          <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                            {device}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-2">Implementation Steps:</p>
                      <ol className="list-decimal list-inside space-y-1">
                        {rec.implementation_steps.map((step, idx) => (
                          <li key={idx} className="text-sm text-gray-600">{step}</li>
                        ))}
                      </ol>
                    </div>
                  </div>

                  <div className="ml-4">
                    <Button size="sm">
                      Implement
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Utility Rate Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Utility Rate Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg">
              <Sun className="w-8 h-8 text-red-600" />
              <div>
                <p className="text-sm text-gray-600">Peak Hours (4 PM - 9 PM)</p>
                <p className="text-2xl font-bold text-red-600">${utilityRates.peak_rate}/kWh</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
              <Moon className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Off-Peak Hours (10 PM - 6 AM)</p>
                <p className="text-2xl font-bold text-blue-600">${utilityRates.off_peak_rate}/kWh</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <Battery className="w-8 h-8 text-gray-600" />
              <div>
                <p className="text-sm text-gray-600">Standard Hours</p>
                <p className="text-2xl font-bold text-gray-600">${utilityRates.standard_rate}/kWh</p>
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-4">
            💡 Tip: Shifting 40% of your energy usage to off-peak hours could save you ${((stats.currentMonthCost * 0.4 * 0.66)).toFixed(2)}/month
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
