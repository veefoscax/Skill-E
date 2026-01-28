/**
 * LLM Provider System
 * 
 * Multi-provider LLM integration supporting:
 * - Anthropic (Claude)
 * - OpenAI (GPT)
 * - OpenRouter
 * - Zifu AI (GLM)
 * - Kimi Code (Moonshot)
 * - Google (Gemini) - TODO
 * - Ollama (Local) - TODO
 * 
 * @example
 * ```typescript
 * import { createProviderSimple, validateProvider } from '@/lib/llm';
 * 
 * // Create provider
 * const provider = createProviderSimple('anthropic', 'sk-...');
 * 
 * // Generate
 * const result = await provider.generate('Hello', {
 *   model: 'claude-3-5-sonnet-20241022',
 *   maxTokens: 1000,
 * });
 * 
 * // Stream
 * await provider.stream('Hello', {
 *   model: 'claude-3-5-sonnet-20241022',
 *   onChunk: (chunk) => console.log(chunk),
 *   onComplete: () => console.log('Done'),
 * });
 * ```
 */

export { BaseLLMProvider } from './base-provider';
export { AnthropicProvider } from './providers/anthropic';
export {
  OpenAIProvider,
  OpenRouterProvider,
  ZhipuProvider,
  MoonshotProvider,
} from './providers/openai-compatible';
export {
  createProvider,
  createProviderSimple,
  getAvailableProviders,
  getProviderInfo,
  validateProvider,
} from './factory';
export type {
  LLMProvider,
  ILLMProvider,
  ProviderConfig,
  GenerateOptions,
  StreamOptions,
  GenerationResult,
  ProviderMetadata,
} from './types';
export {
  PROVIDER_DISPLAY_NAMES,
  DEFAULT_MODELS,
  PROVIDER_BASE_URLS,
} from './types';
