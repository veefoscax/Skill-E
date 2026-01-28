/**
 * Ollama Provider
 * 
 * Implementation for Ollama local LLM server.
 * Runs models locally with OpenAI-compatible API.
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
 * Ollama Local LLM Provider
 */
export class OllamaProvider extends BaseLLMProvider {
  constructor(config: ProviderConfig) {
    super(config);
  }
  
  /**
   * Build request headers
   */
  protected buildHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
    };
  }
  
  /**
   * Build request body for Ollama API
   */
  protected buildRequestBody(
    prompt: string,
    options: GenerateOptions
  ): Record<string, unknown> {
    return {
      model: options.model,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      stream: false,
      options: {
        temperature: options.temperature ?? 0.3,
        num_predict: options.maxTokens || 4000,
        ...(options.topP !== undefined && { top_p: options.topP }),
        ...(options.stopSequences && { stop: options.stopSequences }),
      },
    };
  }
  
  /**
   * Generate text completion
   */
  async generate(prompt: string, options: GenerateOptions): Promise<GenerationResult> {
    const startTime = Date.now();
    
    const body = this.buildRequestBody(prompt, options);
    const response = await this.makeRequest('/chat', body);
    const text = this.extractTextFromResponse(response);
    
    return this.createResult(text, options.model, startTime, response);
  }
  
  /**
   * Stream text generation
   */
  async stream(prompt: string, options: StreamOptions): Promise<void> {
    const body = {
      model: options.model,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      stream: true,
      options: {
        temperature: options.temperature ?? 0.3,
        num_predict: options.maxTokens || 4000,
        ...(options.topP !== undefined && { top_p: options.topP }),
      },
    };
    
    const url = `${this.config.baseUrl}/chat`;
    const headers = this.buildHeaders();
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ollama streaming error (${response.status}): ${errorText}`);
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
          try {
            const parsed = JSON.parse(line);
            
            // Ollama streaming format:
            // message.content (accumulated) or message.content delta
            if (parsed.message?.content) {
              options.onChunk(parsed.message.content);
            }
            
            // Check if done
            if (parsed.done) {
              options.onComplete?.();
              return;
            }
          } catch (e) {
            // Skip invalid JSON
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
   * List available models from Ollama server
   */
  async listModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.config.baseUrl}/tags`);
      
      if (!response.ok) {
        return this.config.availableModels;
      }
      
      const data = await response.json() as { models?: Array<{ name: string }> };
      return data.models?.map(m => m.name) || this.config.availableModels;
    } catch (error) {
      console.warn('Failed to list Ollama models:', error);
      return this.config.availableModels;
    }
  }
  
  /**
   * Pull a model from Ollama registry
   */
  async pullModel(modelName: string, onProgress?: (progress: number) => void): Promise<void> {
    const response = await fetch(`${this.config.baseUrl}/pull`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: modelName }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to pull model ${modelName}: ${response.statusText}`);
    }
    
    if (!response.body || !onProgress) {
      return;
    }
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(l => l.trim());
        
        for (const line of lines) {
          try {
            const parsed = JSON.parse(line);
            if (parsed.completed !== undefined && parsed.total) {
              onProgress(parsed.completed / parsed.total);
            }
          } catch {
            // Ignore parse errors
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
  
  /**
   * Validate configuration
   */
  async validate(): Promise<boolean> {
    try {
      // Check if Ollama server is running
      const response = await fetch(`${this.config.baseUrl}/tags`, {
        method: 'GET',
      });
      
      if (!response.ok) {
        return false;
      }
      
      // Check if default model is available
      const data = await response.json() as { models?: Array<{ name: string }> };
      const models = data.models?.map(m => m.name) || [];
      
      return models.includes(this.config.defaultModel);
    } catch (error) {
      console.error('Ollama validation failed:', error);
      return false;
    }
  }
  
  /**
   * Get provider metadata
   */
  getMetadata() {
    return {
      id: 'ollama' as LLMProvider,
      name: 'Ollama (Local)',
      description: 'Run LLMs locally on your machine',
      website: 'https://ollama.com',
      docsUrl: 'https://github.com/ollama/ollama/blob/main/docs/api.md',
      requiresApiKey: false,
      hasFreeTier: true,
      popularModels: [
        'llama3.1',
        'llama3',
        'mistral',
        'codellama',
        'qwen2',
        'gemma2',
        'phi3',
      ],
      features: [
        'Local execution',
        'Privacy focused',
        'No API costs',
        'Custom models',
        'Open source',
      ],
    };
  }
}
