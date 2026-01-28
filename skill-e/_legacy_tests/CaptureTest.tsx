/**
 * Test component for screen capture functionality
 * This is a temporary component for testing Task 2 & 3: Capture Commands and Window Tracking
 */

import { useState } from 'react';
import { captureScreen, generateScreenshotPath, getActiveWindow, getCursorPosition } from '../lib/capture';
import type { CaptureResult, WindowInfo } from '../types/capture';

export function CaptureTest() {
  const [result, setResult] = useState<CaptureResult | null>(null);
  const [windowInfo, setWindowInfo] = useState<WindowInfo | null>(null);
  const [cursorPosition, setCursorPosition] = useState<[number, number] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isGettingWindow, setIsGettingWindow] = useState(false);
  const [isGettingCursor, setIsGettingCursor] = useState(false);

  const handleCapture = async () => {
    setIsCapturing(true);
    setError(null);
    setResult(null);

    try {
      // Generate a path in the temp directory
      // Note: In production, we'd use a proper temp directory from Tauri
      const path = generateScreenshotPath('C:/temp/skill-e', 'test');
      
      const captureResult = await captureScreen(path);
      setResult(captureResult);
      console.log('Capture successful:', captureResult);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      console.error('Capture failed:', err);
    } finally {
      setIsCapturing(false);
    }
  };

  const handleGetWindow = async () => {
    setIsGettingWindow(true);
    setError(null);
    setWindowInfo(null);

    try {
      const info = await getActiveWindow();
      setWindowInfo(info);
      console.log('Window info retrieved:', info);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      console.error('Get window failed:', err);
    } finally {
      setIsGettingWindow(false);
    }
  };

  const handleGetCursor = async () => {
    setIsGettingCursor(true);
    setError(null);
    setCursorPosition(null);

    try {
      const position = await getCursorPosition();
      setCursorPosition(position);
      console.log('Cursor position retrieved:', position);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      console.error('Get cursor position failed:', err);
    } finally {
      setIsGettingCursor(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-card space-y-4">
      <h2 className="text-xl font-semibold mb-4">Screen Capture & Window Tracking Test</h2>
      
      <div className="flex gap-2">
        <button
          onClick={handleCapture}
          disabled={isCapturing}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
        >
          {isCapturing ? 'Capturing...' : 'Capture Screen'}
        </button>

        <button
          onClick={handleGetWindow}
          disabled={isGettingWindow}
          className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 disabled:opacity-50"
        >
          {isGettingWindow ? 'Getting Window...' : 'Get Active Window'}
        </button>

        <button
          onClick={handleGetCursor}
          disabled={isGettingCursor}
          className="px-4 py-2 bg-accent text-accent-foreground rounded-md hover:bg-accent/90 disabled:opacity-50"
        >
          {isGettingCursor ? 'Getting Cursor...' : 'Get Cursor Position'}
        </button>
      </div>

      {result && (
        <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded">
          <h3 className="font-semibold text-green-600 dark:text-green-400">Screenshot Captured!</h3>
          <p className="text-sm mt-1">
            <strong>Path:</strong> {result.path}
          </p>
          <p className="text-sm">
            <strong>Timestamp:</strong> {new Date(result.timestamp).toLocaleString()}
          </p>
        </div>
      )}

      {windowInfo && (
        <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded">
          <h3 className="font-semibold text-blue-600 dark:text-blue-400">Active Window Info</h3>
          <div className="text-sm mt-2 space-y-1">
            <p><strong>Title:</strong> {windowInfo.title}</p>
            <p><strong>Process:</strong> {windowInfo.processName}</p>
            <p><strong>Position:</strong> ({windowInfo.bounds.x}, {windowInfo.bounds.y})</p>
            <p><strong>Size:</strong> {windowInfo.bounds.width} × {windowInfo.bounds.height}</p>
          </div>
        </div>
      )}

      {cursorPosition && (
        <div className="mt-4 p-3 bg-purple-500/10 border border-purple-500/20 rounded">
          <h3 className="font-semibold text-purple-600 dark:text-purple-400">Cursor Position</h3>
          <div className="text-sm mt-2 space-y-1">
            <p><strong>X:</strong> {cursorPosition[0]}</p>
            <p><strong>Y:</strong> {cursorPosition[1]}</p>
            <p><strong>Coordinates:</strong> ({cursorPosition[0]}, {cursorPosition[1]})</p>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded">
          <h3 className="font-semibold text-red-600 dark:text-red-400">Error</h3>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      <div className="mt-4 text-sm text-muted-foreground">
        <p><strong>Requirements tested:</strong></p>
        <ul className="list-disc list-inside mt-1">
          <li>FR-2.1: Capture entire screen</li>
          <li>FR-2.2: Save as WebP format</li>
          <li>FR-2.3: Detect active window and track focus changes</li>
          <li>FR-2.4: Capture mouse cursor position for each frame</li>
          <li>NFR-2.2: Storage format WebP (Quality 80)</li>
        </ul>
      </div>
    </div>
  );
}
