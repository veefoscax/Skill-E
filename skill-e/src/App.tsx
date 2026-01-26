import { Toolbar } from '@/components/Toolbar'
import { MicrophoneDiagnostic } from '@/components/MicrophoneDiagnostic'
import { Settings } from '@/components/settings'
// import { useWindowPosition } from '@/hooks/useWindowPosition'
import { useSystemTray } from '@/hooks/useSystemTray'
import { useGlobalShortcuts } from '@/hooks/useGlobalShortcuts'
import { useRecordingStore } from '@/stores/recording'
import { useEffect, useState } from 'react'

/**
 * Main App Component with simple hash-based routing
 * 
 * Routes:
 * - #/ or # or empty: Main toolbar view
 * - #/settings: Settings window view
 */
function App() {
  // Simple hash-based routing
  const [route, setRoute] = useState(window.location.hash || '#/')

  useEffect(() => {
    const handleHashChange = () => {
      setRoute(window.location.hash || '#/')
    }
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  // Settings page - separate window
  if (route === '#/settings') {
    return (
      <div className="min-h-screen bg-background">
        <Settings />
      </div>
    )
  }

  // Main toolbar page
  return <MainToolbar />
}

/**
 * Main Toolbar View
 * This is the main floating toolbar with recording controls
 */
function MainToolbar() {
  // TEMPORARILY DISABLED: Window position persistence is forcing window to center
  // TODO: Re-enable after fixing the centering logic
  // useWindowPosition();

  // Initialize system tray behavior (minimize to tray on close)
  useSystemTray();

  // Get recording actions from store
  const toggleRecording = useRecordingStore((state) => state.toggleRecording);
  const toggleAnnotationMode = useRecordingStore((state) => state.toggleAnnotationMode);
  const cancelRecording = useRecordingStore((state) => state.cancelRecording);

  // Initialize global shortcuts
  useGlobalShortcuts(
    toggleRecording,
    toggleAnnotationMode,
    cancelRecording
  );

  return (
    <div className="flex flex-col gap-4 p-4">
      <Toolbar />
      {/* Microphone Diagnostic - Run this first if audio isn't working */}
      <div className="hidden">
        <MicrophoneDiagnostic />
      </div>
    </div>
  )
}

export default App
