/**
 * Base LLM Provider
 * 
 * Abstract base class that all LLM providers must extend.
 * Provides common functionality for API calls, response parsing,
 * and error handling.
 */

import type {
  ILLMProvider,
  ProviderConfig,
  GenerateOptions,
  StreamOptions,
  GenerationResult,
  LLMProvider,
} from './types';

/**
 * Abstract base class for LLM providers
 */
export abstract class BaseLLMProvider implements ILLMProvider {
  readonly config: ProviderConfig;
  
  constructor(config: ProviderConfig) {
    this.config = config;
  }
  
  /**
   * Generate text completion
   * Must be implemented by subclasses
   */
  abstract generate(prompt: string, options: GenerateOptions): Promise<GenerationResult>;
  
  /**
   * Generate with streaming
   * Default implementation falls back to non-streaming
   */
  async stream(prompt: string, options: StreamOptions): Promise<void> {
    if (!this.config.supportsStreaming) {
      throw new Error(`Provider ${this.config.name} does not support streaming`);
    }
    
    // Default implementation: collect all and call onChunk with full text
    const result = await this.generate(prompt, options);
    
    // Simulate streaming by sending word by word
    const words = result.text.split(' ');
    for (const word of words) {
      options.onChunk(word + ' ');
    }
    
    options.onComplete?.();
  }
  
  /**
   * Get available models
   */
  getModels(): string[] {
    return this.config.availableModels;
  }
  
  /**
   * Validate configuration
   * Checks if API key is present and non-empty
   */
  async validate(): Promise<boolean> {
    if (!this.config.apiKey || this.config.apiKey.trim() === '') {
      return false;
    }
    
    try {
      // Try a simple request to validate
      await this.generate('Hello', {
        model: this.config.defaultModel,
        maxTokens: 5,
      });
      return true;
    } catch (error) {
      console.error(`Provider ${this.config.name} validation failed:`, error);
      return false;
    }
  }
  
  /**
   * Stream generator for response body
   * Converts ReadableStream into async generator
   */
  protected async *streamGenerator(response: Response): AsyncGenerator<string> {
    if (!response.body) {
      return;
    }
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        yield decoder.decode(value, { stream: true });
      }
    } finally {
      reader.releaseLock();
    }
  }
  
  /**
   * Get provider metadata
   * Must be implemented by subclasses
   */
  abstract getMetadata(): {
    id: LLMProvider;
    name: string;
    description: string;
    website: string;
    docsUrl: string;
    requiresApiKey: boolean;
    hasFreeTier: boolean;
    popularModels: string[];
    features: string[];
  };
  
  /**
   * Build request headers
   * Can be overridden by subclasses for provider-specific headers
   */
  protected buildHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      ...this.config.headers,
    };
  }
  
  /**
   * Build request body
   * Can be overridden by subclasses for provider-specific formats
   */
  protected buildRequestBody(
    _prompt: string, 
    options: GenerateOptions
  ): Record<string, unknown> {
    // Map parameter names if needed
    const maxTokensKey = this.config.parameterMapping?.maxTokens || 'max_tokens';
    const temperatureKey = this.config.parameterMapping?.temperature || 'temperature';
    const topPKey = this.config.parameterMapping?.topP || 'top_p';
    
    return {
      model: options.model,
      [maxTokensKey]: options.maxTokens || 2000,
      [temperatureKey]: options.temperature ?? 0.3,
      ...(options.topP !== undefined && { [topPKey]: options.topP }),
      ...(options.stopSequences && { stop: options.stopSequences }),
    };
  }
  
  /**
   * Extract text from response using responsePath
   * Uses dot notation (e.g., "choices.0.message.content")
   */
  protected extractTextFromResponse(response: Record<string, unknown>): string {
    const path = this.config.responsePath.split('.');
    let current: unknown = response;
    
    for (const key of path) {
      if (current === null || current === undefined) {
        throw new Error(`Invalid response path: ${this.config.responsePath}`);
      }
      
      if (Array.isArray(current)) {
        const index = parseInt(key, 10);
        if (isNaN(index)) {
          throw new Error(`Invalid array index in path: ${key}`);
        }
        current = current[index];
      } else if (typeof current === 'object') {
        current = (current as Record<string, unknown>)[key];
      } else {
        throw new Error(`Cannot traverse path at key: ${key}`);
      }
    }
    
    if (typeof current !== 'string') {
      throw new Error(`Expected string at path ${this.config.responsePath}, got ${typeof current}`);
    }
    
    return current;
  }
  
  /**
   * Extract token usage from response
   */
  protected extractUsage(response: Record<string, unknown>): GenerationResult['usage'] {
    if (!this.config.usagePath) {
      return undefined;
    }
    
    const path = this.config.usagePath.split('.');
    let current: unknown = response;
    
    for (const key of path) {
      if (current === null || current === undefined) {
        return undefined;
      }
      current = (current as Record<string, unknown>)[key];
    }
    
    if (typeof current !== 'object' || current === null) {
      return undefined;
    }
    
    const usage = current as Record<string, number>;
    return {
      promptTokens: usage.prompt_tokens || usage.promptTokens || 0,
      completionTokens: usage.completion_tokens || usage.completionTokens || 0,
      totalTokens: usage.total_tokens || usage.totalTokens || 
        (usage.prompt_tokens || 0) + (usage.completion_tokens || 0),
    };
  }
  
  /**
   * Make API request with error handling
   */
  protected async makeRequest(
    endpoint: string,
    body: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    const url = `${this.config.baseUrl}${endpoint}`;
    const headers = this.buildHeaders();
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`${this.config.name} API error (${response.status}): ${errorText}`);
    }
    
    return await response.json() as Record<string, unknown>;
  }
  
  /**
   * Create generation result
   */
  protected createResult(
    text: string,
    model: string,
    startTime: number,
    response?: Record<string, unknown>
  ): GenerationResult {
    return {
      text,
      model,
      provider: this.config.name,
      generationTimeMs: Date.now() - startTime,
      ...(response && { usage: this.extractUsage(response) }),
    };
  }
}
