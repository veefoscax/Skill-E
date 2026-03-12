/**
 * Element Selector Component
 *
 * Visual indicator for element picker mode.
 * Shows when element picker is enabled (E key toggle).
 * Provides visual feedback that the user can select browser elements.
 *
 * Requirements: FR-4.20, FR-4.21
 * - E key toggles element picker
 * - Visual indicator when active
 * - Highlight element on hover
 * - Show selector tooltip
 * - Disabled by default
 */

import { useEffect, useRef } from 'react'
import { useOverlayStore, SelectedElement } from '../../stores/overlay'
import { generateCSSSelector, generateXPath } from '../../lib/overlay/element-selector'

/**
 * ElementSelector component
 *
 * Displays a visual indicator when element picker mode is active.
 * Highlights elements on hover and shows selector tooltip.
 */
export function ElementSelector() {
  const elementPickerEnabled = useOverlayStore(state => state.elementPickerEnabled)
  const hoveredElement = useOverlayStore(state => state.hoveredElement)
  const setHoveredElement = useOverlayStore(state => state.setHoveredElement)
  const styleRef = useRef<HTMLStyleElement | null>(null)

  // Inject highlight CSS when element picker is enabled
  useEffect(() => {
    if (!elementPickerEnabled) {
      // Remove highlight CSS when disabled
      if (styleRef.current) {
        styleRef.current.remove()
        styleRef.current = null
      }
      setHoveredElement(undefined)
      return
    }

    // Inject CSS for highlighting
    const style = document.createElement('style')
    style.id = 'skill-e-element-highlight'
    style.textContent = `
      .skill-e-highlight {
        outline: 2px solid #FF4444 !important;
        outline-offset: 2px !important;
        background: rgba(255, 68, 68, 0.1) !important;
        cursor: crosshair !important;
        position: relative !important;
        z-index: 9999 !important;
      }
      
      .skill-e-highlight::after {
        content: '';
        position: absolute;
        top: -2px;
        left: -2px;
        right: -2px;
        bottom: -2px;
        border: 2px solid #FF4444;
        pointer-events: none;
        animation: skill-e-pulse 1.5s ease-in-out infinite;
      }
      
      @keyframes skill-e-pulse {
        0%, 100% {
          opacity: 1;
        }
        50% {
          opacity: 0.5;
        }
      }
    `
    document.head.appendChild(style)
    styleRef.current = style

    // Track mouse movement to highlight elements
    const handleMouseMove = (e: MouseEvent) => {
      // Get element under cursor
      const element = document.elementFromPoint(e.clientX, e.clientY)

      if (!element || element === document.body || element === document.documentElement) {
        // Remove previous highlight
        document.querySelectorAll('.skill-e-highlight').forEach(el => {
          el.classList.remove('skill-e-highlight')
        })
        setHoveredElement(undefined)
        return
      }

      // Remove previous highlight
      document.querySelectorAll('.skill-e-highlight').forEach(el => {
        if (el !== element) {
          el.classList.remove('skill-e-highlight')
        }
      })

      // Add highlight to current element
      element.classList.add('skill-e-highlight')

      // Get element information
      const rect = element.getBoundingClientRect()
      const cssSelector = generateCSSSelector(element)
      const xpath = generateXPath(element)

      setHoveredElement({
        cssSelector,
        xpath,
        tagName: element.tagName.toLowerCase(),
        textContent: element.textContent?.trim().substring(0, 50) || '',
        boundingBox: {
          x: rect.left,
          y: rect.top,
          width: rect.width,
          height: rect.height,
        },
        timestamp: Date.now(),
      })
    }

    // Handle click to select element
    const handleClick = async (e: MouseEvent) => {
      // Prevent default behavior
      e.preventDefault()
      e.stopPropagation()

      // Get element under cursor
      const element = document.elementFromPoint(e.clientX, e.clientY)

      if (!element || element === document.body || element === document.documentElement) {
        return
      }

      // Get comprehensive element information with screenshot
      const rect = element.getBoundingClientRect()
      const cssSelector = generateCSSSelector(element)
      const xpath = generateXPath(element)

      // Capture screenshot (this may take a moment)
      let screenshot: string | undefined
      try {
        // Dynamically import html2canvas
        const html2canvas = (await import('html2canvas')).default

        const canvas = await html2canvas(element as HTMLElement, {
          backgroundColor: null,
          logging: false,
          scale: 2,
          useCORS: true,
          allowTaint: true,
        })

        screenshot = canvas.toDataURL('image/png')
      } catch (error) {
        console.error('Failed to capture element screenshot:', error)
      }

      // Create selected element object
      const selectedElement: SelectedElement = {
        cssSelector,
        xpath,
        tagName: element.tagName.toLowerCase(),
        textContent: element.textContent?.trim() || '',
        boundingBox: {
          x: rect.left,
          y: rect.top,
          width: rect.width,
          height: rect.height,
        },
        screenshot,
        timestamp: Date.now(),
      }

      // Store the selected element
      useOverlayStore.getState().selectElement(selectedElement)

      // Visual feedback - flash the element
      element.classList.add('skill-e-selected')
      setTimeout(() => {
        element.classList.remove('skill-e-selected')
      }, 500)

      // Log for debugging
      console.log('Element selected:', selectedElement)
    }

    // Add event listeners
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('click', handleClick, true) // Use capture phase

    // Cleanup
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('click', handleClick, true)
      if (styleRef.current) {
        styleRef.current.remove()
        styleRef.current = null
      }
      // Remove all highlights
      document.querySelectorAll('.skill-e-highlight').forEach(el => {
        el.classList.remove('skill-e-highlight')
      })
    }
  }, [elementPickerEnabled, setHoveredElement])

  // Don't render anything if element picker is disabled
  if (!elementPickerEnabled) {
    return null
  }

  return (
    <div className="element-selector-indicator">
      {/* Visual indicator - positioned at top center */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
        <div className="bg-blue-500/90 backdrop-blur-sm text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-pulse">
          {/* Target icon */}
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>

          {/* Text */}
          <span className="font-medium text-sm">Element Picker Active</span>

          {/* Hint */}
          <span className="text-xs opacity-75 ml-2">Press E to exit</span>
        </div>
      </div>

      {/* Selector tooltip - shows when hovering over an element */}
      {hoveredElement && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{
            left: hoveredElement.boundingBox.x,
            top: hoveredElement.boundingBox.y - 60,
          }}
        >
          <div className="bg-gray-900/95 backdrop-blur-sm text-white px-3 py-2 rounded-md shadow-xl text-xs max-w-md">
            <div className="flex flex-col gap-1">
              {/* Tag name */}
              <div className="flex items-center gap-2">
                <span className="text-blue-400 font-mono font-semibold">
                  {hoveredElement.tagName}
                </span>
                {hoveredElement.textContent && (
                  <span className="text-gray-300 truncate">"{hoveredElement.textContent}"</span>
                )}
              </div>

              {/* CSS Selector */}
              <div className="flex items-start gap-2">
                <span className="text-gray-400 shrink-0">CSS:</span>
                <code className="text-green-400 font-mono text-xs break-all">
                  {hoveredElement.cssSelector}
                </code>
              </div>

              {/* Dimensions */}
              <div className="text-gray-400">
                {Math.round(hoveredElement.boundingBox.width)} ×{' '}
                {Math.round(hoveredElement.boundingBox.height)}px
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Crosshair cursor indicator (optional visual enhancement) */}
      <style>{`
        .element-selector-indicator {
          cursor: crosshair;
        }
        
        .skill-e-selected {
          animation: skill-e-flash 0.5s ease-out;
        }
        
        @keyframes skill-e-flash {
          0%, 100% {
            background-color: transparent;
          }
          50% {
            background-color: rgba(68, 255, 68, 0.3);
          }
        }
      `}</style>
    </div>
  )
}

/**
 * ElementSelectorStatus component
 *
 * Compact status indicator that can be placed in a toolbar or corner.
 * Shows a small badge when element picker is active.
 */
export function ElementSelectorStatus() {
  const elementPickerEnabled = useOverlayStore(state => state.elementPickerEnabled)

  if (!elementPickerEnabled) {
    return null
  }

  return (
    <div className="fixed top-4 right-4 z-50 pointer-events-none">
      <div className="bg-blue-500 text-white px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 text-xs font-medium">
        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
        <span>Element Picker</span>
      </div>
    </div>
  )
}

/**
 * ElementSelectorToggleButton component
 *
 * Button to toggle element picker mode.
 * Can be used in toolbars or control panels.
 */
export function ElementSelectorToggleButton() {
  const { elementPickerEnabled, toggleElementPicker } = useOverlayStore()

  return (
    <button
      onClick={toggleElementPicker}
      className={`
        px-3 py-2 rounded-md text-sm font-medium transition-colors
        ${
          elementPickerEnabled
            ? 'bg-blue-500 text-white hover:bg-blue-600'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }
      `}
      title="Toggle Element Picker (E)"
      aria-label="Toggle Element Picker"
      aria-pressed={elementPickerEnabled}
    >
      <div className="flex items-center gap-2">
        {/* Target icon */}
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span>Element Picker</span>
        {elementPickerEnabled && <span className="text-xs opacity-75">(E)</span>}
      </div>
    </button>
  )
}
