import { fetch } from '@tauri-apps/plugin-http';

export interface OllamaModel {
    name: string;
    modified_at: string;
    size: number;
}

export interface OllamaModelResponse {
    models: OllamaModel[];
}

/**
 * Fetch available models from local Ollama instance
 * Uses the /api/tags endpoint which is standard for Ollama
 */
export async function fetchOllamaModels(baseUrl: string = 'http://localhost:11434'): Promise<string[]> {
    try {
        // Try standard Ollama API
        const response = await fetch(`${baseUrl}/api/tags`, {
            method: 'GET',
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch models: ${response.statusText}`);
        }

        const data = await response.json() as OllamaModelResponse;
        return data.models.map(m => m.name);
    } catch (error) {
        console.warn('Failed to fetch Ollama models via /api/tags, trying /v1/models', error);

        // Fallback to OpenAI compatible endpoint
        try {
            const response = await fetch(`${baseUrl}/v1/models`, {
                method: 'GET',
            });

            if (!response.ok) throw new Error('Failed to fetch models via v1');

            const data = await response.json() as { data: { id: string }[] };
            return data.data.map(m => m.id);
        } catch (e) {
            console.error('All Ollama fetch attempts failed', e);
            return [];
        }
    }
}
