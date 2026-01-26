# S03: Audio Recording - Implementation Tasks

> **Reference Workflow**: See `.kiro/steering/workflow.md` for execution guidelines.

## Overview

Implements microphone audio recording with visual feedback and Whisper API transcription.

---

## Phase 1: Audio Capture

- [-] 1. Audio Recording Hook
  - Create src/hooks/useAudioRecording.ts
  - Request microphone permission via getUserMedia
  - Setup MediaRecorder with audio/webm format
  - Implement start/stop/pause methods
  - Save audio chunks to blob
  - _Requirements: FR-3.1, FR-3.3_

- [~] 2. Audio Level Meter
  - Create src/components/AudioLevelMeter.tsx
  - Use Web Audio API AnalyserNode
  - Render real-time level visualization
  - Show microphone active indicator
  - _Requirements: FR-3.2_

## Phase 2: File Storage

- [~] 3. Audio File Handling
  - Convert blob to file on recording stop
  - Save audio file via Tauri FS API
  - Store path in session data
  - Ensure 16kHz mono format for Whisper
  - _Requirements: NFR-3.1_

## Phase 3: Whisper Integration

- [~] 4. Whisper Client
  - Create src/lib/whisper.ts
  - Implement transcribeAudio() function
  - Use verbose_json response format
  - Extract segment timestamps
  - Handle API errors gracefully
  - _Requirements: FR-3.4, FR-3.5_

- [~] 5. Settings Integration
  - Add Whisper API key input to settings
  - Validate API key on save
  - Store key securely in settings store
  - _Requirements: FR-3.4_

## Phase 4: Testing

- [~] 6. Audio Testing
  - Test microphone recording works
  - Test pause/resume functionality
  - Test audio level meter accuracy
  - Test Whisper transcription with sample audio
  - Verify timestamp alignment with recording
  - _Requirements: All ACs_

- [~] 7. Checkpoint - Verify Phase Complete
  - Ensure all tests pass, ask the user if questions arise.

---

## Success Criteria

- Audio records clearly from microphone
- Level meter responds to voice input
- Pause/resume works correctly
- Transcription returns with accurate timestamps
- Max recording length: 30 minutes

## Notes

- Request microphone permission early (on app start or first record)
- Use 16kHz mono for Whisper compatibility
- Consider chunked transcription for long recordings
- Handle case where user denies microphone permission
