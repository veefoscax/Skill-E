/**
 * OpenAI-Compatible Provider Base
 * 
 * Base class for providers that use OpenAI-compatible API format.
 * This includes OpenAI itself, OpenRouter, Zifu AI, Kimi, and many others.
 */

import { BaseLLMProvider } from '../base-provider';
import type {
  ProviderConfig,
  GenerateOptions,
  StreamOptions,
  GenerationResult,
  LLMProvider,
} from '../types';

/**
 * Base class for OpenAI-compatible providers
 */
export class OpenAICompatibleProvider extends BaseLLMProvider {
  constructor(config: ProviderConfig) {
    super(config);
  }
  
  /**
   * Build request body for OpenAI-compatible API
   */
  protected buildRequestBody(
    prompt: string,
    options: GenerateOptions
  ): Record<string, unknown> {
    const base = super.buildRequestBody(prompt, options);
    
    return {
      ...base,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    };
  }
  
  /**
   * Generate text completion
   */
  async generate(prompt: string, options: GenerateOptions): Promise<GenerationResult> {
    const startTime = Date.now();
    
    const body = this.buildRequestBody(prompt, options);
    const response = await this.makeRequest('/chat/completions', body);
    
    const text = this.extractTextFromResponse(response);
    
    return this.createResult(text, options.model, startTime, response);
  }
  
  /**
   * Stream text generation
   */
  async stream(prompt: string, options: StreamOptions): Promise<void> {
    if (!this.config.supportsStreaming) {
      // Fall back to non-streaming
      const result = await this.generate(prompt, options);
      options.onChunk(result.text);
      options.onComplete?.();
      return;
    }
    
    const body = {
      ...this.buildRequestBody(prompt, options),
      stream: true,
    };
    
    const url = `${this.config.baseUrl}/chat/completions`;
    const headers = this.buildHeaders();
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`${this.config.name} streaming error (${response.status}): ${errorText}`);
    }
    
    if (!response.body) {
      throw new Error('No response body for streaming');
    }
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.trim() !== '');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (data === '[DONE]') {
              options.onComplete?.();
              return;
            }
            
            try {
              const parsed = JSON.parse(data);
              const content = this.extractStreamChunk(parsed);
              if (content) {
                options.onChunk(content);
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      options.onError?.(error as Error);
      throw error;
    } finally {
      reader.releaseLock();
    }
    
    options.onComplete?.();
  }
  
  /**
   * Extract content from streaming chunk
   * Override if provider uses different format
   */
  protected extractStreamChunk(chunk: Record<string, unknown>): string | null {
    const choices = chunk.choices as Array<Record<string, unknown>> | undefined;
    if (!choices || choices.length === 0) return null;
    
    const delta = choices[0].delta as Record<string, unknown> | undefined;
    if (!delta) return null;
    
    const content = delta.content as string | undefined;
    return content || null;
  }
  
  /**
   * Get metadata - must be overridden by subclasses
   */
  getMetadata(): {
    id: LLMProvider;
    name: string;
    description: string;
    website: string;
    docsUrl: string;
    requiresApiKey: boolean;
    hasFreeTier: boolean;
    popularModels: string[];
    features: string[];
  } {
    throw new Error('getMetadata must be implemented by subclass');
  }
}

/**
 * OpenAI Provider
 */
export class OpenAIProvider extends OpenAICompatibleProvider {
  getMetadata() {
    return {
      id: 'openai' as LLMProvider,
      name: 'OpenAI',
      description: 'GPT-4 and GPT-3.5 models from OpenAI',
      website: 'https://openai.com',
      docsUrl: 'https://platform.openai.com/docs',
      requiresApiKey: true,
      hasFreeTier: false,
      popularModels: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
      features: ['Streaming', 'Function calling', 'JSON mode'],
    };
  }
}

/**
 * OpenRouter Provider
 */
export class OpenRouterProvider extends OpenAICompatibleProvider {
  protected buildHeaders(): Record<string, string> {
    return {
      ...super.buildHeaders(),
      'Authorization': `Bearer ${this.config.apiKey}`,
      'HTTP-Referer': 'https://skill-e.app',
      'X-Title': 'Skill-E',
    };
  }
  
  getMetadata() {
    return {
      id: 'openrouter' as LLMProvider,
      name: 'OpenRouter',
      description: 'Unified API for multiple LLM providers',
      website: 'https://openrouter.ai',
      docsUrl: 'https://openrouter.ai/docs',
      requiresApiKey: true,
      hasFreeTier: true,
      popularModels: [
        'anthropic/claude-3.5-sonnet',
        'openai/gpt-4o',
        'meta-llama/llama-3.1-70b',
        'google/gemini-pro',
      ],
      features: ['Streaming', 'Multi-provider', 'Free tier'],
    };
  }
}

/**
 * Zhipu AI Provider (GLM models)
 * 
 * Zhipu AI (智谱AI) provides GLM-4, GLM-4V, and other models.
 * Platform: https://z.ai (Worldwide) or https://open.bigmodel.cn (China)
 * 
 * Note: Zhipu uses OpenAI-compatible API format.
 */
export class ZhipuProvider extends OpenAICompatibleProvider {
  protected buildHeaders(): Record<string, string> {
    return {
      ...super.buildHeaders(),
      'Authorization': `Bearer ${this.config.apiKey}`,
    };
  }
  
  getMetadata() {
    return {
      id: 'zhipu' as LLMProvider,
      name: 'Zhipu AI (GLM-4)',
      description: 'GLM-4, GLM-4V, and GLM-3 models from Zhipu AI (智谱AI)',
      website: 'https://z.ai',
      docsUrl: 'https://docs.z.ai',
      requiresApiKey: true,
      hasFreeTier: true,
      popularModels: ['glm-4', 'glm-4v', 'glm-4-air', 'glm-3-turbo'],
      features: ['Streaming', 'Vision (GLM-4V)', 'Chinese optimized', 'Long context'],
    };
  }
}

/**
 * Moonshot AI Provider (Kimi)
 * 
 * Moonshot AI provides Kimi models with long context support.
 * Platform: https://platform.moonshot.cn (China) or https://www.moonshot.ai (Global)
 * 
 * Note: Moonshot uses OpenAI-compatible API format.
 */
export class MoonshotProvider extends OpenAICompatibleProvider {
  protected buildHeaders(): Record<string, string> {
    return {
      ...super.buildHeaders(),
      'Authorization': `Bearer ${this.config.apiKey}`,
    };
  }
  
  getMetadata() {
    return {
      id: 'moonshot' as LLMProvider,
      name: 'Moonshot AI (Kimi)',
      description: 'Kimi K2 models with 256K context and tool calling support',
      website: 'https://www.moonshot.cn',
      docsUrl: 'https://platform.moonshot.cn/docs',
      requiresApiKey: true,
      hasFreeTier: true,
      popularModels: [
        'moonshot-v1-8k', 
        'moonshot-v1-32k', 
        'moonshot-v1-128k',
        'kimi-k2-0711-preview'
      ],
      features: ['Streaming', '256K context', 'Tool calling', 'Code optimized'],
    };
  }
}
