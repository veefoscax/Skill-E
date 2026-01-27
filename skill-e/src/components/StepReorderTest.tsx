/**
 * Step Reorder Test Component
 * 
 * Test page for the step reordering feature.
 * Demonstrates drag and drop functionality for timeline steps.
 * 
 * Requirements: FR-4.38
 */

import { useState, useCallback } from 'react';
import { Timeline } from './Overlay/Timeline';
import { useRecordingStore, StepType } from '@/stores/recording';

export function StepReorderTest() {
  const {
    steps,
    addStep,
    deleteStep,
    clearSteps,
    moveStep,
    reorderSteps,
  } = useRecordingStore();

  const [reorderEnabled, setReorderEnabled] = useState(true);
  const [newStepType, setNewStepType] = useState<StepType>('click');
  const [newStepLabel, setNewStepLabel] = useState('');

  // Add a test step
  const handleAddStep = useCallback(() => {
    const labels: Record<StepType, string> = {
      screenshot: 'Captured screenshot',
      click: `Clicked on ${newStepLabel || 'button'}`,
      keystroke: `Typed "${newStepLabel || 'text'}"`,
      network: `Request to ${newStepLabel || 'API'}`,
    };

    addStep({
      type: newStepType,
      label: labels[newStepType],
      data: newStepType === 'click' ? { position: { x: 100, y: 200 } } :
            newStepType === 'keystroke' ? { text: newStepLabel } :
            newStepType === 'network' ? { method: 'GET', url: newStepLabel } :
            undefined,
    });
    
    setNewStepLabel('');
  }, [addStep, newStepType, newStepLabel]);

  // Add multiple test steps
  const addTestSteps = useCallback(() => {
    const testSteps: Array<{ type: StepType; label: string }> = [
      { type: 'screenshot', label: 'Initial page view' },
      { type: 'click', label: 'Click login button' },
      { type: 'keystroke', label: 'Type username' },
      { type: 'keystroke', label: 'Type password' },
      { type: 'click', label: 'Submit form' },
      { type: 'network', label: 'POST /api/login' },
      { type: 'screenshot', label: 'Dashboard loaded' },
    ];

    testSteps.forEach((step, index) => {
      setTimeout(() => {
        addStep({
          type: step.type,
          label: step.label,
        });
      }, index * 100);
    });
  }, [addStep]);

  return (
    <div className="p-8 pr-96"> {/* Extra right padding for timeline */}
      <h1 className="text-2xl font-bold mb-6">Step Reorder Test</h1>
      
      {/* Stats */}
      <div className="mb-6 p-4 bg-gray-100 rounded-lg">
        <p className="font-medium">Total Steps: <span className="text-blue-600">{steps.length}</span></p>
        <p className="text-sm text-gray-500 mt-1">
          Reordering: {reorderEnabled ? 'Enabled' : 'Disabled'}
        </p>
      </div>

      {/* Controls */}
      <div className="mb-6 space-y-4">
        {/* Add Step Form */}
        <div className="p-4 border rounded-lg space-y-3">
          <h2 className="font-medium">Add Step</h2>
          
          <div className="flex gap-3">
            <select
              value={newStepType}
              onChange={(e) => setNewStepType(e.target.value as StepType)}
              className="px-3 py-2 border rounded-lg"
            >
              <option value="screenshot">📷 Screenshot</option>
              <option value="click">🖱️ Click</option>
              <option value="keystroke">⌨️ Keystroke</option>
              <option value="network">🌐 Network</option>
            </select>
            
            <input
              type="text"
              value={newStepLabel}
              onChange={(e) => setNewStepLabel(e.target.value)}
              placeholder="Step description..."
              className="flex-1 px-3 py-2 border rounded-lg"
              onKeyDown={(e) => e.key === 'Enter' && handleAddStep()}
            />
            
            <button
              onClick={handleAddStep}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Add Step
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={addTestSteps}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
          >
            Add Test Steps
          </button>
          
          <button
            onClick={() => setReorderEnabled(!reorderEnabled)}
            className={`px-4 py-2 rounded-lg font-medium ${
              reorderEnabled
                ? 'bg-purple-500 text-white hover:bg-purple-600'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {reorderEnabled ? 'Disable Reordering' : 'Enable Reordering'}
          </button>
          
          <button
            onClick={clearSteps}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-medium text-blue-900 mb-2">How to Reorder Steps</h3>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li><strong>Drag & Drop:</strong> Click and drag the handle (≡) to move steps</li>
          <li><strong>Keyboard:</strong> Select a step and press Cmd+↑/↓ (or Ctrl+↑/↓) to move</li>
          <li><strong>Arrow Buttons:</strong> Click the up/down arrows in expanded view</li>
          <li>Expand the timeline to see all reordering options</li>
        </ul>
      </div>

      {/* Step List (for debugging) */}
      <div className="p-4 border rounded-lg">
        <h2 className="font-medium mb-3">Current Order</h2>
        {steps.length === 0 ? (
          <p className="text-gray-400">No steps yet</p>
        ) : (
          <ol className="space-y-2">
            {steps.map((step, index) => (
              <li key={step.id} className="flex items-center gap-3 text-sm">
                <span className="text-gray-400 w-6">{index + 1}.</span>
                <span className="text-lg">
                  {step.type === 'screenshot' && '📷'}
                  {step.type === 'click' && '🖱️'}
                  {step.type === 'keystroke' && '⌨️'}
                  {step.type === 'network' && '🌐'}
                </span>
                <span className="flex-1">{step.label}</span>
                <button
                  onClick={() => moveStep(step.id, 'up')}
                  disabled={index === 0}
                  className="px-2 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-30"
                >
                  ↑
                </button>
                <button
                  onClick={() => moveStep(step.id, 'down')}
                  disabled={index === steps.length - 1}
                  className="px-2 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-30"
                >
                  ↓
                </button>
                <button
                  onClick={() => deleteStep(step.id)}
                  className="px-2 py-1 text-xs text-red-500 bg-red-50 rounded hover:bg-red-100"
                >
                  ×
                </button>
              </li>
            ))}
          </ol>
        )}
      </div>

      {/* Timeline Component */}
      <Timeline
        isVisible={true}
        reorderEnabled={reorderEnabled}
      />
    </div>
  );
}
