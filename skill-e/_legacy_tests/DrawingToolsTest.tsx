/**
 * Drawing Tools Testing Component
 * 
 * Comprehensive test suite for drawing tools functionality.
 * Tests:
 * - Gesture detection (tap → dot, drag → arrow, diagonal → rectangle)
 * - All 3 colors (Red, Blue, Green)
 * - Fade and pin modes
 * - Clear function
 * 
 * Requirements: FR-4.6-FR-4.14
 */

import { useState } from 'react';
import { DrawingCanvas } from './Overlay/DrawingCanvas';
import { useOverlayStore, COLORS } from '../stores/overlay';

export function DrawingToolsTest() {
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});
  const [testLog, setTestLog] = useState<string[]>([]);
  
  const { 
    isPinMode, 
    currentColor, 
    drawings,
    togglePinMode, 
    setColor,
    clearDrawings 
  } = useOverlayStore();

  const addLog = (message: string) => {
    setTestLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  // Test 1: Gesture detection
  const testGestureDetection = () => {
    clearDrawings();
    setTestResults({});
    addLog('Test 1: Gesture Detection - Please draw:');
    addLog('1. Quick tap (should create dot)');
    addLog('2. Horizontal drag (should create arrow)');
    addLog('3. Diagonal drag (should create rectangle)');
    addLog('Wait 5 seconds, then check results...');
    
    setTimeout(() => {
      const hasDot = drawings.some(d => d.type === 'dot');
      const hasArrow = drawings.some(d => d.type === 'arrow');
      const hasRectangle = drawings.some(d => d.type === 'rectangle');
      
      setTestResults(prev => ({
        ...prev,
        gestureDetection: hasDot && hasArrow && hasRectangle
      }));
      
      if (hasDot && hasArrow && hasRectangle) {
        addLog('✓ All gesture types detected correctly');
      } else {
        addLog(`✗ Missing gestures: ${!hasDot ? 'dot ' : ''}${!hasArrow ? 'arrow ' : ''}${!hasRectangle ? 'rectangle' : ''}`);
      }
    }, 5000);
  };

  // Test 2: Color selection
  const testColorSelection = () => {
    clearDrawings();
    setTestResults({});
    addLog('Test 2: Color Selection - Testing all 3 colors...');
    
    // Test each color
    const colors: Array<keyof typeof COLORS> = ['COLOR_1', 'COLOR_2', 'COLOR_3'];
    let allColorsWork = true;
    
    colors.forEach((color, index) => {
      setTimeout(() => {
        setColor(color);
        addLog(`Switched to ${color} (${COLORS[color]})`);
        
        if (index === colors.length - 1) {
          setTimeout(() => {
            setTestResults(prev => ({
              ...prev,
              colorSelection: allColorsWork
            }));
            addLog(allColorsWork ? '✓ All colors accessible' : '✗ Color selection failed');
          }, 500);
        }
      }, index * 1000);
    });
  };

  // Test 3: Fade mode
  const testFadeMode = () => {
    clearDrawings();
    setTestResults({});
    
    // Ensure fade mode is on
    if (isPinMode) {
      togglePinMode();
    }
    
    addLog('Test 3: Fade Mode - Draw something...');
    addLog('Drawings should fade after 3 seconds');
    
    // Wait for user to draw
    setTimeout(() => {
      const initialCount = drawings.length;
      addLog(`Initial drawings: ${initialCount}`);
      
      // Wait 3.5 seconds and check if drawings faded
      setTimeout(() => {
        const visibleDrawings = drawings.filter(d => d.fadeState === 'visible');
        const fadedCorrectly = visibleDrawings.length < initialCount;
        
        setTestResults(prev => ({
          ...prev,
          fadeMode: fadedCorrectly
        }));
        
        addLog(fadedCorrectly ? '✓ Drawings faded correctly' : '✗ Drawings did not fade');
      }, 3500);
    }, 2000);
  };

  // Test 4: Pin mode
  const testPinMode = () => {
    clearDrawings();
    setTestResults({});
    
    // Enable pin mode
    if (!isPinMode) {
      togglePinMode();
    }
    
    addLog('Test 4: Pin Mode - Draw something...');
    addLog('Drawings should NOT fade (pinned)');
    
    // Wait for user to draw
    setTimeout(() => {
      const initialCount = drawings.length;
      addLog(`Initial drawings: ${initialCount}`);
      
      // Wait 3.5 seconds and check if drawings stayed
      setTimeout(() => {
        const visibleDrawings = drawings.filter(d => d.fadeState === 'visible');
        const pinnedCorrectly = visibleDrawings.length === initialCount && initialCount > 0;
        
        setTestResults(prev => ({
          ...prev,
          pinMode: pinnedCorrectly
        }));
        
        addLog(pinnedCorrectly ? '✓ Drawings stayed pinned' : '✗ Drawings faded when pinned');
        
        // Disable pin mode after test
        if (isPinMode) {
          togglePinMode();
        }
      }, 3500);
    }, 2000);
  };

  // Test 5: Clear function
  const testClearFunction = () => {
    addLog('Test 5: Clear Function - Drawing some elements...');
    
    // Ensure we have some drawings
    setTimeout(() => {
      const beforeCount = drawings.length;
      addLog(`Drawings before clear: ${beforeCount}`);
      
      // Clear all drawings
      clearDrawings();
      
      setTimeout(() => {
        const afterCount = drawings.length;
        const clearedCorrectly = afterCount === 0;
        
        setTestResults(prev => ({
          ...prev,
          clearFunction: clearedCorrectly
        }));
        
        addLog(clearedCorrectly ? '✓ All drawings cleared' : '✗ Clear function failed');
      }, 100);
    }, 1000);
  };

  return (
    <div className="flex h-screen bg-zinc-900 text-white">
      {/* Left Panel - Controls and Results */}
      <div className="w-96 p-6 bg-zinc-800 overflow-y-auto">
        <h1 className="text-2xl font-bold mb-2">Drawing Tools Test</h1>
        <p className="text-sm text-zinc-400 mb-6">
          Test gesture detection, colors, fade/pin modes, and clear function.
        </p>

        {/* Test Controls */}
        <div className="space-y-3 mb-6">
          <h2 className="text-lg font-semibold mb-3">Test Controls</h2>
          
          <button
            onClick={testGestureDetection}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors text-left"
          >
            Test 1: Gesture Detection
          </button>
          
          <button
            onClick={testColorSelection}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors text-left"
          >
            Test 2: Color Selection
          </button>
          
          <button
            onClick={testFadeMode}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors text-left"
          >
            Test 3: Fade Mode
          </button>
          
          <button
            onClick={testPinMode}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors text-left"
          >
            Test 4: Pin Mode
          </button>
          
          <button
            onClick={testClearFunction}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors text-left"
          >
            Test 5: Clear Function
          </button>
        </div>

        {/* Manual Controls */}
        <div className="space-y-3 mb-6 pt-6 border-t border-zinc-700">
          <h2 className="text-lg font-semibold mb-3">Manual Controls</h2>
          
          <div className="flex gap-2">
            <button
              onClick={() => setColor('COLOR_1')}
              className={`flex-1 px-3 py-2 rounded-lg font-medium transition-colors ${
                currentColor === 'COLOR_1' 
                  ? 'bg-red-600 text-white' 
                  : 'bg-zinc-700 hover:bg-zinc-600'
              }`}
            >
              Red (1)
            </button>
            
            <button
              onClick={() => setColor('COLOR_2')}
              className={`flex-1 px-3 py-2 rounded-lg font-medium transition-colors ${
                currentColor === 'COLOR_2' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-zinc-700 hover:bg-zinc-600'
              }`}
            >
              Blue (2)
            </button>
            
            <button
              onClick={() => setColor('COLOR_3')}
              className={`flex-1 px-3 py-2 rounded-lg font-medium transition-colors ${
                currentColor === 'COLOR_3' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-zinc-700 hover:bg-zinc-600'
              }`}
            >
              Green (3)
            </button>
          </div>
          
          <button
            onClick={togglePinMode}
            className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
              isPinMode 
                ? 'bg-yellow-600 hover:bg-yellow-700' 
                : 'bg-zinc-700 hover:bg-zinc-600'
            }`}
          >
            {isPinMode ? '📌 Pin Mode ON (P)' : '⏱️ Fade Mode (P)'}
          </button>
          
          <button
            onClick={clearDrawings}
            className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors"
          >
            Clear All (C)
          </button>
        </div>

        {/* Test Results */}
        <div className="space-y-2 mb-6 pt-6 border-t border-zinc-700">
          <h2 className="text-lg font-semibold mb-3">Test Results</h2>
          
          <TestResult
            name="Gesture Detection"
            result={testResults.gestureDetection}
          />
          
          <TestResult
            name="Color Selection"
            result={testResults.colorSelection}
          />
          
          <TestResult
            name="Fade Mode"
            result={testResults.fadeMode}
          />
          
          <TestResult
            name="Pin Mode"
            result={testResults.pinMode}
          />
          
          <TestResult
            name="Clear Function"
            result={testResults.clearFunction}
          />
        </div>

        {/* Drawing Stats */}
        <div className="pt-6 border-t border-zinc-700">
          <h2 className="text-lg font-semibold mb-3">Drawing Stats</h2>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-400">Total drawings:</span>
              <span className="font-mono">{drawings.length}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-zinc-400">Dots:</span>
              <span className="font-mono">{drawings.filter(d => d.type === 'dot').length}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-zinc-400">Arrows:</span>
              <span className="font-mono">{drawings.filter(d => d.type === 'arrow').length}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-zinc-400">Rectangles:</span>
              <span className="font-mono">{drawings.filter(d => d.type === 'rectangle').length}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-zinc-400">Current color:</span>
              <div className="flex items-center gap-2">
                <div 
                  className="w-4 h-4 rounded-full border border-white/20"
                  style={{ backgroundColor: COLORS[currentColor] }}
                />
                <span className="font-mono text-xs">{COLORS[currentColor]}</span>
              </div>
            </div>
            
            <div className="flex justify-between">
              <span className="text-zinc-400">Mode:</span>
              <span className="font-mono">{isPinMode ? 'Pinned' : 'Fade'}</span>
            </div>
          </div>
        </div>

        {/* Test Log */}
        <div className="pt-6 border-t border-zinc-700">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold">Test Log</h2>
            <button
              onClick={() => setTestLog([])}
              className="text-xs text-zinc-400 hover:text-white transition-colors"
            >
              Clear
            </button>
          </div>
          
          <div className="bg-zinc-900 rounded p-3 max-h-48 overflow-y-auto">
            {testLog.length > 0 ? (
              <div className="space-y-1">
                {testLog.map((log, index) => (
                  <div key={index} className="text-xs font-mono text-zinc-400">
                    {log}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-zinc-500">No logs yet. Run a test to see logs.</p>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="pt-6 border-t border-zinc-700">
          <h2 className="text-lg font-semibold mb-3">Instructions</h2>
          
          <div className="text-sm text-zinc-400 space-y-2">
            <p><strong>Gestures:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Quick tap = Dot marker</li>
              <li>Drag = Arrow</li>
              <li>Diagonal drag = Rectangle</li>
            </ul>
            
            <p className="pt-2"><strong>Keyboard shortcuts:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>1, 2, 3 = Select color</li>
              <li>P = Toggle pin mode</li>
              <li>C = Clear all drawings</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Right Panel - Drawing Canvas */}
      <div className="flex-1 relative bg-zinc-950">
        <div className="absolute inset-0">
          <DrawingCanvas showIndicator={true} />
        </div>
        
        {/* Canvas Instructions Overlay */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
          <div className="bg-zinc-800/80 backdrop-blur-sm rounded-lg p-6 max-w-md">
            <h3 className="text-xl font-semibold mb-2">Drawing Canvas</h3>
            <p className="text-sm text-zinc-400 mb-4">
              Draw here to test the drawing tools
            </p>
            <div className="text-xs text-zinc-500 space-y-1">
              <p>• Quick tap for dots</p>
              <p>• Drag for arrows</p>
              <p>• Diagonal drag for rectangles</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface TestResultProps {
  name: string;
  result?: boolean;
}

function TestResult({ name, result }: TestResultProps) {
  return (
    <div className="flex items-center justify-between p-2 bg-zinc-700/50 rounded">
      <span className="text-sm">{name}</span>
      <div className="flex-shrink-0">
        {result === undefined ? (
          <div className="w-4 h-4 rounded-full bg-zinc-600" />
        ) : result ? (
          <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
            <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        ) : (
          <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
            <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}
