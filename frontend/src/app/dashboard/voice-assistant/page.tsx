'use client'

import { useState } from 'react'
import { Mic, Send, Volume2, MessageSquare, Zap } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import toast from 'react-hot-toast'

interface Message {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export default function VoiceAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: 'Hi! I\'m your NEXA AI assistant. You can ask me to control devices, create automations, or get insights. Try: "Turn off all lights" or "What\'s my energy usage today?"',
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [isListening, setIsListening] = useState(false)

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date()
    }

    setMessages([...messages, userMessage])
    setInput('')

    // Simulate AI response
    setTimeout(() => {
      const response = generateResponse(input)
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response,
        timestamp: new Date()
      }])
    }, 1000)
  }

  const generateResponse = (query: string): string => {
    const q = query.toLowerCase()
    if (q.includes('light')) return '✓ Turned off all lights in your home'
    if (q.includes('temperature') || q.includes('thermostat')) return 'Current temperature is 72°F. Would you like me to adjust it?'
    if (q.includes('energy')) return 'Today\'s energy usage: 42 kWh ($9.24). You\'re 8% below your daily average!'
    if (q.includes('lock')) return '✓ All doors are locked. Your home is secure.'
    if (q.includes('scene')) return 'Available scenes: Movie Night, Good Morning, Sleep Mode. Which would you like to activate?'
    return 'I can help you with device control, energy monitoring, automations, and more. What would you like to do?'
  }

  const startListening = () => {
    setIsListening(true)
    toast.success('Listening...')
    setTimeout(() => {
      setIsListening(false)
      setInput('Turn off all lights in living room')
    }, 2000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Voice & AI Assistant</h1>
        <p className="text-gray-600 mt-1">Natural language control powered by AI</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-6">
              <div className="h-[500px] overflow-y-auto mb-4 space-y-4">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-lg p-4 ${
                      msg.type === 'user' 
                        ? 'bg-primary-600 text-white' 
                        : 'bg-gray-100 text-gray-900'
                    }`}>
                      <p>{msg.content}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={startListening}
                  className={isListening ? 'bg-red-50' : ''}
                >
                  <Mic className={`w-5 h-5 ${isListening ? 'text-red-600' : ''}`} />
                </Button>
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask me anything..."
                  className="flex-1"
                />
                <Button onClick={handleSend}>
                  <Send className="w-5 h-5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-3">Quick Commands</h3>
              <div className="space-y-2">
                {[
                  'Turn off all lights',
                  'Lock all doors',
                  'Set temperature to 72°F',
                  'Activate Movie Night scene',
                  'Show energy usage',
                  'Run diagnostics'
                ].map((cmd) => (
                  <button
                    key={cmd}
                    onClick={() => setInput(cmd)}
                    className="w-full text-left p-2 rounded hover:bg-gray-50 text-sm"
                  >
                    <Zap className="w-4 h-4 inline mr-2 text-primary-600" />
                    {cmd}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
