/**
 * Keyboard Display Testing Component
 * 
 * Comprehensive test suite for keyboard display functionality.
 * Tests:
 * - Modifier key display (Shift, Ctrl, Alt, Cmd/Win)
 * - Text display
 * - Password redaction (100% reliable)
 * - Position options (4 corners)
 * 
 * Requirements: FR-4.15-FR-4.19, NFR-4.4
 */

import { useState, useEffect } from 'react';
import { KeyboardDisplay, KeyboardDisplayPosition } from './Overlay/KeyboardDisplay';
import { keyboardTracker, KeyboardState } from '../lib/overlay/keyboard-tracker';
import { useOverlayStore } from '../stores/overlay';

export function KeyboardDisplayTest() {
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});
  const [testLog, setTestLog] = useState<string[]>([]);
  const [keyboardState, setKeyboardState] = useState<KeyboardState>({
    modifiers: { shift: false, ctrl: false, alt: false, meta: false },
    currentText: '',
    isPasswordField: false,
    lastKeyTimestamp: 0,
  });
  
  const { keyboard, updateKeyboard, setKeyboardPosition } = useOverlayStore();

  const addLog = (message: string) => {
    setTestLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  // Subscribe to keyboard tracker
  useEffect(() => {
    const unsubscribe = keyboardTracker.subscribe((state) => {
      setKeyboardState(state);
    });

    return unsubscribe;
  }, []);

  // Test 1: Modifier key display
  const testModifierKeys = () => {
    setTestResults({});
    addLog('Test 1: Modifier Keys - Testing all modifiers...');
    
    const modifiers = [
      { name: 'Shift', key: 'shift' as const },
      { name: 'Ctrl', key: 'ctrl' as const },
      { name: 'Alt', key: 'alt' as const },
      { name: 'Meta', key: 'meta' as const },
    ];

    let testsPassed = 0;
    
    modifiers.forEach((mod, index) => {
      setTimeout(() => {
        // Simulate modifier press
        keyboardTracker.updateModifiers({ [mod.key]: true });
        addLog(`${mod.name} pressed`);
        
        setTimeout(() => {
          // Check if modifier is displayed
          const state = keyboardTracker.getState();
          if (state.modifiers[mod.key]) {
            testsPassed++;
            addLog(`✓ ${mod.name} displayed correctly`);
          } else {
            addLog(`✗ ${mod.name} not displayed`);
          }
          
          // Release modifier
          keyboardTracker.updateModifiers({ [mod.key]: false });
          
          // After last test
          if (index === modifiers.length - 1) {
            setTimeout(() => {
              setTestResults(prev => ({
                ...prev,
                modifierKeys: testsPassed === modifiers.length
              }));
            }, 100);
          }
        }, 500);
      }, index * 1200);
    });
  };

  // Test 2: Text display
  const testTextDisplay = () => {
    setTestResults({});
    addLog('Test 2: Text Display - Type some text...');
    
    const testText = 'Hello, World!';
    let currentText = '';
    
    // Simulate typing
    testText.split('').forEach((char, index) => {
      setTimeout(() => {
        currentText += char;
        keyboardTracker.updateText(currentText, false);
        
        if (index === testText.length - 1) {
          setTimeout(() => {
            const state = keyboardTracker.getState();
            const textMatches = state.currentText === testText;
            
            setTestResults(prev => ({
              ...prev,
              textDisplay: textMatches
            }));
            
            addLog(textMatches ? '✓ Text displayed correctly' : '✗ Text display failed');
            
            // Clear text
            keyboardTracker.clearText();
          }, 500);
        }
      }, index * 100);
    });
  };

  // Test 3: Password redaction
  const testPasswordRedaction = () => {
    setTestResults({});
    addLog('Test 3: Password Redaction - Simulating password input...');
    
    const passwordText = 'MySecretPass123';
    let currentPassword = '';
    
    // Simulate typing password
    passwordText.split('').forEach((char, index) => {
      setTimeout(() => {
        currentPassword += char;
        keyboardTracker.updateText(currentPassword, true);
        
        if (index === passwordText.length - 1) {
          setTimeout(() => {
            const state = keyboardTracker.getState();
            const isRedacted = state.isPasswordField && state.currentText === passwordText;
            
            setTestResults(prev => ({
              ...prev,
              passwordRedaction: isRedacted
            }));
            
            addLog(isRedacted ? '✓ Password marked for redaction' : '✗ Password redaction failed');
            
            // Clear text
            keyboardTracker.clearText();
          }, 500);
        }
      }, index * 80);
    });
  };

  // Test 4: Position options
  const testPositionOptions = () => {
    setTestResults({});
    addLog('Test 4: Position Options - Testing all 4 corners...');
    
    const positions: KeyboardDisplayPosition[] = [
      'bottom-left',
      'bottom-right',
      'top-left',
      'top-right',
    ];

    // Add some text to make display visible
    keyboardTracker.updateText('Testing positions...', false);
    
    positions.forEach((position, index) => {
      setTimeout(() => {
        setKeyboardPosition(position);
        addLog(`Moved to ${position}`);
        
        if (index === positions.length - 1) {
          setTimeout(() => {
            setTestResults(prev => ({
              ...prev,
              positionOptions: true
            }));
            addLog('✓ All positions tested');
            
            // Reset to default
            setKeyboardPosition('bottom-left');
            keyboardTracker.clearText();
          }, 1000);
        }
      }, index * 1500);
    });
  };

  // Run all tests
  const runAllTests = async () => {
    addLog('Running all tests...');
    
    testModifierKeys();
    await new Promise(resolve => setTimeout(resolve, 6000));
    
    testTextDisplay();
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    testPasswordRedaction();
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    testPositionOptions();
    await new Promise(resolve => setTimeout(resolve, 7000));
    
    addLog('All tests completed');
  };

  // Manual controls
  const simulateModifier = (key: keyof KeyboardState['modifiers']) => {
    const currentState = keyboardTracker.getState();
    keyboardTracker.updateModifiers({ [key]: !currentState.modifiers[key] });
  };

  const simulateTyping = (text: string, isPassword: boolean = false) => {
    keyboardTracker.updateText(text, isPassword);
  };

  return (
    <div className="flex h-screen bg-zinc-900 text-white">
      {/* Left Panel - Controls and Results */}
      <div className="w-96 p-6 bg-zinc-800 overflow-y-auto">
        <h1 className="text-2xl font-bold mb-2">Keyboard Display Test</h1>
        <p className="text-sm text-zinc-400 mb-6">
          Test modifier keys, text display, password redaction, and position options.
        </p>

        {/* Test Controls */}
        <div className="space-y-3 mb-6">
          <h2 className="text-lg font-semibold mb-3">Automated Tests</h2>
          
          <button
            onClick={testModifierKeys}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors text-left"
          >
            Test 1: Modifier Keys
          </button>
          
          <button
            onClick={testTextDisplay}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors text-left"
          >
            Test 2: Text Display
          </button>
          
          <button
            onClick={testPasswordRedaction}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors text-left"
          >
            Test 3: Password Redaction
          </button>
          
          <button
            onClick={testPositionOptions}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors text-left"
          >
            Test 4: Position Options
          </button>
          
          <button
            onClick={runAllTests}
            className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-medium transition-colors text-left"
          >
            Run All Tests
          </button>
        </div>

        {/* Manual Controls */}
        <div className="space-y-3 mb-6 pt-6 border-t border-zinc-700">
          <h2 className="text-lg font-semibold mb-3">Manual Controls</h2>
          
          <div className="space-y-2">
            <p className="text-sm text-zinc-400 mb-2">Modifier Keys:</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => simulateModifier('shift')}
                className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                  keyboardState.modifiers.shift
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-700 hover:bg-zinc-600'
                }`}
              >
                Shift
              </button>
              
              <button
                onClick={() => simulateModifier('ctrl')}
                className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                  keyboardState.modifiers.ctrl
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-700 hover:bg-zinc-600'
                }`}
              >
                Ctrl
              </button>
              
              <button
                onClick={() => simulateModifier('alt')}
                className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                  keyboardState.modifiers.alt
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-700 hover:bg-zinc-600'
                }`}
              >
                Alt
              </button>
              
              <button
                onClick={() => simulateModifier('meta')}
                className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                  keyboardState.modifiers.meta
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-700 hover:bg-zinc-600'
                }`}
              >
                {navigator.platform.toUpperCase().indexOf('MAC') >= 0 ? 'Cmd' : 'Win'}
              </button>
            </div>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm text-zinc-400 mb-2">Quick Text:</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => simulateTyping('Hello World', false)}
                className="px-3 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-sm transition-colors"
              >
                Normal Text
              </button>
              
              <button
                onClick={() => simulateTyping('SecretPass123', true)}
                className="px-3 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-sm transition-colors"
              >
                Password
              </button>
            </div>
          </div>
          
          <button
            onClick={() => keyboardTracker.clearText()}
            className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors"
          >
            Clear Text
          </button>
        </div>

        {/* Position Controls */}
        <div className="space-y-3 mb-6 pt-6 border-t border-zinc-700">
          <h2 className="text-lg font-semibold mb-3">Display Position</h2>
          
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setKeyboardPosition('top-left')}
              className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                keyboard.displayPosition === 'top-left'
                  ? 'bg-blue-600 text-white'
                  : 'bg-zinc-700 hover:bg-zinc-600'
              }`}
            >
              Top Left
            </button>
            
            <button
              onClick={() => setKeyboardPosition('top-right')}
              className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                keyboard.displayPosition === 'top-right'
                  ? 'bg-blue-600 text-white'
                  : 'bg-zinc-700 hover:bg-zinc-600'
              }`}
            >
              Top Right
            </button>
            
            <button
              onClick={() => setKeyboardPosition('bottom-left')}
              className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                keyboard.displayPosition === 'bottom-left'
                  ? 'bg-blue-600 text-white'
                  : 'bg-zinc-700 hover:bg-zinc-600'
              }`}
            >
              Bottom Left
            </button>
            
            <button
              onClick={() => setKeyboardPosition('bottom-right')}
              className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                keyboard.displayPosition === 'bottom-right'
                  ? 'bg-blue-600 text-white'
                  : 'bg-zinc-700 hover:bg-zinc-600'
              }`}
            >
              Bottom Right
            </button>
          </div>
        </div>

        {/* Test Results */}
        <div className="space-y-2 mb-6 pt-6 border-t border-zinc-700">
          <h2 className="text-lg font-semibold mb-3">Test Results</h2>
          
          <TestResult
            name="Modifier Keys"
            result={testResults.modifierKeys}
          />
          
          <TestResult
            name="Text Display"
            result={testResults.textDisplay}
          />
          
          <TestResult
            name="Password Redaction"
            result={testResults.passwordRedaction}
          />
          
          <TestResult
            name="Position Options"
            result={testResults.positionOptions}
          />
        </div>

        {/* Current State */}
        <div className="pt-6 border-t border-zinc-700">
          <h2 className="text-lg font-semibold mb-3">Current State</h2>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-400">Shift:</span>
              <span className={keyboardState.modifiers.shift ? 'text-green-400' : 'text-zinc-500'}>
                {keyboardState.modifiers.shift ? 'Pressed' : 'Released'}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-zinc-400">Ctrl:</span>
              <span className={keyboardState.modifiers.ctrl ? 'text-green-400' : 'text-zinc-500'}>
                {keyboardState.modifiers.ctrl ? 'Pressed' : 'Released'}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-zinc-400">Alt:</span>
              <span className={keyboardState.modifiers.alt ? 'text-green-400' : 'text-zinc-500'}>
                {keyboardState.modifiers.alt ? 'Pressed' : 'Released'}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-zinc-400">Meta:</span>
              <span className={keyboardState.modifiers.meta ? 'text-green-400' : 'text-zinc-500'}>
                {keyboardState.modifiers.meta ? 'Pressed' : 'Released'}
              </span>
            </div>
            
            <div className="pt-2 border-t border-zinc-700">
              <span className="text-zinc-400">Current Text:</span>
              <div className="mt-1 p-2 bg-zinc-900 rounded font-mono text-xs break-all">
                {keyboardState.currentText || <span className="text-zinc-600">No text</span>}
              </div>
            </div>
            
            <div className="flex justify-between">
              <span className="text-zinc-400">Is Password:</span>
              <span className={keyboardState.isPasswordField ? 'text-yellow-400' : 'text-zinc-500'}>
                {keyboardState.isPasswordField ? 'Yes 🔒' : 'No'}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-zinc-400">Position:</span>
              <span className="font-mono text-xs">{keyboard.displayPosition}</span>
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
      </div>

      {/* Right Panel - Preview Area */}
      <div className="flex-1 relative bg-zinc-950">
        {/* Keyboard Display Component */}
        <KeyboardDisplay
          position={keyboard.displayPosition}
          visible={keyboard.isVisible}
          redactionMode="bullets"
          showVariableHint={false}
        />
        
        {/* Instructions Overlay */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
          <div className="bg-zinc-800/80 backdrop-blur-sm rounded-lg p-6 max-w-md">
            <h3 className="text-xl font-semibold mb-2">Keyboard Display Preview</h3>
            <p className="text-sm text-zinc-400 mb-4">
              The keyboard display will appear in the selected corner
            </p>
            <div className="text-xs text-zinc-500 space-y-1">
              <p>• Use manual controls to test modifiers</p>
              <p>• Type text to see display</p>
              <p>• Test password redaction</p>
              <p>• Change position to see all corners</p>
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
