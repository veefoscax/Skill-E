/**
 * S08: LLM Providers - Provider Factory
 *
 * Factory pattern for provider instantiation.
 * Simplified to only 5 essential providers.
 *
 * Requirements: FR-8.2
 */

import type { Provider, ProviderType, ProviderConfig, ProviderInfo } from './types'
import { OpenRouterProvider, DEFAULT_OPENROUTER_MODEL } from './openrouter'
import { AnthropicProvider, DEFAULT_ANTHROPIC_MODEL } from './anthropic'
import { OpenAIProvider, DEFAULT_OPENAI_MODEL } from './openai'
import { GoogleProvider, DEFAULT_GOOGLE_MODEL } from './google'
import { OllamaProvider, DEFAULT_OLLAMA_MODEL } from './ollama'

/**
 * Provider registry with metadata for UI display
 *
 * Only 5 essential providers - keep it simple!
 */
export const PROVIDER_REGISTRY: Record<ProviderType, ProviderInfo> = {
  openrouter: {
    type: 'openrouter',
    name: 'OpenRouter',
    description: 'Free tier available - perfect for demos and testing',
    requiresApiKey: false,
    supportsStreaming: true,
    isFree: true,
    icon: '🌐',
  },
  anthropic: {
    type: 'anthropic',
    name: 'Anthropic (Claude)',
    description: 'Claude 3.5 Sonnet - best for complex tasks',
    requiresApiKey: true,
    supportsStreaming: true,
    isFree: false,
    icon: '🤖',
  },
  openai: {
    type: 'openai',
    name: 'OpenAI (GPT)',
    description: 'GPT-4o - reliable fallback option',
    requiresApiKey: true,
    supportsStreaming: true,
    isFree: false,
    icon: '🧠',
  },
  google: {
    type: 'google',
    name: 'Google (Gemini)',
    description: 'Gemini 1.5 Pro - massive 2M token context',
    requiresApiKey: true,
    supportsStreaming: true,
    isFree: false,
    icon: '✨',
  },
  ollama: {
    type: 'ollama',
    name: 'Ollama',
    description: 'Local models - free, private, offline',
    requiresApiKey: false,
    supportsStreaming: true,
    isFree: true,
    icon: '🦙',
  },
}

/**
 * Default provider configurations for each type
 */
export const DEFAULT_PROVIDER_CONFIGS: Record<ProviderType, Omit<ProviderConfig, 'apiKey'>> = {
  openrouter: {
    type: 'openrouter',
    model: DEFAULT_OPENROUTER_MODEL,
    temperature: 0.7,
    maxTokens: 4096,
  },
  anthropic: {
    type: 'anthropic',
    model: DEFAULT_ANTHROPIC_MODEL,
    temperature: 0.7,
    maxTokens: 4096,
  },
  openai: {
    type: 'openai',
    model: DEFAULT_OPENAI_MODEL,
    temperature: 0.7,
    maxTokens: 4096,
  },
  google: {
    type: 'google',
    model: DEFAULT_GOOGLE_MODEL,
    temperature: 0.7,
    maxTokens: 8192,
  },
  ollama: {
    type: 'ollama',
    model: DEFAULT_OLLAMA_MODEL,
    baseUrl: 'http://localhost:11434',
    temperature: 0.7,
    maxTokens: 4096,
  },
}

/**
 * Create a provider instance from configuration
 *
 * @param config - Provider configuration
 * @returns Provider instance
 * @throws Error if provider type is not supported
 *
 * @example
 * ```typescript
 * // Create OpenRouter provider (no API key needed)
 * const provider = createProvider({
 *   type: 'openrouter',
 *   model: 'google/gemma-2-9b-it:free',
 * });
 *
 * // Create Anthropic provider (API key required)
 * const provider = createProvider({
 *   type: 'anthropic',
 *   apiKey: 'sk-ant-...',
 *   model: 'claude-3-5-sonnet-20241022',
 * });
 * ```
 */
export function createProvider(config: ProviderConfig): Provider {
  const { type, apiKey, baseUrl } = config

  switch (type) {
    case 'openrouter':
      return new OpenRouterProvider({ apiKey, baseUrl })

    case 'anthropic':
      return new AnthropicProvider({ apiKey, baseUrl })

    case 'openai':
      return new OpenAIProvider({ apiKey, baseUrl })

    case 'google':
      return new GoogleProvider({ apiKey, baseUrl })

    case 'ollama':
      return new OllamaProvider({ apiKey, baseUrl })

    default:
      // TypeScript should catch this, but just in case
      throw new Error(`Unsupported provider type: ${type}`)
  }
}

/**
 * Get provider information for UI display
 *
 * @param type - Provider type
 * @returns Provider metadata
 *
 * @example
 * ```typescript
 * const info = getProviderInfo('openrouter');
 * console.log(info.name); // "OpenRouter"
 * console.log(info.isFree); // true
 * ```
 */
export function getProviderInfo(type: ProviderType): ProviderInfo {
  return PROVIDER_REGISTRY[type]
}

/**
 * Get all available provider types
 *
 * @returns Array of provider types
 *
 * @example
 * ```typescript
 * const types = getAvailableProviders();
 * // ['openrouter', 'anthropic', 'openai', 'google', 'ollama']
 * ```
 */
export function getAvailableProviders(): ProviderType[] {
  return Object.keys(PROVIDER_REGISTRY) as ProviderType[]
}

/**
 * Get all provider information for UI display
 *
 * @returns Array of provider metadata
 *
 * @example
 * ```typescript
 * const providers = getAllProviderInfo();
 * providers.forEach(p => {
 *   console.log(`${p.name}: ${p.description}`);
 * });
 * ```
 */
export function getAllProviderInfo(): ProviderInfo[] {
  return Object.values(PROVIDER_REGISTRY)
}

/**
 * Get default configuration for a provider type
 *
 * @param type - Provider type
 * @returns Default configuration (without API key)
 *
 * @example
 * ```typescript
 * const config = getDefaultConfig('anthropic');
 * console.log(config.model); // "claude-3-5-sonnet-20241022"
 * ```
 */
export function getDefaultConfig(type: ProviderType): Omit<ProviderConfig, 'apiKey'> {
  return DEFAULT_PROVIDER_CONFIGS[type]
}

/**
 * Check if a provider requires an API key
 *
 * @param type - Provider type
 * @returns True if API key is required
 *
 * @example
 * ```typescript
 * requiresApiKey('openrouter'); // false (free tier available)
 * requiresApiKey('anthropic'); // true
 * ```
 */
export function requiresApiKey(type: ProviderType): boolean {
  return PROVIDER_REGISTRY[type].requiresApiKey
}

/**
 * Check if a provider is free to use
 *
 * @param type - Provider type
 * @returns True if provider has free tier or is completely free
 *
 * @example
 * ```typescript
 * isFreeProvider('openrouter'); // true (free tier)
 * isFreeProvider('ollama'); // true (local, always free)
 * isFreeProvider('anthropic'); // false (requires paid API key)
 * ```
 */
export function isFreeProvider(type: ProviderType): boolean {
  return PROVIDER_REGISTRY[type].isFree
}

/**
 * Get recommended provider for new users
 *
 * Returns OpenRouter as it has a free tier and works without API key.
 *
 * @returns Recommended provider type
 */
export function getRecommendedProvider(): ProviderType {
  return 'openrouter'
}

/**
 * Validate provider configuration
 *
 * Checks if the configuration is valid for the provider type.
 *
 * @param config - Provider configuration
 * @returns Validation result with error message if invalid
 *
 * @example
 * ```typescript
 * const result = validateProviderConfig({
 *   type: 'anthropic',
 *   model: 'claude-3-5-sonnet-20241022',
 *   // Missing API key!
 * });
 *
 * if (!result.valid) {
 *   console.error(result.error);
 * }
 * ```
 */
export function validateProviderConfig(config: ProviderConfig): {
  valid: boolean
  error?: string
} {
  const info = getProviderInfo(config.type)

  // Check if API key is required but missing
  if (info.requiresApiKey && !config.apiKey) {
    return {
      valid: false,
      error: `API key is required for ${info.name}`,
    }
  }

  // Check if model is specified
  if (!config.model) {
    return {
      valid: false,
      error: 'Model must be specified',
    }
  }

  // Check temperature range
  if (config.temperature !== undefined) {
    if (config.temperature < 0 || config.temperature > 2) {
      return {
        valid: false,
        error: 'Temperature must be between 0 and 2',
      }
    }
  }

  // Check max tokens
  if (config.maxTokens !== undefined) {
    if (config.maxTokens < 1) {
      return {
        valid: false,
        error: 'Max tokens must be at least 1',
      }
    }
  }

  return { valid: true }
}

/**
 * Create a provider with default configuration
 *
 * Convenience function that creates a provider with default settings.
 *
 * @param type - Provider type
 * @param apiKey - Optional API key (required for some providers)
 * @returns Provider instance
 *
 * @example
 * ```typescript
 * // Create OpenRouter with defaults (no API key needed)
 * const provider = createDefaultProvider('openrouter');
 *
 * // Create Anthropic with defaults (API key required)
 * const provider = createDefaultProvider('anthropic', 'sk-ant-...');
 * ```
 */
export function createDefaultProvider(type: ProviderType, apiKey?: string): Provider {
  const defaultConfig = getDefaultConfig(type)

  return createProvider({
    ...defaultConfig,
    apiKey,
  })
}
