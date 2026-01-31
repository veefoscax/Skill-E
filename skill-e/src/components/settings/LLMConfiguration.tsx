import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Check, ChevronDown, Eye, EyeOff, Sparkles, Loader2, RefreshCw } from 'lucide-react';
import { useSettingsStore, type LLMProvider, LLM_DEFAULTS } from '@/stores/settings';
import { ModelSelector } from '../shared/ModelSelector';

export function LLMConfiguration() {
    const {
        llmProvider,
        setLlmProvider,
        llmApiKey,
        setLlmApiKey,
        llmBaseUrl,
        setLlmBaseUrl,
        llmModel,
        setLlmModel,
    } = useSettingsStore();

    const [showApiKey, setShowApiKey] = useState(false);

    // Providers that typically allow/require Base URL editing
    const ALLOW_BASE_URL_EDIT = [
        'custom',
        'ollama',
        'moonshot',
        'kimi-code',
        'minimax',
        'qwen-portal',
        'xiaomi'
    ];

    return (
        <div className="space-y-4">
            {/* Provider Selector */}
            <div className="space-y-2">
                <Label className="text-xs font-medium">AI Provider</Label>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full justify-between h-9 text-sm">
                            <span className="flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-primary" />
                                {LLM_DEFAULTS[llmProvider]?.label || 'Select Provider'}
                            </span>
                            <ChevronDown className="h-4 w-4 opacity-50" />
                        </Button>
                    </DropdownMenuTrigger>
                    {/* High Z-Index to ensure it appears above Onboarding overlay */}
                    <DropdownMenuContent className="w-[300px] max-h-[300px] overflow-y-auto z-[20000]" align="start">
                        {(Object.keys(LLM_DEFAULTS) as LLMProvider[]).map((p) => (
                            <DropdownMenuItem
                                key={p}
                                onClick={() => {
                                    setLlmProvider(p);
                                    // Auto-fill defaults if empty or switching types
                                    if (LLM_DEFAULTS[p].baseUrl !== undefined) {
                                        setLlmBaseUrl(LLM_DEFAULTS[p].baseUrl!);
                                    }
                                    if (LLM_DEFAULTS[p].defaultModel) {
                                        setLlmModel(LLM_DEFAULTS[p].defaultModel);
                                    }
                                }}
                                className="justify-between cursor-pointer py-2"
                            >
                                <div className="flex flex-col">
                                    <span className="font-medium">{LLM_DEFAULTS[p].label}</span>
                                </div>
                                {llmProvider === p && <Check className="h-4 w-4 text-primary" />}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Base URL (Conditional) */}
            {ALLOW_BASE_URL_EDIT.includes(llmProvider) && (
                <div className="space-y-2">
                    <Label className="text-xs font-medium">Base URL</Label>
                    <Input
                        value={llmBaseUrl}
                        onChange={(e) => setLlmBaseUrl(e.target.value)}
                        placeholder="https://api.example.com/v1"
                        className="font-mono text-xs h-9"
                    />
                </div>
            )}

            {/* API Key */}
            {llmProvider !== 'ollama' && (
                <div className="space-y-2">
                    <Label className="text-xs font-medium">API Key</Label>
                    <div className="relative">
                        <Input
                            type={showApiKey ? 'text' : 'password'}
                            placeholder={llmProvider === 'anthropic' ? 'sk-ant-...' : 'sk-...'}
                            className="pr-10 text-xs h-9"
                            value={llmApiKey}
                            onChange={(e) => setLlmApiKey(e.target.value)}
                        />
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-9 w-9 text-muted-foreground hover:bg-transparent"
                            onClick={() => setShowApiKey(!showApiKey)}
                        >
                            {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                    </div>
                </div>
            )}

            {/* Model Selector (New Shared Component) */}
            <div className="space-y-2">
                <Label className="text-xs font-medium">Model Name</Label>
                <ModelSelector
                    provider={llmProvider}
                    baseUrl={llmBaseUrl}
                    apiKey={llmApiKey}
                    value={llmModel}
                    onChange={setLlmModel}
                />
                <p className="text-[10px] text-muted-foreground">
                    {llmProvider === 'moonshot' ? 'Recommended: moonshot-v1-8k' :
                        llmProvider === 'kimi-code' ? 'Target: kimi-for-coding' :
                            llmProvider === 'ollama' ? 'Select from your local models' :
                                llmProvider === 'google' ? 'gemini-pro or similar' :
                                    'Select target model'}
                </p>
            </div>
        </div>
    );
}
