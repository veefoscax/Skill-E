/**
 * StepBubble Component
 *
 * Displays individual capture steps with icons and labels in the live timeline.
 * Features slide-in animation and auto-fade behavior.
 *
 * Requirements: FR-4.29, FR-4.30
 */

import React from 'react'
import { CaptureStep } from '@/stores/recording'

/**
 * Props for StepBubble component
 */
interface StepBubbleProps {
  /** The capture step to display */
  step: CaptureStep
  /** Whether this step should be faded (older than 5 seconds) */
  isFaded?: boolean
  /** Whether the timeline is being hovered (restore full opacity) */
  isTimelineHovered?: boolean
  /** Callback when step is clicked */
  onClick?: (step: CaptureStep) => void
}

/**
 * Get icon emoji for step type
 * Requirements: FR-4.29
 */
function getStepIcon(type: CaptureStep['type']): string {
  const icons: Record<CaptureStep['type'], string> = {
    screenshot: '📷',
    click: '🖱️',
    keystroke: '⌨️',
    network: '🌐',
  }
  return icons[type] || '📝'
}

/**
 * Get color class for step type
 */
function getStepColorClass(type: CaptureStep['type']): string {
  const colors: Record<CaptureStep['type'], string> = {
    screenshot: 'bg-blue-500/10 border-blue-500/30 text-blue-600',
    click: 'bg-purple-500/10 border-purple-500/30 text-purple-600',
    keystroke: 'bg-green-500/10 border-green-500/30 text-green-600',
    network: 'bg-orange-500/10 border-orange-500/30 text-orange-600',
  }
  return colors[type] || 'bg-gray-500/10 border-gray-500/30 text-gray-600'
}

/**
 * Format timestamp for display (relative time)
 */
function formatTimestamp(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  const seconds = Math.floor(diff / 1000)

  if (seconds < 1) return 'just now'
  if (seconds < 60) return `${seconds}s ago`

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`

  const hours = Math.floor(minutes / 60)
  return `${hours}h ago`
}

/**
 * StepBubble Component
 *
 * Displays a single capture step with:
 * - Icon representing step type
 * - Label describing the action
 * - Slide-in animation on mount
 * - Auto-fade after 5 seconds
 * - Restore opacity on timeline hover
 *
 * Requirements: FR-4.29, FR-4.30, FR-4.31, FR-4.32
 */
export function StepBubble({
  step,
  isFaded = false,
  isTimelineHovered = false,
  onClick,
}: StepBubbleProps) {
  const icon = getStepIcon(step.type)
  const colorClass = getStepColorClass(step.type)
  const timestamp = formatTimestamp(step.timestamp)

  // Determine opacity based on fade state and hover
  const opacityClass = isFaded && !isTimelineHovered ? 'opacity-50' : 'opacity-100'

  return (
    <div
      className={`
        step-bubble
        ${colorClass}
        ${opacityClass}
        flex items-center gap-2 px-3 py-2 rounded-lg border
        cursor-pointer hover:scale-105
        transition-all duration-300 ease-out
        shadow-sm hover:shadow-md
        backdrop-blur-sm
        animate-slide-in-right
      `}
      onClick={() => onClick?.(step)}
      title={`${step.label} - ${timestamp}`}
    >
      {/* Icon */}
      <span className="text-lg leading-none" role="img" aria-label={step.type}>
        {icon}
      </span>

      {/* Label */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{step.label}</p>
        {step.note && <p className="text-xs opacity-70 truncate">{step.note}</p>}
      </div>

      {/* Timestamp (optional, shown on hover) */}
      <span className="text-xs opacity-0 group-hover:opacity-70 transition-opacity">
        {timestamp}
      </span>
    </div>
  )
}

/**
 * Extended StepBubble with additional details
 * Used when step is expanded/selected
 */
interface StepBubbleExpandedProps extends StepBubbleProps {
  /** Whether to show expanded details */
  isExpanded?: boolean
  /** Callback when delete is clicked */
  onDelete?: (stepId: string) => void
  /** Callback when note is edited */
  onEditNote?: (stepId: string, note: string) => void
}

export function StepBubbleExpanded({
  step,
  isFaded,
  isTimelineHovered,
  isExpanded = false,
  onClick,
  onDelete,
  onEditNote,
}: StepBubbleExpandedProps) {
  const [isEditing, setIsEditing] = React.useState(false)
  const [noteText, setNoteText] = React.useState(step.note || '')

  const handleSaveNote = () => {
    if (onEditNote && noteText !== step.note) {
      onEditNote(step.id, noteText)
    }
    setIsEditing(false)
  }

  if (!isExpanded) {
    return (
      <StepBubble
        step={step}
        isFaded={isFaded}
        isTimelineHovered={isTimelineHovered}
        onClick={onClick}
      />
    )
  }

  const icon = getStepIcon(step.type)
  const colorClass = getStepColorClass(step.type)
  const opacityClass = isFaded && !isTimelineHovered ? 'opacity-50' : 'opacity-100'

  return (
    <div
      className={`
        step-bubble-expanded
        ${colorClass}
        ${opacityClass}
        flex flex-col gap-2 p-3 rounded-lg border
        transition-all duration-300 ease-out
        shadow-md
        backdrop-blur-sm
      `}
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="text-lg leading-none" role="img" aria-label={step.type}>
          {icon}
        </span>
        <p className="text-sm font-medium flex-1">{step.label}</p>
        <button
          onClick={() => onClick?.(step)}
          className="text-xs opacity-50 hover:opacity-100"
          title="Collapse"
        >
          ✕
        </button>
      </div>

      {/* Details */}
      <div className="text-xs space-y-1 pl-7">
        <p className="opacity-70">{new Date(step.timestamp).toLocaleTimeString()}</p>

        {step.data && (
          <div className="space-y-1">
            {step.data.selector && (
              <p className="font-mono text-xs">Selector: {step.data.selector}</p>
            )}
            {step.data.position && (
              <p>
                Position: ({step.data.position.x}, {step.data.position.y})
              </p>
            )}
            {step.data.text && <p>Text: "{step.data.text}"</p>}
            {step.data.method && step.data.url && (
              <p className="font-mono text-xs">
                {step.data.method} {step.data.url}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Note editing */}
      <div className="pl-7">
        {isEditing ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              placeholder="Add note..."
              className="flex-1 px-2 py-1 text-xs rounded border bg-white/50"
              autoFocus
              onKeyDown={e => {
                if (e.key === 'Enter') handleSaveNote()
                if (e.key === 'Escape') setIsEditing(false)
              }}
            />
            <button
              onClick={handleSaveNote}
              className="px-2 py-1 text-xs rounded bg-blue-500 text-white hover:bg-blue-600"
            >
              Save
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="text-xs opacity-50 hover:opacity-100"
          >
            {step.note ? `Note: ${step.note}` : '+ Add note'}
          </button>
        )}
      </div>

      {/* Actions */}
      {onDelete && (
        <div className="pl-7 pt-1 border-t border-current/10">
          <button
            onClick={() => {
              if (confirm('Delete this step?')) {
                onDelete(step.id)
              }
            }}
            className="text-xs text-red-500 hover:text-red-600"
          >
            Delete step
          </button>
        </div>
      )}
    </div>
  )
}
