/**
 * Real Whisper Integration
 * 
 * Handles model management and transcription with real Whisper local
 */

import { invoke } from '@tauri-apps/api/core';
import type { TranscriptionResult } from './whisper';
import { useSettingsStore } from '@/stores/settings';

// Fallback only if settings are empty
const FALLBACK_MODEL = 'tiny';

export interface ModelInfo {
  id: string;
  name: string;
  size: string;
  exists: boolean;
  path: string;
  downloadUrl: string;
  sizeBytes: number;
}

/**
 * Get current preferred model from settings
 */
function getPreferredModel(): string {
  try {
    const settings = useSettingsStore.getState();
    return settings.whisperModel || FALLBACK_MODEL;
  } catch {
    return FALLBACK_MODEL;
  }
}

/**
 * Check if a model exists locally
 */
export async function checkModelExists(model?: string): Promise<boolean> {
  const targetModel = model || getPreferredModel();
  return invoke('check_model_exists', { model: targetModel });
}

/**
 * Get info about a model
 */
export async function getModelInfo(model?: string): Promise<ModelInfo> {
  const targetModel = model || getPreferredModel();
  return invoke('get_model_info', { model: targetModel });
}

/**
 * Get all available models with their status
 */
export async function getAvailableModels(): Promise<ModelInfo[]> {
  return invoke('get_available_models');
}

/**
 * Download a model with progress callback
 */
export async function downloadModel(
  model?: string,
  onProgress?: (downloaded: number, total: number) => void
): Promise<string> {
  const targetModel = model || getPreferredModel();

  // Get model info for total size
  const info = await getModelInfo(targetModel);

  // Create progress channel
  const progressChannel = new (window as any).__TAURI__.ipc.Channel();
  progressChannel.onmessage = (downloaded: number) => {
    if (onProgress) {
      onProgress(downloaded, info.sizeBytes);
    }
  };

  return invoke('download_model', { model: targetModel, onProgress: progressChannel });
}

/**
 * Ensure model exists, download if needed
 */
export async function ensureModel(model?: string): Promise<string> {
  const targetModel = model || getPreferredModel();
  return invoke('ensure_model', { model: targetModel });
}

/**
 * Transcribe audio file using local Whisper
 * 
 * Automatically downloads model if needed
 */
export async function transcribeAudioReal(
  audioPath: string,
  options: {
    model?: string;
    useGpu?: boolean;
    onModelDownloadProgress?: (downloaded: number, total: number) => void;
  } = {}
): Promise<TranscriptionResult> {
  const model = options.model || getPreferredModel();
  const settings = useSettingsStore.getState();
  const useGpu = options.useGpu !== undefined ? options.useGpu : (settings.useGpu || false);

  // Check if model exists
  const exists = await checkModelExists(model);

  if (!exists) {
    console.log(`Model ${model} not found. Downloading...`);
    await downloadModel(model, options.onModelDownloadProgress);
  }

  // Now transcribe
  const result = await invoke<{
    text: string;
    segments: Array<{
      id: number;
      start: number;
      end: number;
      text: string;
    }>;
    language: string;
    duration: number;
  }>('transcribe_local', {
    audioPath,
    model,
    useGpu
  });

  return {
    text: result.text,
    segments: result.segments.map(s => ({
      id: s.id,
      start: s.start,
      end: s.end,
      text: s.text
    })),
    language: result.language,
    duration: result.duration
  };
}

/**
 * Get the models directory path
 */
export async function getModelsDirectory(): Promise<string> {
  return invoke('get_models_directory');
}

/**
 * Get recommended model based on system capabilities
 */
export async function getRecommendedModel(): Promise<string> {
  try {
    const { hasGpu, vramGb } = await invoke<{ hasGpu: boolean; vramGb?: number }>('check_compute_capability');

    if (hasGpu && vramGb && vramGb > 4) {
      return 'small'; // ~466MB, needs GPU
    }
  } catch {
    // Ignore error, use CPU-based recommendation
  }

  // CPU-only systems: use tiny or base
  return FALLBACK_MODEL; // tiny
}
