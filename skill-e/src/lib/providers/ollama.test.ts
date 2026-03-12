/**
 * S08: LLM Providers - Ollama Provider Tests
 *
 * Unit tests for the Ollama provider.
 * Tests local model execution, streaming, and model management.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { OllamaProvider, DEFAULT_OLLAMA_MODEL, DEFAULT_OLLAMA_BASE_URL } from './ollama'
import type { Message } from './types'

describe('OllamaProvider', () => {
  let provider: OllamaProvider

  beforeEach(() => {
    provider = new OllamaProvider()
    // Clear all mocks
    vi.clearAllMocks()
  })

  describe('Configuration', () => {
    it('should have correct provider metadata', () => {
      expect(provider.type).toBe('ollama')
      expect(provider.name).toBe('Ollama')
      expect(provider.requiresApiKey).toBe(false)
      expect(provider.supportsStreaming).toBe(true)
    })

    it('should use default base URL', () => {
      expect(provider['baseUrl']).toBe(DEFAULT_OLLAMA_BASE_URL)
    })

    it('should accept custom base URL', () => {
      const customProvider = new OllamaProvider({
        baseUrl: 'http://custom-ollama:11434',
      })
      expect(customProvider['baseUrl']).toBe('http://custom-ollama:11434')
    })

    it('should not require API key', () => {
      expect(provider.requiresApiKey).toBe(false)
      expect(provider['apiKey']).toBeUndefined()
    })
  })

  describe('chat()', () => {
    it('should stream chat responses', async () => {
      // Mock fetch for streaming response
      const mockResponse = new Response(
        new ReadableStream({
          start(controller) {
            controller.enqueue(
              new TextEncoder().encode(
                '{"message":{"role":"assistant","content":"Hello"},"done":false}\n'
              )
            )
            controller.enqueue(
              new TextEncoder().encode(
                '{"message":{"role":"assistant","content":" there"},"done":false}\n'
              )
            )
            controller.enqueue(
              new TextEncoder().encode(
                '{"message":{"role":"assistant","content":"!"},"done":true}\n'
              )
            )
            controller.close()
          },
        }),
        { status: 200 }
      )

      global.fetch = vi.fn().mockResolvedValue(mockResponse)

      const messages: Message[] = [{ role: 'user', content: 'Hello' }]

      const chunks: string[] = []
      for await (const chunk of provider.chat(messages)) {
        chunks.push(chunk)
      }

      expect(chunks).toEqual(['Hello', ' there', '!'])
      expect(global.fetch).toHaveBeenCalledWith(
        `${DEFAULT_OLLAMA_BASE_URL}/api/chat`,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      )
    })

    it('should use specified model', async () => {
      const mockResponse = new Response(
        new ReadableStream({
          start(controller) {
            controller.enqueue(
              new TextEncoder().encode('{"message":{"content":"Hi"},"done":true}\n')
            )
            controller.close()
          },
        }),
        { status: 200 }
      )

      global.fetch = vi.fn().mockResolvedValue(mockResponse)

      const messages: Message[] = [{ role: 'user', content: 'Test' }]

      for await (const _ of provider.chat(messages, { model: 'mistral' })) {
        // Consume stream
      }

      const fetchCall = (global.fetch as any).mock.calls[0]
      const body = JSON.parse(fetchCall[1].body)
      expect(body.model).toBe('mistral')
    })

    it('should use default model when not specified', async () => {
      const mockResponse = new Response(
        new ReadableStream({
          start(controller) {
            controller.enqueue(
              new TextEncoder().encode('{"message":{"content":"Hi"},"done":true}\n')
            )
            controller.close()
          },
        }),
        { status: 200 }
      )

      global.fetch = vi.fn().mockResolvedValue(mockResponse)

      const messages: Message[] = [{ role: 'user', content: 'Test' }]

      for await (const _ of provider.chat(messages)) {
        // Consume stream
      }

      const fetchCall = (global.fetch as any).mock.calls[0]
      const body = JSON.parse(fetchCall[1].body)
      expect(body.model).toBe(DEFAULT_OLLAMA_MODEL)
    })

    it('should pass chat options to request', async () => {
      const mockResponse = new Response(
        new ReadableStream({
          start(controller) {
            controller.enqueue(
              new TextEncoder().encode('{"message":{"content":"Hi"},"done":true}\n')
            )
            controller.close()
          },
        }),
        { status: 200 }
      )

      global.fetch = vi.fn().mockResolvedValue(mockResponse)

      const messages: Message[] = [{ role: 'user', content: 'Test' }]

      for await (const _ of provider.chat(messages, {
        temperature: 0.5,
        maxTokens: 100,
        stopSequences: ['STOP'],
      })) {
        // Consume stream
      }

      const fetchCall = (global.fetch as any).mock.calls[0]
      const body = JSON.parse(fetchCall[1].body)
      expect(body.options.temperature).toBe(0.5)
      expect(body.options.num_predict).toBe(100)
      expect(body.options.stop).toEqual(['STOP'])
    })

    it('should skip empty content chunks', async () => {
      const mockResponse = new Response(
        new ReadableStream({
          start(controller) {
            controller.enqueue(
              new TextEncoder().encode('{"message":{"content":""},"done":false}\n')
            )
            controller.enqueue(
              new TextEncoder().encode('{"message":{"content":"Hello"},"done":false}\n')
            )
            controller.enqueue(new TextEncoder().encode('{"message":{"content":""},"done":true}\n'))
            controller.close()
          },
        }),
        { status: 200 }
      )

      global.fetch = vi.fn().mockResolvedValue(mockResponse)

      const messages: Message[] = [{ role: 'user', content: 'Test' }]
      const chunks: string[] = []

      for await (const chunk of provider.chat(messages)) {
        chunks.push(chunk)
      }

      // Empty strings should be skipped (they are falsy)
      expect(chunks).toEqual(['Hello'])
    })

    it('should handle network errors', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

      const messages: Message[] = [{ role: 'user', content: 'Test' }]

      await expect(async () => {
        for await (const _ of provider.chat(messages)) {
          // Should throw before yielding
        }
      }).rejects.toThrow('Network error')
    })

    it('should handle HTTP errors', async () => {
      global.fetch = vi.fn().mockResolvedValue(new Response('Server error', { status: 500 }))

      const messages: Message[] = [{ role: 'user', content: 'Test' }]

      await expect(async () => {
        for await (const _ of provider.chat(messages)) {
          // Should throw before yielding
        }
      }).rejects.toThrow()
    })
  })

  describe('listModels()', () => {
    it('should list installed models from server', async () => {
      const mockModels = {
        models: [
          { name: 'llama3.1', size: 4661224448 },
          { name: 'mistral', size: 4109865159 },
        ],
      }

      global.fetch = vi
        .fn()
        .mockResolvedValue(new Response(JSON.stringify(mockModels), { status: 200 }))

      const models = await provider.listModels()

      expect(models).toHaveLength(2)
      expect(models[0].id).toBe('llama3.1')
      expect(models[0].isFree).toBe(true)
      expect(models[1].id).toBe('mistral')
      expect(global.fetch).toHaveBeenCalledWith(`${DEFAULT_OLLAMA_BASE_URL}/api/tags`)
    })

    it('should return default models if server is not available', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Connection refused'))

      const models = await provider.listModels()

      expect(models.length).toBeGreaterThan(0)
      expect(models[0].isFree).toBe(true)
    })

    it('should return default models if response is not ok', async () => {
      global.fetch = vi.fn().mockResolvedValue(new Response('Not found', { status: 404 }))

      const models = await provider.listModels()

      expect(models.length).toBeGreaterThan(0)
      expect(models[0].isFree).toBe(true)
    })

    it('should return default models if no models installed', async () => {
      global.fetch = vi
        .fn()
        .mockResolvedValue(new Response(JSON.stringify({ models: [] }), { status: 200 }))

      const models = await provider.listModels()

      expect(models.length).toBeGreaterThan(0)
      expect(models[0].isFree).toBe(true)
    })
  })

  describe('testConnection()', () => {
    it('should successfully test connection when server is running', async () => {
      // Mock /api/tags response
      const mockTags = {
        models: [{ name: 'llama3.1' }],
      }

      // Mock chat response
      const mockChatResponse = new Response(
        new ReadableStream({
          start(controller) {
            controller.enqueue(
              new TextEncoder().encode('{"message":{"content":"Hi"},"done":true}\n')
            )
            controller.close()
          },
        }),
        { status: 200 }
      )

      global.fetch = vi
        .fn()
        .mockResolvedValueOnce(new Response(JSON.stringify(mockTags), { status: 200 }))
        .mockResolvedValueOnce(mockChatResponse)

      const result = await provider.testConnection()

      expect(result.success).toBe(true)
      expect(result.latency).toBeGreaterThan(0)
      expect(result.error).toBeUndefined()
    })

    it('should fail when server is not responding', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Connection refused'))

      const result = await provider.testConnection()

      expect(result.success).toBe(false)
      expect(result.error).toContain('Ollama')
      expect(result.latency).toBeGreaterThanOrEqual(0)
    })

    it('should fail when no models are installed', async () => {
      global.fetch = vi
        .fn()
        .mockResolvedValue(new Response(JSON.stringify({ models: [] }), { status: 200 }))

      const result = await provider.testConnection()

      expect(result.success).toBe(false)
      expect(result.error).toContain('No models installed')
    })

    it('should fail when server returns error', async () => {
      global.fetch = vi.fn().mockResolvedValue(new Response('Server error', { status: 500 }))

      const result = await provider.testConnection()

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  describe('pullModel()', () => {
    it('should pull a model with progress updates', async () => {
      const mockPullResponse = new Response(
        new ReadableStream({
          start(controller) {
            controller.enqueue(
              new TextEncoder().encode('{"status":"downloading","completed":1000,"total":10000}\n')
            )
            controller.enqueue(
              new TextEncoder().encode('{"status":"downloading","completed":5000,"total":10000}\n')
            )
            controller.enqueue(new TextEncoder().encode('{"status":"success"}\n'))
            controller.close()
          },
        }),
        { status: 200 }
      )

      global.fetch = vi.fn().mockResolvedValue(mockPullResponse)

      const progressUpdates: Array<{ progress: number; status: string }> = []

      await provider.pullModel('llama3.1', (progress, status) => {
        progressUpdates.push({ progress, status })
      })

      expect(progressUpdates.length).toBeGreaterThan(0)
      expect(progressUpdates[0].progress).toBe(0.1) // 1000/10000
      expect(progressUpdates[1].progress).toBe(0.5) // 5000/10000
      expect(global.fetch).toHaveBeenCalledWith(
        `${DEFAULT_OLLAMA_BASE_URL}/api/pull`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ name: 'llama3.1' }),
        })
      )
    })

    it('should handle pull errors', async () => {
      global.fetch = vi.fn().mockResolvedValue(new Response('Model not found', { status: 404 }))

      await expect(provider.pullModel('invalid-model')).rejects.toThrow()
    })

    it('should work without progress callback', async () => {
      const mockPullResponse = new Response(
        new ReadableStream({
          start(controller) {
            controller.enqueue(new TextEncoder().encode('{"status":"success"}\n'))
            controller.close()
          },
        }),
        { status: 200 }
      )

      global.fetch = vi.fn().mockResolvedValue(mockPullResponse)

      await expect(provider.pullModel('llama3.1')).resolves.not.toThrow()
    })
  })

  describe('Edge Cases', () => {
    it('should handle malformed JSON in stream', async () => {
      const mockResponse = new Response(
        new ReadableStream({
          start(controller) {
            controller.enqueue(new TextEncoder().encode('invalid json\n'))
            controller.enqueue(
              new TextEncoder().encode('{"message":{"content":"Valid"},"done":false}\n')
            )
            controller.enqueue(
              new TextEncoder().encode('{"message":{"content":"!"},"done":true}\n')
            )
            controller.close()
          },
        }),
        { status: 200 }
      )

      global.fetch = vi.fn().mockResolvedValue(mockResponse)

      const messages: Message[] = [{ role: 'user', content: 'Test' }]
      const chunks: string[] = []

      for await (const chunk of provider.chat(messages)) {
        chunks.push(chunk)
      }

      // Should skip invalid JSON and continue
      expect(chunks).toEqual(['Valid', '!'])
    })

    it('should handle incomplete JSON lines in buffer', async () => {
      const mockResponse = new Response(
        new ReadableStream({
          start(controller) {
            // Send partial JSON
            controller.enqueue(new TextEncoder().encode('{"message":{"content":"Hel'))
            // Complete it in next chunk
            controller.enqueue(new TextEncoder().encode('lo"},"done":false}\n'))
            controller.enqueue(
              new TextEncoder().encode('{"message":{"content":"!"},"done":true}\n')
            )
            controller.close()
          },
        }),
        { status: 200 }
      )

      global.fetch = vi.fn().mockResolvedValue(mockResponse)

      const messages: Message[] = [{ role: 'user', content: 'Test' }]
      const chunks: string[] = []

      for await (const chunk of provider.chat(messages)) {
        chunks.push(chunk)
      }

      expect(chunks).toEqual(['Hello', '!'])
    })

    it('should handle messages without content field', async () => {
      const mockResponse = new Response(
        new ReadableStream({
          start(controller) {
            controller.enqueue(new TextEncoder().encode('{"message":{},"done":false}\n'))
            controller.enqueue(
              new TextEncoder().encode('{"message":{"content":"Hello"},"done":false}\n')
            )
            controller.enqueue(new TextEncoder().encode('{"done":true}\n'))
            controller.close()
          },
        }),
        { status: 200 }
      )

      global.fetch = vi.fn().mockResolvedValue(mockResponse)

      const messages: Message[] = [{ role: 'user', content: 'Test' }]
      const chunks: string[] = []

      for await (const chunk of provider.chat(messages)) {
        chunks.push(chunk)
      }

      // Should only yield the chunk with content
      expect(chunks).toEqual(['Hello'])
    })
  })
})
