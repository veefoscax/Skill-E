/**
 * S08: LLM Providers - Type Definitions
 *
 * Simplified provider system with only 5 essential providers.
 * Prioritizes OpenRouter free tier and integration with existing subscriptions.
 *
 * Requirements: FR-8.1
 */

/**
 * Supported provider types (Essential only)
 *
 * - openrouter: Free tier available, default for demos
 * - anthropic: Claude API (production)
 * - openai: GPT-4 (fallback)
 * - google: Gemini (alternative)
 * - ollama: Local, free, offline
 */
export type ProviderType =
  | 'openrouter' // Free tier, default
  | 'anthropic' // Claude API
  | 'openai' // GPT API
  | 'google' // Gemini API
  | 'ollama' // Local, free

/**
 * Message format for chat completions
 */
export interface Message {
  role: 'system' | 'user' | 'assistant'
  content: string
}

/**
 * Options for chat completion requests
 */
export interface ChatOptions {
  model?: string
  temperature?: number
  maxTokens?: number
  stream?: boolean
  stopSequences?: string[]
}

/**
 * Model information
 */
export interface Model {
  id: string
  name: string
  isFree: boolean
  contextWindow: number
  description?: string
}

/**
 * Connection test result
 */
export interface ConnectionTestResult {
  success: boolean
  error?: string
  latency?: number
}

/**
 * Provider interface
 *
 * All providers must implement this interface to ensure consistent behavior.
 */
export interface Provider {
  /** Provider type identifier */
  type: ProviderType

  /** Human-readable provider name */
  name: string

  /** Whether this provider requires an API key */
  requiresApiKey: boolean

  /** Whether this provider supports streaming responses */
  supportsStreaming: boolean

  /**
   * Send a chat completion request
   *
   * @param messages - Array of messages in the conversation
   * @param options - Optional configuration for the request
   * @returns AsyncIterable that yields response chunks (for streaming)
   */
  chat(messages: Message[], options?: ChatOptions): AsyncIterable<string>

  /**
   * Test connection to the provider
   *
   * @returns Result indicating success or failure with error details
   */
  testConnection(): Promise<ConnectionTestResult>

  /**
   * List available models for this provider
   *
   * @returns Array of available models
   */
  listModels(): Promise<Model[]>
}

/**
 * Provider configuration
 *
 * Stored in settings and used to instantiate providers.
 */
export interface ProviderConfig {
  /** Provider type */
  type: ProviderType

  /** API key (optional for providers like OpenRouter free tier and Ollama) */
  apiKey?: string

  /** Custom base URL (optional, mainly for Ollama) */
  baseUrl?: string

  /** Selected model ID */
  model: string

  /** Optional temperature setting (0-1) */
  temperature?: number

  /** Optional max tokens limit */
  maxTokens?: number
}

/**
 * Provider metadata for UI display
 */
export interface ProviderInfo {
  type: ProviderType
  name: string
  description: string
  requiresApiKey: boolean
  supportsStreaming: boolean
  isFree: boolean
  icon?: string
}

/**
 * Integration detection results
 *
 * Used to detect if user has existing subscriptions through
 * Antigravity (Google) or Claude Code (Anthropic).
 */
export interface IntegrationStatus {
  /** Antigravity (Google) integration available */
  antigravity: boolean

  /** Claude Code (Anthropic) integration available */
  claudeCode: boolean
}

/**
 * Error types for provider operations
 */
export class ProviderError extends Error {
  constructor(
    message: string,
    public code: ProviderErrorCode,
    public provider: ProviderType
  ) {
    super(message)
    this.name = 'ProviderError'
  }
}

export type ProviderErrorCode =
  | 'INVALID_API_KEY'
  | 'NETWORK_ERROR'
  | 'RATE_LIMIT'
  | 'MODEL_NOT_FOUND'
  | 'INVALID_REQUEST'
  | 'STREAM_ERROR'
  | 'UNKNOWN_ERROR'
