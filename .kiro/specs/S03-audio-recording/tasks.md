# S03: Audio Recording - Implementation Tasks

> **Reference Workflow**: See `.kiro/steering/workflow.md` for execution guidelines.

## Overview

Implements microphone audio recording with visual feedback and Whisper transcription (API or Local).

---

## Phase 1: Audio Capture

- [x] 1. Audio Recording Hook ✅ COMPLETE
  - Create src/hooks/useAudioRecording.ts ✅
  - Request microphone permission via getUserMedia ✅
  - Setup MediaRecorder with audio/webm format ✅
  - Implement start/stop/pause methods ✅
  - Save audio chunks to blob ✅
  - _Requirements: FR-3.1, FR-3.3_
  - **FIX**: Added MicrophoneDiagnostic.tsx for troubleshooting Windows WebView2 permissions

- [x] 2. Audio Level Meter ✅ COMPLETE
  - Create src/components/AudioLevelMeter.tsx ✅
  - Use Web Audio API AnalyserNode ✅
  - Render real-time level visualization ✅
  - Show microphone active indicator ✅
  - _Requirements: FR-3.2_

## Phase 2: File Storage

- [x] 3. Audio File Handling ✅ COMPLETE
  - Convert blob to file on recording stop ✅
  - Save audio file via Tauri FS API ✅
  - Store path in session data ✅
  - Ensure 16kHz mono format for Whisper ✅
  - _Requirements: NFR-3.1_

## Phase 3: Whisper Integration

- [x] 4. Whisper Client (API) ✅ COMPLETE
  - Create src/lib/whisper.ts ✅
  - Implement transcribeAudio() function ✅
  - Use verbose_json response format ✅
  - Extract segment timestamps ✅
  - Handle API errors gracefully ✅
  - _Requirements: FR-3.4, FR-3.5_

- [x] 5. Settings Integration ✅ COMPLETE
  - Add Whisper API key input to settings ✅
  - Validate API key on save ✅
  - Store key securely in settings store ✅
  - Add transcription mode selector (API/Local) ✅
  - Add GPU toggle for local transcription ✅
  - Add Whisper model selector (tiny→turbo) ✅
  - Show multilingual support info ✅
  - _Requirements: FR-3.4, FR-3.6, FR-3.7_

## Phase 4: Local Whisper (NEW)

- [ ] 8. Local Whisper Integration
  - Add whisper-rs crate to Cargo.toml
  - Create src-tauri/src/commands/whisper.rs
  - Implement transcribe_local() Tauri command
  - Download model on first use
  - Support GPU acceleration via CUDA/Metal
  - Return same segment format as API
  - _Requirements: FR-3.6, NFR-3.4_

- [ ] 9. Model Management
  - Check if model exists locally
  - Download model from Hugging Face
  - Show download progress in UI
  - Store models in app data directory
  - _Requirements: FR-3.6_

## Phase 5: Testing

- [x] 6. Audio Testing ✅ COMPLETE
  - Create AudioTestSuite.tsx ✅
  - Create MicrophoneDiagnostic.tsx ✅
  - Test microphone recording works ✅
  - Test pause/resume functionality ✅
  - Test audio level meter accuracy ✅
  - _Requirements: All ACs_

- [x] 7. Checkpoint - Verify Phase Complete ✅ COMPLETE
  - Settings UI fully functional ✅
  - Transcription mode selector working ✅
  - API key validation working ✅
  - Local model selection UI ready ✅

---

## Success Criteria

- [x] Audio records clearly from microphone
- [x] Level meter responds to voice input
- [x] Pause/resume works correctly
- [x] Settings UI for transcription configuration
- [ ] Local transcription works offline (Phase 4)
- [ ] Max recording length: 30 minutes

## Notes

- Request microphone permission early (on app start or first record)
- Use 16kHz mono for Whisper compatibility
- Windows WebView2 caches denied permissions - use MicrophoneDiagnostic to reset
- All Whisper models are multilingual (Portuguese, English, etc.)
- GPU users: Turbo model recommended
- CPU-only users: Tiny model recommended

## Completed By

Tasks 1-7 implemented by Kiro (AI Agent) - Jan 27, 2025
Tasks 8-9 pending for local Whisper support
