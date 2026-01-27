/**
 * Cursor Highlight Test Component
 * 
 * Test page for the cursor highlight feature.
 * Allows configuration and testing of the cursor highlight during recording.
 * 
 * Requirements: FR-4.5
 */

import { useState } from 'react';
import { CursorHighlight, CursorHighlightWithClick } from './Overlay/CursorHighlight';
import { useOverlayStore } from '@/stores/overlay';

export function CursorHighlightTest() {
  const {
    cursorHighlight,
    toggleCursorHighlight,
    setCursorHighlightConfig,
    recordingStatus,
    setRecordingStatus,
  } = useOverlayStore();

  const [localSize, setLocalSize] = useState(cursorHighlight.size);
  const [localThickness, setLocalThickness] = useState(cursorHighlight.thickness);
  const [localColor, setLocalColor] = useState(cursorHighlight.color);
  const [localClickEffect, setLocalClickEffect] = useState(cursorHighlight.showClickEffect);

  const applySettings = () => {
    setCursorHighlightConfig({
      size: localSize,
      thickness: localThickness,
      color: localColor,
      showClickEffect: localClickEffect,
    });
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Cursor Highlight Test</h1>
      
      {/* Status */}
      <div className="mb-6 p-4 bg-gray-100 rounded-lg">
        <p className="font-medium">Recording Status: 
          <span className={`ml-2 ${
            recordingStatus === 'recording' ? 'text-red-500' :
            recordingStatus === 'paused' ? 'text-yellow-500' :
            'text-gray-500'
          }`}>
            {recordingStatus}
          </span>
        </p>
        <p className="font-medium mt-2">Cursor Highlight: 
          <span className={`ml-2 ${cursorHighlight.enabled ? 'text-green-500' : 'text-gray-500'}`}>
            {cursorHighlight.enabled ? 'Enabled' : 'Disabled'}
          </span>
        </p>
      </div>

      {/* Controls */}
      <div className="mb-6 space-y-4">
        <div className="flex gap-4">
          <button
            onClick={() => setRecordingStatus(recordingStatus === 'recording' ? 'stopped' : 'recording')}
            className={`px-4 py-2 rounded-lg font-medium ${
              recordingStatus === 'recording'
                ? 'bg-red-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {recordingStatus === 'recording' ? 'Stop Recording' : 'Start Recording'}
          </button>
          
          <button
            onClick={toggleCursorHighlight}
            className={`px-4 py-2 rounded-lg font-medium ${
              cursorHighlight.enabled
                ? 'bg-green-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {cursorHighlight.enabled ? 'Disable Highlight' : 'Enable Highlight'}
          </button>
        </div>

        {/* Configuration */}
        <div className="p-4 border rounded-lg space-y-4">
          <h2 className="font-medium">Configuration</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Size (px)</label>
              <input
                type="range"
                min="16"
                max="64"
                value={localSize}
                onChange={(e) => setLocalSize(Number(e.target.value))}
                className="w-full"
              />
              <span className="text-sm text-gray-500">{localSize}px</span>
            </div>
            
            <div>
              <label className="block text-sm text-gray-600 mb-1">Thickness (px)</label>
              <input
                type="range"
                min="1"
                max="5"
                value={localThickness}
                onChange={(e) => setLocalThickness(Number(e.target.value))}
                className="w-full"
              />
              <span className="text-sm text-gray-500">{localThickness}px</span>
            </div>
          </div>
          
          <div>
            <label className="block text-sm text-gray-600 mb-1">Color</label>
            <div className="flex gap-2">
              {['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'].map((color) => (
                <button
                  key={color}
                  onClick={() => setLocalColor(color)}
                  className={`w-8 h-8 rounded-full border-2 ${
                    localColor === color ? 'border-gray-800' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="clickEffect"
              checked={localClickEffect}
              onChange={(e) => setLocalClickEffect(e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="clickEffect" className="text-sm">Show click ripple effect</label>
          </div>
          
          <button
            onClick={applySettings}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Apply Settings
          </button>
        </div>
      </div>

      {/* Test Area */}
      <div className="p-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 min-h-[300px]">
        <p className="text-center text-gray-500 mb-4">
          Move your mouse here to test the cursor highlight
        </p>
        <p className="text-center text-sm text-gray-400">
          Click to see ripple effect (if enabled)
        </p>
      </div>

      {/* Instructions */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-medium text-blue-900 mb-2">Instructions</h3>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Start recording to enable cursor highlight</li>
          <li>Move your mouse around to see the highlight ring</li>
          <li>Click to see the ripple effect (if enabled)</li>
          <li>Adjust size, thickness, and color to your preference</li>
          <li>The highlight only appears during active recording</li>
        </ul>
      </div>

      {/* Cursor Highlight Component */}
      <CursorHighlight
        size={cursorHighlight.size}
        color={cursorHighlight.color}
        visible={cursorHighlight.enabled}
        thickness={cursorHighlight.thickness}
      />
    </div>
  );
}
