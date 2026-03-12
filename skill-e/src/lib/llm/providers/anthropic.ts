/**
 * Anthropic Provider
 *
 * Implementation for Anthropic's Claude API.
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
 * Anthropic Claude Provider
 */
export class AnthropicProvider extends BaseLLMProvider {
  constructor(config: ProviderConfig) {
    super(config)
  }

  /**
   * Build request headers
   */
  protected buildHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'x-api-key': this.config.apiKey,
      'anthropic-version': '2023-06-01',
    }
  }

  /**
   * Build request body for Anthropic API
   */
  protected buildRequestBody(prompt: string, options: GenerateOptions): Record<string, unknown> {
    return {
      model: options.model,
      max_tokens: options.maxTokens || 4000,
      temperature: options.temperature ?? 0.3,
      ...(options.topP !== undefined && { top_p: options.topP }),
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    }
  }

  /**
   * Generate text completion
   */
  async generate(prompt: string, options: GenerateOptions): Promise<GenerationResult> {
    const startTime = Date.now()

    const body = this.buildRequestBody(prompt, options)
    const response = await this.makeRequest('/messages', body)

    // Anthropic response: content[0].text
    const text = this.extractTextFromResponse(response)

    return this.createResult(text, options.model, startTime, response)
  }

  /**
   * Stream text generation
   */
  async stream(prompt: string, options: StreamOptions): Promise<void> {
    const body = {
      ...this.buildRequestBody(prompt, options),
      stream: true,
    }

    const url = `${this.config.baseUrl}/messages`
    const headers = this.buildHeaders()

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Anthropic streaming error (${response.status}): ${errorText}`)
    }

    if (!response.body) {
      throw new Error('No response body for streaming')
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()

    try {
      while (true) {
        const { done, value } = await reader.read()

        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n').filter(line => line.trim() !== '')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)

            if (data === '[DONE]') {
              options.onComplete?.()
              return
            }

            try {
              const parsed = JSON.parse(data)

              // Anthropic streaming format:
              // type: content_block_delta, delta: { text: "..." }
              if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                options.onChunk(parsed.delta.text)
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
   * Validate configuration
   */
  async validate(): Promise<boolean> {
    if (!this.config.apiKey || !this.config.apiKey.startsWith('sk-')) {
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
      console.error('Anthropic validation failed:', error)
      return false
    }
  }

  /**
   * Get provider metadata
   */
  getMetadata() {
    return {
      id: 'anthropic' as LLMProvider,
      name: 'Anthropic (Claude)',
      description: 'Claude 3.5 Sonnet, Claude 3 Opus, and Claude 3 Haiku',
      website: 'https://www.anthropic.com',
      docsUrl: 'https://docs.anthropic.com',
      requiresApiKey: true,
      hasFreeTier: false,
      popularModels: [
        'claude-3-5-sonnet-20241022',
        'claude-3-opus-20240229',
        'claude-3-sonnet-20240229',
        'claude-3-haiku-20240307',
      ],
      features: ['Streaming', 'Vision', 'Function calling', '100K+ context', 'Artifacts'],
    }
  }
}
