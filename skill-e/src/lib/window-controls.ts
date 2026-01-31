import { getCurrentWindow, LogicalSize } from '@tauri-apps/api/window';

// NOTE: Overlay disabled - recording happens without visual overlay
// This allows clicking through to underlying applications during recording

export async function setToolbarMode() {
    const appWindow = getCurrentWindow();
    // Toolbar size
    // Toolbar size - Increased to accommodate ring/shadows without clipping
    await appWindow.setSize(new LogicalSize(340, 80));
    // await appWindow.setIgnoreCursorEvents(false);
    await appWindow.setAlwaysOnTop(true);
}

export async function setProcessingMode() {
    const appWindow = getCurrentWindow();
    // Processing dialog size
    await appWindow.setSize(new LogicalSize(800, 600));
    await appWindow.center();
    await appWindow.setAlwaysOnTop(false); // User requested no always-on-top for fullscreen
}

export async function setPreviewMode() {
    const appWindow = getCurrentWindow();
    // Large preview window
    await appWindow.setSize(new LogicalSize(1024, 768));
    await appWindow.center();
    await appWindow.setAlwaysOnTop(false);
}

export async function setRecordingMode() {
    // Overlay disabled - recording happens without visual overlay
    // This allows clicking through to underlying applications
    console.log('Recording mode: no overlay (click-through enabled)');
}
