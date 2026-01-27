/**
 * Element Highlighting Test Component
 * 
 * Tests the element highlighting functionality when element picker is enabled.
 * 
 * Test Coverage:
 * - Inject highlight CSS into page
 * - Highlight element on hover
 * - Show selector tooltip
 * - Remove highlights when disabled
 * 
 * Requirements: FR-4.21
 */

import { useState } from 'react';
import { useOverlayStore } from '../stores/overlay';
import { ElementSelector } from './Overlay/ElementSelector';

export function ElementHighlightingTest() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const { elementPickerEnabled, toggleElementPicker, hoveredElement } = useOverlayStore();

  const addResult = (result: string) => {
    setTestResults((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const testToggleElementPicker = () => {
    toggleElementPicker();
    addResult(
      elementPickerEnabled
        ? '❌ Element picker disabled'
        : '✅ Element picker enabled - hover over elements below'
    );
  };

  const testHighlightCSS = () => {
    const style = document.getElementById('skill-e-element-highlight');
    if (style) {
      addResult('✅ Highlight CSS injected into page');
    } else {
      addResult('❌ Highlight CSS not found - enable element picker first');
    }
  };

  const testHoverDetection = () => {
    if (hoveredElement) {
      addResult(`✅ Element detected: ${hoveredElement.tagName} - ${hoveredElement.cssSelector}`);
    } else {
      addResult('⏳ No element hovered yet - move mouse over elements');
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Element Highlighting Test</h1>
      <p className="text-gray-600 mb-6">
        Tests element highlighting functionality (Task 15: FR-4.21)
      </p>

      {/* Element Selector Component */}
      <ElementSelector />

      {/* Test Controls */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Test Controls</h2>

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <button
              onClick={testToggleElementPicker}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                elementPickerEnabled
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              {elementPickerEnabled ? 'Disable Element Picker' : 'Enable Element Picker'}
            </button>
            <span className="text-sm text-gray-600">
              Status: {elementPickerEnabled ? '🟢 Active' : '🔴 Inactive'}
            </span>
          </div>

          <button
            onClick={testHighlightCSS}
            className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 font-medium"
          >
            Check Highlight CSS
          </button>

          <button
            onClick={testHoverDetection}
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 font-medium"
          >
            Check Hovered Element
          </button>

          <button
            onClick={clearResults}
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 font-medium"
          >
            Clear Results
          </button>
        </div>
      </div>

      {/* Current Hovered Element */}
      {hoveredElement && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold mb-2 text-blue-900">Currently Hovered Element</h3>
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium">Tag:</span>{' '}
              <code className="bg-blue-100 px-2 py-1 rounded">{hoveredElement.tagName}</code>
            </div>
            <div>
              <span className="font-medium">CSS Selector:</span>{' '}
              <code className="bg-blue-100 px-2 py-1 rounded text-xs break-all">
                {hoveredElement.cssSelector}
              </code>
            </div>
            <div>
              <span className="font-medium">XPath:</span>{' '}
              <code className="bg-blue-100 px-2 py-1 rounded text-xs break-all">
                {hoveredElement.xpath}
              </code>
            </div>
            <div>
              <span className="font-medium">Text:</span>{' '}
              <span className="text-gray-700">{hoveredElement.textContent || '(empty)'}</span>
            </div>
            <div>
              <span className="font-medium">Dimensions:</span>{' '}
              <span className="text-gray-700">
                {Math.round(hoveredElement.boundingBox.width)} × {Math.round(hoveredElement.boundingBox.height)}px
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Test Elements */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Test Elements</h2>
        <p className="text-sm text-gray-600 mb-4">
          Enable element picker and hover over these elements to test highlighting:
        </p>

        <div className="space-y-4">
          {/* Element with ID */}
          <div
            id="test-element-with-id"
            className="p-4 bg-gray-100 rounded border border-gray-300"
          >
            <strong>Element with ID:</strong> This element has id="test-element-with-id"
          </div>

          {/* Element with data-testid */}
          <div
            data-testid="test-button"
            className="p-4 bg-blue-100 rounded border border-blue-300"
          >
            <strong>Element with data-testid:</strong> This element has data-testid="test-button"
          </div>

          {/* Element with unique class */}
          <div className="unique-test-class p-4 bg-green-100 rounded border border-green-300">
            <strong>Element with unique class:</strong> This element has class="unique-test-class"
          </div>

          {/* Nested elements */}
          <div className="p-4 bg-yellow-100 rounded border border-yellow-300">
            <strong>Nested elements:</strong>
            <div className="mt-2 space-y-2">
              <button className="px-3 py-1 bg-yellow-500 text-white rounded">Button 1</button>
              <button className="px-3 py-1 bg-yellow-500 text-white rounded">Button 2</button>
              <button className="px-3 py-1 bg-yellow-500 text-white rounded">Button 3</button>
            </div>
          </div>

          {/* Complex nested structure */}
          <div className="p-4 bg-purple-100 rounded border border-purple-300">
            <strong>Complex structure:</strong>
            <div className="mt-2">
              <ul className="list-disc list-inside space-y-1">
                <li>List item 1</li>
                <li>List item 2</li>
                <li>
                  List item 3 with <a href="#" className="text-blue-600 underline">a link</a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Test Results */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Test Results</h2>
        {testResults.length === 0 ? (
          <p className="text-gray-500 italic">No test results yet. Run tests above.</p>
        ) : (
          <div className="space-y-2">
            {testResults.map((result, index) => (
              <div
                key={index}
                className="p-3 bg-gray-50 rounded border border-gray-200 font-mono text-sm"
              >
                {result}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Test Instructions:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
          <li>Click "Enable Element Picker" button</li>
          <li>Verify the blue indicator appears at the top of the screen</li>
          <li>Click "Check Highlight CSS" to verify CSS injection</li>
          <li>Hover over the test elements below</li>
          <li>Verify elements are highlighted with red outline</li>
          <li>Verify tooltip appears above hovered element showing selector info</li>
          <li>Click "Check Hovered Element" to see current element details</li>
          <li>Hover over different elements and verify selector changes</li>
          <li>Click "Disable Element Picker" and verify highlights are removed</li>
        </ol>
      </div>

      {/* Expected Behavior */}
      <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="font-semibold text-green-900 mb-2">Expected Behavior:</h3>
        <ul className="list-disc list-inside space-y-1 text-sm text-green-800">
          <li>✅ Highlight CSS is injected when element picker is enabled</li>
          <li>✅ Elements are highlighted with red outline on hover</li>
          <li>✅ Tooltip shows element tag, CSS selector, XPath, and dimensions</li>
          <li>✅ Tooltip follows the hovered element</li>
          <li>✅ Highlights are removed when element picker is disabled</li>
          <li>✅ CSS is removed from DOM when element picker is disabled</li>
          <li>✅ Crosshair cursor appears when element picker is active</li>
        </ul>
      </div>
    </div>
  );
}
