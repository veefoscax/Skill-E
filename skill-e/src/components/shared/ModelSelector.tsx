import { useState, useEffect } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fetchProviderModels, ModelOption } from '@/lib/llm-models';
import { OPENCLAW_PROVIDERS } from '@/lib/models-config.providers';

interface ModelSelectorProps {
    provider: string; // The selected provider ID
    baseUrl: string;
    apiKey?: string;
    value: string; // The selected model ID
    onChange: (modelId: string) => void;
    disabled?: boolean;
}

export function ModelSelector({ provider, baseUrl, apiKey, value, onChange, disabled }: ModelSelectorProps) {
    const [availableModels, setAvailableModels] = useState<ModelOption[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load models when provider or key changes
    useEffect(() => {
        loadModels();
    }, [provider, apiKey, baseUrl]); // Added baseUrl dependency as it affects Ollama

    const loadModels = async () => {
        setLoading(true);
        setError(null);
        try {
            const config = OPENCLAW_PROVIDERS[provider];
            if (!config) return;

            // Fetch models (will use API or fallback to static config)
            const models = await fetchProviderModels(
                provider,
                baseUrl || config.baseUrl,
                apiKey
            );
            setAvailableModels(models);

            // Auto-select logic: If we have models, ensure current selection is valid
            if (models.length > 0) {
                const currentIsValid = models.some(m => m.id === value);

                // If current value is invalid (not in list), force selection of a valid one
                // This fixes the issue where "llama3:latest" default persists even if user doesn't have it
                if (!currentIsValid) {
                    // 1. Try to find the default model in the list
                    const defaultModel = config.defaultModel;
                    const defaultInList = models.find(m => m.id === defaultModel);

                    // 2. Fallback to the first available model
                    const targetModel = defaultInList ? defaultInList.id : models[0].id;

                    console.log(`[ModelSelector] Auto-correcting invalid model '${value}' to '${targetModel}'`);
                    onChange(targetModel);
                }
            }
        } catch (err) {
            console.error('Failed to load models:', err);
            setError('Failed to load models');
            setAvailableModels([]);
        } finally {
            setLoading(false);
        }
    };

    const isDisabled = disabled || loading;

    return (
        <div className="flex gap-2 items-center">
            <div className="flex-1 relative">
                <select
                    className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm p-2 ${isDisabled ? 'bg-gray-100' : ''}`}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    disabled={isDisabled}
                >
                    {loading ? (
                        <option>Loading models...</option>
                    ) : availableModels.length > 0 ? (
                        availableModels.map(model => (
                            <option key={model.id} value={model.id}>
                                {model.name || model.id}
                            </option>
                        ))
                    ) : (
                        <option value="" disabled>No models found (Check Connection/Key)</option>
                    )}
                </select>
            </div>
            <Button
                variant="outline"
                size="icon"
                onClick={loadModels}
                title="Refresh Models"
                type="button"
                disabled={loading}
            >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
        </div>
    );
}
