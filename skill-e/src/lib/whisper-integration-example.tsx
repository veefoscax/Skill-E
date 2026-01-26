/**
 * Example: Whisper Integration with Audio Recording
 * 
 * This file demonstrates how to use the Whisper client with the audio recording hook.
 * It shows the complete flow from recording audio to transcribing it.
 * 
 * NOTE: This is an example file for reference, not a production component.
 */

import { useState } from 'react';
import { useAudioRecording } from '../hooks/useAudioRecording';
import { useRecordingStore } from '../stores/recording';
import { useSettingsStore } from '../stores/settings';
import { transcribeAudio, TranscriptionResult } from './whisper';

export function WhisperIntegrationExample() {
  const [transcription, setTranscription] = useState<TranscriptionResult | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionError, setTranscriptionError] = useState<string | null>(null);

  // Get audio recording functionality
  const {
    isRecording,
    isPaused,
    hasPermission,
    error: recordingError,
    requestPermission,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
  } = useAudioRecording();

  // Get audio blob from recording store
  const audioBlob = useRecordingStore((state) => state.audioBlob);

  // Get Whisper API key from settings
  const whisperApiKey = useSettingsStore((state) => state.whisperApiKey);

  /**
   * Handle transcription of recorded audio
   */
  const handleTranscribe = async () => {
    if (!audioBlob) {
      setTranscriptionError('No audio recorded yet');
      return;
    }

    if (!whisperApiKey) {
      setTranscriptionError('Whisper API key not configured. Please add it in settings.');
      return;
    }

    setIsTranscribing(true);
    setTranscriptionError(null);

    try {
      // Call Whisper API with the audio blob
      const result = await transcribeAudio(audioBlob, whisperApiKey);
      
      setTranscription(result);
      console.log('Transcription complete:', result);
      
      // Log segments with timestamps
      result.segments.forEach((segment) => {
        console.log(
          `[${segment.start.toFixed(2)}s - ${segment.end.toFixed(2)}s] ${segment.text}`
        );
      });
    } catch (err) {
      console.error('Transcription failed:', err);
      setTranscriptionError(
        err instanceof Error ? err.message : 'Transcription failed'
      );
    } finally {
      setIsTranscribing(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-semibold">Whisper Integration Example</h2>

      {/* Permission Status */}
      <div className="space-y-2">
        <h3 className="font-medium">1. Microphone Permission</h3>
        {hasPermission === null && (
          <button
            onClick={requestPermission}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Request Permission
          </button>
        )}
        {hasPermission === true && (
          <p className="text-green-600">✓ Permission granted</p>
        )}
        {hasPermission === false && (
          <p className="text-red-600">✗ Permission denied</p>
        )}
      </div>

      {/* Recording Controls */}
      <div className="space-y-2">
        <h3 className="font-medium">2. Record Audio</h3>
        <div className="flex gap-2">
          {!isRecording && (
            <button
              onClick={startRecording}
              disabled={hasPermission !== true}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
            >
              Start Recording
            </button>
          )}
          
          {isRecording && !isPaused && (
            <>
              <button
                onClick={pauseRecording}
                className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
              >
                Pause
              </button>
              <button
                onClick={stopRecording}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Stop Recording
              </button>
            </>
          )}
          
          {isRecording && isPaused && (
            <>
              <button
                onClick={resumeRecording}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Resume
              </button>
              <button
                onClick={stopRecording}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Stop Recording
              </button>
            </>
          )}
        </div>
        
        {isRecording && (
          <p className="text-sm text-gray-600">
            {isPaused ? '⏸ Paused' : '🔴 Recording...'}
          </p>
        )}
        
        {recordingError && (
          <p className="text-red-600 text-sm">{recordingError}</p>
        )}
      </div>

      {/* Transcription */}
      <div className="space-y-2">
        <h3 className="font-medium">3. Transcribe Audio</h3>
        
        {!whisperApiKey && (
          <p className="text-yellow-600 text-sm">
            ⚠ Whisper API key not configured. Add it in settings to enable transcription.
          </p>
        )}
        
        <button
          onClick={handleTranscribe}
          disabled={!audioBlob || !whisperApiKey || isTranscribing}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
        >
          {isTranscribing ? 'Transcribing...' : 'Transcribe Audio'}
        </button>
        
        {transcriptionError && (
          <p className="text-red-600 text-sm">{transcriptionError}</p>
        )}
      </div>

      {/* Results */}
      {transcription && (
        <div className="space-y-2 border-t pt-4">
          <h3 className="font-medium">Transcription Results</h3>
          
          <div className="space-y-1 text-sm">
            <p><strong>Language:</strong> {transcription.language}</p>
            <p><strong>Duration:</strong> {transcription.duration.toFixed(2)}s</p>
            <p><strong>Segments:</strong> {transcription.segments.length}</p>
          </div>
          
          <div className="mt-4">
            <h4 className="font-medium mb-2">Full Text:</h4>
            <p className="p-3 bg-gray-100 rounded text-sm">{transcription.text}</p>
          </div>
          
          <div className="mt-4">
            <h4 className="font-medium mb-2">Segments with Timestamps:</h4>
            <div className="space-y-2">
              {transcription.segments.map((segment) => (
                <div key={segment.id} className="p-2 bg-gray-50 rounded text-sm">
                  <span className="text-gray-500 font-mono">
                    [{segment.start.toFixed(2)}s - {segment.end.toFixed(2)}s]
                  </span>
                  <span className="ml-2">{segment.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
