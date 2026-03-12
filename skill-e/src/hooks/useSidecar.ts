import { useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useSettingsStore } from '../stores/settings';

export function useSidecar() {
  const { sidecarEnabled, sidecarPort, whisperModel } = useSettingsStore();

  useEffect(() => {
    if (!sidecarEnabled) return;

    const startSidecar = async () => {
      try {
        console.log(`[useSidecar] Starting AI sidecar on port ${sidecarPort}...`);
        const result = await invoke('start_ai_sidecar', {
          port: sidecarPort,
          model: whisperModel
        });
        console.log(`[useSidecar] ${result}`);
      } catch (error) {
        console.error('[useSidecar] Failed to start sidecar:', error);
      }
    };

    startSidecar();

    return () => {
      const stopSidecar = async () => {
        try {
          await invoke('stop_ai_sidecar');
          console.log('[useSidecar] Sidecar stopped');
        } catch (error) {
          console.error('[useSidecar] Failed to stop sidecar:', error);
        }
      };
      stopSidecar();
    };
  }, [sidecarEnabled, sidecarPort, whisperModel]);
}
