import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Window position for persistence
 */
export interface WindowPosition {
  x: number;
  y: number;
}

/**
 * Transcription mode - API (cloud) or Local (whisper.cpp)
 */
export type TranscriptionMode = 'api' | 'local';

/**
 * Whisper model sizes - ordered by speed/quality tradeoff
 * All models are multilingual (support Portuguese and other languages)
 * 
 * - tiny: Fastest, lowest quality, ~75MB - for slow CPUs without GPU
 * - base: Fast, decent quality, ~140MB
 * - small: Good balance, ~500MB
 * - medium: High quality, ~1.5GB
 * - large-v3: Best quality, ~3GB - requires good GPU
 * - turbo: Large-v3 distilled, faster with GPU, ~800MB
 */
export type WhisperModel = 'tiny' | 'base' | 'small' | 'medium' | 'large-v3' | 'turbo';

/**
 * Settings state interface
 * Manages application settings and user preferences
 */
export interface SettingsState {
  // API Keys
  whisperApiKey: string;
  claudeApiKey: string;
  openaiApiKey: string;

  // Transcription settings
  transcriptionMode: TranscriptionMode;
  whisperModel: WhisperModel;
  useGpu: boolean;

  // Output settings
  outputDir: string;

  // Recording settings
  captureInterval: number; // milliseconds between frames
  captureQuality: number; // 0-100
  selectedMicId: string;

  // Window settings
  windowPosition: WindowPosition | null;
  alwaysOnTop: boolean;

  // Hotkey settings
  recordingHotkey: string;
  annotationHotkey: string;

  // Theme
  theme: 'light' | 'dark' | 'system';

  // Actions
  setWhisperApiKey: (key: string) => void;
  setClaudeApiKey: (key: string) => void;
  setOpenaiApiKey: (key: string) => void;
  setTranscriptionMode: (mode: TranscriptionMode) => void;
  setWhisperModel: (model: WhisperModel) => void;
  setUseGpu: (value: boolean) => void;
  setSelectedMicId: (id: string) => void;
  setOutputDir: (dir: string) => void;
  setCaptureInterval: (interval: number) => void;
  setCaptureQuality: (quality: number) => void;
  setWindowPosition: (position: WindowPosition) => void;
  setAlwaysOnTop: (value: boolean) => void;
  setRecordingHotkey: (hotkey: string) => void;
  setAnnotationHotkey: (hotkey: string) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  reset: () => void;
}

/**
 * Default settings
 */
const defaultSettings = {
  whisperApiKey: '',
  claudeApiKey: '',
  openaiApiKey: '',
  transcriptionMode: 'api' as TranscriptionMode, // Default to API (easier setup)
  whisperModel: 'turbo' as WhisperModel, // Best for GPU users, fallback to tiny
  useGpu: true, // Assume GPU available, can be toggled
  outputDir: '',
  captureInterval: 1000, // 1 second
  captureQuality: 80,
  selectedMicId: 'default',
  windowPosition: null,
  alwaysOnTop: true,
  recordingHotkey: 'Ctrl+Shift+R',
  annotationHotkey: 'Ctrl+Shift+A',
  theme: 'dark' as const,
};

/**
 * Settings store with Zustand
 * Persists user settings across sessions
 */
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...defaultSettings,

      setWhisperApiKey: (key: string) =>
        set({
          whisperApiKey: key,
        }),

      setClaudeApiKey: (key: string) =>
        set({
          claudeApiKey: key,
        }),

      setOpenaiApiKey: (key: string) =>
        set({
          openaiApiKey: key,
        }),

      setTranscriptionMode: (mode: TranscriptionMode) =>
        set({
          transcriptionMode: mode,
        }),

      setWhisperModel: (model: WhisperModel) =>
        set({
          whisperModel: model,
        }),

      setUseGpu: (value: boolean) =>
        set({
          useGpu: value,
          // Auto-adjust model based on GPU availability
          whisperModel: value ? 'turbo' : 'tiny',
        }),

      setSelectedMicId: (id: string) =>
        set({
          selectedMicId: id,
        }),

      setOutputDir: (dir: string) =>
        set({
          outputDir: dir,
        }),

      setCaptureInterval: (interval: number) =>
        set({
          captureInterval: interval,
        }),

      setCaptureQuality: (quality: number) =>
        set({
          captureQuality: Math.max(0, Math.min(100, quality)),
        }),

      setWindowPosition: (position: WindowPosition) =>
        set({
          windowPosition: position,
        }),

      setAlwaysOnTop: (value: boolean) =>
        set({
          alwaysOnTop: value,
        }),

      setRecordingHotkey: (hotkey: string) =>
        set({
          recordingHotkey: hotkey,
        }),

      setAnnotationHotkey: (hotkey: string) =>
        set({
          annotationHotkey: hotkey,
        }),

      setTheme: (theme: 'light' | 'dark' | 'system') =>
        set({
          theme,
        }),

      reset: () => set(defaultSettings),
    }),
    {
      name: 'settings-storage',
      // Persist all settings
    }
  )
);

/**
 * Helper: Get recommended model based on GPU availability
 */
export function getRecommendedModel(hasGpu: boolean): WhisperModel {
  return hasGpu ? 'turbo' : 'tiny';
}

/**
 * Helper: Model info for display
 */
export const WHISPER_MODEL_INFO: Record<WhisperModel, { name: string; size: string; description: string; gpuRecommended: boolean }> = {
  tiny: {
    name: 'Tiny',
    size: '~75MB',
    description: 'Fastest, for basic transcription without GPU',
    gpuRecommended: false,
  },
  base: {
    name: 'Base',
    size: '~140MB',
    description: 'Fast with decent accuracy',
    gpuRecommended: false,
  },
  small: {
    name: 'Small',
    size: '~500MB',
    description: 'Good balance of speed and quality',
    gpuRecommended: false,
  },
  medium: {
    name: 'Medium',
    size: '~1.5GB',
    description: 'High accuracy, slower on CPU',
    gpuRecommended: true,
  },
  'large-v3': {
    name: 'Large V3',
    size: '~3GB',
    description: 'Best accuracy, requires GPU',
    gpuRecommended: true,
  },
  turbo: {
    name: 'Turbo',
    size: '~800MB',
    description: 'Large V3 distilled - fast + accurate with GPU',
    gpuRecommended: true,
  },
};

