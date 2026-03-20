import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type TranscriptionMode = 'cloud_openai' | 'local_whisper' | 'browser_native'
export type LLMProvider =
  | 'codex'
  | 'openai'
  | 'anthropic'
  | 'google'
  | 'ollama'
  | 'demo'
  | 'custom'
  | 'moonshot'
  | 'kimi-code'
export type WhisperModel = 'tiny' | 'base' | 'small' | 'medium' | 'large-v3' | 'turbo'

export interface SettingsState {
  // Capture
  frameRate: number
  outputDir: string | null

  // Transcription
  transcriptionMode: TranscriptionMode
  whisperModel: WhisperModel
  useGpu: boolean
  whisperApiKey: string

  // Sidecar
  sidecarEnabled: boolean
  sidecarPort: number

  // LLM
  llmProvider: LLMProvider
  llmApiKey: string
  claudeApiKey: string // Backward compat
  llmModel: string
  llmBaseUrl: string // custom or ollama URL

  // Audio
  microphoneId: string
  selectedMicId: string // Backward compat alias

  // Day mode
  dayModeEnabled: boolean
  segmentDurationMinutes: number
  autoProcessSessions: boolean
  rawRetentionDays: number
  storageBudgetGb: number

  // App State
  isOnboardingCompleted: boolean
  windowPosition: { x: number; y: number } | null

  // Actions
  setFrameRate: (fps: number) => void
  setOutputDir: (dir: string | null) => void
  setTranscriptionMode: (mode: TranscriptionMode) => void
  setWhisperModel: (model: WhisperModel) => void
  setUseGpu: (useGpu: boolean) => void
  setWhisperApiKey: (key: string) => void
  setSidecarEnabled: (enabled: boolean) => void
  setSidecarPort: (port: number) => void
  setLlmProvider: (provider: LLMProvider) => void
  setLlmApiKey: (key: string) => void
  setClaudeApiKey: (key: string) => void
  setLlmModel: (model: string) => void
  setLlmBaseUrl: (url: string) => void
  setMicrophoneId: (id: string) => void
  setSelectedMicId: (id: string) => void
  setDayModeEnabled: (enabled: boolean) => void
  setSegmentDurationMinutes: (minutes: number) => void
  setAutoProcessSessions: (enabled: boolean) => void
  setRawRetentionDays: (days: number) => void
  setStorageBudgetGb: (gb: number) => void
  setOnboardingCompleted: (completed: boolean) => void
  setWindowPosition: (pos: { x: number; y: number } | null) => void
  reset: () => void
}

// Provider Defaults
export const LLM_DEFAULTS: Record<
  LLMProvider,
  { label: string; baseUrl?: string; defaultModel?: string; headers?: Record<string, string> }
> = {
  codex: { label: 'Codex (ChatGPT Login)', defaultModel: 'gpt-5.4-mini' },
  openai: { label: 'OpenAI', defaultModel: 'gpt-4o' },
  anthropic: { label: 'Anthropic', defaultModel: 'claude-3-5-sonnet-20240620' },
  google: { label: 'Google Gemini', defaultModel: 'gemini-1.5-flash' },
  ollama: { label: 'Ollama (Local)', baseUrl: 'http://localhost:11434', defaultModel: 'llama3' },
  moonshot: {
    label: 'Moonshot AI',
    baseUrl: 'https://api.moonshot.cn/v1',
    defaultModel: 'moonshot-v1-8k',
  },
  'kimi-code': {
    label: 'Kimi Code',
    baseUrl: 'https://api.kimi.com/coding/v1',
    defaultModel: 'kimi-k2',
    headers: {},
  },
  demo: { label: 'Demo Mode (Mock)', defaultModel: 'mock-gpt-4' },
  custom: { label: 'Custom Endpoint', baseUrl: 'http://localhost:1234/v1' },
}

// Whisper Model Info
export const WHISPER_MODEL_INFO: Record<
  string,
  { name: string; size: string; description: string; gpuRecommended: boolean }
> = {
  tiny: {
    name: 'Tiny',
    size: '~75MB',
    description: 'Fastest, lowest accuracy. Good for testing.',
    gpuRecommended: false,
  },
  base: {
    name: 'Base',
    size: '~142MB',
    description: 'Balanced speed and accuracy.',
    gpuRecommended: false,
  },
  small: {
    name: 'Small',
    size: '~466MB',
    description: 'Good accuracy, slower on CPU.',
    gpuRecommended: false,
  },
  medium: {
    name: 'Medium',
    size: '~1.5GB',
    description: 'High accuracy, heavy on CPU.',
    gpuRecommended: true,
  },
  'large-v3': {
    name: 'Large V3',
    size: '~3.1GB',
    description: 'State of the art accuracy. Requires GPU.',
    gpuRecommended: true,
  },
  turbo: {
    name: 'Turbo',
    size: '~809MB',
    description: 'Optimized Large model for speed.',
    gpuRecommended: true,
  },
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    set => ({
      frameRate: 1,
      outputDir: null,
      transcriptionMode: 'local_whisper',
      whisperModel: 'tiny',
      useGpu: false,
      whisperApiKey: '',
      sidecarEnabled: true,
      sidecarPort: 8000,
      llmProvider: 'codex',
      llmApiKey: '',
      claudeApiKey: '',
      llmModel: 'gpt-5.4-mini',
      llmBaseUrl: '',
      microphoneId: 'default',
      selectedMicId: 'default',
      dayModeEnabled: false,
      segmentDurationMinutes: 15,
      autoProcessSessions: true,
      rawRetentionDays: 7,
      storageBudgetGb: 1.5,
      isOnboardingCompleted: true,
      windowPosition: null,

      setFrameRate: fps => set({ frameRate: fps }),
      setOutputDir: dir => set({ outputDir: dir }),
      setTranscriptionMode: mode => set({ transcriptionMode: mode }),
      setWhisperModel: model => set({ whisperModel: model }),
      setUseGpu: useGpu => set({ useGpu }),
      setWhisperApiKey: key => set({ whisperApiKey: key }),
      setSidecarEnabled: enabled => set({ sidecarEnabled: enabled }),
      setSidecarPort: port => set({ sidecarPort: port }),
      setLlmProvider: provider => set({ llmProvider: provider }),
      setLlmApiKey: key => set({ llmApiKey: key }),
      setClaudeApiKey: key => set({ claudeApiKey: key }),
      setLlmModel: model => set({ llmModel: model }),
      setLlmBaseUrl: url => set({ llmBaseUrl: url }),
      setMicrophoneId: id => set({ microphoneId: id, selectedMicId: id }),
      setSelectedMicId: id => set({ selectedMicId: id, microphoneId: id }),
      setDayModeEnabled: enabled => set({ dayModeEnabled: enabled }),
      setSegmentDurationMinutes: minutes => set({ segmentDurationMinutes: minutes }),
      setAutoProcessSessions: enabled => set({ autoProcessSessions: enabled }),
      setRawRetentionDays: days => set({ rawRetentionDays: days }),
      setStorageBudgetGb: gb => set({ storageBudgetGb: gb }),
      setOnboardingCompleted: completed => set({ isOnboardingCompleted: completed }),
      setWindowPosition: pos => set({ windowPosition: pos }),
      reset: () =>
        set({
          frameRate: 1,
          outputDir: null,
          transcriptionMode: 'local_whisper',
          whisperModel: 'tiny',
          useGpu: false,
          whisperApiKey: '',
          sidecarEnabled: true,
          sidecarPort: 8000,
          llmProvider: 'codex',
          llmApiKey: '',
          claudeApiKey: '',
          llmModel: 'gpt-5.4-mini',
          llmBaseUrl: '',
          microphoneId: 'default',
          selectedMicId: 'default',
          dayModeEnabled: false,
          segmentDurationMinutes: 15,
          autoProcessSessions: true,
          rawRetentionDays: 7,
          storageBudgetGb: 1.5,
          isOnboardingCompleted: true,
          windowPosition: null,
        }),
    }),
    {
      name: 'skill-e-settings',
      // IMPORTANT: Não persistir API keys para o portable não salvar credenciais
      partialize: state => ({
        frameRate: state.frameRate,
        outputDir: state.outputDir,
        transcriptionMode: state.transcriptionMode,
        whisperModel: state.whisperModel,
        useGpu: state.useGpu,
        sidecarEnabled: state.sidecarEnabled,
        sidecarPort: state.sidecarPort,
        llmProvider: state.llmProvider,
        llmModel: state.llmModel,
        llmBaseUrl: state.llmBaseUrl,
        microphoneId: state.microphoneId,
        selectedMicId: state.selectedMicId,
        dayModeEnabled: state.dayModeEnabled,
        segmentDurationMinutes: state.segmentDurationMinutes,
        autoProcessSessions: state.autoProcessSessions,
        rawRetentionDays: state.rawRetentionDays,
        storageBudgetGb: state.storageBudgetGb,
        isOnboardingCompleted: state.isOnboardingCompleted,
        windowPosition: state.windowPosition,
      }),
    }
  )
)
