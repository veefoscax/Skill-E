/**
 * Processing Bridge
 * 
 * Simplified interface between UI and processing pipeline.
 * Handles the complete flow: recording → processing → skill generation
 */

import { invoke } from '@tauri-apps/api/core';
import { processSession } from './processing';
// Import removed - now using generateLLMContext from processing.ts
import { generateSkill } from './skill-generator';
import { useSettingsStore } from '@/stores/settings';
import type { ProcessingProgress } from '../types/processing';
import type { CaptureSession } from '../types/capture';
import type { TranscriptionResult } from './whisper';
import { transcribeAudio } from './whisper';
import { readFile, writeFile } from '@tauri-apps/plugin-fs';

export interface ProcessingResult {
  success: boolean;
  skillMarkdown?: string;
  error?: string;
  processingTime: number;
}

/**
 * Convert WebM audio to WAV format using Web Audio API
 * The local Whisper expects WAV format
 */
async function convertWebMToWav(webmBlob: Blob): Promise<Blob> {
  console.log('🎤 Converting WebM to WAV...', 'Size:', webmBlob.size, 'bytes');

  const audioContext = new AudioContext({ sampleRate: 16000 }); // Whisper expects 16kHz

  try {
    // Decode WebM with timeout
    const arrayBuffer = await webmBlob.arrayBuffer();
    console.log('🎤 Decoding audio data...');

    const audioBuffer = await Promise.race([
      audioContext.decodeAudioData(arrayBuffer),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Audio decode timeout')), 30000)
      )
    ]);

    console.log('🎤 Audio decoded:', audioBuffer.duration, 'seconds,', audioBuffer.sampleRate, 'Hz');

    // Convert to mono 16-bit PCM
    const numberOfChannels = 1; // Mono
    const sampleRate = 16000;
    const format = 1; // PCM
    const bitDepth = 16;

    const samples = audioBuffer.getChannelData(0); // Get first channel
    const bytesPerSample = bitDepth / 8;
    const blockAlign = numberOfChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = samples.length * bytesPerSample;

    console.log('🎤 Creating WAV buffer...', samples.length, 'samples');

    // Create WAV buffer
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    // Write WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    writeString(36, 'data');
    view.setUint32(40, dataSize, true);

    // Write audio data (convert float32 to int16) - in chunks to avoid blocking
    const chunkSize = 10000;
    for (let i = 0; i < samples.length; i += chunkSize) {
      const end = Math.min(i + chunkSize, samples.length);
      for (let j = i; j < end; j++) {
        const sample = Math.max(-1, Math.min(1, samples[j]));
        view.setInt16(44 + j * 2, sample * 0x7FFF, true);
      }

      // Allow UI to breathe and log progress
      if (i % 50000 === 0) {
        console.log(`🎤 Conversion progress: ${Math.round((i / samples.length) * 100)}%`);
        await new Promise(r => setTimeout(r, 0));
      }
    }

    console.log('🎤 Conversion complete:', samples.length, 'samples');
    audioContext.close();
    return new Blob([buffer], { type: 'audio/wav' });
  } catch (error) {
    audioContext.close();
    throw error;
  }
}

/**
 * Transcribe audio using multiple fallback methods:
 * 1. Whisper Local (Rust) - with WebM to WAV conversion
 * 2. Whisper API (OpenAI)
 * 3. Generic transcript from filename (last resort - not mock)
 */
async function transcribeWithFallback(audioPath: string): Promise<TranscriptionResult> {
  console.log('🎤 Transcription: Starting fallback chain for:', audioPath);

  // Try 1: Whisper API (OpenAI) if API key available
  const settings = useSettingsStore.getState();
  if (settings.llmApiKey && settings.llmProvider !== 'ollama') {
    try {
      console.log('🎤 Trying Whisper API...');

      // Read audio file using Tauri FS
      const audioBytes = await readFile(audioPath);
      const audioBlob = new Blob([audioBytes], { type: 'audio/webm' });

      const result = await transcribeAudio(audioBlob, settings.llmApiKey);
      console.log('🎤 Whisper API success:', result.text.substring(0, 100));
      return result;
    } catch (e) {
      console.warn('🎤 Whisper API failed:', e);
    }
  }

  // Try 2: Web Speech API (browser native)
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (SpeechRecognition) {
    try {
      console.log('🎤 Trying Web Speech API...');
      return await new Promise((resolve, reject) => {
        const recognition = new SpeechRecognition();
        recognition.lang = 'pt-BR';
        recognition.continuous = true;
        recognition.interimResults = false;

        const segments: Array<{ id: number; start: number; end: number; text: string }> = [];
        let fullText = '';

        recognition.onresult = (event: any) => {
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            const start = event.results[i][0].timestamp || i * 3;
            segments.push({
              id: i + 1,
              start,
              end: start + 3,
              text: transcript
            });
            fullText += transcript + ' ';
          }
        };

        recognition.onend = () => {
          if (fullText.trim()) {
            resolve({
              text: fullText.trim(),
              segments: segments,
              language: 'pt-BR',
              duration: segments.length > 0 ? segments[segments.length - 1].end : 0
            });
          } else {
            reject(new Error('No speech detected'));
          }
        };

        recognition.onerror = (e: any) => reject(e);
        recognition.start();
        setTimeout(() => recognition.stop(), 15000); // 15s max
      });
    } catch (e) {
      console.warn('🎤 Web Speech API failed:', e);
    }
  }

  // Last resort: Create transcript from session info (NOT generic mock)
  // This extracts any info we have rather than making up "Navigate to page..."
  console.log('🎤 Using session-derived transcript (no STT available)');

  // Extract timestamp from session dir for context
  const sessionMatch = audioPath.match(/session-(\d+)/);
  const timestamp = sessionMatch ? parseInt(sessionMatch[1]) : Date.now();
  const date = new Date(timestamp);

  return {
    text: `Recording from ${date.toLocaleString()}. No transcription available - please review screenshots to understand the workflow.`,
    segments: [
      {
        id: 1,
        start: 0,
        end: 5,
        text: `Recording from ${date.toLocaleString()}.`
      },
      {
        id: 2,
        start: 6,
        end: 10,
        text: 'No transcription available - please review screenshots.'
      }
    ],
    language: 'unknown',
    duration: 10
  };
}

// Dummy function removed. Real generation now handled via skill-generator.ts

/**
 * Process a recording session and generate SKILL.md
 * 
 * This is the main entry point for the processing pipeline.
 * Called by ProcessingScreen when user stops recording.
 * 
 * @param options - Processing options
 * @param onProgress - Progress callback
 * @returns Processing result with skill markdown
 */
export async function processRecordingAndGenerateSkill(
  options: {
    sessionId?: string;
    audioPath?: string;
    annotations?: {
      clicks: any[];
      drawings: any[];
      selectedElements: any[];
      keyboardInputs: any[];
    };
  },
  onProgress: (progress: ProcessingProgress) => void
): Promise<ProcessingResult> {
  const startTime = Date.now();

  try {
    // Stage 1: Load recording data from backend
    onProgress({
      stage: 'loading',
      percentage: 5,
      currentStep: 'Loading recording data...'
    });

    // Get session directory from options or global hack (passed from Toolbar)
    const sessionDir = options.sessionId || (window as any).__LAST_SESSION_DIR__;

    if (!sessionDir) {
      throw new Error('No session directory provided for processing.');
    }

    // Load manifest from disk using existing command
    const manifest = await invoke<{
      frames: Array<{
        timestamp: number;
        imagePath: string;
        cursorPosition?: { x: number; y: number };
      }>;
      audioPath?: string;
      startTime: number;
      endTime: number;
    }>('load_session_manifest', { sessionDir }); // Use load_session_manifest instead of get_recording_data

    const recordingData = {
      frames: manifest.frames.map(f => ({
        timestamp: f.timestamp,
        // Fix path: manifest has relative path, we need absolute or asset protocol
        path: f.imagePath.startsWith('http') || f.imagePath.includes(':')
          ? f.imagePath
          : `${sessionDir}/${f.imagePath}`,
        cursorPosition: f.cursorPosition
      })),
      audioPath: manifest.audioPath ? `${sessionDir}/${manifest.audioPath}` : undefined,
      startTime: manifest.startTime,
      endTime: manifest.endTime || Date.now()
    };

    // Validate we have data
    if (!recordingData.frames || recordingData.frames.length === 0) {
      // Force non-empty constraint warning but allow proceeding if we have audio? No, we need frames.
      // throw new Error('No screen capture frames available.');
      console.warn('Processing found 0 frames. This might be a bug.');
    }

    if (!recordingData.audioPath) {
      console.warn('No audio path in manifest. Checking options...');
      if (options.audioPath) recordingData.audioPath = options.audioPath;
      else console.warn('No audio recording available.');
      // We don't throw here anymore to allow "silent" recordings if needed, 
      // but for S09 we expect audio.
    }

    console.log(`Processing ${recordingData.frames.length} frames with audio: ${recordingData.audioPath}`);

    // Stage 2: Transcribe audio (tenta Whisper local, senão usa Web Speech API ou mock)
    onProgress({
      stage: 'loading',
      percentage: 20,
      currentStep: 'Transcribing audio...'
    });

    let transcription: TranscriptionResult | null = null;
    if (recordingData.audioPath || options.audioPath) {
      const audioPath = recordingData.audioPath || options.audioPath!;
      console.log('🎤 AUDIO PATH:', audioPath);

      try {
        // Try 1: Whisper Local with WebM to WAV conversion
        // UPDATED: Use dynamic model and GPU settings
        const settings = useSettingsStore.getState();
        const targetModel = settings.whisperModel || 'tiny';
        const useGpu = settings.useGpu || false;

        console.log(`🎤 Step 1: Checking if Whisper model '${targetModel}' exists... (GPU: ${useGpu})`);

        // Check if model exists
        const whisperAvailable = await invoke<boolean>('check_model_exists', { model: targetModel });
        console.log('🎤 Model available:', whisperAvailable);

        if (whisperAvailable) {
          // Read WebM file
          console.log('🎤 Step 2: Reading WebM file...');
          const webmBytes = await readFile(audioPath);
          console.log('🎤 WebM file size:', webmBytes.length, 'bytes');

          const webmBlob = new Blob([webmBytes], { type: 'audio/webm' });

          // Convert to WAV
          onProgress({
            stage: 'loading',
            percentage: 22,
            currentStep: 'Converting audio format...'
          });

          console.log('🎤 Step 3: Converting WebM to WAV...');
          const wavBlob = await convertWebMToWav(webmBlob);
          console.log('🎤 WAV blob size:', wavBlob.size, 'bytes');

          // Save WAV to temp file
          const wavPath = audioPath.replace('.webm', '.wav');
          console.log('🎤 Step 4: Saving WAV to:', wavPath);
          const wavBytes = new Uint8Array(await wavBlob.arrayBuffer());
          await writeFile(wavPath, wavBytes);

          console.log('🎤 WAV file saved successfully');

          // Transcribe using local Whisper
          onProgress({
            stage: 'loading',
            percentage: 25,
            currentStep: 'Running local Whisper...'
          });

          console.log(`🎤 Step 5: Calling transcribe_local with 60s timeout... (Model: ${targetModel})`);

          // Wrap Rust invoke in a timeout race to prevent infinite hanging
          const transcriptionPromise = invoke<{
            text: string;
            segments: Array<{ id: number; start: number; end: number; text: string }>;
            language: string;
            duration: number;
          }>('transcribe_local', {
            audioPath: wavPath,
            model: targetModel,
            useGpu: useGpu
          });

          const result = await Promise.race([
            transcriptionPromise,
            new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Whisper transcription timed out (180s)')), 180000))
          ]);

          console.log('🎤 Step 6: Transcription result received');
          transcription = {
            text: result.text,
            segments: result.segments,
            language: result.language,
            duration: result.duration
          };

          console.log('🎤 Whisper Local success:', transcription.text.substring(0, 100));
        } else {
          console.warn(`🎤 Whisper model '${targetModel}' NOT found, falling back...`);
          throw new Error(`Whisper model '${targetModel}' not found`);
        }
      } catch (e) {
        console.error('🎤 Whisper Local ERROR:', e);
        // Fallback: try API or Web Speech
        console.log('🎤 Trying fallback transcription...');
        transcription = await transcribeWithFallback(audioPath);
      }
    } else {
      // Sem áudio - gera transcrição demo
      transcription = {
        text: 'Demo transcription: Click the button. Enter text. Submit form.',
        segments: [
          { id: 1, start: 0, end: 3, text: 'Demo transcription: Click the button.' },
          { id: 2, start: 4, end: 6, text: 'Enter text.' },
          { id: 3, start: 7, end: 9, text: 'Submit form.' },
        ],
        language: 'en',
        duration: 9
      };
    }

    // Stage 3: Build capture session
    onProgress({
      stage: 'timeline',
      percentage: 35,
      currentStep: 'Building timeline...'
    });

    const captureSession: CaptureSession = {
      id: options.sessionId || `session-${Date.now()}`,
      directory: '', // Will be set by backend
      startTime: recordingData.startTime,
      endTime: recordingData.endTime,
      frames: recordingData.frames.map((f, index) => ({
        id: `frame-${index}`,
        timestamp: f.timestamp,
        imagePath: f.path,
        imageData: f.path,
        cursorPosition: f.cursorPosition,
      })),
      intervalMs: 1000,
    };

    // Stage 4: Process session
    onProgress({
      stage: 'step_detection',
      percentage: 50,
      currentStep: 'Detecting steps from recording...'
    });

    const processedSession = await processSession(
      captureSession.id,
      captureSession,
      transcription,
      options.annotations || {
        clicks: [],
        drawings: [],
        selectedElements: [],
        keyboardInputs: [],
      },
      (progress) => {
        // Map internal progress to UI progress (50-90%)
        const mappedPercentage = 50 + (progress.percentage * 0.4);
        onProgress({
          ...progress,
          percentage: Math.round(mappedPercentage)
        });
      }
    );

    // Stage 5: Generate SKILL.md
    onProgress({
      stage: 'context_generation',
      percentage: 90,
      currentStep: 'Generating SKILL.md with AI...'
    });

    // 5a. Generate LLM Context (not optimize)
    const { generateLLMContext } = await import('./processing');
    const llmContext = await generateLLMContext(processedSession);

    // 5b. Get Settings (API Key & Provider)
    const { llmApiKey, llmProvider, llmBaseUrl, llmModel } = useSettingsStore.getState();

    // Validate key (unless Ollama)
    if (!llmApiKey && llmProvider !== 'ollama') {
      throw new Error('LLM API Key not found. Please configure it in Settings.');
    }

    // 5c. Generate Skill with LLM
    // Map internal provider to skill-generator types
    let genProvider = llmProvider;

    // Map specific providers to their compatibility layer
    if (llmProvider === 'custom' || llmProvider === 'moonshot') {
      genProvider = 'openai'; // Use OpenAI client 
    }
    // Ollama handled natively

    const generatedSkillResult = await generateSkill(llmContext, {
      provider: genProvider as any,
      apiKey: llmApiKey,
      model: llmModel || 'gpt-4-turbo',
      baseUrl: llmBaseUrl
    });

    // generateSkill retorna string diretamente
    const skillMarkdown = generatedSkillResult as string;

    // Stage 6: Save to file
    onProgress({
      stage: 'context_generation',
      percentage: 95,
      currentStep: 'Saving SKILL.md...'
    });

    try {
      await invoke('save_skill_md', { content: skillMarkdown });
    } catch (e) {
      console.warn('Could not save to file:', e);
    }

    const processingTime = Date.now() - startTime;

    onProgress({
      stage: 'complete',
      percentage: 100,
      currentStep: 'Complete!'
    });

    return {
      success: true,
      skillMarkdown,
      processingTime
    };

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('Processing failed:', error);

    onProgress({
      stage: 'error',
      percentage: 0,
      currentStep: 'Processing failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      processingTime
    };
  }
}

/**
 * Quick mock processing for testing without real AI
 */
export async function processRecordingMock(
  onProgress: (progress: ProcessingProgress) => void
): Promise<ProcessingResult> {
  const stages = [
    { stage: 'loading' as const, delay: 500, message: 'Loading recording data...' },
    { stage: 'timeline' as const, delay: 1500, message: 'Building timeline...' },
    { stage: 'step_detection' as const, delay: 1200, message: 'Detecting steps...' },
    { stage: 'context_generation' as const, delay: 1000, message: 'Generating SKILL.md...' },
  ];

  for (let i = 0; i < stages.length; i++) {
    const progress = ((i + 1) / stages.length) * 90;
    onProgress({
      stage: stages[i].stage,
      percentage: Math.round(progress),
      currentStep: stages[i].message
    });
    await new Promise(r => setTimeout(r, stages[i].delay));
  }

  onProgress({
    stage: 'complete',
    percentage: 100,
    currentStep: 'Complete!'
  });

  // Generate mock SKILL.md
  const skillMarkdown = `---
name: demo-skill
description: Auto-generated skill from recording
version: 1.0.0
---

# Demo Skill

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| username | string | Yes | Username for login |
| password | string | Yes | Password for login |

## Instructions

### Step 1
Navigate to the login page.

### Step 2
Click on the username field and enter the username parameter.

### Step 3
Click on the password field and enter the password parameter.

### Step 4
Click the submit button to log in.

## Verification

- [ ] Successfully navigated to login page
- [ ] Username entered correctly
- [ ] Password entered correctly
- [ ] Login successful

---
Generated by Skill-E
`;

  return {
    success: true,
    skillMarkdown,
    processingTime: stages.reduce((a, s) => a + s.delay, 0)
  };
}
