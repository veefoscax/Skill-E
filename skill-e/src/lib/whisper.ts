/**
 * Whisper API Client
 * 
 * Handles transcription of audio files using OpenAI's Whisper API.
 * Returns transcription with segment-level timestamps for synchronization.
 */

export interface TranscriptionSegment {
  id: number;
  start: number;
  end: number;
  text: string;
}

export interface TranscriptionResult {
  text: string;
  segments: TranscriptionSegment[];
  language: string;
  duration: number;
}

export interface WhisperError {
  error: {
    message: string;
    type: string;
    code?: string;
  };
}

/**
 * Transcribe audio file using Whisper API
 * 
 * @param audioPath - Path to the audio file (or File/Blob object)
 * @param apiKey - OpenAI API key
 * @returns Transcription result with segments and timestamps
 * @throws Error if API request fails
 */
export async function transcribeAudio(
  audioPath: string | File | Blob,
  apiKey: string
): Promise<TranscriptionResult> {
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('Whisper API key is required. Please configure it in settings.');
  }

  try {
    // Prepare the form data
    const formData = new FormData();

    // Handle different input types
    if (typeof audioPath === 'string') {
      // If it's a path, we need to fetch the file
      // In a Tauri app, we'd use the FS API to read the file
      throw new Error('File path input not yet implemented. Please pass File or Blob object.');
    } else if (audioPath instanceof File) {
      formData.append('file', audioPath);
    } else if (audioPath instanceof Blob) {
      // Convert Blob to File with a name
      const file = new File([audioPath], 'audio.webm', { type: audioPath.type || 'audio/webm' });
      formData.append('file', file);
    } else {
      throw new Error('Invalid audio input type. Expected File or Blob.');
    }

    // Whisper API parameters
    formData.append('model', 'whisper-1');
    formData.append('response_format', 'verbose_json');
    formData.append('timestamp_granularities[]', 'segment');

    // Make API request
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: formData,
    });

    // Handle error responses
    if (!response.ok) {
      const errorData: WhisperError = await response.json();
      throw new Error(
        `Whisper API error (${response.status}): ${errorData.error?.message || 'Unknown error'}`
      );
    }

    // Parse successful response
    const result = await response.json();

    // Validate response structure
    if (!result.text || !Array.isArray(result.segments)) {
      throw new Error('Invalid response format from Whisper API');
    }

    return {
      text: result.text,
      segments: result.segments.map((segment: any, index: number) => ({
        id: segment.id ?? index,
        start: segment.start ?? 0,
        end: segment.end ?? 0,
        text: segment.text ?? '',
      })),
      language: result.language || 'unknown',
      duration: result.duration || 0,
    };
  } catch (error) {
    // Re-throw with more context
    if (error instanceof Error) {
      throw new Error(`Transcription failed: ${error.message}`);
    }
    throw new Error('Transcription failed: Unknown error');
  }
}

/**
 * Validate API key by making a test request
 * 
 * @param apiKey - OpenAI API key to validate
 * @returns true if valid, false otherwise
 */
export async function validateWhisperApiKey(apiKey: string): Promise<boolean> {
  if (!apiKey || apiKey.trim() === '') {
    return false;
  }

  try {
    // Make a simple request to check if the key is valid
    // We'll use the models endpoint which is cheaper than transcription
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    return response.ok;
  } catch (error) {
    console.error('API key validation failed:', error);
    return false;
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
    .map((segment) => {
      const startTime = formatTimestamp(segment.start);
      const endTime = formatTimestamp(segment.end);
      return `[${startTime} - ${endTime}] ${segment.text.trim()}`;
    })
    .join('\n');
}

/**
 * Format seconds to MM:SS.mmm
 */
function formatTimestamp(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
}

import { invoke, Channel } from '@tauri-apps/api/core';

// --- Whisper Local Helpers (Rust Wrappers) ---

export async function checkModelExists(model: string): Promise<boolean> {
  return await invoke('check_model_exists', { model });
}

export async function downloadModel(model: string, onProgress?: (downloadedBytes: number) => void): Promise<void> {
  const channel = new Channel<number>();

  if (onProgress) {
    channel.onmessage = (message) => {
      onProgress(message);
    };
  }

  return await invoke('download_model', {
    model,
    onProgress: channel
  });
}

export async function getModelInfo(model: string): Promise<any> {
  return await invoke('get_model_info', { model });
}
