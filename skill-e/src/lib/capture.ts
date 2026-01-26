/**
 * Screen capture utilities
 * Requirements: FR-2.1, FR-2.2, NFR-2.2
 */

import { invoke } from '@tauri-apps/api/core';
import type { CaptureResult } from '../types/capture';

/**
 * Captures the entire screen and saves it as a WebP image
 * 
 * @param outputPath - Full path where the screenshot should be saved (must end in .webp)
 * @returns Promise resolving to capture result with path and timestamp
 * @throws Error if capture fails or path is invalid
 * 
 * @example
 * ```typescript
 * const result = await captureScreen('/tmp/screenshot.webp');
 * console.log(`Captured at ${result.timestamp}: ${result.path}`);
 * ```
 */
export async function captureScreen(outputPath: string): Promise<CaptureResult> {
  if (!outputPath.endsWith('.webp')) {
    throw new Error('Output path must end with .webp extension');
  }

  return await invoke<CaptureResult>('capture_screen', {
    outputPath,
  });
}

/**
 * Generates a unique filename for a screenshot
 * 
 * @param directory - Directory where the screenshot will be saved
 * @param prefix - Optional prefix for the filename (default: 'capture')
 * @returns Full path to the screenshot file
 * 
 * @example
 * ```typescript
 * const path = generateScreenshotPath('/tmp/captures', 'frame');
 * // Returns: '/tmp/captures/frame_1234567890.webp'
 * ```
 */
export function generateScreenshotPath(
  directory: string,
  prefix: string = 'capture'
): string {
  const timestamp = Date.now();
  return `${directory}/${prefix}_${timestamp}.webp`;
}
