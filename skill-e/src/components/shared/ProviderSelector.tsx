/**
 * Unified Provider Selector Component
 *
 * Used in both Settings and ProcessingScreen error handling
 * to ensure consistent provider selection experience everywhere.
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Check, ChevronDown, Eye, EyeOff, Sparkles } from 'lucide-react'
import { useSettingsStore, type LLMProvider, LLM_DEFAULTS } from '@/stores/settings'
import { ModelSelector } from './ModelSelector'

interface ProviderSelectorProps {
  /** If true, shows a compact version for error screens */
  compact?: boolean
  /** Called when provider changes */
  onProviderChange?: (provider: LLMProvider) => void
}

// Providers that allow Base URL editing
const ALLOW_BASE_URL_EDIT = [
  'custom',
  'ollama',
  'moonshot',
  'kimi-code',
  'minimax',
  'qwen-portal',
  'xiaomi',
]

const NO_API_KEY_PROVIDERS = ['ollama', 'codex']

export function ProviderSelector({ compact = false, onProviderChange }: ProviderSelectorProps) {
  const {
    llmProvider,
    setLlmProvider,
    llmApiKey,
    setLlmApiKey,
    llmBaseUrl,
    setLlmBaseUrl,
    llmModel,
    setLlmModel,
  } = useSettingsStore()

  const [showApiKey, setShowApiKey] = useState(false)

  const handleProviderChange = (provider: LLMProvider) => {
    setLlmProvider(provider)

    // Auto-fill defaults sempre que mudar de provedor
    const defaults = LLM_DEFAULTS[provider]
    if (defaults.baseUrl !== undefined) {
      setLlmBaseUrl(defaults.baseUrl)
    }
    if (defaults.defaultModel) {
      setLlmModel(defaults.defaultModel)
    }

    // Special case for Ollama
    if (provider === 'ollama' && !llmApiKey) {
      setLlmApiKey('ollama')
    }

    onProviderChange?.(provider)
  }

  if (compact) {
    // Compact version for error screens
    return (
      <div className="space-y-3">
        {/* Provider Dropdown */}
        <div>
          <Label className="text-xs font-medium text-gray-700">Provider</Label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-between h-9 text-sm mt-1">
                <span className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  {LLM_DEFAULTS[llmProvider]?.label || 'Select Provider'}
                </span>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[280px] max-h-[250px] overflow-y-auto" align="start">
              {(Object.keys(LLM_DEFAULTS) as LLMProvider[]).map(p => (
                <DropdownMenuItem
                  key={p}
                  onClick={() => handleProviderChange(p)}
                  className="justify-between cursor-pointer"
                >
                  <span className="font-medium">{LLM_DEFAULTS[p].label}</span>
                  {llmProvider === p && <Check className="h-4 w-4 text-primary" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Base URL (if editable) */}
        {ALLOW_BASE_URL_EDIT.includes(llmProvider) && (
          <div>
            <Label className="text-xs font-medium text-gray-700">
              Base URL {llmProvider === 'kimi-code' && '(change for worldwide)'}
            </Label>
            <Input
              value={llmBaseUrl}
              onChange={e => setLlmBaseUrl(e.target.value)}
              placeholder={
                llmProvider === 'kimi-code'
                  ? 'https://api.kimi.com/coding/v1'
                  : 'https://api.example.com/v1'
              }
              className="font-mono text-xs h-9 mt-1"
            />
            {llmProvider === 'kimi-code' && (
              <p className="text-[10px] text-gray-500 mt-1">
                Default: api.kimi.com/coding/v1 (worldwide).
              </p>
            )}
          </div>
        )}

        {/* API Key */}
        {!NO_API_KEY_PROVIDERS.includes(llmProvider) && (
          <div>
            <Label className="text-xs font-medium text-gray-700">API Key</Label>
            <div className="relative mt-1">
              <Input
                type={showApiKey ? 'text' : 'password'}
                placeholder={llmProvider === 'anthropic' ? 'sk-ant-...' : 'sk-...'}
                className="pr-10 text-xs h-9"
                value={llmApiKey}
                onChange={e => setLlmApiKey(e.target.value)}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-9 w-9 text-muted-foreground hover:bg-transparent"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        )}

        {/* Model Selector */}
        <div>
          <Label className="text-xs font-medium text-gray-700">Model</Label>
          <div className="mt-1">
            <ModelSelector
              provider={llmProvider}
              baseUrl={llmBaseUrl}
              apiKey={llmApiKey}
              value={llmModel}
              onChange={setLlmModel}
            />
          </div>
        </div>

        {/* Current config summary */}
        <p className="text-[10px] text-gray-500 pt-1 border-t">
          {llmProvider} → {llmBaseUrl || 'default'}
        </p>
      </div>
    )
  }

  // Full version for Settings
  return (
    <div className="space-y-4">
      {/* Provider Selector */}
      <div className="space-y-2">
        <Label className="text-xs font-medium">AI Provider</Label>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full justify-between h-9 text-sm">
              <span className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                {LLM_DEFAULTS[llmProvider]?.label || 'Select Provider'}
              </span>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[300px] max-h-[300px] overflow-y-auto z-[20000]"
            align="start"
          >
            {(Object.keys(LLM_DEFAULTS) as LLMProvider[]).map(p => (
              <DropdownMenuItem
                key={p}
                onClick={() => handleProviderChange(p)}
                className="justify-between cursor-pointer py-2"
              >
                <div className="flex flex-col">
                  <span className="font-medium">{LLM_DEFAULTS[p].label}</span>
                </div>
                {llmProvider === p && <Check className="h-4 w-4 text-primary" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Base URL (Conditional) */}
      {ALLOW_BASE_URL_EDIT.includes(llmProvider) && (
        <div className="space-y-2">
          <Label className="text-xs font-medium">
            Base URL{' '}
            {llmProvider === 'kimi-code' && (
              <span className="text-blue-600">(editable for worldwide)</span>
            )}
          </Label>
          <Input
            value={llmBaseUrl}
            onChange={e => setLlmBaseUrl(e.target.value)}
            placeholder={
              llmProvider === 'kimi-code'
                ? 'https://api.kimi.com/coding/v1'
                : 'https://api.example.com/v1'
            }
            className="font-mono text-xs h-9"
          />
          {llmProvider === 'kimi-code' && (
            <p className="text-[10px] text-muted-foreground">
              Uses api.kimi.com (worldwide). Edit to api.moonshot.cn for China endpoint.
            </p>
          )}
        </div>
      )}

      {/* API Key */}
      {!NO_API_KEY_PROVIDERS.includes(llmProvider) && (
        <div className="space-y-2">
          <Label className="text-xs font-medium">API Key</Label>
          <div className="relative">
            <Input
              type={showApiKey ? 'text' : 'password'}
              placeholder={llmProvider === 'anthropic' ? 'sk-ant-...' : 'sk-...'}
              className="pr-10 text-xs h-9"
              value={llmApiKey}
              onChange={e => setLlmApiKey(e.target.value)}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-9 w-9 text-muted-foreground hover:bg-transparent"
              onClick={() => setShowApiKey(!showApiKey)}
            >
              {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      )}

      {/* Model Selector */}
      <div className="space-y-2">
        <Label className="text-xs font-medium">Model Name</Label>
        <ModelSelector
          provider={llmProvider}
          baseUrl={llmBaseUrl}
          apiKey={llmApiKey}
          value={llmModel}
          onChange={setLlmModel}
        />
        <p className="text-[10px] text-muted-foreground">
          {llmProvider === 'moonshot'
            ? 'Chinese LLM: moonshot-v1-8k'
            : llmProvider === 'kimi-code'
              ? 'kimi-k2, k1-unsupervised, etc. (api.kimi.com)'
              : llmProvider === 'ollama'
                ? 'Select from your local models'
                : llmProvider === 'google'
                  ? 'gemini-pro or similar'
                  : llmProvider === 'openai'
                    ? 'gpt-4o, gpt-4-turbo, etc.'
                    : llmProvider === 'anthropic'
                      ? 'claude-3-5-sonnet, claude-3-opus, etc.'
                      : 'Select target model'}
        </p>
      </div>
    </div>
  )
}
