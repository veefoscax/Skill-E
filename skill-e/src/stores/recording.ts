import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Represents a single captured frame during recording
 */
export interface CaptureFrame {
  timestamp: number;
  imageData?: string; // Base64 encoded image
  cursorPosition?: { x: number; y: number };
}

/**
 * Recording state interface
 * Manages the state of screen recording sessions
 */
export interface RecordingState {
  // Recording status
  isRecording: boolean;
  isPaused: boolean;
  isAnnotationMode: boolean;
  
  // Timing
  startTime: number | null;
  duration: number; // in seconds
  
  // Captured data
  frames: CaptureFrame[];
  audioBlob: Blob | null;
  audioPath: string | null;
  
  // Actions
  startRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  stopRecording: () => void;
  toggleRecording: () => void;
  toggleAnnotationMode: () => void;
  cancelRecording: () => void;
  updateDuration: (duration: number) => void;
  addFrame: (frame: CaptureFrame) => void;
  setAudioBlob: (blob: Blob) => void;
  setAudioPath: (path: string) => void;
  reset: () => void;
}

/**
 * Initial state for recording
 */
const initialState = {
  isRecording: false,
  isPaused: false,
  isAnnotationMode: false,
  startTime: null,
  duration: 0,
  frames: [],
  audioBlob: null,
  audioPath: null,
};

/**
 * Recording store with Zustand
 * Manages recording state and provides actions to control recording
 */
export const useRecordingStore = create<RecordingState>()(
  persist(
    (set) => ({
      ...initialState,

      startRecording: () =>
        set({
          isRecording: true,
          isPaused: false,
          startTime: Date.now(),
          duration: 0,
          frames: [],
          audioBlob: null,
          audioPath: null,
        }),

      pauseRecording: () =>
        set({
          isPaused: true,
        }),

      resumeRecording: () =>
        set({
          isPaused: false,
        }),

      stopRecording: () =>
        set({
          isRecording: false,
          isPaused: false,
        }),

      toggleRecording: () =>
        set((state) => {
          if (state.isRecording) {
            // Stop recording
            return {
              isRecording: false,
              isPaused: false,
            };
          } else {
            // Start recording
            return {
              isRecording: true,
              isPaused: false,
              startTime: Date.now(),
              duration: 0,
              frames: [],
              audioBlob: null,
              audioPath: null,
            };
          }
        }),

      toggleAnnotationMode: () =>
        set((state) => ({
          isAnnotationMode: !state.isAnnotationMode,
        })),

      cancelRecording: () =>
        set({
          isRecording: false,
          isPaused: false,
          startTime: null,
          duration: 0,
          frames: [],
          audioBlob: null,
          audioPath: null,
        }),

      updateDuration: (duration: number) =>
        set({
          duration,
        }),

      addFrame: (frame: CaptureFrame) =>
        set((state) => ({
          frames: [...state.frames, frame],
        })),

      setAudioBlob: (blob: Blob) =>
        set({
          audioBlob: blob,
        }),

      setAudioPath: (path: string) =>
        set({
          audioPath: path,
        }),

      reset: () => set(initialState),
    }),
    {
      name: 'recording-storage',
      // Only persist non-transient data
      partialize: () => ({
        // Don't persist recording session data, only settings if needed
        // For now, we don't persist anything from recording state
      }),
    }
  )
);
