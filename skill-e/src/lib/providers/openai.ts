/**
 * S08: LLM Providers - OpenAI Provider
 *
 * OpenAI (GPT) provider with streaming support.
 * Supports GPT-4 and other OpenAI models.
 *
 * Requirements: FR-8.1
 */

import { BaseProvider } from './base-provider'
import type { Message, ChatOptions, Model, ProviderType } from './types'

/**
 * Available OpenAI models
 */
export const OPENAI_MODELS: Model[] = [
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    isFree: false,
    contextWindow: 128000,
    description: 'Most advanced model, multimodal capabilities',
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    isFree: false,
    contextWindow: 128000,
    description: 'Faster and more affordable than GPT-4o',
  },
  {
    id: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    isFree: false,
    contextWindow: 128000,
    description: 'Previous generation flagship model',
  },
  {
    id: 'gpt-4',
    name: 'GPT-4',
    isFree: false,
    contextWindow: 8192,
    description: 'Original GPT-4 model',
  },
  {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    isFree: false,
    contextWindow: 16385,
    description: 'Fast and affordable for simple tasks',
  },
]

/**
 * Default model for OpenAI (GPT-4o)
 */
export const DEFAULT_OPENAI_MODEL = OPENAI_MODELS[0].id

/**
 * OpenAI Provider
 *
 * Features:
 * - Requires API key
 * - Supports streaming
 * - GPT-4o and other models
 * - OpenAI-compatible API (same as OpenRouter)
 */
export class OpenAIProvider extends BaseProvider {
  type: ProviderType = 'openai'
  name = 'OpenAI (GPT)'
  requiresApiKey = true
  supportsStreaming = true

  protected baseUrl = 'https://api.openai.com/v1'

  constructor(config?: { apiKey?: string; baseUrl?: string }) {
    super(config)
    if (config?.baseUrl) {
      this.baseUrl = config.baseUrl
    }
  }

  /**
   * Send chat completion request
   *
   * Uses OpenAI's Chat Completions API with streaming support.
   */
  async *chat(messages: Message[], options?: ChatOptions): AsyncIterable<string> {
    // Validate API key
    this.validateConfig()

    const model = options?.model || DEFAULT_OPENAI_MODEL

    // Build request body
    const body = {
      model,
      messages: this.formatMessages(messages),
      stream: options?.stream !== false, // Default to streaming
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens,
      stop: options?.stopSequences,
    }

    // Build headers
    const headers = this.buildHeaders({
      'OpenAI-Organization': '', // Optional: add org ID if needed
    })

    // Make request
    const response = await this.makeRequest(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })

    // Parse SSE stream (OpenAI uses same format as OpenRouter)
    yield* this.parseSSEStream(response, data => {
      // Extract content from OpenAI format
      return data.choices?.[0]?.delta?.content || null
    })
  }

  /**
   * List available models
   *
   * Returns the curated list of OpenAI models.
   * Could optionally fetch from: GET /v1/models
   */
  async listModels(): Promise<Model[]> {
    return OPENAI_MODELS
  }

  /**
   * Test connection to OpenAI
   *
   * Sends a minimal test request to verify API key and service availability.
   */
  async testConnection() {
    const startTime = Date.now()

    try {
      // Validate API key
      if (!this.apiKey) {
        return {
          success: false,
          error: 'API key is required for OpenAI',
        }
      }

      // Send a minimal test message
      const testMessages: Message[] = [{ role: 'user', content: 'Hi' }]

      // Try to get first response chunk
      const iterator = this.chat(testMessages, {
        model: DEFAULT_OPENAI_MODEL,
        maxTokens: 5,
      })

      // Get first chunk
      let gotResponse = false
      for await (const chunk of iterator) {
        if (chunk) {
          gotResponse = true
          break
        }
      }

      if (!gotResponse) {
        return {
          success: false,
          error: 'No response received from OpenAI',
        }
      }

      const latency = Date.now() - startTime

      return {
        success: true,
        latency,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        latency: Date.now() - startTime,
      }
    }
  }

  /**
   * Get default model for OpenAI
   */
  protected getDefaultModel(): string {
    return DEFAULT_OPENAI_MODEL
  }
}
