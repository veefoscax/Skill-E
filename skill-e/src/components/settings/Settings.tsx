import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  useSettingsStore,
  WHISPER_MODEL_INFO,
  type WhisperModel,
} from '@/stores/settings'
import { validateWhisperApiKey } from '@/lib/whisper'
import { validateClaudeApiKey } from '@/lib/claude-api'
import { checkComputeCapability, checkModelExists, downloadModel } from '@/lib/whisper-local'
import { AudioLevelMeter } from '@/components/AudioLevelMeter'
import {
  Loader2,
  Check,
  X,
  Eye,
  EyeOff,
  Cloud,
  HardDrive,
  Cpu,
  Zap,
  ChevronDown,
  Mic,
  MicOff,
  FolderOpen,
  Settings2,
  Activity,
  DownloadCloud,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { open } from '@tauri-apps/plugin-dialog'
import { LLMConfiguration } from './LLMConfiguration'
import { DebugPanel } from './DebugPanel'

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
    claudeApiKey,
    setClaudeApiKey,
    transcriptionMode,
    setTranscriptionMode,
    whisperModel,
    setWhisperModel,
    useGpu,
    setUseGpu,
    sidecarEnabled,
    setSidecarEnabled,
    sidecarPort,
    setSidecarPort,
    selectedMicId,
    setSelectedMicId,
    outputDir,
    setOutputDir,
    dayModeEnabled,
    setDayModeEnabled,
    segmentDurationMinutes,
    setSegmentDurationMinutes,
    autoProcessSessions,
    setAutoProcessSessions,
    rawRetentionDays,
    setRawRetentionDays,
    storageBudgetGb,
    setStorageBudgetGb,
    // LLM state is managed by LLMConfiguration via store
    llmProvider,
    llmApiKey,
    setLlmProvider,
    setLlmApiKey,
    llmBaseUrl,
    setLlmBaseUrl,
    llmModel,
    setLlmModel,
  } = useSettingsStore()

  const [devices, setDevices] = useState<{ deviceId: string; label: string }[]>([])
  
  // Whisper Model Management State
  const [modelExists, setModelExists] = useState(true)
  const [isDownloadingModel, setIsDownloadingModel] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState(0)

  // Enumerate audio devices
  useEffect(() => {
    const updateDevices = () => {
      navigator.mediaDevices.enumerateDevices().then(devs => {
        const inputs = devs.filter(d => d.kind === 'audioinput')
        setDevices(
          inputs.map(d => ({
            deviceId: d.deviceId,
            label: d.label || `Microphone ${d.deviceId.slice(0, 5)}`,
          }))
        )
      })
    }
    updateDevices()
    navigator.mediaDevices.addEventListener('devicechange', updateDevices)
    return () => navigator.mediaDevices.removeEventListener('devicechange', updateDevices)
  }, [])

  // Check if selected model exists
  useEffect(() => {
    if (transcriptionMode === 'local_whisper') {
      checkModelExists(whisperModel)
        .then(exists => setModelExists(exists))
        .catch(err => console.warn('Failed to check model existence:', err))
    }
  }, [whisperModel, transcriptionMode])

  const handleDownloadModel = async () => {
    if (isDownloadingModel) return
    
    setIsDownloadingModel(true)
    setDownloadProgress(0)
    
    try {
      await downloadModel(whisperModel, (percentage) => {
        setDownloadProgress(percentage)
      })
      setModelExists(true)
    } catch (error) {
      console.error('Failed to download model:', error)
      alert(`Download failed: ${error}`)
    } finally {
      setIsDownloadingModel(false)
    }
  }

  const [apiKeyInput, setApiKeyInput] = useState(whisperApiKey)
  const [isValidating, setIsValidating] = useState(false)
  const [validationStatus, setValidationStatus] = useState<'idle' | 'valid' | 'invalid'>('idle')
  const [showApiKey, setShowApiKey] = useState(false)

  // Claude API Key State
  const [claudeApiKeyInput, setClaudeApiKeyInput] = useState(claudeApiKey)
  const [isValidatingClaude, setIsValidatingClaude] = useState(false)
  const [claudeValidationStatus, setClaudeValidationStatus] = useState<
    'idle' | 'valid' | 'invalid'
  >('idle')
  const [showClaudeApiKey, setShowClaudeApiKey] = useState(false)

  // Microphone Test State
  const [isTestingMic, setIsTestingMic] = useState(false)
  const [micStream, setMicStream] = useState<MediaStream | null>(null)
  const [micError, setMicError] = useState<string | null>(null)

  // GPU State
  const [gpuType, setGpuType] = useState<'cpu' | 'cuda' | 'metal'>('cpu')
  const [checkingGpu, setCheckingGpu] = useState(true)
  const [gpuDebugInfo, setGpuDebugInfo] = useState<string>('')

  useEffect(() => {
    // Check GPU capability on mount
    checkComputeCapability()
      .then(result => {
        console.log('Detected GPU capability:', result)

        const resLower = result.toLowerCase()
        let type: 'cpu' | 'cuda' | 'metal' = 'cpu'

        if (resLower.includes('cuda')) type = 'cuda'
        else if (resLower.includes('metal')) type = 'metal'

        setGpuType(type)

        if (type === 'cpu' && result.length > 3) {
          // Remove "cpu" prefix if present and keep details
          setGpuDebugInfo(result.replace(/^cpu\s*/i, ''))
        }

        setCheckingGpu(false)

        if (type !== 'cpu' && !useGpu) {
          // Optional: could auto-enable here
        }
      })
      .catch(err => {
        console.error('Failed to check GPU:', err)
        setGpuDebugInfo(`Check failed: ${err}`)
        setCheckingGpu(false)
      })
  }, [])

  const handleToggleMicTest = async () => {
    if (isTestingMic) {
      if (micStream) {
        micStream.getTracks().forEach(track => track.stop())
        setMicStream(null)
      }
      setIsTestingMic(false)
    } else {
      setMicError(null)
      try {
        const constraints = {
          audio: selectedMicId !== 'default' ? { deviceId: { exact: selectedMicId } } : true,
        }
        const stream = await navigator.mediaDevices.getUserMedia(constraints)
        setMicStream(stream)
        setIsTestingMic(true)
      } catch (err) {
        console.error('Microphone access denied:', err)
        setMicError('Access denied. Check system permissions.')
      }
    }
  }

  useEffect(() => {
    return () => {
      if (micStream) {
        micStream.getTracks().forEach(track => track.stop())
      }
    }
  }, [micStream])

  const handleClose = async (e?: React.MouseEvent) => {
    e?.stopPropagation()
    const window = getCurrentWindow()
    await window.hide()
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleSaveApiKey = async () => {
    setIsValidating(true)
    const isValid = await validateWhisperApiKey(apiKeyInput)
    setIsValidating(false)

    if (isValid) {
      setValidationStatus('valid')
      setWhisperApiKey(apiKeyInput)
      setTimeout(() => setValidationStatus('idle'), 2000)
    } else {
      setValidationStatus('invalid')
    }
  }

  const handleSaveClaudeApiKey = async () => {
    setIsValidatingClaude(true)
    const isValid = await validateClaudeApiKey(claudeApiKeyInput)
    setIsValidatingClaude(false)

    if (isValid) {
      setClaudeValidationStatus('valid')
      setClaudeApiKey(claudeApiKeyInput)
      setTimeout(() => setClaudeValidationStatus('idle'), 2000)
    } else {
      setClaudeValidationStatus('invalid')
    }
  }

  // Ensure valid transcription mode on mount
  useEffect(() => {
    // No-op validation for now as types are enforced
  }, [transcriptionMode, setTranscriptionMode])

  const uiTranscriptionMode = transcriptionMode === 'cloud_openai' ? 'api' : 'local'

  return (
    <div className="h-full w-full flex flex-col bg-background text-foreground select-none border rounded-lg shadow-xl overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between p-3 border-b bg-muted/50 drag-region"
        data-tauri-drag-region
      >
        <div className="flex items-center gap-2">
          <Settings2 className="h-4 w-4" />
          <span className="font-semibold text-sm">Settings</span>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Microphone Test Section */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground uppercase">Microphone</Label>
          <div className="p-3 rounded-md border bg-card space-y-3">
            {/* Device Selection */}
            <div className="space-y-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-between h-7 text-xs px-2"
                  >
                    <span className="truncate flex-1 text-left">
                      {selectedMicId === 'default'
                        ? 'Default Microphone'
                        : devices.find(d => d.deviceId === selectedMicId)?.label ||
                          'Unknown Device'}
                    </span>
                    <ChevronDown className="h-3 w-3 opacity-50 flex-shrink-0" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[260px]" align="start">
                  <DropdownMenuItem onClick={() => setSelectedMicId('default')}>
                    Default Microphone
                    {selectedMicId === 'default' && <Check className="ml-auto h-3 w-3" />}
                  </DropdownMenuItem>
                  {devices.map(device => (
                    <DropdownMenuItem
                      key={device.deviceId}
                      onClick={() => setSelectedMicId(device.deviceId)}
                    >
                      <span className="truncate flex-1">{device.label}</span>
                      {device.deviceId === selectedMicId && <Check className="ml-auto h-3 w-3" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">Test Input</span>
              <Button
                size="sm"
                variant={isTestingMic ? 'destructive' : 'secondary'}
                className="h-6 text-xs px-2"
                onClick={handleToggleMicTest}
              >
                {isTestingMic ? (
                  <>
                    <MicOff className="h-3 w-3 mr-1" /> Stop
                  </>
                ) : (
                  <>
                    <Mic className="h-3 w-3 mr-1" /> Test
                  </>
                )}
              </Button>
            </div>

            {micError && <p className="text-xs text-destructive truncate">{micError}</p>}

            {(isTestingMic || micStream) && (
              <AudioLevelMeter audioStream={micStream} isActive={isTestingMic} />
            )}
          </div>
        </div>

        {/* Transcription Mode */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground uppercase">
            Transcription Mode
          </Label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setTranscriptionMode('cloud_openai')}
              className={`flex flex-col items-center justify-center p-3 rounded-md border transition-all ${
                uiTranscriptionMode === 'api'
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card hover:bg-muted border-input'
              }`}
            >
              <Cloud className="h-5 w-5 mb-1" />
              <span className="font-medium text-xs">Cloud API</span>
            </button>
            <button
              onClick={() => setTranscriptionMode('local_whisper')}
              className={`flex flex-col items-center justify-center p-3 rounded-md border transition-all ${
                uiTranscriptionMode === 'local'
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
        {uiTranscriptionMode === 'local' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
            {/* GPU Toggle */}
            <div
              className={`flex items-center justify-between p-3 rounded-md border ${
                gpuType === 'cpu' && !checkingGpu ? 'bg-muted/30 border-dashed' : 'bg-card'
              }`}
            >
              <div className="flex items-center gap-2">
                {useGpu ? <Zap className="h-4 w-4 text-yellow-500" /> : <Cpu className="h-4 w-4" />}
                <div className="flex flex-col">
                  <span className="font-medium text-xs">GPU Acceleration</span>
                  <span
                    className={`text-[10px] truncate max-w-[180px] ${
                      gpuType === 'cuda'
                        ? 'text-green-600 font-medium'
                        : gpuType === 'metal'
                          ? 'text-blue-600 font-medium'
                          : 'text-muted-foreground'
                    }`}
                    title={gpuDebugInfo || (checkingGpu ? 'Checking...' : 'Hardware Status')}
                  >
                    {checkingGpu
                      ? 'Checking...'
                      : gpuType === 'cuda'
                        ? 'NVIDIA CUDA Detected'
                        : gpuType === 'metal'
                          ? 'Apple Metal Detected'
                          : 'CPU Only'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setUseGpu(!useGpu)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  useGpu ? 'bg-primary' : 'bg-muted'
                }`}
                title={gpuDebugInfo ? `Details: ${gpuDebugInfo}` : 'Toggle GPU'}
              >
                <span
                  className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                    useGpu ? 'translate-x-5' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Model Dropdown */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Whisper Model</Label>
                {modelExists ? (
                  <span className="text-[10px] text-green-600 flex items-center gap-1"><Check className="w-3 h-3"/> Downloaded</span>
                ) : (
                  <span className="text-[10px] text-amber-600 flex items-center gap-1"><Cloud className="w-3 h-3"/> Not locally available</span>
                )}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between h-8 text-xs">
                    <span className="flex items-center gap-2">
                      <span>{WHISPER_MODEL_INFO[whisperModel].name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({WHISPER_MODEL_INFO[whisperModel].size})
                      </span>
                    </span>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[280px]">
                  {(['tiny', 'base', 'small', 'medium', 'turbo', 'large-v3'] as WhisperModel[]).map(
                    model => (
                      <DropdownMenuItem
                        key={model}
                        onClick={() => setWhisperModel(model)}
                        className="justify-between"
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">{WHISPER_MODEL_INFO[model].name}</span>
                          <span className="text-xs text-muted-foreground">
                            {WHISPER_MODEL_INFO[model].description}
                          </span>
                        </div>
                        {whisperModel === model && <Check className="h-4 w-4" />}
                      </DropdownMenuItem>
                    )
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Download UI */}
              {!modelExists && (
                <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-md">
                  {isDownloadingModel ? (
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-medium text-amber-800">
                        <span>Downloading model...</span>
                        <span>{downloadProgress}%</span>
                      </div>
                      <div className="w-full bg-amber-200 rounded-full h-1.5">
                        <div 
                          className="bg-amber-600 h-1.5 rounded-full transition-all duration-300" 
                          style={{ width: `${downloadProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-amber-800">Model required for offline use</span>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-6 text-[10px] border-amber-300 text-amber-700 hover:bg-amber-100"
                        onClick={handleDownloadModel}
                      >
                        <DownloadCloud className="w-3 h-3 mr-1" />
                        Download
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* API Settings */}
        {uiTranscriptionMode === 'api' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
            <div className="space-y-2">
              <Label className="text-xs">OpenAI Whisper API Key</Label>
              <div className="relative">
                <Input
                  type={showApiKey ? 'text' : 'password'}
                  placeholder="sk-..."
                  className="pr-20 text-xs h-8"
                  value={apiKeyInput}
                  onChange={e => {
                    setApiKeyInput(e.target.value)
                    if (validationStatus !== 'idle') setValidationStatus('idle')
                  }}
                />
                <div className="absolute right-1 top-1 flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </Button>
                  <Button
                    size="sm"
                    className="h-6 text-[10px] px-2"
                    disabled={isValidating || !apiKeyInput}
                    onClick={handleSaveApiKey}
                  >
                    {isValidating ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Save'}
                  </Button>
                </div>
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
              <p className="text-[10px] text-muted-foreground">Your key is stored locally.</p>
            </div>
          </div>
        )}

        {/* LLM Configuration Component */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground uppercase">
            Skill Generation (LLM)
          </Label>
          <div className="p-3 rounded-md border bg-card text-left">
            <LLMConfiguration />
          </div>
        </div>

        {/* Output Directory */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground uppercase">
            Session Storage
          </Label>
          <div className="flex gap-2">
            <Input
              value={outputDir || 'Default (Documents/Skill-E)'}
              readOnly
              className="text-xs h-7 flex-1"
              title={outputDir || 'Default'}
            />
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2"
              onClick={async () => {
                try {
                  const selected = await open({
                    directory: true,
                    multiple: false,
                  })
                  if (selected) setOutputDir(selected as string)
                } catch (e) {
                  console.error(e)
                }
              }}
            >
              <FolderOpen className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Work Diary */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground uppercase">
            Work Diary
          </Label>
          <div className="p-3 rounded-md border bg-card space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="font-medium text-xs">Enable continuous work diary capture</span>
                <span className="text-[10px] text-muted-foreground">
                  Record short work segments back-to-back, then summarize the day in the background.
                </span>
              </div>
              <button
                onClick={() => setDayModeEnabled(!dayModeEnabled)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  dayModeEnabled ? 'bg-primary' : 'bg-muted'
                }`}
              >
                <span
                  className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                    dayModeEnabled ? 'translate-x-5' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-[11px]">Segment Minutes</Label>
                <Input
                  type="number"
                  min={1}
                  max={60}
                  value={segmentDurationMinutes}
                  onChange={e => setSegmentDurationMinutes(Math.max(1, Number(e.target.value) || 1))}
                  className="h-7 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px]">Raw Retention (days)</Label>
                <Input
                  type="number"
                  min={1}
                  max={30}
                  value={rawRetentionDays}
                  onChange={e => setRawRetentionDays(Math.max(1, Number(e.target.value) || 1))}
                  className="h-7 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px]">Storage Budget (GB)</Label>
                <Input
                  type="number"
                  min={0.5}
                  step={0.5}
                  value={storageBudgetGb}
                  onChange={e => setStorageBudgetGb(Math.max(0.5, Number(e.target.value) || 0.5))}
                  className="h-7 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px]">Auto Process</Label>
                <button
                  onClick={() => setAutoProcessSessions(!autoProcessSessions)}
                  className={`relative inline-flex h-7 w-full items-center rounded-md border px-3 text-xs transition-colors ${
                    autoProcessSessions
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-muted text-muted-foreground border-input'
                  }`}
                >
                  {autoProcessSessions ? 'Background queue enabled' : 'Queue paused'}
                </button>
              </div>
            </div>

            <p className="text-[10px] text-muted-foreground">
              Think of this as an operational companion: each finished segment should generate its
              own diary artifact, pain summary, and next actions for improvement.
            </p>
          </div>
        </div>

        {/* Python Sidecar Section */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground uppercase">AI Sidecar (Python)</Label>
          <div className="p-3 rounded-md border bg-card space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className={`h-4 w-4 ${sidecarEnabled ? 'text-green-500' : 'text-muted-foreground'}`} />
                <div className="flex flex-col">
                  <span className="font-medium text-xs">Enable Sidecar</span>
                  <span className="text-[10px] text-muted-foreground">Use faster-whisper sidecar for local CPU/GPU transcription</span>
                </div>
              </div>
              <button
                onClick={() => setSidecarEnabled(!sidecarEnabled)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  sidecarEnabled ? 'bg-primary' : 'bg-muted'
                }`}
              >
                <span
                  className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                    sidecarEnabled ? 'translate-x-5' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {sidecarEnabled && (
              <div className="flex items-center justify-between gap-4 pt-1 animate-in fade-in slide-in-from-top-1">
                <span className="text-[11px] font-medium">Local Port</span>
                <Input
                  type="number"
                  value={sidecarPort}
                  onChange={(e) => setSidecarPort(parseInt(e.target.value) || 8000)}
                  className="h-6 w-20 text-[11px] text-right"
                />
              </div>
            )}

            <p className="text-[10px] text-muted-foreground">
              When Local mode is selected, enabling the sidecar makes transcription use Python
              `faster-whisper` before falling back to the bundled Rust path.
            </p>
          </div>
        </div>

        {/* System Diagnostics */}
        <div className="space-y-2">
          <DebugPanel />
        </div>
      </div>
    </div>
  )
}
