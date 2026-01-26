import { useEffect, useState } from 'react';
import { useAudioRecording } from '../hooks/useAudioRecording';
import { useRecordingStore } from '../stores/recording';
import { AudioLevelMeter } from './AudioLevelMeter';
import { invoke } from '@tauri-apps/api/core';

/**
 * Test component for audio recording functionality
 * 
 * Tests:
 * - Microphone permission request
 * - Start/stop recording
 * - Pause/resume functionality
 * - Audio blob creation
 * - Audio file saving to disk
 * - Session directory integration
 * 
 * Requirements: FR-3.1, FR-3.3, NFR-3.1
 */
export function AudioRecordingTest() {
  const {
    isRecording,
    isPaused,
    hasPermission,
    error,
    requestPermission,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    cancelRecording,
    cleanup,
    getAudioStream,
    setSessionDirectory,
  } = useAudioRecording();

  const audioBlob = useRecordingStore((state) => state.audioBlob);
  const audioPath = useRecordingStore((state) => state.audioPath);
  const [sessionDir, setSessionDir] = useState<string | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  const handleCreateSession = async () => {
    try {
      setSessionError(null);
      const sessionId = `test-session-${Date.now()}`;
      const dir = await invoke<string>('create_session_directory', { sessionId });
      setSessionDir(dir);
      setSessionDirectory(dir);
      console.log('Session directory created:', dir);
    } catch (err) {
      console.error('Failed to create session directory:', err);
      setSessionError(
        err instanceof Error ? err.message : 'Failed to create session directory'
      );
    }
  };

  const handleRequestPermission = async () => {
    await requestPermission();
  };

  const handleStart = async () => {
    try {
      await startRecording();
    } catch (err) {
      console.error('Failed to start recording:', err);
    }
  };

  const handlePause = () => {
    pauseRecording();
  };

  const handleResume = () => {
    resumeRecording();
  };

  const handleStop = () => {
    stopRecording();
  };

  const handleCancel = () => {
    cancelRecording();
  };

  const handlePlayback = () => {
    if (audioBlob) {
      const url = URL.createObjectURL(audioBlob);
      const audio = new Audio(url);
      audio.play();
      audio.onended = () => {
        URL.revokeObjectURL(url);
      };
    }
  };

  const handleDownload = () => {
    if (audioBlob) {
      const url = URL.createObjectURL(audioBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `recording-${Date.now()}.webm`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Audio Recording Test</h1>

      {/* Permission Status */}
      <div className="mb-6 p-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Permission Status</h2>
        <p className="mb-2">
          <strong>Has Permission:</strong>{' '}
          {hasPermission === null ? 'Not requested' : hasPermission ? 'Yes ✓' : 'No ✗'}
        </p>
        <p className="mb-2 text-sm text-gray-600">
          <strong>Browser:</strong> {navigator.userAgent.includes('Chrome') ? 'Chrome' : navigator.userAgent.includes('Firefox') ? 'Firefox' : 'Other'}
        </p>
        <p className="mb-2 text-sm text-gray-600">
          <strong>getUserMedia available:</strong> {navigator.mediaDevices && navigator.mediaDevices.getUserMedia ? 'Yes ✓' : 'No ✗'}
        </p>
        {hasPermission === false && (
          <button
            onClick={handleRequestPermission}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Request Permission
          </button>
        )}
        {hasPermission === null && (
          <button
            onClick={handleRequestPermission}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Request Permission
          </button>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-lg">
          <strong>Error:</strong> {error}
        </div>
      )}
      
      {/* Session Error Display */}
      {sessionError && (
        <div className="mb-6 p-4 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-lg">
          <strong>Session Error:</strong> {sessionError}
        </div>
      )}

      {/* Session Directory */}
      <div className="mb-6 p-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Session Directory</h2>
        {sessionDir ? (
          <div>
            <p className="mb-2 text-sm break-all">
              <strong>Path:</strong> {sessionDir}
            </p>
            <p className="text-green-600 dark:text-green-400">✓ Session directory ready</p>
          </div>
        ) : (
          <div>
            <p className="mb-2 text-gray-500">No session directory created</p>
            <button
              onClick={handleCreateSession}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Create Session Directory
            </button>
          </div>
        )}
      </div>

      {/* Recording Status */}
      <div className="mb-6 p-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Recording Status</h2>
        <p className="mb-2">
          <strong>Is Recording:</strong> {isRecording ? 'Yes 🔴' : 'No'}
        </p>
        <p className="mb-4">
          <strong>Is Paused:</strong> {isPaused ? 'Yes ⏸️' : 'No'}
        </p>

        {/* Audio Level Meter */}
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">Audio Level Meter</h3>
          <AudioLevelMeter 
            audioStream={getAudioStream()} 
            isActive={isRecording && !isPaused}
          />
        </div>
      </div>

      {/* Recording Controls */}
      <div className="mb-6 p-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Recording Controls</h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleStart}
            disabled={isRecording || hasPermission === false}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Start Recording
          </button>
          <button
            onClick={handlePause}
            disabled={!isRecording || isPaused}
            className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Pause
          </button>
          <button
            onClick={handleResume}
            disabled={!isRecording || !isPaused}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Resume
          </button>
          <button
            onClick={handleStop}
            disabled={!isRecording}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Stop
          </button>
          <button
            onClick={handleCancel}
            disabled={!isRecording}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Audio Blob Info */}
      <div className="mb-6 p-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Audio Data</h2>
        {audioBlob ? (
          <div>
            <p className="mb-2">
              <strong>Blob Size:</strong> {(audioBlob.size / 1024).toFixed(2)} KB
            </p>
            <p className="mb-2">
              <strong>Blob Type:</strong> {audioBlob.type}
            </p>
            {audioPath && (
              <div className="mt-4 p-3 bg-green-50 dark:bg-green-900 rounded">
                <p className="mb-2">
                  <strong>✓ Saved to Disk:</strong>
                </p>
                <p className="text-sm break-all text-green-800 dark:text-green-200">
                  {audioPath}
                </p>
              </div>
            )}
            <div className="flex gap-2 mt-4">
              <button
                onClick={handlePlayback}
                className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
              >
                Play Audio
              </button>
              <button
                onClick={handleDownload}
                className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
              >
                Download Audio
              </button>
            </div>
          </div>
        ) : (
          <p className="text-gray-500">No audio recorded yet</p>
        )}
      </div>

      {/* Test Instructions */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Test Instructions</h2>
        <ol className="list-decimal list-inside space-y-2">
          <li>Click "Create Session Directory" to set up file storage</li>
          <li>Click "Request Permission" if needed (browser will prompt)</li>
          <li>Click "Start Recording" and speak into your microphone</li>
          <li>Observe the audio level meter responding to your voice</li>
          <li>Test "Pause" and "Resume" buttons</li>
          <li>Click "Stop" to finish recording</li>
          <li>Verify the audio blob is created (size and type shown)</li>
          <li>Verify the audio file path is displayed (saved to disk)</li>
          <li>Click "Play Audio" to verify the recording quality</li>
          <li>Check that the file format is WebM with Opus codec (16kHz mono)</li>
        </ol>
        
        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900 rounded">
          <p className="font-semibold mb-1">✓ Task 3 Requirements:</p>
          <ul className="list-disc list-inside text-sm space-y-1">
            <li>Convert blob to file on recording stop ✓</li>
            <li>Save audio file via Tauri FS API ✓</li>
            <li>Store path in session data ✓</li>
            <li>Ensure 16kHz mono format for Whisper ✓</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
