/**
 * InlineOverlay - Overlay rendered inside main window (not separate window)
 *
 * This avoids the freeze/white screen issue with Tauri overlay windows.
 * Uses CSS pointer-events to allow clicking through to underlying content.
 */

import { useEffect, useState } from 'react'
import { listen, emit } from '@tauri-apps/api/event'
import { useRecordingStore } from '@/stores/recording'
import { useOverlayStore } from '@/stores/overlay'
import {
  Square,
  Pause,
  Play,
  Mic,
  Camera,
  MousePointer,
  Clock,
} from 'lucide-react'
import { Button } from '../ui/button'

interface InlineOverlayProps {
  onStop: () => void
}

export function InlineOverlay({ onStop }: InlineOverlayProps) {
  const { isRecording, isPaused, duration, pauseRecording, resumeRecording, stopRecording } =
    useRecordingStore()
  const { isVisible, mode, setMode, hideOverlay } = useOverlayStore()
  const [isEmergencyMode, setIsEmergencyMode] = useState(false)

  // Helper to add step and broadcast to main window
  const addStepAndBroadcast = async (step: any) => {
    // 1. Add to local store (for immediate feedback if we had UI here)
    useRecordingStore.getState().addStep(step)

    // 2. Broadcast to main window so Toolbar updates
    await emit('recording:step-added', step)
  }

  const [currentTime, setCurrentTime] = useState(new Date())
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [recentClicks, setRecentClicks] = useState<Array<{ x: number; y: number; time: number }>>(
    []
  )

  // Update clock
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  // Track mouse position
  useEffect(() => {
    if (!isRecording) return

    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY })
    }

    // Listen for steps from backend
    const unlistenStep = listen('recording:step-added', (event: any) => {
      const step = event.payload
      if (step.data?.position) {
        const { x, y } = step.data.position
        // Visual feedback
        setRecentClicks(prev => [...prev.slice(-4), { x, y, time: Date.now() }])
      }
    })

    const handleKeyDown = async (e: KeyboardEvent) => {
      // NOTE: Key logging is handled by backend global listener now
    }

    window.addEventListener('mousemove', handleMouseMove)
    // window.addEventListener('click', handleClick); // Removed: Use backend event
    // window.addEventListener('keydown', handleKeyDown); // Removed: Use backend event

    // Promise handling for unlisten
    let unlistener: () => void
    unlistenStep.then(f => (unlistener = f))

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      if (unlistener) unlistener()
    }
  }, [isRecording])

  // Clear old clicks
  useEffect(() => {
    const interval = setInterval(() => {
      setRecentClicks(prev => prev.filter(c => Date.now() - c.time < 2000))
    }, 500)
    return () => clearInterval(interval)
  }, [])

  // Format duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handlePauseResume = async () => {
    if (isPaused) {
      await resumeRecording()
    } else {
      await pauseRecording()
    }
  }

  const handleStop = async () => {
    console.log('🛑 InlineOverlay: handleStop called')
    try {
      await stopRecording()
      console.log('🛑 InlineOverlay: stopRecording completed')
      hideOverlay()
      console.log('🛑 InlineOverlay: hideOverlay completed')
      onStop()
      console.log('🛑 InlineOverlay: onStop callback completed')
    } catch (error) {
      console.error('❌ InlineOverlay: Error in handleStop:', error)
    }
  }

  // Safety mechanism: ESC key to stop recording
  useEffect(() => {
    if (!isRecording) return

    let escPressCount = 0
    let escTimeout: ReturnType<typeof setTimeout>

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        escPressCount++
        console.log(`🛑 ESC pressed ${escPressCount}/3`)

        if (escPressCount >= 3) {
          console.log('🛑 Triple ESC detected - forcing stop')
          handleStop()
          escPressCount = 0
        } else {
          // Reset count after 2 seconds
          clearTimeout(escTimeout)
          escTimeout = setTimeout(() => {
            escPressCount = 0
          }, 2000)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      clearTimeout(escTimeout)
    }
  }, [isRecording])

  // Don't render if not recording
  if (!isRecording) return null

  return (
    <div
      className="fixed inset-0 z-[9999] pointer-events-none"
      style={{ fontFamily: 'system-ui, sans-serif' }}
    >
      {/* Click Indicators */}
      {recentClicks.map((click, i) => (
        <div
          key={click.time}
          className="absolute w-8 h-8 -ml-4 -mt-4 rounded-full border-2 border-red-500 animate-ping pointer-events-none"
          style={{
            left: click.x,
            top: click.y,
            animationDuration: '1s',
            animationIterationCount: '1',
          }}
        />
      ))}

      {/* Cursor Highlight */}
      <div
        className="fixed w-6 h-6 -ml-3 -mt-3 rounded-full border-2 border-blue-500 bg-blue-500/20 pointer-events-none transition-transform duration-75"
        style={{
          left: mousePos.x,
          top: mousePos.y,
          transform: `scale(${recentClicks.some(c => Date.now() - c.time < 100) ? 1.5 : 1})`,
        }}
      />

      {/* Top Bar - Recording Info */}
      <div className="absolute top-0 left-0 right-0 bg-gray-900/90 text-white p-3 flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-4">
          {/* Recording Indicator - Click to stop */}
          <button
            onClick={handleStop}
            className="flex items-center gap-2 hover:bg-white/10 px-3 py-1 rounded transition-colors cursor-pointer"
            title="Clique para parar a gravação"
          >
            <div
              className={`w-3 h-3 rounded-full ${isPaused ? 'bg-yellow-500' : 'bg-red-500 animate-pulse'}`}
            />
            <span className="font-medium">
              {isPaused ? 'PAUSED (Clique para parar)' : 'REC (Clique para parar)'}
            </span>
          </button>

          {/* Duration */}
          <div className="flex items-center gap-1 text-lg font-mono">
            <Clock className="w-4 h-4 text-gray-400" />
            {formatDuration(duration)}
          </div>

          {/* Indicators */}
          <div className="flex items-center gap-2 ml-4">
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Mic className="w-3 h-3" />
              <span>AUDIO</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Camera className="w-3 h-3" />
              <span>SCREEN</span>
            </div>
          </div>
        </div>

        {/* Mode Toggle */}
        <div className="flex items-center gap-2">
          <Button
            variant={mode === 'select' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setMode('select')}
            className="h-8"
          >
            <MousePointer className="w-4 h-4 mr-1" />
            Select
          </Button>
          <Button
            variant={mode === 'draw' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setMode('draw')}
            className="h-8"
          >
            Draw
          </Button>
        </div>
      </div>

      {/* Bottom Bar - Controls */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-gray-900/90 text-white p-3 rounded-full pointer-events-auto shadow-2xl">
        {/* Pause/Resume */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handlePauseResume}
          className="w-12 h-12 rounded-full hover:bg-white/10"
        >
          {isPaused ? <Play className="w-6 h-6 fill-white" /> : <Pause className="w-6 h-6" />}
        </Button>

        {/* Divider */}
        <div className="w-px h-8 bg-white/20" />

        {/* Stop - CHANGED to "Parar e Processar" */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleStop}
          className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700"
        >
          <Square className="w-6 h-6 fill-white" />
        </Button>
      </div>

      {/* Stop Button Label */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 text-white text-sm font-medium pointer-events-none">
        Parar e Processar
      </div>

      {/* Recording Hint */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full text-sm pointer-events-none">
        Clique em elementos para marcar steps
      </div>

      {/* Keyboard Shortcuts Hint */}
      <div className="absolute bottom-8 right-8 text-white/60 text-xs pointer-events-none">
        <div>Ctrl+Shift+R - Toggle Recording</div>
        <div>Esc x3 - Emergency Stop</div>
      </div>

      {/* Emergency Stop Button - Always visible in corner */}
      <button
        onClick={handleStop}
        className="absolute top-20 right-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold shadow-lg pointer-events-auto z-[10000] animate-pulse"
        title="Parar Gravação (Emergência)"
      >
        🛑 PARAR
      </button>
    </div>
  )
}
