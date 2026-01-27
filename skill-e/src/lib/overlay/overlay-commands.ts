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
  await invoke('create_overlay_window');
}

/**
 * Show the overlay window
 * 
 * Makes the overlay visible and brings it to focus.
 * The overlay window must be created first with createOverlayWindow().
 */
export async function showOverlay(): Promise<void> {
  await invoke('show_overlay');
}

/**
 * Hide the overlay window
 * 
 * Hides the overlay but keeps it in memory for quick re-showing.
 */
export async function hideOverlay(): Promise<void> {
  await invoke('hide_overlay');
}

/**
 * Toggle overlay visibility
 * 
 * Shows the overlay if hidden, hides it if visible.
 */
export async function toggleOverlay(): Promise<void> {
  await invoke('toggle_overlay');
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
  await invoke('update_overlay_bounds');
}
