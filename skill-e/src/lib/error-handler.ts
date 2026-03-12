/**
 * Error Handler - Enhanced Error Detection and Categorization
 *
 * Provides error categorization, clear error messages, and recovery suggestions
 * for skill execution failures.
 *
 * Requirements: FR-10.2
 */

import type { SkillStep } from './skill-parser'
import type { HybridExecutionResult } from './hybrid-executor'

/**
 * Error category types
 */
export type ErrorCategory =
  | 'timeout' // Step execution timed out
  | 'not_found' // Element or target not found
  | 'network' // Network or connection error
  | 'permission' // Permission denied
  | 'validation' // Validation or verification failed
  | 'bot_detection' // Anti-bot measures detected
  | 'unexpected' // Unexpected or unknown error
  | 'user_cancelled' // User cancelled the action

/**
 * Error severity levels
 */
export type ErrorSeverity =
  | 'low' // Minor issue, can likely continue
  | 'medium' // Significant issue, may need intervention
  | 'high' // Critical issue, should pause
  | 'critical' // Fatal issue, must stop

/**
 * Recovery suggestion
 */
export interface RecoverySuggestion {
  /** Suggestion text */
  text: string

  /** Action type */
  action: 'retry' | 'skip' | 'edit' | 'manual' | 'abort'

  /** Priority (higher = more recommended) */
  priority: number

  /** Additional details */
  details?: string
}

/**
 * Categorized error information
 */
export interface CategorizedError {
  /** Original error message */
  originalError: string

  /** Error category */
  category: ErrorCategory

  /** Error severity */
  severity: ErrorSeverity

  /** Enhanced error message */
  message: string

  /** Technical details */
  technicalDetails: string

  /** User-friendly explanation */
  userMessage: string

  /** Recovery suggestions */
  suggestions: RecoverySuggestion[]

  /** Whether execution should pause */
  shouldPause: boolean

  /** Whether step can be retried */
  canRetry: boolean
}

/**
 * Categorize and enhance error information
 *
 * @param step - The step that failed
 * @param result - The execution result
 * @param error - The error (if thrown)
 * @returns Categorized error information
 */
export function categorizeError(
  step: SkillStep,
  result?: HybridExecutionResult,
  error?: Error | string
): CategorizedError {
  const errorMessage = error
    ? error instanceof Error
      ? error.message
      : String(error)
    : result?.error || 'Unknown error'

  // Detect error category
  const category = detectErrorCategory(errorMessage, step)

  // Determine severity
  const severity = determineErrorSeverity(category, step)

  // Generate enhanced message
  const message = generateErrorMessage(category, errorMessage, step)

  // Generate user-friendly message
  const userMessage = generateUserMessage(category, step)

  // Generate recovery suggestions
  const suggestions = generateRecoverySuggestions(category, step, result)

  // Determine if should pause
  const shouldPause = severity === 'high' || severity === 'critical'

  // Determine if can retry
  const canRetry = category !== 'user_cancelled' && category !== 'permission'

  return {
    originalError: errorMessage,
    category,
    severity,
    message,
    technicalDetails: errorMessage,
    userMessage,
    suggestions,
    shouldPause,
    canRetry,
  }
}

/**
 * Detect error category from error message
 */
function detectErrorCategory(errorMessage: string, step: SkillStep): ErrorCategory {
  const lowerError = errorMessage.toLowerCase()

  // Timeout errors
  if (lowerError.includes('timeout') || lowerError.includes('timed out')) {
    return 'timeout'
  }

  // Validation errors (check before not found since "not found" can be in validation messages)
  if (
    lowerError.includes('validation') ||
    lowerError.includes('invalid') ||
    lowerError.includes('verification failed')
  ) {
    return 'validation'
  }

  // Not found errors
  if (
    lowerError.includes('not found') ||
    lowerError.includes('could not find') ||
    lowerError.includes('element not found') ||
    lowerError.includes('selector not found') ||
    lowerError.includes('no match')
  ) {
    return 'not_found'
  }

  // Network errors
  if (
    lowerError.includes('network') ||
    lowerError.includes('connection') ||
    lowerError.includes('fetch failed') ||
    lowerError.includes('request failed')
  ) {
    return 'network'
  }

  // Permission errors
  if (
    lowerError.includes('permission') ||
    lowerError.includes('access denied') ||
    lowerError.includes('forbidden') ||
    lowerError.includes('unauthorized')
  ) {
    return 'permission'
  }

  // Validation errors
  if (
    lowerError.includes('validation') ||
    lowerError.includes('invalid') ||
    lowerError.includes('verification failed')
  ) {
    return 'validation'
  }

  // Bot detection
  if (
    lowerError.includes('bot') ||
    lowerError.includes('captcha') ||
    lowerError.includes('cloudflare') ||
    lowerError.includes('challenge')
  ) {
    return 'bot_detection'
  }

  // User cancelled
  if (
    lowerError.includes('cancelled') ||
    lowerError.includes('canceled') ||
    lowerError.includes('aborted')
  ) {
    return 'user_cancelled'
  }

  // Default to unexpected
  return 'unexpected'
}

/**
 * Determine error severity
 */
function determineErrorSeverity(category: ErrorCategory, step: SkillStep): ErrorSeverity {
  // Critical errors
  if (category === 'permission' || category === 'bot_detection') {
    return 'critical'
  }

  // High severity errors
  if (category === 'network' || category === 'validation') {
    return 'high'
  }

  // Medium severity errors
  if (category === 'timeout' || category === 'not_found') {
    return 'medium'
  }

  // Low severity errors
  if (category === 'user_cancelled') {
    return 'low'
  }

  // Check if step is destructive (higher severity)
  const isDestructive = ['delete', 'remove', 'clear'].some(keyword =>
    step.instruction.toLowerCase().includes(keyword)
  )

  if (isDestructive) {
    return 'high'
  }

  // Default to medium
  return 'medium'
}

/**
 * Generate enhanced error message
 */
function generateErrorMessage(
  category: ErrorCategory,
  originalError: string,
  step: SkillStep
): string {
  const stepInfo = `Step ${step.index + 1} (${step.actionType})`

  switch (category) {
    case 'timeout':
      return `${stepInfo}: Execution timed out. The step took too long to complete. ${originalError}`

    case 'not_found':
      return `${stepInfo}: Target not found. Could not locate the element or target specified in the step. ${originalError}`

    case 'network':
      return `${stepInfo}: Network error. Failed to connect or communicate with the target. ${originalError}`

    case 'permission':
      return `${stepInfo}: Permission denied. The action requires permissions that are not available. ${originalError}`

    case 'validation':
      return `${stepInfo}: Validation failed. The step did not produce the expected result. ${originalError}`

    case 'bot_detection':
      return `${stepInfo}: Anti-bot measures detected. The target website is blocking automated access. ${originalError}`

    case 'user_cancelled':
      return `${stepInfo}: User cancelled. The action was cancelled by the user. ${originalError}`

    case 'unexpected':
    default:
      return `${stepInfo}: Unexpected error. ${originalError}`
  }
}

/**
 * Generate user-friendly message
 */
function generateUserMessage(category: ErrorCategory, step: SkillStep): string {
  switch (category) {
    case 'timeout':
      return `The step "${step.instruction}" took too long to complete. The target might be slow to respond or the timeout might be too short.`

    case 'not_found':
      return `Could not find the target for "${step.instruction}". The element might have moved, changed, or not be visible yet.`

    case 'network':
      return `Network connection failed while executing "${step.instruction}". Check your internet connection and try again.`

    case 'permission':
      return `Permission denied for "${step.instruction}". The action requires additional permissions or access rights.`

    case 'validation':
      return `The step "${step.instruction}" did not produce the expected result. The action might have failed or the verification criteria might be incorrect.`

    case 'bot_detection':
      return `The website detected automated access while executing "${step.instruction}". You may need to complete a CAPTCHA or use image-based automation.`

    case 'user_cancelled':
      return `You cancelled the action "${step.instruction}".`

    case 'unexpected':
    default:
      return `An unexpected error occurred while executing "${step.instruction}". Please review the error details and try again.`
  }
}

/**
 * Generate recovery suggestions
 */
function generateRecoverySuggestions(
  category: ErrorCategory,
  step: SkillStep,
  result?: HybridExecutionResult
): RecoverySuggestion[] {
  const suggestions: RecoverySuggestion[] = []

  switch (category) {
    case 'timeout':
      suggestions.push({
        text: 'Retry with longer timeout',
        action: 'retry',
        priority: 3,
        details: 'Increase the step timeout and try again',
      })
      suggestions.push({
        text: 'Wait and retry',
        action: 'retry',
        priority: 2,
        details: 'Wait a moment for the page to load, then retry',
      })
      suggestions.push({
        text: 'Skip this step',
        action: 'skip',
        priority: 1,
        details: 'Skip this step and continue with the next one',
      })
      break

    case 'not_found':
      suggestions.push({
        text: 'Update selector',
        action: 'edit',
        priority: 3,
        details: 'Edit the step to use a different selector or target',
      })
      suggestions.push({
        text: 'Wait and retry',
        action: 'retry',
        priority: 2,
        details: 'Wait for the element to appear, then retry',
      })
      suggestions.push({
        text: 'Use image-based automation',
        action: 'edit',
        priority: 2,
        details: 'Switch to image-based automation instead of DOM selectors',
      })
      suggestions.push({
        text: 'Complete manually',
        action: 'manual',
        priority: 1,
        details: 'Complete this step manually and continue',
      })
      break

    case 'network':
      suggestions.push({
        text: 'Check connection and retry',
        action: 'retry',
        priority: 3,
        details: 'Verify your internet connection and try again',
      })
      suggestions.push({
        text: 'Wait and retry',
        action: 'retry',
        priority: 2,
        details: 'Wait for network to stabilize, then retry',
      })
      suggestions.push({
        text: 'Abort execution',
        action: 'abort',
        priority: 1,
        details: 'Stop execution and fix network issues',
      })
      break

    case 'permission':
      suggestions.push({
        text: 'Grant permissions',
        action: 'manual',
        priority: 3,
        details: 'Grant the required permissions and retry',
      })
      suggestions.push({
        text: 'Complete manually',
        action: 'manual',
        priority: 2,
        details: 'Complete this step manually with proper permissions',
      })
      suggestions.push({
        text: 'Skip this step',
        action: 'skip',
        priority: 1,
        details: "Skip this step if it's not critical",
      })
      break

    case 'validation':
      suggestions.push({
        text: 'Review and edit step',
        action: 'edit',
        priority: 3,
        details: 'Review the step instruction and verification criteria',
      })
      suggestions.push({
        text: 'Retry the step',
        action: 'retry',
        priority: 2,
        details: 'Try executing the step again',
      })
      suggestions.push({
        text: 'Complete manually',
        action: 'manual',
        priority: 1,
        details: 'Complete this step manually and verify the result',
      })
      break

    case 'bot_detection':
      suggestions.push({
        text: 'Switch to image-based automation',
        action: 'edit',
        priority: 3,
        details: 'Use image-based automation to bypass bot detection',
      })
      suggestions.push({
        text: 'Complete CAPTCHA manually',
        action: 'manual',
        priority: 2,
        details: 'Complete the CAPTCHA or challenge manually, then retry',
      })
      suggestions.push({
        text: 'Abort execution',
        action: 'abort',
        priority: 1,
        details: 'Stop execution - this site may not support automation',
      })
      break

    case 'user_cancelled':
      suggestions.push({
        text: 'Resume execution',
        action: 'retry',
        priority: 2,
        details: 'Continue with the execution',
      })
      suggestions.push({
        text: 'Abort execution',
        action: 'abort',
        priority: 1,
        details: 'Stop the execution completely',
      })
      break

    case 'unexpected':
    default:
      suggestions.push({
        text: 'Retry the step',
        action: 'retry',
        priority: 2,
        details: 'Try executing the step again',
      })
      suggestions.push({
        text: 'Edit the step',
        action: 'edit',
        priority: 2,
        details: 'Review and modify the step instruction',
      })
      suggestions.push({
        text: 'Skip this step',
        action: 'skip',
        priority: 1,
        details: 'Skip this step and continue',
      })
      break
  }

  // Sort by priority (highest first)
  suggestions.sort((a, b) => b.priority - a.priority)

  return suggestions
}

/**
 * Format error for display
 *
 * @param categorizedError - Categorized error information
 * @returns Formatted error string
 */
export function formatErrorForDisplay(categorizedError: CategorizedError): string {
  const lines: string[] = []

  lines.push(`❌ ${categorizedError.message}`)
  lines.push('')
  lines.push(`📋 ${categorizedError.userMessage}`)

  if (categorizedError.suggestions.length > 0) {
    lines.push('')
    lines.push('💡 Suggestions:')
    categorizedError.suggestions.forEach((suggestion, index) => {
      lines.push(`  ${index + 1}. ${suggestion.text}`)
      if (suggestion.details) {
        lines.push(`     ${suggestion.details}`)
      }
    })
  }

  return lines.join('\n')
}

/**
 * Get error icon based on severity
 */
export function getErrorIcon(severity: ErrorSeverity): string {
  switch (severity) {
    case 'critical':
      return '🔴'
    case 'high':
      return '🟠'
    case 'medium':
      return '🟡'
    case 'low':
      return '🟢'
    default:
      return '⚠️'
  }
}

/**
 * Get error color based on severity
 */
export function getErrorColor(severity: ErrorSeverity): string {
  switch (severity) {
    case 'critical':
      return '#dc2626' // red-600
    case 'high':
      return '#ea580c' // orange-600
    case 'medium':
      return '#ca8a04' // yellow-600
    case 'low':
      return '#16a34a' // green-600
    default:
      return '#6b7280' // gray-500
  }
}
