import { fetch } from '@tauri-apps/plugin-http'
import { invoke } from '@tauri-apps/api/core'

export interface GenerateTextOptions {
  prompt: string
  model: string
  apiKey?: string
  provider?: string
  baseUrl?: string
  customHeaders?: Record<string, string>
  maxTokens?: number
  temperature?: number
  workingDir?: string
  outputSchema?: Record<string, unknown>
}

export async function generateTextCompletion({
  prompt,
  model,
  apiKey = '',
  provider,
  baseUrl = 'https://api.openai.com/v1',
  customHeaders = {},
  maxTokens = 4000,
  temperature = 0.2,
  workingDir,
  outputSchema,
}: GenerateTextOptions): Promise<string> {
  if (provider === 'codex') {
    const result = await invoke<{
      content: string
      model: string
      working_dir: string
    }>('codex_generate_text', {
      prompt,
      model,
      workingDir: workingDir || null,
      outputSchemaJson: outputSchema ? JSON.stringify(outputSchema) : null,
    })

    if (!result?.content || result.content.trim() === '') {
      throw new Error('Codex returned empty content')
    }

    return result.content
  }

  let url = baseUrl

  const isOllamaPort = url.includes(':11434')
  const hasV1 = url.includes('/v1')
  const hasApi = url.includes('/api/')

  if (isOllamaPort && !hasV1 && !hasApi) {
    if (url.endsWith('/')) url = url.slice(0, -1)
    url = `${url}/v1`
  }

  if (!url.endsWith('/')) url += '/'

  const endpoint = 'chat/completions'
  const fullUrl = url.endsWith(endpoint) ? url : `${url}${endpoint}`

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': 'Roo Code',
    'X-Client-Name': 'Roo Code',
  }

  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`
  }

  Object.assign(headers, customHeaders)

  try {
    const response = await fetch(fullUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        temperature,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API error (${response.status}): ${errorText}`)
    }

    const data = await response.json()
    const content = data?.choices?.[0]?.message?.content

    if (!content || typeof content !== 'string' || content.trim() === '') {
      throw new Error('Invalid response from LLM API (missing choices/content)')
    }

    return content
  } catch (error) {
    if (String(error).includes('Failed to fetch')) {
      throw new Error(
        'Network error: Failed to connect to LLM provider. Please check your internet connection and Base URL.'
      )
    }
    throw error
  }
}
