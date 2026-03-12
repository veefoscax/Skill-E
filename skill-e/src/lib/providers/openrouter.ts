/**
 * S08: LLM Providers - OpenRouter Provider
 *
 * OpenRouter provider with free tier support.
 * Default provider for new installs - works without API key using free models.
 *
 * Requirements: FR-8.5
 */

import { BaseProvider } from './base-provider'
import type { Message, ChatOptions, Model, ProviderType } from './types'

/**
 * Free models available on OpenRouter without API key
 *
 * These models are perfect for demos and hackathon evaluations.
 */
export const OPENROUTER_FREE_MODELS: Model[] = [
  {
    id: 'google/gemma-2-9b-it:free',
    name: 'Gemma 2 9B Instruct',
    isFree: true,
    contextWindow: 8192,
    description: "Google's Gemma 2 9B model - fast and capable",
  },
  {
    id: 'meta-llama/llama-3.1-8b-instruct:free',
    name: 'Llama 3.1 8B Instruct',
    isFree: true,
    contextWindow: 8192,
    description: "Meta's Llama 3.1 8B - excellent for general tasks",
  },
  {
    id: 'mistralai/mistral-7b-instruct:free',
    name: 'Mistral 7B Instruct',
    isFree: true,
    contextWindow: 8192,
    description: "Mistral AI's 7B model - efficient and reliable",
  },
  {
    id: 'microsoft/phi-3-mini-128k-instruct:free',
    name: 'Phi-3 Mini 128K',
    isFree: true,
    contextWindow: 128000,
    description: "Microsoft's Phi-3 - huge context window",
  },
]

/**
 * Default model for OpenRouter (best free model)
 */
export const DEFAULT_OPENROUTER_MODEL = OPENROUTER_FREE_MODELS[0].id

/**
 * OpenRouter Provider
 *
 * Features:
 * - Works without API key (free models)
 * - Supports streaming
 * - OpenAI-compatible API
 * - Default provider for new installs
 */
export class OpenRouterProvider extends BaseProvider {
  type: ProviderType = 'openrouter'
  name = 'OpenRouter'
  requiresApiKey = false // Works with free models!
  supportsStreaming = true

  protected baseUrl = 'https://openrouter.ai/api/v1'

  constructor(config?: { apiKey?: string; baseUrl?: string }) {
    super(config)
    if (config?.baseUrl) {
      this.baseUrl = config.baseUrl
    }
  }

  /**
   * Send chat completion request
   *
   * Supports both free models (no API key) and paid models (with API key).
   */
  async *chat(messages: Message[], options?: ChatOptions): AsyncIterable<string> {
    const model = options?.model || DEFAULT_OPENROUTER_MODEL

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
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://skill-e.app',
      'X-Title': 'Skill-E',
    }

    // Add API key if provided (for paid models)
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`
    }

    // Make request
    const response = await this.makeRequest(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })

    // Parse SSE stream
    yield* this.parseSSEStream(response, data => {
      // Extract content from OpenAI-compatible format
      return data.choices?.[0]?.delta?.content || null
    })
  }

  /**
   * List available models
   *
   * Returns free models by default. If API key is provided, could fetch
   * full model list from OpenRouter API.
   */
  async listModels(): Promise<Model[]> {
    // For now, return the curated list of free models
    // In the future, we could fetch from: GET /api/v1/models
    return OPENROUTER_FREE_MODELS
  }

  /**
   * Test connection to OpenRouter
   *
   * Sends a minimal test request to verify the service is accessible.
   */
  async testConnection() {
    const startTime = Date.now()

    try {
      // Send a minimal test message
      const testMessages: Message[] = [{ role: 'user', content: 'Hi' }]

      // Try to get first response chunk
      const iterator = this.chat(testMessages, {
        model: DEFAULT_OPENROUTER_MODEL,
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
          error: 'No response received from OpenRouter',
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
   * Get default model for OpenRouter
   */
  protected getDefaultModel(): string {
    return DEFAULT_OPENROUTER_MODEL
  }
}
