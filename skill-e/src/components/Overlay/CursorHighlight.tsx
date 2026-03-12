/**
 * Cursor Highlight Component
 *
 * Displays an enlarged cursor highlight during recording to make cursor
 * movements more visible in the captured video.
 *
 * Features:
 * - Follows mouse cursor position in real-time
 * - Enlarged circle (32px default) around cursor
 * - Subtle ring animation
 * - Only visible during recording
 * - GPU-accelerated for smooth performance
 *
 * Requirements: FR-4.5
 */

import { useState, useEffect, useRef, memo } from 'react'
import { useRecordingStore } from '@/stores/recording'

/**
 * Props for CursorHighlight component
 */
interface CursorHighlightProps {
  /** Size of the highlight ring in pixels */
  size?: number
  /** Color of the highlight ring */
  color?: string
  /** Whether to show the highlight */
  visible?: boolean
  /** Thickness of the ring border */
  thickness?: number
}

/**
 * Cursor Highlight Component
 *
 * Renders an enlarged visual indicator around the cursor position
 * to improve visibility during screen recordings.
 *
 * @example
 * <CursorHighlight size={40} color="#EF4444" thickness={3} />
 */
export const CursorHighlight = memo(function CursorHighlight({
  size = 32,
  color = '#EF4444',
  visible = true,
  thickness = 2,
}: CursorHighlightProps) {
  const isRecording = useRecordingStore(state => state.isRecording)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isMoving, setIsMoving] = useState(false)
  const moveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const rafRef = useRef<number | null>(null)
  const lastPositionRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    // Only track mouse when recording is active and highlight is visible
    if (!isRecording || !visible) {
      return
    }

    const handleMouseMove = (e: MouseEvent) => {
      // Use requestAnimationFrame for smooth updates
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }

      rafRef.current = requestAnimationFrame(() => {
        setPosition({ x: e.clientX, y: e.clientY })

        // Detect if cursor is moving
        const dx = e.clientX - lastPositionRef.current.x
        const dy = e.clientY - lastPositionRef.current.y
        const distance = Math.sqrt(dx * dx + dy * dy)

        if (distance > 2) {
          setIsMoving(true)
          lastPositionRef.current = { x: e.clientX, y: e.clientY }

          // Clear existing timeout
          if (moveTimeoutRef.current) {
            clearTimeout(moveTimeoutRef.current)
          }

          // Set moving to false after cursor stops
          moveTimeoutRef.current = setTimeout(() => {
            setIsMoving(false)
          }, 150)
        }
      })
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
      if (moveTimeoutRef.current) {
        clearTimeout(moveTimeoutRef.current)
      }
    }
  }, [isRecording, visible])

  // Don't render if not recording or not visible
  if (!isRecording || !visible) {
    return null
  }

  const halfSize = size / 2

  return (
    <div
      className="cursor-highlight-container"
      style={{
        position: 'fixed',
        left: position.x - halfSize,
        top: position.y - halfSize,
        width: size,
        height: size,
        pointerEvents: 'none',
        zIndex: 9999,
        willChange: 'transform',
        transform: 'translateZ(0)',
      }}
    >
      {/* Outer ring with pulse animation when moving */}
      <div
        className={`cursor-highlight-ring ${isMoving ? 'cursor-moving' : ''}`}
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          border: `${thickness}px solid ${color}`,
          opacity: isMoving ? 0.9 : 0.6,
          transition: 'opacity 0.15s ease-out',
          boxShadow: `0 0 ${isMoving ? 12 : 8}px ${color}40`,
        }}
      />

      {/* Inner dot at cursor center */}
      <div
        className="cursor-highlight-center"
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: 6,
          height: 6,
          borderRadius: '50%',
          backgroundColor: color,
          opacity: 0.8,
        }}
      />
    </div>
  )
})

/**
 * Cursor Highlight with click indicator
 *
 * Extended version that shows a ripple effect on click
 */
interface CursorHighlightWithClickProps extends CursorHighlightProps {
  /** Whether to show click ripple effect */
  showClickEffect?: boolean
}

export const CursorHighlightWithClick = memo(function CursorHighlightWithClick({
  size = 32,
  color = '#EF4444',
  visible = true,
  thickness = 2,
  showClickEffect = true,
}: CursorHighlightWithClickProps) {
  const isRecording = useRecordingStore(state => state.isRecording)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [clicks, setClicks] = useState<{ id: number; x: number; y: number }[]>([])
  const clickIdRef = useRef(0)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (!isRecording || !visible) {
      return
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
      rafRef.current = requestAnimationFrame(() => {
        setPosition({ x: e.clientX, y: e.clientY })
      })
    }

    const handleClick = (e: MouseEvent) => {
      if (!showClickEffect) return

      const newClick = { id: clickIdRef.current++, x: e.clientX, y: e.clientY }
      setClicks(prev => [...prev, newClick])

      // Remove click effect after animation
      setTimeout(() => {
        setClicks(prev => prev.filter(c => c.id !== newClick.id))
      }, 600)
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    window.addEventListener('click', handleClick, { passive: true })

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('click', handleClick)
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [isRecording, visible, showClickEffect])

  if (!isRecording || !visible) {
    return null
  }

  const halfSize = size / 2

  return (
    <>
      {/* Main cursor highlight */}
      <div
        className="cursor-highlight-container"
        style={{
          position: 'fixed',
          left: position.x - halfSize,
          top: position.y - halfSize,
          width: size,
          height: size,
          pointerEvents: 'none',
          zIndex: 9999,
          willChange: 'transform',
          transform: 'translateZ(0)',
        }}
      >
        <div
          className="cursor-highlight-ring"
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            border: `${thickness}px solid ${color}`,
            opacity: 0.7,
            boxShadow: `0 0 10px ${color}40`,
          }}
        />
        <div
          className="cursor-highlight-center"
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: 6,
            height: 6,
            borderRadius: '50%',
            backgroundColor: color,
            opacity: 0.8,
          }}
        />
      </div>

      {/* Click ripple effects */}
      {clicks.map(click => (
        <div
          key={click.id}
          className="cursor-click-ripple"
          style={{
            position: 'fixed',
            left: click.x - 20,
            top: click.y - 20,
            width: 40,
            height: 40,
            pointerEvents: 'none',
            zIndex: 9998,
          }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              border: `2px solid ${color}`,
              animation: 'cursor-ripple-expand 0.6s ease-out forwards',
            }}
          />
        </div>
      ))}
    </>
  )
})
