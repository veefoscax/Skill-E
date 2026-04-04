export type HostShell = 'tauri' | 'electron'

export type ProviderHealth = 'available' | 'unavailable' | 'running' | 'error'

export type ProviderId = 'wispr_flow' | 'screenpipe' | 'node' | 'python'

export interface ProviderStatus {
  id: ProviderId
  label: string
  health: ProviderHealth
  available: boolean
  running: boolean
  detail?: string
  command?: string
}

export interface WorkDiaryHostStatus {
  shell: HostShell
  transcriptProvider: 'wispr_flow'
  transcriptFallback: 'local_whisper'
  collectorProvider: 'screenpipe'
  providers: ProviderStatus[]
  checkedAt: string
}

export interface HostTranscriptionResult {
  text: string
  duration?: number
}

declare global {
  interface Window {
    skillEHost?: {
      shell?: HostShell
      getStatus?: () => Promise<WorkDiaryHostStatus>
      wisprTranscribe?: (audioPath: string) => Promise<HostTranscriptionResult>
    }
  }
}
