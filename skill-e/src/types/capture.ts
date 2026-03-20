/**
 * Screen capture type definitions
 * Requirements: FR-2.5
 */

/**
 * Result of a screen capture operation
 */
export interface CaptureResult {
  /** Path to the saved screenshot file */
  path: string
  /** Unix timestamp in milliseconds when the capture was taken */
  timestamp: number
}

/**
 * Information about an active window
 */
export interface WindowInfo {
  /** Window title */
  title: string
  /** Process name */
  processName: string
  /** Window bounds */
  bounds: {
    x: number
    y: number
    width: number
    height: number
  }
}

/**
 * Cursor position
 */
export interface CursorPosition {
  x: number
  y: number
}

/**
 * Metadata for a captured frame stored in manifest.json
 */
export interface FrameMetadata {
  /** Unique frame identifier */
  id: string
  /** Unix timestamp in milliseconds */
  timestamp: number
  /** Relative path to the screenshot image (within session directory) */
  imagePath: string
  /** Active window at time of capture */
  activeWindow?: WindowInfo
  /** Cursor position at time of capture */
  cursorPosition?: CursorPosition
}

/**
 * Session manifest containing all frame metadata
 */
export interface SessionManifest {
  /** Unique session identifier */
  sessionId: string
  /** Session start time (Unix timestamp in ms) */
  startTime: number
  /** Session end time (Unix timestamp in ms) */
  endTime?: number
  /** Capture interval in milliseconds */
  intervalMs: number
  /** All captured frames */
  frames: FrameMetadata[]
  /** Optional audio recording path */
  audioPath?: string
}

/**
 * A single captured frame with metadata
 */
export interface CaptureFrame {
  /** Unique frame identifier */
  id: string
  /** Unix timestamp in milliseconds */
  timestamp: number
  /** Path to the screenshot image */
  imagePath: string
  /** Active window at time of capture */
  activeWindow?: WindowInfo
  /** Cursor position at time of capture */
  cursorPosition?: CursorPosition
}

/**
 * A complete capture session
 */
export interface CaptureSession {
  /** Unique session identifier */
  id: string
  /** Full path to session directory */
  directory: string
  /** Session start time (Unix timestamp in ms) */
  startTime: number
  /** Session end time (Unix timestamp in ms) */
  endTime?: number
  /** All captured frames */
  frames: CaptureFrame[]
  /** Full frame history for persistence-heavy flows */
  allFrames?: CaptureFrame[]
  /** Capture interval in milliseconds */
  intervalMs: number
}
