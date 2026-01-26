import { Toolbar } from '@/components/Toolbar'
import { useWindowPosition } from '@/hooks/useWindowPosition'
import { useSystemTray } from '@/hooks/useSystemTray'
import { useGlobalShortcuts } from '@/hooks/useGlobalShortcuts'
import { useRecordingStore } from '@/stores/recording'

function App() {
  // Initialize window position persistence
  useWindowPosition();
  
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
    <div 
      className="h-screen w-full flex items-center justify-center"
      style={{ 
        background: 'transparent',
      }}
    >
      <Toolbar />
    </div>
  )
}

export default App
