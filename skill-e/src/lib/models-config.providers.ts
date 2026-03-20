// Ported from OpenClaw: src/agents/models-config.providers.ts

export const MINIMAX_API_BASE_URL = 'https://api.minimax.chat/v1'
export const MINIMAX_DEFAULT_MODEL_ID = 'MiniMax-M2.1'

export const MOONSHOT_BASE_URL = 'https://api.moonshot.ai/v1'
export const MOONSHOT_DEFAULT_MODEL_ID = 'kimi-k2.5'

export const KIMI_CODE_BASE_URL = 'https://api.kimi.com/coding/v1'
export const KIMI_CODE_MODEL_ID = 'kimi-for-coding'
export const KIMI_CODE_HEADERS = { 'User-Agent': 'KimiCLI/0.77' } as const

export const QWEN_PORTAL_BASE_URL = 'https://portal.qwen.ai/v1'

// UPDATED: Use localhost and REMOVED /v1 as requested
export const OLLAMA_BASE_URL = 'http://localhost:11434'

export const XIAOMI_BASE_URL = 'https://api.xiaomimimo.com/anthropic'
export const XIAOMI_DEFAULT_MODEL_ID = 'mimo-v2-flash'

export interface ProviderConfig {
  baseUrl: string
  api: 'openai-completions' | 'anthropic-messages' | 'native-cli'
  defaultModel: string
  label: string
  headers?: Record<string, string>
  models?: { id: string; name: string }[]
}

export const OPENCLAW_PROVIDERS: Record<string, ProviderConfig> = {
  codex: {
    label: 'Codex (ChatGPT Login)',
    baseUrl: '',
    api: 'native-cli',
    defaultModel: 'gpt-5.4-mini',
    models: [
      { id: 'gpt-5.4-mini', name: 'GPT-5.4 Mini' },
      { id: 'gpt-5.1-mini', name: 'GPT-5.1 Mini' },
      { id: 'gpt-5.4', name: 'GPT-5.4' },
    ],
  },
  openrouter: {
    label: 'OpenRouter (Free Models)',
    baseUrl: 'https://openrouter.ai/api/v1',
    api: 'openai-completions',
    defaultModel: 'google/gemini-2.0-flash-exp:free',
    models: [
      { id: 'google/gemini-2.0-flash-exp:free', name: 'Gemini 2.0 Flash (Free)' },
      { id: 'meta-llama/llama-3.1-8b-instruct:free', name: 'Llama 3.1 8B (Free)' },
      { id: 'microsoft/phi-3-medium-128k-instruct:free', name: 'Phi-3 Medium (Free)' },
    ],
  },
  moonshot: {
    label: 'Moonshot AI (Kimi)',
    baseUrl: MOONSHOT_BASE_URL,
    api: 'openai-completions',
    defaultModel: MOONSHOT_DEFAULT_MODEL_ID,
    models: [{ id: MOONSHOT_DEFAULT_MODEL_ID, name: 'Kimi K2.5' }],
  },
  'kimi-code': {
    label: 'Kimi Code',
    baseUrl: KIMI_CODE_BASE_URL,
    api: 'openai-completions',
    defaultModel: KIMI_CODE_MODEL_ID,
    headers: KIMI_CODE_HEADERS as Record<string, string>,
    models: [{ id: KIMI_CODE_MODEL_ID, name: 'Kimi For Coding' }],
  },
  minimax: {
    label: 'MiniMax',
    baseUrl: MINIMAX_API_BASE_URL,
    api: 'openai-completions',
    defaultModel: MINIMAX_DEFAULT_MODEL_ID,
    models: [
      { id: MINIMAX_DEFAULT_MODEL_ID, name: 'MiniMax M2.1' },
      { id: 'MiniMax-VL-01', name: 'MiniMax VL 01' },
    ],
  },
  'qwen-portal': {
    label: 'Qwen Portal',
    baseUrl: QWEN_PORTAL_BASE_URL,
    api: 'openai-completions',
    defaultModel: 'coder-model',
    models: [
      { id: 'coder-model', name: 'Qwen Coder' },
      { id: 'vision-model', name: 'Qwen Vision' },
    ],
  },
  xiaomi: {
    label: 'Xiaomi MiMo',
    baseUrl: XIAOMI_BASE_URL,
    api: 'anthropic-messages',
    defaultModel: XIAOMI_DEFAULT_MODEL_ID,
    models: [{ id: XIAOMI_DEFAULT_MODEL_ID, name: 'Xiaomi MiMo V2 Flash' }],
  },
  ollama: {
    label: 'Ollama (Local)',
    baseUrl: OLLAMA_BASE_URL,
    api: 'openai-completions',
    defaultModel: 'llama3:latest',
  },
  // Keeping standard ones for compatibility
  openai: {
    label: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    api: 'openai-completions',
    defaultModel: 'gpt-4-turbo',
  },
  anthropic: {
    label: 'Anthropic',
    baseUrl: 'https://api.anthropic.com/v1',
    api: 'anthropic-messages',
    defaultModel: 'claude-3-5-sonnet-20241022',
  },
  google: {
    label: 'Google (Gemini)',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    api: 'openai-completions',
    defaultModel: 'gemini-1.5-pro-latest',
  },
  custom: {
    label: 'Custom (OpenAI Compatible)',
    baseUrl: '',
    api: 'openai-completions',
    defaultModel: '',
  },
}

// Export alias for compatibility
export const LLM_DEFAULTS = OPENCLAW_PROVIDERS
