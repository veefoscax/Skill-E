/**
 * Drawing Canvas Component
 *
 * SVG-based drawing surface for overlay annotations.
 * Supports three types of drawing gestures:
 * - Tap (short click) → Dot marker
 * - Drag → Arrow
 * - Diagonal drag → Rectangle
 *
 * Features:
 * - Mouse event handling (mousedown, mousemove, mouseup)
 * - Real-time drawing preview
 * - 3-color palette (Red, Blue, Green)
 * - Fade-out or pinned mode
 * - Keyboard shortcuts (1, 2, 3 for colors, P for pin, C for clear)
 * - Optimized for 60fps performance
 *
 * Requirements: FR-4.6, FR-4.7, FR-4.8, NFR-4.2
 */

import { useState, useRef, useEffect, useCallback, memo } from 'react'
import { COLORS, ColorKey } from '../../lib/overlay/click-tracker'
import {
  detectDrawingType,
  createGesture,
  type Point,
  type DrawingType,
} from '../../lib/overlay/drawing-tools'
import { useOverlayStore } from '../../stores/overlay'
import {
  performanceMonitor,
  PERFORMANCE_THRESHOLDS,
  needsCleanup,
  batchRemove,
} from '../../lib/overlay/performance'

/**
 * Drawing Element data structure
 */
export interface DrawingElement {
  id: string
  type: DrawingType
  color: ColorKey
  startPoint: Point
  endPoint?: Point // For arrow/rectangle
  timestamp: number
  isPinned: boolean
  fadeState: 'visible' | 'fading' | 'hidden'
}

/**
 * Drawing gesture data (temporary during drawing)
 */
interface DrawingGesture {
  startPoint: Point
  currentPoint: Point
  startTime: number
}

interface DrawingCanvasProps {
  /** Optional: Show pin mode indicator */
  showIndicator?: boolean
}

export function DrawingCanvas({ showIndicator = true }: DrawingCanvasProps) {
  // Get state from store
  const { isPinMode, currentColor, drawings: storeDrawings } = useOverlayStore()

  const [drawings, setDrawings] = useState<DrawingElement[]>([])
  const [currentGesture, setCurrentGesture] = useState<DrawingGesture | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const svgRef = useRef<SVGSVGElement>(null)

  /**
   * Sync local drawings with store clear action
   */
  useEffect(() => {
    if (storeDrawings.length === 0 && drawings.length > 0) {
      setDrawings([])
    }
  }, [storeDrawings.length, drawings.length])

  /**
   * Handle mouse down - start drawing gesture
   */
  const handleMouseDown = (event: React.MouseEvent<SVGSVGElement>) => {
    // Only handle left mouse button
    if (event.button !== 0) {
      return
    }

    const point = {
      x: event.clientX,
      y: event.clientY,
    }

    setIsDrawing(true)
    setCurrentGesture({
      startPoint: point,
      currentPoint: point,
      startTime: Date.now(),
    })
  }

  /**
   * Handle mouse move - update drawing preview
   */
  const handleMouseMove = (event: React.MouseEvent<SVGSVGElement>) => {
    if (!isDrawing || !currentGesture) {
      return
    }

    setCurrentGesture({
      ...currentGesture,
      currentPoint: {
        x: event.clientX,
        y: event.clientY,
      },
    })
  }

  /**
   * Handle mouse up - finalize drawing
   */
  const handleMouseUp = (event: React.MouseEvent<SVGSVGElement>) => {
    if (!isDrawing || !currentGesture) {
      return
    }

    const endPoint: Point = {
      x: event.clientX,
      y: event.clientY,
    }

    const endTime = Date.now()

    // Create gesture using library function
    const gesture = createGesture(
      currentGesture.startPoint,
      endPoint,
      currentGesture.startTime,
      endTime
    )

    // Detect drawing type using library function
    const type = detectDrawingType(gesture)

    // Create drawing element
    const drawing: DrawingElement = {
      id: crypto.randomUUID(),
      type,
      color: currentColor,
      startPoint: currentGesture.startPoint,
      endPoint: type !== 'dot' ? endPoint : undefined,
      timestamp: Date.now(),
      isPinned: isPinMode,
      fadeState: 'visible',
    }

    // Add to drawings array
    setDrawings(prev => [...prev, drawing])

    // Reset gesture state
    setIsDrawing(false)
    setCurrentGesture(null)
  }

  /**
   * Handle mouse leave - cancel drawing if in progress
   */
  const handleMouseLeave = () => {
    if (isDrawing) {
      setIsDrawing(false)
      setCurrentGesture(null)
    }
  }

  /**
   * Handle drawing fade completion - optimized with useCallback
   */
  const handleFadeComplete = useCallback((drawingId: string) => {
    setDrawings(prev =>
      prev.map(d => (d.id === drawingId ? { ...d, fadeState: 'hidden' as const } : d))
    )
  }, [])

  /**
   * Clean up hidden drawings periodically - optimized batch removal
   */
  useEffect(() => {
    const interval = setInterval(() => {
      setDrawings(prev => {
        // Only clean if there are hidden elements
        const hasHidden = prev.some(d => d.fadeState === 'hidden')
        if (!hasHidden) return prev

        // Use optimized batch removal
        return batchRemove(prev, d => d.fadeState !== 'hidden')
      })
    }, PERFORMANCE_THRESHOLDS.CLEANUP_INTERVAL)

    return () => clearInterval(interval)
  }, [])

  /**
   * Monitor performance and trigger cleanup if needed
   */
  useEffect(() => {
    const totalElements = drawings.length
    performanceMonitor.recordFrame(totalElements)

    // Force cleanup if too many elements
    if (needsCleanup(totalElements)) {
      setDrawings(prev => batchRemove(prev, d => d.fadeState !== 'hidden'))
    }
  }, [drawings.length])

  return (
    <div className="relative w-full h-full">
      {/* Pin Mode Indicator */}
      {showIndicator && <PinModeIndicator isPinned={isPinMode} currentColor={currentColor} />}

      <svg
        ref={svgRef}
        className="w-full h-full"
        style={{
          display: 'block',
          cursor: isDrawing ? 'crosshair' : 'default',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        {/* Render completed drawings */}
        {drawings.map(drawing => (
          <DrawingElement key={drawing.id} drawing={drawing} onFadeComplete={handleFadeComplete} />
        ))}

        {/* Render current drawing preview */}
        {isDrawing && currentGesture && (
          <DrawingPreview gesture={currentGesture} color={currentColor} />
        )}
      </svg>
    </div>
  )
}

/**
 * Drawing Element Renderer
 *
 * Renders a completed drawing element (dot, arrow, or rectangle)
 * Memoized for performance optimization
 */
interface DrawingElementProps {
  drawing: DrawingElement
  onFadeComplete?: (drawingId: string) => void
}

const DrawingElement = memo(function DrawingElement({
  drawing,
  onFadeComplete,
}: DrawingElementProps) {
  const [isFading, setIsFading] = useState(false)
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const removeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    // Don't fade if pinned
    if (drawing.isPinned) {
      return
    }

    // Start fading after 2.5 seconds (fade animation takes 0.5s)
    fadeTimerRef.current = setTimeout(() => {
      setIsFading(true)
    }, 2500)

    // Mark as hidden after 3 seconds total
    removeTimerRef.current = setTimeout(() => {
      onFadeComplete?.(drawing.id)
    }, 3000)

    return () => {
      if (fadeTimerRef.current) {
        clearTimeout(fadeTimerRef.current)
      }
      if (removeTimerRef.current) {
        clearTimeout(removeTimerRef.current)
      }
    }
  }, [drawing.id, drawing.isPinned, onFadeComplete])

  const color = COLORS[drawing.color]
  const opacity = isFading ? 0 : 1
  const transition = isFading ? 'opacity 0.5s ease-out' : 'none'

  // Use CSS transform for GPU acceleration
  const style = {
    transition,
    willChange: isFading ? 'opacity' : 'auto',
  }

  // Render based on type
  switch (drawing.type) {
    case 'dot':
      return (
        <circle
          cx={drawing.startPoint.x}
          cy={drawing.startPoint.y}
          r={8}
          fill={color}
          opacity={opacity}
          style={style}
        />
      )

    case 'arrow':
      if (!drawing.endPoint) return null
      return (
        <g opacity={opacity} style={style}>
          <Arrow start={drawing.startPoint} end={drawing.endPoint} color={color} />
        </g>
      )

    case 'rectangle':
      if (!drawing.endPoint) return null
      return (
        <g opacity={opacity} style={style}>
          <Rectangle start={drawing.startPoint} end={drawing.endPoint} color={color} />
        </g>
      )

    default:
      return null
  }
})

/**
 * Drawing Preview Renderer
 *
 * Shows a preview of the current drawing gesture
 */
interface DrawingPreviewProps {
  gesture: DrawingGesture
  color: ColorKey
}

function DrawingPreview({ gesture, color }: DrawingPreviewProps) {
  const colorValue = COLORS[color]

  // Create a temporary gesture for detection
  const tempGesture = createGesture(
    gesture.startPoint,
    gesture.currentPoint,
    gesture.startTime,
    Date.now()
  )

  // Detect what type this gesture would be
  const detectedType = detectDrawingType(tempGesture)

  // Show preview based on detected type
  if (detectedType === 'dot') {
    return (
      <circle
        cx={gesture.startPoint.x}
        cy={gesture.startPoint.y}
        r={8}
        fill={colorValue}
        opacity={0.6}
      />
    )
  }

  if (detectedType === 'rectangle') {
    return (
      <Rectangle
        start={gesture.startPoint}
        end={gesture.currentPoint}
        color={colorValue}
        opacity={0.6}
      />
    )
  }

  // Default to arrow
  return (
    <Arrow start={gesture.startPoint} end={gesture.currentPoint} color={colorValue} opacity={0.6} />
  )
}

/**
 * Arrow SVG Component
 *
 * Renders an arrow from start to end point with arrowhead
 * Memoized for performance
 */
interface ArrowProps {
  start: Point
  end: Point
  color: string
  opacity?: number
}

const Arrow = memo(function Arrow({ start, end, color, opacity = 1 }: ArrowProps) {
  // Calculate arrowhead points
  const dx = end.x - start.x
  const dy = end.y - start.y
  const angle = Math.atan2(dy, dx)
  const arrowLength = 15
  const arrowAngle = Math.PI / 6 // 30 degrees

  // Arrowhead points
  const arrowPoint1 = {
    x: end.x - arrowLength * Math.cos(angle - arrowAngle),
    y: end.y - arrowLength * Math.sin(angle - arrowAngle),
  }
  const arrowPoint2 = {
    x: end.x - arrowLength * Math.cos(angle + arrowAngle),
    y: end.y - arrowLength * Math.sin(angle + arrowAngle),
  }

  return (
    <>
      {/* Arrow line */}
      <line
        x1={start.x}
        y1={start.y}
        x2={end.x}
        y2={end.y}
        stroke={color}
        strokeWidth={3}
        strokeLinecap="round"
        opacity={opacity}
      />
      {/* Arrowhead */}
      <polygon
        points={`${end.x},${end.y} ${arrowPoint1.x},${arrowPoint1.y} ${arrowPoint2.x},${arrowPoint2.y}`}
        fill={color}
        opacity={opacity}
      />
    </>
  )
})

/**
 * Rectangle SVG Component
 *
 * Renders a rectangle outline from start to end point
 * Memoized for performance
 */
interface RectangleProps {
  start: Point
  end: Point
  color: string
  opacity?: number
}

const Rectangle = memo(function Rectangle({ start, end, color, opacity = 1 }: RectangleProps) {
  const x = Math.min(start.x, end.x)
  const y = Math.min(start.y, end.y)
  const width = Math.abs(end.x - start.x)
  const height = Math.abs(end.y - start.y)

  return (
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      stroke={color}
      strokeWidth={3}
      fill="none"
      opacity={opacity}
    />
  )
})

/**
 * Pin Mode Indicator
 *
 * Shows current pin mode status and selected color in the top-right corner
 */
interface PinModeIndicatorProps {
  isPinned: boolean
  currentColor: ColorKey
}

function PinModeIndicator({ isPinned, currentColor }: PinModeIndicatorProps) {
  const colorValue = COLORS[currentColor]

  return (
    <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2 text-white text-sm font-medium pointer-events-none">
      {/* Color indicator */}
      <div
        className="w-4 h-4 rounded-full border-2 border-white/50"
        style={{ backgroundColor: colorValue }}
      />

      {/* Pin mode status */}
      <div className="flex items-center gap-1.5">
        {isPinned ? (
          <>
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L11 4.323V3a1 1 0 011-1zm-5 8.274l-.818 2.552c-.25.78-.03 1.632.57 2.14.599.508 1.434.558 2.068.193L10 13.5l3.18 1.659c.634.365 1.469.315 2.068-.193.6-.508.82-1.36.57-2.14L15 10.274v-1.548l-2.5-1V9a1 1 0 11-2 0V7.726l-2.5 1v1.548z" />
            </svg>
            <span>Pinned</span>
          </>
        ) : (
          <>
            <svg
              className="w-4 h-4 opacity-50"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="opacity-70">Fade 3s</span>
          </>
        )}
      </div>

      {/* Keyboard hints */}
      <div className="ml-2 pl-2 border-l border-white/20 text-xs opacity-60">
        <kbd className="px-1">P</kbd> pin · <kbd className="px-1">C</kbd> clear
      </div>
    </div>
  )
}
