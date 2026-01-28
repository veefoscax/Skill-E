/**
 * Hotkey Integration Test Component
 * 
 * Tests the centralized hotkey system for overlay UI.
 * 
 * Tests:
 * - Color selection (1, 2, 3)
 * - Pin mode toggle (P)
 * - Clear drawings (C)
 * - Element picker toggle (E)
 * - Keyboard display toggle (K)
 * 
 * Requirements: FR-4.10, FR-4.13, FR-4.14, FR-4.20
 */

import { useState } from 'react';
import { useOverlayStore, getColorHex } from '../stores/overlay';
import { useOverlayHotkeys, getHotkeyList } from '../hooks/useOverlayHotkeys';

export function HotkeyIntegrationTest() {
  const [hotkeyLog, setHotkeyLog] = useState<Array<{ key: string; action: string; timestamp: string }>>([]);
  
  // Get overlay store state
  const {
    currentColor,
    isPinMode,
    drawings,
    elementPickerEnabled,
    keyboard,
    setColor,
    togglePinMode,
    clearDrawings,
    toggleElementPicker,
    toggleKeyboardDisplay,
    addDrawing,
  } = useOverlayStore();

  // Enable hotkeys with logging
  useOverlayHotkeys({
    enableColorSelection: true,
    enablePinToggle: true,
    enableClear: true,
    enableElementPicker: true,
    enableKeyboardToggle: true,
    onHotkeyPress: (key, action) => {
      const timestamp = new Date().toLocaleTimeString();
      setHotkeyLog(prev => [{ key, action, timestamp }, ...prev].slice(0, 10));
    },
  });

  // Add test drawing
  const addTestDrawing = () => {
    addDrawing({
      type: 'arrow',
      color: currentColor,
      startPoint: { x: 100, y: 100 },
      endPoint: { x: 200, y: 200 },
      isPinned: isPinMode,
    });
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Hotkey Integration Test</h1>
          <p className="text-zinc-400">
            Test centralized hotkey system for overlay UI controls
          </p>
        </div>

        {/* Hotkey Reference */}
        <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800">
          <h2 className="text-xl font-semibold mb-4">Available Hotkeys</h2>
          <div className="grid grid-cols-2 gap-4">
            {getHotkeyList().map(({ key, description }) => (
              <div key={key} className="flex items-center gap-3">
                <kbd className="px-3 py-1.5 bg-zinc-800 rounded border border-zinc-700 font-mono text-sm min-w-[40px] text-center">
                  {key}
                </kbd>
                <span className="text-sm text-zinc-300">{description}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Current State */}
        <div className="grid grid-cols-2 gap-6">
          {/* Color State */}
          <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800">
            <h3 className="text-lg font-semibold mb-4">Current Color</h3>
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-lg border-2 border-white/20"
                style={{ backgroundColor: getColorHex(currentColor) }}
              />
              <div>
                <p className="text-2xl font-bold">
                  {currentColor === 'COLOR_1' ? '1' : currentColor === 'COLOR_2' ? '2' : '3'}
                </p>
                <p className="text-sm text-zinc-400">
                  {currentColor === 'COLOR_1' ? 'Red' : currentColor === 'COLOR_2' ? 'Blue' : 'Green'}
                </p>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setColor('COLOR_1')}
                className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 rounded border border-red-500/50 text-sm"
              >
                Set Red (1)
              </button>
              <button
                onClick={() => setColor('COLOR_2')}
                className="px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 rounded border border-blue-500/50 text-sm"
              >
                Set Blue (2)
              </button>
              <button
                onClick={() => setColor('COLOR_3')}
                className="px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 rounded border border-green-500/50 text-sm"
              >
                Set Green (3)
              </button>
            </div>
          </div>

          {/* Pin Mode State */}
          <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800">
            <h3 className="text-lg font-semibold mb-4">Pin Mode</h3>
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-lg border-2 flex items-center justify-center text-3xl ${
                isPinMode ? 'bg-yellow-500/20 border-yellow-500' : 'bg-zinc-800 border-zinc-700'
              }`}>
                {isPinMode ? '📌' : '⏱️'}
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {isPinMode ? 'Pinned' : 'Fade'}
                </p>
                <p className="text-sm text-zinc-400">
                  {isPinMode ? 'Drawings stay' : 'Fade after 3s'}
                </p>
              </div>
            </div>
            <button
              onClick={togglePinMode}
              className="mt-4 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded border border-zinc-700 text-sm w-full"
            >
              Toggle Pin Mode (P)
            </button>
          </div>

          {/* Drawings State */}
          <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800">
            <h3 className="text-lg font-semibold mb-4">Drawings</h3>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-lg border-2 border-zinc-700 bg-zinc-800 flex items-center justify-center">
                <span className="text-3xl font-bold">{drawings.length}</span>
              </div>
              <div>
                <p className="text-2xl font-bold">{drawings.length} Drawings</p>
                <p className="text-sm text-zinc-400">
                  {drawings.filter(d => d.isPinned).length} pinned
                </p>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={addTestDrawing}
                className="flex-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded border border-zinc-700 text-sm"
              >
                Add Test Drawing
              </button>
              <button
                onClick={clearDrawings}
                className="flex-1 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded border border-red-500/50 text-sm"
              >
                Clear All (C)
              </button>
            </div>
          </div>

          {/* Other States */}
          <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800">
            <h3 className="text-lg font-semibold mb-4">Other Features</h3>
            <div className="space-y-3">
              {/* Element Picker */}
              <div className="flex items-center justify-between p-3 bg-zinc-800 rounded">
                <div>
                  <p className="font-medium">Element Picker</p>
                  <p className="text-xs text-zinc-400">Press E to toggle</p>
                </div>
                <div className={`px-3 py-1 rounded text-sm font-medium ${
                  elementPickerEnabled 
                    ? 'bg-green-500/20 text-green-400 border border-green-500/50' 
                    : 'bg-zinc-700 text-zinc-400'
                }`}>
                  {elementPickerEnabled ? 'ON' : 'OFF'}
                </div>
              </div>

              {/* Keyboard Display */}
              <div className="flex items-center justify-between p-3 bg-zinc-800 rounded">
                <div>
                  <p className="font-medium">Keyboard Display</p>
                  <p className="text-xs text-zinc-400">Press K to toggle</p>
                </div>
                <div className={`px-3 py-1 rounded text-sm font-medium ${
                  keyboard.isVisible 
                    ? 'bg-green-500/20 text-green-400 border border-green-500/50' 
                    : 'bg-zinc-700 text-zinc-400'
                }`}>
                  {keyboard.isVisible ? 'ON' : 'OFF'}
                </div>
              </div>

              <button
                onClick={toggleElementPicker}
                className="w-full px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded border border-zinc-700 text-sm"
              >
                Toggle Element Picker (E)
              </button>
              <button
                onClick={toggleKeyboardDisplay}
                className="w-full px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded border border-zinc-700 text-sm"
              >
                Toggle Keyboard Display (K)
              </button>
            </div>
          </div>
        </div>

        {/* Hotkey Log */}
        <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800">
          <h3 className="text-lg font-semibold mb-4">Hotkey Activity Log</h3>
          {hotkeyLog.length === 0 ? (
            <p className="text-zinc-500 text-sm italic">
              Press any hotkey to see activity...
            </p>
          ) : (
            <div className="space-y-2">
              {hotkeyLog.map((entry, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 bg-zinc-800 rounded text-sm"
                >
                  <kbd className="px-2 py-1 bg-zinc-700 rounded font-mono text-xs">
                    {entry.key}
                  </kbd>
                  <span className="flex-1 text-zinc-300">{entry.action}</span>
                  <span className="text-zinc-500 text-xs">{entry.timestamp}</span>
                </div>
              ))}
            </div>
          )}
          <button
            onClick={() => setHotkeyLog([])}
            className="mt-4 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded border border-zinc-700 text-sm"
          >
            Clear Log
          </button>
        </div>

        {/* Test Instructions */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-3 text-blue-400">Test Instructions</h3>
          <ol className="space-y-2 text-sm text-zinc-300">
            <li>1. Press <kbd className="px-2 py-0.5 bg-zinc-800 rounded">1</kbd>, <kbd className="px-2 py-0.5 bg-zinc-800 rounded">2</kbd>, <kbd className="px-2 py-0.5 bg-zinc-800 rounded">3</kbd> to change colors</li>
            <li>2. Press <kbd className="px-2 py-0.5 bg-zinc-800 rounded">P</kbd> to toggle pin mode</li>
            <li>3. Click "Add Test Drawing" to add drawings</li>
            <li>4. Press <kbd className="px-2 py-0.5 bg-zinc-800 rounded">C</kbd> to clear all drawings</li>
            <li>5. Press <kbd className="px-2 py-0.5 bg-zinc-800 rounded">E</kbd> to toggle element picker</li>
            <li>6. Press <kbd className="px-2 py-0.5 bg-zinc-800 rounded">K</kbd> to toggle keyboard display</li>
            <li>7. Watch the activity log for confirmation</li>
          </ol>
        </div>

        {/* Success Criteria */}
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-3 text-green-400">Success Criteria</h3>
          <ul className="space-y-2 text-sm text-zinc-300">
            <li>✅ All hotkeys respond immediately</li>
            <li>✅ Color changes are reflected in UI</li>
            <li>✅ Pin mode prevents fade-out</li>
            <li>✅ Clear removes all drawings</li>
            <li>✅ Element picker toggles state</li>
            <li>✅ Keyboard display toggles visibility</li>
            <li>✅ Activity log shows all actions</li>
            <li>✅ No conflicts with browser shortcuts</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
