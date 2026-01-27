/**
 * Processing pipeline type definitions
 * Requirements: FR-5.1, FR-5.2, FR-5.3, FR-5.4, FR-5.10
 */

import type { CaptureFrame, WindowInfo } from './capture';
export type { TranscriptionSegment } from '../lib/whisper';
import type {
  ClickIndicator,
  DrawingElement,
  SelectedElement,
  KeyboardState,
} from '../stores/overlay';

/**
 * Types of events that can occur in a timeline
 */
export type TimelineEventType =
  | 'screenshot'
  | 'voice'
  | 'click'
  | 'drawing'
  | 'keyboard'
  | 'element_selection'
  | 'window_change'
  | 'pause';

/**
 * Base timeline event with common properties
 */
export interface BaseTimelineEvent {
  /** Unique event identifier */
  id: string;
  /** Event type */
  type: TimelineEventType;
  /** Unix timestamp in milliseconds */
  timestamp: number;
}

/**
 * Screenshot event in timeline
 */
export interface ScreenshotEvent extends BaseTimelineEvent {
  type: 'screenshot';
  /** Reference to the capture frame */
  frame: CaptureFrame;
}

/**
 * Voice/transcription event in timeline
 */
export interface VoiceEvent extends BaseTimelineEvent {
  type: 'voice';
  /** Transcription segment */
  segment: TranscriptionSegment;
  /** Classified speech type */
  classification?: SpeechClassification;
}

/**
 * Click event in timeline
 */
export interface ClickEvent extends BaseTimelineEvent {
  type: 'click';
  /** Click indicator data */
  click: ClickIndicator;
}

/**
 * Drawing annotation event in timeline
 */
export interface DrawingEvent extends BaseTimelineEvent {
  type: 'drawing';
  /** Drawing element data */
  drawing: DrawingElement;
}

/**
 * Keyboard input event in timeline
 */
export interface KeyboardEvent extends BaseTimelineEvent {
  type: 'keyboard';
  /** Keyboard state at this moment */
  keyboard: KeyboardState;
}

/**
 * Element selection event in timeline
 */
export interface ElementSelectionEvent extends BaseTimelineEvent {
  type: 'element_selection';
  /** Selected element data */
  element: SelectedElement;
}

/**
 * Window focus change event in timeline
 */
export interface WindowChangeEvent extends BaseTimelineEvent {
  type: 'window_change';
  /** New active window */
  window: WindowInfo;
}

/**
 * Voice pause event (used for step detection)
 */
export interface PauseEvent extends BaseTimelineEvent {
  type: 'pause';
  /** Duration of pause in milliseconds */
  duration: number;
}

/**
 * Union type of all timeline events
 */
export type TimelineEvent =
  | ScreenshotEvent
  | VoiceEvent
  | ClickEvent
  | DrawingEvent
  | KeyboardEvent
  | ElementSelectionEvent
  | WindowChangeEvent
  | PauseEvent;

/**
 * Speech classification types
 * Requirements: FR-5.8
 */
export type SpeechClassification =
  | 'instruction' // Direct action instruction ("Click the button")
  | 'context' // Explanatory context ("This is the login page")
  | 'variable' // Variable mention ("Enter your email address")
  | 'conditional' // Conditional statement ("If you see an error...")
  | 'unknown'; // Unable to classify

/**
 * Detected variable from speech
 * Requirements: FR-5.8
 */
export interface DetectedVariable {
  /** Variable name (e.g., "email", "password") */
  name: string;
  /** Description from narration */
  description: string;
  /** Timestamp when mentioned */
  timestamp: number;
  /** Associated transcript segment */
  transcriptSegment: string;
}

/**
 * Detected conditional statement
 * Requirements: FR-5.9
 */
export interface DetectedConditional {
  /** Condition description */
  condition: string;
  /** Action to take if condition is true */
  thenAction: string;
  /** Optional else action */
  elseAction?: string;
  /** Timestamp when mentioned */
  timestamp: number;
  /** Associated transcript segment */
  transcriptSegment: string;
}

/**
 * A processed step in the demonstration
 * Requirements: FR-5.3
 */
export interface ProcessedStep {
  /** Step number (1-indexed) */
  stepNumber: number;
  /** Time range for this step */
  timeRange: {
    /** Start time in milliseconds */
    start: number;
    /** End time in milliseconds */
    end: number;
  };
  /** Path to representative screenshot for this step */
  screenshotPath: string;
  /** Transcript text for this step */
  transcript: string;
  /** All annotations made during this step */
  annotations: {
    clicks: ClickIndicator[];
    drawings: DrawingElement[];
    selectedElements: SelectedElement[];
    keyboardInputs: KeyboardState[];
  };
  /** Active window title during this step */
  windowTitle?: string;
  /** Active application during this step */
  applicationName?: string;
  /** All timeline events in this step */
  events: TimelineEvent[];
  /** Detected variables in this step */
  variables: DetectedVariable[];
  /** Detected conditionals in this step */
  conditionals: DetectedConditional[];
  /** OCR-extracted text from screenshot */
  ocrText?: string;
  /** OCR text regions with bounding boxes */
  ocrRegions?: OCRRegion[];
}

/**
 * Complete processed session
 * Requirements: FR-5.1, FR-5.10
 */
export interface ProcessedSession {
  /** Unique session identifier */
  sessionId: string;
  /** Total duration in milliseconds */
  duration: number;
  /** All processed steps */
  steps: ProcessedStep[];
  /** Complete transcript text */
  fullTranscript: string;
  /** All annotations from the session */
  allAnnotations: {
    clicks: ClickIndicator[];
    drawings: DrawingElement[];
    selectedElements: SelectedElement[];
    keyboardInputs: KeyboardState[];
  };
  /** Complete timeline of all events */
  timeline: TimelineEvent[];
  /** All detected variables */
  allVariables: DetectedVariable[];
  /** All detected conditionals */
  allConditionals: DetectedConditional[];
  /** OCR results for key frames */
  ocrResults?: OCRResult[];
  /** Session start time */
  startTime: number;
  /** Session end time */
  endTime: number;
}

/**
 * Context prepared for LLM skill generation
 * Requirements: FR-5.4, FR-5.11 through FR-5.22
 */
export interface LLMContext {
  /** High-level task description */
  taskDescription: string;
  /** Structured steps for the LLM */
  steps: LLMStep[];
  /** Complete narration/transcript */
  fullNarration: string;
  /** Detected variables to parameterize */
  variables: DetectedVariable[];
  /** Detected conditional logic */
  conditionals: DetectedConditional[];
  /** Summary statistics */
  summary: {
    /** Total number of clicks */
    totalClicks: number;
    /** Total number of text inputs */
    totalTextInputs: number;
    /** Total number of page loads/window changes */
    totalPageLoads: number;
    /** Total number of annotations */
    totalAnnotations: number;
    /** Duration in seconds */
    durationSeconds: number;
  };
  /** Reference to full data (not embedded in prompt) */
  references: {
    /** Path to full screenshot archive */
    screenshotArchive: string;
    /** Path to complete session data */
    sessionDataPath: string;
  };
}

/**
 * A single step in LLM context
 * Requirements: FR-5.4
 */
export interface LLMStep {
  /** Step number */
  number: number;
  /** Human-readable description of the step */
  description: string;
  /** Base64-encoded screenshot (key frame only) */
  screenshot?: string;
  /** Additional notes and context */
  notes: string[];
  /** Timestamp range */
  timeRange: {
    start: number;
    end: number;
  };
  /** Actions performed in this step */
  actions: {
    clicks: number;
    textInputs: number;
    annotations: number;
  };
}

/**
 * Processing progress state
 * Requirements: FR-5.5, NFR-5.2
 */
export interface ProcessingProgress {
  /** Current processing stage */
  stage:
    | 'loading'
    | 'timeline'
    | 'step_detection'
    | 'classification'
    | 'ocr'
    | 'context_generation'
    | 'complete'
    | 'error';
  /** Progress percentage (0-100) */
  percentage: number;
  /** Current step label */
  currentStep: string;
  /** Estimated time remaining in seconds */
  estimatedTimeRemaining?: number;
  /** Error message if stage is 'error' */
  error?: string;
}

/**
 * Key frame selection criteria
 * Requirements: FR-5.11 through FR-5.15
 */
export interface KeyFrameCandidate {
  /** Frame reference */
  frame: CaptureFrame;
  /** Importance score (0-1) */
  importanceScore: number;
  /** Reasons for importance */
  reasons: KeyFrameReason[];
}

/**
 * Reasons why a frame is considered important
 */
export type KeyFrameReason =
  | 'before_action' // Frame immediately before an action
  | 'after_action' // Frame immediately after an action
  | 'state_change' // Significant visual change detected
  | 'page_load' // First frame after navigation
  | 'annotation' // Frame has user annotations
  | 'ocr_content' // Frame has important text content
  | 'window_change'; // Active window changed

/**
 * OCR result for a frame
 * Requirements: FR-5.6
 */
export interface OCRResult {
  /** Frame identifier */
  frameId: string;
  /** Extracted text */
  text: string;
  /** Confidence score (0-1) */
  confidence: number;
  /** Text regions with bounding boxes */
  regions: OCRRegion[];
}

/**
 * A region of text detected by OCR
 */
export interface OCRRegion {
  /** Extracted text */
  text: string;
  /** Bounding box */
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  /** Confidence score (0-1) */
  confidence: number;
}
