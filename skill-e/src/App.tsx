import { Toolbar } from '@/components/Toolbar'
import { MicrophoneDiagnostic } from '@/components/MicrophoneDiagnostic'
import { Settings } from '@/components/settings'
import { Overlay } from '@/components/Overlay/Overlay'
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
 * - #/overlay: Overlay window view (transparent fullscreen)
 * - #/microphone: Microphone diagnostic view
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

  // Overlay page - transparent fullscreen window
  if (route === '#/overlay') {
    return <Overlay />
  }

  // Settings page
  if (route === '#/settings') {
    return (
      <div className="h-screen w-screen overflow-hidden bg-background">
        <Settings />
      </div>
    )
  }

  // Microphone diagnostic page
  if (route === '#/microphone') {
    return (
      <div className="h-screen w-screen overflow-hidden bg-background">
        <MicrophoneDiagnostic />
      </div>
    )
  }

  // Main toolbar view (default)
  return (
    <div className="h-screen w-screen overflow-hidden bg-background">
      <Toolbar />
    </div>
  )
}

/**
 * App wrapper with providers
 */
function AppWithProviders() {
  const { isRecording } = useRecordingStore()

  // Register global shortcuts
  useGlobalShortcuts()

  // Register system tray
  useSystemTray()

  // Request microphone permission on mount
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ audio: true }).catch(() => {
      console.log('Microphone permission denied')
    })
  }, [])

  return <App />
}

export default AppWithProviders
