/**
 * Test component for screen capture functionality
 * This is a temporary component for testing Task 2: Create Capture Commands
 */

import { useState } from 'react';
import { captureScreen, generateScreenshotPath } from '../lib/capture';
import type { CaptureResult } from '../types/capture';

export function CaptureTest() {
  const [result, setResult] = useState<CaptureResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

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

  return (
    <div className="p-4 border rounded-lg bg-card">
      <h2 className="text-xl font-semibold mb-4">Screen Capture Test</h2>
      
      <button
        onClick={handleCapture}
        disabled={isCapturing}
        className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
      >
        {isCapturing ? 'Capturing...' : 'Capture Screen'}
      </button>

      {result && (
        <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded">
          <h3 className="font-semibold text-green-600 dark:text-green-400">Success!</h3>
          <p className="text-sm mt-1">
            <strong>Path:</strong> {result.path}
          </p>
          <p className="text-sm">
            <strong>Timestamp:</strong> {new Date(result.timestamp).toLocaleString()}
          </p>
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
          <li>NFR-2.2: Storage format WebP (Quality 80)</li>
        </ul>
      </div>
    </div>
  );
}
