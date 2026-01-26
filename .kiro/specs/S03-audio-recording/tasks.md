# S03: Audio Recording - Implementation Tasks

> **Reference Workflow**: See `.kiro/steering/workflow.md` for execution guidelines.

## Overview

Implements microphone audio recording with visual feedback and Whisper API transcription.

---

## Phase 1: Audio Capture

- [ ] 1. Audio Recording Hook ⚠️ CODE COMPLETE, NOT WORKING
  - Create src/hooks/useAudioRecording.ts ✅
  - Request microphone permission via getUserMedia ❌ NOT WORKING
  - Setup MediaRecorder with audio/webm format ✅
  - Implement start/stop/pause methods ✅
  - Save audio chunks to blob ❌ NOT TESTED
  - _Requirements: FR-3.1, FR-3.3_
  - **BLOCKER**: Microphone permission prompt not appearing

- [ ] 2. Audio Level Meter ⚠️ CODE COMPLETE, NOT TESTED
  - Create src/components/AudioLevelMeter.tsx ✅
  - Use Web Audio API AnalyserNode ✅
  - Render real-time level visualization ❌ NOT TESTED
  - Show microphone active indicator ❌ NOT TESTED
  - _Requirements: FR-3.2_
  - **BLOCKER**: Depends on Task 1 working

## Phase 2: File Storage

- [ ] 3. Audio File Handling ⚠️ CODE COMPLETE, NOT TESTED
  - Convert blob to file on recording stop ✅
  - Save audio file via Tauri FS API ✅
  - Store path in session data ✅
  - Ensure 16kHz mono format for Whisper ✅
  - _Requirements: NFR-3.1_
  - **BLOCKER**: Depends on Task 1 working

## Phase 3: Whisper Integration

- [ ] 4. Whisper Client ⚠️ CODE COMPLETE, NOT TESTED
  - Create src/lib/whisper.ts ✅
  - Implement transcribeAudio() function ✅
  - Use verbose_json response format ✅
  - Extract segment timestamps ✅
  - Handle API errors gracefully ✅
  - _Requirements: FR-3.4, FR-3.5_
  - **BLOCKER**: Depends on Task 1-3 working

- [ ] 5. Settings Integration ⚠️ CODE COMPLETE, NOT TESTED
  - Add Whisper API key input to settings ✅
  - Validate API key on save ✅
  - Store key securely in settings store ✅
  - _Requirements: FR-3.4_
  - **BLOCKER**: Needs manual testing

## Phase 4: Testing

- [ ] 6. Audio Testing ⚠️ NOT STARTED
  - Test microphone recording works ❌
  - Test pause/resume functionality ❌
  - Test audio level meter accuracy ❌
  - Test Whisper transcription with sample audio ❌
  - Verify timestamp alignment with recording ❌
  - _Requirements: All ACs_
  - **BLOCKER**: All previous tasks must work first

- [ ] 7. Checkpoint - Verify Phase Complete ❌ FAILED
  - Ensure all tests pass, ask the user if questions arise.
  - **STATUS**: User reports feature does not work
  - **ACTION REQUIRED**: Debug microphone permission issue

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
