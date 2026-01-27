# S05: Processing Pipeline - Implementation Tasks

> **Reference Workflow**: See `.kiro/steering/workflow.md` for execution guidelines.

## Overview

Combines screen captures, transcription, and annotations into structured context for LLM skill generation.

---

## Phase 1: Types

- [x] 1. Type Definitions
  - Create src/types/processing.ts
  - Define ProcessedStep interface
  - Define ProcessedSession interface
  - Define LLMContext interface
  - Define TimelineEvent interface
  - _Requirements: FR-5.1_

## Phase 2: Timeline Building

- [x] 2. Session Loading
  - Create src/lib/processing.ts
  - Implement loadSession() to gather all data
  - Load frames from capture session
  - Load transcription with timestamps
  - Load annotations from store
  - _Requirements: FR-5.1_

- [x] 3. Timeline Merging
  - Implement buildTimeline() function
  - Merge all events by timestamp
  - Sort chronologically
  - Create unified timeline array
  - _Requirements: FR-5.2_

## Phase 3: Step Detection

- [x] 4. Step Detection Algorithm
  - Implement detectSteps() function
  - Detect voice pauses > 2 seconds
  - Detect window focus changes
  - Use annotations as step boundaries
  - Group consecutive frames into steps
  - _Requirements: FR-5.3_

## Phase 4: Context Generation

- [x] 5. LLM Context Builder
  - Implement generateLLMContext() function
  - Select representative screenshot per step
  - Extract transcript segment per step
  - Include annotations per step
  - Format as structured JSON
  - _Requirements: FR-5.4_

## Phase 5: Progress UI

- [x] 6. Processing Progress
  - Create processing progress component
  - Show percentage complete
  - Show current step label
  - Estimate time remaining
  - _Requirements: FR-5.5, NFR-5.2_

## Phase 6: Testing

- [x] 7. Processing Testing
  - Test timeline building with sample data
  - Test step detection accuracy
  - Test context generation output format
  - Measure processing time < 30 seconds
  - _Requirements: All ACs_

- [x] 8. Checkpoint - Verify Phase Complete
  - Ensure all tests pass, ask the user if questions arise.

---

## Success Criteria

- Sessions process in < 30 seconds (for 2-min recording)
- Steps detected logically based on pauses/changes
- Context includes all relevant data
- Progress displayed during processing

## Notes

- Don't load all images to RAM at once
- Use worker thread for heavy processing
- Consider chunked processing for long sessions
- Cache processed results
