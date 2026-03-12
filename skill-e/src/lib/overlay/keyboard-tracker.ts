/**
 * Keyboard Tracker for Overlay UI
 *
 * Tracks global keyboard events during recording and manages keyboard display.
 * Tracks modifier keys (Shift, Ctrl, Alt, Cmd) and buffers typed text.
 * Integrates with enhanced password redaction for 100% reliable detection.
 *
 * Requirements: FR-4.15, FR-4.16, FR-4.17, FR-4.18, NFR-4.4
 */

import { detectPasswordField, type PasswordFieldInfo } from './password-redaction'

/**
 * Modifier keys state
 */
export interface ModifierKeys {
  shift: boolean
  ctrl: boolean
  alt: boolean
  meta: boolean // Cmd on Mac, Windows key on Windows
}

/**
 * Keyboard state data structure
 */
export interface KeyboardState {
  /** Current modifier keys pressed */
  modifiers: ModifierKeys

  /** Current text buffer (typed text) */
  currentText: string

  /** Whether the current focused element is a password field */
  isPasswordField: boolean

  /** Password field detection info (for enhanced redaction) */
  passwordFieldInfo?: PasswordFieldInfo

  /** Timestamp of last key event */
  lastKeyTimestamp: number
}

/**
 * Keyboard event data
 */
export interface KeyboardEvent {
  key: string
  modifiers: ModifierKeys
  timestamp: number
  isPasswordField: boolean
}

/**
 * Keyboard Tracker class
 *
 * Manages keyboard event tracking and text buffering.
 */
export class KeyboardTracker {
  private state: KeyboardState = {
    modifiers: {
      shift: false,
      ctrl: false,
      alt: false,
      meta: false,
    },
    currentText: '',
    isPasswordField: false,
    lastKeyTimestamp: 0,
  }

  private isTracking: boolean = false
  private listeners: Set<(state: KeyboardState) => void> = new Set()
  private textBufferTimeout: number | null = null

  // Configuration
  private readonly TEXT_BUFFER_TIMEOUT = 2000 // Clear text buffer after 2 seconds of inactivity
  private readonly MAX_TEXT_LENGTH = 100 // Maximum text buffer length

  /**
   * Start tracking keyboard events
   */
  start(): void {
    if (this.isTracking) {
      return
    }

    this.isTracking = true
    this.resetState()

    // Listen for global keyboard events
    window.addEventListener('keydown', this.handleKeyDown, true)
    window.addEventListener('keyup', this.handleKeyUp, true)

    // Listen for focus changes to detect password fields
    window.addEventListener('focusin', this.handleFocusChange, true)
    window.addEventListener('focusout', this.handleFocusChange, true)
  }

  /**
   * Stop tracking keyboard events
   */
  stop(): void {
    if (!this.isTracking) {
      return
    }

    this.isTracking = false

    // Remove event listeners
    window.removeEventListener('keydown', this.handleKeyDown, true)
    window.removeEventListener('keyup', this.handleKeyUp, true)
    window.removeEventListener('focusin', this.handleFocusChange, true)
    window.removeEventListener('focusout', this.handleFocusChange, true)

    // Clear timeout
    if (this.textBufferTimeout !== null) {
      window.clearTimeout(this.textBufferTimeout)
      this.textBufferTimeout = null
    }
  }

  /**
   * Handle keydown event
   */
  private handleKeyDown = (event: globalThis.KeyboardEvent): void => {
    if (!this.isTracking) {
      return
    }

    // Update modifier keys
    this.updateModifiers(event)

    // Handle printable characters
    if (this.isPrintableKey(event.key)) {
      this.addToTextBuffer(event.key)
    }
    // Handle special keys
    else if (event.key === 'Backspace') {
      this.removeFromTextBuffer()
    } else if (event.key === 'Enter') {
      this.addToTextBuffer('\n')
    } else if (event.key === 'Space' || event.key === ' ') {
      this.addToTextBuffer(' ')
    }

    // Update timestamp
    this.state.lastKeyTimestamp = Date.now()

    // Notify listeners
    this.notifyListeners()

    // Reset text buffer timeout
    this.resetTextBufferTimeout()
  }

  /**
   * Handle keyup event
   */
  private handleKeyUp = (event: globalThis.KeyboardEvent): void => {
    if (!this.isTracking) {
      return
    }

    // Update modifier keys
    this.updateModifiers(event)

    // Notify listeners
    this.notifyListeners()
  }

  /**
   * Handle focus change to detect password fields
   * Uses enhanced password detection for 100% reliability
   */
  private handleFocusChange = (event: FocusEvent): void => {
    if (!this.isTracking) {
      return
    }

    const target = event.target as HTMLElement

    if (event.type === 'focusin') {
      // Use enhanced password field detection
      const detectionResult = detectPasswordField(target)
      this.state.isPasswordField = detectionResult.isPasswordField
      this.state.passwordFieldInfo = detectionResult

      // Clear text buffer when switching fields
      this.state.currentText = ''
    } else if (event.type === 'focusout') {
      // Clear password field flag
      this.state.isPasswordField = false
      this.state.passwordFieldInfo = undefined

      // Clear text buffer
      this.state.currentText = ''
    }

    // Notify listeners
    this.notifyListeners()
  }

  /**
   * Update modifier keys state from keyboard event
   */
  private updateModifiers(event: globalThis.KeyboardEvent): void {
    this.state.modifiers = {
      shift: event.shiftKey,
      ctrl: event.ctrlKey,
      alt: event.altKey,
      meta: event.metaKey,
    }
  }

  /**
   * Check if a key is printable (not a modifier or special key)
   */
  private isPrintableKey(key: string): boolean {
    // Single character keys are printable
    if (key.length === 1) {
      return true
    }

    // Exclude modifier and special keys
    const nonPrintableKeys = [
      'Shift',
      'Control',
      'Alt',
      'Meta',
      'CapsLock',
      'Tab',
      'Escape',
      'Enter',
      'Backspace',
      'ArrowUp',
      'ArrowDown',
      'ArrowLeft',
      'ArrowRight',
      'Home',
      'End',
      'PageUp',
      'PageDown',
      'Insert',
      'Delete',
      'F1',
      'F2',
      'F3',
      'F4',
      'F5',
      'F6',
      'F7',
      'F8',
      'F9',
      'F10',
      'F11',
      'F12',
    ]

    return !nonPrintableKeys.includes(key)
  }

  /**
   * Add character to text buffer
   */
  private addToTextBuffer(char: string): void {
    // Limit text buffer length
    if (this.state.currentText.length >= this.MAX_TEXT_LENGTH) {
      // Remove first character to make room
      this.state.currentText = this.state.currentText.slice(1)
    }

    this.state.currentText += char
  }

  /**
   * Remove last character from text buffer (backspace)
   */
  private removeFromTextBuffer(): void {
    if (this.state.currentText.length > 0) {
      this.state.currentText = this.state.currentText.slice(0, -1)
    }
  }

  /**
   * Reset text buffer timeout
   * Clears the text buffer after a period of inactivity
   */
  private resetTextBufferTimeout(): void {
    // Clear existing timeout
    if (this.textBufferTimeout !== null) {
      window.clearTimeout(this.textBufferTimeout)
    }

    // Set new timeout
    this.textBufferTimeout = window.setTimeout(() => {
      this.state.currentText = ''
      this.notifyListeners()
    }, this.TEXT_BUFFER_TIMEOUT)
  }

  /**
   * Check if an element is a password field (legacy method - kept for reference)
   *
   * @deprecated Use detectPasswordField from password-redaction.ts instead
   */
  // @ts-ignore - Kept for reference
   
  private _isPasswordFieldLegacy(element: HTMLElement): boolean {
    if (!element) {
      return false
    }

    // Check input type
    if (element instanceof HTMLInputElement && element.type === 'password') {
      return true
    }

    // Check autocomplete attribute
    const autocomplete = element.getAttribute('autocomplete')
    if (
      autocomplete?.includes('password') ||
      autocomplete?.includes('current-password') ||
      autocomplete?.includes('new-password')
    ) {
      return true
    }

    // Check id and name attributes
    const id = element.id?.toLowerCase() || ''
    const name = element.getAttribute('name')?.toLowerCase() || ''

    if (id.includes('password') || id.includes('passwd') || id.includes('pwd')) {
      return true
    }

    if (name.includes('password') || name.includes('passwd') || name.includes('pwd')) {
      return true
    }

    return false
  }

  /**
   * Get current keyboard state
   */
  getState(): KeyboardState {
    return { ...this.state }
  }

  /**
   * Get current modifier keys
   */
  getModifiers(): ModifierKeys {
    return { ...this.state.modifiers }
  }

  /**
   * Get current text buffer
   */
  getCurrentText(): string {
    return this.state.currentText
  }

  /**
   * Check if any modifier key is pressed
   */
  hasModifiers(): boolean {
    return (
      this.state.modifiers.shift ||
      this.state.modifiers.ctrl ||
      this.state.modifiers.alt ||
      this.state.modifiers.meta
    )
  }

  /**
   * Clear text buffer
   */
  clearTextBuffer(): void {
    this.state.currentText = ''
    this.notifyListeners()
  }

  /**
   * Reset state
   */
  private resetState(): void {
    this.state = {
      modifiers: {
        shift: false,
        ctrl: false,
        alt: false,
        meta: false,
      },
      currentText: '',
      isPasswordField: false,
      lastKeyTimestamp: 0,
    }
  }

  /**
   * Subscribe to keyboard state updates
   *
   * @param listener - Callback function that receives the updated keyboard state
   * @returns Unsubscribe function
   */
  subscribe(listener: (state: KeyboardState) => void): () => void {
    this.listeners.add(listener)

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener)
    }
  }

  /**
   * Notify all listeners of state updates
   */
  private notifyListeners(): void {
    const state = this.getState()
    this.listeners.forEach(listener => listener(state))
  }

  /**
   * Reset the tracker (clear state and stop tracking)
   */
  reset(): void {
    this.stop()
    this.resetState()
  }

  /**
   * Check if tracking is active
   */
  isActive(): boolean {
    return this.isTracking
  }
}

/**
 * Singleton instance of the keyboard tracker
 */
export const keyboardTracker = new KeyboardTracker()
