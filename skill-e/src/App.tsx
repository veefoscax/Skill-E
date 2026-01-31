import { useEffect, useState, useRef, lazy, Suspense } from 'react';
import { listen, emit } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';
import { register, unregisterAll } from '@tauri-apps/plugin-global-shortcut';
import { queryPermissionState } from './lib/permissions';
import { useRecordingStore } from './stores/recording';
import { useSettingsStore } from './stores/settings';
import { useAudioRecording } from './hooks/useAudioRecording';
import { useCapture } from './hooks/useCapture';
import { Toolbar } from './components/Toolbar';
import { ProcessingScreen } from './components/ProcessingScreen';
import { PreviewScreen } from './components/PreviewScreen';
// Lazy load components
const OnboardingScreen = lazy(() => import('./components/Onboarding/OnboardingScreen').then(module => ({ default: module.OnboardingScreen })));
const Settings = lazy(() => import('./components/settings/Settings').then(module => ({ default: module.Settings })));

// App states
export type AppView = 'toolbar' | 'processing' | 'preview';

function App() {
  const [view, setView] = useState<AppView>('toolbar');
  const [generatedSkill, setGeneratedSkill] = useState<string>('');
  const [isReady, setIsReady] = useState(false);

  // Optimize selectors to avoid unnecessary re-renders
  const startRecording = useRecordingStore(state => state.startRecording);
  const stopRecording = useRecordingStore(state => state.stopRecording);
  const isOnboardingCompleted = useSettingsStore(state => state.isOnboardingCompleted);

  // Capture hooks
  const { startCapture, stopCapture, getCurrentSession, updateManifestAudio } = useCapture();
  const { startRecording: startAudio, stopRecording: stopAudio, setSessionDirectory } = useAudioRecording();
  
  // Ref to store session directory reliably across renders
  const sessionDirRef = useRef<string | null>(null);

  // DEBUG: Reset onboarding on fresh app load for testing
  useEffect(() => {
    console.log('DEBUG: Resetting onboarding state for testing');
    useSettingsStore.getState().setOnboardingCompleted(false);
  }, []);

  // Unified Start/Stop Handlers
  const handleStart = async () => {
    console.log('🚀 === HANDLESTART CALLED ===');
    try {
      console.log('App: Starting recording...');
      await invoke('initialize_recording');
      await startRecording(); // Store update

      try {
        console.log('App: About to call startCapture...');
        const session = await startCapture(1000); // Start capture first to get session dir
        console.log('✅ App: Screen capture returned, session:', session);
        console.log('✅ App: Session directory:', session?.directory);
        console.log('✅ App: Session ID:', session?.id);
        console.log('✅ App: Session type:', typeof session);
        console.log('✅ App: Session keys:', session ? Object.keys(session) : 'null');

        if (!session) {
          console.error('❌ App: startCapture returned null/undefined!');
          return;
        }

        // Pass session directory to audio recorder so it knows where to save
        if (session && session.directory) {
          console.log('✅ App: About to call setSessionDirectory with:', session.directory);
          
          // Store in local ref (most reliable)
          sessionDirRef.current = session.directory;
          console.log('✅ App: Stored session dir in local ref:', sessionDirRef.current);
          
          setSessionDirectory(session.directory);
          console.log('✅ App: setSessionDirectory called successfully');
          
          // Also save to recording store (shared across components)
          useRecordingStore.getState().setSessionDirectory(session.directory);
          console.log('✅ App: Saved session dir to recording store');
          
          // Also store in window for extreme fallback
          (window as any).__CURRENT_SESSION_DIR__ = session.directory;
          console.log('✅ App: Stored session dir in window.__CURRENT_SESSION_DIR__');
        } else {
          console.warn('⚠️ App: No session directory available! Session:', session);
        }
      } catch (e) {
        console.warn('❌ App: Screen capture failed', e);
      }

      try {
        await startAudio();
      } catch (e) {
        console.warn('App: Audio recording failed', e);
      }

      import('./lib/window-controls').then(w => w.setRecordingMode());

    } catch (error) {
      console.error('App: Failed to start', error);
      stopRecording();
    }
  };

  const handleStop = async () => {
    try {
      console.log('App: Stopping recording...');

      // 1. Stop capture and get session info
      let sessionDir: string | null = null;
      try {
        const session = getCurrentSession();
        if (session) sessionDir = session.directory;
        await stopCapture(); // Saves manifest!
      } catch (e) { console.warn('App: Stop capture failed', e); }

      // Fallback 1: local ref (most reliable)
      if (!sessionDir && sessionDirRef.current) {
        sessionDir = sessionDirRef.current;
        console.log('✅ App: Using sessionDir from local ref:', sessionDir);
      }

      // Fallback 2: recording store
      if (!sessionDir) {
        sessionDir = useRecordingStore.getState().sessionDirectory;
        if (sessionDir) {
          console.log('✅ App: Using sessionDir from recording store:', sessionDir);
        }
      }

      // Fallback 3: window object
      if (!sessionDir && (window as any).__CURRENT_SESSION_DIR__) {
        sessionDir = (window as any).__CURRENT_SESSION_DIR__;
        console.log('✅ App: Using fallback sessionDir from window:', sessionDir);
      }

      // Fallback 4: try to extract from frame paths in recording store
      if (!sessionDir) {
        const frames = useRecordingStore.getState().frames;
        if (frames.length > 0 && frames[0].imageData) {
          const framePath = frames[0].imageData;
          // Extract session dir from frame path (e.g., .../session-xxx/frame-1.webp)
          const match = framePath.match(/(.+session-\d+)/);
          if (match) {
            sessionDir = match[1];
            console.log('✅ App: Extracted sessionDir from frame path:', sessionDir);
          }
        }
      }

      // Fallback 5: try to get from last window.__LAST_SESSION_DIR__
      if (!sessionDir && (window as any).__LAST_SESSION_DIR__) {
        sessionDir = (window as any).__LAST_SESSION_DIR__;
        console.log('✅ App: Using previous sessionDir:', sessionDir);
      }

      console.log('✅ App: Final sessionDir for audio save:', sessionDir);
      
      if (!sessionDir) {
        console.error('❌ App: CRITICAL - No sessionDir found after all fallbacks!');
        console.error('❌ App: Audio will NOT be saved!');
      }

      // 2. Stop audio - PASS sessionDir directly to ensure it's available
      let audioPath: string | null = null;
      try {
        console.log('App: Stopping audio with sessionDir:', sessionDir);
        const path = await stopAudio(sessionDir || undefined);
        // stopAudio returns string | null directly now via promise
        if (path) {
          audioPath = path;
          console.log('✅ App: Audio saved at', audioPath);
        }
      } catch (e) { console.warn('❌ App: Stop audio failed', e); }

      // 3. Update manifest
      if (sessionDir && audioPath) {
        await updateManifestAudio(sessionDir, audioPath);
      } else {
        console.warn('⚠️ App: Missing sessionDir or audioPath, skipping manifest update', { sessionDir, audioPath });
      }

      // 4. Update store
      await stopRecording();

      // 5. Store session dir for processing
      if (sessionDir) {
        (window as any).__LAST_SESSION_DIR__ = sessionDir;
      }

      // 6. Clear session directory refs for next recording
      sessionDirRef.current = null;
      useRecordingStore.getState().setSessionDirectory(null);
      (window as any).__CURRENT_SESSION_DIR__ = null;
      console.log('✅ App: Cleared session directory refs');

      // 7. Navigate
      import('./lib/window-controls').then(w => w.setProcessingMode());
      setView('processing');
    } catch (error) {
      console.error('App: Failed to stop', error);
    }
  };

  // Initialize app
  useEffect(() => {
    const init = async () => {
      try {
        console.log('Initializing Skill-E...');

        // Check permissions
        await queryPermissionState('microphone');

        // Initialize recording system
        await invoke('initialize_recording');

        // Setup global shortcuts
        await setupGlobalShortcuts();

        setIsReady(true);
        console.log('Skill-E initialized successfully');
      } catch (error) {
        console.error('Initialization error:', error);
        alert('Failed to initialize: ' + String(error));
      }
    };

    init();

    // Log Capture
    const logs: string[] = [];
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    console.log = (...args) => {
      logs.push(`[LOG] ${args.join(' ')}`);
      if (logs.length > 1000) logs.shift();
      originalLog(...args);
    };
    console.error = (...args) => {
      logs.push(`[ERROR] ${args.join(' ')}`);
      if (logs.length > 1000) logs.shift();
      originalError(...args);
    };
    console.warn = (...args) => {
      logs.push(`[WARN] ${args.join(' ')}`);
      if (logs.length > 1000) logs.shift();
      originalWarn(...args);
    };

    // Expose logs globally for debugging
    (window as any).__SKILL_E_LOGS__ = () => logs.join('\n');
    (window as any).__COPY_LOGS__ = async () => {
      await navigator.clipboard.writeText(logs.join('\n'));
      alert('Logs copied to clipboard!');
    };

    // Listen for recording state changes from Rust/Overlay
    const unlistenToggle = listen('hotkey-toggle-recording', async () => {
      console.log('Hotkey: Toggle recording');
      const { isRecording } = useRecordingStore.getState();
      if (isRecording) {
        await handleStop();
      } else {
        await handleStart();
      }
    });

    // Listen for steps added by Overlay window
    const unlistenStep = listen('recording:step-added', (event: any) => {
      console.log('Main: Received step from overlay', event.payload);
      useRecordingStore.getState().addStep(event.payload);
    });

    const unlistenCancel = listen('hotkey-cancel-recording', async () => {
      console.log('Hotkey: Cancel recording');
      const { isRecording } = useRecordingStore.getState();
      if (isRecording) {
        await handleStop();
      }
    });

    return () => {
      unlistenToggle.then(f => f());
      unlistenStep.then(f => f());
      unlistenCancel.then(f => f());
      unregisterAll().catch(() => { });
    };
  }, [startRecording, stopRecording]);

  // Setup global shortcuts
  const setupGlobalShortcuts = async () => {
    try {
      try {
        await unregisterAll();
      } catch (e) {
        console.warn('Failed to unregister hotkeys (might be first run):', e);
      }

      const safeRegister = async (key: string, handler: (event: any) => void) => {
        try {
          await register(key, handler);
        } catch (e) {
          const msg = String(e);
          if (msg.includes('already registered')) {
            console.log(`Hotkey ${key} already registered, skipping.`);
          } else {
            console.error(`Failed to register ${key}:`, e);
          }
        }
      };

      // Register Ctrl+Shift+R for toggle recording
      await safeRegister('Ctrl+Shift+R', async () => {
        console.log('Global shortcut: Toggle recording');
        const { isRecording } = useRecordingStore.getState();
        if (isRecording) {
          await handleStop();
        } else {
          await handleStart();
        }
      });

      // Register Escape to stop recording
      await safeRegister('Escape', async () => {
        console.log('Global shortcut: Escape pressed');
        const { isRecording } = useRecordingStore.getState();
        if (isRecording) {
          await handleStop();
        }
      });

      console.log('Global shortcuts registered');
    } catch (error) {
      console.error('Failed to setup shortcuts wrapper:', error);
    }
  };

  // Handle processing complete
  const handleProcessingComplete = (skillMarkdown: string) => {
    setGeneratedSkill(skillMarkdown);
    import('./lib/window-controls').then(w => w.setPreviewMode());
    setView('preview');
  };

  // Handle back to toolbar
  const handleBackToToolbar = () => {
    import('./lib/window-controls').then(w => w.setToolbarMode());
    setView('toolbar');
    setGeneratedSkill('');
  };

  // Handle new recording
  const handleNewRecording = () => {
    import('./lib/window-controls').then(w => w.setToolbarMode());
    setView('toolbar');
    setGeneratedSkill('');
  };

  // Handle transition to processing
  useEffect(() => {
    if (view === 'processing') {
      import('./lib/window-controls').then(w => w.setProcessingMode());
    }
  }, [view]);

  // Check for overlay mode (Hash routing)
  const isOverlayWindow = window.location.hash === '#/overlay';

  if (!isReady && !isOverlayWindow) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
          <p>Initializing Skill-E...</p>
        </div>
      </div>
    );
  }

  // If onboarding is not completed, show onboarding screen (unless in specific routes)
  if (!isOverlayWindow && !window.location.hash.includes('settings') && !isOnboardingCompleted) {
    import('./lib/window-controls').then(w => w.setProcessingMode());
    return (
      <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
        <OnboardingScreen onComplete={() => {
          import('./lib/window-controls').then(w => w.setToolbarMode());
        }} />
      </Suspense>
    );
  }

  // Overlay window disabled - recording happens without visual overlay
  if (isOverlayWindow) {
    return (
      <div className="w-full h-full bg-transparent" />
    );
  }

  // If this is the separate Settings Window
  if (window.location.hash === '#/settings') {
    return (
      <Suspense fallback={<div className="p-4">Loading settings...</div>}>
        <Settings />
      </Suspense>
    );
  }

  return (
    <>
      {/* View: Toolbar */}
      {view === 'toolbar' && (
        <div className="w-full h-full p-2 flex items-center justify-center bg-transparent">
          <Toolbar
            onStart={handleStart}
            onStop={() => {
              // Call App's handleStop which manages all instances
              handleStop().then(() => {
                import('./lib/window-controls').then(w => w.setProcessingMode());
                setView('processing');
              });
            }}
          />
        </div>
      )}

      {/* View: Processing */}
      {view === 'processing' && (
        <ProcessingScreen
          onComplete={handleProcessingComplete}
          onCancel={handleBackToToolbar}
        />
      )}

      {/* View: Preview */}
      {view === 'preview' && (
        <PreviewScreen
          skillMarkdown={generatedSkill}
          onBack={handleBackToToolbar}
          onNewRecording={handleNewRecording}
        />
      )}
    </>
  );
}

export default App;
