/**
 * ExecutionPanel - Execute generated skill in Chrome
 *
 * Integrates CDP executor for real browser automation
 */

import { useState, useCallback } from 'react'
import { Play, Square, Chrome, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
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

  const handleExecute = useCallback(async () => {
    setStatus('connecting')
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
        return <Chrome className="w-5 h-5" />
    }
  }

  const getStatusText = () => {
    switch (status) {
      case 'connecting':
        return 'Connecting to Chrome...'
      case 'running':
        return `Executing step ${currentStep} of ${totalSteps}...`
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
          <Button onClick={handleExecute} size="sm">
            <Play className="w-4 h-4 mr-1" />
            Execute in Chrome
          </Button>
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
          <p className="mb-2">Execute this skill in Chrome:</p>
          <ol className="list-decimal list-inside space-y-1 ml-2">
            <li>Start Chrome with remote debugging:</li>
            <code className="block bg-gray-100 p-2 rounded mt-1 font-mono text-xs">
              chrome --remote-debugging-port=9222
            </code>
            <li>Click "Execute in Chrome"</li>
            <li>Watch the automation run!</li>
          </ol>
        </div>
      )}
    </div>
  )
}
