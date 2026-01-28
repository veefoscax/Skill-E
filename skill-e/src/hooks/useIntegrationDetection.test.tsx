/**
 * Tests for Integration Detection Hook
 * 
 * Note: These are simplified tests that test the integration detection logic
 * without rendering React components. Full hook testing would require @testing-library/react.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useProviderStore } from '@/stores/provider';
import * as integrationDetection from '@/lib/integration-detection';

// Mock the integration detection module
vi.mock('@/lib/integration-detection', () => ({
  detectAllIntegrations: vi.fn(),
}));

describe('Integration Detection Logic', () => {
  beforeEach(() => {
    // Reset store before each test
    useProviderStore.getState().reset();
    
    // Reset mocks
    vi.clearAllMocks();
    
    // Default mock implementation
    vi.mocked(integrationDetection.detectAllIntegrations).mockResolvedValue({
      antigravity: false,
      claudeCode: false,
    });
  });

  describe('detectAllIntegrations', () => {
    it('should be callable and return integration status', async () => {
      const result = await integrationDetection.detectAllIntegrations();
      
      expect(result).toHaveProperty('antigravity');
      expect(result).toHaveProperty('claudeCode');
      expect(typeof result.antigravity).toBe('boolean');
      expect(typeof result.claudeCode).toBe('boolean');
    });

    it('should return false for both integrations (not available)', async () => {
      const result = await integrationDetection.detectAllIntegrations();
      
      expect(result.antigravity).toBe(false);
      expect(result.claudeCode).toBe(false);
    });
  });

  describe('Provider Store Integration', () => {
    it('should allow setting integration status in store', () => {
      const { setIntegrations } = useProviderStore.getState();
      
      setIntegrations({
        antigravity: true,
        claudeCode: false,
      });
      
      const state = useProviderStore.getState();
      expect(state.integrations.antigravity).toBe(true);
      expect(state.integrations.claudeCode).toBe(false);
    });

    it('should persist integration status', () => {
      const { setIntegrations } = useProviderStore.getState();
      
      setIntegrations({
        antigravity: false,
        claudeCode: true,
      });
      
      // Get state again
      const state = useProviderStore.getState();
      expect(state.integrations.claudeCode).toBe(true);
    });

    it('should have default integration status as false', () => {
      const state = useProviderStore.getState();
      
      expect(state.integrations.antigravity).toBe(false);
      expect(state.integrations.claudeCode).toBe(false);
    });
  });

  describe('Integration Detection Workflow', () => {
    it('should support detection and store update workflow', async () => {
      // Simulate detection
      const result = await integrationDetection.detectAllIntegrations();
      
      // Update store with results
      const { setIntegrations } = useProviderStore.getState();
      setIntegrations(result);
      
      // Verify store was updated
      const state = useProviderStore.getState();
      expect(state.integrations).toEqual(result);
    });

    it('should handle detection errors gracefully', async () => {
      vi.mocked(integrationDetection.detectAllIntegrations).mockRejectedValue(
        new Error('Detection failed')
      );
      
      try {
        await integrationDetection.detectAllIntegrations();
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Detection failed');
      }
      
      // Store should still have default values
      const state = useProviderStore.getState();
      expect(state.integrations.antigravity).toBe(false);
      expect(state.integrations.claudeCode).toBe(false);
    });
  });

  describe('Hook Exports', () => {
    it('should export useIntegrationDetection hook', async () => {
      const { useIntegrationDetection } = await import('./useIntegrationDetection');
      expect(typeof useIntegrationDetection).toBe('function');
    });

    it('should export useManualIntegrationDetection hook', async () => {
      const { useManualIntegrationDetection } = await import('./useIntegrationDetection');
      expect(typeof useManualIntegrationDetection).toBe('function');
    });
  });
});
