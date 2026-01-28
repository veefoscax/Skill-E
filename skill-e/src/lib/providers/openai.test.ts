/**
 * S08: LLM Providers - OpenAI Provider Tests
 * 
 * Tests for OpenAI provider implementation.
 * 
 * Requirements: FR-8.1
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OpenAIProvider, OPENAI_MODELS, DEFAULT_OPENAI_MODEL } from './openai';
import type { Message } from './types';

describe('OpenAIProvider', () => {
  let provider: OpenAIProvider;

  beforeEach(() => {
    provider = new OpenAIProvider({ apiKey: 'test-api-key' });
    vi.clearAllMocks();
  });

  describe('Configuration', () => {
    it('should have correct provider metadata', () => {
      expect(provider.type).toBe('openai');
      expect(provider.name).toBe('OpenAI (GPT)');
      expect(provider.requiresApiKey).toBe(true);
      expect(provider.supportsStreaming).toBe(true);
    });

    it('should use default base URL', () => {
      expect((provider as any).baseUrl).toBe('https://api.openai.com/v1');
    });

    it('should allow custom base URL', () => {
      const customProvider = new OpenAIProvider({
        apiKey: 'test-key',
        baseUrl: 'https://custom.openai.com/v1',
      });
      expect((customProvider as any).baseUrl).toBe('https://custom.openai.com/v1');
    });

    it('should store API key', () => {
      expect((provider as any).apiKey).toBe('test-api-key');
    });
  });

  describe('Models', () => {
    it('should list available models', async () => {
      const models = await provider.listModels();
      
      expect(models).toEqual(OPENAI_MODELS);
      expect(models.length).toBeGreaterThan(0);
      expect(models.every(m => !m.isFree)).toBe(true); // All OpenAI models require payment
    });

    it('should include GPT-4o as default model', async () => {
      const models = await provider.listModels();
      const gpt4o = models.find(m => m.id === 'gpt-4o');
      
      expect(gpt4o).toBeDefined();
      expect(gpt4o?.name).toBe('GPT-4o');
      expect(gpt4o?.contextWindow).toBe(128000);
    });

    it('should include GPT-4o Mini', async () => {
      const models = await provider.listModels();
      const gpt4oMini = models.find(m => m.id === 'gpt-4o-mini');
      
      expect(gpt4oMini).toBeDefined();
      expect(gpt4oMini?.name).toBe('GPT-4o Mini');
    });

    it('should include GPT-3.5 Turbo', async () => {
      const models = await provider.listModels();
      const gpt35 = models.find(m => m.id === 'gpt-3.5-turbo');
      
      expect(gpt35).toBeDefined();
      expect(gpt35?.name).toBe('GPT-3.5 Turbo');
    });

    it('should have correct default model', () => {
      expect(DEFAULT_OPENAI_MODEL).toBe('gpt-4o');
      expect((provider as any).getDefaultModel()).toBe('gpt-4o');
    });
  });

  describe('Chat Completion', () => {
    it('should throw error if API key is missing', async () => {
      const noKeyProvider = new OpenAIProvider();
      const messages: Message[] = [{ role: 'user', content: 'Hello' }];

      await expect(async () => {
        for await (const chunk of noKeyProvider.chat(messages)) {
          // Should not reach here
        }
      }).rejects.toThrow();
    });

    it('should make request with correct parameters', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        body: {
          getReader: () => ({
            read: vi.fn()
              .mockResolvedValueOnce({
                done: false,
                value: new TextEncoder().encode('data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n'),
              })
              .mockResolvedValueOnce({
                done: true,
                value: undefined,
              }),
            releaseLock: vi.fn(),
          }),
        },
      });

      global.fetch = mockFetch;

      const messages: Message[] = [
        { role: 'system', content: 'You are helpful' },
        { role: 'user', content: 'Hello' },
      ];

      const chunks: string[] = [];
      for await (const chunk of provider.chat(messages, {
        model: 'gpt-4o',
        temperature: 0.5,
        maxTokens: 100,
      })) {
        chunks.push(chunk);
      }

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-api-key',
          }),
        })
      );

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(requestBody).toMatchObject({
        model: 'gpt-4o',
        messages,
        stream: true,
        temperature: 0.5,
        max_tokens: 100,
      });
    });

    it('should use default model if not specified', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        body: {
          getReader: () => ({
            read: vi.fn()
              .mockResolvedValueOnce({
                done: false,
                value: new TextEncoder().encode('data: {"choices":[{"delta":{"content":"Hi"}}]}\n\n'),
              })
              .mockResolvedValueOnce({
                done: true,
                value: undefined,
              }),
            releaseLock: vi.fn(),
          }),
        },
      });

      global.fetch = mockFetch;

      const messages: Message[] = [{ role: 'user', content: 'Hello' }];

      for await (const chunk of provider.chat(messages)) {
        // Just consume the stream
      }

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(requestBody.model).toBe(DEFAULT_OPENAI_MODEL);
    });

    it('should stream response chunks', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        body: {
          getReader: () => ({
            read: vi.fn()
              .mockResolvedValueOnce({
                done: false,
                value: new TextEncoder().encode('data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n'),
              })
              .mockResolvedValueOnce({
                done: false,
                value: new TextEncoder().encode('data: {"choices":[{"delta":{"content":" world"}}]}\n\n'),
              })
              .mockResolvedValueOnce({
                done: false,
                value: new TextEncoder().encode('data: [DONE]\n\n'),
              })
              .mockResolvedValueOnce({
                done: true,
                value: undefined,
              }),
            releaseLock: vi.fn(),
          }),
        },
      });

      global.fetch = mockFetch;

      const messages: Message[] = [{ role: 'user', content: 'Hello' }];
      const chunks: string[] = [];

      for await (const chunk of provider.chat(messages)) {
        chunks.push(chunk);
      }

      expect(chunks).toEqual(['Hello', ' world']);
    });

    it('should handle stop sequences', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        body: {
          getReader: () => ({
            read: vi.fn()
              .mockResolvedValueOnce({
                done: false,
                value: new TextEncoder().encode('data: {"choices":[{"delta":{"content":"Done"}}]}\n\n'),
              })
              .mockResolvedValueOnce({
                done: true,
                value: undefined,
              }),
            releaseLock: vi.fn(),
          }),
        },
      });

      global.fetch = mockFetch;

      const messages: Message[] = [{ role: 'user', content: 'Count to 5' }];

      for await (const chunk of provider.chat(messages, {
        stopSequences: ['5', 'five'],
      })) {
        // Just consume
      }

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(requestBody.stop).toEqual(['5', 'five']);
    });

    it('should handle API errors', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: () => Promise.resolve('Invalid API key'),
      });

      global.fetch = mockFetch;

      const messages: Message[] = [{ role: 'user', content: 'Hello' }];

      await expect(async () => {
        for await (const chunk of provider.chat(messages)) {
          // Should not reach here
        }
      }).rejects.toThrow();
    });

    it('should handle rate limit errors', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        text: () => Promise.resolve('Rate limit exceeded'),
      });

      global.fetch = mockFetch;

      const messages: Message[] = [{ role: 'user', content: 'Hello' }];

      await expect(async () => {
        for await (const chunk of provider.chat(messages)) {
          // Should not reach here
        }
      }).rejects.toThrow();
    });

    it('should handle network errors', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));

      global.fetch = mockFetch;

      const messages: Message[] = [{ role: 'user', content: 'Hello' }];

      await expect(async () => {
        for await (const chunk of provider.chat(messages)) {
          // Should not reach here
        }
      }).rejects.toThrow();
    });
  });

  describe('Connection Test', () => {
    it('should fail if API key is missing', async () => {
      const noKeyProvider = new OpenAIProvider();
      const result = await noKeyProvider.testConnection();

      expect(result.success).toBe(false);
      expect(result.error).toContain('API key is required');
    });

    it('should succeed with valid API key', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        body: {
          getReader: () => ({
            read: vi.fn()
              .mockResolvedValueOnce({
                done: false,
                value: new TextEncoder().encode('data: {"choices":[{"delta":{"content":"Hi"}}]}\n\n'),
              })
              .mockResolvedValueOnce({
                done: true,
                value: undefined,
              }),
            releaseLock: vi.fn(),
          }),
        },
      });

      global.fetch = mockFetch;

      const result = await provider.testConnection();

      expect(result.success).toBe(true);
      expect(result.latency).toBeGreaterThan(0);
    });

    it('should fail with invalid API key', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: () => Promise.resolve('Invalid API key'),
      });

      global.fetch = mockFetch;

      const result = await provider.testConnection();

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should measure latency', async () => {
      const mockFetch = vi.fn().mockImplementation(() => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              ok: true,
              body: {
                getReader: () => ({
                  read: vi.fn()
                    .mockResolvedValueOnce({
                      done: false,
                      value: new TextEncoder().encode('data: {"choices":[{"delta":{"content":"Hi"}}]}\n\n'),
                    })
                    .mockResolvedValueOnce({
                      done: true,
                      value: undefined,
                    }),
                  releaseLock: vi.fn(),
                }),
              },
            });
          }, 100);
        });
      });

      global.fetch = mockFetch;

      const result = await provider.testConnection();

      expect(result.success).toBe(true);
      expect(result.latency).toBeGreaterThanOrEqual(100);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty messages array', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        body: {
          getReader: () => ({
            read: vi.fn()
              .mockResolvedValueOnce({
                done: false,
                value: new TextEncoder().encode('data: {"choices":[{"delta":{"content":"Response"}}]}\n\n'),
              })
              .mockResolvedValueOnce({
                done: true,
                value: undefined,
              }),
            releaseLock: vi.fn(),
          }),
        },
      });

      global.fetch = mockFetch;

      const messages: Message[] = [];
      const chunks: string[] = [];

      for await (const chunk of provider.chat(messages)) {
        chunks.push(chunk);
      }

      expect(chunks.length).toBeGreaterThan(0);
    });

    it('should handle chunks without content', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        body: {
          getReader: () => ({
            read: vi.fn()
              .mockResolvedValueOnce({
                done: false,
                value: new TextEncoder().encode('data: {"choices":[{"delta":{}}]}\n\n'),
              })
              .mockResolvedValueOnce({
                done: false,
                value: new TextEncoder().encode('data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n'),
              })
              .mockResolvedValueOnce({
                done: true,
                value: undefined,
              }),
            releaseLock: vi.fn(),
          }),
        },
      });

      global.fetch = mockFetch;

      const messages: Message[] = [{ role: 'user', content: 'Hi' }];
      const chunks: string[] = [];

      for await (const chunk of provider.chat(messages)) {
        chunks.push(chunk);
      }

      expect(chunks).toEqual(['Hello']);
    });

    it('should handle malformed SSE data gracefully', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        body: {
          getReader: () => ({
            read: vi.fn()
              .mockResolvedValueOnce({
                done: false,
                value: new TextEncoder().encode('data: invalid json\n\n'),
              })
              .mockResolvedValueOnce({
                done: false,
                value: new TextEncoder().encode('data: {"choices":[{"delta":{"content":"Valid"}}]}\n\n'),
              })
              .mockResolvedValueOnce({
                done: true,
                value: undefined,
              }),
            releaseLock: vi.fn(),
          }),
        },
      });

      global.fetch = mockFetch;

      const messages: Message[] = [{ role: 'user', content: 'Hi' }];
      const chunks: string[] = [];

      for await (const chunk of provider.chat(messages)) {
        chunks.push(chunk);
      }

      // Should skip invalid JSON and continue
      expect(chunks).toEqual(['Valid']);
    });

    it('should handle very long messages', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        body: {
          getReader: () => ({
            read: vi.fn()
              .mockResolvedValueOnce({
                done: false,
                value: new TextEncoder().encode('data: {"choices":[{"delta":{"content":"Response"}}]}\n\n'),
              })
              .mockResolvedValueOnce({
                done: true,
                value: undefined,
              }),
            releaseLock: vi.fn(),
          }),
        },
      });

      global.fetch = mockFetch;

      const longContent = 'A'.repeat(10000);
      const messages: Message[] = [{ role: 'user', content: longContent }];

      const chunks: string[] = [];
      for await (const chunk of provider.chat(messages)) {
        chunks.push(chunk);
      }

      expect(chunks.length).toBeGreaterThan(0);
      
      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(requestBody.messages[0].content).toBe(longContent);
    });
  });
});
