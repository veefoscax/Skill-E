import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useSettingsStore } from '@/stores/settings';
import { validateWhisperApiKey } from '@/lib/whisper';
import { Loader2, Check, X, Eye, EyeOff } from 'lucide-react';

/**
 * Settings Component
 * 
 * Provides UI for configuring application settings including:
 * - Whisper API key for audio transcription
 * - Other API keys (Claude, OpenAI)
 * - Recording preferences
 * 
 * Requirements: FR-3.4
 */
export function Settings() {
  const { whisperApiKey, setWhisperApiKey } = useSettingsStore();
  
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

  return (
    <div className="w-full max-w-2xl mx-auto p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Settings</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Configure your API keys and preferences
        </p>
      </div>

      <Separator />

      {/* Whisper API Key Section */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium">Audio Transcription</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Configure OpenAI Whisper API for voice transcription
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="whisper-api-key">Whisper API Key</Label>
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
          </p>
        </div>
      </div>

      <Separator />

      {/* Future sections can be added here */}
      <div className="space-y-4 opacity-50">
        <div>
          <h3 className="text-lg font-medium">Recording Settings</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Coming soon: Configure capture quality and intervals
          </p>
        </div>
      </div>
    </div>
  );
}
