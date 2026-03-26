import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { SessionAnnotations } from '@/lib/session-annotations'

export type DayModeSessionStatus = 'pending' | 'processing' | 'completed' | 'failed'

export interface DayModeSessionItem {
  id: string
  sessionDir: string
  enqueuedAt: number
  sessionStartedAt?: number
  sessionEndedAt?: number
  status: DayModeSessionStatus
  attempts: number
  annotations: SessionAnnotations
  error?: string
  processingTimeMs?: number
  operationsSummary?: string
  candidateIssueCount?: number
}

export interface DayModeState {
  isActive: boolean
  currentSessionDir: string | null
  currentSegmentStartedAt: number | null
  processorBusy: boolean
  queue: DayModeSessionItem[]
  completedToday: number
  failedToday: number
  startDayMode: () => void
  stopDayMode: () => void
  setCurrentSession: (sessionDir: string | null, startedAt?: number | null) => void
  setProcessorBusy: (busy: boolean) => void
  enqueueSession: (
    item: Omit<DayModeSessionItem, 'id' | 'enqueuedAt' | 'status' | 'attempts'>
  ) => DayModeSessionItem
  markProcessing: (id: string) => void
  markCompleted: (
    id: string,
    payload: { processingTimeMs: number; operationsSummary?: string; candidateIssueCount?: number }
  ) => void
  markFailed: (id: string, error: string) => void
  removeSession: (id: string) => void
  clearFinished: () => void
  recoverRuntimeState: () => void
}

export const useDayModeStore = create<DayModeState>()(
  persist(
    (set, get) => ({
      isActive: false,
      currentSessionDir: null,
      currentSegmentStartedAt: null,
      processorBusy: false,
      queue: [],
      completedToday: 0,
      failedToday: 0,

      startDayMode: () =>
        set({
          isActive: true,
        }),

      stopDayMode: () =>
        set({
          isActive: false,
          currentSessionDir: null,
          currentSegmentStartedAt: null,
        }),

      setCurrentSession: (sessionDir, startedAt = null) =>
        set({
          currentSessionDir: sessionDir,
          currentSegmentStartedAt: startedAt,
        }),

      setProcessorBusy: busy =>
        set({
          processorBusy: busy,
        }),

      enqueueSession: item => {
        const queued: DayModeSessionItem = {
          ...item,
          id: crypto.randomUUID(),
          enqueuedAt: Date.now(),
          status: 'pending',
          attempts: 0,
        }

        set(state => ({
          queue: [...state.queue, queued],
        }))

        return queued
      },

      markProcessing: id =>
        set(state => ({
          queue: state.queue.map(item =>
            item.id === id
              ? {
                  ...item,
                  status: 'processing',
                  attempts: item.attempts + 1,
                }
              : item
          ),
        })),

      markCompleted: (id, payload) =>
        set(state => ({
          queue: state.queue.map(item =>
            item.id === id
              ? {
                  ...item,
                  status: 'completed',
                  error: undefined,
                  processingTimeMs: payload.processingTimeMs,
                  operationsSummary: payload.operationsSummary,
                  candidateIssueCount: payload.candidateIssueCount,
                }
              : item
          ),
          completedToday: state.completedToday + 1,
        })),

      markFailed: (id, error) =>
        set(state => ({
          queue: state.queue.map(item =>
            item.id === id
              ? {
                  ...item,
                  status: 'failed',
                  error,
                }
              : item
          ),
          failedToday: state.failedToday + 1,
        })),

      removeSession: id =>
        set(state => ({
          queue: state.queue.filter(item => item.id !== id),
        })),

      clearFinished: () =>
        set(state => ({
          queue: state.queue.filter(item => item.status === 'pending' || item.status === 'processing'),
        })),

      recoverRuntimeState: () =>
        set(state => ({
          isActive: false,
          currentSessionDir: null,
          currentSegmentStartedAt: null,
          processorBusy: false,
          queue: state.queue.map(item =>
            item.status === 'processing'
              ? {
                  ...item,
                  status: 'pending',
                }
              : item
          ),
        })),
    }),
    {
      name: 'skill-e-day-mode',
      partialize: state => ({
        isActive: state.isActive,
        currentSessionDir: state.currentSessionDir,
        currentSegmentStartedAt: state.currentSegmentStartedAt,
        processorBusy: state.processorBusy,
        queue: state.queue,
        completedToday: state.completedToday,
        failedToday: state.failedToday,
      }),
    }
  )
)
