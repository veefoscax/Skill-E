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

## Phase 4: Local Whisper

- [x] 8. Local Whisper Backend ✅ COMPLETE
  - Add whisper-rs crate to Cargo.toml (optional feature) ✅
  - Add hound crate for WAV reading ✅
  - Add dirs crate for app data directory ✅
  - Create src-tauri/src/commands/whisper.rs ✅
  - Implement WhisperModel enum with download URLs ✅
  - Implement check_model_exists, get_model_info ✅
  - Implement get_available_models, get_models_directory ✅
  - Implement transcribe_local (with #[cfg(feature)]) ✅
  - Register commands in lib.rs ✅
  - _Requirements: FR-3.6, NFR-3.4_

- [x] 9. Local Whisper Frontend ✅ COMPLETE
  - Create src/lib/whisper-local.ts ✅
  - TypeScript types matching Rust structs ✅
  - checkModelExists, getModelInfo, getAvailableModels ✅
  - transcribeLocal, getModelDownloadUrl ✅
  - formatTranscription helper ✅
  - isLocalWhisperAvailable check ✅
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
  - Rust backend compiles ✅
  - TypeScript frontend compiles ✅

---

## Build Notes

**Feature Flags (Cargo.toml)**:
```toml
[features]
default = []
local-whisper = ["whisper-rs"]  # Enable local transcription
cuda = ["whisper-rs", "whisper-rs/cuda"]  # Enable GPU acceleration
```

**To compile with local Whisper**:
```bash
cargo build --features local-whisper
# With CUDA GPU:
cargo build --features cuda
```

**Model Storage Location**:
- Windows: `%LOCALAPPDATA%\skill-e\whisper-models\`
- macOS: `~/Library/Application Support/skill-e/whisper-models/`
- Linux: `~/.local/share/skill-e/whisper-models/`

---

## Success Criteria

- [x] Audio records clearly from microphone
- [x] Level meter responds to voice input
- [x] Pause/resume works correctly
- [x] Settings UI for transcription configuration
- [x] Local Whisper backend implemented
- [x] Local Whisper frontend types ready
- [ ] Model download UI (future enhancement)
- [ ] Max recording length: 30 minutes

## Notes

- Request microphone permission early (on app start or first record)
- Use 16kHz mono for Whisper compatibility
- Windows WebView2 caches denied permissions - use MicrophoneDiagnostic to reset
- All Whisper models are multilingual (Portuguese, English, etc.)
- GPU users: Turbo model recommended (~800MB)
- CPU-only users: Tiny model recommended (~75MB)
- whisper-rs is optional - app works without it (API mode only)

## Completed By

Tasks 1-9 implemented by Kiro (AI Agent) - Jan 27, 2025
