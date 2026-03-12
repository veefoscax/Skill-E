import { useCallback, useRef } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { useRecordingStore } from '../stores/recording'
import { useSettingsStore } from '../stores/settings'
import type {
  CaptureResult,
  WindowInfo,
  CaptureFrame,
  CaptureSession,
  SessionManifest,
} from '../types/capture'

/**
 * Hook for managing screen capture during recording sessions
 *
 * Provides functions to start/stop periodic screen captures with
 * window tracking, cursor position logging, and session storage.
 *
 * Requirements:
 * - FR-2.2: Take periodic screenshots during recording (1/sec)
 * - FR-2.3: Detect active window and track focus changes
 * - FR-2.4: Capture mouse cursor position for each frame
 * - FR-2.5: Store captures with timestamps for timeline sync
 * - NFR-2.3: Memory-efficient streaming (don't load all to RAM)
 */
export function useCapture() {
  const intervalRef = useRef<number | null>(null)
  const sessionRef = useRef<CaptureSession | null>(null)
  const addFrame = useRecordingStore(state => state.addFrame)
  const outputDir = useSettingsStore(state => state.outputDir)

  /**
   * Captures a single frame with screenshot, window info, and cursor position
   *
   * @param session - Current capture session
   * @returns Promise that resolves when the frame is captured and stored
   */
  const captureFrame = useCallback(
    async (session: CaptureSession): Promise<void> => {
      try {
        const timestamp = Date.now()
        const frameNumber = session.frames.length + 1
        const frameId = `${session.id}-frame-${frameNumber}`

        // Generate output path for this frame (relative to session directory)
        const fileName = `frame-${frameNumber}.webp`
        const outputPath = `${session.directory}/${fileName}`

        // Capture screen, window info, and cursor position in parallel
        const [captureResult, windowInfo, cursorPos] = await Promise.all([
          invoke<CaptureResult>('capture_screen', { outputPath }),
          invoke<WindowInfo>('get_active_window').catch(() => undefined),
          invoke<[number, number]>('get_cursor_position').catch(() => undefined),
        ])

        // Create frame object
        const frame: CaptureFrame = {
          id: frameId,
          timestamp: captureResult.timestamp,
          imagePath: captureResult.path,
          activeWindow: windowInfo,
          cursorPosition: cursorPos ? { x: cursorPos[0], y: cursorPos[1] } : undefined,
        }

        // Add frame to session
        session.frames.push(frame)

        // Update recording state in Rust (for processing)
        await invoke('add_recording_frame', {
          timestamp: frame.timestamp,
          path: frame.imagePath,
          cursorX: frame.cursorPosition?.x,
          cursorY: frame.cursorPosition?.y,
        }).catch(e => console.warn('Failed to update recording state:', e))

        // Update manifest on disk
        const manifest: SessionManifest = {
          sessionId: session.id,
          startTime: session.startTime,
          endTime: session.endTime,
          intervalMs: session.intervalMs,
          frames: session.frames.map(f => ({
            id: f.id,
            timestamp: f.timestamp,
            imagePath: f.imagePath.replace(`${session.directory}/`, ''), // Store relative path
            activeWindow: f.activeWindow,
            cursorPosition: f.cursorPosition,
          })),
        }

        await invoke('save_session_manifest', {
          sessionDir: session.directory,
          manifest,
        })

        // Also store in recording store for UI updates
        addFrame({
          timestamp: frame.timestamp,
          imageData: frame.imagePath,
          cursorPosition: frame.cursorPosition,
        })

        console.log(`Captured frame ${frameId} at ${new Date(timestamp).toISOString()}`)
      } catch (error) {
        console.error('Failed to capture frame:', error)
        // Don't throw - we want to continue capturing even if one frame fails
      }
    },
    [addFrame]
  )

  /**
   * Starts periodic screen capture with session storage
   *
   * @param intervalMs - Capture interval in milliseconds (default: 1000ms = 1 second)
   * @returns Session object for the current capture session
   */
  const startCapture = useCallback(
    async (intervalMs: number = 1000): Promise<CaptureSession> => {
      console.log('📸 useCapture: startCapture called')

      // Stop any existing capture
      if (intervalRef.current !== null) {
        console.log('📸 useCapture: Stopping existing capture')
        await stopCapture()
      }

      // Generate unique session ID
      const sessionId = `session-${Date.now()}`
      const startTime = Date.now()
      console.log('📸 useCapture: Generated sessionId:', sessionId)

      // Create session directory
      console.log('📸 useCapture: Creating session directory...')
      const sessionDirectory = await invoke<string>('create_session_directory', {
        sessionId,
        customOutputDir: outputDir || null,
      })
      console.log('📸 useCapture: Session directory created:', sessionDirectory)

      // Create session object
      const session: CaptureSession = {
        id: sessionId,
        directory: sessionDirectory,
        startTime,
        intervalMs,
        frames: [],
      }

      sessionRef.current = session

      console.log(
        `✅ useCapture: Starting capture session ${sessionId} with interval ${intervalMs}ms`
      )
      console.log(`✅ useCapture: Session object:`, session)
      console.log(`✅ useCapture: Session directory: ${sessionDirectory}`)

      // Create initial manifest
      const manifest: SessionManifest = {
        sessionId: session.id,
        startTime: session.startTime,
        intervalMs: session.intervalMs,
        frames: [],
      }

      await invoke('save_session_manifest', {
        sessionDir: session.directory,
        manifest,
      })

      // Notify Backend to start Input Listener (S09)
      await invoke('start_capture')

      // Capture first frame immediately
      await captureFrame(session)

      // Set up periodic capture
      intervalRef.current = window.setInterval(() => {
        if (sessionRef.current) {
          captureFrame(sessionRef.current)
        }
      }, intervalMs)

      console.log('✅ useCapture: Returning session:', session)
      return session
    },
    [captureFrame]
  )

  /**
   * Stops the current capture session and finalizes the manifest
   */
  const stopCapture = useCallback(async (): Promise<void> => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    if (sessionRef.current) {
      const session = sessionRef.current
      session.endTime = Date.now()

      console.log(`Stopping capture session ${session.id}`)
      console.log(`Captured ${session.frames.length} frames`)

      // Save final manifest with end time
      const manifest: SessionManifest = {
        sessionId: session.id,
        startTime: session.startTime,
        endTime: session.endTime,
        intervalMs: session.intervalMs,
        frames: session.frames.map(f => ({
          id: f.id,
          timestamp: f.timestamp,
          imagePath: f.imagePath.replace(`${session.directory}/`, ''), // Store relative path
          activeWindow: f.activeWindow,
          cursorPosition: f.cursorPosition,
        })),
      }

      await invoke('save_session_manifest', {
        sessionDir: session.directory,
        manifest,
      })

      // Notify Backend to stop Input Listener
      await invoke('stop_capture')

      sessionRef.current = null
    }
  }, [])

  /**
   * Cleans up a session directory and all its contents
   *
   * @param sessionDir - Path to the session directory to delete
   */
  const cleanupSession = useCallback(async (sessionDir: string): Promise<void> => {
    await invoke('cleanup_session', { sessionDir })
    console.log(`Cleaned up session: ${sessionDir}`)
  }, [])

  /**
   * Loads a session manifest from disk
   *
   * @param sessionDir - Path to the session directory
   * @returns The loaded session manifest
   */
  const loadSessionManifest = useCallback(async (sessionDir: string): Promise<SessionManifest> => {
    return await invoke<SessionManifest>('load_session_manifest', { sessionDir })
  }, [])

  /**
   * Updates the manifest with the audio path
   */
  const updateManifestAudio = useCallback(
    async (sessionDir: string, audioPath: string): Promise<void> => {
      try {
        const manifest = await invoke<SessionManifest>('load_session_manifest', { sessionDir })
        // Ensure audio path is relative if inside session dir
        const relativePath = audioPath.startsWith(sessionDir)
          ? audioPath.replace(`${sessionDir}\\`, '').replace(`${sessionDir}/`, '')
          : audioPath

        manifest.audioPath = relativePath

        await invoke('save_session_manifest', {
          sessionDir,
          manifest,
        })
        console.log('Updated manifest with audio path:', relativePath)
      } catch (e) {
        console.error('Failed to update manifest with audio:', e)
      }
    },
    []
  )

  /**
   * Lists all available session directories
   *
   * @returns Array of session directory paths
   */
  const listSessions = useCallback(async (): Promise<string[]> => {
    return await invoke<string[]>('list_sessions')
  }, [])

  /**
   * Gets the current session
   */
  const getCurrentSession = useCallback((): CaptureSession | null => {
    return sessionRef.current
  }, [])

  return {
    startCapture,
    stopCapture,
    cleanupSession,
    loadSessionManifest,
    listSessions,
    getCurrentSession,
    updateManifestAudio,
  }
}
