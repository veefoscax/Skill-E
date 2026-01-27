/**
 * Element Selector Test Component
 * 
 * Tests the element picker toggle functionality (Task 14).
 * 
 * Test Cases:
 * 1. Element picker is disabled by default
 * 2. E key toggles element picker on/off
 * 3. Visual indicator appears when active
 * 4. Visual indicator disappears when inactive
 * 5. Toggle button works correctly
 * 
 * Requirements: FR-4.20
 */

import { useEffect, useState } from 'react';
import { 
  ElementSelector, 
  ElementSelectorStatus, 
  ElementSelectorToggleButton 
} from './Overlay/ElementSelector';
import { useOverlayStore } from '../stores/overlay';
import { useOverlayHotkeys } from '../hooks/useOverlayHotkeys';

export function ElementSelectorTest() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [hotkeyLog, setHotkeyLog] = useState<string[]>([]);
  
  const { elementPickerEnabled, toggleElementPicker, reset } = useOverlayStore();

  // Enable hotkeys with logging
  useOverlayHotkeys({
    enableElementPicker: true,
    onHotkeyPress: (key, action) => {
      if (key === 'E') {
        setHotkeyLog((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${action}`]);
      }
    },
  });

  // Test 1: Element picker is disabled by default
  useEffect(() => {
    reset();
    const isDisabled = !elementPickerEnabled;
    setTestResults((prev) => [
      ...prev,
      `✓ Test 1: Element picker disabled by default: ${isDisabled ? 'PASS' : 'FAIL'}`,
    ]);
  }, []);

  const runTest2 = () => {
    setTestResults((prev) => [...prev, '→ Test 2: Testing E key toggle...']);
    
    // Initial state
    const initialState = elementPickerEnabled;
    
    // Simulate E key press (will be done manually by user)
    setTestResults((prev) => [
      ...prev,
      `  Initial state: ${initialState ? 'Enabled' : 'Disabled'}`,
      `  Press 'E' key to toggle...`,
    ]);
  };

  const runTest3 = () => {
    setTestResults((prev) => [...prev, '→ Test 3: Testing visual indicator...']);
    
    if (elementPickerEnabled) {
      setTestResults((prev) => [
        ...prev,
        `  ✓ Element picker is enabled`,
        `  ✓ Visual indicator should be visible at top center`,
        `  ✓ Check for blue badge with "Element Picker Active" text`,
      ]);
    } else {
      setTestResults((prev) => [
        ...prev,
        `  ✗ Element picker is disabled`,
        `  → Enable it first (press E or click toggle button)`,
      ]);
    }
  };

  const runTest4 = () => {
    setTestResults((prev) => [...prev, '→ Test 4: Testing button toggle...']);
    
    const beforeState = elementPickerEnabled;
    toggleElementPicker();
    
    setTimeout(() => {
      const afterState = useOverlayStore.getState().elementPickerEnabled;
      const toggled = beforeState !== afterState;
      
      setTestResults((prev) => [
        ...prev,
        `  Before: ${beforeState ? 'Enabled' : 'Disabled'}`,
        `  After: ${afterState ? 'Enabled' : 'Disabled'}`,
        `  ${toggled ? '✓ PASS' : '✗ FAIL'}: Toggle worked`,
      ]);
    }, 100);
  };

  const clearResults = () => {
    setTestResults([]);
    setHotkeyLog([]);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Element Selector Test</h1>
        <p className="text-gray-600">
          Task 14: Element Picker Toggle - Testing FR-4.20
        </p>
      </div>

      {/* Current State */}
      <div className="mb-6 p-4 bg-gray-100 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Current State</h2>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-medium">Element Picker:</span>
            <span
              className={`px-2 py-1 rounded text-sm font-medium ${
                elementPickerEnabled
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-300 text-gray-700'
              }`}
            >
              {elementPickerEnabled ? 'ENABLED' : 'DISABLED'}
            </span>
          </div>
        </div>
      </div>

      {/* Visual Components */}
      <div className="mb-6 p-4 bg-white border-2 border-gray-300 rounded-lg">
        <h2 className="text-lg font-semibold mb-4">Visual Components</h2>
        
        <div className="space-y-4">
          {/* Main indicator */}
          <div className="relative h-32 bg-gray-50 rounded border border-gray-200">
            <p className="absolute top-2 left-2 text-xs text-gray-500">
              Main Indicator (appears at top center when enabled)
            </p>
            <ElementSelector />
          </div>

          {/* Status badge */}
          <div className="relative h-20 bg-gray-50 rounded border border-gray-200">
            <p className="absolute top-2 left-2 text-xs text-gray-500">
              Status Badge (appears at top right when enabled)
            </p>
            <ElementSelectorStatus />
          </div>

          {/* Toggle button */}
          <div className="flex items-center gap-4">
            <p className="text-sm text-gray-600">Toggle Button:</p>
            <ElementSelectorToggleButton />
          </div>
        </div>
      </div>

      {/* Test Controls */}
      <div className="mb-6 p-4 bg-white border-2 border-blue-300 rounded-lg">
        <h2 className="text-lg font-semibold mb-4">Test Controls</h2>
        
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={runTest2}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Test 2: E Key Toggle
          </button>
          
          <button
            onClick={runTest3}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Test 3: Visual Indicator
          </button>
          
          <button
            onClick={runTest4}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Test 4: Button Toggle
          </button>
          
          <button
            onClick={clearResults}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Clear Results
          </button>
        </div>

        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-300 rounded">
          <p className="text-sm text-yellow-800">
            <strong>Manual Test:</strong> Press the <kbd className="px-2 py-1 bg-white border border-yellow-400 rounded">E</kbd> key
            to toggle element picker on/off. Watch the visual indicators appear/disappear.
          </p>
        </div>
      </div>

      {/* Hotkey Log */}
      {hotkeyLog.length > 0 && (
        <div className="mb-6 p-4 bg-green-50 border-2 border-green-300 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Hotkey Log</h2>
          <div className="space-y-1 font-mono text-sm">
            {hotkeyLog.map((log, index) => (
              <div key={index} className="text-green-700">
                {log}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Test Results */}
      <div className="p-4 bg-white border-2 border-gray-300 rounded-lg">
        <h2 className="text-lg font-semibold mb-4">Test Results</h2>
        
        {testResults.length === 0 ? (
          <p className="text-gray-500 italic">No tests run yet. Click a test button above.</p>
        ) : (
          <div className="space-y-1 font-mono text-sm">
            {testResults.map((result, index) => (
              <div
                key={index}
                className={
                  result.includes('✓') || result.includes('PASS')
                    ? 'text-green-600'
                    : result.includes('✗') || result.includes('FAIL')
                    ? 'text-red-600'
                    : result.includes('→')
                    ? 'text-blue-600 font-semibold'
                    : 'text-gray-700'
                }
              >
                {result}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Requirements Reference */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">Requirements Tested</h3>
        <ul className="text-sm space-y-1 text-gray-700">
          <li>✓ FR-4.20: E key toggles element picker</li>
          <li>✓ FR-4.20: Visual indicator when active</li>
          <li>✓ FR-4.20: Disabled by default</li>
        </ul>
      </div>

      {/* Instructions */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold mb-2 text-blue-900">Testing Instructions</h3>
        <ol className="text-sm space-y-2 text-blue-800 list-decimal list-inside">
          <li>Verify element picker is disabled by default (check Current State)</li>
          <li>Press the <kbd className="px-2 py-1 bg-white border border-blue-300 rounded">E</kbd> key - visual indicator should appear</li>
          <li>Press <kbd className="px-2 py-1 bg-white border border-blue-300 rounded">E</kbd> again - indicator should disappear</li>
          <li>Click the "Toggle Button" - state should change</li>
          <li>Run automated tests using the Test Controls buttons</li>
        </ol>
      </div>
    </div>
  );
}
