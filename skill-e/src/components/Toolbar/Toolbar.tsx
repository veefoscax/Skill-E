import { Button } from '@/components/ui/button'
import { Circle, Square, Pause, Pencil, X, Settings } from 'lucide-react'
import { useEffect } from 'react'
import { useRecordingStore } from '@/stores'
import { useAudioRecording } from '@/hooks/useAudioRecording'
import { getCurrentWindow, PhysicalPosition } from '@tauri-apps/api/window'
import { WebviewWindow } from '@tauri-apps/api/webviewWindow'
import { createOverlayWindow, showOverlay, hideOverlay } from '@/lib/overlay/overlay-commands'

interface ToolbarProps {
  className?: string
}

/**
 * Floating Toolbar Component
 * 
 * Provides recording controls for Skill-E:
 * - Start/Pause/Stop recording buttons
 * - Timer display showing recording duration
 * - Annotation mode toggle
 * - Draggable area for window positioning
 * 
 * Requirements: FR-1.1, AC1, FR-3.1
 */
export function Toolbar(_props: ToolbarProps) {
  const {
    isRecording,
    isPaused,
    duration,
    startRecording: startRecordingState,
    pauseRecording: pauseRecordingState,
    resumeRecording: resumeRecordingState,
    stopRecording: stopRecordingState,
    updateDuration,
  } = useRecordingStore()

  // Audio recording hook - actual microphone capture
  const {
    startRecording: startAudio,
    stopRecording: stopAudio,
    pauseRecording: pauseAudio,
    resumeRecording: resumeAudio,
    error: audioError,
  } = useAudioRecording()

  // Initialize overlay window on mount
  useEffect(() => {
    createOverlayWindow().catch(console.error)

    return () => {
      // Optional: hide/destroy overlay on unmount
      hideOverlay().catch(console.error)
    }
  }, [])

  // Timer logic - runs when recording and not paused
  useEffect(() => {
    let interval: number | undefined

    if (isRecording && !isPaused) {
      interval = window.setInterval(() => {
        updateDuration(duration + 1)
      }, 1000)
    }

    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [isRecording, isPaused, duration, updateDuration])

  // Log audio errors
  useEffect(() => {
    if (audioError) {
      console.error('Audio recording error:', audioError)
    }
  }, [audioError])

  // Format elapsed time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Recording control handlers - integrate state AND audio
  const handleStartRecording = async () => {
    console.log('Starting recording with audio...')
    startRecordingState()

    // Show overlay
    try {
      await showOverlay()
      console.log('Overlay shown')
    } catch (error) {
      console.error('Failed to show overlay:', error)
    }

    try {
      await startAudio()
      console.log('Audio recording started!')
    } catch (error) {
      console.error('Failed to start audio:', error)
    }
  }

  const handlePauseRecording = () => {
    if (isPaused) {
      resumeRecordingState()
      resumeAudio()
    } else {
      pauseRecordingState()
      pauseAudio()
    }
  }

  const handleStopRecording = async () => {
    console.log('Stopping recording...')
    stopRecordingState()
    stopAudio()

    // Hide overlay
    try {
      await hideOverlay()
      console.log('Overlay hidden')
    } catch (error) {
      console.error('Failed to hide overlay:', error)
    }
  }

  const handleClose = async () => {
    try {
      const window = getCurrentWindow()
      await window.hide()
      console.log('Window hidden successfully')
    } catch (error) {
      console.error('Error hiding window:', error)
    }
  }

  const handleOpenSettings = async () => {
    try {
      // Check if settings window already exists
      const existingWindow = await WebviewWindow.getByLabel('settings')

      if (existingWindow) {
        // Calculate new position
        const mainWindow = getCurrentWindow()
        const position = await mainWindow.outerPosition()
        const size = await mainWindow.outerSize()
        const settingsX = position.x + size.width + 10
        const settingsY = position.y

        // Move and show
        await existingWindow.setPosition(new PhysicalPosition(settingsX, settingsY))
        await existingWindow.show()
        await existingWindow.setFocus()
      } else {
        // Calculate position relative to toolbar
        const mainWindow = getCurrentWindow()
        const position = await mainWindow.outerPosition()
        const size = await mainWindow.outerSize()

        // Open to the RIGHT of the toolbar with spacing
        // Calculate smart position relative to toolbar
        // @ts-expect-error currentMonitor is not in the type definition but exists at runtime
        const monitor = await getCurrentWindow().currentMonitor();
        const screenWidth = monitor?.size.width || 1920;
        const screenHeight = monitor?.size.height || 1080;
        const scale = monitor?.scaleFactor || 1;

        const settingsW = 300;
        const settingsH = 400;
        const toolbarW = size.width;
        const toolbarH = size.height;

        let targetX = position.x + toolbarW + 10; // Try Right first
        let targetY = position.y;

        // Check horizontal fit
        if (targetX + settingsW > screenWidth) {
          // Not enough space on right, try left
          targetX = position.x - settingsW - 10;
        }

        // Validate vertical fit (keep within screen)
        if (targetY + settingsH > screenHeight) {
          targetY = screenHeight - settingsH - 10;
        }
        if (targetY < 0) targetY = 10;

        // If left also fails (very narrow screen?), center it
        if (targetX < 0) {
          targetX = (screenWidth - settingsW) / 2;
          targetY = (screenHeight - settingsH) / 2;
        }

        console.log(`Positioning Settings at (${targetX}, ${targetY}) for Toolbar (${position.x}, ${position.y})`);

        // Create new settings window
        console.log('Creating settings window at', targetX, targetY);
        const settingsWindow = new WebviewWindow('settings', {
          url: 'index.html#/settings',
          title: 'Skill-E Settings',
          width: settingsW,
          height: settingsH,
          x: Math.round(targetX),
          y: Math.round(targetY),
          resizable: false,
          decorations: false,
          transparent: true,
          alwaysOnTop: true,
          skipTaskbar: true,
        })

        settingsWindow.once('tauri://created', () => {
          console.log('Settings window created successfully')
        })

        settingsWindow.once('tauri://error', (e) => {
          console.error('Error creating settings window:', e)
        })
      }
    } catch (error) {
      console.error('Error opening settings:', error)
    }
  }

  return (
    <div
      data-tauri-drag-region
      className="bg-background/80 backdrop-blur-xl border border-border rounded-lg shadow-2xl flex items-center gap-3"
      style={{
        width: '100%',
        height: '100%',
        position: 'fixed',
        top: 0,
        left: 0,
        padding: '8px 16px',
      }}
    >
      {/* Buttons on left - NOT draggable */}
      <div style={{ pointerEvents: 'auto' }} className="flex items-center gap-3">
        {/* Start/Pause Button */}
        {!isRecording ? (
          <Button
            size="icon"
            variant="default"
            className="h-9 w-9 rounded-full"
            onClick={handleStartRecording}
            title="Start Recording (Ctrl+Shift+R)"
          >
            <Circle className="h-4 w-4 fill-current" />
          </Button>
        ) : (
          <Button
            size="icon"
            variant={isPaused ? "default" : "secondary"}
            className={`h-9 w-9 rounded-full ${
              isPaused ? 'record-button-paused' : 'record-button-active'
            }`}
            onClick={handlePauseRecording}
            title={isPaused ? 'Resume Recording' : 'Pause Recording'}
          >
            {isPaused ? (
              <Circle className="h-4 w-4 fill-current" />
            ) : (
              <Pause className="h-4 w-4" />
            )}
          </Button>
        )}

        {/* Stop Button */}
        <Button
          size="icon"
          variant="outline"
          className="h-9 w-9"
          disabled={!isRecording}
          onClick={handleStopRecording}
          title="Stop Recording"
        >
          <Square className="h-4 w-4" />
        </Button>
      </div>

      {/* Timer Display - DRAGGABLE */}
      <div className="flex-1 text-center select-none">
        <span
          className={`text-sm font-mono ${isRecording && !isPaused
            ? 'text-destructive font-semibold'
            : 'text-muted-foreground'
            }`}
        >
          {formatTime(duration)}
        </span>
      </div>

      {/* Buttons on right - NOT draggable */}
      <div style={{ pointerEvents: 'auto' }} className="flex items-center gap-3">
        {/* Settings Button */}
        <Button
          size="icon"
          variant="ghost"
          className="h-9 w-9"
          onClick={handleOpenSettings}
          title="Settings"
        >
          <Settings className="h-4 w-4" />
        </Button>

        {/* Annotation Mode Toggle */}
        <Button
          size="icon"
          variant="ghost"
          className="h-9 w-9"
          disabled
          title="Annotation Mode (Coming Soon)"
        >
          <Pencil className="h-4 w-4" />
        </Button>

        {/* Close Button */}
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          onClick={handleClose}
          title="Hide to Tray"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
}

