/**
 * Failed Sessions Management
 *
 * Handles storage and retry of sessions that failed during processing.
 * This allows users to fix issues (e.g., configure API key, download model)
 * and retry processing without losing their recording.
 */

import { appDataDir, join } from '@tauri-apps/api/path'
import { readFile, writeFile, mkdir } from '@tauri-apps/plugin-fs'

export interface FailedSession {
  id: string
  originalSessionDir: string
  audioPath: string
  frames: Array<{
    timestamp: number
    path: string
    cursorPosition?: { x: number; y: number }
  }>
  startTime: number
  endTime: number
  error: string
  errorType: string
  timestamp: number
  annotations: {
    clicks: any[]
    drawings: any[]
    selectedElements: any[]
    keyboardInputs: any[]
  }
}

const FAILED_SESSIONS_FILE = 'failed-sessions.json'

/**
 * Get the path to the failed sessions file
 */
async function getFailedSessionsPath(): Promise<string> {
  const appData = await appDataDir()
  const dir = await join(appData, 'skill-e', 'failed-sessions')
  return await join(dir, FAILED_SESSIONS_FILE)
}

/**
 * Ensure the failed sessions directory exists
 */
async function ensureDirectory(): Promise<string> {
  const appData = await appDataDir()
  const dir = await join(appData, 'skill-e', 'failed-sessions')

  try {
    await mkdir(dir, { recursive: true })
  } catch (e) {
    // Directory might already exist
  }

  return dir
}

/**
 * Load all failed sessions
 */
export async function getFailedSessions(): Promise<FailedSession[]> {
  try {
    await ensureDirectory()
    const filePath = await getFailedSessionsPath()

    try {
      const data = await readFile(filePath)
      const text = new TextDecoder().decode(data)
      return JSON.parse(text)
    } catch (e) {
      // File doesn't exist or is empty
      return []
    }
  } catch (e) {
    console.error('Failed to load failed sessions:', e)
    return []
  }
}

/**
 * Add a new failed session
 */
export async function addFailedSession(session: FailedSession): Promise<void> {
  try {
    await ensureDirectory()
    const sessions = await getFailedSessions()

    // Add to beginning (newest first)
    sessions.unshift(session)

    // Keep only last 50 failed sessions
    if (sessions.length > 50) {
      sessions.splice(50)
    }

    const filePath = await getFailedSessionsPath()
    const data = new TextEncoder().encode(JSON.stringify(sessions, null, 2))
    await writeFile(filePath, data)

    console.log('💾 Failed session saved:', session.id)
  } catch (e) {
    console.error('Failed to save failed session:', e)
  }
}

/**
 * Remove a failed session (e.g., after successful retry)
 */
export async function removeFailedSession(sessionId: string): Promise<void> {
  try {
    const sessions = await getFailedSessions()
    const filtered = sessions.filter(s => s.id !== sessionId)

    const filePath = await getFailedSessionsPath()
    const data = new TextEncoder().encode(JSON.stringify(filtered, null, 2))
    await writeFile(filePath, data)

    console.log('🗑️ Failed session removed:', sessionId)
  } catch (e) {
    console.error('Failed to remove failed session:', e)
  }
}

/**
 * Get human-readable error message with suggestions
 */
export function getErrorHelp(errorType: string): {
  title: string
  description: string
  actions: Array<{ label: string; action: 'settings' | 'retry' | 'api' | 'model' }>
} {
  switch (errorType) {
    case 'MODEL_NOT_FOUND':
    case 'MODEL_DOWNLOAD_FAILED':
      return {
        title: 'Whisper Model Not Available',
        description:
          'The local Whisper model could not be found or downloaded. This is a ~75MB file required for transcription.',
        actions: [
          { label: 'Try Download Again', action: 'retry' },
          { label: 'Use OpenAI API Instead', action: 'api' },
          { label: 'Open Settings', action: 'settings' },
        ],
      }

    case 'WHISPER_TIMEOUT':
      return {
        title: 'Transcription Timed Out',
        description:
          'The local Whisper transcription took too long. This might happen with longer recordings or slower computers.',
        actions: [
          { label: 'Try Again', action: 'retry' },
          { label: 'Use OpenAI API', action: 'api' },
          { label: 'Open Settings', action: 'settings' },
        ],
      }

    case 'WHISPER_FAILED':
      return {
        title: 'Transcription Failed',
        description:
          'The local Whisper transcription failed. This could be due to audio format issues or system resources.',
        actions: [
          { label: 'Try Again', action: 'retry' },
          { label: 'Use OpenAI API', action: 'api' },
          { label: 'Open Settings', action: 'settings' },
        ],
      }

    case 'API_FAILED':
    case 'API_KEY_MISSING':
      return {
        title: 'API Transcription Failed',
        description: 'The OpenAI Whisper API call failed. Please check your API key in settings.',
        actions: [
          { label: 'Configure API Key', action: 'api' },
          { label: 'Use Local Model', action: 'model' },
          { label: 'Open Settings', action: 'settings' },
        ],
      }

    case 'CONVERSION_FAILED':
      return {
        title: 'Audio Conversion Failed',
        description: 'Could not convert the recorded audio to the format required by Whisper.',
        actions: [
          { label: 'Try OpenAI API', action: 'api' },
          { label: 'Open Settings', action: 'settings' },
        ],
      }

    case 'NO_AUDIO':
      return {
        title: 'No Audio Recording',
        description:
          'No audio was recorded. Please ensure your microphone is working and try again.',
        actions: [{ label: 'Check Microphone', action: 'settings' }],
      }

    default:
      return {
        title: 'Transcription Failed',
        description: 'An unknown error occurred during transcription.',
        actions: [
          { label: 'Try Again', action: 'retry' },
          { label: 'Open Settings', action: 'settings' },
        ],
      }
  }
}

/**
 * Format timestamp for display
 */
export function formatSessionTime(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleString()
}

/**
 * Get session duration in seconds
 */
export function getSessionDuration(session: FailedSession): number {
  return Math.round((session.endTime - session.startTime) / 1000)
}
