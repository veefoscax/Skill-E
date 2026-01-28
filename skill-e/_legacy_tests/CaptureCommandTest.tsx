import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';

interface CaptureResult {
  path: string;
  timestamp: number;
}

interface WindowInfo {
  title: string;
  process_name: string;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

/**
 * Test component for verifying screen capture commands
 * Tests all three capture commands: capture_screen, get_active_window, get_cursor_position
 */
export function CaptureCommandTest() {
  const [captureResult, setCaptureResult] = useState<CaptureResult | null>(null);
  const [windowInfo, setWindowInfo] = useState<WindowInfo | null>(null);
  const [cursorPos, setCursorPos] = useState<[number, number] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  const testCaptureScreen = async () => {
    setLoading('capture_screen');
    setError(null);
    try {
      // Create a temp path for testing
      const timestamp = Date.now();
      const outputPath = `C:\\temp\\skill-e-test-${timestamp}.webp`;
      
      const result = await invoke<CaptureResult>('capture_screen', {
        outputPath,
      });
      
      setCaptureResult(result);
      console.log('Capture result:', result);
    } catch (err) {
      setError(`capture_screen error: ${err}`);
      console.error('Capture error:', err);
    } finally {
      setLoading(null);
    }
  };

  const testGetActiveWindow = async () => {
    setLoading('get_active_window');
    setError(null);
    try {
      const result = await invoke<WindowInfo>('get_active_window');
      setWindowInfo(result);
      console.log('Window info:', result);
    } catch (err) {
      setError(`get_active_window error: ${err}`);
      console.error('Window info error:', err);
    } finally {
      setLoading(null);
    }
  };

  const testGetCursorPosition = async () => {
    setLoading('get_cursor_position');
    setError(null);
    try {
      const result = await invoke<[number, number]>('get_cursor_position');
      setCursorPos(result);
      console.log('Cursor position:', result);
    } catch (err) {
      setError(`get_cursor_position error: ${err}`);
      console.error('Cursor position error:', err);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">Capture Commands Test</h1>
      
      {error && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Test capture_screen */}
      <div className="border rounded-lg p-4 space-y-3">
        <h2 className="text-xl font-semibold">1. capture_screen</h2>
        <button
          onClick={testCaptureScreen}
          disabled={loading === 'capture_screen'}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
        >
          {loading === 'capture_screen' ? 'Capturing...' : 'Test Capture Screen'}
        </button>
        {captureResult && (
          <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded">
            <p className="font-mono text-sm">
              <strong>Path:</strong> {captureResult.path}
            </p>
            <p className="font-mono text-sm">
              <strong>Timestamp:</strong> {captureResult.timestamp} ({new Date(captureResult.timestamp).toLocaleString()})
            </p>
          </div>
        )}
      </div>

      {/* Test get_active_window */}
      <div className="border rounded-lg p-4 space-y-3">
        <h2 className="text-xl font-semibold">2. get_active_window</h2>
        <button
          onClick={testGetActiveWindow}
          disabled={loading === 'get_active_window'}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
        >
          {loading === 'get_active_window' ? 'Getting...' : 'Test Get Active Window'}
        </button>
        {windowInfo && (
          <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded space-y-1">
            <p className="font-mono text-sm">
              <strong>Title:</strong> {windowInfo.title}
            </p>
            <p className="font-mono text-sm">
              <strong>Process:</strong> {windowInfo.process_name}
            </p>
            <p className="font-mono text-sm">
              <strong>Bounds:</strong> x={windowInfo.bounds.x}, y={windowInfo.bounds.y}, 
              w={windowInfo.bounds.width}, h={windowInfo.bounds.height}
            </p>
          </div>
        )}
      </div>

      {/* Test get_cursor_position */}
      <div className="border rounded-lg p-4 space-y-3">
        <h2 className="text-xl font-semibold">3. get_cursor_position</h2>
        <button
          onClick={testGetCursorPosition}
          disabled={loading === 'get_cursor_position'}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
        >
          {loading === 'get_cursor_position' ? 'Getting...' : 'Test Get Cursor Position'}
        </button>
        {cursorPos && (
          <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded">
            <p className="font-mono text-sm">
              <strong>Position:</strong> X={cursorPos[0]}, Y={cursorPos[1]}
            </p>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded">
        <h3 className="font-semibold mb-2">Test Instructions:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Click "Test Capture Screen" - should save a WebP screenshot to C:\temp\</li>
          <li>Click "Test Get Active Window" - should show info about this window</li>
          <li>Move your mouse, then click "Test Get Cursor Position" - should show X/Y coordinates</li>
        </ol>
        <p className="mt-3 text-sm text-gray-600">
          <strong>Note:</strong> Make sure C:\temp\ directory exists, or the capture will create it.
        </p>
      </div>
    </div>
  );
}
