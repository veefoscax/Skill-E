/**
 * S08: LLM Providers - Anthropic Provider
 * 
 * Anthropic (Claude) provider with streaming support.
 * Supports Claude 3.5 Sonnet and other Claude models.
 * 
 * Requirements: FR-8.1
 */

import { BaseProvider } from './base-provider';
import type { Message, ChatOptions, Model, ProviderType } from './types';

/**
 * Available Claude models
 */
export const ANTHROPIC_MODELS: Model[] = [
  {
    id: 'claude-3-5-sonnet-20241022',
    name: 'Claude 3.5 Sonnet',
    isFree: false,
    contextWindow: 200000,
    description: 'Most intelligent model, best for complex tasks',
  },
  {
    id: 'claude-3-5-haiku-20241022',
    name: 'Claude 3.5 Haiku',
    isFree: false,
    contextWindow: 200000,
    description: 'Fastest model, best for simple tasks',
  },
  {
    id: 'claude-3-opus-20240229',
    name: 'Claude 3 Opus',
    isFree: false,
    contextWindow: 200000,
    description: 'Previous generation flagship model',
  },
  {
    id: 'claude-3-sonnet-20240229',
    name: 'Claude 3 Sonnet',
    isFree: false,
    contextWindow: 200000,
    description: 'Previous generation balanced model',
  },
];

/**
 * Default model for Anthropic (Claude 3.5 Sonnet)
 */
export const DEFAULT_ANTHROPIC_MODEL = ANTHROPIC_MODELS[0].id;

/**
 * Anthropic API version
 */
const ANTHROPIC_API_VERSION = '2023-06-01';

/**
 * Anthropic Provider
 * 
 * Features:
 * - Requires API key
 * - Supports streaming
 * - Claude 3.5 Sonnet and other models
 * - High-quality responses for skill generation
 */
export class AnthropicProvider extends BaseProvider {
  type: ProviderType = 'anthropic';
  name = 'Anthropic (Claude)';
  requiresApiKey = true;
  supportsStreaming = true;

  protected baseUrl = 'https://api.anthropic.com/v1';

  constructor(config?: { apiKey?: string; baseUrl?: string }) {
    super(config);
    if (config?.baseUrl) {
      this.baseUrl = config.baseUrl;
    }
  }

  /**
   * Send chat completion request
   * 
   * Uses Anthropic's Messages API with streaming support.
   */
  async *chat(messages: Message[], options?: ChatOptions): AsyncIterable<string> {
    // Validate API key
    this.validateConfig();

    const model = options?.model || DEFAULT_ANTHROPIC_MODEL;

    // Anthropic requires separating system messages
    const systemMessage = messages.find(m => m.role === 'system');
    const conversationMessages = messages.filter(m => m.role !== 'system');

    // Build request body
    const body: any = {
      model,
      max_tokens: options?.maxTokens || 4096,
      temperature: options?.temperature ?? 0.7,
      messages: conversationMessages.map(m => ({
        role: m.role,
        content: m.content,
      })),
    };

    // Add system message if present
    if (systemMessage) {
      body.system = systemMessage.content;
    }

    // Add stop sequences if provided
    if (options?.stopSequences && options.stopSequences.length > 0) {
      body.stop_sequences = options.stopSequences;
    }

    // Enable streaming if requested (default)
    if (options?.stream !== false) {
      body.stream = true;
    }

    // Build headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-api-key': this.apiKey!,
      'anthropic-version': ANTHROPIC_API_VERSION,
    };

    // Make request
    const response = await this.makeRequest(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    // Handle streaming vs non-streaming
    if (options?.stream !== false) {
      yield* this.parseAnthropicStream(response);
    } else {
      // Non-streaming response
      const data = await response.json();
      if (data.content && data.content[0] && data.content[0].text) {
        yield data.content[0].text;
      }
    }
  }

  /**
   * Parse Anthropic's streaming response format
   * 
   * Anthropic uses Server-Sent Events (SSE) with specific event types:
   * - message_start: Start of message
   * - content_block_start: Start of content block
   * - content_block_delta: Incremental content (this is what we want)
   * - content_block_stop: End of content block
   * - message_delta: Message metadata updates
   * - message_stop: End of message
   */
  private async *parseAnthropicStream(response: Response): AsyncIterable<string> {
    if (!response.body) {
      throw this.createError('No response body', 'STREAM_ERROR');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        // Decode chunk and add to buffer
        buffer += decoder.decode(value, { stream: true });

        // Process complete lines
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          const trimmed = line.trim();
          
          // Skip empty lines and comments
          if (!trimmed || trimmed.startsWith(':')) continue;

          // Parse SSE data lines
          if (trimmed.startsWith('data: ')) {
            const data = trimmed.slice(6);

            // Check for stream end
            if (data === '[DONE]') return;

            try {
              const json = JSON.parse(data);
              
              // Extract text from content_block_delta events
              if (json.type === 'content_block_delta' && json.delta?.text) {
                yield json.delta.text;
              }
              
              // Handle error events
              if (json.type === 'error') {
                throw this.createError(
                  json.error?.message || 'Unknown error from Anthropic',
                  'STREAM_ERROR'
                );
              }
            } catch (e) {
              // If it's already a ProviderError, re-throw it
              if (e instanceof Error && e.name === 'ProviderError') {
                throw e;
              }
              // Skip invalid JSON lines
              console.warn('Failed to parse Anthropic SSE data:', data);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * List available models
   * 
   * Returns the curated list of Claude models.
   */
  async listModels(): Promise<Model[]> {
    return ANTHROPIC_MODELS;
  }

  /**
   * Test connection to Anthropic
   * 
   * Sends a minimal test request to verify API key and service availability.
   */
  async testConnection() {
    const startTime = Date.now();

    try {
      // Validate API key
      if (!this.apiKey) {
        return {
          success: false,
          error: 'API key is required for Anthropic',
        };
      }

      // Send a minimal test message
      const testMessages: Message[] = [
        { role: 'user', content: 'Hi' },
      ];

      // Try to get first response chunk
      const iterator = this.chat(testMessages, {
        model: DEFAULT_ANTHROPIC_MODEL,
        maxTokens: 10,
      });

      // Get first chunk
      let gotResponse = false;
      for await (const chunk of iterator) {
        if (chunk) {
          gotResponse = true;
          break;
        }
      }

      if (!gotResponse) {
        return {
          success: false,
          error: 'No response received from Anthropic',
        };
      }

      const latency = Date.now() - startTime;

      return {
        success: true,
        latency,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        latency: Date.now() - startTime,
      };
    }
  }

  /**
   * Get default model for Anthropic
   */
  protected getDefaultModel(): string {
    return DEFAULT_ANTHROPIC_MODEL;
  }
}
