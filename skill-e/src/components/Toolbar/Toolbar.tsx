import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
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
      console.log('Close button clicked')
      const window = getCurrentWindow()
      console.log('Got window, hiding...')
      await window.hide()
      console.log('Window hidden')
    } catch (error) {
      console.error('Error hiding window:', error)
    }
  }

  return (
    <div 
      data-tauri-drag-region
      className={`bg-background/80 backdrop-blur-xl border border-border rounded-lg shadow-2xl px-4 py-2 flex items-center gap-3 ${className || ''}`}
      style={{
        width: '100vw',
        height: '100vh',
      }}
    >
      <TooltipProvider>
        {/* Start/Pause Button */}
        {!isRecording ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                size="icon" 
                variant="default"
                className="h-9 w-9 rounded-full"
                onClick={handleStartRecording}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <Circle className="h-4 w-4 fill-current" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Start Recording (Ctrl+Shift+R)</p>
            </TooltipContent>
          </Tooltip>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                size="icon" 
                variant={isPaused ? "default" : "secondary"}
                className="h-9 w-9 rounded-full"
                onClick={handlePauseRecording}
                onPointerDown={(e) => e.stopPropagation()}
              >
                {isPaused ? (
                  <Circle className="h-4 w-4 fill-current" />
                ) : (
                  <Pause className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isPaused ? 'Resume Recording' : 'Pause Recording'}</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Stop Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              size="icon" 
              variant="outline"
              className="h-9 w-9"
              disabled={!isRecording}
              onClick={handleStopRecording}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <Square className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Stop Recording</p>
          </TooltipContent>
        </Tooltip>

        {/* Timer Display */}
        <div 
          className="flex-1 text-center select-none"
        >
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

        {/* Annotation Mode Toggle - Placeholder for future implementation */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              size="icon" 
              variant="ghost"
              className="h-9 w-9"
              disabled
              onPointerDown={(e) => e.stopPropagation()}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Annotation Mode (Coming Soon)</p>
          </TooltipContent>
        </Tooltip>

        {/* Close Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              size="icon" 
              variant="ghost"
              className="h-7 w-7"
              onClick={handleClose}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <X className="h-3 w-3" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Hide to Tray</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}
