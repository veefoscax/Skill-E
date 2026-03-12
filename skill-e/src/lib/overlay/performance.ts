/**
 * Performance Utilities for Overlay UI
 *
 * Provides utilities for monitoring and optimizing overlay performance.
 * Target: 60fps (< 16ms per frame) for all drawing operations.
 *
 * Requirements: NFR-4.2
 */

/**
 * Performance thresholds
 */
export const PERFORMANCE_THRESHOLDS = {
  /** Target frame time for 60fps (milliseconds) */
  TARGET_FRAME_TIME: 16.67,

  /** Warning threshold (milliseconds) */
  WARNING_FRAME_TIME: 20,

  /** Critical threshold (milliseconds) */
  CRITICAL_FRAME_TIME: 33.33, // 30fps

  /** Maximum elements before cleanup */
  MAX_ELEMENTS: 100,

  /** Cleanup interval (milliseconds) */
  CLEANUP_INTERVAL: 5000,
} as const

/**
 * Performance metrics
 */
export interface PerformanceMetrics {
  frameTime: number
  fps: number
  elementCount: number
  timestamp: number
}

/**
 * Performance monitor for tracking frame times
 */
export class PerformanceMonitor {
  private frameTimes: number[] = []
  private maxSamples: number = 60 // Track last 60 frames
  private lastFrameTime: number = 0
  private listeners: Set<(metrics: PerformanceMetrics) => void> = new Set()

  /**
   * Record a frame render
   *
   * @param elementCount - Number of elements rendered
   */
  recordFrame(elementCount: number): void {
    const now = performance.now()

    if (this.lastFrameTime > 0) {
      const frameTime = now - this.lastFrameTime
      this.frameTimes.push(frameTime)

      // Keep only last N samples
      if (this.frameTimes.length > this.maxSamples) {
        this.frameTimes.shift()
      }

      // Notify listeners
      const metrics: PerformanceMetrics = {
        frameTime,
        fps: 1000 / frameTime,
        elementCount,
        timestamp: now,
      }

      this.notifyListeners(metrics)
    }

    this.lastFrameTime = now
  }

  /**
   * Get average frame time
   */
  getAverageFrameTime(): number {
    if (this.frameTimes.length === 0) {
      return 0
    }

    const sum = this.frameTimes.reduce((a, b) => a + b, 0)
    return sum / this.frameTimes.length
  }

  /**
   * Get average FPS
   */
  getAverageFPS(): number {
    const avgFrameTime = this.getAverageFrameTime()
    return avgFrameTime > 0 ? 1000 / avgFrameTime : 0
  }

  /**
   * Check if performance is acceptable
   */
  isPerformanceGood(): boolean {
    const avgFrameTime = this.getAverageFrameTime()
    return avgFrameTime < PERFORMANCE_THRESHOLDS.WARNING_FRAME_TIME
  }

  /**
   * Get performance status
   */
  getStatus(): 'good' | 'warning' | 'critical' {
    const avgFrameTime = this.getAverageFrameTime()

    if (avgFrameTime < PERFORMANCE_THRESHOLDS.WARNING_FRAME_TIME) {
      return 'good'
    } else if (avgFrameTime < PERFORMANCE_THRESHOLDS.CRITICAL_FRAME_TIME) {
      return 'warning'
    } else {
      return 'critical'
    }
  }

  /**
   * Subscribe to performance updates
   */
  subscribe(listener: (metrics: PerformanceMetrics) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  /**
   * Notify listeners
   */
  private notifyListeners(metrics: PerformanceMetrics): void {
    this.listeners.forEach(listener => listener(metrics))
  }

  /**
   * Reset metrics
   */
  reset(): void {
    this.frameTimes = []
    this.lastFrameTime = 0
  }
}

/**
 * Singleton performance monitor
 */
export const performanceMonitor = new PerformanceMonitor()

/**
 * Debounce function for performance optimization
 *
 * @param fn - Function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      fn(...args)
      timeoutId = null
    }, delay)
  }
}

/**
 * Throttle function for performance optimization
 *
 * @param fn - Function to throttle
 * @param delay - Minimum delay between calls in milliseconds
 * @returns Throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  return (...args: Parameters<T>) => {
    const now = Date.now()

    if (now - lastCall >= delay) {
      lastCall = now
      fn(...args)
    } else {
      // Schedule for later if not already scheduled
      if (!timeoutId) {
        timeoutId = setTimeout(
          () => {
            lastCall = Date.now()
            fn(...args)
            timeoutId = null
          },
          delay - (now - lastCall)
        )
      }
    }
  }
}

/**
 * Request animation frame with fallback
 *
 * @param callback - Animation callback
 * @returns Request ID
 */
export function requestFrame(callback: FrameRequestCallback): number {
  return requestAnimationFrame(callback)
}

/**
 * Cancel animation frame
 *
 * @param id - Request ID
 */
export function cancelFrame(id: number): void {
  cancelAnimationFrame(id)
}

/**
 * Batch DOM updates using requestAnimationFrame
 *
 * @param updates - Array of update functions
 */
export function batchUpdates(updates: Array<() => void>): void {
  requestFrame(() => {
    updates.forEach(update => update())
  })
}

/**
 * Measure execution time of a function
 *
 * @param fn - Function to measure
 * @param label - Label for logging
 * @returns Result of the function
 */
export function measureTime<T>(fn: () => T, label: string): T {
  const start = performance.now()
  const result = fn()
  const end = performance.now()
  const duration = end - start

  if (duration > PERFORMANCE_THRESHOLDS.TARGET_FRAME_TIME) {
    console.warn(
      `[Performance] ${label} took ${duration.toFixed(2)}ms (target: ${PERFORMANCE_THRESHOLDS.TARGET_FRAME_TIME}ms)`
    )
  }

  return result
}

/**
 * Check if element count exceeds threshold
 *
 * @param count - Current element count
 * @returns True if cleanup is needed
 */
export function needsCleanup(count: number): boolean {
  return count > PERFORMANCE_THRESHOLDS.MAX_ELEMENTS
}

/**
 * Optimize array operations by removing elements in batches
 *
 * @param array - Array to clean
 * @param predicate - Function to determine if element should be kept
 * @returns Cleaned array
 */
export function batchRemove<T>(array: T[], predicate: (item: T) => boolean): T[] {
  // Use filter for small arrays
  if (array.length < 100) {
    return array.filter(predicate)
  }

  // Use manual loop for large arrays (faster)
  const result: T[] = []
  for (let i = 0; i < array.length; i++) {
    if (predicate(array[i])) {
      result.push(array[i])
    }
  }
  return result
}
