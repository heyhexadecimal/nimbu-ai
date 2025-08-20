"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { APIKeys, getAPIKeys, setAPIKeys } from '@/lib/api-keys'
import { X } from 'lucide-react'

interface KeysManagerProps {
  isOpen: boolean
  onClose: () => void
  onSave: (updatedKeys: any) => void
}

export function KeysManager({ isOpen, onClose, onSave }: KeysManagerProps) {
  const [keys, setKeys] = useState<APIKeys>({})
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setKeys(getAPIKeys())
    }
  }, [isOpen])

  const handleSave = async () => {
    setIsLoading(true)
    try {
      setAPIKeys(keys)
      onSave(keys)
    } catch (error) {
      console.error('Error saving API keys:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const updateKey = (provider: 'openai' | 'gemini', value: string) => {
    setKeys(prev => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        key: value
      }
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl font-semibold">
            Add Your API Keys To Start Chatting
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Keys are stored locally in your browser. The application will automatically use the best available models with your API keys.
          </p>

          {/* Google API Key (Gemini) */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h3 className="font-medium">Google API Key</h3>
              <Badge variant="secondary">Gemini</Badge>
            </div>

            <Input
              placeholder="Enter your Google API key"
              value={keys.gemini?.key || ''}
              onChange={(e) => updateKey('gemini', e.target.value)}
              className="font-mono text-sm bg-white"
            />

            <a
              href="https://makersuite.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline inline-block"
            >
              Create Google API Key
            </a>
          </div>

          {/* OpenAI API Key */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h3 className="font-medium">OpenAI API Key</h3>
              <Badge variant="secondary">GPT</Badge>
            </div>

            <Input
              placeholder="Enter your OpenAI API key"
              value={keys.openai?.key || ''}
              onChange={(e) => updateKey('openai', e.target.value)}
              className="font-mono text-sm bg-white"
            />

            <a
              href="https://platform.openai.com/api-keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline inline-block"
            >
              Create OpenAI API Key
            </a>
          </div>

          {/* Save Button */}
          <div className="pt-4">
            <Button
              onClick={handleSave}
              disabled={isLoading || (!keys.gemini?.key && !keys.openai?.key)}
              className="w-full h-12 text-base"
            >
              {isLoading ? 'Saving...' : 'Save API Keys'}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            You need at least one API key to start chatting. Keys are encrypted and stored locally in your browser.
          </p>
        </CardContent>
      </Card>
    </div>
  )
} 