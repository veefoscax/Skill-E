/**
 * Click Tracker for Overlay UI
 *
 * Tracks global mouse clicks during recording and manages click indicators.
 * Each click is numbered sequentially and assigned a color from the 3-color palette.
 *
 * Requirements: FR-4.1, FR-4.4
 */

// Color Palette (Fixed 3 colors)
export const COLORS = {
  COLOR_1: '#FF4444', // Red
  COLOR_2: '#4488FF', // Blue
  COLOR_3: '#44CC44', // Green
} as const

export type ColorKey = keyof typeof COLORS

/**
 * Click Indicator data structure
 */
export interface ClickIndicator {
  id: string
  number: number // 1, 2, 3...
  position: { x: number; y: number }
  color: ColorKey // Cycles through COLOR_1 → COLOR_2 → COLOR_3
  timestamp: number
  fadeState: 'visible' | 'fading' | 'hidden'
}

/**
 * Get the color for a given click number
 * Cycles through: Red → Blue → Green → Red...
 *
 * @param clickNumber - The sequential click number (1, 2, 3...)
 * @returns The color key for this click
 */
export function getColorForClick(clickNumber: number): ColorKey {
  const colors: ColorKey[] = ['COLOR_1', 'COLOR_2', 'COLOR_3']
  return colors[(clickNumber - 1) % 3]
}

/**
 * Click Tracker class
 *
 * Manages click tracking and indicator lifecycle.
 */
export class ClickTracker {
  private clicks: ClickIndicator[] = []
  private clickCount: number = 0
  private isTracking: boolean = false
  private listeners: Set<(clicks: ClickIndicator[]) => void> = new Set()

  /**
   * Start tracking clicks
   */
  start(): void {
    if (this.isTracking) {
      return
    }

    this.isTracking = true
    this.clickCount = 0
    this.clicks = []

    // Listen for global mouse clicks
    window.addEventListener('click', this.handleClick, true)
  }

  /**
   * Stop tracking clicks
   */
  stop(): void {
    if (!this.isTracking) {
      return
    }

    this.isTracking = false
    window.removeEventListener('click', this.handleClick, true)
  }

  /**
   * Handle click event
   */
  private handleClick = (event: MouseEvent): void => {
    if (!this.isTracking) {
      return
    }

    // Increment click count
    this.clickCount++

    // Create click indicator
    const click: ClickIndicator = {
      id: crypto.randomUUID(),
      number: this.clickCount,
      position: {
        x: event.clientX,
        y: event.clientY,
      },
      color: getColorForClick(this.clickCount),
      timestamp: Date.now(),
      fadeState: 'visible',
    }

    // Add to clicks array
    this.clicks.push(click)

    // Notify listeners
    this.notifyListeners()
  }

  /**
   * Get all clicks
   */
  getClicks(): ClickIndicator[] {
    return [...this.clicks]
  }

  /**
   * Get click count
   */
  getClickCount(): number {
    return this.clickCount
  }

  /**
   * Clear all clicks
   */
  clear(): void {
    this.clicks = []
    this.clickCount = 0
    this.notifyListeners()
  }

  /**
   * Update click fade state
   *
   * @param clickId - The click ID to update
   * @param fadeState - The new fade state
   */
  updateFadeState(clickId: string, fadeState: ClickIndicator['fadeState']): void {
    const click = this.clicks.find(c => c.id === clickId)
    if (click) {
      click.fadeState = fadeState
      this.notifyListeners()
    }
  }

  /**
   * Remove hidden clicks from the array
   * Should be called periodically to clean up memory
   */
  removeHiddenClicks(): void {
    const beforeCount = this.clicks.length
    this.clicks = this.clicks.filter(c => c.fadeState !== 'hidden')

    if (this.clicks.length !== beforeCount) {
      this.notifyListeners()
    }
  }

  /**
   * Subscribe to click updates
   *
   * @param listener - Callback function that receives the updated clicks array
   * @returns Unsubscribe function
   */
  subscribe(listener: (clicks: ClickIndicator[]) => void): () => void {
    this.listeners.add(listener)

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener)
    }
  }

  /**
   * Notify all listeners of click updates
   */
  private notifyListeners(): void {
    const clicks = this.getClicks()
    this.listeners.forEach(listener => listener(clicks))
  }

  /**
   * Reset the tracker (clear clicks and reset count)
   */
  reset(): void {
    this.stop()
    this.clear()
  }

  /**
   * Check if tracking is active
   */
  isActive(): boolean {
    return this.isTracking
  }
}

/**
 * Singleton instance of the click tracker
 */
export const clickTracker = new ClickTracker()
