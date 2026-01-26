import { useEffect } from 'react';
import { listen } from '@tauri-apps/api/event';

/**
 * Hook to listen for global shortcut events from Tauri backend
 * 
 * Registered shortcuts:
 * - Ctrl+Shift+R (Cmd+Shift+R on macOS): Toggle recording
 * - Ctrl+Shift+A (Cmd+Shift+A on macOS): Toggle annotation mode
 * - Esc: Cancel recording
 */
export function useGlobalShortcuts(
  onToggleRecording?: () => void,
  onToggleAnnotation?: () => void,
  onCancelRecording?: () => void
) {
  useEffect(() => {
    // Listen for toggle recording hotkey
    const unlistenRecording = listen('hotkey-toggle-recording', () => {
      console.log('Global shortcut: Toggle recording');
      onToggleRecording?.();
    });

    // Listen for toggle annotation hotkey
    const unlistenAnnotation = listen('hotkey-toggle-annotation', () => {
      console.log('Global shortcut: Toggle annotation');
      onToggleAnnotation?.();
    });

    // Listen for cancel recording hotkey
    const unlistenCancel = listen('hotkey-cancel-recording', () => {
      console.log('Global shortcut: Cancel recording');
      onCancelRecording?.();
    });

    // Cleanup listeners on unmount
    return () => {
      unlistenRecording.then((fn) => fn());
      unlistenAnnotation.then((fn) => fn());
      unlistenCancel.then((fn) => fn());
    };
  }, [onToggleRecording, onToggleAnnotation, onCancelRecording]);
}
