import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useSettingsStore, WHISPER_MODEL_INFO, type WhisperModel, type LLMProvider, type TranscriptionMode, LLM_DEFAULTS } from '../../stores/settings';
import { checkModelExists, downloadModel, getModelInfo } from '../../lib/whisper';
import { ArrowRight, Check, Loader2, Sparkles, HardDrive, Download, Cpu, ChevronDown, Cloud } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import robotPeeking from '../../assets/robot-peeking.png';
import { LLMConfiguration } from '../settings/LLMConfiguration';

interface OnboardingProps {
    onComplete: () => void;
}

type Step = 'welcome' | 'api-setup' | 'whisper-setup' | 'finish';

export function OnboardingScreen({ onComplete }: OnboardingProps) {
    const [step, setStep] = useState<Step>('welcome');
    const {
        setLlmProvider,
        setLlmApiKey,
        setLlmBaseUrl,
        setLlmModel,
        llmProvider,
        llmApiKey,
        llmBaseUrl,
        llmModel,
        setOnboardingCompleted,
        setTranscriptionMode,
        setUseGpu,
        setWhisperModel,
        whisperModel: savedWhisperModel
    } = useSettingsStore();

    // API Step State
    const [isValidating, setIsValidating] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);

    // Whisper Step State
    const [transcriptionMethod, setTranscriptionMethod] = useState<'local' | 'api'>('local');
    const [openaiKey, setOpenaiKey] = useState('');
    const [modelStatus, setModelStatus] = useState<'checking' | 'found' | 'missing' | 'downloading'>('checking');
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [gpuStatus, setGpuStatus] = useState<'unknown' | 'detected' | 'not-found'>('unknown');
    const [selectedModel, setSelectedModel] = useState<WhisperModel>('turbo');

    // --- Steps Logic ---

    const handleNextToApi = () => setStep('api-setup');

    const handleValidateApi = async () => {
        setIsValidating(true);
        setApiError(null);
        try {
            const isOllama = llmProvider === 'ollama';
            const hasKey = llmApiKey && llmApiKey.length > 3;

            if (isOllama || hasKey) {
                setStep('whisper-setup');
            } else {
                setApiError('Please enter a valid API Key.');
            }
        } catch (e) {
            setApiError('Validation failed: ' + String(e));
        } finally {
            setIsValidating(false);
        }
    };

    const handleSkipApi = () => {
        setStep('whisper-setup');
    };

    // Check Whisper status on mount of whisper step
    useEffect(() => {
        if (step === 'whisper-setup') {
            checkGpu();
        }
    }, [step]);

    // Re-check model when selection changes or GPU check finishes
    useEffect(() => {
        if (step === 'whisper-setup' && transcriptionMethod === 'local') {
            checkWhisper();
        }
    }, [step, selectedModel, transcriptionMethod]);

    const checkGpu = async () => {
        try {
            const info = await invoke<string>('check_compute_capability');
            if (info.toLowerCase().includes('cuda') || info.toLowerCase().includes('metal')) {
                setGpuStatus('detected');
                setUseGpu(true);
                if (savedWhisperModel === 'tiny' || !savedWhisperModel) {
                    setSelectedModel('turbo');
                }
            } else {
                setGpuStatus('not-found');
                setUseGpu(false);
            }
        } catch (e) {
            console.warn('GPU check failed', e);
            setGpuStatus('not-found');
        }
    }

    const checkWhisper = async () => {
        setModelStatus('checking');
        try {
            const exists = await checkModelExists(selectedModel);
            setModelStatus(exists ? 'found' : 'missing');
            setTranscriptionMode('local_whisper');
        } catch (e) {
            console.error(e);
            setModelStatus('missing');
        }
    };

    const handleDownloadModel = async () => {
        setModelStatus('downloading');
        setDownloadProgress(0);
        try {
            const info = await getModelInfo(selectedModel);
            const totalBytes = info.sizeBytes || 75000000;

            await downloadModel(selectedModel, (downloaded) => {
                const percentage = Math.round((downloaded / totalBytes) * 100);
                setDownloadProgress(Math.min(percentage, 100));
            });

            setDownloadProgress(100);
            setModelStatus('found');
            setWhisperModel(selectedModel);
        } catch (e) {
            console.error('Download failed', e);
            setModelStatus('missing');
            alert('Failed to download model: ' + String(e));
        }
    };

    const handleFinish = () => {
        setOnboardingCompleted(true);
        const mode: TranscriptionMode = transcriptionMethod === 'local' ? 'local_whisper' : 'cloud_openai';
        setTranscriptionMode(mode);

        if (transcriptionMethod === 'local') {
            setWhisperModel(selectedModel);
        }
        // API Key logic removed as store doesn't support it yet and focus is local

        onComplete();
    };

    // --- Render ---

    return (
        <div className="fixed inset-0 bg-background flex flex-col items-center justify-center p-8 pb-40 z-[10000]">

            {/* Robot Mascot Peeking Over Top */}
            <div className="relative w-48 -mb-4 z-20 pointer-events-none">
                <img
                    src={robotPeeking}
                    alt="Skill-E Robot"
                    className="w-full h-auto object-contain drop-shadow-lg"
                />
            </div>

            <div className="relative max-w-md w-full bg-card border rounded-xl shadow-2xl flex flex-col items-center text-center p-8 space-y-6 animate-in zoom-in-95 duration-300 z-10">

                {/* Step 1: Welcome */}
                {step === 'welcome' && (
                    <div className="space-y-6 pt-2 animate-in fade-in zoom-in-95 duration-300">
                        <h1 className="text-2xl font-bold tracking-tight">Welcome to Skill-E</h1>
                        <p className="text-muted-foreground">
                            Create AI Agents simply by showing them what to do.
                            <br />We'll record your screen and voice to generate executable skills.
                        </p>
                        <Button className="w-full" onClick={handleNextToApi}>
                            Get Started <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </div>
                )}

                {/* Step 2: LLM Configuration */}
                {step === 'api-setup' && (
                    <div className="space-y-6 w-full animate-in slide-in-from-right-10 duration-300 pt-2">
                        <div className="text-left space-y-2">
                            <h2 className="text-xl font-semibold flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-primary" />
                                Connect Intelligence
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                Select your LLM provider to generate skills.
                            </p>
                        </div>

                        <div className="space-y-4 p-4 bg-muted/30 rounded-lg border text-left">
                            <LLMConfiguration />
                        </div>

                        <div className="space-y-2">
                            <Button className="w-full" onClick={handleValidateApi} disabled={isValidating || (llmProvider !== 'ollama' && !llmApiKey)}>
                                {isValidating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                                {isValidating ? 'Verifying...' : 'Connect & Continue'}
                            </Button>

                            <Button variant="ghost" className="w-full text-muted-foreground" onClick={handleSkipApi}>
                                Skip for now
                            </Button>
                        </div>
                    </div>
                )}

                {/* Step 3: Transcription Setup */}
                {step === 'whisper-setup' && (
                    <div className="space-y-6 w-full animate-in slide-in-from-right-10 duration-300 pt-2">
                        <div className="text-left space-y-2">
                            <h2 className="text-xl font-semibold flex items-center gap-2">
                                <HardDrive className="w-5 h-5 text-primary" />
                                Voice Transcription
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                Choose how to process your voice commands.
                            </p>
                        </div>

                        {/* Toggle Method */}
                        <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-lg">
                            <button
                                onClick={() => setTranscriptionMethod('local')}
                                className={`py-2 px-4 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 ${transcriptionMethod === 'local'
                                    ? 'bg-background shadow text-foreground'
                                    : 'text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                <HardDrive className="w-4 h-4" /> Local (Free)
                            </button>
                            <button
                                onClick={() => setTranscriptionMethod('api')}
                                className={`py-2 px-4 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 ${transcriptionMethod === 'api'
                                    ? 'bg-background shadow text-foreground'
                                    : 'text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                <Cloud className="w-4 h-4" /> OpenAI API
                            </button>
                        </div>

                        {/* Local Configuration */}
                        {transcriptionMethod === 'local' && (
                            <div className="p-4 bg-muted/50 rounded-lg space-y-4 animate-in fade-in slide-in-from-top-2">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-sm font-medium">Whisper Model</Label>
                                        <div className="flex items-center gap-2">
                                            {modelStatus === 'checking' && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                                            {modelStatus === 'found' && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded flex items-center gap-1"><Check className="w-3 h-3" /> Ready</span>}
                                            {modelStatus === 'missing' && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">Not Installed</span>}
                                            {modelStatus === 'downloading' && <span className="text-xs text-primary">{downloadProgress}%</span>}
                                        </div>
                                    </div>

                                    <div className="relative">
                                        <select
                                            className="w-full p-2 pr-8 bg-background border rounded-md text-sm appearance-none cursor-pointer focus:ring-2 focus:ring-primary/20"
                                            value={selectedModel}
                                            onChange={(e) => setSelectedModel(e.target.value as WhisperModel)}
                                            disabled={modelStatus === 'downloading'}
                                        >
                                            {Object.entries(WHISPER_MODEL_INFO).map(([id, info]) => (
                                                <option key={id} value={id}>
                                                    {info.name} ({info.size}) {info.gpuRecommended ? '- GPU Rec.' : ''}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                                    </div>

                                    <p className="text-xs text-muted-foreground">
                                        {WHISPER_MODEL_INFO[selectedModel].description}
                                    </p>
                                </div>

                                {modelStatus === 'downloading' && (
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div className="bg-primary h-2 rounded-full transition-all duration-300" style={{ width: `${downloadProgress}%` }} />
                                    </div>
                                )}

                                <div className="flex items-center justify-between pt-2 border-t">
                                    <span className="text-sm font-medium flex items-center gap-2">
                                        <Cpu className="w-4 h-4" /> Hardware Accel
                                    </span>
                                    {gpuStatus === 'detected' ? (
                                        <span className="text-xs text-green-600 font-medium">GPU Detected</span>
                                    ) : (
                                        <span className="text-xs text-muted-foreground">CPU Mode</span>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* API Configuration */}
                        {transcriptionMethod === 'api' && (
                            <div className="space-y-3 text-left animate-in fade-in slide-in-from-top-2 p-4 bg-muted/50 rounded-lg">
                                <div className="space-y-1">
                                    <Label>OpenAI API Key</Label>
                                    <Input
                                        type="password"
                                        placeholder="sk-..."
                                        value={openaiKey}
                                        onChange={(e) => setOpenaiKey(e.target.value)}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Required for cloud transcription. Not needed if using Local mode.
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            {transcriptionMethod === 'local' ? (
                                modelStatus === 'found' ? (
                                    <Button className="w-full" onClick={handleFinish}>
                                        Finish Setup <ArrowRight className="w-4 h-4 ml-2" />
                                    </Button>
                                ) : (
                                    <Button className="w-full" onClick={handleDownloadModel} disabled={modelStatus === 'downloading' || modelStatus === 'checking'}>
                                        {modelStatus === 'downloading' ? 'Downloading...' : `Download ${WHISPER_MODEL_INFO[selectedModel].name} Model`}
                                        {!['downloading', 'checking'].includes(modelStatus) && <Download className="w-4 h-4 ml-2" />}
                                    </Button>
                                )
                            ) : (
                                <Button className="w-full" onClick={handleFinish} disabled={!openaiKey}>
                                    Finish Setup <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            )}

                            <Button variant="ghost" className="w-full text-muted-foreground" onClick={handleFinish} disabled={modelStatus === 'downloading'}>
                                Skip (Configure later)
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
