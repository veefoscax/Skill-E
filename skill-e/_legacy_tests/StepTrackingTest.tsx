/**
 * Step Tracking Test Component
 * Tests the step tracking functionality in the recording store
 * Requirements: FR-4.29
 */

import { useRecordingStore } from '../stores/recording';

export function StepTrackingTest() {
  const { steps, addStep, updateStepNote, deleteStep, clearSteps } = useRecordingStore();

  const handleAddScreenshot = () => {
    addStep({
      type: 'screenshot',
      label: 'Screen captured',
      data: {
        frameIndex: steps.length,
      },
    });
  };

  const handleAddClick = () => {
    addStep({
      type: 'click',
      label: `Clicked #submit-btn`,
      data: {
        selector: '#submit-btn',
        position: { x: 100, y: 200 },
      },
    });
  };

  const handleAddKeystroke = () => {
    addStep({
      type: 'keystroke',
      label: `Typed 'hello world'`,
      data: {
        text: 'hello world',
      },
    });
  };

  const handleAddNetwork = () => {
    addStep({
      type: 'network',
      label: 'POST /api/login',
      data: {
        method: 'POST',
        url: '/api/login',
      },
    });
  };

  const handleUpdateNote = (stepId: string) => {
    const note = prompt('Enter note for this step:');
    if (note !== null) {
      updateStepNote(stepId, note);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Step Tracking Test</h1>

      {/* Action Buttons */}
      <div className="mb-6 space-x-2">
        <button
          onClick={handleAddScreenshot}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          📷 Add Screenshot
        </button>
        <button
          onClick={handleAddClick}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          🖱️ Add Click
        </button>
        <button
          onClick={handleAddKeystroke}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
        >
          ⌨️ Add Keystroke
        </button>
        <button
          onClick={handleAddNetwork}
          className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
        >
          🌐 Add Network
        </button>
        <button
          onClick={clearSteps}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Clear All
        </button>
      </div>

      {/* Step Count */}
      <div className="mb-4">
        <span className="text-lg font-semibold">
          Total Steps: {steps.length}
        </span>
      </div>

      {/* Steps List */}
      <div className="space-y-2">
        {steps.length === 0 ? (
          <p className="text-gray-500">No steps captured yet. Click the buttons above to add steps.</p>
        ) : (
          steps.map((step, index) => (
            <div
              key={step.id}
              className="border border-gray-300 rounded-lg p-4 bg-white shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-mono text-gray-500">
                      #{index + 1}
                    </span>
                    <span className="font-semibold">{step.label}</span>
                    <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                      {step.type}
                    </span>
                  </div>

                  {/* Step Data */}
                  {step.data && (
                    <div className="text-sm text-gray-600 mb-2">
                      {step.data.selector && (
                        <div>Selector: {step.data.selector}</div>
                      )}
                      {step.data.position && (
                        <div>
                          Position: ({step.data.position.x}, {step.data.position.y})
                        </div>
                      )}
                      {step.data.text && <div>Text: "{step.data.text}"</div>}
                      {step.data.method && step.data.url && (
                        <div>
                          {step.data.method} {step.data.url}
                        </div>
                      )}
                      {step.data.frameIndex !== undefined && (
                        <div>Frame: {step.data.frameIndex}</div>
                      )}
                    </div>
                  )}

                  {/* Timestamp */}
                  <div className="text-xs text-gray-400">
                    {new Date(step.timestamp).toLocaleTimeString()}
                  </div>

                  {/* Note */}
                  {step.note && (
                    <div className="mt-2 text-sm italic text-blue-600">
                      Note: {step.note}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleUpdateNote(step.id)}
                    className="text-sm px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                  >
                    Add Note
                  </button>
                  <button
                    onClick={() => deleteStep(step.id)}
                    className="text-sm px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Test Results */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Test Checklist</h2>
        <ul className="space-y-1 text-sm">
          <li className={steps.length > 0 ? 'text-green-600' : 'text-gray-500'}>
            ✓ Can add steps to the store
          </li>
          <li className={steps.some(s => s.type === 'screenshot') ? 'text-green-600' : 'text-gray-500'}>
            ✓ Can track screenshot steps
          </li>
          <li className={steps.some(s => s.type === 'click') ? 'text-green-600' : 'text-gray-500'}>
            ✓ Can track click steps
          </li>
          <li className={steps.some(s => s.type === 'keystroke') ? 'text-green-600' : 'text-gray-500'}>
            ✓ Can track keystroke steps
          </li>
          <li className={steps.some(s => s.type === 'network') ? 'text-green-600' : 'text-gray-500'}>
            ✓ Can track network steps
          </li>
          <li className={steps.some(s => s.note) ? 'text-green-600' : 'text-gray-500'}>
            ✓ Can add notes to steps
          </li>
          <li className={steps.length === 0 ? 'text-green-600' : 'text-gray-500'}>
            ✓ Can clear all steps
          </li>
        </ul>
      </div>
    </div>
  );
}
