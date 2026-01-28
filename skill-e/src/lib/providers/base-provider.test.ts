/**
 * S08: LLM Providers - Base Provider Tests
 * 
 * Tests for the base provider functionality including:
 * - Error handling
 * - Streaming helpers
 * - Connection testing
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BaseProvider } from './base-provider';
import type { Message, ChatOptions, Model, ProviderType } from './types';
import { ProviderError } from './types';

/**
 * Mock provider for testing base functionality
 */
class MockProvider extends BaseProvider {
  type: ProviderType = 'openai';
  name = 'Mock Provider';
  requiresApiKey = true;
  supportsStreaming = true;

  async *chat(messages: Message[], options?: ChatOptions): AsyncIterable<string> {
    yield 'Hello';
    yield ' ';
    yield 'World';
  }

  async listModels(): Promise<Model[]> {
    return [
      {
        id: 'mock-model',
        name: 'Mock Model',
        isFree: false,
        contextWindow: 4096,
      },
    ];
  }
}

/**
 * Mock provider that throws errors
 */
class ErrorProvider extends BaseProvider {
  type: ProviderType = 'openai';
  name = 'Error Provider';
  requiresApiKey = true;
  supportsStreaming = true;

  async *chat(messages: Message[], options?: ChatOptions): AsyncIterable<string> {
    throw new Error('Chat failed');
  }

  async listModels(): Promise<Model[]> {
    throw new Error('List models failed');
  }
}

describe('BaseProvider', () => {
  describe('Constructor', () => {
    it('should initialize with config', () => {
      const provider = new MockProvider({
        apiKey: 'test-key',
        baseUrl: 'https://test.com',
      });

      expect(provider.type).toBe('openai');
      expect(provider.name).toBe('Mock Provider');
    });

    it('should initialize without config', () => {
      const provider = new MockProvider();
      expect(provider.type).toBe('openai');
    });
  });

  describe('testConnection', () => {
    it('should succeed for valid provider', async () => {
      const provider = new MockProvider({ apiKey: 'test-key' });
      const result = await provider.testConnection();

      expect(result.success).toBe(true);
      expect(result.latency).toBeGreaterThanOrEqual(0);
      expect(result.error).toBeUndefined();
    });

    it('should fail if API key required but not provided', async () => {
      const provider = new MockProvider();
      const result = await provider.testConnection();

      expect(result.success).toBe(false);
      expect(result.error).toContain('API key is required');
    });

    it('should fail if chat throws error', async () => {
      const provider = new ErrorProvider({ apiKey: 'test-key' });
      const result = await provider.testConnection();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Chat failed');
      expect(result.latency).toBeGreaterThanOrEqual(0);
    });

    it('should succeed for provider that does not require API key', async () => {
      class FreeProvider extends MockProvider {
        requiresApiKey = false;
      }

      const provider = new FreeProvider();
      const result = await provider.testConnection();

      expect(result.success).toBe(true);
    });
  });

  describe('createError', () => {
    it('should create ProviderError with correct properties', () => {
      const provider = new MockProvider();
      const error = provider['createError']('Test error', 'INVALID_API_KEY');

      expect(error).toBeInstanceOf(ProviderError);
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('INVALID_API_KEY');
      expect(error.provider).toBe('openai');
    });
  });

  describe('validateConfig', () => {
    it('should not throw if API key provided when required', () => {
      const provider = new MockProvider({ apiKey: 'test-key' });
      expect(() => provider['validateConfig']()).not.toThrow();
    });

    it('should throw if API key required but not provided', () => {
      const provider = new MockProvider();
      expect(() => provider['validateConfig']()).toThrow(ProviderError);
      expect(() => provider['validateConfig']()).toThrow('API key is required');
    });

    it('should not throw if API key not required', () => {
      class FreeProvider extends MockProvider {
        requiresApiKey = false;
      }

      const provider = new FreeProvider();
      expect(() => provider['validateConfig']()).not.toThrow();
    });
  });

  describe('buildHeaders', () => {
    it('should include Authorization header when API key provided', () => {
      const provider = new MockProvider({ apiKey: 'test-key' });
      const headers = provider['buildHeaders']();

      expect(headers['Content-Type']).toBe('application/json');
      expect(headers['Authorization']).toBe('Bearer test-key');
    });

    it('should not include Authorization header when no API key', () => {
      const provider = new MockProvider();
      const headers = provider['buildHeaders']();

      expect(headers['Content-Type']).toBe('application/json');
      expect(headers['Authorization']).toBeUndefined();
    });

    it('should merge additional headers', () => {
      const provider = new MockProvider({ apiKey: 'test-key' });
      const headers = provider['buildHeaders']({
        'X-Custom': 'value',
      });

      expect(headers['Content-Type']).toBe('application/json');
      expect(headers['Authorization']).toBe('Bearer test-key');
      expect(headers['X-Custom']).toBe('value');
    });
  });

  describe('makeRequest', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should make successful request', async () => {
      const provider = new MockProvider();
      
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
      });

      const response = await provider['makeRequest']('https://test.com', {});
      expect(response.ok).toBe(true);
    });

    it('should throw INVALID_API_KEY for 401', async () => {
      const provider = new MockProvider();
      
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized',
      });

      await expect(
        provider['makeRequest']('https://test.com', {})
      ).rejects.toThrow(ProviderError);

      try {
        await provider['makeRequest']('https://test.com', {});
      } catch (error) {
        expect((error as ProviderError).code).toBe('INVALID_API_KEY');
      }
    });

    it('should throw RATE_LIMIT for 429', async () => {
      const provider = new MockProvider();
      
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        text: async () => 'Rate limit exceeded',
      });

      try {
        await provider['makeRequest']('https://test.com', {});
      } catch (error) {
        expect((error as ProviderError).code).toBe('RATE_LIMIT');
      }
    });

    it('should throw MODEL_NOT_FOUND for 404', async () => {
      const provider = new MockProvider();
      
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        text: async () => 'Not found',
      });

      try {
        await provider['makeRequest']('https://test.com', {});
      } catch (error) {
        expect((error as ProviderError).code).toBe('MODEL_NOT_FOUND');
      }
    });

    it('should throw NETWORK_ERROR for network failure', async () => {
      const provider = new MockProvider();
      
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      try {
        await provider['makeRequest']('https://test.com', {});
      } catch (error) {
        expect((error as ProviderError).code).toBe('NETWORK_ERROR');
      }
    });
  });

  describe('parseSSEStream', () => {
    it('should parse SSE stream correctly', async () => {
      const provider = new MockProvider();
      
      // Mock SSE response
      const sseData = `data: {"content":"Hello"}\n\ndata: {"content":" World"}\n\ndata: [DONE]\n\n`;
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(sseData));
          controller.close();
        },
      });

      const response = { body: stream } as Response;
      const extractContent = (data: any) => data.content;

      const chunks: string[] = [];
      for await (const chunk of provider['parseSSEStream'](response, extractContent)) {
        chunks.push(chunk);
      }

      expect(chunks).toEqual(['Hello', ' World']);
    });

    it('should skip empty lines and comments', async () => {
      const provider = new MockProvider();
      
      const sseData = `:comment\n\ndata: {"content":"Hello"}\n\n\n\ndata: [DONE]\n\n`;
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(sseData));
          controller.close();
        },
      });

      const response = { body: stream } as Response;
      const extractContent = (data: any) => data.content;

      const chunks: string[] = [];
      for await (const chunk of provider['parseSSEStream'](response, extractContent)) {
        chunks.push(chunk);
      }

      expect(chunks).toEqual(['Hello']);
    });

    it('should throw error if no response body', async () => {
      const provider = new MockProvider();
      const response = { body: null } as Response;
      const extractContent = (data: any) => data.content;

      await expect(async () => {
        for await (const chunk of provider['parseSSEStream'](response, extractContent)) {
          // Should not reach here
        }
      }).rejects.toThrow('No response body');
    });
  });

  describe('validateModel', () => {
    it('should return true for valid model', async () => {
      const provider = new MockProvider();
      const isValid = await provider['validateModel']('mock-model');
      expect(isValid).toBe(true);
    });

    it('should return false for invalid model', async () => {
      const provider = new MockProvider();
      const isValid = await provider['validateModel']('invalid-model');
      expect(isValid).toBe(false);
    });

    it('should return true if listModels fails', async () => {
      const provider = new ErrorProvider();
      const isValid = await provider['validateModel']('any-model');
      expect(isValid).toBe(true);
    });
  });

  describe('formatMessages', () => {
    it('should return messages unchanged by default', () => {
      const provider = new MockProvider();
      const messages: Message[] = [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi' },
      ];

      const formatted = provider['formatMessages'](messages);
      expect(formatted).toEqual(messages);
    });
  });

  describe('getDefaultModel', () => {
    it('should return default model', () => {
      const provider = new MockProvider();
      expect(provider['getDefaultModel']()).toBe('default');
    });
  });
});
