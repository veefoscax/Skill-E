/**
 * S08: LLM Providers - Anthropic Provider Tests
 * 
 * Tests for the Anthropic (Claude) provider implementation.
 * 
 * Requirements: FR-8.1
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AnthropicProvider, ANTHROPIC_MODELS, DEFAULT_ANTHROPIC_MODEL } from './anthropic';
import type { Message } from './types';

describe('AnthropicProvider', () => {
  let provider: AnthropicProvider;

  beforeEach(() => {
    provider = new AnthropicProvider({ apiKey: 'test-api-key' });
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with correct properties', () => {
      expect(provider.type).toBe('anthropic');
      expect(provider.name).toBe('Anthropic (Claude)');
      expect(provider.requiresApiKey).toBe(true);
      expect(provider.supportsStreaming).toBe(true);
    });

    it('should accept custom base URL', () => {
      const customProvider = new AnthropicProvider({
        apiKey: 'test-key',
        baseUrl: 'https://custom.api.com',
      });
      expect(customProvider).toBeDefined();
    });
  });

  describe('listModels', () => {
    it('should return list of Claude models', async () => {
      const models = await provider.listModels();
      
      expect(models).toEqual(ANTHROPIC_MODELS);
      expect(models.length).toBeGreaterThan(0);
      expect(models[0].id).toBe(DEFAULT_ANTHROPIC_MODEL);
    });

    it('should include Claude 3.5 Sonnet as default', async () => {
      const models = await provider.listModels();
      const defaultModel = models.find(m => m.id === DEFAULT_ANTHROPIC_MODEL);
      
      expect(defaultModel).toBeDefined();
      expect(defaultModel?.name).toContain('Claude 3.5 Sonnet');
      expect(defaultModel?.isFree).toBe(false);
    });

    it('should include context window information', async () => {
      const models = await provider.listModels();
      
      models.forEach(model => {
        expect(model.contextWindow).toBeGreaterThan(0);
        expect(model.description).toBeDefined();
      });
    });
  });

  describe('chat - streaming', () => {
    it('should stream response chunks', async () => {
      const mockStreamData = [
        'data: {"type":"message_start","message":{"id":"msg_123","type":"message","role":"assistant"}}\n',
        'data: {"type":"content_block_start","index":0,"content_block":{"type":"text","text":""}}\n',
        'data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"Hello"}}\n',
        'data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":" world"}}\n',
        'data: {"type":"content_block_stop","index":0}\n',
        'data: {"type":"message_stop"}\n',
      ].join('');

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: {
          getReader: () => ({
            read: vi.fn()
              .mockResolvedValueOnce({
                done: false,
                value: new TextEncoder().encode(mockStreamData),
              })
              .mockResolvedValueOnce({
                done: true,
                value: undefined,
              }),
            releaseLock: vi.fn(),
          }),
        },
      });

      const messages: Message[] = [
        { role: 'user', content: 'Hi' },
      ];

      const chunks: string[] = [];
      for await (const chunk of provider.chat(messages)) {
        chunks.push(chunk);
      }

      expect(chunks).toEqual(['Hello', ' world']);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.anthropic.com/v1/messages',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'x-api-key': 'test-api-key',
            'anthropic-version': '2023-06-01',
          }),
        })
      );
    });

    it('should handle system messages correctly', async () => {
      const mockStreamData = 'data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"Response"}}\n';

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: {
          getReader: () => ({
            read: vi.fn()
              .mockResolvedValueOnce({
                done: false,
                value: new TextEncoder().encode(mockStreamData),
              })
              .mockResolvedValueOnce({
                done: true,
                value: undefined,
              }),
            releaseLock: vi.fn(),
          }),
        },
      });

      const messages: Message[] = [
        { role: 'system', content: 'You are a helpful assistant' },
        { role: 'user', content: 'Hi' },
      ];

      const chunks: string[] = [];
      for await (const chunk of provider.chat(messages)) {
        chunks.push(chunk);
      }

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.anthropic.com/v1/messages',
        expect.objectContaining({
          body: expect.stringContaining('"system":"You are a helpful assistant"'),
        })
      );
    });

    it('should use default model if not specified', async () => {
      const mockStreamData = 'data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"Hi"}}\n';

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: {
          getReader: () => ({
            read: vi.fn()
              .mockResolvedValueOnce({
                done: false,
                value: new TextEncoder().encode(mockStreamData),
              })
              .mockResolvedValueOnce({
                done: true,
                value: undefined,
              }),
            releaseLock: vi.fn(),
          }),
        },
      });

      const messages: Message[] = [{ role: 'user', content: 'Hi' }];
      
      for await (const _ of provider.chat(messages)) {
        // Just consume the stream
      }

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.anthropic.com/v1/messages',
        expect.objectContaining({
          body: expect.stringContaining(`"model":"${DEFAULT_ANTHROPIC_MODEL}"`),
        })
      );
    });

    it('should respect custom options', async () => {
      const mockStreamData = 'data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"Hi"}}\n';

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: {
          getReader: () => ({
            read: vi.fn()
              .mockResolvedValueOnce({
                done: false,
                value: new TextEncoder().encode(mockStreamData),
              })
              .mockResolvedValueOnce({
                done: true,
                value: undefined,
              }),
            releaseLock: vi.fn(),
          }),
        },
      });

      const messages: Message[] = [{ role: 'user', content: 'Hi' }];
      
      for await (const _ of provider.chat(messages, {
        model: 'claude-3-opus-20240229',
        temperature: 0.5,
        maxTokens: 1000,
        stopSequences: ['STOP'],
      })) {
        // Just consume the stream
      }

      const fetchCall = (global.fetch as any).mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);

      expect(body.model).toBe('claude-3-opus-20240229');
      expect(body.temperature).toBe(0.5);
      expect(body.max_tokens).toBe(1000);
      expect(body.stop_sequences).toEqual(['STOP']);
    });

    it('should handle error events in stream', async () => {
      const mockStreamData = 'data: {"type":"error","error":{"type":"invalid_request_error","message":"Invalid API key"}}\n';

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: {
          getReader: () => ({
            read: vi.fn()
              .mockResolvedValueOnce({
                done: false,
                value: new TextEncoder().encode(mockStreamData),
              })
              .mockResolvedValueOnce({
                done: true,
                value: undefined,
              }),
            releaseLock: vi.fn(),
          }),
        },
      });

      const messages: Message[] = [{ role: 'user', content: 'Hi' }];

      await expect(async () => {
        for await (const _ of provider.chat(messages)) {
          // Should throw before yielding
        }
      }).rejects.toThrow('Invalid API key');
    });

    it('should handle [DONE] signal', async () => {
      const mockStreamData = [
        'data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"Hello"}}\n',
        'data: [DONE]\n',
      ].join('');

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: {
          getReader: () => ({
            read: vi.fn()
              .mockResolvedValueOnce({
                done: false,
                value: new TextEncoder().encode(mockStreamData),
              })
              .mockResolvedValueOnce({
                done: true,
                value: undefined,
              }),
            releaseLock: vi.fn(),
          }),
        },
      });

      const messages: Message[] = [{ role: 'user', content: 'Hi' }];
      const chunks: string[] = [];
      
      for await (const chunk of provider.chat(messages)) {
        chunks.push(chunk);
      }

      expect(chunks).toEqual(['Hello']);
    });
  });

  describe('chat - errors', () => {
    it('should throw error if API key is missing', async () => {
      const providerNoKey = new AnthropicProvider();
      const messages: Message[] = [{ role: 'user', content: 'Hi' }];

      await expect(async () => {
        for await (const _ of providerNoKey.chat(messages)) {
          // Should throw
        }
      }).rejects.toThrow('API key is required');
    });

    it('should handle HTTP errors', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => 'Invalid API key',
      });

      const messages: Message[] = [{ role: 'user', content: 'Hi' }];

      await expect(async () => {
        for await (const _ of provider.chat(messages)) {
          // Should throw
        }
      }).rejects.toThrow();
    });

    it('should handle network errors', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const messages: Message[] = [{ role: 'user', content: 'Hi' }];

      await expect(async () => {
        for await (const _ of provider.chat(messages)) {
          // Should throw
        }
      }).rejects.toThrow('Network error');
    });

    it('should handle missing response body', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: null,
      });

      const messages: Message[] = [{ role: 'user', content: 'Hi' }];

      await expect(async () => {
        for await (const _ of provider.chat(messages)) {
          // Should throw
        }
      }).rejects.toThrow('No response body');
    });
  });

  describe('testConnection', () => {
    it('should return success for valid connection', async () => {
      const mockStreamData = 'data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"Hi"}}\n';

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: {
          getReader: () => ({
            read: vi.fn()
              .mockResolvedValueOnce({
                done: false,
                value: new TextEncoder().encode(mockStreamData),
              })
              .mockResolvedValueOnce({
                done: true,
                value: undefined,
              }),
            releaseLock: vi.fn(),
          }),
        },
      });

      const result = await provider.testConnection();

      expect(result.success).toBe(true);
      expect(result.latency).toBeGreaterThanOrEqual(0);
      expect(result.error).toBeUndefined();
    });

    it('should return error if API key is missing', async () => {
      const providerNoKey = new AnthropicProvider();
      const result = await providerNoKey.testConnection();

      expect(result.success).toBe(false);
      expect(result.error).toContain('API key is required');
    });

    it('should return error for failed connection', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Connection failed'));

      const result = await provider.testConnection();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Connection failed');
      expect(result.latency).toBeGreaterThanOrEqual(0);
    });

    it('should return error if no response received', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: {
          getReader: () => ({
            read: vi.fn()
              .mockResolvedValueOnce({
                done: true,
                value: undefined,
              }),
            releaseLock: vi.fn(),
          }),
        },
      });

      const result = await provider.testConnection();

      expect(result.success).toBe(false);
      expect(result.error).toContain('No response received');
    });
  });

  describe('edge cases', () => {
    it('should handle multiple content blocks', async () => {
      const mockStreamData = [
        'data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"First"}}\n',
        'data: {"type":"content_block_delta","index":1,"delta":{"type":"text_delta","text":"Second"}}\n',
      ].join('');

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: {
          getReader: () => ({
            read: vi.fn()
              .mockResolvedValueOnce({
                done: false,
                value: new TextEncoder().encode(mockStreamData),
              })
              .mockResolvedValueOnce({
                done: true,
                value: undefined,
              }),
            releaseLock: vi.fn(),
          }),
        },
      });

      const messages: Message[] = [{ role: 'user', content: 'Hi' }];
      const chunks: string[] = [];
      
      for await (const chunk of provider.chat(messages)) {
        chunks.push(chunk);
      }

      expect(chunks).toEqual(['First', 'Second']);
    });

    it('should skip non-text delta events', async () => {
      const mockStreamData = [
        'data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"Hello"}}\n',
        'data: {"type":"message_delta","delta":{"stop_reason":"end_turn"}}\n',
        'data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":" world"}}\n',
      ].join('');

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: {
          getReader: () => ({
            read: vi.fn()
              .mockResolvedValueOnce({
                done: false,
                value: new TextEncoder().encode(mockStreamData),
              })
              .mockResolvedValueOnce({
                done: true,
                value: undefined,
              }),
            releaseLock: vi.fn(),
          }),
        },
      });

      const messages: Message[] = [{ role: 'user', content: 'Hi' }];
      const chunks: string[] = [];
      
      for await (const chunk of provider.chat(messages)) {
        chunks.push(chunk);
      }

      expect(chunks).toEqual(['Hello', ' world']);
    });

    it('should handle incomplete JSON lines gracefully', async () => {
      const mockStreamData = [
        'data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"Hello"}}\n',
        'data: {"type":"invalid_json\n', // Incomplete JSON
        'data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":" world"}}\n',
      ].join('');

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: {
          getReader: () => ({
            read: vi.fn()
              .mockResolvedValueOnce({
                done: false,
                value: new TextEncoder().encode(mockStreamData),
              })
              .mockResolvedValueOnce({
                done: true,
                value: undefined,
              }),
            releaseLock: vi.fn(),
          }),
        },
      });

      const messages: Message[] = [{ role: 'user', content: 'Hi' }];
      const chunks: string[] = [];
      
      for await (const chunk of provider.chat(messages)) {
        chunks.push(chunk);
      }

      // Should skip invalid JSON and continue
      expect(chunks).toEqual(['Hello', ' world']);
    });

    it('should handle empty messages array', async () => {
      const mockStreamData = 'data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"Response"}}\n';

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: {
          getReader: () => ({
            read: vi.fn()
              .mockResolvedValueOnce({
                done: false,
                value: new TextEncoder().encode(mockStreamData),
              })
              .mockResolvedValueOnce({
                done: true,
                value: undefined,
              }),
            releaseLock: vi.fn(),
          }),
        },
      });

      const messages: Message[] = [];
      const chunks: string[] = [];
      
      for await (const chunk of provider.chat(messages)) {
        chunks.push(chunk);
      }

      expect(chunks.length).toBeGreaterThan(0);
    });
  });
});
