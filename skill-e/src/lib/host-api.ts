import type { HostShell, HostTranscriptionResult, WorkDiaryHostStatus } from '@/types/host'

function getHostBridge() {
  if (typeof window === 'undefined') {
    return undefined
  }

  return window.skillEHost
}

async function tauriInvoke<T>(command: string, args?: Record<string, unknown>): Promise<T> {
  const { invoke } = await import('@tauri-apps/api/core')
  return invoke<T>(command, args)
}

export function getHostShell(): HostShell {
  return getHostBridge()?.shell === 'electron' ? 'electron' : 'tauri'
}

export async function getWorkDiaryHostStatus(): Promise<WorkDiaryHostStatus> {
  const bridge = getHostBridge()

  if (bridge?.getStatus) {
    return bridge.getStatus()
  }

  return {
    shell: 'tauri',
    transcriptProvider: 'wispr_flow',
    transcriptFallback: 'local_whisper',
    collectorProvider: 'screenpipe',
    providers: [],
    checkedAt: new Date().toISOString(),
  }
}

export async function transcribeWithWisprHost(
  audioPath: string
): Promise<HostTranscriptionResult> {
  const bridge = getHostBridge()

  if (bridge?.wisprTranscribe) {
    return bridge.wisprTranscribe(audioPath)
  }

  return tauriInvoke<HostTranscriptionResult>('transcribe_wispr_bridge', {
    audioPath,
  })
}
