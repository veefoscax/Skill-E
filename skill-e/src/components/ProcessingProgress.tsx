/**
 * Processing Progress Component
 *
 * Displays processing progress with percentage, current step label,
 * and estimated time remaining.
 *
 * Requirements: FR-5.5, NFR-5.2
 */

import * as React from 'react'
import { Progress } from '@/components/ui/progress'
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ProcessingProgress as ProcessingProgressType } from '@/types/processing'

export interface ProcessingProgressProps {
  /** Processing progress state */
  progress: ProcessingProgressType
  /** Optional className for styling */
  className?: string
}

/**
 * Format seconds into human-readable time
 */
function formatTime(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`
  }
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.round(seconds % 60)
  return `${minutes}m ${remainingSeconds}s`
}

/**
 * Get stage display name
 */
function getStageLabel(stage: ProcessingProgressType['stage']): string {
  switch (stage) {
    case 'loading':
      return 'Loading Session'
    case 'timeline':
      return 'Building Timeline'
    case 'step_detection':
      return 'Detecting Steps'
    case 'classification':
      return 'Classifying Speech'
    case 'context_generation':
      return 'Generating Context'
    case 'complete':
      return 'Complete'
    case 'error':
      return 'Error'
    default:
      return 'Processing'
  }
}

/**
 * ProcessingProgress Component
 *
 * Shows a clean, minimal progress indicator with:
 * - Progress bar with percentage
 * - Current step label
 * - Estimated time remaining
 * - Status icon (loading, complete, or error)
 */
export function ProcessingProgress({ progress, className }: ProcessingProgressProps) {
  const { stage, percentage, currentStep, estimatedTimeRemaining, error } = progress

  // Determine status icon
  const StatusIcon = React.useMemo(() => {
    if (stage === 'complete') {
      return CheckCircle2
    }
    if (stage === 'error') {
      return AlertCircle
    }
    return Loader2
  }, [stage])

  // Determine status color
  const statusColor = React.useMemo(() => {
    if (stage === 'complete') {
      return 'text-green-500'
    }
    if (stage === 'error') {
      return 'text-destructive'
    }
    return 'text-primary'
  }, [stage])

  return (
    <div className={cn('w-full space-y-4 rounded-lg border bg-card p-6 shadow-sm', className)}>
      {/* Header with icon and stage */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <StatusIcon
            className={cn(
              'h-5 w-5',
              statusColor,
              stage !== 'complete' && stage !== 'error' && 'animate-spin'
            )}
          />
          <div>
            <h3 className="text-sm font-semibold text-foreground">{getStageLabel(stage)}</h3>
            <p className="text-xs text-muted-foreground">{currentStep}</p>
          </div>
        </div>

        {/* Percentage */}
        <div className="text-right">
          <div className="text-2xl font-bold text-foreground">{Math.round(percentage)}%</div>
          {estimatedTimeRemaining !== undefined && estimatedTimeRemaining > 0 && (
            <div className="text-xs text-muted-foreground">
              ~{formatTime(estimatedTimeRemaining)} remaining
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <Progress value={percentage} className="h-2" />

      {/* Error Message */}
      {stage === 'error' && error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {stage === 'complete' && (
        <div className="rounded-md border border-green-500/50 bg-green-500/10 p-3">
          <p className="text-sm text-green-600 dark:text-green-400">
            Processing completed successfully
          </p>
        </div>
      )}
    </div>
  )
}
