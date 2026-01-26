import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useSettingsStore, WHISPER_MODEL_INFO, type WhisperModel } from '@/stores/settings';
import { validateWhisperApiKey } from '@/lib/whisper';
import { Loader2, Check, X, Eye, EyeOff, Cloud, HardDrive, Cpu, Zap } from 'lucide-react';

/**
 * Settings Component
 * 
 * Provides UI for configuring application settings including:
 * - Transcription mode (API cloud or Local whisper.cpp)
 * - Whisper model selection (tiny to turbo)
 * - GPU toggle for local transcription
 * - Whisper API key for cloud transcription
 * - Other API keys (Claude, OpenAI)
 * 
 * Requirements: FR-3.4, FR-3.6, FR-3.7
 */
export function Settings() {
  const {
    whisperApiKey,
    setWhisperApiKey,
    transcriptionMode,
    setTranscriptionMode,
    whisperModel,
    setWhisperModel,
    useGpu,
    setUseGpu,
  } = useSettingsStore();

  const [apiKeyInput, setApiKeyInput] = useState(whisperApiKey);
  const [isValidating, setIsValidating] = useState(false);
  const [validationStatus, setValidationStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');
  const [showApiKey, setShowApiKey] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  /**
   * Validate and save Whisper API key
   */
  const handleSaveApiKey = async () => {
    if (!apiKeyInput.trim()) {
      setErrorMessage('API key cannot be empty');
      setValidationStatus('invalid');
      return;
    }

    setIsValidating(true);
    setErrorMessage('');
    setValidationStatus('idle');

    try {
      const isValid = await validateWhisperApiKey(apiKeyInput.trim());

      if (isValid) {
        setWhisperApiKey(apiKeyInput.trim());
        setValidationStatus('valid');
        setErrorMessage('');
      } else {
        setValidationStatus('invalid');
        setErrorMessage('Invalid API key. Please check and try again.');
      }
    } catch (error) {
      setValidationStatus('invalid');
      setErrorMessage('Failed to validate API key. Please check your internet connection.');
      console.error('API key validation error:', error);
    } finally {
      setIsValidating(false);
    }
  };

  /**
   * Handle input change
   */
  const handleInputChange = (value: string) => {
    setApiKeyInput(value);
    setValidationStatus('idle');
    setErrorMessage('');
  };

  /**
   * Toggle API key visibility
   */
  const toggleApiKeyVisibility = () => {
    setShowApiKey(!showApiKey);
  };

  const models: WhisperModel[] = ['tiny', 'base', 'small', 'medium', 'large-v3', 'turbo'];

  return (
    <div className="w-full max-w-2xl mx-auto p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Settings</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Configure transcription and API preferences
        </p>
      </div>

      <Separator />

      {/* Transcription Mode Section */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium">Transcription Mode</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Choose between cloud API or local processing
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* API Cloud Option */}
          <button
            type="button"
            onClick={() => setTranscriptionMode('api')}
            className={`p-4 rounded-lg border-2 transition-all text-left ${transcriptionMode === 'api'
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-muted-foreground/50'
              }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <Cloud className={`h-5 w-5 ${transcriptionMode === 'api' ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className="font-medium">Cloud API</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Uses OpenAI Whisper API. Requires internet and API key. Best accuracy.
            </p>
          </button>

          {/* Local Option */}
          <button
            type="button"
            onClick={() => setTranscriptionMode('local')}
            className={`p-4 rounded-lg border-2 transition-all text-left ${transcriptionMode === 'local'
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-muted-foreground/50'
              }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <HardDrive className={`h-5 w-5 ${transcriptionMode === 'local' ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className="font-medium">Local (Offline)</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Uses whisper.cpp locally. No internet needed. Privacy-focused.
            </p>
          </button>
        </div>
      </div>

      <Separator />

      {/* Local Whisper Settings - Only show when local mode selected */}
      {transcriptionMode === 'local' && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium">Local Whisper Settings</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Configure local transcription model and performance
            </p>
          </div>

          {/* GPU Toggle */}
          <div className="flex items-center justify-between p-4 rounded-lg border bg-background/50">
            <div className="flex items-center gap-3">
              {useGpu ? (
                <Zap className="h-5 w-5 text-yellow-500" />
              ) : (
                <Cpu className="h-5 w-5 text-muted-foreground" />
              )}
              <div>
                <p className="font-medium">GPU Acceleration</p>
                <p className="text-xs text-muted-foreground">
                  {useGpu
                    ? 'Using GPU for faster transcription (Turbo model recommended)'
                    : 'Using CPU only (Tiny model recommended for speed)'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setUseGpu(!useGpu)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${useGpu ? 'bg-primary' : 'bg-muted'
                }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${useGpu ? 'translate-x-6' : 'translate-x-1'
                  }`}
              />
            </button>
          </div>

          {/* Model Selection */}
          <div className="space-y-2">
            <Label>Whisper Model (Multilingual)</Label>
            <div className="grid grid-cols-2 gap-2">
              {models.map((model) => {
                const info = WHISPER_MODEL_INFO[model];
                const isRecommended = useGpu ? model === 'turbo' : model === 'tiny';
                const isWarning = info.gpuRecommended && !useGpu;

                return (
                  <button
                    key={model}
                    type="button"
                    onClick={() => setWhisperModel(model)}
                    className={`p-3 rounded-lg border text-left transition-all ${whisperModel === model
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-muted-foreground/50'
                      } ${isWarning ? 'opacity-60' : ''}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{info.name}</span>
                      <span className="text-xs text-muted-foreground">{info.size}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{info.description}</p>
                    {isRecommended && (
                      <span className="mt-1 inline-block text-xs text-green-600 dark:text-green-400">
                        ✓ Recommended
                      </span>
                    )}
                    {isWarning && (
                      <span className="mt-1 inline-block text-xs text-yellow-600 dark:text-yellow-400">
                        ⚠ Slow without GPU
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              All models support Portuguese, English, and 90+ other languages.
              Model will be downloaded on first use.
            </p>
          </div>
        </div>
      )}

      {/* API Key Section - Only show when API mode selected */}
      {transcriptionMode === 'api' && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium">OpenAI Whisper API</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Enter your OpenAI API key for cloud transcription
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="whisper-api-key">API Key</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="whisper-api-key"
                  type={showApiKey ? 'text' : 'password'}
                  placeholder="sk-..."
                  value={apiKeyInput}
                  onChange={(e) => handleInputChange(e.target.value)}
                  className="pr-10"
                  disabled={isValidating}
                />
                <button
                  type="button"
                  onClick={toggleApiKeyVisibility}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  title={showApiKey ? 'Hide API key' : 'Show API key'}
                >
                  {showApiKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>

              <Button
                onClick={handleSaveApiKey}
                disabled={isValidating || !apiKeyInput.trim()}
                className="min-w-[100px]"
              >
                {isValidating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Validating
                  </>
                ) : (
                  'Save'
                )}
              </Button>
            </div>

            {/* Validation Status */}
            {validationStatus === 'valid' && (
              <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                <Check className="h-4 w-4" />
                <span>API key validated and saved successfully</span>
              </div>
            )}

            {validationStatus === 'invalid' && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <X className="h-4 w-4" />
                <span>{errorMessage}</span>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Get your API key from{' '}
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground transition-colors"
              >
                OpenAI Platform
              </a>
              . Pricing: $0.006/minute of audio.
            </p>
          </div>
        </div>
      )}

      <Separator />

      {/* Current Configuration Summary */}
      <div className="p-4 rounded-lg bg-muted/50">
        <h4 className="font-medium mb-2">Current Configuration</h4>
        <div className="space-y-1 text-sm">
          <p>
            <span className="text-muted-foreground">Mode:</span>{' '}
            <span className="font-medium">
              {transcriptionMode === 'api' ? 'Cloud API' : 'Local (Offline)'}
            </span>
          </p>
          {transcriptionMode === 'local' && (
            <>
              <p>
                <span className="text-muted-foreground">Model:</span>{' '}
                <span className="font-medium">
                  {WHISPER_MODEL_INFO[whisperModel].name} ({WHISPER_MODEL_INFO[whisperModel].size})
                </span>
              </p>
              <p>
                <span className="text-muted-foreground">GPU:</span>{' '}
                <span className="font-medium">{useGpu ? 'Enabled' : 'Disabled'}</span>
              </p>
            </>
          )}
          {transcriptionMode === 'api' && (
            <p>
              <span className="text-muted-foreground">API Key:</span>{' '}
              <span className="font-medium">
                {whisperApiKey ? `${whisperApiKey.slice(0, 7)}...${whisperApiKey.slice(-4)}` : 'Not configured'}
              </span>
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-2">
            Supports: Portuguese, English, Spanish, and 90+ languages
          </p>
        </div>
      </div>
    </div>
  );
}
