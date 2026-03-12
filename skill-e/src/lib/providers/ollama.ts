/**
 * S08: LLM Providers - Ollama Provider
 *
 * Ollama provider for local LLM execution.
 * Runs models locally with no API key required - perfect for offline/free usage.
 *
 * Requirements: FR-8.1
 */

import { BaseProvider } from './base-provider'
import type { Message, ChatOptions, Model, ProviderType } from './types'

/**
 * Default Ollama models (popular and well-tested)
 */
export const OLLAMA_DEFAULT_MODELS: Model[] = [
  {
    id: 'llama3.1',
    name: 'Llama 3.1 8B',
    isFree: true,
    contextWindow: 8192,
    description: "Meta's Llama 3.1 - excellent general purpose model",
  },
  {
    id: 'llama3',
    name: 'Llama 3 8B',
    isFree: true,
    contextWindow: 8192,
    description: "Meta's Llama 3 - fast and capable",
  },
  {
    id: 'mistral',
    name: 'Mistral 7B',
    isFree: true,
    contextWindow: 8192,
    description: "Mistral AI's 7B model - efficient and reliable",
  },
  {
    id: 'gemma2',
    name: 'Gemma 2 9B',
    isFree: true,
    contextWindow: 8192,
    description: "Google's Gemma 2 - fast and capable",
  },
  {
    id: 'phi3',
    name: 'Phi-3 Mini',
    isFree: true,
    contextWindow: 128000,
    description: "Microsoft's Phi-3 - huge context window",
  },
  {
    id: 'codellama',
    name: 'Code Llama 7B',
    isFree: true,
    contextWindow: 16384,
    description: "Meta's Code Llama - specialized for code",
  },
  {
    id: 'qwen2',
    name: 'Qwen 2 7B',
    isFree: true,
    contextWindow: 32768,
    description: "Alibaba's Qwen 2 - large context window",
  },
]

/**
 * Default model for Ollama
 */
export const DEFAULT_OLLAMA_MODEL = 'llama3.1'

/**
 * Default Ollama base URL (local server)
 */
export const DEFAULT_OLLAMA_BASE_URL = 'http://localhost:11434'

/**
 * Ollama Provider
 *
 * Features:
 * - Local execution (no API key needed)
 * - Privacy focused (data never leaves your machine)
 * - No API costs
 * - Supports streaming
 * - OpenAI-compatible API
 */
export class OllamaProvider extends BaseProvider {
  type: ProviderType = 'ollama'
  name = 'Ollama'
  requiresApiKey = false // Local, no API key needed!
  supportsStreaming = true

  protected baseUrl = DEFAULT_OLLAMA_BASE_URL

  constructor(config?: { apiKey?: string; baseUrl?: string }) {
    super(config)
    if (config?.baseUrl) {
      this.baseUrl = config.baseUrl
    }
  }

  /**
   * Send chat completion request
   *
   * Uses Ollama's /api/chat endpoint with OpenAI-compatible format.
   */
  async *chat(messages: Message[], options?: ChatOptions): AsyncIterable<string> {
    const model = options?.model || DEFAULT_OLLAMA_MODEL

    // Build request body (Ollama format)
    const body = {
      model,
      messages: this.formatMessages(messages),
      stream: options?.stream !== false, // Default to streaming
      options: {
        temperature: options?.temperature ?? 0.7,
        num_predict: options?.maxTokens,
        stop: options?.stopSequences,
      },
    }

    // Make request to Ollama
    const response = await this.makeRequest(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    // Parse Ollama's streaming format (newline-delimited JSON)
    yield* this.parseOllamaStream(response)
  }

  /**
   * Parse Ollama's streaming response format
   *
   * Ollama streams newline-delimited JSON objects with this format:
   * {"message": {"role": "assistant", "content": "chunk"}, "done": false}
   */
  private async *parseOllamaStream(response: Response): AsyncIterable<string> {
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
          if (!trimmed) continue

          try {
            const json = JSON.parse(trimmed)

            // Extract content from message (even if done is true)
            const content = json.message?.content
            if (content) {
              yield content
            }

            // Check if stream is done (after yielding content)
            if (json.done) {
              return
            }
          } catch (e) {
            // Skip invalid JSON lines
            console.warn('Failed to parse Ollama response:', trimmed)
          }
        }
      }
    } finally {
      reader.releaseLock()
    }
  }

  /**
   * List available models from Ollama server
   *
   * Queries the /api/tags endpoint to get installed models.
   * Falls back to default model list if server is not available.
   */
  async listModels(): Promise<Model[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`)

      if (!response.ok) {
        // Server not available, return default list
        return OLLAMA_DEFAULT_MODELS
      }

      const data = (await response.json()) as {
        models?: Array<{
          name: string
          size?: number
          modified_at?: string
        }>
      }

      if (!data.models || data.models.length === 0) {
        return OLLAMA_DEFAULT_MODELS
      }

      // Convert Ollama models to our Model format
      return data.models.map(m => ({
        id: m.name,
        name: m.name,
        isFree: true, // All Ollama models are free
        contextWindow: 8192, // Default, actual varies by model
        description: `Local model (${this.formatSize(m.size)})`,
      }))
    } catch (error) {
      console.warn('Failed to list Ollama models:', error)
      // Return default list if server is not reachable
      return OLLAMA_DEFAULT_MODELS
    }
  }

  /**
   * Test connection to Ollama server
   *
   * Checks if Ollama is running and accessible.
   */
  async testConnection() {
    const startTime = Date.now()

    try {
      // First, check if server is running
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
      })

      if (!response.ok) {
        return {
          success: false,
          error: 'Ollama server is not responding. Make sure Ollama is installed and running.',
          latency: Date.now() - startTime,
        }
      }

      // Check if any models are installed
      const data = (await response.json()) as { models?: Array<{ name: string }> }
      const models = data.models || []

      if (models.length === 0) {
        return {
          success: false,
          error: 'No models installed. Run "ollama pull llama3.1" to install a model.',
          latency: Date.now() - startTime,
        }
      }

      // Try to send a test message
      const testMessages: Message[] = [{ role: 'user', content: 'Hi' }]

      const iterator = this.chat(testMessages, {
        model: models[0].name,
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
          error: 'No response received from Ollama',
          latency: Date.now() - startTime,
        }
      }

      const latency = Date.now() - startTime

      return {
        success: true,
        latency,
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      return {
        success: false,
        error: `Failed to connect to Ollama: ${errorMessage}. Make sure Ollama is installed and running.`,
        latency: Date.now() - startTime,
      }
    }
  }

  /**
   * Get default model for Ollama
   */
  protected getDefaultModel(): string {
    return DEFAULT_OLLAMA_MODEL
  }

  /**
   * Helper: Format model size for display
   */
  private formatSize(bytes?: number): string {
    if (!bytes) return 'unknown size'

    const gb = bytes / (1024 * 1024 * 1024)
    if (gb >= 1) {
      return `${gb.toFixed(1)} GB`
    }

    const mb = bytes / (1024 * 1024)
    return `${mb.toFixed(0)} MB`
  }

  /**
   * Pull a model from Ollama registry
   *
   * This is a utility method for downloading models.
   * Not part of the Provider interface but useful for Ollama.
   */
  async pullModel(
    modelName: string,
    onProgress?: (progress: number, status: string) => void
  ): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/pull`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: modelName }),
    })

    if (!response.ok) {
      throw this.createError(
        `Failed to pull model ${modelName}: ${response.statusText}`,
        'NETWORK_ERROR'
      )
    }

    if (!response.body) {
      return
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed) continue

          try {
            const parsed = JSON.parse(trimmed)

            if (onProgress) {
              const status = parsed.status || 'downloading'

              if (parsed.completed !== undefined && parsed.total) {
                const progress = parsed.completed / parsed.total
                onProgress(progress, status)
              } else {
                onProgress(0, status)
              }
            }

            // Check if done
            if (parsed.status === 'success') {
              return
            }
          } catch {
            // Ignore parse errors
          }
        }
      }
    } finally {
      reader.releaseLock()
    }
  }
}
