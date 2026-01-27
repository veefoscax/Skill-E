/**
 * Timeline Component Test
 * 
 * Manual test interface for the Timeline container component.
 * Tests right-edge positioning, scrolling, expand/collapse, and step display.
 * 
 * Requirements: FR-4.39, FR-4.42
 */

import { useState } from 'react';
import { Timeline, TimelineBadge } from './Overlay/Timeline/Timeline';
import { useRecordingStore, CaptureStep } from '@/stores/recording';

export function TimelineTest() {
  const [testMode, setTestMode] = useState<'timeline' | 'badge'>('timeline');
  const [isVisible, setIsVisible] = useState(true);
  
  const steps = useRecordingStore((state) => state.steps);
  const addStep = useRecordingStore((state) => state.addStep);
  const clearSteps = useRecordingStore((state) => state.clearSteps);

  // Add sample steps
  const addSampleScreenshot = () => {
    addStep({
      type: 'screenshot',
      label: 'Screen captured',
      data: { frameIndex: steps.length },
    });
  };

  const addSampleClick = () => {
    addStep({
      type: 'click',
      label: `Clicked #button-${steps.length + 1}`,
      data: {
        selector: `#button-${steps.length + 1}`,
        position: { x: 100 + Math.random() * 200, y: 100 + Math.random() * 200 },
      },
    });
  };

  const addSampleKeystroke = () => {
    const texts = ['Hello world', 'username@example.com', 'password123', 'Search query'];
    const text = texts[Math.floor(Math.random() * texts.length)];
    addStep({
      type: 'keystroke',
      label: `Typed "${text}"`,
      data: { text },
    });
  };

  const addSampleNetwork = () => {
    const endpoints = ['/api/login', '/api/users', '/api/data', '/api/submit'];
    const methods = ['GET', 'POST', 'PUT', 'DELETE'];
    const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
    const method = methods[Math.floor(Math.random() * methods.length)];
    addStep({
      type: 'network',
      label: `${method} ${endpoint}`,
      data: { method, url: endpoint },
    });
  };

  const addMultipleSteps = () => {
    const types = [addSampleScreenshot, addSampleClick, addSampleKeystroke, addSampleNetwork];
    for (let i = 0; i < 10; i++) {
      setTimeout(() => {
        const randomType = types[Math.floor(Math.random() * types.length)];
        randomType();
      }, i * 500);
    }
  };

  const handleStepClick = (step: CaptureStep) => {
    console.log('Step clicked:', step);
  };

  const handleStepDelete = (stepId: string) => {
    console.log('Step deleted:', stepId);
  };

  const handleStepEditNote = (stepId: string, note: string) => {
    console.log('Step note edited:', stepId, note);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Timeline Component Test
          </h1>
          <p className="text-gray-600 mb-4">
            Test the Timeline container with right-edge positioning and scrolling.
          </p>
          
          {/* Test Mode Selection */}
          <div className="flex gap-4 mb-4">
            <button
              onClick={() => setTestMode('timeline')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                testMode === 'timeline'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Full Timeline
            </button>
            <button
              onClick={() => setTestMode('badge')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                testMode === 'badge'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Badge Only
            </button>
          </div>

          {/* Visibility Toggle */}
          <div className="flex items-center gap-2 mb-4">
            <input
              type="checkbox"
              id="visibility"
              checked={isVisible}
              onChange={(e) => setIsVisible(e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="visibility" className="text-sm text-gray-700">
              Timeline Visible
            </label>
          </div>

          {/* Stats */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Total Steps:</span>
                <span className="ml-2 font-semibold text-gray-800">{steps.length}</span>
              </div>
              <div>
                <span className="text-gray-600">Test Mode:</span>
                <span className="ml-2 font-semibold text-gray-800">{testMode}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Add Steps
          </h2>
          
          <div className="grid grid-cols-2 gap-3 mb-4">
            <button
              onClick={addSampleScreenshot}
              className="px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
            >
              📷 Add Screenshot
            </button>
            <button
              onClick={addSampleClick}
              className="px-4 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors font-medium"
            >
              🖱️ Add Click
            </button>
            <button
              onClick={addSampleKeystroke}
              className="px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
            >
              ⌨️ Add Keystroke
            </button>
            <button
              onClick={addSampleNetwork}
              className="px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
            >
              🌐 Add Network
            </button>
          </div>

          <div className="flex gap-3">
            <button
              onClick={addMultipleSteps}
              className="flex-1 px-4 py-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors font-medium"
            >
              ⚡ Add 10 Random Steps
            </button>
            <button
              onClick={clearSteps}
              className="px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
            >
              🗑️ Clear All
            </button>
          </div>
        </div>

        {/* Test Instructions */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Test Checklist
          </h2>
          
          <div className="space-y-3">
            <TestItem
              label="Timeline positioned on right edge"
              requirement="FR-4.39"
            />
            <TestItem
              label="Collapsed by default (shows step count badge)"
              requirement="FR-4.40"
            />
            <TestItem
              label="Expands on hover or click"
              requirement="FR-4.41"
            />
            <TestItem
              label="Scrollable when many steps"
              requirement="FR-4.42"
            />
            <TestItem
              label="New steps slide in from right"
              requirement="FR-4.30"
            />
            <TestItem
              label="Older steps (>5s) fade to 50% opacity"
              requirement="FR-4.31"
            />
            <TestItem
              label="Hovering timeline restores full opacity"
              requirement="FR-4.32"
            />
            <TestItem
              label="Step counter badge shows total steps"
              requirement="FR-4.33"
            />
            <TestItem
              label="Toggle timeline visibility"
              requirement="FR-4.34"
            />
            <TestItem
              label="Click step to expand details"
              requirement="FR-4.35"
            />
            <TestItem
              label="Delete step with confirmation"
              requirement="FR-4.36"
            />
            <TestItem
              label="Edit step note"
              requirement="FR-4.37"
            />
          </div>
        </div>

        {/* Step List (for debugging) */}
        {steps.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Current Steps (Debug)
            </h2>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className="text-sm p-2 bg-gray-50 rounded border border-gray-200"
                >
                  <span className="font-mono text-xs text-gray-500">#{index + 1}</span>
                  <span className="ml-2">{step.label}</span>
                  <span className="ml-2 text-xs text-gray-500">
                    ({new Date(step.timestamp).toLocaleTimeString()})
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Render Timeline Component */}
      {testMode === 'timeline' && (
        <Timeline
          isVisible={isVisible}
          onStepClick={handleStepClick}
          onStepDelete={handleStepDelete}
          onStepEditNote={handleStepEditNote}
        />
      )}

      {/* Render Badge Only */}
      {testMode === 'badge' && isVisible && <TimelineBadge />}
    </div>
  );
}

interface TestItemProps {
  label: string;
  requirement: string;
}

function TestItem({ label, requirement }: TestItemProps) {
  return (
    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
      <input
        type="checkbox"
        className="mt-1 w-4 h-4"
      />
      <div className="flex-1">
        <p className="text-sm text-gray-800">{label}</p>
        <p className="text-xs text-gray-500 mt-1">
          Requirement: {requirement}
        </p>
      </div>
    </div>
  );
}
