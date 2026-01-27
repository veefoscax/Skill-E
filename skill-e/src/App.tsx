import { Toolbar } from '@/components/Toolbar'
import { MicrophoneDiagnostic } from '@/components/MicrophoneDiagnostic'
import { Settings } from '@/components/settings'
import { Overlay } from '@/components/Overlay/Overlay'
import { OverlayTest } from '@/components/OverlayTest'
import { ClickIndicatorTest } from '@/components/ClickIndicatorTest'
import { DrawingRenderingTest } from '@/components/DrawingRenderingTest'
import { ColorSelectionTest } from '@/components/ColorSelectionTest'
import { FadePinModeTest } from '@/components/FadePinModeTest'
import { KeyboardDisplayTest } from '@/components/KeyboardDisplayTest'
import { PasswordRedactionTest } from '@/components/PasswordRedactionTest'
import { OverlayStoreTest } from '@/components/OverlayStoreTest'
import { ElementSelectorTest } from '@/components/ElementSelectorTest'
import { ElementHighlightingTest } from '@/components/ElementHighlightingTest'
import { ElementSelectionTest } from '@/components/ElementSelectionTest'
import { ProcessingProgressTest } from '@/components/ProcessingProgressTest'
import { ToolbarPulseTest } from '@/components/ToolbarPulseTest'
import { StatusIndicatorTest } from '@/components/StatusIndicatorTest'
import { StepTrackingTest } from '@/components/StepTrackingTest'
import { StepBubbleTest } from '@/components/StepBubbleTest'
import { TimelineTest } from '@/components/TimelineTest'
import { AutoFadeTest } from '@/components/AutoFadeTest'
import { StepCounterBadgeTest } from '@/components/StepCounterBadgeTest'
import { TimelineComprehensiveTest } from '@/components/TimelineComprehensiveTest'
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
 * - #/overlay: Overlay window view (transparent fullscreen)
 * - #/overlay-test: Overlay test page
 * - #/click-indicator-test: Click indicator test page
 * - #/drawing-rendering-test: Drawing rendering test page (Task S04-8)
 * - #/color-selection-test: Color selection test page (Task S04-9)
 * - #/fade-pin-mode-test: Fade vs pin mode test page (Task S04-10)
 * - #/keyboard-display-test: Keyboard display test page (Task S04-12)
 * - #/password-redaction-test: Password redaction test page (Task S04-13)
 * - #/overlay-store-test: Overlay store test page (Task S04-17)
 * - #/element-selector-test: Element selector test page (Task S04-14)
 * - #/element-highlighting-test: Element highlighting test page (Task S04-15)
 * - #/element-selection-test: Element selection test page (Task S04-16)
 * - #/processing-progress-test: Processing progress test page (Task S05-6)
 * - #/toolbar-pulse-test: Toolbar pulse animation test page (Task S04-25)
 * - #/status-indicator-test: Status indicator test page (Task S04-26)
 * - #/step-tracking-test: Step tracking test page (Task S04-27)
 * - #/step-bubble-test: Step bubble component test page (Task S04-28)
 * - #/timeline-test: Timeline container test page (Task S04-29)
 * - #/auto-fade-test: Auto-fade logic test page (Task S04-30)
 * - #/step-counter-badge-test: Step counter badge test page (Task S04-31)
 * - #/timeline-comprehensive-test: Timeline comprehensive test page (Task S04-32)
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

  // Overlay test page - for testing overlay functionality
  if (route === '#/overlay-test') {
    return (
      <div className="h-screen w-screen overflow-auto bg-background">
        <OverlayTest />
      </div>
    )
  }

  // Click indicator test page - for testing click indicators
  if (route === '#/click-indicator-test') {
    return <ClickIndicatorTest />
  }

  // Drawing rendering test page - for testing drawing rendering (Task S04-8)
  if (route === '#/drawing-rendering-test') {
    return (
      <div className="h-screen w-screen overflow-auto bg-background">
        <DrawingRenderingTest />
      </div>
    )
  }

  // Color selection test page - for testing color selection (Task S04-9)
  if (route === '#/color-selection-test') {
    return <ColorSelectionTest />
  }

  // Fade vs pin mode test page - for testing fade and pin modes (Task S04-10)
  if (route === '#/fade-pin-mode-test') {
    return <FadePinModeTest />
  }

  // Keyboard display test page - for testing keyboard display (Task S04-12)
  if (route === '#/keyboard-display-test') {
    return (
      <div className="h-screen w-screen overflow-auto bg-background">
        <KeyboardDisplayTest />
      </div>
    )
  }

  // Password redaction test page - for testing password redaction (Task S04-13)
  if (route === '#/password-redaction-test') {
    return (
      <div className="h-screen w-screen overflow-auto bg-background">
        <PasswordRedactionTest />
      </div>
    )
  }

  // Overlay store test page - for testing overlay store (Task S04-17)
  if (route === '#/overlay-store-test') {
    return (
      <div className="h-screen w-screen overflow-auto bg-background">
        <OverlayStoreTest />
      </div>
    )
  }

  // Element selector test page - for testing element selector (Task S04-14)
  if (route === '#/element-selector-test') {
    return (
      <div className="h-screen w-screen overflow-auto bg-background">
        <ElementSelectorTest />
      </div>
    )
  }

  // Element highlighting test page - for testing element highlighting (Task S04-15)
  if (route === '#/element-highlighting-test') {
    return (
      <div className="h-screen w-screen overflow-auto bg-background">
        <ElementHighlightingTest />
      </div>
    )
  }

  // Element selection test page - for testing element selection (Task S04-16)
  if (route === '#/element-selection-test') {
    return (
      <div className="h-screen w-screen overflow-auto bg-background">
        <ElementSelectionTest />
      </div>
    )
  }

  // Processing progress test page - for testing processing progress (Task S05-6)
  if (route === '#/processing-progress-test') {
    return (
      <div className="h-screen w-screen overflow-auto bg-background">
        <ProcessingProgressTest />
      </div>
    )
  }

  // Toolbar pulse animation test page - for testing toolbar pulse animation (Task S04-25)
  if (route === '#/toolbar-pulse-test') {
    return (
      <div className="h-screen w-screen overflow-auto bg-background">
        <ToolbarPulseTest />
      </div>
    )
  }

  // Status indicator test page - for testing status indicator (Task S04-26)
  if (route === '#/status-indicator-test') {
    return (
      <div className="h-screen w-screen overflow-auto bg-background">
        <StatusIndicatorTest />
      </div>
    )
  }

  // Step tracking test page - for testing step tracking (Task S04-27)
  if (route === '#/step-tracking-test') {
    return (
      <div className="h-screen w-screen overflow-auto bg-background">
        <StepTrackingTest />
      </div>
    )
  }

  // Step bubble test page - for testing step bubble component (Task S04-28)
  if (route === '#/step-bubble-test') {
    return (
      <div className="h-screen w-screen overflow-auto bg-background">
        <StepBubbleTest />
      </div>
    )
  }

  // Timeline test page - for testing timeline container (Task S04-29)
  if (route === '#/timeline-test') {
    return (
      <div className="h-screen w-screen overflow-auto bg-background">
        <TimelineTest />
      </div>
    )
  }

  // Auto-fade test page - for testing auto-fade logic (Task S04-30)
  if (route === '#/auto-fade-test') {
    return (
      <div className="h-screen w-screen overflow-auto bg-background">
        <AutoFadeTest />
      </div>
    )
  }

  // Step counter badge test page - for testing step counter badge (Task S04-31)
  if (route === '#/step-counter-badge-test') {
    return (
      <div className="h-screen w-screen overflow-auto bg-background">
        <StepCounterBadgeTest />
      </div>
    )
  }

  // Timeline comprehensive test page - for comprehensive timeline testing (Task S04-32)
  if (route === '#/timeline-comprehensive-test') {
    return (
      <div className="h-screen w-screen overflow-auto bg-background">
        <TimelineComprehensiveTest />
      </div>
    )
  }

  // Settings page - separate window
  if (route === '#/settings') {
    return (
      <div className="h-screen w-screen overflow-hidden bg-background">
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
