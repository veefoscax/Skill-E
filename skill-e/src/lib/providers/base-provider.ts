/**
 * S08: LLM Providers - Base Provider
 *
 * Abstract base class providing shared functionality for all providers:
 * - Streaming logic helpers
 * - Error handling
 * - Connection test base implementation
 *
 * Requirements: FR-8.2
 */

import type {
  Provider,
  ProviderType,
  Message,
  ChatOptions,
  ConnectionTestResult,
  Model,
  ProviderErrorCode,
} from './types'
import { ProviderError } from './types'

/**
 * Abstract base provider class
 *
 * Provides common functionality that all providers can use or override.
 */
export abstract class BaseProvider implements Provider {
  abstract type: ProviderType
  abstract name: string
  abstract requiresApiKey: boolean
  abstract supportsStreaming: boolean

  protected apiKey?: string
  protected baseUrl?: string

  constructor(config?: { apiKey?: string; baseUrl?: string }) {
    this.apiKey = config?.apiKey
    this.baseUrl = config?.baseUrl
  }

  /**
   * Abstract method to be implemented by each provider
   */
  abstract chat(messages: Message[], options?: ChatOptions): AsyncIterable<string>

  /**
   * Abstract method to be implemented by each provider
   */
  abstract listModels(): Promise<Model[]>

  /**
   * Test connection to the provider
   *
   * Default implementation sends a simple test message.
   * Providers can override for more specific tests.
   */
  async testConnection(): Promise<ConnectionTestResult> {
    const startTime = Date.now()

    try {
      // Validate API key if required
      if (this.requiresApiKey && !this.apiKey) {
        return {
          success: false,
          error: 'API key is required but not provided',
        }
      }

      // Send a simple test message
      const testMessages: Message[] = [{ role: 'user', content: 'Hello' }]

      // Try to get at least one response chunk
      const iterator = this.chat(testMessages, { maxTokens: 10 })[Symbol.asyncIterator]()
      const firstChunk = await iterator.next()

      if (firstChunk.done) {
        return {
          success: false,
          error: 'No response received from provider',
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
   * Helper: Parse Server-Sent Events (SSE) stream
   *
   * Common pattern for OpenAI-compatible APIs (OpenRouter, OpenAI, etc.)
   */
  protected async *parseSSEStream(
    response: Response,
    extractContent: (data: any) => string | null
  ): AsyncIterable<string> {
    if (!response.body) {
      throw this.createError('No response body', 'STREAM_ERROR')
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    try {
      while (true) {
        const { done, value } = await reader.read()

        if (done) break

        // Decode chunk and add to buffer
        buffer += decoder.decode(value, { stream: true })

        // Process complete lines
        const lines = buffer.split('\n')
        buffer = lines.pop() || '' // Keep incomplete line in buffer

        for (const line of lines) {
          const trimmed = line.trim()

          // Skip empty lines and comments
          if (!trimmed || trimmed.startsWith(':')) continue

          // Parse SSE data lines
          if (trimmed.startsWith('data: ')) {
            const data = trimmed.slice(6)

            // Check for stream end
            if (data === '[DONE]') return

            try {
              const json = JSON.parse(data)
              const content = extractContent(json)

              if (content) {
                yield content
              }
            } catch (e) {
              // Skip invalid JSON lines
              console.warn('Failed to parse SSE data:', data)
            }
          }
        }
      }
    } finally {
      reader.releaseLock()
    }
  }

  /**
   * Helper: Parse JSON stream (newline-delimited JSON)
   *
   * Used by some providers like Anthropic
   */
  protected async *parseJSONStream(
    response: Response,
    extractContent: (data: any) => string | null
  ): AsyncIterable<string> {
    if (!response.body) {
      throw this.createError('No response body', 'STREAM_ERROR')
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    try {
      while (true) {
        const { done, value } = await reader.read()

        if (done) break

        buffer += decoder.decode(value, { stream: true })

        // Process complete lines
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed) continue

          try {
            const json = JSON.parse(trimmed)
            const content = extractContent(json)

            if (content) {
              yield content
            }
          } catch (e) {
            console.warn('Failed to parse JSON line:', trimmed)
          }
        }
      }
    } finally {
      reader.releaseLock()
    }
  }

  /**
   * Helper: Make HTTP request with error handling
   */
  protected async makeRequest(url: string, options: RequestInit): Promise<Response> {
    try {
      const response = await fetch(url, options)

      // Handle HTTP errors
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error')

        // Determine error code based on status
        let code: ProviderErrorCode = 'UNKNOWN_ERROR'

        if (response.status === 401 || response.status === 403) {
          code = 'INVALID_API_KEY'
        } else if (response.status === 429) {
          code = 'RATE_LIMIT'
        } else if (response.status === 404) {
          code = 'MODEL_NOT_FOUND'
        } else if (response.status >= 400 && response.status < 500) {
          code = 'INVALID_REQUEST'
        } else if (response.status >= 500) {
          code = 'NETWORK_ERROR'
        }

        throw this.createError(`HTTP ${response.status}: ${errorText}`, code)
      }

      return response
    } catch (error) {
      if (error instanceof ProviderError) {
        throw error
      }

      // Network errors
      throw this.createError(
        error instanceof Error ? error.message : 'Network request failed',
        'NETWORK_ERROR'
      )
    }
  }

  /**
   * Helper: Create a ProviderError with proper context
   */
  protected createError(message: string, code: ProviderErrorCode): ProviderError {
    return new ProviderError(message, code, this.type)
  }

  /**
   * Helper: Validate required configuration
   */
  protected validateConfig(): void {
    if (this.requiresApiKey && !this.apiKey) {
      throw this.createError(`API key is required for ${this.name}`, 'INVALID_API_KEY')
    }
  }

  /**
   * Helper: Build common headers for API requests
   */
  protected buildHeaders(additionalHeaders?: Record<string, string>): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...additionalHeaders,
    }

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`
    }

    return headers
  }

  /**
   * Helper: Format messages for API request
   *
   * Most providers use the same format, but this can be overridden
   */
  protected formatMessages(messages: Message[]): Message[] {
    return messages
  }

  /**
   * Helper: Get default model for this provider
   *
   * Should be overridden by each provider
   */
  protected getDefaultModel(): string {
    return 'default'
  }

  /**
   * Helper: Validate model exists in available models
   */
  protected async validateModel(modelId: string): Promise<boolean> {
    try {
      const models = await this.listModels()
      return models.some(m => m.id === modelId)
    } catch {
      // If we can't list models, assume the model is valid
      return true
    }
  }
}
