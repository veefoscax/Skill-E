/**
 * S08: LLM Providers - Google Provider
 *
 * Google (Gemini) provider with streaming support.
 * Supports Gemini 1.5 Pro, Flash, and other Gemini models.
 *
 * Requirements: FR-8.1
 */

import { BaseProvider } from './base-provider'
import type { Message, ChatOptions, Model, ProviderType } from './types'

/**
 * Available Gemini models
 */
export const GOOGLE_MODELS: Model[] = [
  {
    id: 'gemini-1.5-pro-latest',
    name: 'Gemini 1.5 Pro',
    isFree: false,
    contextWindow: 2000000,
    description: 'Most capable model with 2M token context',
  },
  {
    id: 'gemini-1.5-flash-latest',
    name: 'Gemini 1.5 Flash',
    isFree: false,
    contextWindow: 1000000,
    description: 'Fast and efficient with 1M token context',
  },
  {
    id: 'gemini-1.5-flash-8b',
    name: 'Gemini 1.5 Flash-8B',
    isFree: false,
    contextWindow: 1000000,
    description: 'Smaller, faster variant of Flash',
  },
  {
    id: 'gemini-pro',
    name: 'Gemini Pro',
    isFree: false,
    contextWindow: 32768,
    description: 'Previous generation model',
  },
]

/**
 * Default model for Google (Gemini 1.5 Pro)
 */
export const DEFAULT_GOOGLE_MODEL = GOOGLE_MODELS[0].id

/**
 * Google Provider
 *
 * Features:
 * - Requires API key
 * - Supports streaming
 * - Gemini 1.5 Pro and Flash models
 * - Massive context windows (up to 2M tokens)
 *
 * Note: Google's API format is different from OpenAI-compatible APIs.
 * It uses a different message format and streaming protocol.
 */
export class GoogleProvider extends BaseProvider {
  type: ProviderType = 'google'
  name = 'Google (Gemini)'
  requiresApiKey = true
  supportsStreaming = true

  protected baseUrl = 'https://generativelanguage.googleapis.com/v1beta'

  constructor(config?: { apiKey?: string; baseUrl?: string }) {
    super(config)
    if (config?.baseUrl) {
      this.baseUrl = config.baseUrl
    }
  }

  /**
   * Send chat completion request
   *
   * Uses Google's Generative Language API with streaming support.
   *
   * Google's API is different from OpenAI:
   * - Uses "contents" instead of "messages"
   * - Uses "parts" for message content
   * - Different role names: "user" and "model" (instead of "assistant")
   * - System instructions are separate
   */
  async *chat(messages: Message[], options?: ChatOptions): AsyncIterable<string> {
    // Validate API key
    this.validateConfig()

    const model = options?.model || DEFAULT_GOOGLE_MODEL

    // Convert messages to Google format
    const { systemInstruction, contents } = this.convertMessagesToGoogleFormat(messages)

    // Build request body
    const body: any = {
      contents,
      generationConfig: {
        temperature: options?.temperature ?? 0.7,
        maxOutputTokens: options?.maxTokens || 8192,
      },
    }

    // Add system instruction if present
    if (systemInstruction) {
      body.systemInstruction = {
        parts: [{ text: systemInstruction }],
      }
    }

    // Add stop sequences if provided
    if (options?.stopSequences && options.stopSequences.length > 0) {
      body.generationConfig.stopSequences = options.stopSequences
    }

    // Determine endpoint based on streaming
    const endpoint =
      options?.stream !== false
        ? `${this.baseUrl}/models/${model}:streamGenerateContent`
        : `${this.baseUrl}/models/${model}:generateContent`

    // Build URL with API key as query parameter (Google's approach)
    const url = `${endpoint}?key=${this.apiKey}`

    // Make request
    const response = await this.makeRequest(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    // Handle streaming vs non-streaming
    if (options?.stream !== false) {
      yield* this.parseGoogleStream(response)
    } else {
      // Non-streaming response
      const data = await response.json()
      if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
        yield data.candidates[0].content.parts[0].text
      }
    }
  }

  /**
   * Convert standard messages to Google's format
   *
   * Google uses:
   * - "contents" array with "role" and "parts"
   * - "user" and "model" roles (not "assistant")
   * - System instructions are separate
   */
  private convertMessagesToGoogleFormat(messages: Message[]): {
    systemInstruction?: string
    contents: any[]
  } {
    // Extract system message
    const systemMessage = messages.find(m => m.role === 'system')
    const conversationMessages = messages.filter(m => m.role !== 'system')

    // Convert messages to Google format
    const contents = conversationMessages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }))

    return {
      systemInstruction: systemMessage?.content,
      contents,
    }
  }

  /**
   * Parse Google's streaming response format
   *
   * Google uses a different streaming format:
   * - Each chunk is a complete JSON object
   * - Chunks are separated by newlines
   * - Each chunk has candidates[0].content.parts[0].text
   */
  private async *parseGoogleStream(response: Response): AsyncIterable<string> {
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

        // Process complete lines (Google sends one JSON per line)
        const lines = buffer.split('\n')
        buffer = lines.pop() || '' // Keep incomplete line in buffer

        for (const line of lines) {
          const trimmed = line.trim()

          // Skip empty lines
          if (!trimmed) continue

          // Skip lines that start with "data: " (some implementations use SSE format)
          const jsonStr = trimmed.startsWith('data: ') ? trimmed.slice(6) : trimmed

          // Skip [DONE] markers
          if (jsonStr === '[DONE]') continue

          try {
            const json = JSON.parse(jsonStr)

            // Extract text from Google's format
            const text = json.candidates?.[0]?.content?.parts?.[0]?.text

            if (text) {
              yield text
            }

            // Check for errors
            if (json.error) {
              throw this.createError(
                json.error.message || 'Unknown error from Google',
                'STREAM_ERROR'
              )
            }

            // Check for finish reason (blocked content, etc.)
            const finishReason = json.candidates?.[0]?.finishReason
            if (finishReason && finishReason !== 'STOP' && finishReason !== 'MAX_TOKENS') {
              console.warn(`Google API finished with reason: ${finishReason}`)
            }
          } catch (e) {
            // If it's already a ProviderError, re-throw it
            if (e instanceof Error && e.name === 'ProviderError') {
              throw e
            }
            // Skip invalid JSON lines
            console.warn('Failed to parse Google response:', jsonStr)
          }
        }
      }
    } finally {
      reader.releaseLock()
    }
  }

  /**
   * List available models
   *
   * Returns the curated list of Gemini models.
   * Could optionally fetch from: GET /v1beta/models
   */
  async listModels(): Promise<Model[]> {
    return GOOGLE_MODELS
  }

  /**
   * Test connection to Google
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
          error: 'API key is required for Google',
        }
      }

      // Send a minimal test message
      const testMessages: Message[] = [{ role: 'user', content: 'Hi' }]

      // Try to get first response chunk
      const iterator = this.chat(testMessages, {
        model: DEFAULT_GOOGLE_MODEL,
        maxTokens: 10,
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
          error: 'No response received from Google',
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
   * Get default model for Google
   */
  protected getDefaultModel(): string {
    return DEFAULT_GOOGLE_MODEL
  }

  /**
   * Override makeRequest to handle Google's error format
   */
  protected async makeRequest(url: string, options: RequestInit): Promise<Response> {
    try {
      const response = await fetch(url, options)

      // Handle HTTP errors
      if (!response.ok) {
        let errorMessage = 'Unknown error'

        try {
          const errorData = await response.json()
          errorMessage = errorData.error?.message || errorData.error || errorMessage
        } catch {
          errorMessage = await response.text().catch(() => 'Unknown error')
        }

        // Determine error code based on status
        let code:
          | 'INVALID_API_KEY'
          | 'RATE_LIMIT'
          | 'MODEL_NOT_FOUND'
          | 'INVALID_REQUEST'
          | 'NETWORK_ERROR'
          | 'UNKNOWN_ERROR' = 'UNKNOWN_ERROR'

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

        throw this.createError(`HTTP ${response.status}: ${errorMessage}`, code)
      }

      return response
    } catch (error) {
      if (error instanceof Error && error.name === 'ProviderError') {
        throw error
      }

      // Network errors
      throw this.createError(
        error instanceof Error ? error.message : 'Network request failed',
        'NETWORK_ERROR'
      )
    }
  }
}
