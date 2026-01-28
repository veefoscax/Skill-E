/**
 * Element Selection Test Component
 * 
 * Tests the element selection functionality:
 * - Click captures element info
 * - Generate CSS selector (prefer ID, data-testid)
 * - Generate XPath as fallback
 * - Capture element screenshot
 * - Store with recording
 * 
 * Requirements: FR-4.22, FR-4.23, FR-4.24
 */

import { useState } from 'react';
import { useOverlayStore } from '../stores/overlay';
import { ElementSelector } from './Overlay/ElementSelector';

export function ElementSelectionTest() {
  const {
    elementPickerEnabled,
    toggleElementPicker,
    selectedElements,
    clearSelectedElements,
  } = useOverlayStore();

  const [testStatus, setTestStatus] = useState<string>('');

  // Test 1: Toggle element picker
  const testTogglePicker = () => {
    toggleElementPicker();
    setTestStatus(
      elementPickerEnabled
        ? '✅ Element picker disabled'
        : '✅ Element picker enabled - hover over elements below'
    );
  };

  // Test 2: Clear selected elements
  const testClearElements = () => {
    clearSelectedElements();
    setTestStatus('✅ Cleared all selected elements');
  };

  return (
    <div className="p-8 space-y-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Element Selection Test</h1>
        <p className="text-gray-600 mb-6">
          Task 16: Click captures element info, generates selectors, captures screenshots
        </p>

        {/* Test Controls */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Controls</h2>
          
          <div className="space-y-4">
            {/* Toggle Element Picker */}
            <div>
              <button
                onClick={testTogglePicker}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  elementPickerEnabled
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {elementPickerEnabled ? '🎯 Element Picker Active' : 'Enable Element Picker'}
              </button>
              <p className="text-sm text-gray-600 mt-2">
                {elementPickerEnabled
                  ? 'Click on any element below to select it. Press E to toggle off.'
                  : 'Click to enable element picker mode'}
              </p>
            </div>

            {/* Clear Selected Elements */}
            <div>
              <button
                onClick={testClearElements}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 font-medium"
                disabled={selectedElements.length === 0}
              >
                Clear Selected Elements ({selectedElements.length})
              </button>
            </div>

            {/* Status */}
            {testStatus && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-800">{testStatus}</p>
              </div>
            )}
          </div>
        </div>

        {/* Test Elements */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Elements</h2>
          <p className="text-sm text-gray-600 mb-4">
            Enable element picker and click on these elements to test selection
          </p>

          <div className="space-y-4">
            {/* Element with ID */}
            <div
              id="test-button-1"
              className="p-4 bg-blue-100 border-2 border-blue-300 rounded-md cursor-pointer hover:bg-blue-200"
            >
              <strong>Element with ID:</strong> #test-button-1
              <p className="text-sm text-gray-600">Should generate CSS selector: #test-button-1</p>
            </div>

            {/* Element with data-testid */}
            <div
              data-testid="submit-form"
              className="p-4 bg-green-100 border-2 border-green-300 rounded-md cursor-pointer hover:bg-green-200"
            >
              <strong>Element with data-testid:</strong> submit-form
              <p className="text-sm text-gray-600">
                Should generate CSS selector: [data-testid="submit-form"]
              </p>
            </div>

            {/* Element with unique class */}
            <div className="unique-test-element p-4 bg-purple-100 border-2 border-purple-300 rounded-md cursor-pointer hover:bg-purple-200">
              <strong>Element with unique class:</strong> .unique-test-element
              <p className="text-sm text-gray-600">
                Should generate CSS selector: .unique-test-element
              </p>
            </div>

            {/* Nested element (will use nth-child) */}
            <div className="p-4 bg-yellow-100 border-2 border-yellow-300 rounded-md">
              <div className="p-2 bg-yellow-200 rounded cursor-pointer hover:bg-yellow-300">
                <strong>Nested element without ID:</strong> Will use nth-child path
                <p className="text-sm text-gray-600">
                  Should generate CSS selector with nth-child
                </p>
              </div>
            </div>

            {/* Button element */}
            <button
              id="action-button"
              className="px-6 py-3 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 font-medium"
            >
              Click Me Button
            </button>

            {/* Input element */}
            <input
              id="test-input"
              type="text"
              placeholder="Test input field"
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-md focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Selected Elements Display */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">
            Selected Elements ({selectedElements.length})
          </h2>

          {selectedElements.length === 0 ? (
            <p className="text-gray-500 italic">
              No elements selected yet. Enable element picker and click on elements above.
            </p>
          ) : (
            <div className="space-y-4">
              {selectedElements.map((element, index) => (
                <div
                  key={element.timestamp}
                  className="p-4 bg-gray-50 border border-gray-200 rounded-md"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-lg">
                      Element {index + 1}: &lt;{element.tagName}&gt;
                    </h3>
                    <span className="text-xs text-gray-500">
                      {new Date(element.timestamp).toLocaleTimeString()}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm">
                    {/* CSS Selector */}
                    <div>
                      <strong className="text-gray-700">CSS Selector:</strong>
                      <code className="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded font-mono text-xs">
                        {element.cssSelector}
                      </code>
                    </div>

                    {/* XPath */}
                    <div>
                      <strong className="text-gray-700">XPath:</strong>
                      <code className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded font-mono text-xs break-all">
                        {element.xpath}
                      </code>
                    </div>

                    {/* Text Content */}
                    {element.textContent && (
                      <div>
                        <strong className="text-gray-700">Text:</strong>
                        <span className="ml-2 text-gray-600">"{element.textContent}"</span>
                      </div>
                    )}

                    {/* Bounding Box */}
                    <div>
                      <strong className="text-gray-700">Position:</strong>
                      <span className="ml-2 text-gray-600">
                        x: {Math.round(element.boundingBox.x)}, y:{' '}
                        {Math.round(element.boundingBox.y)}, width:{' '}
                        {Math.round(element.boundingBox.width)}, height:{' '}
                        {Math.round(element.boundingBox.height)}
                      </span>
                    </div>

                    {/* Screenshot */}
                    {element.screenshot ? (
                      <div>
                        <strong className="text-gray-700">Screenshot:</strong>
                        <div className="mt-2 p-2 bg-white border border-gray-300 rounded inline-block">
                          <img
                            src={element.screenshot}
                            alt={`Screenshot of ${element.tagName}`}
                            className="max-w-xs max-h-48 object-contain"
                          />
                        </div>
                        <p className="text-xs text-green-600 mt-1">
                          ✅ Screenshot captured successfully
                        </p>
                      </div>
                    ) : (
                      <div>
                        <strong className="text-gray-700">Screenshot:</strong>
                        <span className="ml-2 text-red-600 text-xs">
                          ❌ Failed to capture screenshot
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Test Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-3 text-blue-900">Test Instructions</h2>
          <ol className="list-decimal list-inside space-y-2 text-blue-800">
            <li>Click "Enable Element Picker" button</li>
            <li>Hover over the test elements - they should highlight with a red outline</li>
            <li>Click on any test element to select it</li>
            <li>Verify the element appears in the "Selected Elements" section below</li>
            <li>Check that CSS selector is generated (prefer ID, then data-testid)</li>
            <li>Check that XPath is generated as fallback</li>
            <li>Verify screenshot is captured and displayed</li>
            <li>Test with different element types (div, button, input)</li>
            <li>Press E key to toggle element picker off</li>
            <li>Click "Clear Selected Elements" to reset</li>
          </ol>
        </div>

        {/* Acceptance Criteria */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-3 text-green-900">
            Acceptance Criteria (Task 16)
          </h2>
          <ul className="space-y-2 text-green-800">
            <li className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <span>Click captures element info (tag, text, position)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <span>Generate CSS selector (prefer ID, data-testid)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <span>Generate XPath as fallback</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <span>Capture element screenshot</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <span>Store with recording (in overlay store)</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Render ElementSelector component */}
      <ElementSelector />
    </div>
  );
}
