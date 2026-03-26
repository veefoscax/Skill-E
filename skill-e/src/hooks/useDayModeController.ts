import { useCallback, useEffect, useMemo, useRef } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { useRecordingStore, useSettingsStore } from '@/stores'
import { useDayModeStore } from '@/stores/day-mode'
import { buildSessionAnnotations } from '@/lib/session-annotations'
import { processRecordingAndGenerateSkill } from '@/lib/processing-bridge'
import { persistDayModeSessionArtifact } from '@/lib/day-mode-artifacts'
import type { SessionManifest } from '@/types/capture'

interface DayModeControllerOptions {
  startRecording: () => Promise<void>
  stopRecording: () => Promise<string | null>
}

export function useDayModeController({
  startRecording,
  stopRecording,
}: DayModeControllerOptions) {
  const {
    dayModeEnabled,
    segmentDurationMinutes,
    autoProcessSessions,
    rawRetentionDays,
    storageBudgetGb,
  } = useSettingsStore()

  const {
    isActive,
    processorBusy,
    queue,
    completedToday,
    failedToday,
    startDayMode: markStarted,
    stopDayMode: markStopped,
    setCurrentSession,
    enqueueSession,
    setProcessorBusy,
    markProcessing,
    markCompleted,
    markFailed,
    recoverRuntimeState,
  } = useDayModeStore()

  const rotationTimerRef = useRef<number | null>(null)
  const rotatingRef = useRef(false)
  const processingRef = useRef(false)
  const recoveredRef = useRef(false)

  const retention = useMemo(
    () => ({
      rawRetentionDays,
      storageBudgetGb,
    }),
    [rawRetentionDays, storageBudgetGb]
  )

  const clearRotationTimer = useCallback(() => {
    if (rotationTimerRef.current !== null) {
      window.clearTimeout(rotationTimerRef.current)
      rotationTimerRef.current = null
    }
  }, [])

  const validateSession = useCallback(async (sessionDir: string): Promise<string | null> => {
    try {
      const manifest = await invoke<SessionManifest>('load_session_manifest', { sessionDir })

      if (!manifest.audioPath) {
        return 'Work diary segment ended without audio.'
      }

      if (manifest.frames.length === 0) {
        return 'Work diary segment ended without screenshots.'
      }

      return null
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown manifest validation error'
      return `Failed to validate work diary segment: ${message}`
    }
  }, [])

  const scheduleNextRotation = useCallback(() => {
    clearRotationTimer()

    if (!useDayModeStore.getState().isActive) {
      return
    }

    const durationMs = Math.max(1, segmentDurationMinutes) * 60 * 1000
    rotationTimerRef.current = window.setTimeout(() => {
      void rotateCurrentSegment(true)
    }, durationMs)
  }, [clearRotationTimer, segmentDurationMinutes])

  const beginSegment = useCallback(async () => {
    await startRecording()

    const sessionDir = useRecordingStore.getState().sessionDirectory
    setCurrentSession(sessionDir, Date.now())
    scheduleNextRotation()
  }, [scheduleNextRotation, setCurrentSession, startRecording])

  const processQueue = useCallback(async () => {
    if (!autoProcessSessions || processingRef.current) {
      return
    }

    const nextItem = useDayModeStore.getState().queue.find(item => item.status === 'pending')
    if (!nextItem) {
      return
    }

    processingRef.current = true
    setProcessorBusy(true)

    try {
      let current: typeof nextItem | undefined = nextItem

      while (current) {
        const item = current
        markProcessing(item.id)

        try {
          const result = await processRecordingAndGenerateSkill(
            {
              sessionId: item.sessionDir,
              annotations: item.annotations,
            },
            () => {}
          )

          if (result.success) {
            markCompleted(item.id, {
              processingTimeMs: result.processingTime,
              operationsSummary: result.operationsBrief?.sessionSummary,
              candidateIssueCount: result.operationsBrief?.candidateIssues.length,
            })
          } else {
            markFailed(item.id, result.error || 'Unknown day mode processing error')
          }

          const persistedState =
            useDayModeStore.getState().queue.find(queueItem => queueItem.id === item.id) || item

          await persistDayModeSessionArtifact(persistedState, retention, result)
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown day mode processing error'
          markFailed(item.id, message)

          const persistedState =
            useDayModeStore.getState().queue.find(queueItem => queueItem.id === item.id) || {
              ...item,
              status: 'failed' as const,
              error: message,
            }

          await persistDayModeSessionArtifact(persistedState, retention)
        }

        current = useDayModeStore.getState().queue.find(item => item.status === 'pending')
      }
    } finally {
      processingRef.current = false
      setProcessorBusy(false)
    }
  }, [autoProcessSessions, markCompleted, markFailed, markProcessing, retention, setProcessorBusy])

  const rotateCurrentSegment = useCallback(
    async (startNextSegment: boolean) => {
      if (rotatingRef.current) {
        return
      }

      rotatingRef.current = true
      clearRotationTimer()

      try {
        const annotations = buildSessionAnnotations()
        const currentSegmentStartedAt = useDayModeStore.getState().currentSegmentStartedAt || undefined
        const sessionDir = await stopRecording()
        const sessionEndedAt = Date.now()

        if (sessionDir) {
          const queued = enqueueSession({
            sessionDir,
            sessionStartedAt: currentSegmentStartedAt,
            sessionEndedAt,
            annotations,
          })

          const validationError = await validateSession(sessionDir)
          if (validationError) {
            markFailed(queued.id, validationError)

            const failedState =
              useDayModeStore.getState().queue.find(item => item.id === queued.id) || {
                ...queued,
                status: 'failed' as const,
                error: validationError,
              }

            await persistDayModeSessionArtifact(failedState, retention)
          } else {
            await persistDayModeSessionArtifact(queued, retention)
          }
        }

        if (startNextSegment && useDayModeStore.getState().isActive) {
          await beginSegment()
        } else {
          setCurrentSession(null, null)
        }
      } finally {
        rotatingRef.current = false
      }
    },
    [
      beginSegment,
      clearRotationTimer,
      enqueueSession,
      markFailed,
      retention,
      setCurrentSession,
      stopRecording,
      validateSession,
    ]
  )

  const startDayMode = useCallback(async () => {
    if (!dayModeEnabled || useDayModeStore.getState().isActive) {
      return
    }

    markStarted()

    try {
      await beginSegment()
    } catch (error) {
      markStopped()
      throw error
    }
  }, [beginSegment, dayModeEnabled, markStarted, markStopped])

  const stopDayMode = useCallback(async () => {
    if (!useDayModeStore.getState().isActive) {
      return
    }

    markStopped()
    clearRotationTimer()
    await rotateCurrentSegment(false)
  }, [clearRotationTimer, markStopped, rotateCurrentSegment])

  useEffect(() => {
    if (recoveredRef.current) {
      return
    }

    recoverRuntimeState()
    recoveredRef.current = true
  }, [recoverRuntimeState])

  useEffect(() => {
    void processQueue()
  }, [processQueue, queue])

  useEffect(
    () => () => {
      clearRotationTimer()
    },
    [clearRotationTimer]
  )

  return {
    dayModeEnabled,
    isDayModeActive: isActive,
    processorBusy,
    queuedSessions: queue,
    pendingCount: queue.filter(item => item.status === 'pending').length,
    completedToday,
    failedToday,
    startDayMode,
    stopDayMode,
    rotateCurrentSegment,
  }
}
