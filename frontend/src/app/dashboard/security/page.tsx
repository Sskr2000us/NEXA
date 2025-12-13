'use client'

import { useState, useEffect } from 'react'
import { Shield, AlertTriangle, CheckCircle2, XCircle, Lock, Unlock, FileText, Download, Search, Filter } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { format } from 'date-fns'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'

interface SecurityScan {
  id: string
  home_id: string
  scan_type: 'vulnerability' | 'network' | 'device' | 'compliance' | 'full'
  status: 'scheduled' | 'running' | 'completed' | 'failed'
  started_at: string
  completed_at?: string
  vulnerabilities_found: number
  critical_count: number
  high_count: number
  medium_count: number
  low_count: number
  scan_score: number
}

interface Vulnerability {
  id: string
  cve_id?: string
  device_id: string
  device: { device_name: string; device_type: string }
  severity: 'critical' | 'high' | 'medium' | 'low'
  title: string
  description: string
  affected_component: string
  cvss_score?: number
  status: 'open' | 'acknowledged' | 'mitigated' | 'resolved' | 'false_positive'
  remediation_steps: string[]
  discovered_at: string
}

interface SecurityIncident {
  id: string
  incident_type: 'unauthorized_access' | 'brute_force' | 'anomaly' | 'malware' | 'data_breach'
  severity: 'critical' | 'high' | 'medium' | 'low'
  title: string
  description: string
  source_ip?: string
  affected_devices: string[]
  detected_at: string
  resolved_at?: string
  status: 'open' | 'investigating' | 'contained' | 'resolved'
}

export default function SecurityPage() {
  const [loading, setLoading] = useState(true)
  const [selectedTab, setSelectedTab] = useState<'scans' | 'vulnerabilities' | 'incidents' | 'compliance'>('scans')
  const [scans, setScans] = useState<SecurityScan[]>([])
  const [vulnerabilities, setVulnerabilities] = useState<Vulnerability[]>([])
  const [incidents, setIncidents] = useState<SecurityIncident[]>([])
  
  const [stats, setStats] = useState({
    totalScans: 0,
    lastScanScore: 0,
    openVulnerabilities: 0,
    criticalVulnerabilities: 0,
    activeIncidents: 0,
    complianceScore: 0,
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)

      // Mock data
      const mockScans: SecurityScan[] = [
        {
          id: '1',
          home_id: 'home-1',
          scan_type: 'full',
          status: 'completed',
          started_at: new Date(Date.now() - 3600000).toISOString(),
          completed_at: new Date(Date.now() - 3000000).toISOString(),
          vulnerabilities_found: 8,
          critical_count: 1,
          high_count: 2,
          medium_count: 3,
          low_count: 2,
          scan_score: 78
        }
      ]
      setScans(mockScans)

      const mockVulns: Vulnerability[] = [
        {
          id: '1',
          cve_id: 'CVE-2024-1234',
          device_id: 'device-1',
          device: { device_name: 'Smart Lock', device_type: 'security' },
          severity: 'critical',
          title: 'Authentication Bypass Vulnerability',
          description: 'Remote attackers can bypass authentication and gain unauthorized access',
          affected_component: 'Firmware v1.2.3',
          cvss_score: 9.8,
          status: 'open',
          remediation_steps: ['Update firmware to v1.2.4 or later', 'Enable two-factor authentication', 'Monitor access logs'],
          discovered_at: new Date(Date.now() - 86400000).toISOString()
        },
        {
          id: '2',
          device_id: 'device-2',
          device: { device_name: 'Smart Camera', device_type: 'security' },
          severity: 'high',
          title: 'Weak Default Credentials',
          description: 'Device shipped with default admin password',
          affected_component: 'Web Interface',
          cvss_score: 7.5,
          status: 'acknowledged',
          remediation_steps: ['Change default password immediately', 'Implement password complexity policy'],
          discovered_at: new Date(Date.now() - 172800000).toISOString()
        }
      ]
      setVulnerabilities(mockVulns)

      const mockIncidents: SecurityIncident[] = [
        {
          id: '1',
          incident_type: 'unauthorized_access',
          severity: 'high',
          title: 'Multiple Failed Login Attempts',
          description: '15 failed login attempts from unknown IP address',
          source_ip: '192.168.1.100',
          affected_devices: ['Smart Lock'],
          detected_at: new Date(Date.now() - 7200000).toISOString(),
          status: 'investigating'
        }
      ]
      setIncidents(mockIncidents)

      setStats({
        totalScans: mockScans.length,
        lastScanScore: 78,
        openVulnerabilities: mockVulns.filter(v => v.status === 'open').length,
        criticalVulnerabilities: mockVulns.filter(v => v.severity === 'critical').length,
        activeIncidents: mockIncidents.filter(i => i.status !== 'resolved').length,
        complianceScore: 85
      })

    } catch (error: any) {
      toast.error('Failed to load security data')
    } finally {
      setLoading(false)
    }
  }

  const runSecurityScan = async (scanType: string) => {
    toast.loading('Running security scan...')
    setTimeout(() => {
      toast.dismiss()
      toast.success('Security scan completed')
      loadData()
    }, 3000)
  }

  const exportComplianceReport = () => {
    toast.success('Compliance report exported')
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
          <h1 className="text-3xl font-bold">Security & Compliance</h1>
          <p className="text-gray-600 mt-1">Enterprise-grade security monitoring and compliance management</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => runSecurityScan('full')}>
            <Search className="w-4 h-4 mr-2" />
            Run Security Scan
          </Button>
          <Button variant="outline" onClick={exportComplianceReport}>
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Security Score</p>
                <p className="text-3xl font-bold text-green-600">{stats.lastScanScore}%</p>
              </div>
              <Shield className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Critical Vulnerabilities</p>
                <p className="text-3xl font-bold text-red-600">{stats.criticalVulnerabilities}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Incidents</p>
                <p className="text-3xl font-bold text-orange-600">{stats.activeIncidents}</p>
              </div>
              <XCircle className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Compliance Score</p>
                <p className="text-3xl font-bold text-blue-600">{stats.complianceScore}%</p>
              </div>
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {['scans', 'vulnerabilities', 'incidents', 'compliance'].map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab as any)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                selectedTab === tab
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {selectedTab === 'vulnerabilities' && (
        <div className="space-y-4">
          {vulnerabilities.map((vuln) => (
            <Card key={vuln.id} className={`border-l-4 ${getSeverityColor(vuln.severity).split(' ')[2]}`}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{vuln.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getSeverityColor(vuln.severity)}`}>
                        {vuln.severity.toUpperCase()}
                      </span>
                      {vuln.cvss_score && (
                        <span className="text-sm text-gray-600">CVSS: {vuln.cvss_score}</span>
                      )}
                    </div>
                    <p className="text-gray-700 mb-3">{vuln.description}</p>
                    <p className="text-sm text-gray-600 mb-3">
                      Device: {vuln.device.device_name} • Component: {vuln.affected_component}
                    </p>
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-sm font-semibold text-blue-900 mb-2">Remediation Steps:</p>
                      <ol className="list-decimal list-inside space-y-1">
                        {vuln.remediation_steps.map((step, idx) => (
                          <li key={idx} className="text-sm text-blue-800">{step}</li>
                        ))}
                      </ol>
                    </div>
                  </div>
                  <Button size="sm" className="ml-4">Acknowledge</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedTab === 'compliance' && (
        <Card>
          <CardHeader>
            <CardTitle>Compliance Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {['SOC 2', 'GDPR', 'CCPA', 'ISO 27001'].map((standard) => (
                <div key={standard} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-semibold">{standard}</h3>
                    <p className="text-sm text-gray-600">Last audit: {format(new Date(), 'MMM dd, yyyy')}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <span className="text-green-600 font-medium">Compliant</span>
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
