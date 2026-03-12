/**
 * S08: LLM Providers - Integration Tests
 *
 * Tests that verify the complete provider system works together.
 * These tests demonstrate typical usage patterns.
 */

import { describe, it, expect } from 'vitest'
import {
  createProvider,
  getProviderInfo,
  getDefaultConfig,
  validateProviderConfig,
  getRecommendedProvider,
  getAllProviderInfo,
  isFreeProvider,
  requiresApiKey,
} from './factory'
import type { ProviderType } from './types'

describe('Provider System Integration', () => {
  describe('Typical Usage Patterns', () => {
    it('should create recommended provider for new users', () => {
      // Get recommended provider (OpenRouter - free tier)
      const recommendedType = getRecommendedProvider()
      expect(recommendedType).toBe('openrouter')

      // Get default config
      const config = getDefaultConfig(recommendedType)
      expect(config.type).toBe('openrouter')
      expect(config.model).toBeDefined()

      // Validate config (should be valid without API key)
      const validation = validateProviderConfig(config)
      expect(validation.valid).toBe(true)

      // Create provider
      const provider = createProvider(config)
      expect(provider.type).toBe('openrouter')
      expect(provider.requiresApiKey).toBe(false)
    })

    it('should create provider with user-selected type and API key', () => {
      // User selects Anthropic
      const selectedType: ProviderType = 'anthropic'

      // Get provider info to show in UI
      const info = getProviderInfo(selectedType)
      expect(info.name).toBe('Anthropic (Claude)')
      expect(info.requiresApiKey).toBe(true)

      // Get default config
      const config = getDefaultConfig(selectedType)

      // User provides API key
      const configWithKey = {
        ...config,
        apiKey: 'sk-ant-test-key',
      }

      // Validate config
      const validation = validateProviderConfig(configWithKey)
      expect(validation.valid).toBe(true)

      // Create provider
      const provider = createProvider(configWithKey)
      expect(provider.type).toBe('anthropic')
      expect(provider.name).toBe('Anthropic (Claude)')
    })

    it('should list all providers for settings UI', () => {
      // Get all provider info for dropdown
      const providers = getAllProviderInfo()
      expect(providers).toHaveLength(5)

      // Each provider has display info
      providers.forEach(info => {
        expect(info.name).toBeDefined()
        expect(info.description).toBeDefined()
        expect(typeof info.requiresApiKey).toBe('boolean')
        expect(typeof info.isFree).toBe('boolean')
      })

      // Can filter to show free providers first
      const freeProviders = providers.filter(p => p.isFree)
      expect(freeProviders).toHaveLength(2)
      expect(freeProviders.map(p => p.type)).toContain('openrouter')
      expect(freeProviders.map(p => p.type)).toContain('ollama')
    })

    it('should validate config before saving', () => {
      // User tries to save Anthropic without API key
      const invalidConfig = {
        type: 'anthropic' as ProviderType,
        model: 'claude-3-5-sonnet-20241022',
      }

      const validation = validateProviderConfig(invalidConfig)
      expect(validation.valid).toBe(false)
      expect(validation.error).toContain('API key is required')

      // Show error to user, don't create provider
    })

    it('should handle provider switching', () => {
      // Start with OpenRouter (free)
      const openrouterConfig = getDefaultConfig('openrouter')
      const openrouterProvider = createProvider(openrouterConfig)
      expect(openrouterProvider.type).toBe('openrouter')

      // Switch to Ollama (local)
      const ollamaConfig = getDefaultConfig('ollama')
      const ollamaProvider = createProvider(ollamaConfig)
      expect(ollamaProvider.type).toBe('ollama')

      // Both are free and don't require API keys
      expect(isFreeProvider('openrouter')).toBe(true)
      expect(isFreeProvider('ollama')).toBe(true)
      expect(requiresApiKey('openrouter')).toBe(false)
      expect(requiresApiKey('ollama')).toBe(false)
    })
  })

  describe('Error Handling', () => {
    it('should catch validation errors before provider creation', () => {
      const invalidConfigs = [
        // Missing API key for paid provider
        {
          type: 'anthropic' as ProviderType,
          model: 'claude-3-5-sonnet-20241022',
        },
        // Missing model
        {
          type: 'openrouter' as ProviderType,
          model: '',
        },
        // Invalid temperature
        {
          type: 'openrouter' as ProviderType,
          model: 'google/gemma-2-9b-it:free',
          temperature: 3,
        },
        // Invalid max tokens
        {
          type: 'openrouter' as ProviderType,
          model: 'google/gemma-2-9b-it:free',
          maxTokens: -1,
        },
      ]

      invalidConfigs.forEach(config => {
        const validation = validateProviderConfig(config)
        expect(validation.valid).toBe(false)
        expect(validation.error).toBeDefined()
      })
    })

    it('should provide helpful error messages', () => {
      const config = {
        type: 'anthropic' as ProviderType,
        model: 'claude-3-5-sonnet-20241022',
      }

      const validation = validateProviderConfig(config)
      expect(validation.valid).toBe(false)
      expect(validation.error).toContain('API key is required')
      expect(validation.error).toContain('Anthropic')
    })
  })

  describe('Provider Capabilities', () => {
    it('should identify streaming support', () => {
      const providers = getAllProviderInfo()

      // All providers support streaming
      providers.forEach(info => {
        expect(info.supportsStreaming).toBe(true)
      })
    })

    it('should identify free providers', () => {
      const freeProviders = getAllProviderInfo().filter(p => p.isFree)
      const paidProviders = getAllProviderInfo().filter(p => !p.isFree)

      expect(freeProviders).toHaveLength(2)
      expect(paidProviders).toHaveLength(3)

      // Free providers
      expect(freeProviders.map(p => p.type)).toContain('openrouter')
      expect(freeProviders.map(p => p.type)).toContain('ollama')

      // Paid providers
      expect(paidProviders.map(p => p.type)).toContain('anthropic')
      expect(paidProviders.map(p => p.type)).toContain('openai')
      expect(paidProviders.map(p => p.type)).toContain('google')
    })

    it('should identify API key requirements', () => {
      const noKeyNeeded = getAllProviderInfo().filter(p => !p.requiresApiKey)
      const keyRequired = getAllProviderInfo().filter(p => p.requiresApiKey)

      expect(noKeyNeeded).toHaveLength(2)
      expect(keyRequired).toHaveLength(3)

      // No key needed
      expect(noKeyNeeded.map(p => p.type)).toContain('openrouter')
      expect(noKeyNeeded.map(p => p.type)).toContain('ollama')

      // Key required
      expect(keyRequired.map(p => p.type)).toContain('anthropic')
      expect(keyRequired.map(p => p.type)).toContain('openai')
      expect(keyRequired.map(p => p.type)).toContain('google')
    })
  })

  describe('Configuration Management', () => {
    it('should provide sensible defaults', () => {
      const types: ProviderType[] = ['openrouter', 'anthropic', 'openai', 'google', 'ollama']

      types.forEach(type => {
        const config = getDefaultConfig(type)

        // Has required fields
        expect(config.type).toBe(type)
        expect(config.model).toBeDefined()
        expect(config.model.length).toBeGreaterThan(0)

        // Has reasonable defaults
        expect(config.temperature).toBe(0.7)
        expect(config.maxTokens).toBeGreaterThan(0)
      })
    })

    it('should allow config customization', () => {
      const baseConfig = getDefaultConfig('openrouter')

      // Customize config
      const customConfig = {
        ...baseConfig,
        temperature: 0.9,
        maxTokens: 2048,
      }

      // Validate custom config
      const validation = validateProviderConfig(customConfig)
      expect(validation.valid).toBe(true)

      // Create provider with custom config
      const provider = createProvider(customConfig)
      expect(provider.type).toBe('openrouter')
    })

    it('should handle Ollama custom base URL', () => {
      const config = getDefaultConfig('ollama')
      expect(config.baseUrl).toBe('http://localhost:11434')

      // Customize base URL
      const customConfig = {
        ...config,
        baseUrl: 'http://custom-server:11434',
      }

      const provider = createProvider(customConfig)
      expect(provider.type).toBe('ollama')
    })
  })

  describe('UI Integration Scenarios', () => {
    it('should support provider selection dropdown', () => {
      // Get all providers for dropdown
      const providers = getAllProviderInfo()

      // Sort: free providers first
      const sorted = [...providers].sort((a, b) => {
        if (a.isFree && !b.isFree) return -1
        if (!a.isFree && b.isFree) return 1
        return 0
      })

      expect(sorted[0].isFree).toBe(true)
      expect(sorted[1].isFree).toBe(true)
      expect(sorted[2].isFree).toBe(false)
    })

    it('should support conditional API key input', () => {
      const selectedType: ProviderType = 'anthropic'
      const info = getProviderInfo(selectedType)

      // Show API key input only if required
      if (info.requiresApiKey) {
        expect(info.type).toBe('anthropic')
        // UI would show API key input field
      }
    })

    it('should support provider info display', () => {
      const info = getProviderInfo('openrouter')

      // Display in UI
      expect(info.name).toBe('OpenRouter')
      expect(info.description).toContain('Free tier')
      expect(info.icon).toBeDefined()

      // Show badges
      if (info.isFree) {
        // Show "FREE" badge
        expect(info.isFree).toBe(true)
      }

      if (info.supportsStreaming) {
        // Show "STREAMING" badge
        expect(info.supportsStreaming).toBe(true)
      }
    })
  })
})
