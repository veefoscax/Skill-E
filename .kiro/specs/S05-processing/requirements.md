# S05: Processing Pipeline - Requirements

## Feature Description
Advanced processing pipeline that combines screen captures, transcription, annotations, and OCR to create structured context for intelligent skill generation. Includes semantic analysis for step detection and context extraction.

## User Stories

### US1: Automatic Processing
**As a** user
**I want** my recording automatically processed into structured data
**So that** I don't have to manually organize the data

### US2: Step Detection
**As a** user
**I want** the system to detect logical steps in my demo
**So that** the skill has clear, organized instructions

### US3: Context Extraction
**As a** user
**I want** the system to understand context from my narration
**So that** explanations and notes are captured in the skill

## Functional Requirements

- **FR-5.1**: Combine screen captures, transcription, and annotations
- **FR-5.2**: Correlate voice segments with visual frames by timestamp
- **FR-5.3**: Detect action sequences (logical steps)
- **FR-5.4**: Generate structured context for LLM
- **FR-5.5**: Show progress during processing
- **FR-5.6**: Extract text from screenshots via OCR
- **FR-5.7**: Detect active window and application for each step
- **FR-5.8**: Classify speech segments (instruction, context, variable hint)
- **FR-5.9**: Detect conditional statements in narration
- **FR-5.10**: Generate timeline with all events correlated

## Non-Functional Requirements

- **NFR-5.1**: Processing time < 30 seconds for 2-minute recording
- **NFR-5.2**: Show progress percentage during processing
- **NFR-5.3**: Memory-efficient (don't load all images at once)

## Acceptance Criteria

### AC1: Data Aggregation
- [ ] Loads all frames from session
- [ ] Loads transcription with timestamps
- [ ] Loads all annotations
- [ ] Extracts OCR text from each screenshot
- _Requirements: FR-5.1, FR-5.6_

### AC2: Timeline Correlation
- [ ] Matches transcript segments to frames
- [ ] Matches annotations to frames
- [ ] Matches mouse/keyboard events to frames
- [ ] Creates unified timeline
- _Requirements: FR-5.2, FR-5.10_

### AC3: Step Detection
- [ ] Groups frames into logical steps
- [ ] Uses voice pauses (> 2s) as step boundaries
- [ ] Uses window focus changes as step boundaries
- [ ] Each step has representative screenshot + description
- _Requirements: FR-5.3_

### AC4: Speech Classification
- [ ] Classifies speech as instruction vs context
- [ ] Detects variable mentions
- [ ] Detects conditional patterns
- _Requirements: FR-5.8, FR-5.9_

### AC5: LLM Context
- [ ] Generates structured JSON for LLM
- [ ] Includes step summaries
- [ ] Includes full transcript
- [ ] Includes annotation notes
- [ ] Includes OCR text for context
- _Requirements: FR-5.4_

## Dependencies
- S02: Screen Capture
- S03: Audio Recording
- S04: Overlay UI

## Files to Create
- src/lib/processing.ts
- src/lib/ocr.ts
- src/lib/speech-classifier.ts
- src/lib/step-detector.ts
- src/types/processing.ts
- src/components/ProcessingProgress.tsx
