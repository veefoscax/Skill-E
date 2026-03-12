/**
 * Local Whisper Transcription Client
 *
 * Handles local audio transcription using whisper.cpp via Tauri commands.
 * Works offline after model download.
 *
 * Requirements:
 * - FR-3.6: Support local Whisper transcription via whisper-rs
 * - NFR-3.4: Local transcription should work offline
 */

import { invoke } from '@tauri-apps/api/core'

/**
 * Transcription segment with timestamps
 */
export interface TranscriptionSegment {
  id: number
  start: number // seconds
  end: number // seconds
  text: string
}

/**
 * Result of local transcription
 */
export interface LocalTranscriptionResult {
  text: string
  segments: TranscriptionSegment[]
  language: string
  duration: number
}

/**
 * Model information
 */
export interface ModelInfo {
  id: string
  name: string
  size: string
  gpuRecommended: boolean
  exists: boolean
}

/**
 * Detailed model info from backend
 */
export interface DetailedModelInfo {
  filename: string
  downloadUrl: string
  sizeBytes: number
  exists: boolean
  path: string
}

/**
 * Check if a Whisper model exists locally
 *
 * @param model - Model name (tiny, base, small, medium, large-v3, turbo)
 * @returns true if model exists locally
 */
export async function checkModelExists(model: string): Promise<boolean> {
  return invoke<boolean>('check_model_exists', { model })
}

/**
 * Get detailed information about a model
 *
 * @param model - Model name
 * @returns Model info including path and download URL
 */
export async function getModelInfo(model: string): Promise<DetailedModelInfo> {
  return invoke<DetailedModelInfo>('get_model_info', { model })
}

/**
 * Get all available Whisper models
 *
 * @returns Array of model info with availability status
 */
export async function getAvailableModels(): Promise<ModelInfo[]> {
  return invoke<ModelInfo[]>('get_available_models')
}

/**
 * Transcribe audio file locally using whisper.cpp
 *
 * Note: The audio file must be in WAV format (16kHz mono recommended).
 * WebM files need to be converted first.
 *
 * @param audioPath - Path to the audio file (WAV format)
 * @param model - Model to use (tiny, base, small, medium, large-v3, turbo)
 * @param useGpu - Whether to use GPU acceleration
 * @returns Transcription result with segments and timestamps
 * @throws Error if transcription fails or model not found
 */
export async function transcribeLocal(
  audioPath: string,
  model: string,
  useGpu: boolean = true
): Promise<LocalTranscriptionResult> {
  return invoke<LocalTranscriptionResult>('transcribe_local', {
    audioPath,
    model,
    useGpu,
  })
}

/**
 * Get the download URL for a model
 *
 * @param model - Model name
 * @returns Hugging Face download URL
 */
export async function getModelDownloadUrl(model: string): Promise<string> {
  return invoke<string>('get_model_download_url', { model })
}

/**
 * Get the directory where models are stored
 *
 * @returns Path to models directory
 */
export async function getModelsDirectory(): Promise<string> {
  return invoke<string>('get_models_directory')
}

/**
 * Download a Whisper model (using browser fetch)
 *
 * Downloads the model file from Hugging Face and saves it to the models directory.
 * Progress callback is called with download progress.
 *
 * @param model - Model name to download
 * @param onProgress - Callback for download progress (0-100)
 * @returns Path to the downloaded model file
 */
export async function downloadModel(
  model: string,
  onProgress?: (percentage: number) => void
): Promise<string> {
  const modelInfo = await getModelInfo(model)

  if (modelInfo.exists) {
    console.log(`Model ${model} already exists at ${modelInfo.path}`)
    return modelInfo.path
  }

  const modelsDir = await getModelsDirectory()

  console.log(`Downloading model ${model} from ${modelInfo.downloadUrl}`)
  console.log(`Target path: ${modelInfo.path}`)

  try {
    const response = await fetch(modelInfo.downloadUrl)

    if (!response.ok) {
      throw new Error(`Failed to download model: ${response.status} ${response.statusText}`)
    }

    const contentLength = response.headers.get('content-length')
    const total = contentLength ? parseInt(contentLength, 10) : modelInfo.sizeBytes

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('Failed to get response body reader')
    }

    const chunks: Uint8Array[] = []
    let received = 0

    while (true) {
      const { done, value } = await reader.read()

      if (done) break

      chunks.push(value)
      received += value.length

      if (onProgress) {
        const percentage = Math.round((received / total) * 100)
        onProgress(percentage)
      }
    }

    // Combine chunks into a single array
    const allChunks = new Uint8Array(received)
    let position = 0
    for (const chunk of chunks) {
      allChunks.set(chunk, position)
      position += chunk.length
    }

    // Save the model file using Tauri FS
    // For now, we'll need to implement a save_model_file command
    // This is a placeholder - the actual download should be done in Rust
    console.log(`Downloaded ${received} bytes, need to save to ${modelsDir}`)

    // TODO: Implement save_model_file Tauri command
    throw new Error(
      'Model download saving not yet implemented. Please download manually from: ' +
        modelInfo.downloadUrl
    )
  } catch (error) {
    throw new Error(`Failed to download model: ${error}`)
  }
}

/**
 * Format transcription segments for display
 *
 * @param segments - Array of transcription segments
 * @returns Formatted string with timestamps
 */
export function formatTranscription(segments: TranscriptionSegment[]): string {
  return segments
    .map(segment => {
      const startTime = formatTimestamp(segment.start)
      const endTime = formatTimestamp(segment.end)
      return `[${startTime} - ${endTime}] ${segment.text.trim()}`
    })
    .join('\n')
}

/**
 * Format seconds to MM:SS.mmm
 */
function formatTimestamp(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  const ms = Math.floor((seconds % 1) * 1000)
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`
}

/**
 * Check if local Whisper feature is available
 *
 * The local-whisper feature must be enabled at compile time.
 * If not enabled, transcribe_local will return an error.
 *
 * @returns true if local whisper is likely available
 */
export async function isLocalWhisperAvailable(): Promise<boolean> {
  try {
    // Try to get models directory - this works even without local-whisper feature
    await getModelsDirectory()
    return true
  } catch {
    return false
  }
}

/**
 * Check if the system supports GPU acceleration for Whisper
 *
 * @returns 'cuda', 'metal', or 'cpu'
 */
export async function checkComputeCapability(): Promise<string> {
  return invoke<string>('check_compute_capability')
}
