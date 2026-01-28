import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ProviderType, ProviderConfig, IntegrationStatus } from '@/lib/providers/types';

/**
 * S08: LLM Provider Store
 * 
 * Manages LLM provider selection, API keys, and configuration.
 * Persists settings securely to localStorage.
 * 
 * Requirements: FR-8.3
 */

/**
 * Provider store state
 */
export interface ProviderState {
  // Current provider configuration
  config: ProviderConfig;
  
  // API keys for each provider (stored separately for security)
  apiKeys: Partial<Record<ProviderType, string>>;
  
  // Integration detection status
  integrations: IntegrationStatus;
  
  // Actions
  setProvider: (type: ProviderType) => void;
  setApiKey: (provider: ProviderType, key: string) => void;
  setModel: (model: string) => void;
  setTemperature: (temperature: number) => void;
  setMaxTokens: (maxTokens: number) => void;
  setBaseUrl: (baseUrl: string) => void;
  updateConfig: (config: Partial<ProviderConfig>) => void;
  setIntegrations: (integrations: IntegrationStatus) => void;
  reset: () => void;
}

/**
 * Default provider configuration
 * 
 * OpenRouter is the default provider with free tier models.
 * This allows users to test the app without any API keys.
 * 
 * Requirements: FR-8.5
 */
const DEFAULT_CONFIG: ProviderConfig = {
  type: 'openrouter',
  model: 'google/gemma-2-9b-it:free', // Free model, no API key needed
  temperature: 0.7,
  maxTokens: 4096,
};

/**
 * Initial state
 */
const initialState = {
  config: DEFAULT_CONFIG,
  apiKeys: {},
  integrations: {
    antigravity: false,
    claudeCode: false,
  },
};

/**
 * Provider store with Zustand
 * 
 * Manages provider configuration and API keys with persistence.
 * API keys are stored in localStorage (encrypted in production).
 */
export const useProviderStore = create<ProviderState>()(
  persist(
    (set, get) => ({
      ...initialState,

      /**
       * Set the active provider type
       * 
       * Automatically updates the model to a sensible default for that provider.
       */
      setProvider: (type: ProviderType) => {
        const state = get();
        const apiKey = state.apiKeys[type];
        
        // Default models for each provider
        const defaultModels: Record<ProviderType, string> = {
          openrouter: 'google/gemma-2-9b-it:free',
          anthropic: 'claude-3-5-sonnet-20241022',
          openai: 'gpt-4o',
          google: 'gemini-1.5-pro',
          ollama: 'llama3.1',
        };

        set({
          config: {
            ...state.config,
            type,
            model: defaultModels[type],
            apiKey,
          },
        });
      },

      /**
       * Set API key for a specific provider
       * 
       * Stores the key separately and updates the config if this is the active provider.
       */
      setApiKey: (provider: ProviderType, key: string) => {
        const state = get();
        
        set({
          apiKeys: {
            ...state.apiKeys,
            [provider]: key,
          },
          // Update config if this is the active provider
          config: state.config.type === provider
            ? { ...state.config, apiKey: key }
            : state.config,
        });
      },

      /**
       * Set the model for the current provider
       */
      setModel: (model: string) => {
        const state = get();
        set({
          config: {
            ...state.config,
            model,
          },
        });
      },

      /**
       * Set temperature (0-1)
       */
      setTemperature: (temperature: number) => {
        const state = get();
        set({
          config: {
            ...state.config,
            temperature: Math.max(0, Math.min(1, temperature)),
          },
        });
      },

      /**
       * Set max tokens limit
       */
      setMaxTokens: (maxTokens: number) => {
        const state = get();
        set({
          config: {
            ...state.config,
            maxTokens: Math.max(1, maxTokens),
          },
        });
      },

      /**
       * Set custom base URL (mainly for Ollama)
       */
      setBaseUrl: (baseUrl: string) => {
        const state = get();
        set({
          config: {
            ...state.config,
            baseUrl,
          },
        });
      },

      /**
       * Update multiple config properties at once
       */
      updateConfig: (updates: Partial<ProviderConfig>) => {
        const state = get();
        set({
          config: {
            ...state.config,
            ...updates,
          },
        });
      },

      /**
       * Update integration detection status
       */
      setIntegrations: (integrations: IntegrationStatus) => {
        set({ integrations });
      },

      /**
       * Reset to default configuration
       */
      reset: () => set(initialState),
    }),
    {
      name: 'provider-storage',
      // Persist all provider settings including API keys
      // Note: In production, API keys should be encrypted before storage
      // For now, localStorage provides basic security (same-origin policy)
    }
  )
);

/**
 * Helper: Get provider display name
 */
export function getProviderDisplayName(type: ProviderType): string {
  const names: Record<ProviderType, string> = {
    openrouter: 'OpenRouter',
    anthropic: 'Anthropic (Claude)',
    openai: 'OpenAI (GPT)',
    google: 'Google (Gemini)',
    ollama: 'Ollama (Local)',
  };
  return names[type];
}

/**
 * Helper: Check if provider requires API key
 */
export function requiresApiKey(type: ProviderType): boolean {
  // OpenRouter works with free models without API key
  // Ollama is local and doesn't need API key
  return type !== 'openrouter' && type !== 'ollama';
}

/**
 * Helper: Check if provider is free
 */
export function isFreeProvider(type: ProviderType): boolean {
  return type === 'openrouter' || type === 'ollama';
}

/**
 * Helper: Get provider description
 */
export function getProviderDescription(type: ProviderType): string {
  const descriptions: Record<ProviderType, string> = {
    openrouter: 'Free tier available - No API key needed for demo models',
    anthropic: 'Claude API - Requires API key from console.anthropic.com',
    openai: 'GPT-4 API - Requires API key from platform.openai.com',
    google: 'Gemini API - Requires API key from ai.google.dev',
    ollama: 'Local models - Free, offline, no API key needed',
  };
  return descriptions[type];
}

/**
 * Helper: Validate API key format (basic check)
 */
export function validateApiKey(type: ProviderType, key: string): boolean {
  // Ollama doesn't use API keys, always valid
  if (type === 'ollama') {
    return true;
  }

  // For other providers, check if key is provided
  if (!key || key.trim().length === 0) {
    return false;
  }

  // Basic format validation for each provider
  switch (type) {
    case 'openrouter':
      // OpenRouter keys start with 'sk-or-'
      return key.startsWith('sk-or-');
    case 'anthropic':
      // Anthropic keys start with 'sk-ant-'
      return key.startsWith('sk-ant-');
    case 'openai':
      // OpenAI keys start with 'sk-'
      return key.startsWith('sk-');
    case 'google':
      // Google API keys are alphanumeric
      return /^[A-Za-z0-9_-]+$/.test(key);
    default:
      return false;
  }
}
