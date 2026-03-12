import { describe, it, expect, beforeEach } from 'vitest'
import {
  useProviderStore,
  getProviderDisplayName,
  requiresApiKey,
  isFreeProvider,
  validateApiKey,
} from './provider'

/**
 * S08: Provider Store Tests
 *
 * Tests provider store functionality including:
 * - Provider selection
 * - API key management
 * - Configuration updates
 * - Helper functions
 *
 * Requirements: FR-8.3
 */

describe('Provider Store', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useProviderStore.getState().reset()
  })

  describe('Initial State', () => {
    it('should default to OpenRouter with free model', () => {
      const state = useProviderStore.getState()

      expect(state.config.type).toBe('openrouter')
      expect(state.config.model).toBe('google/gemma-2-9b-it:free')
      expect(state.config.temperature).toBe(0.7)
      expect(state.config.maxTokens).toBe(4096)
    })

    it('should have empty API keys initially', () => {
      const state = useProviderStore.getState()

      expect(state.apiKeys).toEqual({})
    })

    it('should have no integrations detected initially', () => {
      const state = useProviderStore.getState()

      expect(state.integrations.antigravity).toBe(false)
      expect(state.integrations.claudeCode).toBe(false)
    })
  })

  describe('Provider Selection', () => {
    it('should switch to Anthropic with default Claude model', () => {
      const { setProvider } = useProviderStore.getState()

      setProvider('anthropic')

      const state = useProviderStore.getState()
      expect(state.config.type).toBe('anthropic')
      expect(state.config.model).toBe('claude-3-5-sonnet-20241022')
    })

    it('should switch to OpenAI with default GPT model', () => {
      const { setProvider } = useProviderStore.getState()

      setProvider('openai')

      const state = useProviderStore.getState()
      expect(state.config.type).toBe('openai')
      expect(state.config.model).toBe('gpt-4o')
    })

    it('should switch to Google with default Gemini model', () => {
      const { setProvider } = useProviderStore.getState()

      setProvider('google')

      const state = useProviderStore.getState()
      expect(state.config.type).toBe('google')
      expect(state.config.model).toBe('gemini-1.5-pro')
    })

    it('should switch to Ollama with default local model', () => {
      const { setProvider } = useProviderStore.getState()

      setProvider('ollama')

      const state = useProviderStore.getState()
      expect(state.config.type).toBe('ollama')
      expect(state.config.model).toBe('llama3.1')
    })

    it('should include API key in config when switching to provider with stored key', () => {
      const { setApiKey, setProvider } = useProviderStore.getState()

      // Store API key for Anthropic
      setApiKey('anthropic', 'sk-ant-test-key')

      // Switch to Anthropic
      setProvider('anthropic')

      const state = useProviderStore.getState()
      expect(state.config.apiKey).toBe('sk-ant-test-key')
    })
  })

  describe('API Key Management', () => {
    it('should store API key for a provider', () => {
      const { setApiKey } = useProviderStore.getState()

      setApiKey('anthropic', 'sk-ant-test-key')

      const state = useProviderStore.getState()
      expect(state.apiKeys.anthropic).toBe('sk-ant-test-key')
    })

    it('should store multiple API keys for different providers', () => {
      const { setApiKey } = useProviderStore.getState()

      setApiKey('anthropic', 'sk-ant-test-key')
      setApiKey('openai', 'sk-test-key')
      setApiKey('google', 'google-test-key')

      const state = useProviderStore.getState()
      expect(state.apiKeys.anthropic).toBe('sk-ant-test-key')
      expect(state.apiKeys.openai).toBe('sk-test-key')
      expect(state.apiKeys.google).toBe('google-test-key')
    })

    it('should update config API key when setting key for active provider', () => {
      const { setProvider, setApiKey } = useProviderStore.getState()

      // Switch to Anthropic
      setProvider('anthropic')

      // Set API key
      setApiKey('anthropic', 'sk-ant-new-key')

      const state = useProviderStore.getState()
      expect(state.config.apiKey).toBe('sk-ant-new-key')
    })

    it('should not update config API key when setting key for inactive provider', () => {
      const { setProvider, setApiKey } = useProviderStore.getState()

      // Stay on OpenRouter
      setProvider('openrouter')

      // Set API key for Anthropic (not active)
      setApiKey('anthropic', 'sk-ant-test-key')

      const state = useProviderStore.getState()
      expect(state.config.apiKey).toBeUndefined()
      expect(state.apiKeys.anthropic).toBe('sk-ant-test-key')
    })
  })

  describe('Configuration Updates', () => {
    it('should update model', () => {
      const { setModel } = useProviderStore.getState()

      setModel('claude-3-opus-20240229')

      const state = useProviderStore.getState()
      expect(state.config.model).toBe('claude-3-opus-20240229')
    })

    it('should update temperature within valid range', () => {
      const { setTemperature } = useProviderStore.getState()

      setTemperature(0.5)

      const state = useProviderStore.getState()
      expect(state.config.temperature).toBe(0.5)
    })

    it('should clamp temperature to 0-1 range', () => {
      const { setTemperature } = useProviderStore.getState()

      setTemperature(1.5)
      expect(useProviderStore.getState().config.temperature).toBe(1)

      setTemperature(-0.5)
      expect(useProviderStore.getState().config.temperature).toBe(0)
    })

    it('should update max tokens', () => {
      const { setMaxTokens } = useProviderStore.getState()

      setMaxTokens(8192)

      const state = useProviderStore.getState()
      expect(state.config.maxTokens).toBe(8192)
    })

    it('should enforce minimum max tokens of 1', () => {
      const { setMaxTokens } = useProviderStore.getState()

      setMaxTokens(0)

      const state = useProviderStore.getState()
      expect(state.config.maxTokens).toBe(1)
    })

    it('should update base URL', () => {
      const { setBaseUrl } = useProviderStore.getState()

      setBaseUrl('http://localhost:11434')

      const state = useProviderStore.getState()
      expect(state.config.baseUrl).toBe('http://localhost:11434')
    })

    it('should update multiple config properties at once', () => {
      const { updateConfig } = useProviderStore.getState()

      updateConfig({
        model: 'gpt-4-turbo',
        temperature: 0.8,
        maxTokens: 16000,
      })

      const state = useProviderStore.getState()
      expect(state.config.model).toBe('gpt-4-turbo')
      expect(state.config.temperature).toBe(0.8)
      expect(state.config.maxTokens).toBe(16000)
    })
  })

  describe('Integration Status', () => {
    it('should update integration status', () => {
      const { setIntegrations } = useProviderStore.getState()

      setIntegrations({
        antigravity: true,
        claudeCode: false,
      })

      const state = useProviderStore.getState()
      expect(state.integrations.antigravity).toBe(true)
      expect(state.integrations.claudeCode).toBe(false)
    })

    it('should detect both integrations', () => {
      const { setIntegrations } = useProviderStore.getState()

      setIntegrations({
        antigravity: true,
        claudeCode: true,
      })

      const state = useProviderStore.getState()
      expect(state.integrations.antigravity).toBe(true)
      expect(state.integrations.claudeCode).toBe(true)
    })
  })

  describe('Reset', () => {
    it('should reset to initial state', () => {
      const { setProvider, setApiKey, setModel, reset } = useProviderStore.getState()

      // Make changes
      setProvider('anthropic')
      setApiKey('anthropic', 'sk-ant-test-key')
      setModel('claude-3-opus-20240229')

      // Reset
      reset()

      const state = useProviderStore.getState()
      expect(state.config.type).toBe('openrouter')
      expect(state.config.model).toBe('google/gemma-2-9b-it:free')
      expect(state.apiKeys).toEqual({})
    })
  })
})

describe('Helper Functions', () => {
  describe('getProviderDisplayName', () => {
    it('should return correct display names', () => {
      expect(getProviderDisplayName('openrouter')).toBe('OpenRouter')
      expect(getProviderDisplayName('anthropic')).toBe('Anthropic (Claude)')
      expect(getProviderDisplayName('openai')).toBe('OpenAI (GPT)')
      expect(getProviderDisplayName('google')).toBe('Google (Gemini)')
      expect(getProviderDisplayName('ollama')).toBe('Ollama (Local)')
    })
  })

  describe('requiresApiKey', () => {
    it('should return false for OpenRouter', () => {
      expect(requiresApiKey('openrouter')).toBe(false)
    })

    it('should return false for Ollama', () => {
      expect(requiresApiKey('ollama')).toBe(false)
    })

    it('should return true for Anthropic', () => {
      expect(requiresApiKey('anthropic')).toBe(true)
    })

    it('should return true for OpenAI', () => {
      expect(requiresApiKey('openai')).toBe(true)
    })

    it('should return true for Google', () => {
      expect(requiresApiKey('google')).toBe(true)
    })
  })

  describe('isFreeProvider', () => {
    it('should return true for OpenRouter', () => {
      expect(isFreeProvider('openrouter')).toBe(true)
    })

    it('should return true for Ollama', () => {
      expect(isFreeProvider('ollama')).toBe(true)
    })

    it('should return false for paid providers', () => {
      expect(isFreeProvider('anthropic')).toBe(false)
      expect(isFreeProvider('openai')).toBe(false)
      expect(isFreeProvider('google')).toBe(false)
    })
  })

  describe('validateApiKey', () => {
    it('should validate OpenRouter keys', () => {
      expect(validateApiKey('openrouter', 'sk-or-v1-test')).toBe(true)
      expect(validateApiKey('openrouter', 'sk-test')).toBe(false)
      expect(validateApiKey('openrouter', '')).toBe(false)
    })

    it('should validate Anthropic keys', () => {
      expect(validateApiKey('anthropic', 'sk-ant-test')).toBe(true)
      expect(validateApiKey('anthropic', 'sk-test')).toBe(false)
      expect(validateApiKey('anthropic', '')).toBe(false)
    })

    it('should validate OpenAI keys', () => {
      expect(validateApiKey('openai', 'sk-test')).toBe(true)
      expect(validateApiKey('openai', 'test')).toBe(false)
      expect(validateApiKey('openai', '')).toBe(false)
    })

    it('should validate Google keys', () => {
      expect(validateApiKey('google', 'AIzaSyTest123')).toBe(true)
      expect(validateApiKey('google', 'test-key_123')).toBe(true)
      expect(validateApiKey('google', 'invalid key!')).toBe(false)
      expect(validateApiKey('google', '')).toBe(false)
    })

    it('should always return true for Ollama', () => {
      expect(validateApiKey('ollama', '')).toBe(true)
      expect(validateApiKey('ollama', 'anything')).toBe(true)
    })
  })
})
