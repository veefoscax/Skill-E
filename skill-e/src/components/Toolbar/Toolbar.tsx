/**
 * Toolbar - Main floating toolbar for recording
 *
 * Features:
 * - Shows recording controls
 * - Launches InlineOverlay when recording
 * - Provides feedback during operations
 */

import { useEffect, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { emit } from '@tauri-apps/api/event'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { Settings, Circle, Square, Pause, Play, X, Loader2, RefreshCw } from 'lucide-react'
import { Button } from '../ui/button'
import { useAudioRecording } from '../../hooks/useAudioRecording'
import { useCapture } from '../../hooks/useCapture'
import { useRecordingStore } from '../../stores/recording'
import { useSettingsStore } from '../../stores/settings'
import { useDayModeStore } from '../../stores/day-mode'

interface ToolbarProps {
  onStart?: () => Promise<void>
  onStop: () => void
}

export function Toolbar({ onStart, onStop }: ToolbarProps) {
  // Recording state from store
  const {
    isRecording,
    isPaused,
    duration,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    setDuration,
  } = useRecordingStore()
  const {
    dayModeEnabled,
    setDayModeEnabled,
    segmentDurationMinutes,
  } = useSettingsStore()
  const {
    isActive: isDayModeActive,
    processorBusy,
    queue,
    completedToday,
    failedToday,
  } = useDayModeStore()
  const pendingCount = queue.filter(item => item.status === 'pending').length
  const diaryStateLabel = isDayModeActive ? 'Live' : 'Ready'

  // Audio recording
  const {
    startRecording: startAudio,
    stopRecording: stopAudio,
    isRecording: isAudioRecording,
  } = useAudioRecording()

  // Screen capture
  const { startCapture, stopCapture, getCurrentSession, updateManifestAudio } = useCapture()

  // Local state
  const [isStarting, setIsStarting] = useState(false)
  const [isStopping, setIsStopping] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Timer effect
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null

    if (isRecording && !isPaused) {
      interval = setInterval(() => {
        setDuration(duration + 1)
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRecording, isPaused, duration, setDuration])

  // Format duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Start recording
  const handleStartRecording = async () => {
    setIsStarting(true)
    setError(null)

    try {
      // If onStart prop is provided (from App), use it (it handles everything)
      if (onStart) {
        console.log('Toolbar: Using onStart from App')
        await onStart()
        emit('recording:start')
        console.log('Toolbar: Recording started via App')
        return
      }

      // Fallback: use internal logic (old behavior)
      console.log('Toolbar: Using internal start logic')
      await invoke('initialize_recording')
      await startRecording()

      try {
        await startCapture(1000)
        console.log('Screen capture started')
      } catch (captureError) {
        console.warn('Screen capture failed:', captureError)
      }

      try {
        await startAudio()
      } catch (audioError) {
        console.warn('Audio recording failed:', audioError)
      }

      emit('recording:start')
      console.log('Recording started successfully')
    } catch (error) {
      console.error('Failed to start recording:', error)
      setError('Failed to start: ' + String(error))
      stopRecording()
    } finally {
      setIsStarting(false)
    }
  }

  // Stop recording
  const handleStopRecording = async () => {
    setIsStopping(true)
    setError(null)

    try {
      // If onStart prop is provided (meaning App manages recording),
      // we should let App handle the stop logic via onStop callback
      if (onStart) {
        console.log('Toolbar: Stopping via App onStop')
        emit('recording:stop')
        await stopRecording() // Update store state
        onStop() // App handles the rest
        console.log('Toolbar: Stop callback completed')
        return
      }

      // Fallback: use internal logic
      console.log('Toolbar: Using internal stop logic')
      let currentSessionDir: string | null = null
      try {
        const session = getCurrentSession()
        if (session) currentSessionDir = session.directory
        await stopCapture()
        console.log('Screen capture stopped')
      } catch (e) {
        console.warn('Screen capture stop warning:', e)
      }

      let savedAudioPath: string | null = null
      try {
        savedAudioPath = await stopAudio()
        console.log('Audio stopped, saved to:', savedAudioPath)
      } catch (e) {
        console.warn('Audio stop warning:', e)
      }

      if (currentSessionDir && savedAudioPath) {
        await updateManifestAudio(currentSessionDir, savedAudioPath)
      }

      emit('recording:stop')
      await stopRecording()

      if (currentSessionDir) {
        ;(window as any).__LAST_SESSION_DIR__ = currentSessionDir
      }
      onStop()
    } catch (error) {
      console.error('Failed to stop recording:', error)
      setError('Failed to stop: ' + String(error))
    } finally {
      setIsStopping(false)
    }
  }

  // Pause/Resume
  const handlePauseResume = async () => {
    try {
      if (isPaused) {
        await resumeRecording()
      } else {
        await pauseRecording()
      }
    } catch (error) {
      console.error('Pause/Resume error:', error)
    }
  }

  // Open settings
  const openSettings = async () => {
    try {
      await invoke('create_settings_window')
    } catch (error) {
      console.error('Failed to open settings:', error)
    }
  }

  // Close toolbar (minimize to tray)
  const handleClose = async () => {
    const window = getCurrentWindow()
    await window.hide()
  }

  return (
    <>
      {/* Inline Overlay moved to separate window */}

      {/* Main Toolbar */}
      <div
        data-tauri-drag-region
        className={`
          relative
          flex items-center justify-between gap-3 
          w-full h-full
          px-4 py-2
          bg-white rounded-xl shadow-sm
          border border-gray-200
          transition-all duration-200
          cursor-default
          ${isRecording ? 'ring-2 ring-red-500 ring-offset-2' : ''}
        `}
      >
        {/* Status indicator */}
        {isRecording && (
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${isPaused ? 'bg-yellow-500' : 'bg-red-500 animate-pulse'}`}
            />
          </div>
        )}

        {/* Timer */}
        <div className="font-mono text-lg font-semibold min-w-[4rem] text-center">
          {formatDuration(duration)}
        </div>

        {/* Use step count from store */}
        <div className="bg-gray-100 rounded px-2 py-1 text-xs font-medium text-gray-600">
          {useRecordingStore(s => s.steps.length)} steps
        </div>

        {dayModeEnabled && (
          <div className="bg-blue-50 rounded px-2 py-1 text-xs font-medium text-blue-700 flex items-center gap-1 min-w-[11.5rem]">
            <RefreshCw className={`w-3 h-3 ${processorBusy ? 'animate-spin' : ''}`} />
            <span>
              Diary {diaryStateLabel} {segmentDurationMinutes}m
              {pendingCount > 0 ? ` | queue ${pendingCount}` : ''}
              {completedToday > 0 ? ` | done ${completedToday}` : ''}
              {failedToday > 0 ? ` | fail ${failedToday}` : ''}
            </span>
          </div>
        )}

        {/* Divider */}
        <div className="w-px h-8 bg-gray-200" />

        {/* Recording Controls */}
        {!isRecording ? (
          // Start button
          <Button
            variant="ghost"
            size="icon"
            onClick={handleStartRecording}
            disabled={isStarting}
            className="text-red-500 hover:text-red-600 hover:bg-red-50"
            aria-label="Start Recording"
          >
            {isStarting ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <Circle className="w-6 h-6" />
            )}
          </Button>
        ) : (
          // Recording controls
          <>
            {/* Pause/Resume */}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handlePauseResume} 
              disabled={isStopping}
              aria-label={isPaused ? "Resume Recording" : "Pause Recording"}
            >
              {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
            </Button>

            {/* Stop - Now with process indication */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleStopRecording}
              disabled={isStopping}
              className="text-red-500 hover:text-red-600 hover:bg-red-50"
              title="Parar e Processar"
              aria-label="Stop Recording"
            >
              {isStopping ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Square className="w-5 h-5 fill-current" />
              )}
            </Button>
          </>
        )}

        {/* Divider */}
        <div className="w-px h-8 bg-gray-200" />

        {/* Settings */}
        <Button
          variant={dayModeEnabled ? 'default' : 'ghost'}
          size="icon"
          onClick={() => setDayModeEnabled(!dayModeEnabled)}
          title={dayModeEnabled ? 'Disable Work Diary' : 'Enable Work Diary'}
          className={dayModeEnabled ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}
        >
          <RefreshCw className={`w-5 h-5 ${isDayModeActive ? 'animate-spin' : ''}`} />
        </Button>

        <Button variant="ghost" size="icon" onClick={openSettings}>
          <Settings className="w-5 h-5 text-gray-600" />
        </Button>

        {/* Close */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="fixed top-20 right-4 z-[10001] bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
    </>
  )
}
