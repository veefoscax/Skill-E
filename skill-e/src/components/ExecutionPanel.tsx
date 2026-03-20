/**
 * ExecutionPanel - Execute generated skill in Chrome or Natively
 *
 * Integrates CDP executor for real browser automation
 * Integrates Native executor for OS-level mouse/keyboard automation
 */

import { useState, useCallback } from 'react'
import { Play, Square, Chrome, AlertCircle, CheckCircle, Loader2, MonitorSmartphone } from 'lucide-react'
import { invoke } from '@tauri-apps/api/core'
import { Button } from './ui/button'
import { CDPExecutor } from '@/lib/cdp/executor'
import { isChromeAvailable } from '@/lib/cdp/client'
import { parseSkill } from '@/lib/skill-parser'

interface ExecutionPanelProps {
  skillMarkdown: string
}

type ExecutionStatus = 'idle' | 'connecting' | 'running' | 'completed' | 'error'

interface StepResult {
  stepIndex: number
  success: boolean
  message: string
}

export function ExecutionPanel({ skillMarkdown }: ExecutionPanelProps) {
  const [status, setStatus] = useState<ExecutionStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<StepResult[]>([])
  const [currentStep, setCurrentStep] = useState(0)
  const [totalSteps, setTotalSteps] = useState(0)
  const [executionMode, setExecutionMode] = useState<'cdp' | 'native' | null>(null)

  const handleExecuteNative = useCallback(async () => {
    setStatus('running')
    setExecutionMode('native')
    setError(null)
    setResults([])

    try {
      const skill = parseSkill(skillMarkdown)
      setTotalSteps(skill.steps.length)

      const playbackSteps = skill.steps.map(s => {
        let x = undefined
        let y = undefined
        let text = undefined

        if (s.actionType === 'click' && s.target?.coordinates) {
          x = s.target.coordinates.x
          y = s.target.coordinates.y
        }

        if (s.actionType === 'type' || s.actionType === 'verify') {
          text = s.target?.text || s.instruction
        }

        return {
          action_type: s.actionType,
          x,
          y,
          text,
        }
      })

      // We don't have step-by-step progress from the native backend yet, 
      // so we send it all at once and wait.
      await invoke('execute_native_playback', { steps: playbackSteps })
      
      setStatus('completed')
      setResults([{ stepIndex: 1, success: true, message: '✓ Native playback completed successfully' }])
    } catch (err) {
      console.error('Native execution failed:', err)
      setError(err instanceof Error ? err.message : String(err))
      setStatus('error')
    }
  }, [skillMarkdown])

  const handleExecuteCDP = useCallback(async () => {
    setStatus('connecting')
    setExecutionMode('cdp')
    setError(null)
    setResults([])

    try {
      // Check if Chrome is available
      const chromeAvailable = await isChromeAvailable()
      if (!chromeAvailable) {
        throw new Error(
          'Chrome is not available. Please start Chrome with remote debugging:\n' +
            'chrome --remote-debugging-port=9222'
        )
      }

      // Parse skill
      const skill = parseSkill(skillMarkdown)
      setTotalSteps(skill.steps.length)

      // Create executor
      const executor = new CDPExecutor({
        port: 9222,
        captureScreenshots: true,
        stepTimeout: 30000,
        maxRetries: 2,
      })

      setStatus('running')

      // Execute each step
      const stepResults: StepResult[] = []

      for (let i = 0; i < skill.steps.length; i++) {
        setCurrentStep(i + 1)
        const step = skill.steps[i]

        console.log(`Executing step ${i + 1}: ${step.instruction}`)

        const result = await executor.executeStep(step)

        stepResults.push({
          stepIndex: i + 1,
          success: result.success,
          message: result.success
            ? `✓ ${step.instruction}`
            : `✗ ${step.instruction}: ${result.error || 'Failed'}`,
        })

        setResults([...stepResults])

        if (!result.success) {
          console.error(`Step ${i + 1} failed:`, result.error)
          // Continue with next step but log the error
        }
      }

      // Close executor
      await executor.close()

      const allSuccess = stepResults.every(r => r.success)
      setStatus(allSuccess ? 'completed' : 'error')
    } catch (err) {
      console.error('Execution failed:', err)
      setError(err instanceof Error ? err.message : 'Execution failed')
      setStatus('error')
    }
  }, [skillMarkdown])

  const handleStop = useCallback(async () => {
    setStatus('idle')
    setExecutionMode(null)
  }, [])

  const getStatusIcon = () => {
    switch (status) {
      case 'connecting':
      case 'running':
        return <Loader2 className="w-5 h-5 animate-spin" />
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />
      default:
        return <MonitorSmartphone className="w-5 h-5" />
    }
  }

  const getStatusText = () => {
    switch (status) {
      case 'connecting':
        return 'Connecting to Chrome...'
      case 'running':
        return executionMode === 'native' ? 'Executing Native Playback...' : `Executing step ${currentStep} of ${totalSteps}...`
      case 'completed':
        return 'Execution completed!'
      case 'error':
        return 'Execution failed'
      default:
        return 'Ready to execute'
    }
  }

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className="font-medium">{getStatusText()}</span>
        </div>

        {status === 'connecting' || status === 'running' ? (
          <Button onClick={handleStop} variant="destructive" size="sm">
            <Square className="w-4 h-4 mr-1" />
            Stop
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button onClick={handleExecuteNative} size="sm" variant="outline" className="bg-white">
              <MonitorSmartphone className="w-4 h-4 mr-1" />
              Native Playback
            </Button>
            <Button onClick={handleExecuteCDP} size="sm">
              <Chrome className="w-4 h-4 mr-1" />
              Execute in Chrome
            </Button>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-3 mb-4 text-sm text-red-700">
          <div className="font-medium mb-1">Error:</div>
          <pre className="whitespace-pre-wrap">{error}</pre>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-1">
          <div className="text-sm font-medium mb-2">Execution Log:</div>
          {results.map((result, index) => (
            <div
              key={index}
              className={`text-sm ${result.success ? 'text-green-700' : 'text-red-700'}`}
            >
              {result.message}
            </div>
          ))}
        </div>
      )}

      {status === 'idle' && results.length === 0 && (
        <div className="text-sm text-gray-500">
          <p className="mb-2">Choose how to execute this skill:</p>
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li>
              <strong>Native Playback:</strong> Takes control of your actual mouse and keyboard to replicate the recorded actions exactly as they happened across the entire OS.
            </li>
            <li>
              <strong>Execute in Chrome:</strong> Uses Chrome DevTools Protocol (CDP) to run the skill silently or visibly inside a browser window. Requires <code className="bg-gray-200 px-1 rounded">chrome --remote-debugging-port=9222</code>.
            </li>
          </ul>
        </div>
      )}
    </div>
  )
}
