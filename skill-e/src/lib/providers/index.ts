/**
 * S08: LLM Providers - Public API
 *
 * Exports all provider functionality for use throughout the application.
 */

// Types
export type {
  Provider,
  ProviderType,
  ProviderConfig,
  ProviderInfo,
  Message,
  ChatOptions,
  Model,
  ConnectionTestResult,
  IntegrationStatus,
  ProviderErrorCode,
} from './types'

export { ProviderError } from './types'

// Base provider (for extending if needed)
export { BaseProvider } from './base-provider'

// Individual providers
export { OpenRouterProvider, OPENROUTER_FREE_MODELS, DEFAULT_OPENROUTER_MODEL } from './openrouter'
export { AnthropicProvider, ANTHROPIC_MODELS, DEFAULT_ANTHROPIC_MODEL } from './anthropic'
export { OpenAIProvider, OPENAI_MODELS, DEFAULT_OPENAI_MODEL } from './openai'
export { GoogleProvider, GOOGLE_MODELS, DEFAULT_GOOGLE_MODEL } from './google'
export {
  OllamaProvider,
  OLLAMA_DEFAULT_MODELS,
  DEFAULT_OLLAMA_MODEL,
  DEFAULT_OLLAMA_BASE_URL,
} from './ollama'

// Factory functions and registry
export {
  createProvider,
  getProviderInfo,
  getAvailableProviders,
  getAllProviderInfo,
  getDefaultConfig,
  requiresApiKey,
  isFreeProvider,
  getRecommendedProvider,
  validateProviderConfig,
  createDefaultProvider,
  PROVIDER_REGISTRY,
  DEFAULT_PROVIDER_CONFIGS,
} from './factory'
