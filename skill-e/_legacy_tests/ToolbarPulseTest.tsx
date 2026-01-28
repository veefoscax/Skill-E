import { Button } from '@/components/ui/button'
import { Circle, Pause } from 'lucide-react'
import { useState } from 'react'

/**
 * Toolbar Pulse Animation Test Component
 * 
 * Visual test for Task S04-25: Toolbar Pulse Animation
 * Tests the pulsing red/yellow glow effects on the record button
 * 
 * Requirements: FR-4.25, FR-4.27
 */
export function ToolbarPulseTest() {
  const [state, setState] = useState<'idle' | 'recording' | 'paused'>('idle')

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Toolbar Pulse Animation Test</h1>
          <p className="text-muted-foreground">
            Task S04-25: Testing pulsing animations for record button states
          </p>
        </div>

        {/* Test Controls */}
        <div className="border rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold">State Controls</h2>
          <div className="flex gap-4">
            <Button
              variant={state === 'idle' ? 'default' : 'outline'}
              onClick={() => setState('idle')}
            >
              Idle (No Animation)
            </Button>
            <Button
              variant={state === 'recording' ? 'default' : 'outline'}
              onClick={() => setState('recording')}
            >
              Recording (Red Pulse)
            </Button>
            <Button
              variant={state === 'paused' ? 'default' : 'outline'}
              onClick={() => setState('paused')}
            >
              Paused (Yellow Pulse)
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Current State: <span className="font-semibold">{state}</span>
          </p>
        </div>

        {/* Visual Test Area */}
        <div className="border rounded-lg p-12 bg-muted/20">
          <div className="flex flex-col items-center gap-8">
            <h3 className="text-lg font-semibold">Record Button Preview</h3>
            
            {/* Simulated Toolbar Button */}
            <div className="bg-background/80 backdrop-blur-xl border border-border rounded-lg shadow-2xl p-4">
              {state === 'idle' ? (
                <Button
                  size="icon"
                  variant="default"
                  className="h-9 w-9 rounded-full"
                  title="Start Recording"
                >
                  <Circle className="h-4 w-4 fill-current" />
                </Button>
              ) : (
                <Button
                  size="icon"
                  variant={state === 'paused' ? 'default' : 'secondary'}
                  className={`h-9 w-9 rounded-full ${
                    state === 'paused' ? 'record-button-paused' : 'record-button-active'
                  }`}
                  title={state === 'paused' ? 'Resume Recording' : 'Pause Recording'}
                >
                  {state === 'paused' ? (
                    <Circle className="h-4 w-4 fill-current" />
                  ) : (
                    <Pause className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>

            <p className="text-sm text-muted-foreground text-center max-w-md">
              {state === 'idle' && 'No animation - button is in idle state'}
              {state === 'recording' && 'Red pulsing glow - indicates active recording'}
              {state === 'paused' && 'Yellow/orange pulsing glow - indicates paused state'}
            </p>
          </div>
        </div>

        {/* Requirements Checklist */}
        <div className="border rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold">Requirements Checklist</h2>
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <input type="checkbox" id="req1" className="mt-1" />
              <label htmlFor="req1" className="text-sm">
                <strong>FR-4.25:</strong> Pulsing red glow effect when recording is active
              </label>
            </div>
            <div className="flex items-start gap-2">
              <input type="checkbox" id="req2" className="mt-1" />
              <label htmlFor="req2" className="text-sm">
                <strong>FR-4.27:</strong> Yellow/orange state for paused recording
              </label>
            </div>
            <div className="flex items-start gap-2">
              <input type="checkbox" id="req3" className="mt-1" />
              <label htmlFor="req3" className="text-sm">
                Animation is smooth (60fps) without performance issues
              </label>
            </div>
            <div className="flex items-start gap-2">
              <input type="checkbox" id="req4" className="mt-1" />
              <label htmlFor="req4" className="text-sm">
                Transitions between states are smooth and natural
              </label>
            </div>
            <div className="flex items-start gap-2">
              <input type="checkbox" id="req5" className="mt-1" />
              <label htmlFor="req5" className="text-sm">
                Animation doesn't interfere with button functionality
              </label>
            </div>
            <div className="flex items-start gap-2">
              <input type="checkbox" id="req6" className="mt-1" />
              <label htmlFor="req6" className="text-sm">
                Glow effect is subtle and professional (not distracting)
              </label>
            </div>
          </div>
        </div>

        {/* Technical Details */}
        <div className="border rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold">Technical Details</h2>
          <div className="space-y-3 text-sm">
            <div>
              <strong>Animation Duration:</strong> 2 seconds (infinite loop)
            </div>
            <div>
              <strong>Red Color:</strong> rgba(239, 68, 68, ...) - Tailwind red-500
            </div>
            <div>
              <strong>Orange Color:</strong> rgba(251, 146, 60, ...) - Tailwind orange-400
            </div>
            <div>
              <strong>Glow Expansion:</strong> 0px → 8px with fade, plus 16px outer glow
            </div>
            <div>
              <strong>CSS Classes:</strong>
              <ul className="list-disc list-inside ml-4 mt-1">
                <li><code className="bg-muted px-1 rounded">.record-button-active</code> - Red pulse</li>
                <li><code className="bg-muted px-1 rounded">.record-button-paused</code> - Yellow pulse</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Testing Instructions */}
        <div className="border rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold">Testing Instructions</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Click "Recording (Red Pulse)" - verify red glow pulses smoothly</li>
            <li>Click "Paused (Yellow Pulse)" - verify color changes to yellow/orange</li>
            <li>Click "Idle (No Animation)" - verify animation stops</li>
            <li>Rapidly switch between states - verify smooth transitions</li>
            <li>Let animation run for 30+ seconds - verify consistent looping</li>
            <li>Check performance - should maintain 60fps</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
