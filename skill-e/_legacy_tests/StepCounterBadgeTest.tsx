/**
 * Step Counter Badge Test Component
 * 
 * Tests the step counter badge functionality in the Timeline component.
 * 
 * Requirements tested:
 * - FR-4.33: Step Counter - Badge showing total captured steps
 * - FR-4.34: Minimize/Expand - Toggle timeline visibility
 * 
 * Test Cases:
 * 1. Badge displays correct step count
 * 2. Badge updates when steps are added
 * 3. Badge toggles timeline expand/collapse
 * 4. Badge is visible when collapsed
 * 5. Badge styling and positioning
 */

import { useState } from 'react';
import { Timeline } from './Overlay/Timeline/Timeline';
import { useRecordingStore, StepType } from '@/stores/recording';

/**
 * Test component for Step Counter Badge
 */
export function StepCounterBadgeTest() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  
  const addStep = useRecordingStore((state) => state.addStep);
  const clearSteps = useRecordingStore((state) => state.clearSteps);
  const steps = useRecordingStore((state) => state.steps);

  /**
   * Add a test result
   */
  const addResult = (result: string) => {
    setTestResults((prev) => [...prev, result]);
  };

  /**
   * Clear all test results
   */
  const clearResults = () => {
    setTestResults([]);
  };

  /**
   * Test 1: Badge displays correct step count
   */
  const testBadgeCount = () => {
    addResult('Test 1: Badge displays correct step count');
    
    // Clear existing steps
    clearSteps();
    addResult('✓ Cleared existing steps');
    
    // Add 5 steps
    for (let i = 1; i <= 5; i++) {
      addStep({
        type: 'screenshot',
        label: `Test step ${i}`,
      });
    }
    
    addResult(`✓ Added 5 steps, current count: ${steps.length}`);
    addResult('✓ Check that badge shows "5"');
  };

  /**
   * Test 2: Badge updates when steps are added
   */
  const testBadgeUpdates = async () => {
    addResult('Test 2: Badge updates when steps are added');
    
    clearSteps();
    addResult('✓ Cleared steps, badge should show "0"');
    
    // Add steps one by one with delay
    const stepTypes: StepType[] = ['screenshot', 'click', 'keystroke', 'network'];
    
    for (let i = 0; i < 4; i++) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      addStep({
        type: stepTypes[i],
        label: `${stepTypes[i]} step`,
      });
      addResult(`✓ Added ${stepTypes[i]} step, count should be ${i + 1}`);
    }
  };

  /**
   * Test 3: Badge toggles timeline expand/collapse
   */
  const testToggleExpand = () => {
    addResult('Test 3: Badge toggles timeline expand/collapse');
    addResult('✓ Click the badge to expand timeline');
    addResult('✓ Click again to collapse timeline');
    addResult('✓ Verify timeline shows/hides steps');
  };

  /**
   * Test 4: Badge is visible when collapsed
   */
  const testBadgeVisibility = () => {
    addResult('Test 4: Badge is visible when collapsed');
    
    // Ensure we have steps
    if (steps.length === 0) {
      addStep({
        type: 'screenshot',
        label: 'Test step',
      });
    }
    
    addResult('✓ Badge should be visible in collapsed state');
    addResult('✓ Badge should be in top-right area');
    addResult('✓ Badge should have blue background');
    addResult('✓ Badge should show white text');
  };

  /**
   * Test 5: Badge styling and positioning
   */
  const testBadgeStyling = () => {
    addResult('Test 5: Badge styling and positioning');
    addResult('✓ Badge should be circular');
    addResult('✓ Badge should have shadow');
    addResult('✓ Badge should scale on hover');
    addResult('✓ Badge should be clickable');
  };

  /**
   * Test 6: Multiple step types
   */
  const testMultipleStepTypes = () => {
    addResult('Test 6: Multiple step types');
    
    clearSteps();
    
    // Add different types of steps
    addStep({
      type: 'screenshot',
      label: 'Screen captured',
    });
    
    addStep({
      type: 'click',
      label: 'Clicked #submit-btn',
      data: {
        selector: '#submit-btn',
        position: { x: 100, y: 200 },
      },
    });
    
    addStep({
      type: 'keystroke',
      label: 'Typed "hello world"',
      data: {
        text: 'hello world',
      },
    });
    
    addStep({
      type: 'network',
      label: 'POST /api/login',
      data: {
        method: 'POST',
        url: '/api/login',
      },
    });
    
    addResult(`✓ Added 4 different step types, count: ${steps.length + 4}`);
    addResult('✓ Badge should show total count regardless of type');
  };

  /**
   * Test 7: Large step count
   */
  const testLargeStepCount = () => {
    addResult('Test 7: Large step count');
    
    clearSteps();
    
    // Add 50 steps
    for (let i = 1; i <= 50; i++) {
      addStep({
        type: 'screenshot',
        label: `Step ${i}`,
      });
    }
    
    addResult('✓ Added 50 steps');
    addResult('✓ Badge should display "50" clearly');
    addResult('✓ Badge should not overflow or clip text');
  };

  /**
   * Run all tests
   */
  const runAllTests = async () => {
    setIsRunning(true);
    clearResults();
    
    addResult('=== Starting Step Counter Badge Tests ===\n');
    
    testBadgeCount();
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    await testBadgeUpdates();
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    testToggleExpand();
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    testBadgeVisibility();
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    testBadgeStyling();
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    testMultipleStepTypes();
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    testLargeStepCount();
    
    addResult('\n=== Tests Complete ===');
    addResult('Please verify the visual behavior manually');
    
    setIsRunning(false);
  };

  /**
   * Quick add step helper
   */
  const quickAddStep = (type: StepType) => {
    const labels = {
      screenshot: 'Screen captured',
      click: 'Clicked element',
      keystroke: 'Typed text',
      network: 'Network request',
    };
    
    addStep({
      type,
      label: labels[type],
    });
    
    addResult(`✓ Added ${type} step, total: ${steps.length + 1}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Step Counter Badge Test</h1>
        <p className="text-gray-600 mb-6">
          Testing FR-4.33 (Step Counter) and FR-4.34 (Minimize/Expand)
        </p>

        {/* Test Controls */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Controls</h2>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <button
              onClick={runAllTests}
              disabled={isRunning}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
            >
              {isRunning ? 'Running Tests...' : 'Run All Tests'}
            </button>
            
            <button
              onClick={() => {
                clearSteps();
                clearResults();
                addResult('✓ Cleared all steps and results');
              }}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Clear All
            </button>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold mb-2">Quick Add Steps:</h3>
            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={() => quickAddStep('screenshot')}
                className="px-3 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
              >
                📷 Screenshot
              </button>
              <button
                onClick={() => quickAddStep('click')}
                className="px-3 py-2 bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
              >
                🖱️ Click
              </button>
              <button
                onClick={() => quickAddStep('keystroke')}
                className="px-3 py-2 bg-green-100 text-green-700 rounded hover:bg-green-200"
              >
                ⌨️ Keystroke
              </button>
              <button
                onClick={() => quickAddStep('network')}
                className="px-3 py-2 bg-orange-100 text-orange-700 rounded hover:bg-orange-200"
              >
                🌐 Network
              </button>
            </div>
          </div>

          <div className="border-t pt-4 mt-4">
            <h3 className="font-semibold mb-2">Individual Tests:</h3>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={testBadgeCount}
                className="px-3 py-2 bg-gray-100 rounded hover:bg-gray-200 text-sm"
              >
                Test 1: Count
              </button>
              <button
                onClick={testBadgeUpdates}
                className="px-3 py-2 bg-gray-100 rounded hover:bg-gray-200 text-sm"
              >
                Test 2: Updates
              </button>
              <button
                onClick={testToggleExpand}
                className="px-3 py-2 bg-gray-100 rounded hover:bg-gray-200 text-sm"
              >
                Test 3: Toggle
              </button>
              <button
                onClick={testBadgeVisibility}
                className="px-3 py-2 bg-gray-100 rounded hover:bg-gray-200 text-sm"
              >
                Test 4: Visibility
              </button>
              <button
                onClick={testBadgeStyling}
                className="px-3 py-2 bg-gray-100 rounded hover:bg-gray-200 text-sm"
              >
                Test 5: Styling
              </button>
              <button
                onClick={testMultipleStepTypes}
                className="px-3 py-2 bg-gray-100 rounded hover:bg-gray-200 text-sm"
              >
                Test 6: Types
              </button>
            </div>
          </div>
        </div>

        {/* Current State */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Current State</h2>
          <div className="space-y-2">
            <p>
              <span className="font-semibold">Total Steps:</span>{' '}
              <span className="text-2xl text-blue-600">{steps.length}</span>
            </p>
            <p>
              <span className="font-semibold">Last Step:</span>{' '}
              {steps.length > 0 ? steps[steps.length - 1].label : 'None'}
            </p>
          </div>
        </div>

        {/* Test Results */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Results</h2>
          <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm h-96 overflow-y-auto">
            {testResults.length === 0 ? (
              <p className="text-gray-500">No tests run yet. Click "Run All Tests" to start.</p>
            ) : (
              testResults.map((result, index) => (
                <div key={index} className="mb-1">
                  {result}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Manual Verification Checklist */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Manual Verification Checklist</h2>
          <div className="space-y-3">
            <label className="flex items-start gap-3">
              <input type="checkbox" className="mt-1" />
              <span>
                <strong>FR-4.33:</strong> Badge shows total step count accurately
              </span>
            </label>
            <label className="flex items-start gap-3">
              <input type="checkbox" className="mt-1" />
              <span>
                <strong>FR-4.34:</strong> Clicking badge toggles timeline expand/collapse
              </span>
            </label>
            <label className="flex items-start gap-3">
              <input type="checkbox" className="mt-1" />
              <span>
                Badge is visible and prominent when timeline is collapsed
              </span>
            </label>
            <label className="flex items-start gap-3">
              <input type="checkbox" className="mt-1" />
              <span>
                Badge updates in real-time as steps are added
              </span>
            </label>
            <label className="flex items-start gap-3">
              <input type="checkbox" className="mt-1" />
              <span>
                Badge has proper styling (circular, blue, white text, shadow)
              </span>
            </label>
            <label className="flex items-start gap-3">
              <input type="checkbox" className="mt-1" />
              <span>
                Badge scales on hover for visual feedback
              </span>
            </label>
            <label className="flex items-start gap-3">
              <input type="checkbox" className="mt-1" />
              <span>
                Badge handles large numbers (50+) without overflow
              </span>
            </label>
            <label className="flex items-start gap-3">
              <input type="checkbox" className="mt-1" />
              <span>
                Timeline expands smoothly when badge is clicked
              </span>
            </label>
            <label className="flex items-start gap-3">
              <input type="checkbox" className="mt-1" />
              <span>
                Timeline collapses smoothly when badge is clicked again
              </span>
            </label>
            <label className="flex items-start gap-3">
              <input type="checkbox" className="mt-1" />
              <span>
                Badge position is consistent (top-right of timeline area)
              </span>
            </label>
          </div>
        </div>

        {/* Timeline Component (Right Side) */}
        <div className="fixed right-0 top-0 h-full pointer-events-none">
          <Timeline isVisible={true} />
        </div>
      </div>
    </div>
  );
}
