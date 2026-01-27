/**
 * Click Visualization Testing Component
 * 
 * Comprehensive test suite for click indicator functionality.
 * Tests:
 * - Click numbering sequence (1, 2, 3...)
 * - Color cycling (Red → Blue → Green → Red...)
 * - Fade timing (3 seconds)
 * - Pin mode (prevents fading)
 * 
 * Requirements: FR-4.1, FR-4.2, FR-4.11, FR-4.12
 */

import { useState, useEffect } from 'react';
import { ClickIndicator } from './Overlay/ClickIndicator';
import { clickTracker, ClickIndicator as ClickIndicatorType, COLORS } from '../lib/overlay/click-tracker';
import { useOverlayStore } from '../stores/overlay';

export function ClickVisualizationTest() {
  const [clicks, setClicks] = useState<ClickIndicatorType[]>([]);
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});
  const [isRunning, setIsRunning] = useState(false);
  
  const { isPinMode, togglePinMode } = useOverlayStore();

  // Subscribe to click tracker
  useEffect(() => {
    const unsubscribe = clickTracker.subscribe((updatedClicks) => {
      setClicks(updatedClicks);
    });

    clickTracker.start();

    return () => {
      unsubscribe();
      clickTracker.stop();
    };
  }, []);

  // Test 1: Click numbering sequence
  const testNumberingSequence = () => {
    clickTracker.reset();
    setTestResults({});
    
    // Add 5 clicks
    const positions = [
      { x: 100, y: 100 },
      { x: 200, y: 150 },
      { x: 300, y: 200 },
      { x: 400, y: 250 },
      { x: 500, y: 300 },
    ];

    positions.forEach((pos, index) => {
      setTimeout(() => {
        clickTracker.addClick(pos);
        
        // Verify numbering after last click
        if (index === positions.length - 1) {
          setTimeout(() => {
            const currentClicks = clickTracker.getClicks();
            const numbersCorrect = currentClicks.every((click, i) => click.number === i + 1);
            setTestResults(prev => ({ ...prev, numbering: numbersCorrect }));
          }, 100);
        }
      }, index * 200);
    });
  };

  // Test 2: Color cycling
  const testColorCycling = () => {
    clickTracker.reset();
    setTestResults({});
    
    // Add 9 clicks to test full cycle (3 colors × 3)
    const positions = Array.from({ length: 9 }, (_, i) => ({
      x: 100 + (i % 3) * 150,
      y: 100 + Math.floor(i / 3) * 100,
    }));

    positions.forEach((pos, index) => {
      setTimeout(() => {
        clickTracker.addClick(pos);
        
        // Verify color cycling after last click
        if (index === positions.length - 1) {
          setTimeout(() => {
            const currentClicks = clickTracker.getClicks();
            const expectedColors = ['COLOR_1', 'COLOR_2', 'COLOR_3'];
            const colorsCorrect = currentClicks.every((click, i) => {
              const expectedColor = expectedColors[i % 3];
              return click.color === expectedColor;
            });
            setTestResults(prev => ({ ...prev, colorCycling: colorsCorrect }));
          }, 100);
        }
      }, index * 150);
    });
  };

  // Test 3: Fade timing
  const testFadeTiming = () => {
    clickTracker.reset();
    setTestResults({});
    
    // Add a single click
    clickTracker.addClick({ x: 300, y: 300 });
    
    // Check that it's visible initially
    setTimeout(() => {
      const currentClicks = clickTracker.getClicks();
      const initiallyVisible = currentClicks.length === 1 && currentClicks[0].fadeState === 'visible';
      
      if (initiallyVisible) {
        // Check that it starts fading after ~2.5s
        setTimeout(() => {
          const clicksAfterFade = clickTracker.getClicks();
          const startedFading = clicksAfterFade.length === 1 && clicksAfterFade[0].fadeState === 'fading';
          
          if (startedFading) {
            // Check that it's hidden after 3s
            setTimeout(() => {
              const clicksAfterHidden = clickTracker.getClicks();
              const isHidden = clicksAfterHidden.length === 0 || clicksAfterHidden[0].fadeState === 'hidden';
              setTestResults(prev => ({ ...prev, fadeTiming: isHidden }));
            }, 600);
          } else {
            setTestResults(prev => ({ ...prev, fadeTiming: false }));
          }
        }, 2600);
      } else {
        setTestResults(prev => ({ ...prev, fadeTiming: false }));
      }
    }, 100);
  };

  // Test 4: Pin mode
  const testPinMode = () => {
    clickTracker.reset();
    setTestResults({});
    
    // Enable pin mode
    if (!isPinMode) {
      togglePinMode();
    }
    
    // Add a click
    clickTracker.addClick({ x: 400, y: 300 });
    
    // Wait 3.5 seconds (longer than fade time)
    setTimeout(() => {
      const currentClicks = clickTracker.getClicks();
      const stillVisible = currentClicks.length === 1 && currentClicks[0].fadeState === 'visible';
      setTestResults(prev => ({ ...prev, pinMode: stillVisible }));
      
      // Disable pin mode after test
      if (isPinMode) {
        togglePinMode();
      }
    }, 3500);
  };

  // Run all tests
  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults({});
    
    // Test 1: Numbering
    testNumberingSequence();
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 2: Color cycling
    testColorCycling();
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    // Test 3: Fade timing
    testFadeTiming();
    await new Promise(resolve => setTimeout(resolve, 4000));
    
    // Test 4: Pin mode
    testPinMode();
    await new Promise(resolve => setTimeout(resolve, 4000));
    
    setIsRunning(false);
  };

  const handleFadeComplete = (clickId: string) => {
    clickTracker.updateFadeState(clickId, 'hidden');
    clickTracker.removeHiddenClicks();
  };

  return (
    <div className="p-8 space-y-6 bg-zinc-900 text-white min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Click Visualization Testing</h1>
        <p className="text-zinc-400 mb-6">
          Comprehensive tests for click indicators: numbering, color cycling, fade timing, and pin mode.
        </p>

        {/* Test Controls */}
        <div className="bg-zinc-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Controls</h2>
          
          <div className="flex flex-wrap gap-3 mb-4">
            <button
              onClick={testNumberingSequence}
              disabled={isRunning}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 disabled:text-zinc-500 rounded-lg font-medium transition-colors"
            >
              Test 1: Numbering
            </button>
            
            <button
              onClick={testColorCycling}
              disabled={isRunning}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 disabled:text-zinc-500 rounded-lg font-medium transition-colors"
            >
              Test 2: Color Cycling
            </button>
            
            <button
              onClick={testFadeTiming}
              disabled={isRunning}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 disabled:text-zinc-500 rounded-lg font-medium transition-colors"
            >
              Test 3: Fade Timing
            </button>
            
            <button
              onClick={testPinMode}
              disabled={isRunning}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 disabled:text-zinc-500 rounded-lg font-medium transition-colors"
            >
              Test 4: Pin Mode
            </button>
            
            <button
              onClick={runAllTests}
              disabled={isRunning}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-zinc-700 disabled:text-zinc-500 rounded-lg font-medium transition-colors"
            >
              {isRunning ? 'Running...' : 'Run All Tests'}
            </button>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => clickTracker.reset()}
              className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg font-medium transition-colors"
            >
              Clear Clicks
            </button>
            
            <button
              onClick={togglePinMode}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isPinMode 
                  ? 'bg-yellow-600 hover:bg-yellow-700' 
                  : 'bg-zinc-700 hover:bg-zinc-600'
              }`}
            >
              {isPinMode ? '📌 Pin Mode ON' : '⏱️ Fade Mode'}
            </button>
          </div>
        </div>

        {/* Test Results */}
        <div className="bg-zinc-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Results</h2>
          
          <div className="space-y-3">
            <TestResult
              name="Test 1: Click Numbering Sequence"
              description="Clicks should be numbered 1, 2, 3, 4, 5..."
              result={testResults.numbering}
            />
            
            <TestResult
              name="Test 2: Color Cycling"
              description="Colors should cycle: Red → Blue → Green → Red..."
              result={testResults.colorCycling}
            />
            
            <TestResult
              name="Test 3: Fade Timing"
              description="Clicks should fade after 3 seconds"
              result={testResults.fadeTiming}
            />
            
            <TestResult
              name="Test 4: Pin Mode"
              description="Pinned clicks should not fade"
              result={testResults.pinMode}
            />
          </div>
        </div>

        {/* Color Reference */}
        <div className="bg-zinc-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Color Reference</h2>
          
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <div 
                className="w-8 h-8 rounded-full border-2 border-white/20"
                style={{ backgroundColor: COLORS.COLOR_1 }}
              />
              <span className="text-sm">Color 1 (Red) - Clicks 1, 4, 7...</span>
            </div>
            
            <div className="flex items-center gap-2">
              <div 
                className="w-8 h-8 rounded-full border-2 border-white/20"
                style={{ backgroundColor: COLORS.COLOR_2 }}
              />
              <span className="text-sm">Color 2 (Blue) - Clicks 2, 5, 8...</span>
            </div>
            
            <div className="flex items-center gap-2">
              <div 
                className="w-8 h-8 rounded-full border-2 border-white/20"
                style={{ backgroundColor: COLORS.COLOR_3 }}
              />
              <span className="text-sm">Color 3 (Green) - Clicks 3, 6, 9...</span>
            </div>
          </div>
        </div>

        {/* Click Stats */}
        <div className="bg-zinc-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Current Clicks</h2>
          
          <div className="text-sm text-zinc-400 mb-3">
            Total clicks: {clicks.length}
          </div>
          
          {clicks.length > 0 ? (
            <div className="space-y-2">
              {clicks.map((click) => (
                <div 
                  key={click.id}
                  className="flex items-center gap-3 p-2 bg-zinc-700/50 rounded"
                >
                  <div 
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ backgroundColor: COLORS[click.color] }}
                  >
                    {click.number}
                  </div>
                  <span className="text-sm">
                    Position: ({Math.round(click.position.x)}, {Math.round(click.position.y)})
                  </span>
                  <span className="text-sm text-zinc-400">
                    State: {click.fadeState}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-zinc-500 text-sm">No clicks yet. Run a test to see clicks.</p>
          )}
        </div>
      </div>

      {/* Render click indicators */}
      <div className="fixed inset-0 pointer-events-none">
        {clicks.map((click) => (
          <ClickIndicator
            key={click.id}
            click={click}
            isPinned={isPinMode}
            onFadeComplete={handleFadeComplete}
          />
        ))}
      </div>
    </div>
  );
}

interface TestResultProps {
  name: string;
  description: string;
  result?: boolean;
}

function TestResult({ name, description, result }: TestResultProps) {
  return (
    <div className="flex items-start gap-3 p-3 bg-zinc-700/50 rounded">
      <div className="flex-shrink-0 mt-0.5">
        {result === undefined ? (
          <div className="w-5 h-5 rounded-full bg-zinc-600" />
        ) : result ? (
          <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        ) : (
          <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        )}
      </div>
      
      <div className="flex-1">
        <h3 className="font-semibold text-sm mb-1">{name}</h3>
        <p className="text-xs text-zinc-400">{description}</p>
      </div>
    </div>
  );
}
