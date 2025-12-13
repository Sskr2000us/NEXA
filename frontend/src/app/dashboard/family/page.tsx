'use client'

import { useState } from 'react'
import { Users, Shield, Clock, MapPin, Eye, EyeOff } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface FamilyMember {
  id: string
  name: string
  email: string
  role: 'admin' | 'member' | 'guest'
  permissions: string[]
  last_active: string
}

export default function FamilyPage() {
  const [members] = useState<FamilyMember[]>([
    {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'admin',
      permissions: ['all'],
      last_active: '2 hours ago'
    },
    {
      id: '2',
      name: 'Jane Doe',
      email: 'jane@example.com',
      role: 'member',
      permissions: ['devices', 'scenes', 'energy'],
      last_active: '5 hours ago'
    }
  ])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Family & Access Management</h1>
          <p className="text-gray-600 mt-1">Role-based access control and user management</p>
        </div>
        <Button>
          <Users className="w-4 h-4 mr-2" />
          Invite Member
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {members.map((member) => (
          <Card key={member.id}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                    <Users className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{member.name}</h3>
                    <p className="text-sm text-gray-600">{member.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        member.role === 'admin' ? 'bg-purple-100 text-purple-600' :
                        member.role === 'member' ? 'bg-blue-100 text-blue-600' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {member.role.toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-500">Last active: {member.last_active}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">Manage Access</Button>
                  <Button size="sm" variant="outline">Remove</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Guest Access</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">Create temporary access codes for guests (housekeepers, visitors, etc.)</p>
          <Button>
            <Clock className="w-4 h-4 mr-2" />
            Create Guest Access
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
