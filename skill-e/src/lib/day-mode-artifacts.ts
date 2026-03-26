import { dirname, join } from '@tauri-apps/api/path'
import { readDir, readTextFile, remove, stat, writeFile } from '@tauri-apps/plugin-fs'
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
  rawPrunedAt?: number
  rawBytesRemoved?: number
}

interface SessionUsage {
  sessionDir: string
  artifactPath: string
  artifact?: SessionRuntimeArtifact
  totalBytes: number
  rawBytes: number
  processedAt?: number
  status?: DayModeSessionItem['status']
}

const RAW_FILE_PATTERNS = [/^frame-\d+\.(webp|png|jpg|jpeg)$/i, /^audio-\d+\.(webm|wav|mp3|m4a|ogg)$/i]
const DAY_MODE_ARTIFACT_NAME = 'day-mode-session.json'

function isRawCaptureFile(name: string): boolean {
  return RAW_FILE_PATTERNS.some(pattern => pattern.test(name))
}

function toBytes(gigabytes: number): number {
  return Math.max(0, gigabytes) * 1024 * 1024 * 1024
}

async function getDirectoryFileStats(
  dir: string
): Promise<Array<{ path: string; name: string; size: number; isDirectory: boolean }>> {
  const entries = await readDir(dir)
  const files: Array<{ path: string; name: string; size: number; isDirectory: boolean }> = []

  for (const entry of entries) {
    const entryPath = await join(dir, entry.name)

    if (entry.isDirectory) {
      const nested = await getDirectoryFileStats(entryPath)
      files.push(...nested)
      continue
    }

    if (!entry.isFile) {
      continue
    }

    const info = await stat(entryPath)
    files.push({
      path: entryPath,
      name: entry.name,
      size: info.size || 0,
      isDirectory: false,
    })
  }

  return files
}

async function loadArtifact(sessionDir: string): Promise<{ artifact?: SessionRuntimeArtifact; artifactPath: string }> {
  const artifactPath = await join(sessionDir, DAY_MODE_ARTIFACT_NAME)

  try {
    const raw = await readTextFile(artifactPath)
    return {
      artifact: JSON.parse(raw) as SessionRuntimeArtifact,
      artifactPath,
    }
  } catch {
    return { artifactPath }
  }
}

async function collectSessionUsage(sessionRoot: string): Promise<SessionUsage[]> {
  const entries = await readDir(sessionRoot)
  const sessions: SessionUsage[] = []

  for (const entry of entries) {
    if (!entry.isDirectory || !entry.name.startsWith('session-')) {
      continue
    }

    const sessionDir = await join(sessionRoot, entry.name)
    const files = await getDirectoryFileStats(sessionDir)
    const { artifact, artifactPath } = await loadArtifact(sessionDir)

    let totalBytes = 0
    let rawBytes = 0

    for (const file of files) {
      totalBytes += file.size
      if (isRawCaptureFile(file.name)) {
        rawBytes += file.size
      }
    }

    sessions.push({
      sessionDir,
      artifactPath,
      artifact,
      totalBytes,
      rawBytes,
      processedAt: artifact?.processedAt ?? artifact?.sessionEndedAt ?? artifact?.enqueuedAt,
      status: artifact?.status,
    })
  }

  return sessions
}

async function writeArtifact(artifactPath: string, artifact: SessionRuntimeArtifact): Promise<void> {
  await writeFile(artifactPath, new TextEncoder().encode(JSON.stringify(artifact, null, 2)))
}

async function pruneRawFiles(usage: SessionUsage): Promise<number> {
  const files = await getDirectoryFileStats(usage.sessionDir)
  const rawFiles = files.filter(file => isRawCaptureFile(file.name))

  if (rawFiles.length === 0) {
    return 0
  }

  let removedBytes = 0

  for (const file of rawFiles) {
    await remove(file.path)
    removedBytes += file.size
  }

  if (usage.artifact) {
    usage.artifact.rawPrunedAt = Date.now()
    usage.artifact.rawBytesRemoved = (usage.artifact.rawBytesRemoved || 0) + removedBytes
    await writeArtifact(usage.artifactPath, usage.artifact)
  }

  usage.rawBytes = 0
  usage.totalBytes = Math.max(0, usage.totalBytes - removedBytes)
  return removedBytes
}

async function enforceDayModeRetention(
  sessionDir: string,
  retention: { rawRetentionDays: number; storageBudgetGb: number }
): Promise<void> {
  const sessionRoot = await dirname(sessionDir)
  const sessions = await collectSessionUsage(sessionRoot)

  if (sessions.length === 0) {
    return
  }

  const now = Date.now()
  const maxAgeMs = Math.max(0, retention.rawRetentionDays) * 24 * 60 * 60 * 1000
  const budgetBytes = toBytes(retention.storageBudgetGb)

  const prunable = sessions
    .filter(session => session.rawBytes > 0 && (session.status === 'completed' || session.status === 'failed'))
    .sort((left, right) => (left.processedAt || 0) - (right.processedAt || 0))

  for (const session of prunable) {
    if (!session.processedAt) {
      continue
    }

    if (maxAgeMs > 0 && now - session.processedAt >= maxAgeMs) {
      await pruneRawFiles(session)
    }
  }

  if (budgetBytes <= 0) {
    return
  }

  let totalBytes = sessions.reduce((sum, current) => sum + current.totalBytes, 0)
  if (totalBytes <= budgetBytes) {
    return
  }

  for (const session of prunable) {
    if (totalBytes <= budgetBytes) {
      break
    }

    if (session.rawBytes === 0) {
      continue
    }

    const removed = await pruneRawFiles(session)
    totalBytes = Math.max(0, totalBytes - removed)
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
  const artifactPath = await join(session.sessionDir, DAY_MODE_ARTIFACT_NAME)
  const previous = await loadArtifact(session.sessionDir)

  const artifact: SessionRuntimeArtifact = {
    sessionDir: session.sessionDir,
    status: session.status,
    enqueuedAt: session.enqueuedAt,
    sessionStartedAt: session.sessionStartedAt,
    sessionEndedAt: session.sessionEndedAt,
    processedAt: result ? Date.now() : previous.artifact?.processedAt,
    processingTimeMs: result?.processingTime ?? previous.artifact?.processingTimeMs,
    operationsSummary: result?.operationsBrief?.sessionSummary ?? previous.artifact?.operationsSummary,
    candidateIssueCount:
      result?.operationsBrief?.candidateIssues.length ?? previous.artifact?.candidateIssueCount,
    error: session.error || result?.error || previous.artifact?.error,
    retention,
    rawPrunedAt: previous.artifact?.rawPrunedAt,
    rawBytesRemoved: previous.artifact?.rawBytesRemoved,
  }

  await writeFile(artifactPath, new TextEncoder().encode(JSON.stringify(artifact, null, 2)))

  if (artifact.status === 'completed' || artifact.status === 'failed') {
    await enforceDayModeRetention(session.sessionDir, retention)
  }
}
