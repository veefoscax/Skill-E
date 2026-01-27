/**
 * Click Indicator Component
 * 
 * Displays a numbered circle at click positions with ripple animation.
 * Features:
 * - Numbered display (1, 2, 3...)
 * - 3-color rotation (Red → Blue → Green)
 * - Smooth ripple animation on appearance
 * - Fade-out after 3 seconds (unless pinned)
 * - Optimized for 60fps performance
 * - Non-intrusive design with subtle shadows
 * 
 * Requirements: FR-4.1, FR-4.2, FR-4.3, NFR-4.2, NFR-4.3
 */

import { useEffect, useState, useRef, memo } from 'react';
import { ClickIndicator as ClickIndicatorType, COLORS } from '../../lib/overlay/click-tracker';

interface ClickIndicatorProps {
  click: ClickIndicatorType;
  isPinned?: boolean;
  onFadeComplete?: (clickId: string) => void;
}

/**
 * Memoized ClickIndicator component for performance optimization
 * Only re-renders when click data or pin state changes
 */
export const ClickIndicator = memo(function ClickIndicator({ 
  click, 
  isPinned = false, 
  onFadeComplete 
}: ClickIndicatorProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isFading, setIsFading] = useState(false);
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const removeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Don't fade if pinned
    if (isPinned) {
      return;
    }

    // Start fading after 2.5 seconds (fade animation takes 0.5s)
    fadeTimerRef.current = setTimeout(() => {
      setIsFading(true);
    }, 2500);

    // Remove from DOM after 3 seconds total
    removeTimerRef.current = setTimeout(() => {
      setIsVisible(false);
      onFadeComplete?.(click.id);
    }, 3000);

    return () => {
      if (fadeTimerRef.current) {
        clearTimeout(fadeTimerRef.current);
      }
      if (removeTimerRef.current) {
        clearTimeout(removeTimerRef.current);
      }
    };
  }, [click.id, isPinned, onFadeComplete]);

  if (!isVisible) {
    return null;
  }

  const color = COLORS[click.color];

  return (
    <div
      className="click-indicator-container"
      style={{
        position: 'absolute',
        left: click.position.x,
        top: click.position.y,
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
        zIndex: 100,
        willChange: 'transform',
        backfaceVisibility: 'hidden',
        perspective: '1000px',
      }}
    >
      {/* Main numbered circle - smaller and more subtle */}
      <div
        className={`click-indicator ${isFading ? 'fading' : ''}`}
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          backgroundColor: color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `0 2px 6px ${color}30, 0 0 0 1px ${color}40, inset 0 1px 1px rgba(255, 255, 255, 0.25)`,
          position: 'relative',
          zIndex: 2,
          willChange: isFading ? 'opacity, transform' : 'auto',
        }}
      >
        <span
          className="click-number"
          style={{
            color: 'white',
            fontSize: '14px',
            fontWeight: '700',
            fontFamily: 'Nunito Sans, system-ui, sans-serif',
            userSelect: 'none',
            textShadow: '0 1px 2px rgba(0, 0, 0, 0.25)',
            lineHeight: '1',
          }}
        >
          {click.number}
        </span>
      </div>

      {/* Ripple animation - subtle and smooth */}
      <div
        className="click-ripple"
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          border: `2px solid ${color}`,
          zIndex: 1,
          willChange: 'transform, opacity',
        }}
      />

      {/* Inline styles for smooth animations */}
      <style>{`
        @keyframes click-ripple {
          0% {
            transform: translate(-50%, -50%) scale(0);
            opacity: 0.8;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.5);
            opacity: 0.4;
          }
          100% {
            transform: translate(-50%, -50%) scale(2.2);
            opacity: 0;
          }
        }

        @keyframes click-fade-out {
          0% {
            opacity: 1;
            transform: scale(1);
          }
          100% {
            opacity: 0;
            transform: scale(0.88);
          }
        }

        @keyframes click-pop-in {
          0% {
            opacity: 0;
            transform: scale(0.6);
          }
          60% {
            transform: scale(1.08);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        .click-ripple {
          animation: click-ripple 550ms cubic-bezier(0.4, 0, 0.2, 1);
        }

        .click-indicator.fading {
          animation: click-fade-out 450ms cubic-bezier(0.4, 0, 1, 1) forwards;
        }

        .click-indicator-container {
          animation: click-pop-in 180ms cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @media (prefers-reduced-motion: reduce) {
          .click-ripple,
          .click-indicator.fading,
          .click-indicator-container {
            animation-duration: 0.01ms !important;
          }
        }
      `}</style>
    </div>
  );
});
