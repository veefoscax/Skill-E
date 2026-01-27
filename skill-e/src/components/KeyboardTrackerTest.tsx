/**
 * Keyboard Tracker Test Component
 * 
 * Manual test interface for verifying keyboard tracking functionality.
 * Tests modifier keys, text buffering, and password field detection.
 * 
 * Requirements: FR-4.15, FR-4.16
 */

import { useState, useEffect } from 'react';
import { keyboardTracker, KeyboardState } from '../lib/overlay/keyboard-tracker';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Input } from './ui/input';

export function KeyboardTrackerTest() {
  const [isTracking, setIsTracking] = useState(false);
  const [keyboardState, setKeyboardState] = useState<KeyboardState | null>(null);

  useEffect(() => {
    // Subscribe to keyboard state updates
    const unsubscribe = keyboardTracker.subscribe((state) => {
      setKeyboardState(state);
    });

    return () => {
      unsubscribe();
      keyboardTracker.stop();
    };
  }, []);

  const handleStart = () => {
    keyboardTracker.start();
    setIsTracking(true);
  };

  const handleStop = () => {
    keyboardTracker.stop();
    setIsTracking(false);
  };

  const handleReset = () => {
    keyboardTracker.reset();
    setIsTracking(false);
    setKeyboardState(null);
  };

  const handleClearText = () => {
    keyboardTracker.clearTextBuffer();
  };

  return (
    <div className="p-8 space-y-6 max-w-4xl mx-auto">
      <div className="border rounded-lg p-6 space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Keyboard Tracker Test</h2>
          <p className="text-muted-foreground mt-1">
            Test keyboard event tracking, modifier keys, and text buffering
          </p>
        </div>
        
        <div className="space-y-4">
          {/* Controls */}
          <div className="flex gap-2">
            <Button 
              onClick={handleStart} 
              disabled={isTracking}
              variant="default"
            >
              Start Tracking
            </Button>
            <Button 
              onClick={handleStop} 
              disabled={!isTracking}
              variant="secondary"
            >
              Stop Tracking
            </Button>
            <Button 
              onClick={handleReset}
              variant="outline"
            >
              Reset
            </Button>
            <Button 
              onClick={handleClearText}
              disabled={!isTracking}
              variant="outline"
            >
              Clear Text
            </Button>
          </div>

          {/* Status */}
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm font-medium">
              Status: {isTracking ? (
                <span className="text-green-600">Tracking Active</span>
              ) : (
                <span className="text-gray-500">Not Tracking</span>
              )}
            </p>
          </div>

          {/* Modifier Keys Display */}
          <div className="space-y-2">
            <Label>Modifier Keys</Label>
            <div className="flex gap-2 flex-wrap">
              <div className={`px-3 py-2 rounded border ${
                keyboardState?.modifiers.shift 
                  ? 'bg-blue-500 text-white border-blue-600' 
                  : 'bg-muted border-border'
              }`}>
                Shift
              </div>
              <div className={`px-3 py-2 rounded border ${
                keyboardState?.modifiers.ctrl 
                  ? 'bg-blue-500 text-white border-blue-600' 
                  : 'bg-muted border-border'
              }`}>
                Ctrl
              </div>
              <div className={`px-3 py-2 rounded border ${
                keyboardState?.modifiers.alt 
                  ? 'bg-blue-500 text-white border-blue-600' 
                  : 'bg-muted border-border'
              }`}>
                Alt
              </div>
              <div className={`px-3 py-2 rounded border ${
                keyboardState?.modifiers.meta 
                  ? 'bg-blue-500 text-white border-blue-600' 
                  : 'bg-muted border-border'
              }`}>
                Cmd/Win
              </div>
            </div>
          </div>

          {/* Text Buffer Display */}
          <div className="space-y-2">
            <Label>Text Buffer</Label>
            <div className="p-4 bg-muted rounded-lg min-h-[100px] font-mono text-sm whitespace-pre-wrap break-all">
              {keyboardState?.currentText || '(empty)'}
            </div>
            <p className="text-xs text-muted-foreground">
              Length: {keyboardState?.currentText.length || 0} characters
            </p>
          </div>

          {/* Password Field Indicator */}
          <div className="space-y-2">
            <Label>Password Field Detection</Label>
            <div className={`p-3 rounded-lg ${
              keyboardState?.isPasswordField 
                ? 'bg-red-500/10 border border-red-500' 
                : 'bg-muted'
            }`}>
              {keyboardState?.isPasswordField ? (
                <span className="text-red-600 font-medium">
                  ⚠️ Password Field Detected
                </span>
              ) : (
                <span className="text-muted-foreground">
                  No password field
                </span>
              )}
            </div>
          </div>

          {/* Test Inputs */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-medium">Test Inputs</h3>
            
            <div className="space-y-2">
              <Label htmlFor="normal-input">Normal Text Input</Label>
              <Input 
                id="normal-input"
                type="text" 
                placeholder="Type here to test normal input..."
              />
              <p className="text-xs text-muted-foreground">
                Text should appear in the buffer above
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password-input">Password Input</Label>
              <Input 
                id="password-input"
                type="password" 
                placeholder="Type here to test password detection..."
              />
              <p className="text-xs text-muted-foreground">
                Should trigger password field detection
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password-name">Password by Name</Label>
              <Input 
                id="password-name"
                name="user_password"
                type="text" 
                placeholder="Input with 'password' in name..."
              />
              <p className="text-xs text-muted-foreground">
                Should also trigger password detection
              </p>
            </div>
          </div>

          {/* Instructions */}
          <div className="p-4 bg-blue-500/10 border border-blue-500 rounded-lg space-y-2">
            <h4 className="font-medium text-blue-600">Test Instructions</h4>
            <ol className="text-sm space-y-1 list-decimal list-inside text-blue-900 dark:text-blue-100">
              <li>Click "Start Tracking" to begin</li>
              <li>Press modifier keys (Shift, Ctrl, Alt, Cmd) - they should highlight</li>
              <li>Type in the normal input - text should appear in buffer</li>
              <li>Focus the password input - should show warning</li>
              <li>Try combinations like Ctrl+Shift+A</li>
              <li>Test backspace and special keys</li>
              <li>Switch between inputs - buffer should clear</li>
            </ol>
          </div>

          {/* Expected Results */}
          <div className="p-4 bg-green-500/10 border border-green-500 rounded-lg space-y-2">
            <h4 className="font-medium text-green-600">Expected Results</h4>
            <ul className="text-sm space-y-1 list-disc list-inside text-green-900 dark:text-green-100">
              <li>✅ Modifier keys highlight when pressed</li>
              <li>✅ Typed text appears in buffer</li>
              <li>✅ Backspace removes characters</li>
              <li>✅ Password fields trigger detection</li>
              <li>✅ Buffer clears when switching fields</li>
              <li>✅ Special keys (arrows, etc.) don't appear in buffer</li>
              <li>✅ Text buffer limited to 100 characters</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
