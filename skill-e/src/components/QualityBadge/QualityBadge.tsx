/**
 * Quality Badge Component
 *
 * Displays semantic validation score with a "Verified" shield for high-scoring skills.
 * Shows dimension breakdown (Safety, Clarity, Completeness) on hover.
 *
 * Requirements: FR-10.14
 */

import { Shield, ShieldCheck, Info } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { SemanticValidationResult } from '@/lib/semantic-judge'
import { getScoreLabel } from '@/lib/semantic-judge'

/**
 * Props for QualityBadge component
 */
export interface QualityBadgeProps {
  /** Semantic validation result */
  result: SemanticValidationResult

  /** Size variant */
  size?: 'sm' | 'md' | 'lg'

  /** Show detailed breakdown inline (not just in tooltip) */
  showDetails?: boolean

  /** Optional className for styling */
  className?: string
}

/**
 * Get color classes based on score
 */
function getScoreColorClasses(score: number): {
  bg: string
  text: string
  border: string
  icon: string
} {
  if (score >= 90) {
    return {
      bg: 'bg-green-500/10',
      text: 'text-green-600 dark:text-green-400',
      border: 'border-green-500/30',
      icon: 'text-green-600 dark:text-green-400',
    }
  }
  if (score >= 70) {
    return {
      bg: 'bg-yellow-500/10',
      text: 'text-yellow-600 dark:text-yellow-400',
      border: 'border-yellow-500/30',
      icon: 'text-yellow-600 dark:text-yellow-400',
    }
  }
  if (score >= 50) {
    return {
      bg: 'bg-orange-500/10',
      text: 'text-orange-600 dark:text-orange-400',
      border: 'border-orange-500/30',
      icon: 'text-orange-600 dark:text-orange-400',
    }
  }
  return {
    bg: 'bg-red-500/10',
    text: 'text-red-600 dark:text-red-400',
    border: 'border-red-500/30',
    icon: 'text-red-600 dark:text-red-400',
  }
}

/**
 * Get dimension color classes
 */
function getDimensionColorClasses(score: number): string {
  if (score >= 90) return 'text-green-600 dark:text-green-400'
  if (score >= 70) return 'text-yellow-600 dark:text-yellow-400'
  if (score >= 50) return 'text-orange-600 dark:text-orange-400'
  return 'text-red-600 dark:text-red-400'
}

/**
 * Dimension score bar component
 */
function DimensionBar({ label, score }: { label: string; score: number }) {
  const colorClass = getDimensionColorClasses(score)

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium">{label}</span>
        <span className={cn('font-semibold', colorClass)}>{score}/100</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={cn('h-full transition-all duration-500', colorClass.replace('text-', 'bg-'))}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  )
}

/**
 * Quality Badge Component
 *
 * Displays the semantic validation score with visual indicators.
 * Shows "Verified" shield for scores >= 90.
 */
export function QualityBadge({
  result,
  size = 'md',
  showDetails = false,
  className,
}: QualityBadgeProps) {
  const colors = getScoreColorClasses(result.score)
  const label = getScoreLabel(result.score)

  // Size classes
  const sizeClasses = {
    sm: {
      container: 'text-xs',
      icon: 'h-3.5 w-3.5',
      badge: 'text-xs px-2 py-0.5',
      score: 'text-sm',
    },
    md: {
      container: 'text-sm',
      icon: 'h-4 w-4',
      badge: 'text-sm px-2.5 py-1',
      score: 'text-base',
    },
    lg: {
      container: 'text-base',
      icon: 'h-5 w-5',
      badge: 'text-base px-3 py-1.5',
      score: 'text-lg',
    },
  }

  const sizes = sizeClasses[size]

  return (
    <TooltipProvider>
      <div className={cn('inline-flex items-center gap-3', className)}>
        {/* Main Score Display */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                'inline-flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors cursor-help',
                colors.bg,
                colors.border,
                sizes.container
              )}
            >
              {result.isVerified ? (
                <ShieldCheck className={cn(sizes.icon, colors.icon)} />
              ) : (
                <Shield className={cn(sizes.icon, colors.icon)} />
              )}

              <div className="flex items-baseline gap-1.5">
                <span className={cn('font-bold', colors.text, sizes.score)}>{result.score}</span>
                <span className="text-muted-foreground text-xs">/100</span>
              </div>

              <Info className={cn('h-3 w-3 text-muted-foreground', sizes.icon)} />
            </div>
          </TooltipTrigger>

          <TooltipContent side="bottom" className="max-w-xs p-4">
            <div className="space-y-3">
              {/* Overall Score */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">Quality Score</span>
                  <span className={cn('text-sm font-bold', colors.text)}>{result.score}/100</span>
                </div>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>

              {/* Verified Badge */}
              {result.isVerified && (
                <div className="flex items-center gap-2 p-2 rounded-md bg-green-500/10 border border-green-500/30">
                  <ShieldCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span className="text-xs font-medium text-green-600 dark:text-green-400">
                    Production Ready
                  </span>
                </div>
              )}

              {/* Dimension Breakdown */}
              <div className="space-y-2 pt-2 border-t">
                <p className="text-xs font-semibold text-muted-foreground">Dimensions</p>
                <DimensionBar label="Safety" score={result.dimensions.safety} />
                <DimensionBar label="Clarity" score={result.dimensions.clarity} />
                <DimensionBar label="Completeness" score={result.dimensions.completeness} />
              </div>

              {/* Quick Stats */}
              <div className="pt-2 border-t space-y-1">
                {result.strengths.length > 0 && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground">Strengths:</span>
                    <span className="font-medium">{result.strengths.length}</span>
                  </div>
                )}
                {result.weaknesses.length > 0 && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground">Weaknesses:</span>
                    <span className="font-medium">{result.weaknesses.length}</span>
                  </div>
                )}
                {result.recommendations.length > 0 && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground">Recommendations:</span>
                    <span className="font-medium">{result.recommendations.length}</span>
                  </div>
                )}
              </div>
            </div>
          </TooltipContent>
        </Tooltip>

        {/* Verified Badge (if applicable) */}
        {result.isVerified && (
          <Badge
            variant="outline"
            className={cn(
              'border-green-500/30 bg-green-500/10 text-green-600 dark:text-green-400',
              sizes.badge
            )}
          >
            <ShieldCheck className={cn('mr-1', sizes.icon)} />
            Verified
          </Badge>
        )}

        {/* Status Label */}
        <Badge variant="outline" className={cn(colors.border, colors.bg, colors.text, sizes.badge)}>
          {label}
        </Badge>
      </div>

      {/* Detailed Breakdown (if showDetails is true) */}
      {showDetails && (
        <div className="mt-4 space-y-4 p-4 rounded-lg border bg-card">
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Dimension Breakdown</h4>
            <DimensionBar label="Safety" score={result.dimensions.safety} />
            <DimensionBar label="Clarity" score={result.dimensions.clarity} />
            <DimensionBar label="Completeness" score={result.dimensions.completeness} />
          </div>

          {/* Strengths */}
          {result.strengths.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-green-600 dark:text-green-400">
                Strengths
              </h4>
              <ul className="space-y-1 text-sm">
                {result.strengths.map((strength, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                    <span className="text-muted-foreground">{strength}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Weaknesses */}
          {result.weaknesses.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-yellow-600 dark:text-yellow-400">
                Weaknesses
              </h4>
              <ul className="space-y-1 text-sm">
                {result.weaknesses.map((weakness, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-yellow-600 dark:text-yellow-400 mt-0.5">⚠</span>
                    <span className="text-muted-foreground">{weakness}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations */}
          {result.recommendations.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Recommendations</h4>
              <ol className="space-y-1 text-sm list-decimal list-inside">
                {result.recommendations.map((rec, i) => (
                  <li key={i} className="text-muted-foreground">
                    {rec}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}
    </TooltipProvider>
  )
}
