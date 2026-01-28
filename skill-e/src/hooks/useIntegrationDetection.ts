/**
 * Integration Detection Hook
 * 
 * Detects available external integrations (Antigravity, Claude Code) on app start.
 * Updates the provider store with detection results.
 */

import { useEffect, useState } from 'react';
import { useProviderStore } from '@/stores/provider';
import { detectAllIntegrations } from '@/lib/integration-detection';

/**
 * Hook to detect and track integration availability
 * 
 * Runs detection on mount and updates the provider store.
 * Returns the current integration status.
 */
export function useIntegrationDetection() {
  const { integrations, setIntegrations } = useProviderStore();
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    async function detect() {
      setIsDetecting(true);
      setError(null);

      try {
        const result = await detectAllIntegrations();
        
        if (mounted) {
          setIntegrations(result);
          setIsDetecting(false);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error('Detection failed'));
          setIsDetecting(false);
        }
      }
    }

    detect();

    return () => {
      mounted = false;
    };
  }, []); // Run once on mount

  return {
    integrations,
    isDetecting,
    error,
  };
}

/**
 * Hook to manually trigger integration detection
 * 
 * Useful for re-checking after user installs an integration.
 */
export function useManualIntegrationDetection() {
  const { setIntegrations } = useProviderStore();
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const detect = async () => {
    setIsDetecting(true);
    setError(null);

    try {
      const result = await detectAllIntegrations();
      setIntegrations(result);
      setIsDetecting(false);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Detection failed');
      setError(error);
      setIsDetecting(false);
      throw error;
    }
  };

  return {
    detect,
    isDetecting,
    error,
  };
}
