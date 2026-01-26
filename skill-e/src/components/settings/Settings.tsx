import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSettingsStore, WHISPER_MODEL_INFO, type WhisperModel } from '@/stores/settings';
import { validateWhisperApiKey } from '@/lib/whisper';
import { Loader2, Check, X, Eye, EyeOff, Cloud, HardDrive, Cpu, Zap, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getCurrentWindow } from '@tauri-apps/api/window';

/**
 * Settings Component (Compact)
 * 
 * Provides compact UI for configuring application settings.
 * Designed for small window without system decorations.
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

  const handleClose = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const window = getCurrentWindow();
    await window.hide();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSaveApiKey = async () => {
    if (!apiKeyInput.trim()) return;
    setIsValidating(true);
    try {
      const isValid = await validateWhisperApiKey(apiKeyInput.trim());
      if (isValid) {
        setWhisperApiKey(apiKeyInput.trim());
        setValidationStatus('valid');
      } else {
        setValidationStatus('invalid');
      }
    } catch (error) {
      setValidationStatus('invalid');
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background text-foreground text-sm border border-border">
      {/* Custom Title Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/50 select-none relative h-10">
        {/* Drag Region Layer */}
        <div className="absolute inset-0 z-0" data-tauri-drag-region />

        <span className="font-semibold relative z-10 pointer-events-none text-xs uppercase tracking-wider">Settings</span>

        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 relative z-20 hover:bg-destructive/10 hover:text-destructive cursor-pointer"
          onClick={handleClose}
          title="Close (Esc)"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">

        {/* Transcription Mode */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground uppercase">Transcription Mode</Label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setTranscriptionMode('api')}
              className={`flex flex-col items-center justify-center p-3 rounded-md border transition-all ${transcriptionMode === 'api'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card hover:bg-muted border-input'
                }`}
            >
              <Cloud className="h-5 w-5 mb-1" />
              <span className="font-medium text-xs">Cloud API</span>
            </button>
            <button
              onClick={() => setTranscriptionMode('local')}
              className={`flex flex-col items-center justify-center p-3 rounded-md border transition-all ${transcriptionMode === 'local'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card hover:bg-muted border-input'
                }`}
            >
              <HardDrive className="h-5 w-5 mb-1" />
              <span className="font-medium text-xs">Local</span>
            </button>
          </div>
        </div>

        {/* Local Settings */}
        {transcriptionMode === 'local' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
            {/* GPU Toggle */}
            <div className="flex items-center justify-between p-3 rounded-md border bg-card">
              <div className="flex items-center gap-2">
                {useGpu ? <Zap className="h-4 w-4 text-yellow-500" /> : <Cpu className="h-4 w-4" />}
                <div className="flex flex-col">
                  <span className="font-medium">GPU Acceleration</span>
                  <span className="text-[10px] text-muted-foreground">{useGpu ? 'Turbo Model Rec.' : 'Tiny Model Rec.'}</span>
                </div>
              </div>
              <button
                onClick={() => setUseGpu(!useGpu)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${useGpu ? 'bg-primary' : 'bg-muted'
                  }`}
              >
                <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${useGpu ? 'translate-x-5' : 'translate-x-1'
                  }`} />
              </button>
            </div>

            {/* Model Dropdown */}
            <div className="space-y-1">
              <Label className="text-xs">Whisper Model</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    <span className="flex items-center gap-2">
                      <span>{WHISPER_MODEL_INFO[whisperModel].name}</span>
                      <span className="text-xs text-muted-foreground">({WHISPER_MODEL_INFO[whisperModel].size})</span>
                    </span>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[280px]">
                  {(['tiny', 'base', 'small', 'medium', 'turbo', 'large-v3'] as WhisperModel[]).map((model) => (
                    <DropdownMenuItem
                      key={model}
                      onClick={() => setWhisperModel(model)}
                      className="justify-between"
                    >
                      <span>{WHISPER_MODEL_INFO[model].name}</span>
                      <span className="text-xs text-muted-foreground">{WHISPER_MODEL_INFO[model].size}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        )}

        {/* API Settings */}
        {transcriptionMode === 'api' && (
          <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
            <Label className="text-xs">OpenAI API Key</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  type={showApiKey ? 'text' : 'password'}
                  placeholder="sk-..."
                  value={apiKeyInput}
                  onChange={(e) => {
                    setApiKeyInput(e.target.value);
                    setValidationStatus('idle');
                  }}
                  className="pr-8 h-9 text-xs"
                />
                <button
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showApiKey ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                </button>
              </div>
              <Button
                size="sm"
                onClick={handleSaveApiKey}
                disabled={isValidating || !apiKeyInput.trim()}
                className="w-16 h-9"
              >
                {isValidating ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Save'}
              </Button>
            </div>

            {validationStatus === 'valid' && (
              <p className="text-[10px] text-green-600 flex items-center gap-1">
                <Check className="h-3 w-3" /> API Key valid
              </p>
            )}
            {validationStatus === 'invalid' && (
              <p className="text-[10px] text-destructive flex items-center gap-1">
                <X className="h-3 w-3" /> Invalid API Key
              </p>
            )}
          </div>
        )}
      </div>

      <div className="p-3 border-t bg-muted/20 text-[10px] text-center text-muted-foreground">
        Skill-E v0.1.0 • Settings auto-save
      </div>
    </div>
  );
}
