import { describe, expect, it } from 'vitest'
import { generateOperationsBrief } from './operations-generator'
import type { ProcessedSession, LLMContext } from '@/types/processing'

const processedSessionFixture: ProcessedSession = {
  sessionId: 'session-1',
  duration: 120000,
  steps: [
    {
      stepNumber: 1,
      timeRange: { start: 0, end: 60000 },
      screenshotPath: 'frame-1.webp',
      transcript: 'Open the portal, wait for the page, and click the report menu.',
      annotations: {
        clicks: [
          {
            id: 'click-1',
            number: 1,
            position: { x: 100, y: 200 },
            color: '#ff0000',
            timestamp: 1000,
            fadeState: 'visible',
          },
        ],
        drawings: [],
        selectedElements: [],
        keyboardInputs: [],
      },
      windowTitle: 'Portal',
      applicationName: 'chrome.exe',
      events: [],
      variables: [],
      conditionals: [],
    },
  ],
  fullTranscript: 'The operator opens the portal and manually clicks through the report flow.',
  allAnnotations: {
    clicks: [
      {
        id: 'click-1',
        number: 1,
        position: { x: 100, y: 200 },
        color: '#ff0000',
        timestamp: 1000,
        fadeState: 'visible',
      },
    ],
    drawings: [],
    selectedElements: [],
    keyboardInputs: [],
  },
  timeline: [],
  allVariables: [],
  allConditionals: [],
  startTime: 0,
  endTime: 120000,
}

const llmContextFixture: LLMContext = {
  taskDescription: 'Open the portal and navigate to the report area.',
  steps: [
    {
      number: 1,
      description: 'Open portal and click report menu',
      notes: [],
      timeRange: { start: 0, end: 60000 },
      actions: { clicks: 6, textInputs: 0, annotations: 0 },
      applicationName: 'chrome.exe',
      windowTitle: 'Portal',
    },
  ],
  fullNarration: 'Open the portal and navigate to the report area.',
  variables: [],
  conditionals: [],
  summary: {
    totalClicks: 6,
    totalTextInputs: 0,
    totalPageLoads: 2,
    totalAnnotations: 0,
    durationSeconds: 120,
  },
  references: {
    screenshotArchive: 'session-1',
    sessionDataPath: 'session-1',
  },
}

describe('operations-generator', () => {
  it('builds a fallback operations brief when no LLM key is configured', async () => {
    const brief = await generateOperationsBrief(processedSessionFixture, llmContextFixture)

    expect(brief.workflowGoal).toContain('portal')
    expect(brief.problemFraming).toContain('agent-ready')
    expect(brief.observedApplications).toContain('chrome.exe')
    expect(brief.researchQuestions.length).toBeGreaterThan(0)
    expect(brief.automationOpportunities.length).toBeGreaterThan(0)
    expect(brief.humanInLoopPoints.length).toBeGreaterThan(0)
    expect(brief.candidateIssues.length).toBeGreaterThan(0)
    expect(brief.automationOpportunities[0]?.agentFeasibility).toBeTruthy()
    expect(brief.markdown).toContain('# Operations Brief')
    expect(brief.markdown).toContain('## Human In The Loop')
  })
})
