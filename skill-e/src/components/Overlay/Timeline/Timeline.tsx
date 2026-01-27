/**
 * Timeline Component
 * 
 * Container for displaying multiple StepBubble components in a vertical timeline.
 * Positioned on the right edge of the overlay with scrolling support.
 * 
 * Features:
 * - Right-edge positioning (vertical strip)
 * - Collapsed by default (shows step count badge)
 * - Expands on hover or click
 * - Scrollable container for many steps
 * - Auto-fade older steps (>5 seconds)
 * - Restore opacity on hover
 * 
 * Requirements: FR-4.39, FR-4.42
 */

import { useState, useEffect, useRef } from 'react';
import { StepBubble, StepBubbleExpanded } from './StepBubble';
import { useRecordingStore, CaptureStep } from '@/stores/recording';

/**
 * Props for Timeline component
 */
interface TimelineProps {
  /** Whether the timeline is visible (recording active) */
  isVisible?: boolean;
  /** Callback when a step is clicked */
  onStepClick?: (step: CaptureStep) => void;
  /** Callback when a step is deleted */
  onStepDelete?: (stepId: string) => void;
  /** Callback when a step note is edited */
  onStepEditNote?: (stepId: string, note: string) => void;
}

/**
 * Determine if a step should be faded (older than 5 seconds)
 * Requirements: FR-4.31
 */
function shouldFadeStep(step: CaptureStep): boolean {
  const now = Date.now();
  const age = now - step.timestamp;
  const FADE_THRESHOLD = 5000; // 5 seconds
  return age > FADE_THRESHOLD;
}

/**
 * Timeline Component
 * 
 * Displays capture steps as they happen in a vertical timeline on the right edge.
 * 
 * Behavior:
 * - Collapsed by default: Shows only step count badge
 * - Expands on hover or click: Shows all steps
 * - Auto-scrolls to newest step
 * - Older steps (>5s) fade to 50% opacity
 * - Hovering timeline restores all steps to full opacity
 * 
 * Requirements: FR-4.29, FR-4.30, FR-4.31, FR-4.32, FR-4.33, FR-4.34, FR-4.39, FR-4.42
 */
export function Timeline({
  isVisible = true,
  onStepClick,
  onStepDelete,
  onStepEditNote,
}: TimelineProps) {
  const steps = useRecordingStore((state) => state.steps);
  const updateStepNote = useRecordingStore((state) => state.updateStepNote);
  const deleteStep = useRecordingStore((state) => state.deleteStep);
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [expandedStepId, setExpandedStepId] = useState<string | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to newest step when a new step is added
  useEffect(() => {
    if (scrollContainerRef.current && steps.length > 0) {
      // Scroll to bottom (newest step)
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [steps.length]);

  // Handle step click
  const handleStepClick = (step: CaptureStep) => {
    if (expandedStepId === step.id) {
      // Collapse if already expanded
      setExpandedStepId(null);
    } else {
      // Expand this step
      setExpandedStepId(step.id);
    }
    onStepClick?.(step);
  };

  // Handle step delete
  const handleStepDelete = (stepId: string) => {
    deleteStep(stepId);
    if (expandedStepId === stepId) {
      setExpandedStepId(null);
    }
    onStepDelete?.(stepId);
  };

  // Handle step note edit
  const handleStepEditNote = (stepId: string, note: string) => {
    updateStepNote(stepId, note);
    onStepEditNote?.(stepId, note);
  };

  // Toggle expanded state
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  // Don't render if not visible
  if (!isVisible) {
    return null;
  }

  const stepCount = steps.length;
  const hasSteps = stepCount > 0;

  return (
    <div
      ref={timelineRef}
      className={`
        timeline-container
        fixed right-0 top-0 h-full
        flex flex-col items-end
        pointer-events-none
        z-50
        transition-all duration-300 ease-out
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Timeline Content */}
      <div
        className={`
          timeline-content
          h-full flex flex-col
          pointer-events-auto
          transition-all duration-300 ease-out
          ${isExpanded ? 'w-80' : 'w-16'}
        `}
      >
        {/* Header - Step Count Badge */}
        <div
          className={`
            timeline-header
            flex items-center justify-center
            p-4
            cursor-pointer
            transition-all duration-300
            ${isExpanded ? 'justify-between px-4' : 'justify-center'}
          `}
          onClick={toggleExpanded}
          title={isExpanded ? 'Collapse timeline' : 'Expand timeline'}
        >
          {/* Step Counter Badge */}
          <div
            className={`
              step-counter-badge
              flex items-center justify-center
              rounded-full
              bg-blue-500 text-white
              font-semibold
              shadow-lg
              transition-all duration-300
              ${isExpanded ? 'w-10 h-10 text-sm' : 'w-12 h-12 text-base'}
              hover:scale-110
            `}
          >
            {stepCount}
          </div>

          {/* Expanded Header Text */}
          {isExpanded && (
            <div className="flex-1 ml-3">
              <p className="text-sm font-medium text-gray-700">
                Timeline
              </p>
              <p className="text-xs text-gray-500">
                {stepCount} {stepCount === 1 ? 'step' : 'steps'}
              </p>
            </div>
          )}

          {/* Collapse/Expand Icon */}
          {isExpanded && (
            <button
              className="text-gray-400 hover:text-gray-600 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                toggleExpanded();
              }}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Steps Container - Scrollable */}
        {isExpanded && hasSteps && (
          <div
            ref={scrollContainerRef}
            className={`
              timeline-steps
              flex-1 overflow-y-auto overflow-x-hidden
              px-3 pb-4
              space-y-2
              scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent
            `}
            style={{
              maxHeight: 'calc(100vh - 120px)',
            }}
          >
            {steps.map((step) => {
              const isFaded = shouldFadeStep(step);
              const isExpanded = expandedStepId === step.id;

              return (
                <div key={step.id} className="timeline-step-wrapper">
                  {isExpanded ? (
                    <StepBubbleExpanded
                      step={step}
                      isFaded={isFaded}
                      isTimelineHovered={isHovered}
                      isExpanded={true}
                      onClick={handleStepClick}
                      onDelete={handleStepDelete}
                      onEditNote={handleStepEditNote}
                    />
                  ) : (
                    <StepBubble
                      step={step}
                      isFaded={isFaded}
                      isTimelineHovered={isHovered}
                      onClick={handleStepClick}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {isExpanded && !hasSteps && (
          <div className="flex-1 flex items-center justify-center px-4 pb-8">
            <div className="text-center text-gray-400">
              <p className="text-sm">No steps yet</p>
              <p className="text-xs mt-1">
                Steps will appear as you interact
              </p>
            </div>
          </div>
        )}

        {/* Collapsed State - Show Recent Steps Preview */}
        {!isExpanded && hasSteps && (
          <div className="flex flex-col items-center gap-2 px-2 pb-4">
            {/* Show last 3 steps as small dots */}
            {steps.slice(-3).map((step) => (
              <div
                key={step.id}
                className={`
                  w-3 h-3 rounded-full
                  transition-all duration-300
                  ${shouldFadeStep(step) && !isHovered ? 'opacity-50' : 'opacity-100'}
                  ${step.type === 'screenshot' ? 'bg-blue-500' : ''}
                  ${step.type === 'click' ? 'bg-purple-500' : ''}
                  ${step.type === 'keystroke' ? 'bg-green-500' : ''}
                  ${step.type === 'network' ? 'bg-orange-500' : ''}
                `}
                title={step.label}
              />
            ))}
          </div>
        )}
      </div>

      {/* Expand on Hover Hint (when collapsed) */}
      {!isExpanded && hasSteps && isHovered && (
        <div
          className="
            absolute right-20 top-20
            bg-gray-900 text-white text-xs
            px-3 py-2 rounded-lg
            shadow-lg
            pointer-events-none
            animate-fade-in
          "
        >
          Click to expand timeline
        </div>
      )}
    </div>
  );
}

/**
 * Compact Timeline Badge
 * 
 * Minimal version that only shows the step count badge.
 * Used when full timeline is not needed.
 */
export function TimelineBadge() {
  const stepCount = useRecordingStore((state) => state.steps.length);

  if (stepCount === 0) {
    return null;
  }

  return (
    <div
      className="
        timeline-badge
        fixed right-4 top-4
        flex items-center justify-center
        w-12 h-12
        rounded-full
        bg-blue-500 text-white
        font-semibold text-base
        shadow-lg
        pointer-events-none
        z-50
      "
    >
      {stepCount}
    </div>
  );
}
