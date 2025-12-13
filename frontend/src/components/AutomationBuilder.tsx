'use client'

import { useState } from 'react'
import { X, Plus, Trash2, Clock, Zap, AlertCircle, Bell, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent } from '@/components/ui/Card'

interface Trigger {
  id: string
  type: 'schedule' | 'device_state' | 'sensor' | 'time' | 'location'
  config: any
}

interface Condition {
  id: string
  type: 'device_state' | 'time_range' | 'day_of_week' | 'sensor_value'
  operator: 'equals' | 'greater_than' | 'less_than' | 'between'
  config: any
}

interface Action {
  id: string
  type: 'device_control' | 'notification' | 'scene' | 'delay'
  config: any
}

interface AutomationBuilderProps {
  isOpen: boolean
  onClose: () => void
  onSave: (automation: any) => void
  automation?: any
}

export default function AutomationBuilder({ isOpen, onClose, onSave, automation }: AutomationBuilderProps) {
  const [name, setName] = useState(automation?.name || '')
  const [description, setDescription] = useState(automation?.description || '')
  const [triggers, setTriggers] = useState<Trigger[]>(automation?.triggers || [])
  const [conditions, setConditions] = useState<Condition[]>(automation?.conditions || [])
  const [actions, setActions] = useState<Action[]>(automation?.actions || [])
  const [executionMode, setExecutionMode] = useState(automation?.execution_mode || 'sequential')

  if (!isOpen) return null

  const addTrigger = (type: Trigger['type']) => {
    const newTrigger: Trigger = {
      id: `trigger_${Date.now()}`,
      type,
      config: {},
    }
    setTriggers([...triggers, newTrigger])
  }

  const removeTrigger = (id: string) => {
    setTriggers(triggers.filter((t) => t.id !== id))
  }

  const updateTrigger = (id: string, config: any) => {
    setTriggers(triggers.map((t) => (t.id === id ? { ...t, config } : t)))
  }

  const addCondition = (type: Condition['type']) => {
    const newCondition: Condition = {
      id: `condition_${Date.now()}`,
      type,
      operator: 'equals',
      config: {},
    }
    setConditions([...conditions, newCondition])
  }

  const removeCondition = (id: string) => {
    setConditions(conditions.filter((c) => c.id !== id))
  }

  const updateCondition = (id: string, updates: Partial<Condition>) => {
    setConditions(conditions.map((c) => (c.id === id ? { ...c, ...updates } : c)))
  }

  const addAction = (type: Action['type']) => {
    const newAction: Action = {
      id: `action_${Date.now()}`,
      type,
      config: {},
    }
    setActions([...actions, newAction])
  }

  const removeAction = (id: string) => {
    setActions(actions.filter((a) => a.id !== id))
  }

  const updateAction = (id: string, config: any) => {
    setActions(actions.map((a) => (a.id === id ? { ...a, config } : a)))
  }

  const handleSave = () => {
    const automationData = {
      name,
      description,
      triggers,
      conditions,
      actions,
      execution_mode: executionMode,
      is_enabled: true,
    }
    onSave(automationData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {automation ? 'Edit Automation' : 'Create Automation'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Build intelligent automation rules for your smart home
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Basic Info */}
          <div className="space-y-4">
            <Input
              label="Automation Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Good Morning Routine"
              required
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What does this automation do?"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                rows={2}
              />
            </div>
          </div>

          {/* Triggers */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Sparkles className="w-5 h-5 text-primary-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">When (Triggers)</h3>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => addTrigger('schedule')}
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Schedule
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => addTrigger('device_state')}
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Device
                </Button>
              </div>
            </div>
            {triggers.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-gray-500 text-sm">
                    Add a trigger to start building your automation
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {triggers.map((trigger, index) => (
                  <TriggerCard
                    key={trigger.id}
                    trigger={trigger}
                    onUpdate={(config) => updateTrigger(trigger.id, config)}
                    onRemove={() => removeTrigger(trigger.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Conditions */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-orange-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">If (Conditions)</h3>
                <span className="ml-2 text-xs text-gray-500">(Optional)</span>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => addCondition('device_state')}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Condition
              </Button>
            </div>
            {conditions.length > 0 && (
              <div className="space-y-3">
                {conditions.map((condition) => (
                  <ConditionCard
                    key={condition.id}
                    condition={condition}
                    onUpdate={(updates) => updateCondition(condition.id, updates)}
                    onRemove={() => removeCondition(condition.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Zap className="w-5 h-5 text-green-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Then (Actions)</h3>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => addAction('device_control')}
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Control Device
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => addAction('notification')}
                >
                  <Bell className="w-4 h-4 mr-2" />
                  Notify
                </Button>
              </div>
            </div>
            {actions.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-gray-500 text-sm">
                    Add at least one action to complete your automation
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {actions.map((action) => (
                  <ActionCard
                    key={action.id}
                    action={action}
                    onUpdate={(config) => updateAction(action.id, config)}
                    onRemove={() => removeAction(action.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Execution Mode */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Execution Mode
            </label>
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="sequential"
                  checked={executionMode === 'sequential'}
                  onChange={(e) => setExecutionMode(e.target.value)}
                  className="w-4 h-4 text-primary-600"
                />
                <span className="ml-2 text-sm text-gray-700">Sequential</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="parallel"
                  checked={executionMode === 'parallel'}
                  onChange={(e) => setExecutionMode(e.target.value)}
                  className="w-4 h-4 text-primary-600"
                />
                <span className="ml-2 text-sm text-gray-700">Parallel</span>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!name || triggers.length === 0 || actions.length === 0}
          >
            {automation ? 'Update' : 'Create'} Automation
          </Button>
        </div>
      </div>
    </div>
  )
}

function TriggerCard({ trigger, onUpdate, onRemove }: any) {
  return (
    <Card className="border-l-4 border-primary-500">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center mb-3">
              <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs font-medium rounded">
                {trigger.type.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            {trigger.type === 'schedule' && (
              <div className="space-y-2">
                <input
                  type="time"
                  value={trigger.config.time || ''}
                  onChange={(e) => onUpdate({ ...trigger.config, time: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <div className="flex flex-wrap gap-2">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                    <button
                      key={day}
                      className={`px-3 py-1 text-xs rounded-full ${
                        trigger.config.days?.includes(day)
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                      onClick={() => {
                        const days = trigger.config.days || []
                        const newDays = days.includes(day)
                          ? days.filter((d: string) => d !== day)
                          : [...days, day]
                        onUpdate({ ...trigger.config, days: newDays })
                      }}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {trigger.type === 'device_state' && (
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Device name or ID"
                  value={trigger.config.device_id || ''}
                  onChange={(e) => onUpdate({ ...trigger.config, device_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <select
                  value={trigger.config.state || ''}
                  onChange={(e) => onUpdate({ ...trigger.config, state: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">Select state...</option>
                  <option value="on">Turn On</option>
                  <option value="off">Turn Off</option>
                  <option value="motion">Motion Detected</option>
                </select>
              </div>
            )}
          </div>
          <button
            onClick={onRemove}
            className="ml-4 p-2 text-gray-400 hover:text-red-600 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </CardContent>
    </Card>
  )
}

function ConditionCard({ condition, onUpdate, onRemove }: any) {
  return (
    <Card className="border-l-4 border-orange-500">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center mb-3">
              <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded">
                {condition.type.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            <div className="space-y-2">
              <select
                value={condition.operator}
                onChange={(e) => onUpdate({ operator: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="equals">Equals</option>
                <option value="greater_than">Greater Than</option>
                <option value="less_than">Less Than</option>
                <option value="between">Between</option>
              </select>
              <input
                type="text"
                placeholder="Value"
                value={condition.config.value || ''}
                onChange={(e) => onUpdate({ config: { ...condition.config, value: e.target.value } })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          </div>
          <button
            onClick={onRemove}
            className="ml-4 p-2 text-gray-400 hover:text-red-600 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </CardContent>
    </Card>
  )
}

function ActionCard({ action, onUpdate, onRemove }: any) {
  return (
    <Card className="border-l-4 border-green-500">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center mb-3">
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                {action.type.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            {action.type === 'device_control' && (
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Device name or ID"
                  value={action.config.device_id || ''}
                  onChange={(e) => onUpdate({ ...action.config, device_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <select
                  value={action.config.command || ''}
                  onChange={(e) => onUpdate({ ...action.config, command: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">Select command...</option>
                  <option value="turn_on">Turn On</option>
                  <option value="turn_off">Turn Off</option>
                  <option value="set_brightness">Set Brightness</option>
                  <option value="set_temperature">Set Temperature</option>
                </select>
              </div>
            )}
            {action.type === 'notification' && (
              <textarea
                placeholder="Notification message"
                value={action.config.message || ''}
                onChange={(e) => onUpdate({ ...action.config, message: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
                rows={2}
              />
            )}
          </div>
          <button
            onClick={onRemove}
            className="ml-4 p-2 text-gray-400 hover:text-red-600 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </CardContent>
    </Card>
  )
}
