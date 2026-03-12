/**
 * Tests for LLM Context Builder
 *
 * Requirements: FR-5.4, FR-5.11 through FR-5.22
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { generateLLMContext } from './processing'
import type { ProcessedSession, ProcessedStep } from '../types/processing'

describe('LLM Context Builder', () => {
  let mockProcessedSession: ProcessedSession

  beforeEach(() => {
    // Create mock processed session
    const mockSteps: ProcessedStep[] = [
      {
        stepNumber: 1,
        timeRange: { start: 1000, end: 3000 },
        screenshotPath: '/path/to/screenshot1.png',
        transcript: 'First, open the browser and navigate to the website.',
        annotations: {
          clicks: [
            {
              id: 'click1',
              x: 100,
              y: 200,
              timestamp: 1500,
              fadeState: 'visible',
            },
          ],
          drawings: [
            {
              id: 'draw1',
              type: 'arrow',
              color: 'red',
              startPoint: { x: 50, y: 50 },
              endPoint: { x: 100, y: 100 },
              timestamp: 1600,
              isPinned: true,
              fadeState: 'visible',
            },
          ],
          selectedElements: [
            {
              cssSelector: '#login-button',
              tagName: 'BUTTON',
              textContent: 'Login',
              boundingBox: { x: 100, y: 200, width: 80, height: 40 },
              timestamp: 1700,
            },
          ],
          keyboardInputs: [],
        },
        windowTitle: 'Google Chrome',
        applicationName: 'chrome.exe',
        events: [],
        variables: [],
        conditionals: [],
      },
      {
        stepNumber: 2,
        timeRange: { start: 3000, end: 5000 },
        screenshotPath: '/path/to/screenshot2.png',
        transcript: 'Then, enter your email address in the email field.',
        annotations: {
          clicks: [],
          drawings: [],
          selectedElements: [],
          keyboardInputs: [
            {
              modifiers: { shift: false, ctrl: false, alt: false, meta: false },
              currentText: 'user@example.com',
              isPasswordField: false,
              displayPosition: 'bottom-left',
              isVisible: true,
            },
          ],
        },
        windowTitle: 'Login Page',
        applicationName: 'chrome.exe',
        events: [],
        variables: [
          {
            name: 'email',
            description: 'User email address',
            timestamp: 3500,
            transcriptSegment: 'enter your email address',
          },
        ],
        conditionals: [],
      },
      {
        stepNumber: 3,
        timeRange: { start: 5000, end: 7000 },
        screenshotPath: '/path/to/screenshot3.png',
        transcript: 'Finally, click the submit button to log in.',
        annotations: {
          clicks: [
            {
              id: 'click2',
              x: 300,
              y: 400,
              timestamp: 6000,
              fadeState: 'visible',
            },
          ],
          drawings: [],
          selectedElements: [],
          keyboardInputs: [],
        },
        windowTitle: 'Login Page',
        applicationName: 'chrome.exe',
        events: [],
        variables: [],
        conditionals: [],
      },
    ]

    mockProcessedSession = {
      sessionId: 'test-session-123',
      duration: 6000,
      steps: mockSteps,
      fullTranscript:
        'First, open the browser and navigate to the website. Then, enter your email address in the email field. Finally, click the submit button to log in.',
      allAnnotations: {
        clicks: mockSteps.flatMap(s => s.annotations.clicks),
        drawings: mockSteps.flatMap(s => s.annotations.drawings),
        selectedElements: mockSteps.flatMap(s => s.annotations.selectedElements),
        keyboardInputs: mockSteps.flatMap(s => s.annotations.keyboardInputs),
      },
      timeline: [],
      allVariables: [
        {
          name: 'email',
          description: 'User email address',
          timestamp: 3500,
          transcriptSegment: 'enter your email address',
        },
      ],
      allConditionals: [],
      startTime: 1000,
      endTime: 7000,
    }
  })

  it('should generate LLM context with task description', async () => {
    const context = await generateLLMContext(mockProcessedSession)

    expect(context.taskDescription).toBeDefined()
    expect(context.taskDescription).toContain('First')
  })

  it('should include all steps in LLM context', async () => {
    const context = await generateLLMContext(mockProcessedSession)

    expect(context.steps).toHaveLength(3)
    expect(context.steps[0].number).toBe(1)
    expect(context.steps[1].number).toBe(2)
    expect(context.steps[2].number).toBe(3)
  })

  it('should include step descriptions from transcript', async () => {
    const context = await generateLLMContext(mockProcessedSession)

    expect(context.steps[0].description).toContain('open the browser')
    expect(context.steps[1].description).toContain('enter your email')
    expect(context.steps[2].description).toContain('click the submit button')
  })

  it('should include notes from annotations', async () => {
    const context = await generateLLMContext(mockProcessedSession)

    // Step 1 should have notes about drawing and element selection
    expect(context.steps[0].notes.length).toBeGreaterThan(0)
    expect(context.steps[0].notes.some(n => n.includes('Drawing annotation'))).toBe(true)
    expect(context.steps[0].notes.some(n => n.includes('Selected element'))).toBe(true)

    // Step 2 should have notes about keyboard input
    expect(context.steps[1].notes.some(n => n.includes('Keyboard input'))).toBe(true)
  })

  it('should include window context in notes', async () => {
    const context = await generateLLMContext(mockProcessedSession)

    expect(context.steps[0].notes.some(n => n.includes('Window: Google Chrome'))).toBe(true)
    expect(context.steps[0].notes.some(n => n.includes('Application: chrome.exe'))).toBe(true)
  })

  it('should include action counts', async () => {
    const context = await generateLLMContext(mockProcessedSession)

    // Step 1: 1 click, 0 text inputs, 2 annotations (1 drawing + 1 element)
    expect(context.steps[0].actions.clicks).toBe(1)
    expect(context.steps[0].actions.textInputs).toBe(0)
    expect(context.steps[0].actions.annotations).toBe(2)

    // Step 2: 0 clicks, 1 text input, 0 annotations
    expect(context.steps[1].actions.clicks).toBe(0)
    expect(context.steps[1].actions.textInputs).toBe(1)
    expect(context.steps[1].actions.annotations).toBe(0)
  })

  it('should include full narration', async () => {
    const context = await generateLLMContext(mockProcessedSession)

    expect(context.fullNarration).toBe(mockProcessedSession.fullTranscript)
  })

  it('should include detected variables', async () => {
    const context = await generateLLMContext(mockProcessedSession)

    expect(context.variables).toHaveLength(1)
    expect(context.variables[0].name).toBe('email')
  })

  it('should include summary statistics', async () => {
    const context = await generateLLMContext(mockProcessedSession)

    expect(context.summary.totalClicks).toBe(2)
    expect(context.summary.totalTextInputs).toBe(1)
    expect(context.summary.totalAnnotations).toBe(2) // 1 drawing + 1 element
    expect(context.summary.durationSeconds).toBe(6)
  })

  it('should include references', async () => {
    const context = await generateLLMContext(mockProcessedSession)

    expect(context.references.screenshotArchive).toBe('test-session-123')
    expect(context.references.sessionDataPath).toBe('test-session-123')
  })

  it('should limit steps to maxKeyFrames', async () => {
    // Add more steps to test limiting
    const manySteps: ProcessedStep[] = Array.from({ length: 15 }, (_, i) => ({
      stepNumber: i + 1,
      timeRange: { start: i * 1000, end: (i + 1) * 1000 },
      screenshotPath: `/path/to/screenshot${i + 1}.png`,
      transcript: `Step ${i + 1} description`,
      annotations: {
        clicks: [],
        drawings: [],
        selectedElements: [],
        keyboardInputs: [],
      },
      events: [],
      variables: [],
      conditionals: [],
    }))

    const sessionWithManySteps: ProcessedSession = {
      ...mockProcessedSession,
      steps: manySteps,
    }

    const context = await generateLLMContext(sessionWithManySteps, 10)

    // Should limit to 10 steps
    expect(context.steps.length).toBeLessThanOrEqual(10)
  })

  it('should prioritize steps with annotations', async () => {
    // Create steps with varying importance
    const steps: ProcessedStep[] = [
      {
        stepNumber: 1,
        timeRange: { start: 0, end: 1000 },
        screenshotPath: '/path/to/screenshot1.png',
        transcript: 'Low importance step',
        annotations: {
          clicks: [],
          drawings: [],
          selectedElements: [],
          keyboardInputs: [],
        },
        events: [],
        variables: [],
        conditionals: [],
      },
      {
        stepNumber: 2,
        timeRange: { start: 1000, end: 2000 },
        screenshotPath: '/path/to/screenshot2.png',
        transcript: 'High importance step with annotations',
        annotations: {
          clicks: [],
          drawings: [
            {
              id: 'draw1',
              type: 'arrow',
              color: 'red',
              startPoint: { x: 0, y: 0 },
              timestamp: 1500,
              isPinned: true,
              fadeState: 'visible',
            },
          ],
          selectedElements: [
            {
              cssSelector: '#important',
              tagName: 'DIV',
              textContent: 'Important',
              boundingBox: { x: 0, y: 0, width: 100, height: 100 },
              timestamp: 1600,
            },
          ],
          keyboardInputs: [],
        },
        events: [],
        variables: [],
        conditionals: [],
      },
    ]

    const sessionWithPriority: ProcessedSession = {
      ...mockProcessedSession,
      steps,
    }

    const context = await generateLLMContext(sessionWithPriority, 1)

    // Should select the step with annotations (step 2)
    expect(context.steps.length).toBe(1)
    expect(context.steps[0].number).toBe(2)
  })

  it('should handle empty transcript gracefully', async () => {
    const sessionWithoutTranscript: ProcessedSession = {
      ...mockProcessedSession,
      fullTranscript: '',
    }

    const context = await generateLLMContext(sessionWithoutTranscript)

    expect(context.taskDescription).toBe('Demonstration recording')
  })

  it('should handle steps without screenshots', async () => {
    const stepsWithoutScreenshots: ProcessedStep[] = [
      {
        stepNumber: 1,
        timeRange: { start: 0, end: 1000 },
        screenshotPath: '',
        transcript: 'Step without screenshot',
        annotations: {
          clicks: [],
          drawings: [],
          selectedElements: [],
          keyboardInputs: [],
        },
        events: [],
        variables: [],
        conditionals: [],
      },
    ]

    const sessionWithoutScreenshots: ProcessedSession = {
      ...mockProcessedSession,
      steps: stepsWithoutScreenshots,
    }

    const context = await generateLLMContext(sessionWithoutScreenshots)

    expect(context.steps[0].screenshot).toBeUndefined()
  })
})
