/**
 * Timeline Comprehensive Test Component
 * 
 * Enhanced test interface for Task S04-32: Timeline Testing
 * Includes automated tests and manual verification checklist
 * 
 * Requirements: FR-4.29-FR-4.42
 */

import { useState, useEffect, useRef } from 'react';
import { Timeline, TimelineBadge } from './Overlay/Timeline/Timeline';
import { useRecordingStore, CaptureStep } from '@/stores/recording';

interface TestResult {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  message?: string;
  requirement: string;
}

export function TimelineComprehensiveTest() {
  const [testMode, setTestMode] = useState<'timeline' | 'badge'>('timeline');
  const [isVisible, setIsVisible] = useState(true);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [fadeTestStep, setFadeTestStep] = useState<CaptureStep | null>(null);
  const [fadeTestStartTime, setFadeTestStartTime] = useState<number | null>(null);
  
  const steps = useRecordingStore((state) => state.steps);
  const addStep = useRecordingStore((state) => state.addStep);
  const clearSteps = useRecordingStore((state) => state.clearSteps);
  const deleteStep = useRecordingStore((state) => state.deleteStep);

  // Test result helpers
  const updateTestResult = (id: string, status: TestResult['status'], message?: string) => {
    setTestResults((prev) =>
      prev.map((test) =>
        test.id === id ? { ...test, status, message } : test
      )
    );
  };

  const addTestResult = (test: TestResult) => {
    setTestResults((prev) => [...prev, test]);
  };

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

  const addMultipleSteps = (count: number = 10) => {
    const types = [addSampleScreenshot, addSampleClick, addSampleKeystroke, addSampleNetwork];
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        const randomType = types[Math.floor(Math.random() * types.length)];
        randomType();
      }, i * 300);
    }
  };

  // Automated Tests
  const runAutomatedTests = async () => {
    setIsRunningTests(true);
    setTestResults([]);
    clearSteps();

    // Test 1: Initial State
    addTestResult({
      id: 'test-1',
      name: 'Initial State - Badge shows 0',
      status: 'running',
      requirement: 'FR-4.40',
    });
    
    await sleep(500);
    
    if (steps.length === 0) {
      updateTestResult('test-1', 'passed', 'Badge correctly shows 0 steps');
    } else {
      updateTestResult('test-1', 'failed', `Expected 0 steps, got ${steps.length}`);
    }

    // Test 2: Add Single Step
    addTestResult({
      id: 'test-2',
      name: 'Add Single Step - Badge increments',
      status: 'running',
      requirement: 'FR-4.29, FR-4.33',
    });
    
    addSampleScreenshot();
    await sleep(500);
    
    if (steps.length === 1) {
      updateTestResult('test-2', 'passed', 'Step added successfully, badge shows 1');
    } else {
      updateTestResult('test-2', 'failed', `Expected 1 step, got ${steps.length}`);
    }

    // Test 3: Add Multiple Step Types
    addTestResult({
      id: 'test-3',
      name: 'Add Multiple Step Types',
      status: 'running',
      requirement: 'FR-4.29',
    });
    
    const initialCount = steps.length;
    addSampleClick();
    addSampleKeystroke();
    addSampleNetwork();
    await sleep(500);
    
    if (steps.length === initialCount + 3) {
      updateTestResult('test-3', 'passed', 'All step types added successfully');
    } else {
      updateTestResult('test-3', 'failed', `Expected ${initialCount + 3} steps, got ${steps.length}`);
    }

    // Test 4: Badge Count Accuracy
    addTestResult({
      id: 'test-4',
      name: 'Badge Count Accuracy',
      status: 'running',
      requirement: 'FR-4.33',
    });
    
    const currentCount = steps.length;
    if (currentCount === 4) {
      updateTestResult('test-4', 'passed', `Badge accurately shows ${currentCount} steps`);
    } else {
      updateTestResult('test-4', 'failed', `Badge count mismatch: ${currentCount}`);
    }

    // Test 5: Delete Step
    addTestResult({
      id: 'test-5',
      name: 'Delete Step - Badge decrements',
      status: 'running',
      requirement: 'FR-4.36',
    });
    
    const beforeDelete = steps.length;
    if (steps.length > 0) {
      deleteStep(steps[0].id);
      await sleep(500);
      
      if (steps.length === beforeDelete - 1) {
        updateTestResult('test-5', 'passed', 'Step deleted, badge decremented');
      } else {
        updateTestResult('test-5', 'failed', `Expected ${beforeDelete - 1} steps, got ${steps.length}`);
      }
    } else {
      updateTestResult('test-5', 'failed', 'No steps to delete');
    }

    // Test 6: Clear All Steps
    addTestResult({
      id: 'test-6',
      name: 'Clear All Steps',
      status: 'running',
      requirement: 'FR-4.29',
    });
    
    clearSteps();
    await sleep(500);
    
    if (steps.length === 0) {
      updateTestResult('test-6', 'passed', 'All steps cleared successfully');
    } else {
      updateTestResult('test-6', 'failed', `Expected 0 steps, got ${steps.length}`);
    }

    // Test 7: Rapid Step Addition
    addTestResult({
      id: 'test-7',
      name: 'Rapid Step Addition - Performance',
      status: 'running',
      requirement: 'FR-4.30',
    });
    
    const startTime = Date.now();
    for (let i = 0; i < 20; i++) {
      addSampleScreenshot();
    }
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    await sleep(1000);
    
    if (steps.length === 20 && duration < 1000) {
      updateTestResult('test-7', 'passed', `Added 20 steps in ${duration}ms`);
    } else {
      updateTestResult('test-7', 'failed', `Performance issue: ${duration}ms for 20 steps`);
    }

    setIsRunningTests(false);
  };

  // Start Fade Test
  const startFadeTest = () => {
    clearSteps();
    addSampleScreenshot();
    const newStep = steps[steps.length - 1] || null;
    setFadeTestStep(newStep);
    setFadeTestStartTime(Date.now());
  };

  // Check fade test status
  useEffect(() => {
    if (fadeTestStartTime && fadeTestStep) {
      const checkInterval = setInterval(() => {
        const elapsed = Date.now() - fadeTestStartTime;
        if (elapsed >= 5000) {
          console.log('✅ Fade test: 5 seconds elapsed. Check if step has faded to 50% opacity.');
          clearInterval(checkInterval);
        }
      }, 1000);

      return () => clearInterval(checkInterval);
    }
  }, [fadeTestStartTime, fadeTestStep]);

  const handleStepClick = (step: CaptureStep) => {
    console.log('✅ Step clicked:', step);
  };

  const handleStepDelete = (stepId: string) => {
    console.log('✅ Step deleted:', stepId);
  };

  const handleStepEditNote = (stepId: string, note: string) => {
    console.log('✅ Step note edited:', stepId, note);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Timeline Comprehensive Test Suite
          </h1>
          <p className="text-gray-600 mb-4">
            Task S04-32: Testing all timeline functionality (FR-4.29 - FR-4.42)
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
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Total Steps:</span>
                <span className="ml-2 font-semibold text-gray-800">{steps.length}</span>
              </div>
              <div>
                <span className="text-gray-600">Test Mode:</span>
                <span className="ml-2 font-semibold text-gray-800">{testMode}</span>
              </div>
              <div>
                <span className="text-gray-600">Automated Tests:</span>
                <span className="ml-2 font-semibold text-gray-800">
                  {testResults.filter((t) => t.status === 'passed').length} / {testResults.length}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Left Column: Controls */}
          <div className="space-y-6">
            {/* Manual Controls */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Manual Test Controls
              </h2>
              
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={addSampleScreenshot}
                    className="px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium text-sm"
                  >
                    📷 Screenshot
                  </button>
                  <button
                    onClick={addSampleClick}
                    className="px-4 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors font-medium text-sm"
                  >
                    🖱️ Click
                  </button>
                  <button
                    onClick={addSampleKeystroke}
                    className="px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium text-sm"
                  >
                    ⌨️ Keystroke
                  </button>
                  <button
                    onClick={addSampleNetwork}
                    className="px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium text-sm"
                  >
                    🌐 Network
                  </button>
                </div>

                <button
                  onClick={() => addMultipleSteps(10)}
                  className="w-full px-4 py-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors font-medium"
                >
                  ⚡ Add 10 Random Steps
                </button>

                <button
                  onClick={() => addMultipleSteps(50)}
                  className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                >
                  🚀 Add 50 Steps (Performance Test)
                </button>

                <button
                  onClick={clearSteps}
                  className="w-full px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
                >
                  🗑️ Clear All Steps
                </button>
              </div>
            </div>

            {/* Automated Tests */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Automated Tests
              </h2>
              
              <button
                onClick={runAutomatedTests}
                disabled={isRunningTests}
                className={`w-full px-4 py-3 rounded-lg font-medium transition-colors ${
                  isRunningTests
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-green-500 text-white hover:bg-green-600'
                }`}
              >
                {isRunningTests ? '⏳ Running Tests...' : '▶️ Run Automated Tests'}
              </button>

              {testResults.length > 0 && (
                <div className="mt-4 space-y-2 max-h-96 overflow-y-auto">
                  {testResults.map((test) => (
                    <div
                      key={test.id}
                      className={`p-3 rounded-lg border ${
                        test.status === 'passed'
                          ? 'bg-green-50 border-green-200'
                          : test.status === 'failed'
                          ? 'bg-red-50 border-red-200'
                          : test.status === 'running'
                          ? 'bg-blue-50 border-blue-200'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-lg">
                          {test.status === 'passed'
                            ? '✅'
                            : test.status === 'failed'
                            ? '❌'
                            : test.status === 'running'
                            ? '⏳'
                            : '⏸️'}
                        </span>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-800">
                            {test.name}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {test.requirement}
                          </p>
                          {test.message && (
                            <p className="text-xs text-gray-600 mt-1">
                              {test.message}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Fade Test */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Fade Test (FR-4.31)
              </h2>
              
              <button
                onClick={startFadeTest}
                className="w-full px-4 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors font-medium mb-3"
              >
                ⏱️ Start 5-Second Fade Test
              </button>

              {fadeTestStartTime && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-gray-700">
                    ⏳ Fade test running... Watch the timeline for the step to fade to 50% opacity after 5 seconds.
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Started: {new Date(fadeTestStartTime).toLocaleTimeString()}
                  </p>
                </div>
              )}

              <div className="mt-3 text-xs text-gray-600 space-y-1">
                <p>✅ Step should remain at 100% opacity for 5 seconds</p>
                <p>✅ After 5 seconds, step should fade to 50% opacity</p>
                <p>✅ Hovering timeline should restore to 100% opacity</p>
              </div>
            </div>
          </div>

          {/* Right Column: Manual Checklist */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Manual Verification Checklist
              </h2>
              
              <div className="space-y-4 max-h-[800px] overflow-y-auto">
                <ChecklistSection title="Display & Positioning">
                  <ChecklistItem
                    label="Timeline positioned on right edge"
                    requirement="FR-4.39"
                  />
                  <ChecklistItem
                    label="Collapsed by default (badge only)"
                    requirement="FR-4.40"
                  />
                  <ChecklistItem
                    label="Badge shows correct step count"
                    requirement="FR-4.33"
                  />
                </ChecklistSection>

                <ChecklistSection title="Expand/Collapse">
                  <ChecklistItem
                    label="Click badge to expand timeline"
                    requirement="FR-4.41"
                  />
                  <ChecklistItem
                    label="Smooth expand animation (~300ms)"
                    requirement="FR-4.41"
                  />
                  <ChecklistItem
                    label="Click to collapse timeline"
                    requirement="FR-4.34"
                  />
                  <ChecklistItem
                    label="Hover shows tooltip hint"
                    requirement="FR-4.41"
                  />
                </ChecklistSection>

                <ChecklistSection title="Step Display">
                  <ChecklistItem
                    label="New steps slide in from right"
                    requirement="FR-4.30"
                  />
                  <ChecklistItem
                    label="Screenshot: 📷 Blue"
                    requirement="FR-4.29"
                  />
                  <ChecklistItem
                    label="Click: 🖱️ Purple"
                    requirement="FR-4.29"
                  />
                  <ChecklistItem
                    label="Keystroke: ⌨️ Green"
                    requirement="FR-4.29"
                  />
                  <ChecklistItem
                    label="Network: 🌐 Orange"
                    requirement="FR-4.29"
                  />
                </ChecklistSection>

                <ChecklistSection title="Fade Behavior">
                  <ChecklistItem
                    label="Steps fade to 50% after 5 seconds"
                    requirement="FR-4.31"
                  />
                  <ChecklistItem
                    label="Hover restores all steps to 100%"
                    requirement="FR-4.32"
                  />
                  <ChecklistItem
                    label="Smooth fade transition"
                    requirement="FR-4.31"
                  />
                </ChecklistSection>

                <ChecklistSection title="Scrolling">
                  <ChecklistItem
                    label="Scrollable with many steps"
                    requirement="FR-4.42"
                  />
                  <ChecklistItem
                    label="Auto-scrolls to newest step"
                    requirement="FR-4.42"
                  />
                  <ChecklistItem
                    label="Custom thin scrollbar"
                    requirement="FR-4.42"
                  />
                </ChecklistSection>

                <ChecklistSection title="Step Interactions">
                  <ChecklistItem
                    label="Click step to expand details"
                    requirement="FR-4.35"
                  />
                  <ChecklistItem
                    label="Shows timestamp and data"
                    requirement="FR-4.35"
                  />
                  <ChecklistItem
                    label="Can add/edit notes"
                    requirement="FR-4.37"
                  />
                  <ChecklistItem
                    label="Can delete step (with confirmation)"
                    requirement="FR-4.36"
                  />
                </ChecklistSection>

                <ChecklistSection title="Performance">
                  <ChecklistItem
                    label="Smooth with 50+ steps"
                    requirement="FR-4.42"
                  />
                  <ChecklistItem
                    label="No lag or stuttering"
                    requirement="NFR"
                  />
                  <ChecklistItem
                    label="Animations remain smooth"
                    requirement="NFR"
                  />
                </ChecklistSection>
              </div>
            </div>
          </div>
        </div>
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

// Helper Components
interface ChecklistSectionProps {
  title: string;
  children: React.ReactNode;
}

function ChecklistSection({ title, children }: ChecklistSectionProps) {
  return (
    <div className="border-l-4 border-blue-500 pl-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-2">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

interface ChecklistItemProps {
  label: string;
  requirement: string;
}

function ChecklistItem({ label, requirement }: ChecklistItemProps) {
  return (
    <div className="flex items-start gap-2 p-2 bg-gray-50 rounded">
      <input type="checkbox" className="mt-1 w-4 h-4" />
      <div className="flex-1">
        <p className="text-sm text-gray-800">{label}</p>
        <p className="text-xs text-gray-500">{requirement}</p>
      </div>
    </div>
  );
}

// Helper function
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
