/**
 * Processing Bridge
 *
 * Simplified interface between UI and processing pipeline.
 * Handles the complete flow: recording → processing → skill generation
 */

import { invoke } from '@tauri-apps/api/core'
import { processSession } from './processing'
import { generateSkill } from './skill-generator'
import { generateOperationsBrief } from './operations-generator'
import { useSettingsStore } from '@/stores/settings'
import type { ProcessingProgress } from '../types/processing'
import type { ProcessedSession, LLMContext } from '../types/processing'
import type { CaptureSession } from '../types/capture'
import type { OperationsBrief } from '../types/operations'
import type { TranscriptionResult } from './whisper'
import { transcribeAudio } from './whisper'
import { readFile, writeFile } from '@tauri-apps/plugin-fs'
import { downloadModel as downloadWhisperModel } from './whisper-real'
import { addFailedSession, FailedSession } from './failed-sessions'
import { fileLog } from './file-logger'

export interface ProcessingResult {
  success: boolean
  skillMarkdown?: string
  operationsBrief?: OperationsBrief
  processedSession?: ProcessedSession
  llmContext?: LLMContext
  error?: string
  processingTime: number
  failedSession?: FailedSession
}

/**
 * Transcription Error Types
 */
export type TranscriptionErrorType =
  | 'MODEL_NOT_FOUND'
  | 'MODEL_DOWNLOAD_FAILED'
  | 'WHISPER_TIMEOUT'
  | 'WHISPER_FAILED'
  | 'API_KEY_MISSING'
  | 'API_FAILED'
  | 'CONVERSION_FAILED'
  | 'NO_AUDIO'

export interface TranscriptionError {
  type: TranscriptionErrorType
  message: string
  details?: string
  canRetry: boolean
  canUseApi: boolean
  canDownloadModel: boolean
}

/**
 * Convert WebM audio to WAV format using Web Audio API
 * The local Whisper expects WAV format
 */
async function convertWebMToWav(webmBlob: Blob): Promise<Blob> {
  console.log('🎤 Converting WebM to WAV...', 'Size:', webmBlob.size, 'bytes')
  await fileLog(`Converting WebM to WAV, size: ${webmBlob.size} bytes`)

  const audioContext = new AudioContext({ sampleRate: 16000 }) // Whisper expects 16kHz

  try {
    // Decode WebM with timeout
    const arrayBuffer = await webmBlob.arrayBuffer()
    console.log('🎤 Decoding audio data...')

    const audioBuffer = await Promise.race([
      audioContext.decodeAudioData(arrayBuffer),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Audio decode timeout')), 30000)
      ),
    ])

    console.log('🎤 Audio decoded:', audioBuffer.duration, 'seconds,', audioBuffer.sampleRate, 'Hz')
    await fileLog(`Audio decoded: ${audioBuffer.duration}s at ${audioBuffer.sampleRate}Hz`)

    // Convert to mono 16-bit PCM
    const numberOfChannels = 1 // Mono
    const sampleRate = 16000
    const format = 1 // PCM
    const bitDepth = 16

    const samples = audioBuffer.getChannelData(0) // Get first channel
    const bytesPerSample = bitDepth / 8
    const blockAlign = numberOfChannels * bytesPerSample
    const byteRate = sampleRate * blockAlign
    const dataSize = samples.length * bytesPerSample

    console.log('🎤 Creating WAV buffer...', samples.length, 'samples')

    // Create WAV buffer
    const buffer = new ArrayBuffer(44 + dataSize)
    const view = new DataView(buffer)

    // Write WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i))
      }
    }

    writeString(0, 'RIFF')
    view.setUint32(4, 36 + dataSize, true)
    writeString(8, 'WAVE')
    writeString(12, 'fmt ')
    view.setUint32(16, 16, true)
    view.setUint16(20, format, true)
    view.setUint16(22, numberOfChannels, true)
    view.setUint32(24, sampleRate, true)
    view.setUint32(28, byteRate, true)
    view.setUint16(32, blockAlign, true)
    view.setUint16(34, bitDepth, true)
    writeString(36, 'data')
    view.setUint32(40, dataSize, true)

    // Write audio data (convert float32 to int16) - in chunks to avoid blocking
    const chunkSize = 10000
    for (let i = 0; i < samples.length; i += chunkSize) {
      const end = Math.min(i + chunkSize, samples.length)
      for (let j = i; j < end; j++) {
        const sample = Math.max(-1, Math.min(1, samples[j]))
        view.setInt16(44 + j * 2, sample * 0x7fff, true)
      }

      // Allow UI to breathe and log progress
      if (i % 50000 === 0) {
        console.log(`🎤 Conversion progress: ${Math.round((i / samples.length) * 100)}%`)
        await new Promise(r => setTimeout(r, 0))
      }
    }

    console.log('🎤 Conversion complete:', samples.length, 'samples')
    await fileLog(`WAV conversion complete: ${samples.length} samples`)
    audioContext.close()
    return new Blob([buffer], { type: 'audio/wav' })
  } catch (error) {
    audioContext.close()
    throw error
  }
}

/**
 * Transcribe using OpenAI Whisper API
 */
async function transcribeWithApi(audioPath: string, apiKey: string): Promise<TranscriptionResult> {
  console.log('🎤 [API] Using OpenAI Whisper API...')
  await fileLog('Using OpenAI Whisper API')

  // Read audio file
  const audioBytes = await readFile(audioPath)
  console.log('🎤 [API] Audio file read:', audioBytes.length, 'bytes')

  const audioBlob = new Blob([audioBytes], { type: 'audio/webm' })

  const result = await transcribeAudio(audioBlob, apiKey)
  console.log('🎤 [API] SUCCESS:', result.text.substring(0, 100))
  await fileLog(`API transcription success: ${result.text.substring(0, 50)}...`)

  return result
}

/**
 * Main transcription function - tries local first, then API if configured
 * NO GENERIC FALLBACK - fails properly to allow retry
 */
async function transcribeAudioWithFallback(
  audioPath: string,
  onProgress: (progress: ProcessingProgress) => void
): Promise<TranscriptionResult> {
  console.log('🎤 =========================================')
  console.log('🎤 TRANSCRIPTION STARTED')
  console.log('🎤 Audio path:', audioPath)
  console.log('🎤 =========================================')
  await fileLog(`Transcription started for: ${audioPath}`)

  const settings = useSettingsStore.getState()
  const targetModel = settings.whisperModel || 'tiny'
  const useGpu = settings.useGpu || false

  // Try 1: Local Whisper (preferred)
  console.log(`🎤 [Step 1] Trying Local Whisper (model: ${targetModel}, GPU: ${useGpu})...`)
  await fileLog(`Trying local Whisper with model: ${targetModel}`)

  try {
    // Check if model exists
    let whisperAvailable = await invoke<boolean>('check_model_exists', { model: targetModel })
    console.log('🎤 Model available:', whisperAvailable)

    // AUTO-DOWNLOAD: If model not available, try to download it
    if (!whisperAvailable) {
      console.log(`🎤 Model '${targetModel}' not found. Attempting auto-download...`)
      await fileLog(`Model not found, attempting download...`)

      onProgress({
        stage: 'loading',
        percentage: 20,
        currentStep: `Downloading Whisper model (${targetModel}, ~75MB)...`,
      })

      try {
        await downloadWhisperModel(targetModel, (downloaded, total) => {
          const percent = Math.round((downloaded / total) * 100)
          console.log(
            `🎤 Download progress: ${percent}% (${Math.round(downloaded / 1024 / 1024)}MB / ${Math.round(total / 1024 / 1024)}MB)`
          )
        })

        // Check again if model is now available
        whisperAvailable = await invoke<boolean>('check_model_exists', { model: targetModel })
        console.log('🎤 Model available after download:', whisperAvailable)

        if (!whisperAvailable) {
          throw new Error('Model download completed but model still not found')
        }
      } catch (downloadError) {
        console.error('🎤 Model download failed:', downloadError)
        await fileLog(`Model download failed: ${downloadError}`)

        // If API key is available, try API as fallback
        if (settings.whisperApiKey) {
          console.log('🎤 Local model failed, trying API fallback...')
          return await transcribeWithApi(audioPath, settings.whisperApiKey)
        }

        // Otherwise fail with specific error
        const error: TranscriptionError = {
          type: 'MODEL_DOWNLOAD_FAILED',
          message: `Failed to download Whisper model '${targetModel}'`,
          details: downloadError instanceof Error ? downloadError.message : 'Unknown error',
          canRetry: true,
          canUseApi: true,
          canDownloadModel: true,
        }
        throw error
      }
    }

    if (whisperAvailable) {
      // Read WebM file
      console.log('🎤 Reading WebM file...')
      const webmBytes = await readFile(audioPath)
      console.log('🎤 WebM file size:', webmBytes.length, 'bytes')

      if (webmBytes.length === 0) {
        throw {
          type: 'NO_AUDIO',
          message: 'Audio file is empty',
          canRetry: false,
          canUseApi: false,
          canDownloadModel: false,
        } as TranscriptionError
      }

      const webmBlob = new Blob([webmBytes], { type: 'audio/webm' })

      // Convert to WAV
      onProgress({
        stage: 'loading',
        percentage: 22,
        currentStep: 'Converting audio format...',
      })

      console.log('🎤 Converting WebM to WAV...')
      let wavBlob: Blob
      try {
        wavBlob = await convertWebMToWav(webmBlob)
      } catch (convError) {
        console.error('🎤 Conversion failed:', convError)
        await fileLog(`Conversion failed: ${convError}`)

        // Try API if available
        if (settings.whisperApiKey) {
          console.log('🎤 Conversion failed, trying API fallback...')
          return await transcribeWithApi(audioPath, settings.whisperApiKey)
        }

        throw {
          type: 'CONVERSION_FAILED',
          message: 'Failed to convert audio format',
          details: convError instanceof Error ? convError.message : 'Unknown error',
          canRetry: true,
          canUseApi: true,
          canDownloadModel: false,
        } as TranscriptionError
      }

      console.log('🎤 WAV blob size:', wavBlob.size, 'bytes')

      // Save WAV to temp file
      const wavPath = audioPath.replace('.webm', '.wav')
      console.log('🎤 Saving WAV to:', wavPath)
      const wavBytes = new Uint8Array(await wavBlob.arrayBuffer())
      await writeFile(wavPath, wavBytes)

      console.log('🎤 WAV file saved successfully')

      // Transcribe using local Whisper
      onProgress({
        stage: 'loading',
        percentage: 25,
        currentStep: 'Running local Whisper...',
      })

      console.log(`🎤 Calling transcribe_local with 180s timeout... (Model: ${targetModel})`)
      await fileLog('Calling local Whisper...')

      // Wrap Rust invoke in a timeout race to prevent infinite hanging
      const transcriptionPromise = invoke<{
        text: string
        segments: Array<{ id: number; start: number; end: number; text: string }>
        language: string
        duration: number
      }>('transcribe_local', {
        audioPath: wavPath,
        model: targetModel,
        useGpu: useGpu,
      })

      const result = await Promise.race([
        transcriptionPromise,
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Whisper transcription timed out (180s)')), 180000)
        ),
      ])

      console.log('🎤 Transcription result received')
      await fileLog('Local Whisper transcription successful')

      return {
        text: result.text,
        segments: result.segments,
        language: result.language,
        duration: result.duration,
      }
    }
  } catch (error) {
    console.error('🎤 Local Whisper ERROR:', error)
    await fileLog(`Local Whisper failed: ${error}`)

    // If it's already a TranscriptionError, re-throw
    if (error && typeof error === 'object' && 'type' in error) {
      throw error
    }

    // If API key is configured, try API as fallback
    if (settings.whisperApiKey) {
      try {
        return await transcribeWithApi(audioPath, settings.whisperApiKey)
      } catch (apiError) {
        console.error('🎤 API fallback also failed:', apiError)
        await fileLog(`API fallback failed: ${apiError}`)

        throw {
          type: 'API_FAILED',
          message: 'Both local Whisper and API transcription failed',
          details: apiError instanceof Error ? apiError.message : 'Unknown error',
          canRetry: true,
          canUseApi: true,
          canDownloadModel: true,
        } as TranscriptionError
      }
    }

    // No fallback available - fail properly
    throw {
      type: 'WHISPER_FAILED',
      message: error instanceof Error ? error.message : 'Local Whisper transcription failed',
      details: 'Local Whisper failed and no API key is configured',
      canRetry: true,
      canUseApi: true,
      canDownloadModel: true,
    } as TranscriptionError
  }

  // Should not reach here
  throw {
    type: 'WHISPER_FAILED',
    message: 'Unknown transcription error',
    canRetry: true,
    canUseApi: true,
    canDownloadModel: true,
  } as TranscriptionError
}

/**
 * Process a recording session and generate SKILL.md
 *
 * This is the main entry point for the processing pipeline.
 * Called by ProcessingScreen when user stops recording.
 *
 * @param options - Processing options
 * @param onProgress - Progress callback
 * @returns Processing result with skill markdown
 */
export async function processRecordingAndGenerateSkill(
  options: {
    sessionId?: string
    audioPath?: string
    annotations?: {
      clicks: any[]
      drawings: any[]
      selectedElements: any[]
      keyboardInputs: any[]
    }
  },
  onProgress: (progress: ProcessingProgress) => void
): Promise<ProcessingResult> {
  const startTime = Date.now()

  try {
    // Stage 1: Load recording data from backend
    onProgress({
      stage: 'loading',
      percentage: 5,
      currentStep: 'Loading recording data...',
    })

    // Get session directory from options or global hack (passed from Toolbar)
    const sessionDir = options.sessionId || (window as any).__LAST_SESSION_DIR__

    if (!sessionDir) {
      throw new Error('No session directory provided for processing.')
    }

    console.log('📁 Session directory:', sessionDir)
    await fileLog(`Processing session: ${sessionDir}`)

    // Load manifest from disk using existing command
    const manifest = await invoke<{
      frames: Array<{
        timestamp: number
        imagePath: string
        cursorPosition?: { x: number; y: number }
      }>
      audioPath?: string
      startTime: number
      endTime: number
    }>('load_session_manifest', { sessionDir })

    const recordingData = {
      frames: manifest.frames.map(f => ({
        timestamp: f.timestamp,
        path:
          f.imagePath.startsWith('http') || f.imagePath.includes(':')
            ? f.imagePath
            : `${sessionDir}/${f.imagePath}`,
        cursorPosition: f.cursorPosition,
      })),
      audioPath: manifest.audioPath ? `${sessionDir}/${manifest.audioPath}` : undefined,
      startTime: manifest.startTime,
      endTime: manifest.endTime || Date.now(),
    }

    // Validate we have data
    if (!recordingData.frames || recordingData.frames.length === 0) {
      console.warn('Processing found 0 frames. This might be a bug.')
    }

    if (!recordingData.audioPath) {
      console.warn('No audio path in manifest. Checking options...')
      if (options.audioPath) recordingData.audioPath = options.audioPath
      else console.warn('No audio recording available.')
    }

    console.log(
      `Processing ${recordingData.frames.length} frames with audio: ${recordingData.audioPath}`
    )
    await fileLog(
      `Frames: ${recordingData.frames.length}, Audio: ${recordingData.audioPath || 'none'}`
    )

    // Stage 2: Transcribe audio
    onProgress({
      stage: 'loading',
      percentage: 20,
      currentStep: 'Transcribing audio...',
    })

    let transcription: TranscriptionResult | null = null

    if (recordingData.audioPath || options.audioPath) {
      const audioPath = recordingData.audioPath || options.audioPath!

      try {
        transcription = await transcribeAudioWithFallback(audioPath, onProgress)
        console.log('🎤 Transcription successful:', transcription.text.substring(0, 100))
        await fileLog(`Transcription success: ${transcription.text.substring(0, 50)}...`)
      } catch (error) {
        console.error('🎤 Transcription failed:', error)
        await fileLog(`Transcription FAILED: ${error}`)

        // Save failed session for reprocessing
        const failedSession: FailedSession = {
          id: `session-${Date.now()}`,
          originalSessionDir: sessionDir,
          audioPath: audioPath,
          frames: recordingData.frames,
          startTime: recordingData.startTime,
          endTime: recordingData.endTime,
          error: error instanceof Error ? error.message : 'Transcription failed',
          errorType: (error as TranscriptionError)?.type || 'WHISPER_FAILED',
          timestamp: Date.now(),
          annotations: options.annotations || {
            clicks: [],
            drawings: [],
            selectedElements: [],
            keyboardInputs: [],
          },
        }

        await addFailedSession(failedSession)

        // Return failure with options
        const transError = error as TranscriptionError
        return {
          success: false,
          error: transError?.message || 'Transcription failed',
          processingTime: Date.now() - startTime,
          failedSession,
        }
      }
    } else {
      // No audio - can't proceed without transcription
      const error = 'No audio recording available. Cannot generate skill without voice explanation.'
      await fileLog(error)

      return {
        success: false,
        error,
        processingTime: Date.now() - startTime,
      }
    }

    // Stage 3: Build capture session
    onProgress({
      stage: 'timeline',
      percentage: 35,
      currentStep: 'Building timeline...',
    })

    const captureSession: CaptureSession = {
      id: options.sessionId || `session-${Date.now()}`,
      directory: '',
      startTime: recordingData.startTime,
      endTime: recordingData.endTime,
      frames: recordingData.frames.map((f, index) => ({
        id: `frame-${index}`,
        timestamp: f.timestamp,
        imagePath: f.path,
        imageData: f.path,
        cursorPosition: f.cursorPosition,
      })),
      intervalMs: 1000,
    }

    // Stage 4: Process session
    onProgress({
      stage: 'step_detection',
      percentage: 50,
      currentStep: 'Detecting steps from recording...',
    })

    const processedSession = await processSession(
      captureSession.id,
      captureSession,
      transcription,
      options.annotations || {
        clicks: [],
        drawings: [],
        selectedElements: [],
        keyboardInputs: [],
      },
      progress => {
        const mappedPercentage = 50 + progress.percentage * 0.4
        onProgress({
          ...progress,
          percentage: Math.round(mappedPercentage),
        })
      }
    )

    // Stage 5: Generate SKILL.md
    onProgress({
      stage: 'context_generation',
      percentage: 90,
      currentStep: 'Generating SKILL.md with AI...',
    })

    const { generateLLMContext } = await import('./processing')
    const llmContext = await generateLLMContext(processedSession)

    const { llmApiKey, llmProvider, llmBaseUrl, llmModel } = useSettingsStore.getState()

    if (!llmApiKey && llmProvider !== 'ollama') {
      throw new Error('LLM API Key not found. Please configure it in Settings.')
    }

    let genProvider = llmProvider
    if (llmProvider === 'custom' || llmProvider === 'moonshot') {
      genProvider = 'openai'
    }

    const generatedSkillResult = await generateSkill(llmContext, {
      provider: genProvider as any,
      apiKey: llmApiKey,
      model: llmModel || 'gpt-4-turbo',
      baseUrl: llmBaseUrl,
    })

    const skillMarkdown = generatedSkillResult as string

    const operationsBrief = await generateOperationsBrief(processedSession, llmContext, {
      provider: genProvider as any,
      apiKey: llmApiKey,
      model: llmModel || 'gpt-4-turbo',
      baseUrl: llmBaseUrl,
    })

    try {
      await writeFile(
        `${sessionDir}/operations-brief.md`,
        new TextEncoder().encode(operationsBrief.markdown)
      )
      await writeFile(
        `${sessionDir}/operations-brief.json`,
        new TextEncoder().encode(JSON.stringify(operationsBrief, null, 2))
      )
    } catch (artifactError) {
      console.warn('Could not persist operations brief artifacts:', artifactError)
    }

    // Stage 6: Save to file
    onProgress({
      stage: 'context_generation',
      percentage: 95,
      currentStep: 'Saving SKILL.md...',
    })

    try {
      await invoke('save_skill_md', { content: skillMarkdown })
    } catch (e) {
      console.warn('Could not save to file:', e)
    }

    const processingTime = Date.now() - startTime

    onProgress({
      stage: 'complete',
      percentage: 100,
      currentStep: 'Complete!',
    })

    await fileLog(`Processing completed successfully in ${processingTime}ms`)

    return {
      success: true,
      skillMarkdown,
      operationsBrief,
      processedSession,
      llmContext,
      processingTime,
    }
  } catch (error) {
    const processingTime = Date.now() - startTime
    console.error('Processing failed:', error)
    await fileLog(`Processing failed: ${error}`)

    onProgress({
      stage: 'error',
      percentage: 0,
      currentStep: 'Processing failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    })

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      processingTime,
    }
  }
}

/**
 * Retry processing a failed session
 */
export async function retryFailedSession(
  failedSession: FailedSession,
  onProgress: (progress: ProcessingProgress) => void
): Promise<ProcessingResult> {
  console.log('🔄 Retrying failed session:', failedSession.id)
  await fileLog(`Retrying failed session: ${failedSession.id}`)

  return processRecordingAndGenerateSkill(
    {
      sessionId: failedSession.originalSessionDir,
      audioPath: failedSession.audioPath,
      annotations: failedSession.annotations,
    },
    onProgress
  )
}

/**
 * Quick mock processing for testing without real AI
 */
export async function processRecordingMock(
  onProgress: (progress: ProcessingProgress) => void
): Promise<ProcessingResult> {
  const stages = [
    { stage: 'loading' as const, delay: 500, message: 'Loading recording data...' },
    { stage: 'timeline' as const, delay: 1500, message: 'Building timeline...' },
    { stage: 'step_detection' as const, delay: 1200, message: 'Detecting steps...' },
    { stage: 'context_generation' as const, delay: 1000, message: 'Generating SKILL.md...' },
  ]

  for (let i = 0; i < stages.length; i++) {
    const progress = ((i + 1) / stages.length) * 90
    onProgress({
      stage: stages[i].stage,
      percentage: Math.round(progress),
      currentStep: stages[i].message,
    })
    await new Promise(r => setTimeout(r, stages[i].delay))
  }

  onProgress({
    stage: 'complete',
    percentage: 100,
    currentStep: 'Complete!',
  })

  const skillMarkdown = `---
name: demo-skill
description: Auto-generated skill from recording
version: 1.0.0
---

# Demo Skill

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| username | string | Yes | Username for login |
| password | string | Yes | Password for login |

## Instructions

### Step 1
Navigate to the login page.

### Step 2
Click on the username field and enter the username parameter.

### Step 3
Click on the password field and enter the password parameter.

### Step 4
Click the submit button to log in.

## Verification

- [ ] Successfully navigated to login page
- [ ] Username entered correctly
- [ ] Password entered correctly
- [ ] Login successful

---
Generated by Skill-E
`

  return {
    success: true,
    skillMarkdown,
    processingTime: stages.reduce((a, s) => a + s.delay, 0),
  }
}
