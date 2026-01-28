/**
 * Status Indicator Test Component
 * 
 * Interactive test for the minimal overlay status indicator.
 * Tests all recording states and positioning options.
 * 
 * Requirements: FR-4.26
 */

import { useState } from 'react';
import { StatusIndicator, RecordingStatus } from './Overlay/StatusIndicator';
import { useOverlayStore, type StatusIndicatorPosition } from '../stores/overlay';

export function StatusIndicatorTest() {
  const [localStatus, setLocalStatus] = useState<RecordingStatus>('recording');
  const [localVisible, setLocalVisible] = useState(true);
  const [localPosition, setLocalPosition] = useState<StatusIndicatorPosition>('top-right');
  const [useStore, setUseStore] = useState(false);

  const {
    recordingStatus,
    statusIndicatorVisible,
    statusIndicatorPosition,
    setRecordingStatus,
    toggleStatusIndicator,
    setStatusIndicatorPosition,
  } = useOverlayStore();

  const displayStatus = useStore ? recordingStatus : localStatus;
  const displayVisible = useStore ? statusIndicatorVisible : localVisible;
  const displayPosition = useStore ? statusIndicatorPosition : localPosition;

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Status Indicator Test</h1>
          <p className="text-zinc-400">
            Test the minimal overlay status indicator (FR-4.26)
          </p>
        </div>

        {/* Store Toggle */}
        <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800">
          <h2 className="text-xl font-semibold mb-4">State Management</h2>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setUseStore(!useStore)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                useStore
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-zinc-800 hover:bg-zinc-700'
              }`}
            >
              {useStore ? 'Using Store' : 'Using Local State'}
            </button>
            <p className="text-sm text-zinc-400">
              {useStore
                ? 'Controls connected to overlay store'
                : 'Controls use local state only'}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800 space-y-6">
          <h2 className="text-xl font-semibold">Controls</h2>

          {/* Recording Status */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-zinc-300">
              Recording Status
            </label>
            <div className="flex gap-2">
              {(['recording', 'paused', 'stopped'] as RecordingStatus[]).map((status) => (
                <button
                  key={status}
                  onClick={() => {
                    if (useStore) {
                      setRecordingStatus(status);
                    } else {
                      setLocalStatus(status);
                    }
                  }}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors capitalize ${
                    displayStatus === status
                      ? status === 'recording'
                        ? 'bg-red-600 hover:bg-red-700'
                        : status === 'paused'
                        ? 'bg-orange-600 hover:bg-orange-700'
                        : 'bg-zinc-700 hover:bg-zinc-600'
                      : 'bg-zinc-800 hover:bg-zinc-700'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
            <p className="text-xs text-zinc-500">
              Recording = Red dot, Paused = Orange dot, Stopped = Hidden
            </p>
          </div>

          {/* Visibility */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-zinc-300">
              Visibility
            </label>
            <button
              onClick={() => {
                if (useStore) {
                  toggleStatusIndicator();
                } else {
                  setLocalVisible(!localVisible);
                }
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                displayVisible
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-zinc-800 hover:bg-zinc-700'
              }`}
            >
              {displayVisible ? 'Visible' : 'Hidden'}
            </button>
          </div>

          {/* Position */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-zinc-300">
              Position
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['top-left', 'top-right', 'bottom-left', 'bottom-right'] as StatusIndicatorPosition[]).map(
                (position) => (
                  <button
                    key={position}
                    onClick={() => {
                      if (useStore) {
                        setStatusIndicatorPosition(position);
                      } else {
                        setLocalPosition(position);
                      }
                    }}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors capitalize ${
                      displayPosition === position
                        ? 'bg-blue-600 hover:bg-blue-700'
                        : 'bg-zinc-800 hover:bg-zinc-700'
                    }`}
                  >
                    {position.replace('-', ' ')}
                  </button>
                )
              )}
            </div>
          </div>
        </div>

        {/* Preview Area */}
        <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800">
          <h2 className="text-xl font-semibold mb-4">Preview</h2>
          <div className="relative bg-zinc-950 rounded-lg border border-zinc-700 h-96 overflow-hidden">
            {/* Grid background for reference */}
            <div className="absolute inset-0 opacity-10">
              <div className="grid grid-cols-8 grid-rows-8 h-full">
                {Array.from({ length: 64 }).map((_, i) => (
                  <div key={i} className="border border-zinc-700" />
                ))}
              </div>
            </div>

            {/* Status Indicator */}
            <StatusIndicator
              status={displayStatus}
              visible={displayVisible}
              position={displayPosition}
            />

            {/* Center label */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center space-y-2">
                <p className="text-zinc-500 text-sm">Preview Area</p>
                <p className="text-zinc-600 text-xs">
                  Look for the status indicator in the {displayPosition.replace('-', ' ')} corner
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Current State Display */}
        <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800">
          <h2 className="text-xl font-semibold mb-4">Current State</h2>
          <div className="space-y-2 font-mono text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-400">Status:</span>
              <span className={`font-semibold ${
                displayStatus === 'recording' ? 'text-red-400' :
                displayStatus === 'paused' ? 'text-orange-400' :
                'text-zinc-400'
              }`}>
                {displayStatus}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Visible:</span>
              <span className={displayVisible ? 'text-green-400' : 'text-zinc-400'}>
                {displayVisible ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Position:</span>
              <span className="text-blue-400">{displayPosition}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Using Store:</span>
              <span className={useStore ? 'text-blue-400' : 'text-zinc-400'}>
                {useStore ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        </div>

        {/* Test Checklist */}
        <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800">
          <h2 className="text-xl font-semibold mb-4">Test Checklist</h2>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <span className="text-zinc-500">☐</span>
              <span className="text-zinc-300">
                Red dot appears when status is "recording"
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-zinc-500">☐</span>
              <span className="text-zinc-300">
                Orange dot appears when status is "paused"
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-zinc-500">☐</span>
              <span className="text-zinc-300">
                Dot disappears when status is "stopped"
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-zinc-500">☐</span>
              <span className="text-zinc-300">
                Dot has smooth pulsing animation
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-zinc-500">☐</span>
              <span className="text-zinc-300">
                Dot can be positioned in all 4 corners
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-zinc-500">☐</span>
              <span className="text-zinc-300">
                Visibility toggle works correctly
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-zinc-500">☐</span>
              <span className="text-zinc-300">
                Store integration works (toggle "Using Store")
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-zinc-500">☐</span>
              <span className="text-zinc-300">
                Dot is minimal and non-intrusive (8px size)
              </span>
            </div>
          </div>
        </div>

        {/* Requirements */}
        <div className="bg-blue-950/30 border border-blue-900/50 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-blue-300">Requirements</h2>
          <div className="space-y-2 text-sm text-blue-200">
            <p>
              <strong>FR-4.26:</strong> Optional small red dot in overlay corner to show recording status
            </p>
            <p className="text-xs text-blue-300 mt-2">
              The status indicator should be minimal (8px), non-intrusive, and provide subtle visual feedback
              about the recording state without obscuring content.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
