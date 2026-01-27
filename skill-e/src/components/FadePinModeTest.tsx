/**
 * Fade vs Pin Mode Test Component
 * 
 * Tests the fade vs pin mode functionality for drawing annotations.
 * 
 * Requirements tested:
 * - FR-4.11: Default mode: Drawings fade out after 3 seconds
 * - FR-4.12: Pin mode: Drawings stay until manually cleared
 * - FR-4.13: Toggle pin mode via keyboard shortcut (P key)
 * - FR-4.14: Clear all drawings with hotkey (C key)
 */

import { DrawingCanvas } from './Overlay/DrawingCanvas';
import { useOverlayStore } from '../stores/overlay';
import { COLORS } from '../lib/overlay/click-tracker';

export function FadePinModeTest() {
  const { isPinMode, currentColor } = useOverlayStore();

  return (
    <div className="w-full h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex flex-col">
      {/* Header */}
      <div className="bg-black/40 backdrop-blur-sm border-b border-white/10 p-4">
        <h1 className="text-2xl font-bold text-white mb-2">
          Task S04-10: Fade vs Pin Mode Test
        </h1>
        <p className="text-slate-300 text-sm">
          Test drawing annotations with fade and pin modes
        </p>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Drawing Canvas Area */}
        <div className="flex-1 relative">
          <DrawingCanvas showIndicator={true} />
          
          {/* Center Instructions */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-black/60 backdrop-blur-sm rounded-xl p-6 max-w-md">
              <h2 className="text-white font-semibold mb-3 text-center">
                Draw on the canvas
              </h2>
              <div className="text-slate-300 text-sm space-y-2">
                <p>• <strong>Click</strong> = Dot marker</p>
                <p>• <strong>Drag</strong> = Arrow</p>
                <p>• <strong>Diagonal drag</strong> = Rectangle</p>
              </div>
            </div>
          </div>
        </div>

        {/* Side Panel - Status & Instructions */}
        <div className="w-80 bg-black/40 backdrop-blur-sm border-l border-white/10 p-6 overflow-y-auto">
          {/* Current Status */}
          <div className="mb-6">
            <h3 className="text-white font-semibold mb-3">Current Status</h3>
            <div className="space-y-2">
              <div className="bg-white/5 rounded-lg p-3">
                <div className="text-slate-400 text-xs mb-1">Mode</div>
                <div className="text-white font-medium flex items-center gap-2">
                  {isPinMode ? (
                    <>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L11 4.323V3a1 1 0 011-1zm-5 8.274l-.818 2.552c-.25.78-.03 1.632.57 2.14.599.508 1.434.558 2.068.193L10 13.5l3.18 1.659c.634.365 1.469.315 2.068-.193.6-.508.82-1.36.57-2.14L15 10.274v-1.548l-2.5-1V9a1 1 0 11-2 0V7.726l-2.5 1v1.548z"/>
                      </svg>
                      <span className="text-green-400">Pinned</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-yellow-400">Fade (3s)</span>
                    </>
                  )}
                </div>
              </div>

              <div className="bg-white/5 rounded-lg p-3">
                <div className="text-slate-400 text-xs mb-1">Color</div>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-6 h-6 rounded-full border-2 border-white/50"
                    style={{ backgroundColor: COLORS[currentColor] }}
                  />
                  <span className="text-white font-medium">
                    {currentColor === 'COLOR_1' && 'Red'}
                    {currentColor === 'COLOR_2' && 'Blue'}
                    {currentColor === 'COLOR_3' && 'Green'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Keyboard Shortcuts */}
          <div className="mb-6">
            <h3 className="text-white font-semibold mb-3">Keyboard Shortcuts</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between bg-white/5 rounded-lg p-2">
                <span className="text-slate-300">Toggle Pin Mode</span>
                <kbd className="px-2 py-1 bg-white/10 rounded text-white font-mono">P</kbd>
              </div>
              <div className="flex items-center justify-between bg-white/5 rounded-lg p-2">
                <span className="text-slate-300">Clear All</span>
                <kbd className="px-2 py-1 bg-white/10 rounded text-white font-mono">C</kbd>
              </div>
              <div className="flex items-center justify-between bg-white/5 rounded-lg p-2">
                <span className="text-slate-300">Red Color</span>
                <kbd className="px-2 py-1 bg-white/10 rounded text-white font-mono">1</kbd>
              </div>
              <div className="flex items-center justify-between bg-white/5 rounded-lg p-2">
                <span className="text-slate-300">Blue Color</span>
                <kbd className="px-2 py-1 bg-white/10 rounded text-white font-mono">2</kbd>
              </div>
              <div className="flex items-center justify-between bg-white/5 rounded-lg p-2">
                <span className="text-slate-300">Green Color</span>
                <kbd className="px-2 py-1 bg-white/10 rounded text-white font-mono">3</kbd>
              </div>
            </div>
          </div>

          {/* Test Instructions */}
          <div>
            <h3 className="text-white font-semibold mb-3">Test Steps</h3>
            <div className="space-y-3 text-sm text-slate-300">
              <div className="bg-white/5 rounded-lg p-3">
                <div className="font-medium text-white mb-1">1. Test Fade Mode</div>
                <p className="text-xs">Draw annotations and verify they fade after 3 seconds</p>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <div className="font-medium text-white mb-1">2. Test Pin Mode</div>
                <p className="text-xs">Press P, draw annotations, verify they stay visible</p>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <div className="font-medium text-white mb-1">3. Test Clear</div>
                <p className="text-xs">Press C to clear all drawings</p>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <div className="font-medium text-white mb-1">4. Test Colors</div>
                <p className="text-xs">Press 1, 2, 3 to switch colors</p>
              </div>
            </div>
          </div>

          {/* Requirements */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <h3 className="text-white font-semibold mb-2 text-sm">Requirements</h3>
            <div className="space-y-1 text-xs text-slate-400">
              <p>✓ FR-4.11: Fade after 3s</p>
              <p>✓ FR-4.12: Pin mode stays</p>
              <p>✓ FR-4.13: P key toggle</p>
              <p>✓ FR-4.14: C key clear</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
