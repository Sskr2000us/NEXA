'use client'

import { useState, useEffect } from 'react'
import { Building2, Key, DollarSign, TrendingUp, Users, BarChart3, Code, Settings } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'

interface OEMPartner {
  id: string
  company_name: string
  domain: string
  logo_url?: string
  primary_color: string
  secondary_color: string
  api_key_count: number
  monthly_api_calls: number
  monthly_revenue: number
  status: 'active' | 'suspended' | 'pending'
}

export default function WhiteLabelPage() {
  const [loading, setLoading] = useState(true)
  const [partners, setPartners] = useState<OEMPartner[]>([])
  const [stats, setStats] = useState({
    totalPartners: 0,
    totalRevenue: 0,
    totalApiCalls: 0,
    activeKeys: 0,
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)

      const mockPartners: OEMPartner[] = [
        {
          id: '1',
          company_name: 'Samsung SmartThings',
          domain: 'smartthings.nexa.io',
          primary_color: '#1428A0',
          secondary_color: '#000000',
          api_key_count: 3,
          monthly_api_calls: 1250000,
          monthly_revenue: 2500,
          status: 'active'
        },
        {
          id: '2',
          company_name: 'LG ThinQ',
          domain: 'lg-thinq.nexa.io',
          primary_color: '#A50034',
          secondary_color: '#000000',
          api_key_count: 2,
          monthly_api_calls: 890000,
          monthly_revenue: 1780,
          status: 'active'
        }
      ]
      setPartners(mockPartners)

      setStats({
        totalPartners: mockPartners.length,
        totalRevenue: mockPartners.reduce((sum, p) => sum + p.monthly_revenue, 0),
        totalApiCalls: mockPartners.reduce((sum, p) => sum + p.monthly_api_calls, 0),
        activeKeys: mockPartners.reduce((sum, p) => sum + p.api_key_count, 0),
      })

    } catch (error: any) {
      toast.error('Failed to load partner data')
    } finally {
      setLoading(false)
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">White-Label & OEM Partners</h1>
          <p className="text-gray-600 mt-1">Manage enterprise partnerships and API access</p>
        </div>
        <Button>
          <Building2 className="w-4 h-4 mr-2" />
          Add Partner
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Partners</p>
                <p className="text-3xl font-bold">{stats.totalPartners}</p>
              </div>
              <Building2 className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Monthly Revenue</p>
                <p className="text-3xl font-bold text-green-600">${stats.totalRevenue.toLocaleString()}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">API Calls</p>
                <p className="text-3xl font-bold">{(stats.totalApiCalls / 1000000).toFixed(1)}M</p>
              </div>
              <BarChart3 className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active API Keys</p>
                <p className="text-3xl font-bold">{stats.activeKeys}</p>
              </div>
              <Key className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {partners.map((partner) => (
          <Card key={partner.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                {partner.company_name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Domain:</span>
                  <span className="font-medium">{partner.domain}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">API Keys:</span>
                  <span className="font-medium">{partner.api_key_count}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Monthly Calls:</span>
                  <span className="font-medium">{partner.monthly_api_calls.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Monthly Revenue:</span>
                  <span className="font-medium text-green-600">${partner.monthly_revenue.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <div className="w-6 h-6 rounded" style={{ backgroundColor: partner.primary_color }}></div>
                  <div className="w-6 h-6 rounded" style={{ backgroundColor: partner.secondary_color }}></div>
                  <span className="text-xs text-gray-500">Brand Colors</span>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button size="sm" variant="outline" className="flex-1">
                    <Settings className="w-4 h-4 mr-1" />
                    Configure
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1">
                    <Code className="w-4 h-4 mr-1" />
                    API Docs
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
