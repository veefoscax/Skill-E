import { useState } from 'react';
import { useCapture } from '../hooks/useCapture';
import type { CaptureSession, SessionManifest } from '../types/capture';

/**
 * Test component for session storage functionality
 * 
 * Tests:
 * - Create session directory
 * - Save screenshots to temp folder
 * - Create and update manifest.json
 * - Cleanup on session end
 * 
 * Requirements: FR-2.5, NFR-2.3
 */
export function SessionStorageTest() {
  const [isCapturing, setIsCapturing] = useState(false);
  const [currentSession, setCurrentSession] = useState<CaptureSession | null>(null);
  const [sessions, setSessions] = useState<string[]>([]);
  const [manifest, setManifest] = useState<SessionManifest | null>(null);
  const [log, setLog] = useState<string[]>([]);

  const {
    startCapture,
    stopCapture,
    cleanupSession,
    loadSessionManifest,
    listSessions,
    getCurrentSession,
  } = useCapture();

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLog((prev) => [...prev, `[${timestamp}] ${message}`]);
    console.log(message);
  };

  const handleStartCapture = async () => {
    try {
      addLog('Starting capture session...');
      const session = await startCapture(1000); // 1 second interval
      setCurrentSession(session);
      setIsCapturing(true);
      addLog(`Session started: ${session.id}`);
      addLog(`Directory: ${session.directory}`);
    } catch (error) {
      addLog(`Error starting capture: ${error}`);
    }
  };

  const handleStopCapture = async () => {
    try {
      addLog('Stopping capture session...');
      await stopCapture();
      const session = getCurrentSession();
      if (session) {
        addLog(`Session stopped: ${session.id}`);
        addLog(`Total frames captured: ${session.frames.length}`);
      }
      setIsCapturing(false);
    } catch (error) {
      addLog(`Error stopping capture: ${error}`);
    }
  };

  const handleListSessions = async () => {
    try {
      addLog('Listing sessions...');
      const sessionList = await listSessions();
      setSessions(sessionList);
      addLog(`Found ${sessionList.length} sessions`);
      sessionList.forEach((s) => addLog(`  - ${s}`));
    } catch (error) {
      addLog(`Error listing sessions: ${error}`);
    }
  };

  const handleLoadManifest = async () => {
    try {
      if (!currentSession) {
        addLog('No current session to load manifest from');
        return;
      }
      addLog('Loading manifest...');
      const loadedManifest = await loadSessionManifest(currentSession.directory);
      setManifest(loadedManifest);
      addLog(`Manifest loaded: ${loadedManifest.frames.length} frames`);
    } catch (error) {
      addLog(`Error loading manifest: ${error}`);
    }
  };

  const handleCleanup = async () => {
    try {
      if (!currentSession) {
        addLog('No current session to cleanup');
        return;
      }
      addLog('Cleaning up session...');
      await cleanupSession(currentSession.directory);
      addLog(`Session cleaned up: ${currentSession.directory}`);
      setCurrentSession(null);
      setManifest(null);
    } catch (error) {
      addLog(`Error cleaning up: ${error}`);
    }
  };

  const handleClearLog = () => {
    setLog([]);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Session Storage Test</h1>
      
      <div className="space-y-4">
        {/* Control Buttons */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={handleStartCapture}
            disabled={isCapturing}
            className="px-4 py-2 bg-green-600 text-white rounded disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-green-700"
          >
            Start Capture
          </button>
          
          <button
            onClick={handleStopCapture}
            disabled={!isCapturing}
            className="px-4 py-2 bg-red-600 text-white rounded disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-red-700"
          >
            Stop Capture
          </button>
          
          <button
            onClick={handleListSessions}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            List Sessions
          </button>
          
          <button
            onClick={handleLoadManifest}
            disabled={!currentSession}
            className="px-4 py-2 bg-purple-600 text-white rounded disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-purple-700"
          >
            Load Manifest
          </button>
          
          <button
            onClick={handleCleanup}
            disabled={!currentSession}
            className="px-4 py-2 bg-orange-600 text-white rounded disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-orange-700"
          >
            Cleanup Session
          </button>
          
          <button
            onClick={handleClearLog}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Clear Log
          </button>
        </div>

        {/* Current Session Info */}
        {currentSession && (
          <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded">
            <h2 className="font-semibold mb-2">Current Session</h2>
            <div className="text-sm space-y-1">
              <p><strong>ID:</strong> {currentSession.id}</p>
              <p><strong>Directory:</strong> {currentSession.directory}</p>
              <p><strong>Frames:</strong> {currentSession.frames.length}</p>
              <p><strong>Status:</strong> {isCapturing ? '🔴 Recording' : '⏸️ Stopped'}</p>
            </div>
          </div>
        )}

        {/* Sessions List */}
        {sessions.length > 0 && (
          <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded">
            <h2 className="font-semibold mb-2">Available Sessions ({sessions.length})</h2>
            <div className="text-sm space-y-1 max-h-40 overflow-y-auto">
              {sessions.map((session, idx) => (
                <p key={idx} className="font-mono text-xs">{session}</p>
              ))}
            </div>
          </div>
        )}

        {/* Manifest Info */}
        {manifest && (
          <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded">
            <h2 className="font-semibold mb-2">Manifest</h2>
            <div className="text-sm space-y-1">
              <p><strong>Session ID:</strong> {manifest.sessionId}</p>
              <p><strong>Start Time:</strong> {new Date(manifest.startTime).toLocaleString()}</p>
              {manifest.endTime && (
                <p><strong>End Time:</strong> {new Date(manifest.endTime).toLocaleString()}</p>
              )}
              <p><strong>Interval:</strong> {manifest.intervalMs}ms</p>
              <p><strong>Frames:</strong> {manifest.frames.length}</p>
              
              {manifest.frames.length > 0 && (
                <details className="mt-2">
                  <summary className="cursor-pointer font-semibold">Frame Details</summary>
                  <div className="mt-2 space-y-2 max-h-60 overflow-y-auto">
                    {manifest.frames.map((frame, idx) => (
                      <div key={idx} className="p-2 bg-white dark:bg-gray-900 rounded text-xs">
                        <p><strong>ID:</strong> {frame.id}</p>
                        <p><strong>Path:</strong> {frame.imagePath}</p>
                        {frame.activeWindow && (
                          <p><strong>Window:</strong> {frame.activeWindow.title}</p>
                        )}
                        {frame.cursorPosition && (
                          <p><strong>Cursor:</strong> ({frame.cursorPosition.x}, {frame.cursorPosition.y})</p>
                        )}
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>
          </div>
        )}

        {/* Log */}
        <div className="p-4 bg-black text-green-400 rounded font-mono text-xs h-64 overflow-y-auto">
          <h2 className="font-semibold mb-2 text-white">Log</h2>
          {log.length === 0 ? (
            <p className="text-gray-500">No log entries yet...</p>
          ) : (
            log.map((entry, idx) => (
              <p key={idx}>{entry}</p>
            ))
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded">
        <h2 className="font-semibold mb-2">Test Instructions</h2>
        <ol className="text-sm space-y-1 list-decimal list-inside">
          <li>Click "Start Capture" to begin capturing screenshots</li>
          <li>Wait a few seconds to capture multiple frames</li>
          <li>Click "Stop Capture" to end the session</li>
          <li>Click "Load Manifest" to verify manifest.json was created</li>
          <li>Click "List Sessions" to see all session directories</li>
          <li>Click "Cleanup Session" to delete the session directory</li>
          <li>Verify the log shows all operations completed successfully</li>
        </ol>
      </div>
    </div>
  );
}
