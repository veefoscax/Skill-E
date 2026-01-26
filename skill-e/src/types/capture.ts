/**
 * Screen capture type definitions
 * Requirements: FR-2.5
 */

/**
 * Result of a screen capture operation
 */
export interface CaptureResult {
  /** Path to the saved screenshot file */
  path: string;
  /** Unix timestamp in milliseconds when the capture was taken */
  timestamp: number;
}

/**
 * Information about an active window
 */
export interface WindowInfo {
  /** Window title */
  title: string;
  /** Process name */
  processName: string;
  /** Window bounds */
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

/**
 * A single captured frame with metadata
 */
export interface CaptureFrame {
  /** Unique frame identifier */
  id: string;
  /** Unix timestamp in milliseconds */
  timestamp: number;
  /** Path to the screenshot image */
  imagePath: string;
  /** Active window at time of capture */
  activeWindow?: WindowInfo;
  /** Cursor position at time of capture */
  cursorPosition?: {
    x: number;
    y: number;
  };
}

/**
 * A complete capture session
 */
export interface CaptureSession {
  /** Unique session identifier */
  id: string;
  /** Session start time (Unix timestamp in ms) */
  startTime: number;
  /** Session end time (Unix timestamp in ms) */
  endTime?: number;
  /** All captured frames */
  frames: CaptureFrame[];
  /** Capture interval in milliseconds */
  intervalMs: number;
}
