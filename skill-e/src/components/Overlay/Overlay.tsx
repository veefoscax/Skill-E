/**
 * Overlay Component - Main overlay window content
 *
 * This is the React component that renders inside the transparent overlay window.
 * It provides a layered structure for recording feedback:
 *
 * Layer Structure (bottom to top):
 * 1. Drawing Canvas Layer (z-10) - Arrows, rectangles, markers
 * 2. Click Indicators Layer (z-20) - Numbered circles with ripple animations
 * 3. Keyboard Display Layer (z-30) - Shows typed text and modifier keys
 * 4. Element Selector Layer (z-40) - Browser element highlighting (optional)
 *
 * The overlay window itself is created by Tauri (Rust) and is:
 * - Transparent background
 * - Fullscreen (covers entire screen)
 * - Always on top of other windows
 * - Click-through by default (except for interactive elements)
 * - Skips taskbar
 *
 * Pointer Events Strategy:
 * - Root container: pointer-events: none (click-through)
 * - Drawing canvas: pointer-events: auto (captures drawing gestures)
 * - Other layers: pointer-events: none (visual feedback only)
 *
 * Requirements: FR-4.1, NFR-4.1
 */

import { useEffect, useState } from 'react'
import { ClickIndicator } from './ClickIndicator'
import { DrawingCanvas } from './DrawingCanvas'
import { KeyboardDisplay } from './KeyboardDisplay'
import { ElementSelector } from './ElementSelector'
import { StatusIndicator } from './StatusIndicator'
import { CursorHighlight } from './CursorHighlight'
import { clickTracker, ClickIndicator as ClickIndicatorType } from '../../lib/overlay/click-tracker'
import { useOverlayStore } from '../../stores/overlay'
import { useOverlayHotkeys } from '../../hooks/useOverlayHotkeys'

export function Overlay() {
  const [clicks, setClicks] = useState<ClickIndicatorType[]>([])

  // Get state from overlay store
  const {
    isPinMode,
    currentColor,
    keyboard,
    recordingStatus,
    statusIndicatorVisible,
    statusIndicatorPosition,
    cursorHighlight,
  } = useOverlayStore()

  // Enable global hotkeys for overlay
  useOverlayHotkeys({
    enableColorSelection: true,
    enablePinToggle: true,
    enableClear: true,
    enableElementPicker: true,
    enableKeyboardToggle: true,
    onHotkeyPress: (key, action) => {
      console.log(`Overlay hotkey: ${key} -> ${action}`)
    },
  })
  useEffect(() => {
    console.log('Overlay component mounted')

    // Prevent default context menu to avoid interference with drawing
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault()
    }

    document.addEventListener('contextmenu', handleContextMenu)

    // Subscribe to click tracker updates
    const unsubscribe = clickTracker.subscribe(updatedClicks => {
      setClicks(updatedClicks)
    })

    // Start tracking clicks
    clickTracker.start()

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu)
      unsubscribe()
      clickTracker.stop()
    }
  }, [])

  // Handle click fade completion
  const handleFadeComplete = (clickId: string) => {
    clickTracker.updateFadeState(clickId, 'hidden')
    // Periodically clean up hidden clicks
    clickTracker.removeHiddenClicks()
  }

  return (
    <div
      className="fixed inset-0 w-screen h-screen overflow-hidden bg-transparent"
      style={{
        // Make the overlay click-through by default
        // Individual layers will enable pointer events as needed
        pointerEvents: 'none',
      }}
    >
      {/* 
        Layer 1: Drawing Canvas (z-10)
        - SVG-based drawing surface for annotations
        - Captures mouse events for drawing gestures
        - Renders arrows, rectangles, and dot markers
        - Supports fade-out or pinned mode
      */}
      <div
        className="absolute inset-0 z-10"
        style={{ pointerEvents: 'auto' }}
        data-layer="drawing-canvas"
      >
        <DrawingCanvas showIndicator={true} />
      </div>

      {/* 
        Layer 2: Click Indicators (z-20)
        - Shows numbered circles at click positions
        - Displays ripple animation on click
        - Cycles through 3 colors (Red → Blue → Green)
        - Fades out after 3 seconds (unless pinned)
      */}
      <div
        className="absolute inset-0 z-20"
        style={{ pointerEvents: 'none' }}
        data-layer="click-indicators"
      >
        {clicks.map(click => (
          <ClickIndicator
            key={click.id}
            click={click}
            isPinned={isPinMode}
            onFadeComplete={handleFadeComplete}
          />
        ))}
      </div>

      {/* 
        Layer 3: Keyboard Display (z-30)
        - Shows modifier keys (Ctrl, Shift, Alt, Cmd)
        - Displays typed text
        - Redacts password field input
        - Configurable position (corners)
        - Toggle with 'K' hotkey
      */}
      <div
        className="absolute inset-0 z-30"
        style={{ pointerEvents: 'none' }}
        data-layer="keyboard-display"
      >
        <KeyboardDisplay
          position={keyboard.displayPosition}
          visible={keyboard.isVisible}
          redactionMode="bullets"
          showVariableHint={false}
        />
      </div>

      {/* 
        Layer 4: Element Selector (z-40)
        - Browser element highlighting (optional feature)
        - Shows outline around hovered elements
        - Displays selector tooltip
        - Enabled via 'E' hotkey
      */}
      <div
        className="absolute inset-0 z-40"
        style={{ pointerEvents: 'none' }}
        data-layer="element-selector"
      >
        <ElementSelector />
      </div>

      {/* 
        Layer 5: Status Indicator (z-50)
        - Minimal recording status indicator
        - Tiny red dot in corner (8px)
        - Pulsing animation when recording
        - Changes to yellow/orange when paused
        - Optional (can be hidden via settings)
        - Requirements: FR-4.26
      */}
      <div
        className="absolute inset-0 z-50"
        style={{ pointerEvents: 'none' }}
        data-layer="status-indicator"
      >
        <StatusIndicator
          status={recordingStatus}
          visible={statusIndicatorVisible}
          position={statusIndicatorPosition}
        />
      </div>

      {/* 
        Layer 6: Cursor Highlight (z-55)
        - Enlarged cursor ring for better visibility during recording
        - Follows mouse position in real-time
        - Shows ripple effect on click
        - Only visible during recording
        - Requirements: FR-4.5
      */}
      <div
        className="absolute inset-0 z-[55]"
        style={{ pointerEvents: 'none' }}
        data-layer="cursor-highlight"
      >
        <CursorHighlight
          size={cursorHighlight.size}
          color={cursorHighlight.color}
          visible={cursorHighlight.enabled}
          thickness={cursorHighlight.thickness}
        />
      </div>

      {/* 
        Debug Indicator (z-60)
        - Shows overlay is active
        - Shows current drawing mode (color and pin status)
        - Remove or hide in production
      */}
      <div
        className="absolute top-4 right-4 z-60 space-y-2"
        style={{ pointerEvents: 'none' }}
        data-layer="debug"
      >
        <div className="bg-red-500/20 border border-red-500 rounded-lg px-3 py-2">
          <p className="text-xs text-red-500 font-mono">Overlay Active</p>
        </div>
        <div className="bg-zinc-900/80 border border-zinc-700 rounded-lg px-3 py-2 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded-full border-2 border-white"
              style={{
                backgroundColor:
                  currentColor === 'COLOR_1'
                    ? '#FF4444'
                    : currentColor === 'COLOR_2'
                      ? '#4488FF'
                      : '#44CC44',
              }}
            />
            <p className="text-xs text-white font-mono">
              Color {currentColor === 'COLOR_1' ? '1' : currentColor === 'COLOR_2' ? '2' : '3'}
            </p>
          </div>
          <p className="text-xs text-zinc-400 font-mono mt-1">
            {isPinMode ? '📌 Pinned' : '⏱️ Fade'}
          </p>
        </div>
      </div>
    </div>
  )
}
