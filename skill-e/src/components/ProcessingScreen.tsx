/**
 * ProcessingScreen - Shows AI processing progress
 *
 * Connects recording data to processing pipeline and generates the work diary brief
 */

import { useEffect, useState } from 'react'
import {
  Loader2,
  Mic,
  Brain,
  FileText,
  CheckCircle,
  X,
  AlertCircle,
  Clock,
  Settings,
  RefreshCw,
  MicOff,
  Cloud,
  HardDrive,
  ExternalLink,
  FolderOpen,
} from 'lucide-react'
import { Button } from './ui/button'
import { Progress } from './ui/progress'
import {
  processRecordingAndGenerateSkill,
  ProcessingResult,
  retryFailedSession,
} from '@/lib/processing-bridge'
import type { ProcessingProgress } from '@/types/processing'
import { useSettingsStore, WHISPER_MODEL_INFO } from '@/stores/settings'
import { ProviderSelector } from './shared/ProviderSelector'
import { FailedSession, getErrorHelp } from '@/lib/failed-sessions'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { buildSessionAnnotations } from '@/lib/session-annotations'

interface ProcessingScreenProps {
  onComplete: (result: ProcessingResult) => void
  onCancel: () => void
}

export function ProcessingScreen({ onComplete, onCancel }: ProcessingScreenProps) {
  const [progress, setProgress] = useState<ProcessingProgress>({
    stage: 'loading',
    percentage: 0,
    currentStep: 'Initializing...',
  })
  const [isProcessing, setIsProcessing] = useState(true)
  const [result, setResult] = useState<ProcessingResult | null>(null)
  const [startTime] = useState(Date.now())
  const [elapsedTime, setElapsedTime] = useState(0)
  const [failedSession, setFailedSession] = useState<FailedSession | null>(null)
  const [showProviderSelector, setShowProviderSelector] = useState(false)

  // Settings for retry
  const settings = useSettingsStore()

  // Update elapsed time
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [startTime])

  // Start processing
  useEffect(() => {
    if (!isProcessing) return

    const process = async () => {
      try {
        const annotations = buildSessionAnnotations()

        // Try real processing
        let processingResult: ProcessingResult

        processingResult = await processRecordingAndGenerateSkill({ annotations }, setProgress)

        setResult(processingResult)
        setIsProcessing(false)

        if (processingResult.failedSession) {
          setFailedSession(processingResult.failedSession)
        }

        if (processingResult.success && processingResult.operationsBrief) {
          setTimeout(() => {
            onComplete(processingResult)
          }, 800)
        }
      } catch (error) {
        console.error('Processing error:', error)
        setProgress({
          stage: 'error',
          percentage: 0,
          currentStep: 'Processing failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        })
        setIsProcessing(false)
      }
    }

    process()
  }, [isProcessing, onComplete])

  const handleCancel = () => {
    setIsProcessing(false)
    onCancel()
  }

  const handleRetry = () => {
    setProgress({
      stage: 'loading',
      percentage: 0,
      currentStep: 'Initializing...',
    })
    setResult(null)
    setFailedSession(null)
    setShowProviderSelector(false)
    setIsProcessing(true)
  }

  const handleRetryFailedSession = async () => {
    if (!failedSession) return

    setProgress({
      stage: 'loading',
      percentage: 0,
      currentStep: 'Retrying with new settings...',
    })
    setIsProcessing(true)

    try {
      const result = await retryFailedSession(failedSession, setProgress)
      setResult(result)
      setIsProcessing(false)

      if (result.success && result.operationsBrief) {
        setTimeout(() => {
          onComplete(result)
        }, 800)
      } else if (result.failedSession) {
        setFailedSession(result.failedSession)
      }
    } catch (error) {
      console.error('Retry failed:', error)
      setProgress({
        stage: 'error',
        percentage: 0,
        currentStep: 'Retry failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      setIsProcessing(false)
    }
  }

  const handleOpenSettings = async () => {
    const window = getCurrentWindow()
    await window.emit('open-settings')
  }

  const handleOpenLogs = async () => {
    try {
      const { invoke } = await import('@tauri-apps/api/core')
      const { tempDir, join } = await import('@tauri-apps/api/path')
      const temp = await tempDir()
      const logsDir = await join(temp, 'skill-e-logs')
      await invoke('open_folder', { path: logsDir })
    } catch (e) {
      console.error('Failed to open logs:', e)
      // Fallback: mostra o caminho
      const { tempDir, join } = await import('@tauri-apps/api/path')
      const temp = await tempDir()
      const logsDir = await join(temp, 'skill-e-logs')
      alert(`Logs location:\n${logsDir}\n\nCopy this path and open in File Explorer`)
    }
  }

  const getStageIcon = () => {
    switch (progress.stage) {
      case 'timeline':
        return <Mic className="w-8 h-8 text-blue-500" />
      case 'step_detection':
        return <Brain className="w-8 h-8 text-purple-500" />
      case 'classification':
      case 'ocr':
      case 'context_generation':
        return <FileText className="w-8 h-8 text-green-500" />
      case 'complete':
        return <CheckCircle className="w-8 h-8 text-green-500" />
      case 'error':
        return <AlertCircle className="w-8 h-8 text-red-500" />
      default:
        return <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
    }
  }

  const getStageTitle = () => {
    switch (progress.stage) {
      case 'loading':
        return 'Loading Work Segment...'
      case 'classification':
        return 'Classifying Speech'
      case 'timeline':
        return 'Building Work Timeline...'
      case 'step_detection':
        return 'Detecting Steps'
      case 'ocr':
        return 'Extracting Text'
      case 'context_generation':
        return 'Writing Work Diary Brief'
      case 'complete':
        return 'Complete!'
      case 'error':
        return failedSession ? 'Transcription Failed' : 'Processing Error'
      default:
        return 'Building Work Diary...'
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Get error help if we have a failed session
  const errorHelp = failedSession ? getErrorHelp(failedSession.errorType) : null

  return (
    <div className="fixed inset-0 bg-gray-900 flex items-center justify-center p-8">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            {getStageIcon()}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{getStageTitle()}</h1>
              <p className="text-gray-500">{progress.currentStep}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-gray-500">
            <Clock className="w-4 h-4" />
            <span className="font-mono">{formatTime(elapsedTime)}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <Progress value={progress.percentage} className="h-3" />
          <div className="flex justify-between text-sm text-gray-500 mt-2">
            <span>{Math.round(progress.percentage)}%</span>
            {result && result.processingTime > 0 && (
              <span>Processed in {(result.processingTime / 1000).toFixed(1)}s</span>
            )}
          </div>
        </div>

        {/* Status Details */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Stage:</span>
              <span className="ml-2 font-medium capitalize">
                {progress.stage.replace('_', ' ')}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Status:</span>
              <span
                className={`ml-2 font-medium ${progress.stage === 'error' ? 'text-red-600' : progress.stage === 'complete' ? 'text-green-600' : 'text-blue-600'}`}
              >
                {progress.stage === 'error'
                  ? 'Failed'
                  : progress.stage === 'complete'
                    ? 'Done'
                    : 'In Progress'}
              </span>
            </div>
          </div>
        </div>

        {/* Transcription Error Display */}
        {failedSession && errorHelp && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <MicOff className="w-5 h-5 text-red-600" />
              <h3 className="font-semibold text-red-800">{errorHelp.title}</h3>
            </div>

            <p className="text-red-700 text-sm mb-4">{errorHelp.description}</p>

            {failedSession.error && (
              <div className="bg-red-100 rounded p-2 mb-4">
                <p className="text-red-800 text-xs font-mono">{failedSession.error}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              {errorHelp.actions.map((action, idx) => (
                <Button
                  key={idx}
                  variant={action.action === 'retry' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    if (action.action === 'settings') handleOpenSettings()
                    else if (action.action === 'retry') handleRetry()
                    else if (action.action === 'api') {
                      settings.setTranscriptionMode('cloud_openai')
                      handleRetry()
                    } else if (action.action === 'model') {
                      settings.setTranscriptionMode('local_whisper')
                      handleRetry()
                    }
                  }}
                  className={action.action === 'retry' ? 'bg-red-600 hover:bg-red-700' : ''}
                >
                  {action.action === 'settings' && <Settings className="w-3 h-3 mr-1" />}
                  {action.action === 'retry' && <RefreshCw className="w-3 h-3 mr-1" />}
                  {action.action === 'api' && <Cloud className="w-3 h-3 mr-1" />}
                  {action.action === 'model' && <HardDrive className="w-3 h-3 mr-1" />}
                  {action.label}
                </Button>
              ))}
              <Button variant="outline" size="sm" onClick={handleOpenLogs} className="col-span-2">
                <FolderOpen className="w-3 h-3 mr-1" />
                View Logs for Details
              </Button>
            </div>

            {/* Current Whisper Settings Summary */}
            <div className="mt-4 pt-4 border-t border-red-200">
              <p className="text-xs text-red-600 mb-2 font-medium">Current Settings:</p>
              <div className="flex flex-wrap gap-2 text-xs text-red-700">
                <span className="bg-red-100 px-2 py-1 rounded">
                  Mode: {settings.transcriptionMode === 'cloud_openai' ? 'Cloud API' : 'Local'}
                </span>
                {settings.transcriptionMode === 'local_whisper' && (
                  <span className="bg-red-100 px-2 py-1 rounded">
                    Model: {WHISPER_MODEL_INFO[settings.whisperModel].name}
                  </span>
                )}
                {settings.whisperApiKey && (
                  <span className="bg-red-100 px-2 py-1 rounded">API Key: Set</span>
                )}
              </div>
            </div>

            {/* Log Location Hint */}
            <p className="text-[10px] text-red-600 mt-3 pt-3 border-t border-red-200">
              💡 Click "View Logs" to see detailed error information for troubleshooting.
            </p>
          </div>
        )}

        {/* Generic Error Display (non-transcription errors) */}
        {progress.error && !failedSession && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <h3 className="font-semibold text-red-800">Processing Error</h3>
            </div>

            {/* Error Message */}
            <div className="bg-red-100 rounded p-3 mb-3">
              <p className="text-red-800 text-sm font-medium">{progress.error}</p>
            </div>

            {/* Help Text */}
            <div className="text-sm text-red-700 mb-4">
              <p className="mb-2">This error usually happens when:</p>
              <ul className="list-disc list-inside text-xs space-y-1 ml-2">
                <li>The API key is invalid or expired</li>
                <li>The provider endpoint is unreachable</li>
                <li>The model name is incorrect</li>
                <li>Your internet connection is down</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <Button variant="outline" size="sm" onClick={handleOpenSettings}>
                <Settings className="w-4 h-4 mr-2" />
                Open Settings
              </Button>
              <Button variant="outline" size="sm" onClick={handleOpenLogs}>
                <FolderOpen className="w-4 h-4 mr-2" />
                View Logs
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowProviderSelector(!showProviderSelector)}
                className="col-span-2"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                {showProviderSelector ? 'Hide' : 'Change'} Provider & Retry
              </Button>
            </div>

            {/* Provider Selector (collapsible) */}
            {showProviderSelector && (
              <div className="mt-4 pt-4 border-t border-red-200">
                <div className="flex items-center gap-2 mb-2 text-red-900 font-medium">
                  <Settings className="w-4 h-4" />
                  <span>Change LLM Provider Configuration</span>
                </div>

                {/* Unified Provider Selector */}
                <ProviderSelector compact />
              </div>
            )}

            {/* Log Location Hint */}
            <p className="text-[10px] text-red-600 mt-3 pt-3 border-t border-red-200">
              💡 Tip: Click "View Logs" to see detailed error information and share it for support.
            </p>
          </div>
        )}

        {/* Processing Indicator */}
        {progress.stage !== 'complete' && progress.stage !== 'error' && (
          <div className="flex items-center gap-2 text-sm text-gray-500 justify-center">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>AI is analyzing your recording...</span>
          </div>
        )}

        {/* Actions */}
        {progress.stage === 'error' && (
          <div className="flex gap-3 justify-end mt-6">
            <Button variant="outline" onClick={handleCancel}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            {failedSession ? (
              <Button
                onClick={handleRetryFailedSession}
                className="bg-blue-600 hover:bg-blue-700"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Retry with New Settings
              </Button>
            ) : (
              <Button onClick={handleRetry} className="bg-blue-600 hover:bg-blue-700">
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry Generation
              </Button>
            )}
          </div>
        )}

        {/* Cancel + Settings button during processing */}
        {progress.stage !== 'complete' && progress.stage !== 'error' && (
          <div className="flex justify-center gap-3 mt-6">
            <Button variant="outline" onClick={handleOpenSettings}>
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
            <Button variant="outline" onClick={handleCancel}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
