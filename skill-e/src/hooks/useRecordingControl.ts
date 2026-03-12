import { useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useRecordingStore } from '../stores/recording';
import { useAudioRecording } from './useAudioRecording';
import { useCapture } from './useCapture';

export function useRecordingControl() {
  const startRecordingStore = useRecordingStore(state => state.startRecording);
  const stopRecordingStore = useRecordingStore(state => state.stopRecording);
  const setSessionDirectoryStore = useRecordingStore(state => state.setSessionDirectory);
  
  const { startCapture, stopCapture, getCurrentSession, updateManifestAudio } = useCapture();
  const { startRecording: startAudio, stopRecording: stopAudio, setSessionDirectory: setAudioSessionDirectory } = useAudioRecording();
  
  // Ref to store session directory reliably across renders
  const sessionDirRef = useRef<string | null>(null);

  const handleStart = async () => {
    console.log('🚀 [useRecordingControl] handleStart called');
    try {
      await invoke('initialize_recording');
      await startRecordingStore();

      let session;
      try {
        console.log('[useRecordingControl] Starting screen capture...');
        session = await startCapture(1000);
        
        if (!session) {
          console.error('[useRecordingControl] startCapture returned null/undefined!');
          return;
        }

        if (session.directory) {
          console.log('[useRecordingControl] Session directory:', session.directory);
          
          sessionDirRef.current = session.directory;
          setAudioSessionDirectory(session.directory);
          setSessionDirectoryStore(session.directory);
          
          // Legacy window fallback for extreme cases
          (window as any).__CURRENT_SESSION_DIR__ = session.directory;
        }
      } catch (e) {
        console.warn('[useRecordingControl] Screen capture failed', e);
      }

      try {
        console.log('[useRecordingControl] Starting audio recording...');
        await startAudio();
      } catch (e) {
        console.warn('[useRecordingControl] Audio recording failed', e);
      }

      // Update window mode
      import('../lib/window-controls').then(w => w.setRecordingMode());

    } catch (error) {
      console.error('[useRecordingControl] Failed to start recording', error);
      stopRecordingStore();
    }
  };

  const handleStop = async (): Promise<string | null> => {
    console.log('🛑 [useRecordingControl] handleStop called');
    try {
      // 1. Resolve session directory with fallbacks
      let sessionDir: string | null = null;
      
      const currentSession = getCurrentSession();
      if (currentSession) sessionDir = currentSession.directory;
      
      if (!sessionDir && sessionDirRef.current) {
        sessionDir = sessionDirRef.current;
      }

      if (!sessionDir) {
        sessionDir = useRecordingStore.getState().sessionDirectory;
      }

      // Last resort fallbacks
      if (!sessionDir && (window as any).__CURRENT_SESSION_DIR__) {
        sessionDir = (window as any).__CURRENT_SESSION_DIR__;
      }

      console.log('[useRecordingControl] Final sessionDir for stop:', sessionDir);

      // 2. Stop capture
      try {
        await stopCapture();
      } catch (e) {
        console.warn('[useRecordingControl] stopCapture failed', e);
      }

      // 3. Stop audio
      let audioPath: string | null = null;
      try {
        audioPath = await stopAudio(sessionDir || undefined);
        console.log('[useRecordingControl] Audio saved at:', audioPath);
      } catch (e) {
        console.warn('[useRecordingControl] stopAudio failed', e);
      }

      // 4. Update manifest if we have both
      if (sessionDir && audioPath) {
        await updateManifestAudio(sessionDir, audioPath);
      }

      // 5. Cleanup and store state
      if (sessionDir) {
        (window as any).__LAST_SESSION_DIR__ = sessionDir;
      }
      
      await stopRecordingStore();
      
      // Clear refs
      sessionDirRef.current = null;
      setSessionDirectoryStore(null);
      (window as any).__CURRENT_SESSION_DIR__ = null;

      return sessionDir;
    } catch (error) {
      console.error('[useRecordingControl] Failed to stop recording', error);
      return null;
    }
  };

  return {
    handleStart,
    handleStop,
    sessionDir: sessionDirRef.current
  };
}
