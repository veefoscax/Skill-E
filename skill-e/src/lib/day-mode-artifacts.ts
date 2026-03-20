import { writeFile } from '@tauri-apps/plugin-fs'
import type { DayModeSessionItem } from '@/stores/day-mode'
import type { ProcessingResult } from '@/lib/processing-bridge'

interface SessionRuntimeArtifact {
  sessionDir: string
  status: DayModeSessionItem['status']
  enqueuedAt?: number
  sessionStartedAt?: number
  sessionEndedAt?: number
  processedAt?: number
  processingTimeMs?: number
  operationsSummary?: string
  candidateIssueCount?: number
  error?: string
  retention: {
    rawRetentionDays: number
    storageBudgetGb: number
  }
}

export async function persistDayModeSessionArtifact(
  session: Pick<
    DayModeSessionItem,
    'sessionDir' | 'status' | 'enqueuedAt' | 'sessionStartedAt' | 'sessionEndedAt' | 'error'
  >,
  retention: { rawRetentionDays: number; storageBudgetGb: number },
  result?: ProcessingResult
): Promise<void> {
  const artifact: SessionRuntimeArtifact = {
    sessionDir: session.sessionDir,
    status: session.status,
    enqueuedAt: session.enqueuedAt,
    sessionStartedAt: session.sessionStartedAt,
    sessionEndedAt: session.sessionEndedAt,
    processedAt: result ? Date.now() : undefined,
    processingTimeMs: result?.processingTime,
    operationsSummary: result?.operationsBrief?.sessionSummary,
    candidateIssueCount: result?.operationsBrief?.candidateIssues.length,
    error: session.error || result?.error,
    retention,
  }

  await writeFile(
    `${session.sessionDir}/day-mode-session.json`,
    new TextEncoder().encode(JSON.stringify(artifact, null, 2))
  )
}
