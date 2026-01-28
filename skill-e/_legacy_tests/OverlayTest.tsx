/**
 * Test component for overlay window functionality
 * 
 * Tests:
 * - Create overlay window
 * - Show/hide overlay
 * - Toggle overlay
 * - Update overlay bounds
 * 
 * Requirements: NFR-4.1
 */

import { useState } from 'react';
import { Button } from './ui/button';
import {
  createOverlayWindow,
  showOverlay,
  hideOverlay,
  toggleOverlay,
  updateOverlayBounds,
} from '../lib/overlay/overlay-commands';

export function OverlayTest() {
  const [status, setStatus] = useState<string>('Ready');
  const [error, setError] = useState<string | null>(null);
  const [isCreated, setIsCreated] = useState(false);

  const handleCreateOverlay = async () => {
    try {
      setStatus('Creating overlay window...');
      setError(null);
      await createOverlayWindow();
      setIsCreated(true);
      setStatus('✅ Overlay window created successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStatus('❌ Failed to create overlay');
    }
  };

  const handleShowOverlay = async () => {
    try {
      setStatus('Showing overlay...');
      setError(null);
      await showOverlay();
      setStatus('✅ Overlay shown');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStatus('❌ Failed to show overlay');
    }
  };

  const handleHideOverlay = async () => {
    try {
      setStatus('Hiding overlay...');
      setError(null);
      await hideOverlay();
      setStatus('✅ Overlay hidden');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStatus('❌ Failed to hide overlay');
    }
  };

  const handleToggleOverlay = async () => {
    try {
      setStatus('Toggling overlay...');
      setError(null);
      await toggleOverlay();
      setStatus('✅ Overlay toggled');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStatus('❌ Failed to toggle overlay');
    }
  };

  const handleUpdateBounds = async () => {
    try {
      setStatus('Updating overlay bounds...');
      setError(null);
      await updateOverlayBounds();
      setStatus('✅ Overlay bounds updated');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStatus('❌ Failed to update bounds');
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Overlay Window Test</h1>
        <p className="text-sm text-muted-foreground">
          Test the transparent, fullscreen, always-on-top overlay window
        </p>
      </div>

      {/* Status Display */}
      <div className="p-4 bg-muted rounded-lg border">
        <p className="text-sm font-medium">Status: {status}</p>
        {error && (
          <p className="text-sm text-destructive mt-2">Error: {error}</p>
        )}
      </div>

      {/* Test Instructions */}
      <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <h3 className="text-sm font-semibold mb-2">Test Instructions:</h3>
        <ol className="text-sm space-y-1 list-decimal list-inside">
          <li>Click "Create Overlay Window" first</li>
          <li>Click "Show Overlay" to display the fullscreen overlay</li>
          <li>The overlay should be transparent and cover the entire screen</li>
          <li>You should be able to click through the overlay (except interactive elements)</li>
          <li>Click "Hide Overlay" to hide it</li>
          <li>Click "Toggle Overlay" to show/hide quickly</li>
          <li>Click "Update Bounds" to resize overlay to current monitor</li>
        </ol>
      </div>

      {/* Control Buttons */}
      <div className="space-y-3">
        <Button
          onClick={handleCreateOverlay}
          disabled={isCreated}
          className="w-full"
          variant={isCreated ? 'secondary' : 'default'}
        >
          {isCreated ? '✅ Overlay Created' : 'Create Overlay Window'}
        </Button>

        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={handleShowOverlay}
            disabled={!isCreated}
            variant="outline"
          >
            Show Overlay
          </Button>

          <Button
            onClick={handleHideOverlay}
            disabled={!isCreated}
            variant="outline"
          >
            Hide Overlay
          </Button>
        </div>

        <Button
          onClick={handleToggleOverlay}
          disabled={!isCreated}
          variant="outline"
          className="w-full"
        >
          Toggle Overlay
        </Button>

        <Button
          onClick={handleUpdateBounds}
          disabled={!isCreated}
          variant="outline"
          className="w-full"
        >
          Update Overlay Bounds
        </Button>
      </div>

      {/* Expected Behavior */}
      <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
        <h3 className="text-sm font-semibold mb-2">Expected Behavior:</h3>
        <ul className="text-sm space-y-1 list-disc list-inside">
          <li>Overlay is transparent (see-through)</li>
          <li>Overlay is fullscreen (covers entire monitor)</li>
          <li>Overlay is always on top (above all other windows)</li>
          <li>Overlay is click-through (can interact with windows below)</li>
          <li>Overlay does not appear in taskbar</li>
          <li>Overlay starts hidden and must be shown explicitly</li>
        </ul>
      </div>

      {/* Requirements */}
      <div className="text-xs text-muted-foreground border-t pt-4">
        <p>Requirements: NFR-4.1</p>
        <p>Task: Phase 1, Task 1 - Overlay Window (Rust/Tauri)</p>
      </div>
    </div>
  );
}
