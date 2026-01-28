/**
 * S08: LLM Providers - Google Provider Tests
 * 
 * Unit tests for the Google (Gemini) provider.
 * 
 * Requirements: FR-8.1
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GoogleProvider, GOOGLE_MODELS, DEFAULT_GOOGLE_MODEL } from './google';
import type { Message } from './types';

describe('GoogleProvider', () => {
  let provider: GoogleProvider;
  const mockApiKey = 'test-google-api-key';

  beforeEach(() => {
    provider = new GoogleProvider({ apiKey: mockApiKey });
    vi.clearAllMocks();
  });

  describe('Configuration', () => {
    it('should have correct provider metadata', () => {
      expect(provider.type).toBe('google');
      expect(provider.name).toBe('Google (Gemini)');
      expect(provider.requiresApiKey).toBe(true);
      expect(provider.supportsStreaming).toBe(true);
    });

    it('should use default base URL', () => {
      expect(provider['baseUrl']).toBe('https://generativelanguage.googleapis.com/v1beta');
    });

    it('should allow custom base URL', () => {
      const customProvider = new GoogleProvider({
        apiKey: mockApiKey,
        baseUrl: 'https://custom.google.api',
      });
      expect(customProvider['baseUrl']).toBe('https://custom.google.api');
    });

    it('should store API key', () => {
      expect(provider['apiKey']).toBe(mockApiKey);
    });
  });

  describe('Models', () => {
    it('should list available models', async () => {
      const models = await provider.listModels();
      
      expect(models).toEqual(GOOGLE_MODELS);
      expect(models.length).toBeGreaterThan(0);
      
      // Check first model (Gemini 1.5 Pro)
      expect(models[0].id).toBe('gemini-1.5-pro-latest');
      expect(models[0].name).toBe('Gemini 1.5 Pro');
      expect(models[0].isFree).toBe(false);
      expect(models[0].contextWindow).toBe(2000000);
    });

    it('should have correct default model', () => {
      expect(DEFAULT_GOOGLE_MODEL).toBe('gemini-1.5-pro-latest');
      expect(provider['getDefaultModel']()).toBe(DEFAULT_GOOGLE_MODEL);
    });

    it('should include Gemini 1.5 Flash', async () => {
      const models = await provider.listModels();
      const flash = models.find(m => m.id === 'gemini-1.5-flash-latest');
      
      expect(flash).toBeDefined();
      expect(flash?.name).toBe('Gemini 1.5 Flash');
      expect(flash?.contextWindow).toBe(1000000);
    });
  });

  describe('Message Format Conversion', () => {
    it('should convert standard messages to Google format', () => {
      const messages: Message[] = [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' },
        { role: 'user', content: 'How are you?' },
      ];

      const result = provider['convertMessagesToGoogleFormat'](messages);

      // System instruction should be extracted
      expect(result.systemInstruction).toBe('You are a helpful assistant.');

      // Contents should have user and model roles
      expect(result.contents).toHaveLength(3);
      expect(result.contents[0]).toEqual({
        role: 'user',
        parts: [{ text: 'Hello' }],
      });
      expect(result.contents[1]).toEqual({
        role: 'model',
        parts: [{ text: 'Hi there!' }],
      });
      expect(result.contents[2]).toEqual({
        role: 'user',
        parts: [{ text: 'How are you?' }],
      });
    });

    it('should handle messages without system instruction', () => {
      const messages: Message[] = [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi!' },
      ];

      const result = provider['convertMessagesToGoogleFormat'](messages);

      expect(result.systemInstruction).toBeUndefined();
      expect(result.contents).toHaveLength(2);
    });

    it('should convert assistant role to model role', () => {
      const messages: Message[] = [
        { role: 'assistant', content: 'I am the assistant' },
      ];

      const result = provider['convertMessagesToGoogleFormat'](messages);

      expect(result.contents[0].role).toBe('model');
    });
  });

  describe('Chat Completion', () => {
    it('should throw error if API key is missing', async () => {
      const noKeyProvider = new GoogleProvider();
      const messages: Message[] = [{ role: 'user', content: 'Hello' }];

      await expect(async () => {
        for await (const chunk of noKeyProvider.chat(messages)) {
          // Should not reach here
        }
      }).rejects.toThrow('API key is required');
    });

    it('should build correct request URL with API key', async () => {
      const messages: Message[] = [{ role: 'user', content: 'Test' }];

      // Mock fetch
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        body: {
          getReader: () => ({
            read: vi.fn()
              .mockResolvedValueOnce({
                done: false,
                value: new TextEncoder().encode('{"candidates":[{"content":{"parts":[{"text":"Response"}]}}]}\n'),
              })
              .mockResolvedValueOnce({ done: true }),
            releaseLock: vi.fn(),
          }),
        },
      });

      global.fetch = mockFetch;

      // Consume the stream
      const chunks: string[] = [];
      for await (const chunk of provider.chat(messages)) {
        chunks.push(chunk);
      }

      // Check URL includes API key as query parameter
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`key=${mockApiKey}`),
        expect.any(Object)
      );

      // Check URL uses streamGenerateContent endpoint
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(':streamGenerateContent'),
        expect.any(Object)
      );
    });

    it('should use default model if not specified', async () => {
      const messages: Message[] = [{ role: 'user', content: 'Test' }];

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        body: {
          getReader: () => ({
            read: vi.fn().mockResolvedValueOnce({ done: true }),
            releaseLock: vi.fn(),
          }),
        },
      });

      global.fetch = mockFetch;

      try {
        for await (const chunk of provider.chat(messages)) {
          // Consume stream
        }
      } catch {
        // Ignore errors
      }

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(DEFAULT_GOOGLE_MODEL),
        expect.any(Object)
      );
    });

    it('should use custom model if specified', async () => {
      const messages: Message[] = [{ role: 'user', content: 'Test' }];
      const customModel = 'gemini-1.5-flash-latest';

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        body: {
          getReader: () => ({
            read: vi.fn().mockResolvedValueOnce({ done: true }),
            releaseLock: vi.fn(),
          }),
        },
      });

      global.fetch = mockFetch;

      try {
        for await (const chunk of provider.chat(messages, { model: customModel })) {
          // Consume stream
        }
      } catch {
        // Ignore errors
      }

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(customModel),
        expect.any(Object)
      );
    });

    it('should include generation config in request body', async () => {
      const messages: Message[] = [{ role: 'user', content: 'Test' }];

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        body: {
          getReader: () => ({
            read: vi.fn().mockResolvedValueOnce({ done: true }),
            releaseLock: vi.fn(),
          }),
        },
      });

      global.fetch = mockFetch;

      try {
        for await (const chunk of provider.chat(messages, {
          temperature: 0.5,
          maxTokens: 1000,
        })) {
          // Consume stream
        }
      } catch {
        // Ignore errors
      }

      const callArgs = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);

      expect(requestBody.generationConfig).toEqual({
        temperature: 0.5,
        maxOutputTokens: 1000,
      });
    });

    it('should include system instruction if present', async () => {
      const messages: Message[] = [
        { role: 'system', content: 'You are helpful.' },
        { role: 'user', content: 'Hello' },
      ];

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        body: {
          getReader: () => ({
            read: vi.fn().mockResolvedValueOnce({ done: true }),
            releaseLock: vi.fn(),
          }),
        },
      });

      global.fetch = mockFetch;

      try {
        for await (const chunk of provider.chat(messages)) {
          // Consume stream
        }
      } catch {
        // Ignore errors
      }

      const callArgs = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);

      expect(requestBody.systemInstruction).toEqual({
        parts: [{ text: 'You are helpful.' }],
      });
    });
  });

  describe('Streaming', () => {
    it('should parse Google streaming format correctly', async () => {
      const messages: Message[] = [{ role: 'user', content: 'Test' }];

      // Mock streaming response
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        body: {
          getReader: () => ({
            read: vi.fn()
              .mockResolvedValueOnce({
                done: false,
                value: new TextEncoder().encode('{"candidates":[{"content":{"parts":[{"text":"Hello"}]}}]}\n'),
              })
              .mockResolvedValueOnce({
                done: false,
                value: new TextEncoder().encode('{"candidates":[{"content":{"parts":[{"text":" world"}]}}]}\n'),
              })
              .mockResolvedValueOnce({
                done: false,
                value: new TextEncoder().encode('{"candidates":[{"content":{"parts":[{"text":"!"}]}}]}\n'),
              })
              .mockResolvedValueOnce({ done: true }),
            releaseLock: vi.fn(),
          }),
        },
      });

      global.fetch = mockFetch;

      const chunks: string[] = [];
      for await (const chunk of provider.chat(messages)) {
        chunks.push(chunk);
      }

      expect(chunks).toEqual(['Hello', ' world', '!']);
    });

    it('should handle SSE format with "data: " prefix', async () => {
      const messages: Message[] = [{ role: 'user', content: 'Test' }];

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        body: {
          getReader: () => ({
            read: vi.fn()
              .mockResolvedValueOnce({
                done: false,
                value: new TextEncoder().encode('data: {"candidates":[{"content":{"parts":[{"text":"Test"}]}}]}\n'),
              })
              .mockResolvedValueOnce({ done: true }),
            releaseLock: vi.fn(),
          }),
        },
      });

      global.fetch = mockFetch;

      const chunks: string[] = [];
      for await (const chunk of provider.chat(messages)) {
        chunks.push(chunk);
      }

      expect(chunks).toEqual(['Test']);
    });

    it('should skip empty lines and [DONE] markers', async () => {
      const messages: Message[] = [{ role: 'user', content: 'Test' }];

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        body: {
          getReader: () => ({
            read: vi.fn()
              .mockResolvedValueOnce({
                done: false,
                value: new TextEncoder().encode('\n{"candidates":[{"content":{"parts":[{"text":"Test"}]}}]}\n\n[DONE]\n'),
              })
              .mockResolvedValueOnce({ done: true }),
            releaseLock: vi.fn(),
          }),
        },
      });

      global.fetch = mockFetch;

      const chunks: string[] = [];
      for await (const chunk of provider.chat(messages)) {
        chunks.push(chunk);
      }

      expect(chunks).toEqual(['Test']);
    });

    it('should handle errors in stream', async () => {
      const messages: Message[] = [{ role: 'user', content: 'Test' }];

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        body: {
          getReader: () => ({
            read: vi.fn()
              .mockResolvedValueOnce({
                done: false,
                value: new TextEncoder().encode('{"error":{"message":"API error"}}\n'),
              })
              .mockResolvedValueOnce({ done: true }),
            releaseLock: vi.fn(),
          }),
        },
      });

      global.fetch = mockFetch;

      await expect(async () => {
        for await (const chunk of provider.chat(messages)) {
          // Should throw before yielding
        }
      }).rejects.toThrow('API error');
    });

    it('should handle non-streaming mode', async () => {
      const messages: Message[] = [{ role: 'user', content: 'Test' }];

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [{ text: 'Complete response' }],
              },
            },
          ],
        }),
      });

      global.fetch = mockFetch;

      const chunks: string[] = [];
      for await (const chunk of provider.chat(messages, { stream: false })) {
        chunks.push(chunk);
      }

      expect(chunks).toEqual(['Complete response']);

      // Should use generateContent endpoint (not streamGenerateContent)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(':generateContent'),
        expect.any(Object)
      );
      expect(mockFetch).not.toHaveBeenCalledWith(
        expect.stringContaining(':streamGenerateContent'),
        expect.any(Object)
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle 401 unauthorized error', async () => {
      const messages: Message[] = [{ role: 'user', content: 'Test' }];

      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: { message: 'Invalid API key' } }),
      });

      global.fetch = mockFetch;

      await expect(async () => {
        for await (const chunk of provider.chat(messages)) {
          // Should throw
        }
      }).rejects.toThrow('Invalid API key');
    });

    it('should handle 429 rate limit error', async () => {
      const messages: Message[] = [{ role: 'user', content: 'Test' }];

      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        json: async () => ({ error: { message: 'Rate limit exceeded' } }),
      });

      global.fetch = mockFetch;

      await expect(async () => {
        for await (const chunk of provider.chat(messages)) {
          // Should throw
        }
      }).rejects.toThrow('Rate limit exceeded');
    });

    it('should handle network errors', async () => {
      const messages: Message[] = [{ role: 'user', content: 'Test' }];

      const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));

      global.fetch = mockFetch;

      await expect(async () => {
        for await (const chunk of provider.chat(messages)) {
          // Should throw
        }
      }).rejects.toThrow('Network error');
    });
  });

  describe('Connection Test', () => {
    it('should fail if API key is missing', async () => {
      const noKeyProvider = new GoogleProvider();
      const result = await noKeyProvider.testConnection();

      expect(result.success).toBe(false);
      expect(result.error).toContain('API key is required');
    });

    it('should succeed with valid API key and response', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        body: {
          getReader: () => ({
            read: vi.fn()
              .mockResolvedValueOnce({
                done: false,
                value: new TextEncoder().encode('{"candidates":[{"content":{"parts":[{"text":"Hi"}]}}]}\n'),
              })
              .mockResolvedValueOnce({ done: true }),
            releaseLock: vi.fn(),
          }),
        },
      });

      global.fetch = mockFetch;

      const result = await provider.testConnection();

      expect(result.success).toBe(true);
      expect(result.latency).toBeGreaterThanOrEqual(0);
    });

    it('should fail if no response received', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        body: {
          getReader: () => ({
            read: vi.fn().mockResolvedValueOnce({ done: true }),
            releaseLock: vi.fn(),
          }),
        },
      });

      global.fetch = mockFetch;

      const result = await provider.testConnection();

      expect(result.success).toBe(false);
      expect(result.error).toContain('No response received');
    });

    it('should handle connection errors', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('Connection failed'));

      global.fetch = mockFetch;

      const result = await provider.testConnection();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Connection failed');
      expect(result.latency).toBeGreaterThanOrEqual(0);
    });
  });
});
