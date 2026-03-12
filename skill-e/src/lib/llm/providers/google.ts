/**
 * Google AI (Gemini) Provider
 *
 * Implementation for Google's Gemini API.
 * Uses a different request/response format than OpenAI.
 */

import { BaseLLMProvider } from '../base-provider'
import type {
  ProviderConfig,
  GenerateOptions,
  StreamOptions,
  GenerationResult,
  LLMProvider,
} from '../types'

/**
 * Google Gemini Provider
 */
export class GoogleProvider extends BaseLLMProvider {
  constructor(config: ProviderConfig) {
    super(config)
  }

  /**
   * Build request headers
   */
  protected buildHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
    }
  }

  /**
   * Build request body for Google Gemini API
   */
  protected buildRequestBody(prompt: string, options: GenerateOptions): Record<string, unknown> {
    return {
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        maxOutputTokens: options.maxTokens || 4000,
        temperature: options.temperature ?? 0.3,
        ...(options.topP !== undefined && { topP: options.topP }),
        ...(options.stopSequences && { stopSequences: options.stopSequences }),
      },
    }
  }

  /**
   * Generate text completion
   */
  async generate(prompt: string, options: GenerateOptions): Promise<GenerationResult> {
    const startTime = Date.now()

    const body = this.buildRequestBody(prompt, options)
    const endpoint = `/models/${options.model}:generateContent?key=${this.config.apiKey}`

    const response = await this.makeRequest(endpoint, body)
    const text = this.extractTextFromResponse(response)

    return this.createResult(text, options.model, startTime, response)
  }

  /**
   * Stream text generation
   *
   * Note: Google Gemini streaming uses a different format
   */
  async stream(prompt: string, options: StreamOptions): Promise<void> {
    const body = {
      ...this.buildRequestBody(prompt, options),
    }

    const endpoint = `/models/${options.model}:streamGenerateContent?key=${this.config.apiKey}`
    const url = `${this.config.baseUrl}${endpoint}`
    const headers = this.buildHeaders()

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Google AI streaming error (${response.status}): ${errorText}`)
    }

    if (!response.body) {
      throw new Error('No response body for streaming')
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    try {
      while (true) {
        const { done, value } = await reader.read()

        if (done) break

        buffer += decoder.decode(value, { stream: true })

        // Process SSE format (data: {...})
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)

            if (data === '[DONE]') {
              options.onComplete?.()
              return
            }

            try {
              const parsed = JSON.parse(data)

              // Google Gemini streaming format:
              // candidates[0].content.parts[0].text
              const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text
              if (text) {
                options.onChunk(text)
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      options.onError?.(error as Error)
      throw error
    } finally {
      reader.releaseLock()
    }

    options.onComplete?.()
  }

  /**
   * Make API request with Google-specific handling
   */
  protected async makeRequest(
    endpoint: string,
    body: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    const url = `${this.config.baseUrl}${endpoint}`
    const headers = this.buildHeaders()

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Google AI API error (${response.status}): ${errorText}`)
    }

    return (await response.json()) as Record<string, unknown>
  }

  /**
   * Validate configuration
   */
  async validate(): Promise<boolean> {
    if (!this.config.apiKey) {
      return false
    }

    try {
      // Try a simple request
      await this.generate('Hello', {
        model: this.config.defaultModel,
        maxTokens: 10,
      })
      return true
    } catch (error) {
      console.error('Google AI validation failed:', error)
      return false
    }
  }

  /**
   * Get provider metadata
   */
  getMetadata() {
    return {
      id: 'google' as LLMProvider,
      name: 'Google AI (Gemini)',
      description: 'Gemini 1.5 Pro, Gemini 1.5 Flash, and Gemini Pro',
      website: 'https://ai.google.dev',
      docsUrl: 'https://ai.google.dev/docs',
      requiresApiKey: true,
      hasFreeTier: true,
      popularModels: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-pro'],
      features: ['Streaming', 'Vision', 'Function calling', '1M+ context', 'Free tier available'],
    }
  }
}
