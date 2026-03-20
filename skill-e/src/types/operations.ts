export type CandidateIssuePriority = 'P1' | 'P2' | 'P3'
export type AutomationFeasibility = 'agent-ready' | 'human-in-the-loop' | 'manual-only'

export interface CandidateIssue {
  title: string
  problem: string
  impact: string
  proposedChange: string
  priority: CandidateIssuePriority
  evidence: string[]
  acceptanceCriteria: string[]
  tags: string[]
}

export interface AutomationOpportunity {
  title: string
  currentPain: string
  proposedAutomation: string
  agentFeasibility: AutomationFeasibility
  humanInputRequired: string
  researchNeeded: string[]
  successCriteria: string[]
}

export interface HumanInLoopPoint {
  step: string
  whyHumanMatters: string
  requiredInput: string
  riskIfAutomatedBlindly: string
}

export interface OperationsBrief {
  workflowGoal: string
  problemFraming: string
  sessionSummary: string
  observedApplications: string[]
  painPoints: string[]
  repetitiveTasks: string[]
  suggestedAutomations: string[]
  researchQuestions: string[]
  automationOpportunities: AutomationOpportunity[]
  humanInLoopPoints: HumanInLoopPoint[]
  candidateIssues: CandidateIssue[]
  nextActions: string[]
  markdown: string
  rawResponse?: string
}
