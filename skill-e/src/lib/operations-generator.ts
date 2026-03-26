import { LLM_DEFAULTS } from './models-config.providers'
import { generateTextCompletion } from './llm-text'
import { useSettingsStore } from '../stores/settings'
import type { ProcessingProgress, ProcessedSession, LLMContext } from '../types/processing'
import type {
  OperationsBrief,
  CandidateIssue,
  AutomationOpportunity,
  HumanInLoopPoint,
  AutomationFeasibility,
} from '../types/operations'
import { createProgress } from './processing'

interface GenerateOperationsOptions {
  onProgress?: (progress: ProcessingProgress) => void
  provider?: string
  apiKey?: string
  model?: string
  baseUrl?: string
  workingDir?: string
}

interface OperationsPayload {
  workflow_goal: string
  problem_framing: string
  session_summary: string
  observed_applications: string[]
  pain_points: string[]
  repetitive_tasks: string[]
  suggested_automations: string[]
  research_questions: string[]
  automation_opportunities: Array<{
    title: string
    current_pain: string
    proposed_automation: string
    agent_feasibility: string
    human_input_required: string
    research_needed: string[]
    success_criteria: string[]
  }>
  human_in_loop_points: Array<{
    step: string
    why_human_matters: string
    required_input: string
    risk_if_automated_blindly: string
  }>
  candidate_issues: Array<{
    title: string
    problem: string
    impact: string
    proposed_change: string
    priority: string
    evidence: string[]
    acceptance_criteria: string[]
    tags: string[]
  }>
  next_actions: string[]
}

export async function generateOperationsBrief(
  processedSession: ProcessedSession,
  context: LLMContext,
  options?: GenerateOperationsOptions
): Promise<OperationsBrief> {
  const {
    onProgress,
    provider: optProvider,
    apiKey: optApiKey,
    model: optModel,
    baseUrl: optBaseUrl,
    workingDir,
  } = options || {}

  onProgress?.(createProgress('context_generation', 92, 'Generating operations brief...'))

  const settings = useSettingsStore.getState()
  const provider = optProvider || settings.llmProvider
  const model = optModel || settings.llmModel
  const apiKey = optApiKey !== undefined ? optApiKey : settings.llmApiKey
  const baseUrl = optBaseUrl || settings.llmBaseUrl || LLM_DEFAULTS[provider]?.baseUrl
  const customHeaders = LLM_DEFAULTS[provider]?.headers || {}

  if (!apiKey && provider !== 'ollama' && provider !== 'codex') {
    return buildFallbackOperationsBrief(processedSession, context)
  }

  try {
    const rawResponse = await generateTextCompletion({
      prompt: buildOperationsPrompt(processedSession, context),
      model,
      apiKey,
      provider,
      baseUrl,
      customHeaders,
      maxTokens: 2500,
      temperature: 0.2,
      workingDir,
      outputSchema: buildOperationsBriefSchema(),
    })

    const parsed = parseOperationsPayload(rawResponse)
    const brief = normalizeOperationsPayload(parsed, rawResponse)
    return brief
  } catch (error) {
    console.warn('Operations brief generation failed, using fallback:', error)
    return buildFallbackOperationsBrief(processedSession, context)
  }
}

function buildOperationsPrompt(processedSession: ProcessedSession, context: LLMContext): string {
  const apps = [
    ...new Set(
      processedSession.steps
        .map(step => step.applicationName)
        .filter((value): value is string => Boolean(value))
    ),
  ]
  const steps = processedSession.steps
    .slice(0, 12)
    .map(
      step =>
        `${step.stepNumber}. ${step.transcript || step.windowTitle || 'No narration'} | app=${step.applicationName || 'unknown'} | clicks=${step.annotations.clicks.length} | window=${step.windowTitle || 'unknown'}`
    )
    .join('\n')

  const painSignals = processedSession.steps
    .filter(step => step.transcript)
    .slice(0, 10)
    .map(step => `- ${step.transcript}`)
    .join('\n')

  return `You are an operational companion for a small business workday.
Your job is to watch a captured work segment, understand what happened, identify the biggest pains,
and turn that into a useful work diary that helps the team decide what to automate, improve, or keep human-led.

Analyze the captured session and return ONLY valid JSON with this exact shape:
{
  "workflow_goal": "string",
  "problem_framing": "string",
  "session_summary": "string",
  "observed_applications": ["string"],
  "pain_points": ["string"],
  "repetitive_tasks": ["string"],
  "suggested_automations": ["string"],
  "research_questions": ["string"],
  "automation_opportunities": [
    {
      "title": "string",
      "current_pain": "string",
      "proposed_automation": "string",
      "agent_feasibility": "agent-ready|human-in-the-loop|manual-only",
      "human_input_required": "string",
      "research_needed": ["string"],
      "success_criteria": ["string"]
    }
  ],
  "human_in_loop_points": [
    {
      "step": "string",
      "why_human_matters": "string",
      "required_input": "string",
      "risk_if_automated_blindly": "string"
    }
  ],
  "candidate_issues": [
    {
      "title": "string",
      "problem": "string",
      "impact": "string",
      "proposed_change": "string",
      "priority": "P1|P2|P3",
      "evidence": ["string"],
      "acceptance_criteria": ["string"],
      "tags": ["string"]
    }
  ],
  "next_actions": ["string"]
}

Rules:
- Treat this as a work diary, not just a transcript review.
- Focus on pain, friction, repetition, context switching, waiting, confusion, and automation opportunities.
- Explain what looked like the biggest operational problem in this slice of the day and why it matters.
- Prefer language that helps a team decide what to fix next, not generic summaries.
- Distinguish clearly between what an agent could do autonomously, what requires human-in-the-loop approval or data entry, and what should remain manual.
- When you identify a problem, propose what must be researched next to automate it well.
- Human-in-the-loop points should capture moments where operator judgment, legal responsibility, trust, or quality control matters.
- Candidate issues must be concrete and ready to refine into a tracker.
- Prefer 2 to 5 candidate issues, not more.
- Do not include markdown. Do not wrap in code fences. Output JSON only.

Session context:
- Workflow goal hint: ${context.taskDescription || 'unknown'}
- Duration seconds: ${context.summary.durationSeconds}
- Applications used: ${apps.join(', ') || 'unknown'}
- Total clicks: ${context.summary.totalClicks}
- Total text inputs: ${context.summary.totalTextInputs}
- Total window changes: ${context.summary.totalPageLoads}

Observed steps:
${steps || 'No steps available'}

Transcript highlights:
${painSignals || '- No transcript available'}
`
}

function buildOperationsBriefSchema(): Record<string, unknown> {
  return {
    type: 'object',
    additionalProperties: false,
    required: [
      'workflow_goal',
      'problem_framing',
      'session_summary',
      'observed_applications',
      'pain_points',
      'repetitive_tasks',
      'suggested_automations',
      'research_questions',
      'automation_opportunities',
      'human_in_loop_points',
      'candidate_issues',
      'next_actions',
    ],
    properties: {
      workflow_goal: { type: 'string' },
      problem_framing: { type: 'string' },
      session_summary: { type: 'string' },
      observed_applications: { type: 'array', items: { type: 'string' } },
      pain_points: { type: 'array', items: { type: 'string' } },
      repetitive_tasks: { type: 'array', items: { type: 'string' } },
      suggested_automations: { type: 'array', items: { type: 'string' } },
      research_questions: { type: 'array', items: { type: 'string' } },
      automation_opportunities: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: [
            'title',
            'current_pain',
            'proposed_automation',
            'agent_feasibility',
            'human_input_required',
            'research_needed',
            'success_criteria',
          ],
          properties: {
            title: { type: 'string' },
            current_pain: { type: 'string' },
            proposed_automation: { type: 'string' },
            agent_feasibility: {
              type: 'string',
              enum: ['agent-ready', 'human-in-the-loop', 'manual-only'],
            },
            human_input_required: { type: 'string' },
            research_needed: { type: 'array', items: { type: 'string' } },
            success_criteria: { type: 'array', items: { type: 'string' } },
          },
        },
      },
      human_in_loop_points: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: [
            'step',
            'why_human_matters',
            'required_input',
            'risk_if_automated_blindly',
          ],
          properties: {
            step: { type: 'string' },
            why_human_matters: { type: 'string' },
            required_input: { type: 'string' },
            risk_if_automated_blindly: { type: 'string' },
          },
        },
      },
      candidate_issues: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: [
            'title',
            'problem',
            'impact',
            'proposed_change',
            'priority',
            'evidence',
            'acceptance_criteria',
            'tags',
          ],
          properties: {
            title: { type: 'string' },
            problem: { type: 'string' },
            impact: { type: 'string' },
            proposed_change: { type: 'string' },
            priority: { type: 'string', enum: ['P1', 'P2', 'P3'] },
            evidence: { type: 'array', items: { type: 'string' } },
            acceptance_criteria: { type: 'array', items: { type: 'string' } },
            tags: { type: 'array', items: { type: 'string' } },
          },
        },
      },
      next_actions: { type: 'array', items: { type: 'string' } },
    },
  }
}

function parseOperationsPayload(rawResponse: string): OperationsPayload {
  const fencedMatch = rawResponse.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const jsonText = (fencedMatch?.[1] || rawResponse).trim()
  return JSON.parse(jsonText) as OperationsPayload
}

function normalizeOperationsPayload(
  payload: OperationsPayload,
  rawResponse: string
): OperationsBrief {
  const candidateIssues: CandidateIssue[] = Array.isArray(payload.candidate_issues)
    ? payload.candidate_issues.slice(0, 5).map(issue => ({
        title: cleanText(issue.title),
        problem: cleanText(issue.problem),
        impact: cleanText(issue.impact),
        proposedChange: cleanText(issue.proposed_change),
        priority: normalizePriority(issue.priority),
        evidence: ensureStringArray(issue.evidence, 4),
        acceptanceCriteria: ensureStringArray(issue.acceptance_criteria, 5),
        tags: ensureStringArray(issue.tags, 5),
      }))
    : []

  const automationOpportunities: AutomationOpportunity[] = Array.isArray(
    payload.automation_opportunities
  )
    ? payload.automation_opportunities.slice(0, 6).map(item => ({
        title: cleanText(item.title),
        currentPain: cleanText(item.current_pain),
        proposedAutomation: cleanText(item.proposed_automation),
        agentFeasibility: normalizeFeasibility(item.agent_feasibility),
        humanInputRequired: cleanText(item.human_input_required),
        researchNeeded: ensureStringArray(item.research_needed, 5),
        successCriteria: ensureStringArray(item.success_criteria, 5),
      }))
    : []

  const humanInLoopPoints: HumanInLoopPoint[] = Array.isArray(payload.human_in_loop_points)
    ? payload.human_in_loop_points.slice(0, 6).map(item => ({
        step: cleanText(item.step),
        whyHumanMatters: cleanText(item.why_human_matters),
        requiredInput: cleanText(item.required_input),
        riskIfAutomatedBlindly: cleanText(item.risk_if_automated_blindly),
      }))
    : []

  const brief: OperationsBrief = {
    workflowGoal: cleanText(payload.workflow_goal),
    problemFraming: cleanText(payload.problem_framing),
    sessionSummary: cleanText(payload.session_summary),
    observedApplications: ensureStringArray(payload.observed_applications, 8),
    painPoints: ensureStringArray(payload.pain_points, 8),
    repetitiveTasks: ensureStringArray(payload.repetitive_tasks, 8),
    suggestedAutomations: ensureStringArray(payload.suggested_automations, 8),
    researchQuestions: ensureStringArray(payload.research_questions, 8),
    automationOpportunities,
    humanInLoopPoints,
    candidateIssues,
    nextActions: ensureStringArray(payload.next_actions, 6),
    markdown: '',
    rawResponse,
  }

  brief.markdown = buildOperationsMarkdown(brief)
  return brief
}

function buildFallbackOperationsBrief(
  processedSession: ProcessedSession,
  context: LLMContext
): OperationsBrief {
  const observedApplications = [
    ...new Set(
      processedSession.steps
        .map(step => step.applicationName)
        .filter((value): value is string => Boolean(value))
    ),
  ]

  const candidateIssues: CandidateIssue[] = []
  const researchQuestions: string[] = [
    'Which step repeats often enough to justify a dedicated automation?',
    'Where does the operator add judgment, validation, or business context that an agent cannot infer alone?',
  ]

  const automationOpportunities: AutomationOpportunity[] = []
  const humanInLoopPoints: HumanInLoopPoint[] = []

  if (context.summary.totalPageLoads > 1) {
    candidateIssues.push({
      title: 'Reduce context switching across applications',
      problem: 'The workflow spans multiple windows or applications, which increases handoff cost and interruption risk.',
      impact: 'Operators spend extra time recovering context and repeating navigation.',
      proposedChange: 'Map the cross-app handoff and automate the most frequent transitions first.',
      priority: 'P2',
      evidence: [`Window changes detected: ${context.summary.totalPageLoads}`],
      acceptanceCriteria: [
        'Document the current handoff path between applications',
        'Identify the highest-frequency transition to automate',
      ],
      tags: ['workflow', 'context-switching'],
    })

    automationOpportunities.push({
      title: 'Cross-application handoff assistant',
      currentPain:
        'The operator switches windows or applications multiple times to finish one workflow.',
      proposedAutomation:
        'Track the active application, prepare the next target screen, and automate the repeated transition path.',
      agentFeasibility: 'human-in-the-loop',
      humanInputRequired:
        'The operator should confirm the target client or document before the handoff runs.',
      researchNeeded: [
        'Map which application transitions happen most often',
        'Check whether the target screens are stable enough for desktop or browser automation',
      ],
      successCriteria: [
        'The assistant reduces manual handoffs for the most common transition',
        'The operator can approve or cancel the handoff before execution',
      ],
    })
  }

  if (context.summary.totalClicks >= 5) {
    candidateIssues.push({
      title: 'Automate repetitive click-heavy flow',
      problem: 'The recorded session contains several manual clicks that likely represent repeatable navigation or data entry.',
      impact: 'Repeated low-value manual interaction consumes operator time and attention.',
      proposedChange: 'Convert the repeated path into a scripted helper or robotic workflow.',
      priority: 'P2',
      evidence: [`Total clicks recorded: ${context.summary.totalClicks}`],
      acceptanceCriteria: [
        'List the repeated click sequence',
        'Confirm which steps can be automated safely',
      ],
      tags: ['automation', 'repetition'],
    })

    automationOpportunities.push({
      title: 'Click-path automation candidate',
      currentPain:
        'The workflow contains enough manual clicks to suggest a repeated, low-value navigation pattern.',
      proposedAutomation:
        'Capture the click path as a reusable automation that can replay navigation and stop for human confirmation on sensitive actions.',
      agentFeasibility: 'agent-ready',
      humanInputRequired:
        'Optional confirmation before irreversible actions such as submit, send, or fiscal confirmation.',
      researchNeeded: [
        'Verify whether the click path is deterministic across sessions',
        'Identify which step becomes sensitive or requires confirmation',
      ],
      successCriteria: [
        'The automation reproduces the path consistently',
        'Sensitive steps are gated behind confirmation when needed',
      ],
    })
  }

  humanInLoopPoints.push({
    step: 'Final approval before completing a sensitive action',
    whyHumanMatters:
      'The operator remains accountable for decisions that affect fiscal, legal, or client-facing outcomes.',
    requiredInput: 'Approve, correct, or cancel the action after reviewing the prepared context.',
    riskIfAutomatedBlindly:
      'A fully autonomous action may submit the wrong data or complete a step without proper review.',
  })

  const brief: OperationsBrief = {
    workflowGoal: context.taskDescription || 'Review the captured workflow and identify automation opportunities.',
    problemFraming:
      'This fallback brief highlights likely pain and automation candidates, but needs transcript review to separate agent-ready work from steps that require operator judgment.',
    sessionSummary:
      processedSession.fullTranscript ||
      `Captured ${processedSession.steps.length} steps across ${observedApplications.length || 1} applications.`,
    observedApplications,
    painPoints: [
      'Fallback summary generated because LLM issue extraction was unavailable.',
      'Review the transcript and screenshots to confirm the highest-friction step.',
    ],
    repetitiveTasks: [
      `Captured steps: ${processedSession.steps.length}`,
      `Captured clicks: ${context.summary.totalClicks}`,
    ],
    suggestedAutomations: [
      'Turn the most repeated navigation path into a reusable automation.',
      'Use the transcript and screenshots to seed issue grooming.',
    ],
    researchQuestions,
    automationOpportunities,
    humanInLoopPoints,
    candidateIssues,
    nextActions: [
      'Review the transcript with the operator.',
      'Promote the strongest candidate issue into the tracker.',
    ],
    markdown: '',
  }

  brief.markdown = buildOperationsMarkdown(brief)
  return brief
}

function buildOperationsMarkdown(brief: OperationsBrief): string {
  const issues = brief.candidateIssues
    .map(
      issue => `### ${issue.title}

- Priority: ${issue.priority}
- Problem: ${issue.problem}
- Impact: ${issue.impact}
- Proposed Change: ${issue.proposedChange}
- Evidence: ${issue.evidence.join(' | ') || 'None'}
- Acceptance Criteria: ${issue.acceptanceCriteria.join(' | ') || 'None'}
- Tags: ${issue.tags.join(', ') || 'None'}`
    )
    .join('\n\n')

  return `# Work Diary Brief

## Workflow Goal
${brief.workflowGoal}

## Problem Framing
${brief.problemFraming}

## Work Diary Summary
${brief.sessionSummary}

## Observed Applications
${brief.observedApplications.join(', ') || 'None'}

## Pain Points
${brief.painPoints.map(item => `- ${item}`).join('\n') || '- None'}

## Repetitive Tasks
${brief.repetitiveTasks.map(item => `- ${item}`).join('\n') || '- None'}

## Suggested Automations
${brief.suggestedAutomations.map(item => `- ${item}`).join('\n') || '- None'}

## Research Questions
${brief.researchQuestions.map(item => `- ${item}`).join('\n') || '- None'}

## Automation Opportunities
${
  brief.automationOpportunities
    .map(
      item => `### ${item.title}

- Current Pain: ${item.currentPain}
- Proposed Automation: ${item.proposedAutomation}
- Agent Feasibility: ${item.agentFeasibility}
- Human Input Required: ${item.humanInputRequired}
- Research Needed: ${item.researchNeeded.join(' | ') || 'None'}
- Success Criteria: ${item.successCriteria.join(' | ') || 'None'}`
    )
    .join('\n\n') || 'No automation opportunities generated.'
}

## Human In The Loop
${
  brief.humanInLoopPoints
    .map(
      item => `### ${item.step}

- Why Human Matters: ${item.whyHumanMatters}
- Required Input: ${item.requiredInput}
- Risk If Automated Blindly: ${item.riskIfAutomatedBlindly}`
    )
    .join('\n\n') || 'No human-in-the-loop points generated.'
}

## Improvement Candidates
${issues || 'No candidate issues generated.'}

## Next Actions
${brief.nextActions.map(item => `- ${item}`).join('\n') || '- None'}
`
}

function normalizePriority(value: string): CandidateIssue['priority'] {
  if (value === 'P1' || value === 'P2' || value === 'P3') {
    return value
  }
  return 'P2'
}

function normalizeFeasibility(value: string): AutomationFeasibility {
  if (
    value === 'agent-ready' ||
    value === 'human-in-the-loop' ||
    value === 'manual-only'
  ) {
    return value
  }
  return 'human-in-the-loop'
}

function ensureStringArray(value: unknown, limit: number): string[] {
  if (!Array.isArray(value)) {
    return []
  }
  return value
    .map(item => cleanText(item))
    .filter(Boolean)
    .slice(0, limit)
}

function cleanText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}
