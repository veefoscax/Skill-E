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
 * Types of capture steps that can be tracked in the live timeline
 * Requirements: FR-4.29
 */
export type StepType = 'screenshot' | 'click' | 'keystroke' | 'network';

/**
 * A single step/event captured during recording
 * Used for the live timeline UI display
 * Requirements: FR-4.29
 */
export interface CaptureStep {
  /** Unique identifier for this step */
  id: string;
  /** Type of capture event */
  type: StepType;
  /** Unix timestamp in milliseconds */
  timestamp: number;
  /** Human-readable label for display */
  label: string;
  /** Optional additional data specific to step type */
  data?: {
    /** For click: element selector or position */
    selector?: string;
    position?: { x: number; y: number };
    /** For keystroke: the text that was typed */
    text?: string;
    /** For network: HTTP method and URL */
    method?: string;
    url?: string;
    /** For screenshot: frame reference */
    frameIndex?: number;
    /** OS Window Context */
    window?: { title: string; process_name: string; bounds: any };
  };
  /** Optional user annotation/note for this step */
  note?: string;
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

  // Step tracking for live timeline (Requirements: FR-4.29)
  steps: CaptureStep[];

  // Session directory for saving files (shared across components)
  sessionDirectory: string | null;

  // Actions
  startRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  stopRecording: () => void;
  toggleRecording: () => void;
  toggleAnnotationMode: () => void;
  cancelRecording: () => void;
  updateDuration: (duration: number) => void;
  setDuration: (duration: number) => void;
  addFrame: (frame: CaptureFrame) => void;
  setAudioBlob: (blob: Blob) => void;
  setAudioPath: (path: string) => void;
  setSessionDirectory: (dir: string | null) => void;

  // Step tracking actions (Requirements: FR-4.29, FR-4.38)
  addStep: (step: Omit<CaptureStep, 'id' | 'timestamp'>) => void;
  updateStepNote: (stepId: string, note: string) => void;
  deleteStep: (stepId: string) => void;
  clearSteps: () => void;
  // Step reordering (Requirements: FR-4.38)
  moveStep: (stepId: string, direction: 'up' | 'down') => void;
  reorderSteps: (stepIds: string[]) => void;

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
  steps: [],
  sessionDirectory: null,
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
          steps: [],
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
              steps: [],
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
          steps: [],
        }),

      updateDuration: (duration: number) =>
        set({
          duration,
        }),

      setDuration: (duration: number) =>
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

      setSessionDirectory: (dir: string | null) =>
        set({
          sessionDirectory: dir,
        }),

      // Step tracking actions (Requirements: FR-4.29)
      addStep: (step) =>
        set((state) => ({
          steps: [
            ...state.steps,
            {
              ...step,
              id: crypto.randomUUID(),
              timestamp: Date.now(),
            },
          ],
        })),

      updateStepNote: (stepId: string, note: string) =>
        set((state) => ({
          steps: state.steps.map((step) =>
            step.id === stepId ? { ...step, note } : step
          ),
        })),

      deleteStep: (stepId: string) =>
        set((state) => ({
          steps: state.steps.filter((step) => step.id !== stepId),
        })),

      clearSteps: () =>
        set({
          steps: [],
        }),

      // Step reordering (Requirements: FR-4.38)
      moveStep: (stepId: string, direction: 'up' | 'down') =>
        set((state) => {
          const index = state.steps.findIndex((s) => s.id === stepId);
          if (index === -1) return state;

          const newSteps = [...state.steps];
          const newIndex = direction === 'up' ? index - 1 : index + 1;

          // Check bounds
          if (newIndex < 0 || newIndex >= newSteps.length) {
            return state;
          }

          // Swap steps
          [newSteps[index], newSteps[newIndex]] = [newSteps[newIndex], newSteps[index]];

          return { steps: newSteps };
        }),

      reorderSteps: (stepIds: string[]) =>
        set((state) => {
          // Validate that all provided IDs exist
          const validIds = stepIds.filter(id => state.steps.some(s => s.id === id));

          // Create map of existing steps
          const stepMap = new Map(state.steps.map(s => [s.id, s]));

          // Reorder according to provided IDs, keeping any unmentioned steps at the end
          const reordered = validIds.map(id => stepMap.get(id)!);
          const mentionedIds = new Set(validIds);
          const remaining = state.steps.filter(s => !mentionedIds.has(s.id));

          return { steps: [...reordered, ...remaining] };
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
