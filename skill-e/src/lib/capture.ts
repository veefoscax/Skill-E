/**
 * Screen capture utilities
 * Requirements: FR-2.1, FR-2.2, FR-2.3, NFR-2.2
 */

import { invoke } from '@tauri-apps/api/core';
import type { CaptureResult, WindowInfo } from '../types/capture';

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

/**
 * Gets information about the currently active window
 * 
 * @returns Promise resolving to window information including title, process name, and bounds
 * @throws Error if unable to get window info or if not supported on current platform
 * 
 * @example
 * ```typescript
 * const windowInfo = await getActiveWindow();
 * console.log(`Active window: ${windowInfo.title} (${windowInfo.processName})`);
 * console.log(`Position: ${windowInfo.bounds.x}, ${windowInfo.bounds.y}`);
 * console.log(`Size: ${windowInfo.bounds.width}x${windowInfo.bounds.height}`);
 * ```
 * 
 * Requirements: FR-2.3
 */
export async function getActiveWindow(): Promise<WindowInfo> {
  return await invoke<WindowInfo>('get_active_window');
}

/**
 * Gets the current cursor position relative to the screen origin (top-left)
 * 
 * @returns Promise resolving to a tuple [x, y] with cursor coordinates
 * @throws Error if unable to get cursor position or if not supported on current platform
 * 
 * @example
 * ```typescript
 * const [x, y] = await getCursorPosition();
 * console.log(`Cursor at: ${x}, ${y}`);
 * ```
 * 
 * Requirements: FR-2.4
 */
export async function getCursorPosition(): Promise<[number, number]> {
  return await invoke<[number, number]>('get_cursor_position');
}
