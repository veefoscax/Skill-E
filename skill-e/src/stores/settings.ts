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
 * Settings state interface
 * Manages application settings and user preferences
 */
export interface SettingsState {
  // API Keys
  whisperApiKey: string;
  claudeApiKey: string;
  openaiApiKey: string;
  
  // Output settings
  outputDir: string;
  
  // Recording settings
  captureInterval: number; // milliseconds between frames
  captureQuality: number; // 0-100
  
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
  outputDir: '',
  captureInterval: 1000, // 1 second
  captureQuality: 80,
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
