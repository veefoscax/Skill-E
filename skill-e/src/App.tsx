import { useEffect, useState, lazy, Suspense } from 'react';
import { listen } from '@tauri-apps/api/event';
import { register, unregisterAll } from '@tauri-apps/plugin-global-shortcut';
import { useRecordingStore } from './stores/recording';
import { useSettingsStore } from './stores/settings';
import { Toolbar } from './components/Toolbar';
import { ProcessingScreen } from './components/ProcessingScreen';
import { PreviewScreen } from './components/PreviewScreen';
import { useRecordingControl } from './hooks/useRecordingControl';
import { useLogCapture } from './hooks/useLogCapture';
import { useInitialization } from './hooks/useInitialization';

// Lazy load components
const OnboardingScreen = lazy(() => import('./components/Onboarding/OnboardingScreen').then(module => ({ default: module.OnboardingScreen })));
const Settings = lazy(() => import('./components/settings/Settings').then(module => ({ default: module.Settings })));

export type AppView = 'toolbar' | 'processing' | 'preview';

function App() {
  const [view, setView] = useState<AppView>('toolbar');
  const [generatedSkill, setGeneratedSkill] = useState<string>('');
  
  // Custom hooks for logic extraction
  const { isReady, error: initError } = useInitialization();
  const { handleStart, handleStop } = useRecordingControl();
  useLogCapture();

  const isOnboardingCompleted = useSettingsStore(state => state.isOnboardingCompleted);

  // Initialize shortcuts
  useEffect(() => {
    if (!isReady) return;

    const setupShortcuts = async () => {
      try {
        await unregisterAll();
        
        const safeRegister = async (key: string, handler: () => void) => {
          try { await register(key, handler); } 
          catch (e) { console.warn(`Hotkey ${key} register fail:`, e); }
        };

        await safeRegister('Ctrl+Shift+R', async () => {
          const { isRecording } = useRecordingStore.getState();
          isRecording ? await handleStop() : await handleStart();
        });

        await safeRegister('Escape', async () => {
          if (useRecordingStore.getState().isRecording) await handleStop();
        });
      } catch (e) { console.error('Shortcuts setup fail:', e); }
    };

    setupShortcuts();

    // Tauri listeners
    const unlistenToggle = listen('hotkey-toggle-recording', async () => {
      const { isRecording } = useRecordingStore.getState();
      isRecording ? await handleStop() : await handleStart();
    });

    const unlistenStep = listen('recording:step-added', (event: any) => {
      useRecordingStore.getState().addStep(event.payload);
    });

    const unlistenCancel = listen('hotkey-cancel-recording', async () => {
      if (useRecordingStore.getState().isRecording) await handleStop();
    });

    return () => {
      unlistenToggle.then(f => f());
      unlistenStep.then(f => f());
      unlistenCancel.then(f => f());
      unregisterAll().catch(() => { });
    };
  }, [isReady, handleStart, handleStop]);

  // View Handlers
  const onStopRecording = async () => {
    await handleStop();
    import('./lib/window-controls').then(w => w.setProcessingMode());
    setView('processing');
  };

  const handleProcessingComplete = (skillMarkdown: string) => {
    setGeneratedSkill(skillMarkdown);
    import('./lib/window-controls').then(w => w.setPreviewMode());
    setView('preview');
  };

  const resetToToolbar = () => {
    import('./lib/window-controls').then(w => w.setToolbarMode());
    setView('toolbar');
    setGeneratedSkill('');
  };

  // UI States
  const isOverlayWindow = window.location.hash === '#/overlay';
  const isSettingsWindow = window.location.hash === '#/settings';

  if (initError) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white p-4">
        <div className="text-center text-red-400">
          <p className="font-bold">Initialization Error</p>
          <p className="text-sm opacity-80">{initError}</p>
        </div>
      </div>
    );
  }

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

  if (!isOverlayWindow && !window.location.hash.includes('settings') && !isOnboardingCompleted) {
    return (
      <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading Onboarding...</div>}>
        <OnboardingScreen onComplete={() => import('./lib/window-controls').then(w => w.setToolbarMode())} />
      </Suspense>
    );
  }

  if (isOverlayWindow) return <div className="w-full h-full bg-transparent" />;
  
  if (isSettingsWindow) {
    return (
      <Suspense fallback={<div className="p-4">Loading settings...</div>}>
        <Settings />
      </Suspense>
    );
  }

  return (
    <>
      {view === 'toolbar' && (
        <div className="w-full h-full p-2 flex items-center justify-center bg-transparent">
          <Toolbar onStart={handleStart} onStop={onStopRecording} />
        </div>
      )}

      {view === 'processing' && (
        <ProcessingScreen
          onComplete={handleProcessingComplete}
          onCancel={resetToToolbar}
        />
      )}

      {view === 'preview' && (
        <PreviewScreen
          skillMarkdown={generatedSkill}
          onBack={resetToToolbar}
          onNewRecording={resetToToolbar}
        />
      )}
    </>
  );
}

export default App;
