'use client'

import { useState } from 'react'
import { Wrench, Users, CheckCircle, Clock } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface Project {
  id: string
  client_name: string
  address: string
  devices_count: number
  status: 'planning' | 'in_progress' | 'completed'
  created_at: string
}

export default function InstallerPage() {
  const [projects] = useState<Project[]>([
    {
      id: '1',
      client_name: 'Smith Residence',
      address: '123 Main St, San Francisco, CA',
      devices_count: 24,
      status: 'in_progress',
      created_at: '2024-01-15'
    },
    {
      id: '2',
      client_name: 'Johnson Home',
      address: '456 Oak Ave, Los Angeles, CA',
      devices_count: 18,
      status: 'completed',
      created_at: '2024-01-10'
    }
  ])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Installer Portal</h1>
          <p className="text-gray-600 mt-1">Professional installation management</p>
        </div>
        <Button>
          <Wrench className="w-4 h-4 mr-2" />
          New Project
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Projects</p>
                <p className="text-3xl font-bold">{projects.filter(p => p.status === 'in_progress').length}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-3xl font-bold">{projects.filter(p => p.status === 'completed').length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Devices</p>
                <p className="text-3xl font-bold">{projects.reduce((sum, p) => sum + p.devices_count, 0)}</p>
              </div>
              <Wrench className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {projects.map((project) => (
          <Card key={project.id}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{project.client_name}</h3>
                  <p className="text-sm text-gray-600">{project.address}</p>
                  <p className="text-sm text-gray-500 mt-1">{project.devices_count} devices</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    project.status === 'completed' ? 'bg-green-100 text-green-600' :
                    project.status === 'in_progress' ? 'bg-blue-100 text-blue-600' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {project.status.replace('_', ' ').toUpperCase()}
                  </span>
                  <Button size="sm">View Details</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
