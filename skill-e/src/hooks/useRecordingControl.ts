import { useRef } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { useRecordingStore } from '../stores/recording'
import { useAudioRecording } from './useAudioRecording'
import { useCapture } from './useCapture'

function toErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message.trim()
  }

  if (typeof error === 'string' && error.trim()) {
    return error.trim()
  }

  return fallback
}

export function useRecordingControl() {
  const startRecordingStore = useRecordingStore(state => state.startRecording)
  const stopRecordingStore = useRecordingStore(state => state.stopRecording)
  const setSessionDirectoryStore = useRecordingStore(state => state.setSessionDirectory)

  const { startCapture, stopCapture, getCurrentSession, updateManifestAudio } = useCapture()
  const {
    startRecording: startAudio,
    stopRecording: stopAudio,
    setSessionDirectory: setAudioSessionDirectory,
  } = useAudioRecording()

  const sessionDirRef = useRef<string | null>(null)

  const handleStart = async () => {
    console.log('[useRecordingControl] handleStart called')

    try {
      await invoke('initialize_recording')
      await startRecordingStore()

      let session:
        | {
            directory?: string
          }
        | undefined

      let screenCaptureStarted = false
      let audioRecordingStarted = false
      const startupErrors: string[] = []

      try {
        console.log('[useRecordingControl] Starting screen capture...')
        session = await startCapture(1000)

        if (!session) {
          startupErrors.push('Screen capture did not create a session.')
        } else {
          screenCaptureStarted = true
        }

        if (session?.directory) {
          sessionDirRef.current = session.directory
          setAudioSessionDirectory(session.directory)
          setSessionDirectoryStore(session.directory)
          ;(window as any).__CURRENT_SESSION_DIR__ = session.directory
        } else {
          startupErrors.push('Screen capture did not create a session folder.')
        }
      } catch (error) {
        console.warn('[useRecordingControl] Screen capture failed', error)
        startupErrors.push(`Screen capture failed: ${toErrorMessage(error, 'unknown error')}`)
      }

      try {
        console.log('[useRecordingControl] Starting audio recording...')
        await startAudio()
        audioRecordingStarted = true
      } catch (error) {
        console.warn('[useRecordingControl] Audio recording failed', error)
        startupErrors.push(`Microphone failed: ${toErrorMessage(error, 'unknown error')}`)
      }

      if (!screenCaptureStarted || !audioRecordingStarted) {
        try {
          await stopCapture()
        } catch (error) {
          console.warn('[useRecordingControl] Cleanup stopCapture failed', error)
        }

        try {
          await stopAudio(sessionDirRef.current || undefined)
        } catch (error) {
          console.warn('[useRecordingControl] Cleanup stopAudio failed', error)
        }

        sessionDirRef.current = null
        setAudioSessionDirectory('')
        setSessionDirectoryStore(null)
        ;(window as any).__CURRENT_SESSION_DIR__ = null
        stopRecordingStore()

        throw new Error(startupErrors.join(' '))
      }

      import('../lib/window-controls').then(w => w.setRecordingMode())
    } catch (error) {
      console.error('[useRecordingControl] Failed to start recording', error)
      stopRecordingStore()
      throw error
    }
  }

  const handleStop = async (): Promise<string | null> => {
    console.log('[useRecordingControl] handleStop called')

    try {
      let sessionDir: string | null = null

      const currentSession = getCurrentSession()
      if (currentSession) {
        sessionDir = currentSession.directory
      }

      if (!sessionDir && sessionDirRef.current) {
        sessionDir = sessionDirRef.current
      }

      if (!sessionDir) {
        sessionDir = useRecordingStore.getState().sessionDirectory
      }

      if (!sessionDir && (window as any).__CURRENT_SESSION_DIR__) {
        sessionDir = (window as any).__CURRENT_SESSION_DIR__
      }

      console.log('[useRecordingControl] Final sessionDir for stop:', sessionDir)

      try {
        await stopCapture()
      } catch (error) {
        console.warn('[useRecordingControl] stopCapture failed', error)
      }

      let audioPath: string | null = null
      try {
        audioPath = await stopAudio(sessionDir || undefined)
        console.log('[useRecordingControl] Audio saved at:', audioPath)
      } catch (error) {
        console.warn('[useRecordingControl] stopAudio failed', error)
      }

      if (sessionDir && audioPath) {
        await updateManifestAudio(sessionDir, audioPath)
      }

      if (sessionDir) {
        ;(window as any).__LAST_SESSION_DIR__ = sessionDir
      }

      await stopRecordingStore()

      sessionDirRef.current = null
      setAudioSessionDirectory('')
      setSessionDirectoryStore(null)
      ;(window as any).__CURRENT_SESSION_DIR__ = null

      return sessionDir
    } catch (error) {
      console.error('[useRecordingControl] Failed to stop recording', error)
      return null
    }
  }

  return {
    handleStart,
    handleStop,
    sessionDir: sessionDirRef.current,
  }
}
