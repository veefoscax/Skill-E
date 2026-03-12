/**
 * Overlay Hotkeys Hook
 *
 * Centralized hotkey management for overlay UI.
 * Handles all keyboard shortcuts for overlay features:
 * - 1, 2, 3: Select drawing colors
 * - P: Toggle pin mode
 * - C: Clear all drawings
 * - E: Toggle element picker (when implemented)
 * - K: Toggle keyboard display
 *
 * Requirements: FR-4.10, FR-4.13, FR-4.14, FR-4.20
 */

import { useEffect } from 'react'
import { useOverlayStore } from '../stores/overlay'

/**
 * Hotkey configuration
 */
export interface OverlayHotkeyConfig {
  /** Enable color selection hotkeys (1, 2, 3) */
  enableColorSelection?: boolean

  /** Enable pin mode toggle (P) */
  enablePinToggle?: boolean

  /** Enable clear drawings (C) */
  enableClear?: boolean

  /** Enable element picker toggle (E) */
  enableElementPicker?: boolean

  /** Enable keyboard display toggle (K) */
  enableKeyboardToggle?: boolean

  /** Custom callback when a hotkey is pressed */
  onHotkeyPress?: (key: string, action: string) => void
}

/**
 * Default hotkey configuration
 */
const DEFAULT_CONFIG: Required<OverlayHotkeyConfig> = {
  enableColorSelection: true,
  enablePinToggle: true,
  enableClear: true,
  enableElementPicker: true,
  enableKeyboardToggle: true,
  onHotkeyPress: () => {},
}

/**
 * Hook to manage overlay hotkeys
 *
 * Usage:
 * ```tsx
 * useOverlayHotkeys({
 *   enableColorSelection: true,
 *   enablePinToggle: true,
 *   onHotkeyPress: (key, action) => console.log(`${key} -> ${action}`),
 * });
 * ```
 */
export function useOverlayHotkeys(config: OverlayHotkeyConfig = {}) {
  const {
    enableColorSelection,
    enablePinToggle,
    enableClear,
    enableElementPicker,
    enableKeyboardToggle,
    onHotkeyPress,
  } = { ...DEFAULT_CONFIG, ...config }

  // Get store actions
  const { setColor, togglePinMode, clearDrawings, toggleElementPicker, toggleKeyboardDisplay } =
    useOverlayStore()

  useEffect(() => {
    /**
     * Handle keydown events
     */
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore if user is typing in an input field
      const target = event.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return
      }

      // Ignore if modifier keys are pressed (except for the key itself)
      if (event.ctrlKey || event.altKey || event.metaKey) {
        return
      }

      const key = event.key.toLowerCase()

      // Color selection: 1, 2, 3
      if (enableColorSelection) {
        if (key === '1') {
          event.preventDefault()
          setColor('COLOR_1')
          onHotkeyPress('1', 'Select Color 1 (Red)')
          return
        }
        if (key === '2') {
          event.preventDefault()
          setColor('COLOR_2')
          onHotkeyPress('2', 'Select Color 2 (Blue)')
          return
        }
        if (key === '3') {
          event.preventDefault()
          setColor('COLOR_3')
          onHotkeyPress('3', 'Select Color 3 (Green)')
          return
        }
      }

      // Pin mode toggle: P
      if (enablePinToggle && key === 'p') {
        event.preventDefault()
        togglePinMode()
        onHotkeyPress('P', 'Toggle Pin Mode')
        return
      }

      // Clear drawings: C
      if (enableClear && key === 'c') {
        event.preventDefault()
        clearDrawings()
        onHotkeyPress('C', 'Clear Drawings')
        return
      }

      // Element picker toggle: E
      if (enableElementPicker && key === 'e') {
        event.preventDefault()
        toggleElementPicker()
        onHotkeyPress('E', 'Toggle Element Picker')
        return
      }

      // Keyboard display toggle: K
      if (enableKeyboardToggle && key === 'k') {
        event.preventDefault()
        toggleKeyboardDisplay()
        onHotkeyPress('K', 'Toggle Keyboard Display')
        return
      }
    }

    // Add event listener
    window.addEventListener('keydown', handleKeyDown, true)

    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true)
    }
  }, [
    enableColorSelection,
    enablePinToggle,
    enableClear,
    enableElementPicker,
    enableKeyboardToggle,
    onHotkeyPress,
    setColor,
    togglePinMode,
    clearDrawings,
    toggleElementPicker,
    toggleKeyboardDisplay,
  ])
}

/**
 * Hotkey reference for display
 */
export const OVERLAY_HOTKEYS = {
  COLOR_1: { key: '1', description: 'Select Color 1 (Red)' },
  COLOR_2: { key: '2', description: 'Select Color 2 (Blue)' },
  COLOR_3: { key: '3', description: 'Select Color 3 (Green)' },
  PIN_MODE: { key: 'P', description: 'Toggle Pin Mode' },
  CLEAR: { key: 'C', description: 'Clear All Drawings' },
  ELEMENT_PICKER: { key: 'E', description: 'Toggle Element Picker' },
  KEYBOARD_DISPLAY: { key: 'K', description: 'Toggle Keyboard Display' },
} as const

/**
 * Get formatted hotkey list for display
 */
export function getHotkeyList(): Array<{ key: string; description: string }> {
  return Object.values(OVERLAY_HOTKEYS)
}
