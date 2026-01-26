# S03: Audio Recording - Requirements

## Feature Description
Record microphone audio during demonstrations, with visual feedback and Whisper API transcription.

## User Stories

### US1: Voice Narration
**As a** user
**I want** to narrate what I'm doing while recording
**So that** the skill has context about my actions

### US2: Transcription
**As a** user
**I want** my voice automatically transcribed
**So that** the skill includes my explanations

## Functional Requirements

- **FR-3.1**: Record audio from default microphone
- **FR-3.2**: Show visual feedback (waveform/level meter) during recording
- **FR-3.3**: Support pause/resume during recording
- **FR-3.4**: Send audio to Whisper API for transcription
- **FR-3.5**: Sync transcription segments with capture timestamps

## Non-Functional Requirements

- **NFR-3.1**: Audio quality: 16kHz mono (Whisper-compatible)
- **NFR-3.2**: Max recording length: 30 minutes
- **NFR-3.3**: Transcription accuracy: Whisper default

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

### AC4: Transcription
- [ ] Audio sent to Whisper API after recording
- [ ] Transcription includes timestamps
- [ ] Segments aligned with recording time
- _Requirements: FR-3.4, FR-3.5_

## Dependencies
- S01: App Core
- External: OpenAI Whisper API

## Files to Create
- src/hooks/useAudioRecording.ts
- src/lib/whisper.ts
- src/components/AudioLevelMeter.tsx
