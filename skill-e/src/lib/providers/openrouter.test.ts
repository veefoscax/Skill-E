/**
 * S08: LLM Providers - OpenRouter Provider Tests
 *
 * Tests for OpenRouter provider functionality.
 *
 * Requirements: FR-8.5
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { OpenRouterProvider, OPENROUTER_FREE_MODELS, DEFAULT_OPENROUTER_MODEL } from './openrouter'
import type { Message } from './types'

describe('OpenRouterProvider', () => {
  let provider: OpenRouterProvider

  beforeEach(() => {
    provider = new OpenRouterProvider()
  })

  describe('Configuration', () => {
    it('should have correct provider type', () => {
      expect(provider.type).toBe('openrouter')
    })

    it('should have correct provider name', () => {
      expect(provider.name).toBe('OpenRouter')
    })

    it('should not require API key', () => {
      expect(provider.requiresApiKey).toBe(false)
    })

    it('should support streaming', () => {
      expect(provider.supportsStreaming).toBe(true)
    })

    it('should accept custom base URL', () => {
      const customProvider = new OpenRouterProvider({
        baseUrl: 'https://custom.openrouter.ai/api/v1',
      })
      expect(customProvider).toBeDefined()
    })

    it('should accept API key for paid models', () => {
      const providerWithKey = new OpenRouterProvider({
        apiKey: 'test-key',
      })
      expect(providerWithKey).toBeDefined()
    })
  })

  describe('Free Models', () => {
    it('should have at least 4 free models', () => {
      expect(OPENROUTER_FREE_MODELS.length).toBeGreaterThanOrEqual(4)
    })

    it('should have gemma-2-9b-it:free as first model', () => {
      expect(OPENROUTER_FREE_MODELS[0].id).toBe('google/gemma-2-9b-it:free')
    })

    it('should mark all models as free', () => {
      OPENROUTER_FREE_MODELS.forEach(model => {
        expect(model.isFree).toBe(true)
      })
    })

    it('should have valid context windows', () => {
      OPENROUTER_FREE_MODELS.forEach(model => {
        expect(model.contextWindow).toBeGreaterThan(0)
      })
    })

    it('should have descriptions for all models', () => {
      OPENROUTER_FREE_MODELS.forEach(model => {
        expect(model.description).toBeDefined()
        expect(model.description!.length).toBeGreaterThan(0)
      })
    })

    it('should use gemma-2-9b-it:free as default', () => {
      expect(DEFAULT_OPENROUTER_MODEL).toBe('google/gemma-2-9b-it:free')
    })
  })

  describe('listModels', () => {
    it('should return free models list', async () => {
      const models = await provider.listModels()
      expect(models).toEqual(OPENROUTER_FREE_MODELS)
    })

    it('should return models with required properties', async () => {
      const models = await provider.listModels()

      models.forEach(model => {
        expect(model).toHaveProperty('id')
        expect(model).toHaveProperty('name')
        expect(model).toHaveProperty('isFree')
        expect(model).toHaveProperty('contextWindow')
      })
    })
  })

  describe('Message Formatting', () => {
    it('should handle simple user message', () => {
      const messages: Message[] = [{ role: 'user', content: 'Hello' }]

      // Access protected method through type assertion
      const formatted = (provider as any).formatMessages(messages)
      expect(formatted).toEqual(messages)
    })

    it('should handle system + user messages', () => {
      const messages: Message[] = [
        { role: 'system', content: 'You are a helpful assistant' },
        { role: 'user', content: 'Hello' },
      ]

      const formatted = (provider as any).formatMessages(messages)
      expect(formatted).toEqual(messages)
    })

    it('should handle conversation with assistant', () => {
      const messages: Message[] = [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' },
        { role: 'user', content: 'How are you?' },
      ]

      const formatted = (provider as any).formatMessages(messages)
      expect(formatted).toEqual(messages)
    })
  })

  describe('Default Model', () => {
    it('should return correct default model', () => {
      const defaultModel = (provider as any).getDefaultModel()
      expect(defaultModel).toBe(DEFAULT_OPENROUTER_MODEL)
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid messages gracefully', async () => {
      const messages: Message[] = []

      try {
        const iterator = provider.chat(messages)
        // Try to get first chunk
        await iterator.next()
      } catch (error) {
        expect(error).toBeDefined()
      }
    })
  })

  describe('Model Information', () => {
    it('should include Gemma 2 9B', async () => {
      const models = await provider.listModels()
      const gemma = models.find(m => m.id === 'google/gemma-2-9b-it:free')

      expect(gemma).toBeDefined()
      expect(gemma?.name).toContain('Gemma')
      expect(gemma?.isFree).toBe(true)
    })

    it('should include Llama 3.1 8B', async () => {
      const models = await provider.listModels()
      const llama = models.find(m => m.id === 'meta-llama/llama-3.1-8b-instruct:free')

      expect(llama).toBeDefined()
      expect(llama?.name).toContain('Llama')
      expect(llama?.isFree).toBe(true)
    })

    it('should include Mistral 7B', async () => {
      const models = await provider.listModels()
      const mistral = models.find(m => m.id === 'mistralai/mistral-7b-instruct:free')

      expect(mistral).toBeDefined()
      expect(mistral?.name).toContain('Mistral')
      expect(mistral?.isFree).toBe(true)
    })

    it('should include Phi-3 Mini', async () => {
      const models = await provider.listModels()
      const phi = models.find(m => m.id === 'microsoft/phi-3-mini-128k-instruct:free')

      expect(phi).toBeDefined()
      expect(phi?.name).toContain('Phi')
      expect(phi?.isFree).toBe(true)
      expect(phi?.contextWindow).toBe(128000)
    })
  })
})
