/**
 * Auto-Fade Logic Test Component
 * 
 * Dedicated test interface for verifying the auto-fade behavior of timeline steps.
 * Tests FR-4.31 (fade after 5s) and FR-4.32 (restore on hover).
 * 
 * Requirements: FR-4.31, FR-4.32
 */

import { useState, useEffect } from 'react';
import { Timeline } from './Overlay/Timeline/Timeline';
import { useRecordingStore } from '@/stores/recording';

export function AutoFadeTest() {
  const [testRunning, setTestRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [testStartTime, setTestStartTime] = useState<number | null>(null);
  
  const steps = useRecordingStore((state) => state.steps);
  const addStep = useRecordingStore((state) => state.addStep);
  const clearSteps = useRecordingStore((state) => state.clearSteps);

  // Timer for elapsed time display
  useEffect(() => {
    if (!testRunning || !testStartTime) return;

    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - testStartTime) / 1000));
    }, 100);

    return () => clearInterval(interval);
  }, [testRunning, testStartTime]);

  // Calculate age of each step
  const getStepAge = (timestamp: number) => {
    return Math.floor((Date.now() - timestamp) / 1000);
  };

  // Start automated test sequence
  const startAutomatedTest = () => {
    clearSteps();
    setTestRunning(true);
    setTestStartTime(Date.now());
    setElapsedTime(0);

    // Add steps at specific intervals to test fade timing
    const intervals = [0, 1000, 2000, 3000, 4000, 6000, 8000, 10000];
    
    intervals.forEach((delay, index) => {
      setTimeout(() => {
        addStep({
          type: index % 4 === 0 ? 'screenshot' : 
                index % 4 === 1 ? 'click' : 
                index % 4 === 2 ? 'keystroke' : 'network',
          label: `Test Step ${index + 1} (added at ${delay / 1000}s)`,
          data: { frameIndex: index },
        });
      }, delay);
    });

    // Stop test after 15 seconds
    setTimeout(() => {
      setTestRunning(false);
    }, 15000);
  };

  // Add a single step manually
  const addManualStep = () => {
    addStep({
      type: 'click',
      label: `Manual Step (${new Date().toLocaleTimeString()})`,
      data: { position: { x: 100, y: 100 } },
    });
  };

  // Reset test
  const resetTest = () => {
    clearSteps();
    setTestRunning(false);
    setElapsedTime(0);
    setTestStartTime(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Auto-Fade Logic Test
          </h1>
          <p className="text-gray-600 mb-4">
            Testing FR-4.31 (fade after 5s) and FR-4.32 (restore on hover)
          </p>

          {/* Test Status */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-gray-600 mb-1">Test Status</p>
                <p className={`text-lg font-bold ${testRunning ? 'text-green-600' : 'text-gray-400'}`}>
                  {testRunning ? '🟢 Running' : '⚪ Idle'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Elapsed Time</p>
                <p className="text-lg font-bold text-blue-600">
                  {elapsedTime}s
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Steps</p>
                <p className="text-lg font-bold text-indigo-600">
                  {steps.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Test Controls
          </h2>
          
          <div className="grid grid-cols-3 gap-4">
            <button
              onClick={startAutomatedTest}
              disabled={testRunning}
              className={`px-6 py-4 rounded-lg font-semibold text-white transition-all ${
                testRunning
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-500 hover:bg-green-600 hover:scale-105'
              }`}
            >
              ▶️ Start Automated Test
            </button>
            
            <button
              onClick={addManualStep}
              className="px-6 py-4 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 hover:scale-105 transition-all"
            >
              ➕ Add Manual Step
            </button>
            
            <button
              onClick={resetTest}
              className="px-6 py-4 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 hover:scale-105 transition-all"
            >
              🔄 Reset Test
            </button>
          </div>

          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Automated Test:</strong> Adds 8 steps at different intervals. 
              Watch as steps fade to 50% opacity after 5 seconds. 
              Hover over the timeline to restore full opacity.
            </p>
          </div>
        </div>

        {/* Step Details Table */}
        {steps.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Step Details & Fade Status
            </h2>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">#</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Label</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Age</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Should Fade?</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Expected Opacity</th>
                  </tr>
                </thead>
                <tbody>
                  {steps.map((step, index) => {
                    const age = getStepAge(step.timestamp);
                    const shouldFade = age > 5;
                    
                    return (
                      <tr 
                        key={step.id} 
                        className={`border-b border-gray-100 ${
                          shouldFade ? 'bg-orange-50' : 'bg-green-50'
                        }`}
                      >
                        <td className="py-3 px-4 font-mono text-gray-600">
                          {index + 1}
                        </td>
                        <td className="py-3 px-4">
                          {step.label}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            step.type === 'screenshot' ? 'bg-blue-100 text-blue-700' :
                            step.type === 'click' ? 'bg-purple-100 text-purple-700' :
                            step.type === 'keystroke' ? 'bg-green-100 text-green-700' :
                            'bg-orange-100 text-orange-700'
                          }`}>
                            {step.type}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono">
                          {age}s
                        </td>
                        <td className="py-3 px-4">
                          {shouldFade ? (
                            <span className="text-orange-600 font-semibold">✓ Yes</span>
                          ) : (
                            <span className="text-green-600 font-semibold">✗ No</span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-semibold">
                          {shouldFade ? (
                            <span className="text-orange-600">50% (faded)</span>
                          ) : (
                            <span className="text-green-600">100% (full)</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Legend:</strong> 
                <span className="ml-2 inline-block px-2 py-1 bg-green-50 rounded">Green = Fresh (0-5s)</span>
                <span className="ml-2 inline-block px-2 py-1 bg-orange-50 rounded">Orange = Faded (&gt;5s)</span>
              </p>
            </div>
          </div>
        )}

        {/* Test Instructions */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Manual Test Checklist
          </h2>
          
          <div className="space-y-4">
            <TestCheckItem
              number={1}
              title="Auto-Fade After 5 Seconds"
              description="Add a step and wait 5 seconds. The step should fade to 50% opacity."
              requirement="FR-4.31"
            />
            
            <TestCheckItem
              number={2}
              title="Multiple Steps Fade Independently"
              description="Run automated test. Each step should fade independently when it reaches 5 seconds old."
              requirement="FR-4.31"
            />
            
            <TestCheckItem
              number={3}
              title="Hover Restores Full Opacity"
              description="After steps fade, hover over the timeline. All steps should restore to 100% opacity."
              requirement="FR-4.32"
            />
            
            <TestCheckItem
              number={4}
              title="Unhover Returns to Fade State"
              description="Move mouse away from timeline. Faded steps should return to 50% opacity."
              requirement="FR-4.32"
            />
            
            <TestCheckItem
              number={5}
              title="Smooth Transitions"
              description="Opacity changes should be smooth (300ms transition), no jarring effects."
              requirement="NFR-4.2"
            />
            
            <TestCheckItem
              number={6}
              title="New Steps Don't Fade Immediately"
              description="Newly added steps should remain at 100% opacity for the first 5 seconds."
              requirement="FR-4.31"
            />
          </div>

          <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg">
            <h3 className="font-semibold text-green-800 mb-2">
              ✅ Expected Behavior Summary
            </h3>
            <ul className="text-sm text-green-700 space-y-1 ml-4">
              <li>• Steps &lt; 5 seconds old: <strong>100% opacity</strong></li>
              <li>• Steps &gt; 5 seconds old: <strong>50% opacity</strong></li>
              <li>• Timeline hovered: <strong>All steps 100% opacity</strong></li>
              <li>• Timeline not hovered: <strong>Fade state applies</strong></li>
              <li>• Transitions: <strong>Smooth 300ms animation</strong></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Render Timeline Component */}
      <Timeline isVisible={true} />

      {/* Hover Instruction Overlay */}
      {steps.some(step => getStepAge(step.timestamp) > 5) && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-indigo-600 text-white px-6 py-3 rounded-full shadow-lg animate-bounce">
          <p className="text-sm font-semibold">
            👉 Hover over the timeline on the right to restore opacity!
          </p>
        </div>
      )}
    </div>
  );
}

interface TestCheckItemProps {
  number: number;
  title: string;
  description: string;
  requirement: string;
}

function TestCheckItem({ number, title, description, requirement }: TestCheckItemProps) {
  const [checked, setChecked] = useState(false);

  return (
    <div className={`p-4 rounded-lg border-2 transition-all ${
      checked 
        ? 'bg-green-50 border-green-300' 
        : 'bg-gray-50 border-gray-200'
    }`}>
      <div className="flex items-start gap-4">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
          className="mt-1 w-5 h-5 cursor-pointer"
        />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-sm font-semibold text-gray-500">
              TC{number}
            </span>
            <h3 className="font-semibold text-gray-800">
              {title}
            </h3>
          </div>
          <p className="text-sm text-gray-600 mb-2">
            {description}
          </p>
          <p className="text-xs text-gray-500">
            Requirement: <span className="font-mono">{requirement}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
