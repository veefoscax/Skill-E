import { Toolbar } from '@/components/Toolbar'
import { CaptureTest } from '@/components/CaptureTest'
import { CaptureCommandTest } from '@/components/CaptureCommandTest'
import { CaptureHookTest } from '@/components/CaptureHookTest'
import { CaptureIntegrationTest } from '@/components/CaptureIntegrationTest'
import { AudioRecordingTest } from '@/components/AudioRecordingTest'
import { AudioTestSuite } from '@/components/AudioTestSuite'
import { SettingsTest } from '@/components/SettingsTest'
import { MicrophoneDiagnostic } from '@/components/MicrophoneDiagnostic'
// import { useWindowPosition } from '@/hooks/useWindowPosition'
import { useSystemTray } from '@/hooks/useSystemTray'
import { useGlobalShortcuts } from '@/hooks/useGlobalShortcuts'
import { useRecordingStore } from '@/stores/recording'

function App() {
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
      <MicrophoneDiagnostic />
      {/* TASK S03-6: Audio Testing - Comprehensive Test Suite */}
      <AudioTestSuite />
      {/* TASK S03-5: Settings Integration Test */}
      <SettingsTest />
      {/* TASK S03-1: Audio Recording Hook Test */}
      <AudioRecordingTest />
      {/* TASK 9: Comprehensive Integration Test for Screen Capture */}
      <CaptureIntegrationTest />
      {/* TEMPORARY: Test component for Task 2 - Screen Capture */}
      <CaptureTest />
      {/* TEMPORARY: Test component for Task 5 - Command Registration */}
      <CaptureCommandTest />
      {/* TEMPORARY: Test component for Task 7 - Capture Hook */}
      <CaptureHookTest />
    </div>
  )
}

export default App
