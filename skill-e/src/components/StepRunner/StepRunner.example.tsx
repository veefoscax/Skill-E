/**
 * StepRunner Component Examples
 *
 * Demonstrates different states and configurations of the StepRunner component.
 */

import { StepRunner } from './StepRunner'
import type { SkillStep } from '@/lib/skill-parser'
import type { ExecutionScreenshot } from '@/lib/skill-executor'

/**
 * Example: Pending Step
 */
export function PendingStepExample() {
  const step: SkillStep = {
    id: 'step-1',
    index: 0,
    stepNumber: 1,
    instruction: 'Navigate to the login page',
    actionType: 'navigate',
    status: 'pending',
    requiresConfirmation: false,
    target: {
      text: 'https://example.com/login',
    },
  }

  return (
    <div className="p-8 bg-background">
      <h2 className="text-2xl font-bold mb-4">Pending Step</h2>
      <StepRunner step={step} />
    </div>
  )
}

/**
 * Example: Running Step
 */
export function RunningStepExample() {
  const step: SkillStep = {
    id: 'step-2',
    index: 1,
    stepNumber: 2,
    instruction: 'Click the login button',
    actionType: 'click',
    status: 'running',
    requiresConfirmation: false,
    target: {
      selector: '#login-btn',
      description: 'Login button',
    },
  }

  return (
    <div className="p-8 bg-background">
      <h2 className="text-2xl font-bold mb-4">Running Step</h2>
      <StepRunner step={step} isExecuting={true} />
    </div>
  )
}

/**
 * Example: Successful Step
 */
export function SuccessStepExample() {
  const step: SkillStep = {
    id: 'step-3',
    index: 2,
    stepNumber: 3,
    instruction: 'Enter email address',
    actionType: 'type',
    status: 'success',
    requiresConfirmation: false,
    target: {
      selector: 'input[type="email"]',
      text: '{email}',
      description: 'Email input field',
    },
  }

  const screenshots: ExecutionScreenshot[] = [
    {
      id: 'screenshot-1',
      stepId: 'step-3',
      timing: 'before',
      data: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2YwZjBmMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM2NjYiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkJlZm9yZSBTY3JlZW5zaG90PC90ZXh0Pjwvc3ZnPg==',
      timestamp: Date.now() - 2000,
      description: 'Before entering email',
    },
    {
      id: 'screenshot-2',
      stepId: 'step-3',
      timing: 'after',
      data: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2UwZjBlMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM2NjYiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkFmdGVyIFNjcmVlbnNob3Q8L3RleHQ+PC9zdmc+',
      timestamp: Date.now() - 1000,
      description: 'After entering email',
    },
  ]

  return (
    <div className="p-8 bg-background">
      <h2 className="text-2xl font-bold mb-4">Successful Step with Screenshots</h2>
      <StepRunner step={step} screenshots={screenshots} />
    </div>
  )
}

/**
 * Example: Failed Step with Error
 */
export function FailedStepExample() {
  const step: SkillStep = {
    id: 'step-4',
    index: 3,
    stepNumber: 4,
    instruction: 'Click the submit button',
    actionType: 'click',
    status: 'failed',
    requiresConfirmation: false,
    error:
      'Element not found: #submit-btn. The selector may be incorrect or the element may not be visible.',
    target: {
      selector: '#submit-btn',
      description: 'Submit button',
    },
  }

  const screenshots: ExecutionScreenshot[] = [
    {
      id: 'screenshot-3',
      stepId: 'step-4',
      timing: 'error',
      data: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2ZmZTBlMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiNjMDAiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkVycm9yIFNjcmVlbnNob3Q8L3RleHQ+PC9zdmc+',
      timestamp: Date.now(),
      description: 'Error state - element not found',
    },
  ]

  const handleRetry = () => {
    console.log('Retry clicked')
  }

  const handleSkip = () => {
    console.log('Skip clicked')
  }

  const handleEdit = () => {
    console.log('Edit clicked')
  }

  return (
    <div className="p-8 bg-background">
      <h2 className="text-2xl font-bold mb-4">Failed Step with Actions</h2>
      <StepRunner
        step={step}
        screenshots={screenshots}
        onRetry={handleRetry}
        onSkip={handleSkip}
        onEdit={handleEdit}
      />
    </div>
  )
}

/**
 * Example: Skipped Step
 */
export function SkippedStepExample() {
  const step: SkillStep = {
    id: 'step-5',
    index: 4,
    stepNumber: 5,
    instruction: 'Wait for page to load',
    actionType: 'wait',
    status: 'skipped',
    requiresConfirmation: false,
    feedback: 'User skipped this step as page was already loaded',
  }

  return (
    <div className="p-8 bg-background">
      <h2 className="text-2xl font-bold mb-4">Skipped Step with Feedback</h2>
      <StepRunner step={step} />
    </div>
  )
}

/**
 * Example: Step Requiring Confirmation
 */
export function ConfirmationStepExample() {
  const step: SkillStep = {
    id: 'step-6',
    index: 5,
    stepNumber: 6,
    instruction: 'Delete all user data',
    actionType: 'click',
    status: 'pending',
    requiresConfirmation: true,
    target: {
      selector: '#delete-all-btn',
      description: 'Delete all button',
    },
  }

  return (
    <div className="p-8 bg-background">
      <h2 className="text-2xl font-bold mb-4">Step Requiring Confirmation</h2>
      <StepRunner step={step} />
    </div>
  )
}

/**
 * Example: Step with Coordinates
 */
export function CoordinatesStepExample() {
  const step: SkillStep = {
    id: 'step-7',
    index: 6,
    stepNumber: 7,
    instruction: 'Click at specific coordinates (image-based automation)',
    actionType: 'click',
    status: 'success',
    requiresConfirmation: false,
    target: {
      coordinates: { x: 450, y: 320 },
      description: 'Button at center of screen',
    },
  }

  return (
    <div className="p-8 bg-background">
      <h2 className="text-2xl font-bold mb-4">Step with Coordinates</h2>
      <StepRunner step={step} />
    </div>
  )
}

/**
 * Example: Step with Section
 */
export function SectionStepExample() {
  const step: SkillStep = {
    id: 'step-8',
    index: 7,
    stepNumber: 8,
    section: 'Authentication',
    instruction: 'Enter password',
    actionType: 'type',
    status: 'running',
    requiresConfirmation: false,
    target: {
      selector: 'input[type="password"]',
      text: '{password}',
      description: 'Password input field',
    },
  }

  return (
    <div className="p-8 bg-background">
      <h2 className="text-2xl font-bold mb-4">Step with Section</h2>
      <StepRunner step={step} isExecuting={true} />
    </div>
  )
}

/**
 * Example: Step without Screenshots
 */
export function NoScreenshotsExample() {
  const step: SkillStep = {
    id: 'step-9',
    index: 8,
    stepNumber: 9,
    instruction: 'Verify page title',
    actionType: 'verify',
    status: 'success',
    requiresConfirmation: false,
  }

  return (
    <div className="p-8 bg-background">
      <h2 className="text-2xl font-bold mb-4">Step without Screenshots</h2>
      <StepRunner step={step} showScreenshots={false} />
    </div>
  )
}

/**
 * Example: Step without Actions
 */
export function NoActionsExample() {
  const step: SkillStep = {
    id: 'step-10',
    index: 9,
    stepNumber: 10,
    instruction: 'Review the results',
    actionType: 'verify',
    status: 'failed',
    requiresConfirmation: false,
    error: 'Results do not match expected values',
  }

  return (
    <div className="p-8 bg-background">
      <h2 className="text-2xl font-bold mb-4">Step without Action Buttons</h2>
      <StepRunner step={step} showActions={false} />
    </div>
  )
}

/**
 * Example: All Examples in Grid
 */
export function AllExamples() {
  return (
    <div className="p-8 bg-background space-y-8">
      <h1 className="text-3xl font-bold mb-8">StepRunner Component Examples</h1>

      <div className="grid grid-cols-1 gap-8">
        <PendingStepExample />
        <RunningStepExample />
        <SuccessStepExample />
        <FailedStepExample />
        <SkippedStepExample />
        <ConfirmationStepExample />
        <CoordinatesStepExample />
        <SectionStepExample />
        <NoScreenshotsExample />
        <NoActionsExample />
      </div>
    </div>
  )
}

export default AllExamples
