import { useCallback, useRef, useState } from 'react';
import { useRecordingStore } from '../stores/recording';
import { invoke } from '@tauri-apps/api/core';

/**
 * Hook for managing audio recording during demonstration sessions
 * 
 * Provides functions to start/stop/pause audio recording from the microphone,
 * with support for saving audio chunks to a blob.
 * 
 * Requirements:
 * - FR-3.1: Record audio from default microphone
 * - FR-3.3: Support pause/resume during recording
 * - NFR-3.1: Audio quality: 16kHz mono (Whisper-compatible)
 */
export function useAudioRecording() {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const sessionDirRef = useRef<string | null>(null);
  const setAudioBlob = useRecordingStore((state) => state.setAudioBlob);
  const setAudioPath = useRecordingStore((state) => state.setAudioPath);

  /**
   * Requests microphone permission and initializes the media stream
   * 
   * @returns Promise that resolves to true if permission granted, false otherwise
   */
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      // Request microphone access with Whisper-compatible settings
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
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
      console.log('Microphone permission granted');
      return true;
    } catch (err) {
      console.error('Failed to get microphone permission:', err);
      setHasPermission(false);
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to access microphone. Please check your permissions.'
      );
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
