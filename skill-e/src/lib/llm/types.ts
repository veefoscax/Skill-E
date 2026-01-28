/**
 * LLM Provider Types
 * 
 * Type definitions for the multi-provider LLM architecture.
 * Supports Anthropic, OpenAI, OpenRouter, Zifu AI, Kimi, Google, and Ollama.
 */

/**
 * Supported LLM providers
 */
export type LLMProvider = 
  | 'anthropic'
  | 'openai'
  | 'openrouter'
  | 'zhipu'
  | 'moonshot'
  | 'google'
  | 'ollama';

/**
 * Generation options
 */
export interface GenerateOptions {
  /** Model to use */
  model: string;
  /** Maximum tokens to generate */
  maxTokens?: number;
  /** Temperature (0-2) */
  temperature?: number;
  /** Top-p sampling */
  topP?: number;
  /** Stop sequences */
  stopSequences?: string[];
}

/**
 * Streaming options
 */
export interface StreamOptions extends GenerateOptions {
  /** Callback for each chunk */
  onChunk: (chunk: string) => void;
  /** Callback when complete */
  onComplete?: () => void;
  /** Callback on error */
  onError?: (error: Error) => void;
}

/**
 * Generation result
 */
export interface GenerationResult {
  /** Generated text */
  text: string;
  /** Token usage (if available) */
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  /** Model used */
  model: string;
  /** Provider used */
  provider: LLMProvider;
  /** Generation time in ms */
  generationTimeMs: number;
}

/**
 * Provider configuration
 */
export interface ProviderConfig {
  /** Provider name */
  name: LLMProvider;
  /** Display name */
  displayName: string;
  /** Base URL for API */
  baseUrl: string;
  /** API key */
  apiKey: string;
  /** Default model */
  defaultModel: string;
  /** Available models */
  availableModels: string[];
  /** Whether streaming is supported */
  supportsStreaming: boolean;
  /** Custom headers */
  headers?: Record<string, string>;
  /** Parameter name mappings (provider-specific -> standard) */
  parameterMapping?: {
    maxTokens?: string;
    temperature?: string;
    topP?: string;
  };
  /** Response path to extract text (dot notation) */
  responsePath: string;
  /** Usage path to extract token counts (dot notation) */
  usagePath?: string;
}

/**
 * Provider metadata
 */
export interface ProviderMetadata {
  /** Provider ID */
  id: LLMProvider;
  /** Display name */
  name: string;
  /** Provider description */
  description: string;
  /** Website URL */
  website: string;
  /** Documentation URL */
  docsUrl: string;
  /** Whether API key is required */
  requiresApiKey: boolean;
  /** Whether it has a free tier */
  hasFreeTier: boolean;
  /** Popular models */
  popularModels: string[];
  /** Special features */
  features: string[];
}

/**
 * LLM Provider interface
 * All providers must implement this interface
 */
export interface ILLMProvider {
  /** Provider configuration */
  readonly config: ProviderConfig;
  
  /** Generate text completion */
  generate(prompt: string, options: GenerateOptions): Promise<GenerationResult>;
  
  /** Generate with streaming */
  stream(prompt: string, options: StreamOptions): Promise<void>;
  
  /** Get available models */
  getModels(): string[];
  
  /** Validate configuration */
  validate(): Promise<boolean>;
  
  /** Get provider metadata */
  getMetadata(): ProviderMetadata;
}

/**
 * Provider factory function type
 */
export type ProviderFactory = (config: ProviderConfig) => ILLMProvider;

/**
 * Map of provider IDs to their display names
 */
export const PROVIDER_DISPLAY_NAMES: Record<LLMProvider, string> = {
  anthropic: 'Anthropic (Claude)',
  openai: 'OpenAI (GPT)',
  openrouter: 'OpenRouter',
  zhipu: 'Zhipu AI (GLM-4)',
  moonshot: 'Moonshot AI (Kimi)',
  google: 'Google (Gemini)',
  ollama: 'Ollama (Local)',
};

/**
 * Default models per provider
 */
export const DEFAULT_MODELS: Record<LLMProvider, string> = {
  anthropic: 'claude-3-5-sonnet-20241022',
  openai: 'gpt-4o',
  openrouter: 'anthropic/claude-3.5-sonnet',
  zhipu: 'glm-4',
  moonshot: 'moonshot-v1-8k',
  google: 'gemini-1.5-pro',
  ollama: 'llama3.1',
};

/**
 * Base URLs for providers
 */
export const PROVIDER_BASE_URLS: Record<LLMProvider, string> = {
  anthropic: 'https://api.anthropic.com/v1',
  openai: 'https://api.openai.com/v1',
  openrouter: 'https://openrouter.ai/api/v1',
  zhipu: 'https://api.z.ai/v1',
  moonshot: 'https://api.moonshot.ai/v1',
  google: 'https://generativelanguage.googleapis.com/v1beta',
  ollama: 'http://localhost:11434/api',
};
