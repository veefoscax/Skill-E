/**
 * Status Indicator Component
 *
 * Displays a minimal, non-intrusive status indicator in the overlay.
 * Shows a tiny red dot in the top-right corner when recording is active.
 *
 * Features:
 * - Minimal design (8px red dot)
 * - Subtle pulsing animation
 * - Non-intrusive positioning
 * - Optional (can be hidden via settings)
 * - Changes color based on recording state:
 *   - Red: Recording active
 *   - Yellow/Orange: Paused
 *   - Hidden: Not recording
 *
 * Requirements: FR-4.26
 */

import { memo } from 'react'

export type RecordingStatus = 'recording' | 'paused' | 'stopped'

interface StatusIndicatorProps {
  status: RecordingStatus
  visible?: boolean
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
}

/**
 * Memoized StatusIndicator component
 * Only re-renders when status or visibility changes
 */
export const StatusIndicator = memo(function StatusIndicator({
  status,
  visible = true,
  position = 'top-right',
}: StatusIndicatorProps) {
  // Don't render if not visible or stopped
  if (!visible || status === 'stopped') {
    return null
  }

  // Determine color based on status
  const color = status === 'recording' ? '#EF4444' : '#FB923C' // Red or Orange
  const label = status === 'recording' ? 'Recording' : 'Paused'

  // Position styles
  const positionStyles = {
    'top-right': { top: '16px', right: '16px' },
    'top-left': { top: '16px', left: '16px' },
    'bottom-right': { bottom: '16px', right: '16px' },
    'bottom-left': { bottom: '16px', left: '16px' },
  }

  return (
    <div
      className="status-indicator-container"
      style={{
        position: 'absolute',
        ...positionStyles[position],
        pointerEvents: 'none',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}
      role="status"
      aria-label={label}
    >
      {/* Tiny pulsing dot */}
      <div
        className={`status-dot ${status === 'recording' ? 'recording' : 'paused'}`}
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: color,
          boxShadow: `0 0 8px ${color}80, 0 0 4px ${color}`,
          willChange: 'transform, opacity',
        }}
      />

      {/* Inline styles for animations */}
      <style>{`
        @keyframes status-pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.6;
            transform: scale(1.2);
          }
        }

        @keyframes status-fade-in {
          0% {
            opacity: 0;
            transform: scale(0.5);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        .status-dot {
          animation: status-fade-in 200ms cubic-bezier(0.4, 0, 0.2, 1),
                     status-pulse 2s ease-in-out infinite;
        }

        .status-dot.recording {
          animation-duration: 200ms, 2s;
        }

        .status-dot.paused {
          animation-duration: 200ms, 3s;
        }

        @media (prefers-reduced-motion: reduce) {
          .status-dot {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  )
})
