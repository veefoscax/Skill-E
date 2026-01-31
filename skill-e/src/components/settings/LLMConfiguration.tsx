import { ProviderSelector } from '../shared/ProviderSelector';

/**
 * LLM Configuration Component
 * 
 * Now uses the unified ProviderSelector component for consistency
 * across the application.
 */
export function LLMConfiguration() {
  return <ProviderSelector />;
}
