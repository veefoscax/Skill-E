# S03: Audio Recording - Requirements

## Feature Description
Record microphone audio during demonstrations, with visual feedback and Whisper transcription (API or local).

## User Stories

### US1: Voice Narration
**As a** user
**I want** to narrate what I'm doing while recording
**So that** the skill has context about my actions

### US2: Transcription
**As a** user
**I want** my voice automatically transcribed
**So that** the skill includes my explanations

### US3: Local Transcription (Privacy)
**As a** user
**I want** the option to transcribe locally without sending audio to cloud
**So that** my recordings stay private on my device

## Functional Requirements

- **FR-3.1**: Record audio from default microphone
- **FR-3.2**: Show visual feedback (waveform/level meter) during recording
- **FR-3.3**: Support pause/resume during recording
- **FR-3.4**: Send audio to Whisper API for transcription (cloud option)
- **FR-3.5**: Sync transcription segments with capture timestamps
- **FR-3.6**: Support local Whisper transcription via whisper-rs (Rust binding)
- **FR-3.7**: Allow user to choose between cloud and local transcription

## Non-Functional Requirements

- **NFR-3.1**: Audio quality: 16kHz mono (Whisper-compatible)
- **NFR-3.2**: Max recording length: 30 minutes
- **NFR-3.3**: Transcription accuracy: Whisper default
- **NFR-3.4**: Local transcription should work offline

## Acceptance Criteria

### AC1: Audio Capture
- [ ] Records from system default microphone
- [ ] Audio saved as WAV or WebM
- [ ] Sample rate compatible with Whisper (16kHz)
- _Requirements: FR-3.1, NFR-3.1_

### AC2: Visual Feedback
- [ ] Shows audio level meter during recording
- [ ] Indicates when mic is active
- _Requirements: FR-3.2_

### AC3: Pause/Resume
- [ ] Pause button stops recording without ending session
- [ ] Resume continues from same point
- [ ] Multiple pause/resume cycles work
- _Requirements: FR-3.3_

### AC4: Transcription (Cloud)
- [ ] Audio sent to Whisper API after recording
- [ ] Transcription includes timestamps
- [ ] Segments aligned with recording time
- _Requirements: FR-3.4, FR-3.5_

### AC5: Transcription (Local - NEW)
- [ ] Uses whisper-rs crate for local transcription
- [ ] Downloads model on first use
- [ ] Works without internet connection
- [ ] Returns same segment format as cloud
- _Requirements: FR-3.6, NFR-3.4_

## Tauri/WebView2 Notes

### Microphone Permission on Windows
The `navigator.mediaDevices.getUserMedia()` API works in Tauri's WebView2, but:

1. **Permission Caching**: If denied once, WebView2 caches the decision
2. **Reset Permissions**: Delete `%LOCALAPPDATA%\<app-id>\EBWebView\Default\Preferences`
3. **Windows Privacy Settings**: Check Settings → Privacy → Microphone
4. **Diagnostic Tool**: Use `MicrophoneDiagnostic.tsx` component

## Dependencies
- S01: App Core
- External: OpenAI Whisper API (cloud)
- Rust: whisper-rs crate (local)

## Files to Create
- src/hooks/useAudioRecording.ts
- src/lib/whisper.ts (cloud API)
- src/lib/whisper-local.ts (local with Tauri command)
- src/components/AudioLevelMeter.tsx
- src/components/MicrophoneDiagnostic.tsx
- src-tauri/src/commands/whisper.rs (local transcription)
