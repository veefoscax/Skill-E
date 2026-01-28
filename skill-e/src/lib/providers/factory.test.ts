/**
 * S08: LLM Providers - Provider Factory Tests
 * 
 * Tests for the provider factory and registry functions.
 * 
 * Requirements: FR-8.2
 */

import { describe, it, expect } from 'vitest';
import {
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
} from './factory';
import { OpenRouterProvider } from './openrouter';
import { AnthropicProvider } from './anthropic';
import { OpenAIProvider } from './openai';
import { GoogleProvider } from './google';
import { OllamaProvider } from './ollama';
import type { ProviderType } from './types';

describe('Provider Factory', () => {
  describe('PROVIDER_REGISTRY', () => {
    it('should have exactly 5 providers', () => {
      const providers = Object.keys(PROVIDER_REGISTRY);
      expect(providers).toHaveLength(5);
      expect(providers).toEqual([
        'openrouter',
        'anthropic',
        'openai',
        'google',
        'ollama',
      ]);
    });

    it('should have complete metadata for each provider', () => {
      Object.values(PROVIDER_REGISTRY).forEach(info => {
        expect(info.type).toBeDefined();
        expect(info.name).toBeDefined();
        expect(info.description).toBeDefined();
        expect(typeof info.requiresApiKey).toBe('boolean');
        expect(typeof info.supportsStreaming).toBe('boolean');
        expect(typeof info.isFree).toBe('boolean');
      });
    });

    it('should mark OpenRouter and Ollama as free', () => {
      expect(PROVIDER_REGISTRY.openrouter.isFree).toBe(true);
      expect(PROVIDER_REGISTRY.ollama.isFree).toBe(true);
    });

    it('should mark paid providers correctly', () => {
      expect(PROVIDER_REGISTRY.anthropic.isFree).toBe(false);
      expect(PROVIDER_REGISTRY.openai.isFree).toBe(false);
      expect(PROVIDER_REGISTRY.google.isFree).toBe(false);
    });

    it('should mark API key requirements correctly', () => {
      expect(PROVIDER_REGISTRY.openrouter.requiresApiKey).toBe(false);
      expect(PROVIDER_REGISTRY.ollama.requiresApiKey).toBe(false);
      expect(PROVIDER_REGISTRY.anthropic.requiresApiKey).toBe(true);
      expect(PROVIDER_REGISTRY.openai.requiresApiKey).toBe(true);
      expect(PROVIDER_REGISTRY.google.requiresApiKey).toBe(true);
    });

    it('should mark all providers as supporting streaming', () => {
      Object.values(PROVIDER_REGISTRY).forEach(info => {
        expect(info.supportsStreaming).toBe(true);
      });
    });
  });

  describe('DEFAULT_PROVIDER_CONFIGS', () => {
    it('should have default config for all 5 providers', () => {
      const configs = Object.keys(DEFAULT_PROVIDER_CONFIGS);
      expect(configs).toHaveLength(5);
    });

    it('should have valid default models', () => {
      Object.values(DEFAULT_PROVIDER_CONFIGS).forEach(config => {
        expect(config.model).toBeDefined();
        expect(config.model.length).toBeGreaterThan(0);
      });
    });

    it('should have reasonable default temperature', () => {
      Object.values(DEFAULT_PROVIDER_CONFIGS).forEach(config => {
        expect(config.temperature).toBe(0.7);
      });
    });

    it('should have reasonable default max tokens', () => {
      Object.values(DEFAULT_PROVIDER_CONFIGS).forEach(config => {
        expect(config.maxTokens).toBeGreaterThan(0);
        expect(config.maxTokens).toBeLessThanOrEqual(8192);
      });
    });

    it('should include baseUrl for Ollama', () => {
      expect(DEFAULT_PROVIDER_CONFIGS.ollama.baseUrl).toBe('http://localhost:11434');
    });
  });

  describe('createProvider', () => {
    it('should create OpenRouter provider', () => {
      const provider = createProvider({
        type: 'openrouter',
        model: 'google/gemma-2-9b-it:free',
      });

      expect(provider).toBeInstanceOf(OpenRouterProvider);
      expect(provider.type).toBe('openrouter');
      expect(provider.name).toBe('OpenRouter');
    });

    it('should create Anthropic provider', () => {
      const provider = createProvider({
        type: 'anthropic',
        apiKey: 'test-key',
        model: 'claude-3-5-sonnet-20241022',
      });

      expect(provider).toBeInstanceOf(AnthropicProvider);
      expect(provider.type).toBe('anthropic');
      expect(provider.name).toBe('Anthropic (Claude)');
    });

    it('should create OpenAI provider', () => {
      const provider = createProvider({
        type: 'openai',
        apiKey: 'test-key',
        model: 'gpt-4o',
      });

      expect(provider).toBeInstanceOf(OpenAIProvider);
      expect(provider.type).toBe('openai');
      expect(provider.name).toBe('OpenAI (GPT)');
    });

    it('should create Google provider', () => {
      const provider = createProvider({
        type: 'google',
        apiKey: 'test-key',
        model: 'gemini-1.5-pro-latest',
      });

      expect(provider).toBeInstanceOf(GoogleProvider);
      expect(provider.type).toBe('google');
      expect(provider.name).toBe('Google (Gemini)');
    });

    it('should create Ollama provider', () => {
      const provider = createProvider({
        type: 'ollama',
        model: 'llama3.1',
      });

      expect(provider).toBeInstanceOf(OllamaProvider);
      expect(provider.type).toBe('ollama');
      expect(provider.name).toBe('Ollama');
    });

    it('should pass API key to provider', () => {
      const provider = createProvider({
        type: 'anthropic',
        apiKey: 'test-api-key',
        model: 'claude-3-5-sonnet-20241022',
      });

      // API key is protected, but we can verify the provider was created
      expect(provider).toBeInstanceOf(AnthropicProvider);
    });

    it('should pass baseUrl to provider', () => {
      const provider = createProvider({
        type: 'ollama',
        baseUrl: 'http://custom:11434',
        model: 'llama3.1',
      });

      expect(provider).toBeInstanceOf(OllamaProvider);
    });
  });

  describe('getProviderInfo', () => {
    it('should return correct info for OpenRouter', () => {
      const info = getProviderInfo('openrouter');
      
      expect(info.type).toBe('openrouter');
      expect(info.name).toBe('OpenRouter');
      expect(info.requiresApiKey).toBe(false);
      expect(info.isFree).toBe(true);
    });

    it('should return correct info for Anthropic', () => {
      const info = getProviderInfo('anthropic');
      
      expect(info.type).toBe('anthropic');
      expect(info.name).toBe('Anthropic (Claude)');
      expect(info.requiresApiKey).toBe(true);
      expect(info.isFree).toBe(false);
    });

    it('should return correct info for all providers', () => {
      const types: ProviderType[] = ['openrouter', 'anthropic', 'openai', 'google', 'ollama'];
      
      types.forEach(type => {
        const info = getProviderInfo(type);
        expect(info.type).toBe(type);
        expect(info.name).toBeDefined();
      });
    });
  });

  describe('getAvailableProviders', () => {
    it('should return all 5 provider types', () => {
      const providers = getAvailableProviders();
      
      expect(providers).toHaveLength(5);
      expect(providers).toContain('openrouter');
      expect(providers).toContain('anthropic');
      expect(providers).toContain('openai');
      expect(providers).toContain('google');
      expect(providers).toContain('ollama');
    });
  });

  describe('getAllProviderInfo', () => {
    it('should return info for all 5 providers', () => {
      const infos = getAllProviderInfo();
      
      expect(infos).toHaveLength(5);
      
      const types = infos.map(i => i.type);
      expect(types).toContain('openrouter');
      expect(types).toContain('anthropic');
      expect(types).toContain('openai');
      expect(types).toContain('google');
      expect(types).toContain('ollama');
    });

    it('should return complete info objects', () => {
      const infos = getAllProviderInfo();
      
      infos.forEach(info => {
        expect(info.type).toBeDefined();
        expect(info.name).toBeDefined();
        expect(info.description).toBeDefined();
        expect(typeof info.requiresApiKey).toBe('boolean');
        expect(typeof info.supportsStreaming).toBe('boolean');
        expect(typeof info.isFree).toBe('boolean');
      });
    });
  });

  describe('getDefaultConfig', () => {
    it('should return default config for OpenRouter', () => {
      const config = getDefaultConfig('openrouter');
      
      expect(config.type).toBe('openrouter');
      expect(config.model).toBeDefined();
      expect(config.temperature).toBe(0.7);
    });

    it('should return default config for all providers', () => {
      const types: ProviderType[] = ['openrouter', 'anthropic', 'openai', 'google', 'ollama'];
      
      types.forEach(type => {
        const config = getDefaultConfig(type);
        expect(config.type).toBe(type);
        expect(config.model).toBeDefined();
      });
    });

    it('should not include API key in default config', () => {
      const config = getDefaultConfig('anthropic');
      
      expect('apiKey' in config).toBe(false);
    });
  });

  describe('requiresApiKey', () => {
    it('should return false for OpenRouter', () => {
      expect(requiresApiKey('openrouter')).toBe(false);
    });

    it('should return false for Ollama', () => {
      expect(requiresApiKey('ollama')).toBe(false);
    });

    it('should return true for Anthropic', () => {
      expect(requiresApiKey('anthropic')).toBe(true);
    });

    it('should return true for OpenAI', () => {
      expect(requiresApiKey('openai')).toBe(true);
    });

    it('should return true for Google', () => {
      expect(requiresApiKey('google')).toBe(true);
    });
  });

  describe('isFreeProvider', () => {
    it('should return true for OpenRouter', () => {
      expect(isFreeProvider('openrouter')).toBe(true);
    });

    it('should return true for Ollama', () => {
      expect(isFreeProvider('ollama')).toBe(true);
    });

    it('should return false for Anthropic', () => {
      expect(isFreeProvider('anthropic')).toBe(false);
    });

    it('should return false for OpenAI', () => {
      expect(isFreeProvider('openai')).toBe(false);
    });

    it('should return false for Google', () => {
      expect(isFreeProvider('google')).toBe(false);
    });
  });

  describe('getRecommendedProvider', () => {
    it('should recommend OpenRouter', () => {
      expect(getRecommendedProvider()).toBe('openrouter');
    });
  });

  describe('validateProviderConfig', () => {
    it('should validate OpenRouter config without API key', () => {
      const result = validateProviderConfig({
        type: 'openrouter',
        model: 'google/gemma-2-9b-it:free',
      });

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject Anthropic config without API key', () => {
      const result = validateProviderConfig({
        type: 'anthropic',
        model: 'claude-3-5-sonnet-20241022',
      });

      expect(result.valid).toBe(false);
      expect(result.error).toContain('API key is required');
    });

    it('should validate Anthropic config with API key', () => {
      const result = validateProviderConfig({
        type: 'anthropic',
        apiKey: 'test-key',
        model: 'claude-3-5-sonnet-20241022',
      });

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject config without model', () => {
      const result = validateProviderConfig({
        type: 'openrouter',
        model: '',
      });

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Model must be specified');
    });

    it('should reject invalid temperature (too low)', () => {
      const result = validateProviderConfig({
        type: 'openrouter',
        model: 'google/gemma-2-9b-it:free',
        temperature: -0.1,
      });

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Temperature must be between 0 and 2');
    });

    it('should reject invalid temperature (too high)', () => {
      const result = validateProviderConfig({
        type: 'openrouter',
        model: 'google/gemma-2-9b-it:free',
        temperature: 2.1,
      });

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Temperature must be between 0 and 2');
    });

    it('should accept valid temperature range', () => {
      const result1 = validateProviderConfig({
        type: 'openrouter',
        model: 'google/gemma-2-9b-it:free',
        temperature: 0,
      });
      expect(result1.valid).toBe(true);

      const result2 = validateProviderConfig({
        type: 'openrouter',
        model: 'google/gemma-2-9b-it:free',
        temperature: 1,
      });
      expect(result2.valid).toBe(true);

      const result3 = validateProviderConfig({
        type: 'openrouter',
        model: 'google/gemma-2-9b-it:free',
        temperature: 2,
      });
      expect(result3.valid).toBe(true);
    });

    it('should reject invalid max tokens', () => {
      const result = validateProviderConfig({
        type: 'openrouter',
        model: 'google/gemma-2-9b-it:free',
        maxTokens: 0,
      });

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Max tokens must be at least 1');
    });

    it('should accept valid max tokens', () => {
      const result = validateProviderConfig({
        type: 'openrouter',
        model: 'google/gemma-2-9b-it:free',
        maxTokens: 4096,
      });

      expect(result.valid).toBe(true);
    });
  });

  describe('createDefaultProvider', () => {
    it('should create OpenRouter with defaults', () => {
      const provider = createDefaultProvider('openrouter');

      expect(provider).toBeInstanceOf(OpenRouterProvider);
      expect(provider.type).toBe('openrouter');
    });

    it('should create Anthropic with defaults and API key', () => {
      const provider = createDefaultProvider('anthropic', 'test-key');

      expect(provider).toBeInstanceOf(AnthropicProvider);
      expect(provider.type).toBe('anthropic');
    });

    it('should create Ollama with defaults', () => {
      const provider = createDefaultProvider('ollama');

      expect(provider).toBeInstanceOf(OllamaProvider);
      expect(provider.type).toBe('ollama');
    });

    it('should create all providers with defaults', () => {
      const types: ProviderType[] = ['openrouter', 'anthropic', 'openai', 'google', 'ollama'];
      
      types.forEach(type => {
        const apiKey = requiresApiKey(type) ? 'test-key' : undefined;
        const provider = createDefaultProvider(type, apiKey);
        
        expect(provider.type).toBe(type);
      });
    });
  });

  describe('Integration', () => {
    it('should create and use provider from registry info', () => {
      const info = getProviderInfo('openrouter');
      const config = getDefaultConfig(info.type);
      const provider = createProvider(config);

      expect(provider.type).toBe(info.type);
      expect(provider.name).toBe(info.name);
    });

    it('should validate before creating provider', () => {
      const config = {
        type: 'anthropic' as ProviderType,
        apiKey: 'test-key',
        model: 'claude-3-5-sonnet-20241022',
      };

      const validation = validateProviderConfig(config);
      expect(validation.valid).toBe(true);

      const provider = createProvider(config);
      expect(provider).toBeInstanceOf(AnthropicProvider);
    });

    it('should handle free providers correctly', () => {
      const freeProviders = getAvailableProviders().filter(isFreeProvider);
      
      expect(freeProviders).toHaveLength(2);
      expect(freeProviders).toContain('openrouter');
      expect(freeProviders).toContain('ollama');

      // Should be able to create without API key
      freeProviders.forEach(type => {
        const config = getDefaultConfig(type);
        const validation = validateProviderConfig(config);
        expect(validation.valid).toBe(true);
      });
    });

    it('should handle paid providers correctly', () => {
      const paidProviders = getAvailableProviders().filter(
        type => !isFreeProvider(type)
      );
      
      expect(paidProviders).toHaveLength(3);
      expect(paidProviders).toContain('anthropic');
      expect(paidProviders).toContain('openai');
      expect(paidProviders).toContain('google');

      // Should require API key
      paidProviders.forEach(type => {
        const config = getDefaultConfig(type);
        const validation = validateProviderConfig(config);
        expect(validation.valid).toBe(false);
        expect(validation.error).toContain('API key is required');
      });
    });
  });
});
