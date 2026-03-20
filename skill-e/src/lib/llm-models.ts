import { fetch } from '@tauri-apps/plugin-http'
import { OPENCLAW_PROVIDERS } from './models-config.providers'

export interface ModelOption {
  id: string
  name?: string
}

/**
 * Fetch available models for a given provider
 * Tries API first, falls back to static config
 */
export async function fetchProviderModels(
  providerId: string,
  baseUrl: string,
  apiKey?: string
): Promise<ModelOption[]> {
  const config = OPENCLAW_PROVIDERS[providerId]
  const staticModels = config?.models?.map(m => ({ id: m.id, name: m.name })) || []

  if (providerId === 'codex') {
    return staticModels.length > 0
      ? staticModels
      : [{ id: config?.defaultModel || 'gpt-5.4-mini', name: config?.defaultModel || 'gpt-5.4-mini' }]
  }

  // 1. Ollama (No Auth usually)
  if (providerId === 'ollama') {
    return fetchOllamaModels(baseUrl)
  }

  // 2. OpenAI Compatible (Requires Auth)
  if (config?.api === 'openai-completions') {
    try {
      const models = await fetchOpenAIModels(baseUrl, apiKey)
      if (models.length > 0) return models
    } catch (e) {
      console.warn(`Failed to fetch models for ${providerId}:`, e)
    }
  }

  // 3. Fallback to static list
  if (staticModels.length > 0) {
    return staticModels
  }

  // 4. Fallback to default model if nothing else
  if (config?.defaultModel) {
    return [{ id: config.defaultModel, name: config.defaultModel }]
  }

  return []
}

async function fetchOllamaModels(baseUrl: string): Promise<ModelOption[]> {
  try {
    // Try standard Ollama API
    const response = await fetch(`${baseUrl}/api/tags`, { method: 'GET' })
    if (!response.ok) throw new Error('Failed /api/tags')
    const data = (await response.json()) as { models: { name: string }[] }
    return data.models.map(m => ({ id: m.name, name: m.name }))
  } catch (e) {
    // Fallback v1/models
    try {
      const response = await fetch(`${baseUrl}/v1/models`, { method: 'GET' })
      if (!response.ok) throw new Error('Failed /v1/models')
      const data = (await response.json()) as { data: { id: string }[] }
      return data.data.map(m => ({ id: m.id, name: m.id }))
    } catch (err) {
      console.error('Ollama fetch failed', err)
      return []
    }
  }
}

async function fetchOpenAIModels(baseUrl: string, apiKey?: string): Promise<ModelOption[]> {
  if (!apiKey) throw new Error('API Key required for model fetching')

  // Clean URL (remove /chat/completions if present, ensure /v1/models)
  let modelsUrl = baseUrl
  if (modelsUrl.endsWith('/chat/completions')) {
    modelsUrl = modelsUrl.replace('/chat/completions', '/models')
  } else if (!modelsUrl.endsWith('/models')) {
    modelsUrl = `${modelsUrl}/models`
  }

  const response = await fetch(modelsUrl, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch models: ${response.status} ${response.statusText}`)
  }

  const data = (await response.json()) as { data: { id: string; object: string }[] }

  // Filter for likely chat models if possible, or just return all
  return data.data.map(m => ({ id: m.id, name: m.id })).sort((a, b) => a.id.localeCompare(b.id))
}
