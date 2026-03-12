/**
 * LLM Provider Factory
 *
 * Creates provider instances based on configuration.
 * Supports: Anthropic, OpenAI, OpenRouter, Zifu AI, Kimi, Google, Ollama
 */

import { AnthropicProvider } from './providers/anthropic'
import {
  OpenAIProvider,
  OpenRouterProvider,
  ZhipuProvider,
  MoonshotProvider,
} from './providers/openai-compatible'
import { GoogleProvider } from './providers/google'
import { OllamaProvider } from './providers/ollama'
import type { ILLMProvider, ProviderConfig, LLMProvider } from './types'
import { PROVIDER_BASE_URLS, DEFAULT_MODELS, PROVIDER_DISPLAY_NAMES } from './types'

/**
 * Create a provider instance
 */
export function createProvider(config: ProviderConfig): ILLMProvider {
  switch (config.name) {
    case 'anthropic':
      return new AnthropicProvider(config)
    case 'openai':
      return new OpenAIProvider(config)
    case 'openrouter':
      return new OpenRouterProvider(config)
    case 'zhipu':
      return new ZhipuProvider(config)
    case 'moonshot':
      return new MoonshotProvider(config)
    case 'google':
      return new GoogleProvider(config)
    case 'ollama':
      return new OllamaProvider(config)
    default:
      throw new Error(`Unknown provider: ${config.name}`)
  }
}

/**
 * Create provider with minimal configuration
 */
export function createProviderSimple(
  provider: LLMProvider,
  apiKey: string,
  customBaseUrl?: string
): ILLMProvider {
  const config: ProviderConfig = {
    name: provider,
    displayName: PROVIDER_DISPLAY_NAMES[provider],
    baseUrl: customBaseUrl || PROVIDER_BASE_URLS[provider],
    apiKey,
    defaultModel: DEFAULT_MODELS[provider],
    availableModels: getDefaultModels(provider),
    supportsStreaming: true,
    responsePath: getDefaultResponsePath(provider),
    usagePath: getDefaultUsagePath(provider),
  }

  return createProvider(config)
}

/**
 * Get default models for provider
 */
function getDefaultModels(provider: LLMProvider): string[] {
  switch (provider) {
    case 'anthropic':
      return [
        'claude-3-5-sonnet-20241022',
        'claude-3-opus-20240229',
        'claude-3-sonnet-20240229',
        'claude-3-haiku-20240307',
      ]
    case 'openai':
      return ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo']
    case 'openrouter':
      return [
        'anthropic/claude-3.5-sonnet',
        'openai/gpt-4o',
        'meta-llama/llama-3.1-70b-instruct',
        'google/gemini-pro',
        'deepseek/deepseek-chat',
      ]
    case 'zhipu':
      return ['glm-4', 'glm-4v', 'glm-4-air', 'glm-3-turbo', 'chatglm_pro', 'chatglm_std']
    case 'moonshot':
      return ['moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k', 'kimi-k2-0711-preview']
    case 'google':
      return ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-pro']
    case 'ollama':
      return ['llama3.1', 'llama3', 'mistral', 'codellama', 'qwen2']
    default:
      return []
  }
}

/**
 * Get default response path for provider
 */
function getDefaultResponsePath(provider: LLMProvider): string {
  switch (provider) {
    case 'anthropic':
      return 'content.0.text'
    case 'openai':
    case 'openrouter':
    case 'zhipu':
    case 'moonshot':
      return 'choices.0.message.content'
    case 'google':
      return 'candidates.0.content.parts.0.text'
    case 'ollama':
      return 'message.content'
    default:
      return 'choices.0.message.content'
  }
}

/**
 * Get default usage path for provider
 */
function getDefaultUsagePath(provider: LLMProvider): string | undefined {
  switch (provider) {
    case 'anthropic':
      return 'usage'
    case 'openai':
    case 'openrouter':
    case 'zhipu':
    case 'moonshot':
      return 'usage'
    default:
      return undefined
  }
}

/**
 * Get all available providers
 */
export function getAvailableProviders(): LLMProvider[] {
  return ['anthropic', 'openai', 'openrouter', 'zhipu', 'moonshot', 'google', 'ollama']
}

/**
 * Get provider info without creating instance
 */
export function getProviderInfo(provider: LLMProvider) {
  return {
    id: provider,
    name: PROVIDER_DISPLAY_NAMES[provider],
    baseUrl: PROVIDER_BASE_URLS[provider],
    defaultModel: DEFAULT_MODELS[provider],
    models: getDefaultModels(provider),
  }
}

/**
 * Validate provider configuration
 */
export async function validateProvider(
  provider: LLMProvider,
  apiKey: string,
  customBaseUrl?: string
): Promise<boolean> {
  try {
    const instance = createProviderSimple(provider, apiKey, customBaseUrl)
    return await instance.validate()
  } catch (error) {
    console.error(`Provider validation failed for ${provider}:`, error)
    return false
  }
}
