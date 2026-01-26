import { Button } from '@/components/ui/button'
import { Circle, Square, Pause, Pencil, X } from 'lucide-react'
import { useEffect } from 'react'
import { useRecordingStore } from '@/stores'
import { getCurrentWindow } from '@tauri-apps/api/window'

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
 * Requirements: FR-1.1, AC1
 */
export function Toolbar({ className }: ToolbarProps) {
  const {
    isRecording,
    isPaused,
    duration,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    updateDuration,
  } = useRecordingStore()

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

  // Format elapsed time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Recording control handlers
  const handleStartRecording = () => {
    startRecording()
  }

  const handlePauseRecording = () => {
    if (isPaused) {
      resumeRecording()
    } else {
      pauseRecording()
    }
  }

  const handleStopRecording = () => {
    stopRecording()
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
            className="h-9 w-9 rounded-full"
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
          className={`text-sm font-mono ${
            isRecording && !isPaused 
              ? 'text-destructive font-semibold' 
              : 'text-muted-foreground'
          }`}
        >
          {formatTime(duration)}
        </span>
      </div>

      {/* Buttons on right - NOT draggable */}
      <div style={{ pointerEvents: 'auto' }} className="flex items-center gap-3">
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
