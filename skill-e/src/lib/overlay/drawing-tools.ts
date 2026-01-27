/**
 * Drawing Tools Library
 * 
 * Gesture detection and drawing utilities for overlay annotations.
 * Extracted from DrawingCanvas.tsx for reusability and testability.
 * 
 * Supports three types of drawing gestures:
 * - Tap (short click) → Dot marker
 * - Drag → Arrow
 * - Diagonal drag → Rectangle
 * 
 * Requirements: FR-4.6, FR-4.7, FR-4.8
 */

/**
 * Point in 2D space
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * Drawing gesture data
 */
export interface DrawingGesture {
  startPoint: Point;
  endPoint: Point;
  duration: number;  // milliseconds
}

/**
 * Drawing type
 */
export type DrawingType = 'dot' | 'arrow' | 'rectangle';

/**
 * Gesture detection thresholds
 */
export const GESTURE_THRESHOLDS = {
  /** Maximum distance (px) for tap gesture */
  TAP_MAX_DISTANCE: 10,
  /** Maximum duration (ms) for tap gesture */
  TAP_MAX_DURATION: 200,
  /** Minimum distance (px) for diagonal drag to be rectangle */
  RECTANGLE_MIN_DISTANCE: 20,
} as const;

/**
 * Calculate Euclidean distance between two points
 * 
 * @param p1 - First point
 * @param p2 - Second point
 * @returns Distance in pixels
 */
export function calculateDistance(p1: Point, p2: Point): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate absolute delta between two points
 * 
 * @param p1 - First point
 * @param p2 - Second point
 * @returns Object with dx and dy (absolute values)
 */
export function calculateDelta(p1: Point, p2: Point): { dx: number; dy: number } {
  return {
    dx: Math.abs(p2.x - p1.x),
    dy: Math.abs(p2.y - p1.y),
  };
}

/**
 * Detect drawing type from gesture
 * 
 * Detection rules:
 * 1. Tap = dot: distance < 10px AND duration < 200ms
 * 2. Diagonal drag = rectangle: dx > 20px AND dy > 20px
 * 3. Any other drag = arrow
 * 
 * @param gesture - Drawing gesture data
 * @returns Detected drawing type
 * 
 * @example
 * ```typescript
 * const gesture = {
 *   startPoint: { x: 100, y: 100 },
 *   endPoint: { x: 105, y: 102 },
 *   duration: 150
 * };
 * const type = detectDrawingType(gesture); // 'dot'
 * ```
 */
export function detectDrawingType(gesture: DrawingGesture): DrawingType {
  const distance = calculateDistance(gesture.startPoint, gesture.endPoint);
  const { dx, dy } = calculateDelta(gesture.startPoint, gesture.endPoint);

  // Rule 1: Tap = dot (very short drag)
  if (
    distance < GESTURE_THRESHOLDS.TAP_MAX_DISTANCE &&
    gesture.duration < GESTURE_THRESHOLDS.TAP_MAX_DURATION
  ) {
    return 'dot';
  }

  // Rule 2: Diagonal drag = rectangle
  if (
    dx > GESTURE_THRESHOLDS.RECTANGLE_MIN_DISTANCE &&
    dy > GESTURE_THRESHOLDS.RECTANGLE_MIN_DISTANCE
  ) {
    return 'rectangle';
  }

  // Rule 3: Any other drag = arrow
  return 'arrow';
}

/**
 * Check if gesture is a tap (dot)
 * 
 * @param gesture - Drawing gesture data
 * @returns True if gesture is a tap
 */
export function isTapGesture(gesture: DrawingGesture): boolean {
  return detectDrawingType(gesture) === 'dot';
}

/**
 * Check if gesture is an arrow
 * 
 * @param gesture - Drawing gesture data
 * @returns True if gesture is an arrow
 */
export function isArrowGesture(gesture: DrawingGesture): boolean {
  return detectDrawingType(gesture) === 'arrow';
}

/**
 * Check if gesture is a rectangle
 * 
 * @param gesture - Drawing gesture data
 * @returns True if gesture is a rectangle
 */
export function isRectangleGesture(gesture: DrawingGesture): boolean {
  return detectDrawingType(gesture) === 'rectangle';
}

/**
 * Create a gesture from mouse event data
 * 
 * @param startPoint - Starting point
 * @param endPoint - Ending point
 * @param startTime - Start timestamp (ms)
 * @param endTime - End timestamp (ms)
 * @returns Drawing gesture
 */
export function createGesture(
  startPoint: Point,
  endPoint: Point,
  startTime: number,
  endTime: number
): DrawingGesture {
  return {
    startPoint,
    endPoint,
    duration: endTime - startTime,
  };
}
