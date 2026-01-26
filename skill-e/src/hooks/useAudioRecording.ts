import { useCallback, useRef, useState } from 'react';
import { useRecordingStore } from '../stores/recording';
import { useSettingsStore } from '../stores/settings';
import { invoke } from '@tauri-apps/api/core';

// ...

export function useAudioRecording() {
  const [isRecording, setIsRecording] = useState(false);
  const selectedMicId = useSettingsStore(state => state.selectedMicId);
  const [isPaused, setIsPaused] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const sessionDirRef = useRef<string | null>(null);
  const setAudioBlob = useRecordingStore((state) => state.setAudioBlob);
  const setAudioPath = useRecordingStore((state) => state.setAudioPath);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      console.log('Requesting microphone permission...');

      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia is not supported in this browser');
      }

      // Request microphone access with Whisper-compatible settings
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: selectedMicId !== 'default' ? { exact: selectedMicId } : undefined,
          channelCount: 1, // Mono
          sampleRate: 16000, // 16kHz for Whisper
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;
      setHasPermission(true);
      setError(null);
      console.log('✅ Microphone permission granted successfully!');
      console.log('Stream tracks:', stream.getTracks());
      return true;
    } catch (err) {
      console.error('❌ Failed to get microphone permission:', err);
      console.error('Error name:', (err as any).name);
      console.error('Error message:', (err as any).message);
      setHasPermission(false);

      let errorMessage = 'Failed to access microphone. ';
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          errorMessage += 'Permission denied. Please allow microphone access in your browser settings.';
        } else if (err.name === 'NotFoundError') {
          errorMessage += 'No microphone found. Please connect a microphone and try again.';
        } else if (err.name === 'NotReadableError') {
          errorMessage += 'Microphone is already in use by another application.';
        } else {
          errorMessage += err.message;
        }
      }

      setError(errorMessage);
      return false;
    }
  }, []);

  /**
   * Starts audio recording
   * 
   * @returns Promise that resolves when recording starts successfully
   */
  const startRecording = useCallback(async (): Promise<void> => {
    try {
      // Request permission if not already granted
      if (!streamRef.current) {
        const granted = await requestPermission();
        if (!granted) {
          throw new Error('Microphone permission denied');
        }
      }

      // Reset audio chunks
      audioChunksRef.current = [];

      // Create MediaRecorder with audio/webm format
      const mediaRecorder = new MediaRecorder(streamRef.current!, {
        mimeType: 'audio/webm;codecs=opus',
      });

      // Handle data available event
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          console.log(`Audio chunk received: ${event.data.size} bytes`);
        }
      };

      // Handle recording stop event
      mediaRecorder.onstop = async () => {
        console.log('MediaRecorder stopped');

        // Create final blob from all chunks
        const audioBlob = new Blob(audioChunksRef.current, {
          type: 'audio/webm;codecs=opus',
        });

        console.log(`Audio recording complete: ${audioBlob.size} bytes`);

        // Store blob in recording store
        setAudioBlob(audioBlob);

        // Save audio file to disk if we have a session directory
        if (sessionDirRef.current) {
          try {
            // Convert blob to array buffer
            const arrayBuffer = await audioBlob.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);

            // Generate filename with timestamp
            const timestamp = Date.now();
            const filename = `audio-${timestamp}.webm`;

            // Save to session directory via Tauri command
            const result = await invoke<{ path: string; size: number }>('save_audio_file', {
              sessionDir: sessionDirRef.current,
              audioData: Array.from(uint8Array),
              filename,
            });

            console.log(`Audio file saved: ${result.path} (${result.size} bytes)`);

            // Store path in recording store
            setAudioPath(result.path);
          } catch (err) {
            console.error('Failed to save audio file:', err);
            setError(
              err instanceof Error
                ? `Failed to save audio: ${err.message}`
                : 'Failed to save audio file'
            );
          }
        }

        // Reset state
        setIsRecording(false);
        setIsPaused(false);
      };

      // Handle errors
      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        setError('Recording error occurred');
        setIsRecording(false);
        setIsPaused(false);
      };

      // Start recording with timeslice for periodic data availability
      mediaRecorder.start(1000); // Request data every second
      mediaRecorderRef.current = mediaRecorder;

      setIsRecording(true);
      setIsPaused(false);
      setError(null);

      console.log('Audio recording started');
    } catch (err) {
      console.error('Failed to start recording:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to start recording'
      );
      throw err;
    }
  }, [requestPermission, setAudioBlob, setAudioPath]);

  /**
   * Pauses the current recording
   */
  const pauseRecording = useCallback((): void => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      console.log('Audio recording paused');
    }
  }, []);

  /**
   * Resumes a paused recording
   */
  const resumeRecording = useCallback((): void => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      console.log('Audio recording resumed');
    }
  }, []);

  /**
   * Stops the current recording and saves the audio blob
   */
  const stopRecording = useCallback((): void => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      console.log('Stopping audio recording...');
    }
  }, []);

  /**
   * Cancels the current recording without saving
   */
  const cancelRecording = useCallback((): void => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      audioChunksRef.current = [];
      setIsRecording(false);
      setIsPaused(false);
      console.log('Audio recording cancelled');
    }
  }, []);

  /**
   * Cleans up resources and stops the media stream
   */
  const cleanup = useCallback((): void => {
    // Stop recording if active
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    // Stop all tracks in the stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      streamRef.current = null;
    }

    // Reset state
    mediaRecorderRef.current = null;
    audioChunksRef.current = [];
    setIsRecording(false);
    setIsPaused(false);
    setHasPermission(null);

    console.log('Audio recording resources cleaned up');
  }, []);

  /**
   * Gets the current audio stream for visualization purposes
   * 
   * @returns The current MediaStream or null if not available
   */
  const getAudioStream = useCallback((): MediaStream | null => {
    return streamRef.current;
  }, []);

  /**
   * Sets the session directory for saving audio files
   * 
   * @param sessionDir - Path to the session directory
   */
  const setSessionDirectory = useCallback((sessionDir: string): void => {
    sessionDirRef.current = sessionDir;
    console.log('Audio recording session directory set:', sessionDir);
  }, []);

  return {
    // State
    isRecording,
    isPaused,
    hasPermission,
    error,

    // Actions
    requestPermission,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    cancelRecording,
    cleanup,
    getAudioStream,
    setSessionDirectory,
  };
}
