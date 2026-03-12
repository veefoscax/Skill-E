/**
 * StepEditor Component - Usage Example
 *
 * Demonstrates how to use the StepEditor component for inline step editing.
 */

import * as React from 'react'
import { StepEditor } from './StepEditor'
import type { SkillStep } from '@/lib/skill-parser'
import { parseSkill } from '@/lib/skill-parser'

/**
 * Example: Basic step editing
 */
export function BasicStepEditingExample() {
  const [step, setStep] = React.useState<SkillStep>({
    id: 'step-1-1',
    index: 0,
    instruction: 'Click the Submit button',
    actionType: 'click',
    target: {
      selector: '#submit-btn',
      description: 'Submit button',
    },
    requiresConfirmation: false,
    status: 'pending',
    stepNumber: 1,
  })

  const handleSave = (updatedStep: SkillStep) => {
    console.log('Step saved:', updatedStep)
    setStep(updatedStep)
    alert('Step saved successfully!')
  }

  const handleCancel = () => {
    console.log('Edit cancelled')
  }

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">Basic Step Editing</h2>
      <StepEditor step={step} onSave={handleSave} onCancel={handleCancel} />
    </div>
  )
}

/**
 * Example: Step editing with re-run
 */
export function StepEditingWithRerunExample() {
  const [step, setStep] = React.useState<SkillStep>({
    id: 'step-1-1',
    index: 0,
    instruction: 'Click the Login button',
    actionType: 'click',
    target: {
      selector: '#login-btn',
      coordinates: { x: 100, y: 200 },
      description: 'Login button',
    },
    requiresConfirmation: false,
    status: 'failed',
    error: 'Element not found',
    stepNumber: 1,
  })

  const handleSave = (updatedStep: SkillStep) => {
    console.log('Step saved:', updatedStep)
    setStep(updatedStep)
  }

  const handleRerun = (stepToRun: SkillStep) => {
    console.log('Re-running step:', stepToRun)
    alert(`Re-running step: ${stepToRun.instruction}`)

    // Simulate execution
    setTimeout(() => {
      setStep({
        ...stepToRun,
        status: 'success',
        error: undefined,
      })
    }, 1000)
  }

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">Step Editing with Re-run</h2>
      <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded">
        <p className="text-sm text-destructive">
          <strong>Error:</strong> {step.error}
        </p>
      </div>
      <StepEditor step={step} onSave={handleSave} onRerun={handleRerun} showRerun={true} />
    </div>
  )
}

/**
 * Example: Editing a type action step
 */
export function TypeActionEditingExample() {
  const [step, setStep] = React.useState<SkillStep>({
    id: 'step-2-1',
    index: 1,
    instruction: 'Enter email address in the Email field',
    actionType: 'type',
    target: {
      selector: '#email-input',
      text: '{email}',
      description: 'Email input field',
    },
    requiresConfirmation: false,
    status: 'pending',
    stepNumber: 2,
  })

  const handleSave = (updatedStep: SkillStep) => {
    console.log('Type action step saved:', updatedStep)
    setStep(updatedStep)
  }

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">Type Action Editing</h2>
      <StepEditor step={step} onSave={handleSave} />
    </div>
  )
}

/**
 * Example: Read-only step viewer
 */
export function ReadOnlyStepViewerExample() {
  const step: SkillStep = {
    id: 'step-3-1',
    index: 2,
    instruction: 'Verify success message is displayed',
    actionType: 'verify',
    target: {
      selector: '.success-message',
      description: 'Success message',
    },
    requiresConfirmation: false,
    status: 'success',
    stepNumber: 3,
  }

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">Read-only Step Viewer</h2>
      <StepEditor step={step} readOnly={true} />
    </div>
  )
}

/**
 * Example: Full skill validation workflow
 */
export function SkillValidationWorkflowExample() {
  const sampleSkillMarkdown = `---
name: login-user
description: Log in to the application
---

## Instructions

### Step 1: Navigate to Login

1. Click the "Login" button in the header

### Step 2: Enter Credentials

1. Enter {email} in the Email field
2. Enter {password} in the Password field

### Step 3: Submit

1. Click the "Sign In" button
2. Verify dashboard is displayed`

  const [parsedSkill] = React.useState(() => parseSkill(sampleSkillMarkdown))
  const [steps, setSteps] = React.useState<SkillStep[]>(parsedSkill.steps)
  const [editingStepId, setEditingStepId] = React.useState<string | null>(null)

  const handleEditStep = (stepId: string) => {
    setEditingStepId(stepId)
  }

  const handleSaveStep = (updatedStep: SkillStep) => {
    setSteps(prevSteps => prevSteps.map(s => (s.id === updatedStep.id ? updatedStep : s)))
    setEditingStepId(null)
  }

  const handleCancelEdit = () => {
    setEditingStepId(null)
  }

  const handleRerunStep = (step: SkillStep) => {
    console.log('Re-running step:', step)

    // Simulate execution
    setSteps(prevSteps =>
      prevSteps.map(s => (s.id === step.id ? { ...s, status: 'running' as const } : s))
    )

    setTimeout(() => {
      setSteps(prevSteps =>
        prevSteps.map(s =>
          s.id === step.id ? { ...s, status: 'success' as const, error: undefined } : s
        )
      )
    }, 1500)
  }

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-semibold">Skill Validation Workflow</h2>

      <div className="space-y-4">
        {steps.map(step => (
          <div key={step.id} className="border rounded-lg p-4">
            {editingStepId === step.id ? (
              <StepEditor
                step={step}
                onSave={handleSaveStep}
                onCancel={handleCancelEdit}
                onRerun={handleRerunStep}
                showRerun={true}
              />
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      Step {step.stepNumber || step.index + 1}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        step.status === 'success'
                          ? 'bg-green-100 text-green-700'
                          : step.status === 'failed'
                            ? 'bg-red-100 text-red-700'
                            : step.status === 'running'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {step.status}
                    </span>
                  </div>
                  <button
                    onClick={() => handleEditStep(step.id)}
                    className="text-sm text-primary hover:underline"
                  >
                    Edit
                  </button>
                </div>

                <p className="text-sm">{step.instruction}</p>

                {step.target && (
                  <div className="text-xs text-muted-foreground space-y-1">
                    {step.target.selector && (
                      <div>
                        Selector: <code>{step.target.selector}</code>
                      </div>
                    )}
                    {step.target.coordinates && (
                      <div>
                        Coordinates: ({step.target.coordinates.x}, {step.target.coordinates.y})
                      </div>
                    )}
                    {step.target.description && <div>Description: {step.target.description}</div>}
                  </div>
                )}

                {step.error && <div className="text-sm text-destructive">Error: {step.error}</div>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Example: All examples in one demo
 */
export function StepEditorDemo() {
  const [activeExample, setActiveExample] = React.useState<string>('basic')

  const examples = {
    basic: <BasicStepEditingExample />,
    rerun: <StepEditingWithRerunExample />,
    type: <TypeActionEditingExample />,
    readonly: <ReadOnlyStepViewerExample />,
    workflow: <SkillValidationWorkflowExample />,
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">StepEditor Component Demo</h1>
          <p className="text-muted-foreground">
            Interactive examples of the StepEditor component for inline step editing.
          </p>
        </div>

        <div className="flex gap-2 flex-wrap">
          {Object.keys(examples).map(key => (
            <button
              key={key}
              onClick={() => setActiveExample(key)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeExample === key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              {key.charAt(0).toUpperCase() + key.slice(1)}
            </button>
          ))}
        </div>

        <div className="border rounded-lg bg-card">
          {examples[activeExample as keyof typeof examples]}
        </div>
      </div>
    </div>
  )
}
