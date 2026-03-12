import { useCallback, useRef, useState } from 'react'
import { useRecordingStore } from '../stores/recording'
import { useSettingsStore } from '../stores/settings'
import { invoke } from '@tauri-apps/api/core'

export function useAudioRecording() {
  const [isRecording, setIsRecording] = useState(false)
  const selectedMicId = useSettingsStore(state => state.selectedMicId)
  const [isPaused, setIsPaused] = useState(false)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const sessionDirRef = useRef<string | null>(null)
  const setAudioBlob = useRecordingStore(state => state.setAudioBlob)
  const setAudioPath = useRecordingStore(state => state.setAudioPath)

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      console.log('Requesting microphone permission...')

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia is not supported in this browser')
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: selectedMicId !== 'default' ? { exact: selectedMicId } : undefined,
          channelCount: 1, // Mono
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })

      streamRef.current = stream
      setHasPermission(true)
      setError(null)
      console.log('✅ Microphone permission granted successfully!')
      return true
    } catch (err) {
      console.error('❌ Failed to get microphone permission:', err)
      setHasPermission(false)

      let errorMessage = 'Failed to access microphone. '
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          errorMessage +=
            'Permission denied. Please allow microphone access in your browser settings.'
        } else if (err.name === 'NotFoundError') {
          errorMessage += 'No microphone found. Please connect a microphone and try again.'
        } else if (err.name === 'NotReadableError') {
          errorMessage += 'Microphone is already in use by another application.'
        } else {
          errorMessage += err.message
        }
      }

      setError(errorMessage)
      return false
    }
  }, [selectedMicId])

  /**
   * Helper to find a supported MIME type
   */
  const getSupportedMimeType = useCallback((): string => {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/ogg;codecs=opus',
      '', // Fallback to browser default
    ]

    for (const type of types) {
      if (type === '' || MediaRecorder.isTypeSupported(type)) {
        console.log(`Found supported MIME type: "${type}"`)
        return type
      }
    }
    console.warn('No specific MIME type supported, letting browser choose default.')
    return ''
  }, [])

  const startRecording = useCallback(async (): Promise<void> => {
    try {
      if (!streamRef.current) {
        const granted = await requestPermission()
        if (!granted) {
          throw new Error('Microphone permission denied')
        }
      }

      audioChunksRef.current = []

      // Determine MIME type
      const mimeType = getSupportedMimeType()
      const options = mimeType ? { mimeType } : undefined

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(streamRef.current!, options)

      mediaRecorder.ondataavailable = event => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
          // console.log(`Audio chunk received: ${event.data.size} bytes`);
        }
      }

      mediaRecorder.onstop = async () => {
        console.log('MediaRecorder stopped')

        // Create blob using the same MIME type or generic audio/webm
        // Note: if mimeType was empty, we let Blob infer or use default
        const finalMimeType = mimeType || 'audio/webm'
        const audioBlob = new Blob(audioChunksRef.current, { type: finalMimeType })

        console.log(`Audio recording complete: ${audioBlob.size} bytes`)
        setAudioBlob(audioBlob)

        if (sessionDirRef.current) {
          try {
            const arrayBuffer = await audioBlob.arrayBuffer()
            const uint8Array = new Uint8Array(arrayBuffer)
            const timestamp = Date.now()

            // Extension depends on MIME type - simple check
            const ext = finalMimeType.includes('mp4') ? 'm4a' : 'webm'
            const filename = `audio-${timestamp}.${ext}`

            const result = await invoke<{ path: string; size: number }>('save_audio_file', {
              sessionDir: sessionDirRef.current,
              audioData: Array.from(uint8Array),
              filename,
            })

            console.log(`Audio file saved: ${result.path} (${result.size} bytes)`)
            setAudioPath(result.path)

            await invoke('set_recording_audio', { path: result.path }).catch(e =>
              console.warn('Failed to update recording audio state:', e)
            )
          } catch (err) {
            console.error('Failed to save audio file:', err)
            setError(
              err instanceof Error
                ? `Failed to save audio: ${err.message}`
                : 'Failed to save audio file'
            )
          }
        }

        setIsRecording(false)
        setIsPaused(false)
      }

      mediaRecorder.onerror = event => {
        console.error('MediaRecorder error:', event)
        setError('Recording error occurred')
        setIsRecording(false)
        setIsPaused(false)
      }

      mediaRecorder.start(1000)
      mediaRecorderRef.current = mediaRecorder

      setIsRecording(true)
      setIsPaused(false)
      setError(null)

      console.log('Audio recording started with MIME:', mimeType)
    } catch (err) {
      console.error('Failed to start recording:', err)
      setError(err instanceof Error ? err.message : 'Failed to start recording')
      throw err
    }
  }, [requestPermission, setAudioBlob, setAudioPath, getSupportedMimeType])

  const pauseRecording = useCallback((): void => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause()
      setIsPaused(true)
      console.log('Audio recording paused')
    }
  }, [])

  const resumeRecording = useCallback((): void => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume()
      setIsPaused(false)
      console.log('Audio recording resumed')
    }
  }, [])

  const stopRecordingAsync = useCallback(
    (sessionDir?: string): Promise<string | null> => {
      return new Promise(resolve => {
        const targetDir = sessionDir || sessionDirRef.current

        console.log('🎤 stopRecordingAsync called')

        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          const recorder = mediaRecorderRef.current
          // The mimetype used during creation
          const currentMimeType = recorder.mimeType || 'audio/webm'

          recorder.onstop = async () => {
            console.log('🎤 MediaRecorder stopped event fired')

            const audioBlob = new Blob(audioChunksRef.current, { type: currentMimeType })
            console.log(`🎤 Recording size: ${audioBlob.size} bytes`)

            setAudioBlob(audioBlob)

            let savedPath: string | null = null
            if (targetDir) {
              try {
                console.log('🎤 Saving audio to:', targetDir)
                const arrayBuffer = await audioBlob.arrayBuffer()
                const uint8Array = new Uint8Array(arrayBuffer)
                const timestamp = Date.now()
                const ext = currentMimeType.includes('mp4') ? 'm4a' : 'webm'
                const filename = `audio-${timestamp}.${ext}`

                const result = await invoke<{ path: string; size: number }>('save_audio_file', {
                  sessionDir: targetDir,
                  audioData: Array.from(uint8Array),
                  filename,
                })

                console.log(`✅ Audio file saved: ${result.path}`)
                setAudioPath(result.path)
                savedPath = result.path

                await invoke('set_recording_audio', { path: result.path }).catch(e =>
                  console.warn('Failed to update recording audio state (optional):', e)
                )
              } catch (err) {
                console.error('❌ Failed to save audio file:', err)
                // Try fallback save to temp if invoke failed?
                // Usually invoke fails if directory doesn't exist or permissions.

                // FALLBACK ATTEMPT: Try saving to a known safe location if possible, or just fail gracefully.
                // For now, allow the error to bubble but resolve null.
              }
            } else {
              console.warn('⚠️ No session directory set - audio not saved to disk')
            }

            setIsRecording(false)
            setIsPaused(false)
            resolve(savedPath)
          }

          recorder.stop()
          console.log('🎤 Stopping audio recording...')
        } else {
          console.warn('⚠️ MediaRecorder not active or already stopped')
          resolve(null)
        }
      })
    },
    [setAudioBlob, setAudioPath]
  )

  const cancelRecording = useCallback((): void => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
      audioChunksRef.current = []
      setIsRecording(false)
      setIsPaused(false)
      console.log('Audio recording cancelled')
    }
  }, [])

  const cleanup = useCallback((): void => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    mediaRecorderRef.current = null
    audioChunksRef.current = []
    setIsRecording(false)
    setIsPaused(false)
    setHasPermission(null)
  }, [])

  const getAudioStream = useCallback((): MediaStream | null => {
    return streamRef.current
  }, [])

  const setSessionDirectory = useCallback((sessionDir: string): void => {
    sessionDirRef.current = sessionDir
    console.log('✅ Audio recording session directory set:', sessionDir)
  }, [])

  return {
    isRecording,
    isPaused,
    hasPermission,
    error,
    requestPermission,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording: stopRecordingAsync,
    cancelRecording,
    cleanup,
    getAudioStream,
    setSessionDirectory,
  }
}
