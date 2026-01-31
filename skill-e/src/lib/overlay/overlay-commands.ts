/**
 * Tauri commands for overlay window management
 * 
 * The overlay window is:
 * - Transparent background
 * - Fullscreen
 * - Always on top
 * - Click-through (except for interactive elements)
 * - Skips taskbar
 * 
 * Requirements: NFR-4.1
 */

import { invoke } from '@tauri-apps/api/core';

/**
 * Create the overlay window
 * 
 * This should be called once during app initialization or before starting recording.
 * The window is created hidden and must be shown with showOverlay().
 */
export async function createOverlayWindow(): Promise<void> {
  try {
    await invoke('create_overlay_window');
    console.log('[Overlay] Window created successfully');
  } catch (error) {
    console.error('[Overlay] Failed to create window:', error);
    // Don't throw - app can work without overlay
  }
}

/**
 * Show the overlay window
 * 
 * Makes the overlay visible and brings it to focus.
 * The overlay window must be created first with createOverlayWindow().
 */
export async function showOverlay(): Promise<void> {
  try {
    await invoke('show_overlay');
    console.log('[Overlay] Window shown successfully');
  } catch (error) {
    console.error('[Overlay] Failed to show window:', error);
    // Don't throw - recording can continue without overlay
  }
}

/**
 * Hide the overlay window
 * 
 * Hides the overlay but keeps it in memory for quick re-showing.
 */
export async function hideOverlay(): Promise<void> {
  try {
    await invoke('hide_overlay');
    console.log('[Overlay] Window hidden successfully');
  } catch (error) {
    console.error('[Overlay] Failed to hide window:', error);
    // Don't throw
  }
}

/**
 * Toggle overlay visibility
 * 
 * Shows the overlay if hidden, hides it if visible.
 */
export async function toggleOverlay(): Promise<void> {
  try {
    await invoke('toggle_overlay');
  } catch (error) {
    console.error('[Overlay] Failed to toggle window:', error);
  }
}

/**
 * Update overlay bounds to match current monitor
 * 
 * Useful when:
 * - Monitor configuration changes
 * - Recording switches to a different monitor
 * - Display resolution changes
 */
export async function updateOverlayBounds(): Promise<void> {
  try {
    await invoke('update_overlay_bounds');
  } catch (error) {
    console.error('[Overlay] Failed to update bounds:', error);
  }
}
