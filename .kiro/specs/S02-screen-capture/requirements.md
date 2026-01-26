# S02: Screen Capture - Requirements

## Feature Description
Capture screen content during recording sessions, with support for screenshots, window tracking, and cursor position logging.

## User Stories

### US1: Screen Recording
**As a** user
**I want** to capture my screen while demonstrating a task
**So that** the AI can see what I'm doing

### US2: Active Window Tracking
**As a** user
**I want** the app to know which window I'm working in
**So that** the skill can reference specific applications

## Functional Requirements

- **FR-2.1**: Capture entire screen or specific window
- **FR-2.2**: Take periodic screenshots during recording (1/sec)
- **FR-2.3**: Detect active window and track focus changes
- **FR-2.4**: Capture mouse cursor position for each frame
- **FR-2.5**: Store captures with timestamps for timeline sync

## Non-Functional Requirements

- **NFR-2.1**: Capture latency < 100ms
- **NFR-2.2**: Storage format: WebP for compression
- **NFR-2.3**: Memory-efficient streaming (don't load all to RAM)

## Acceptance Criteria

### AC1: Screenshot Capture
- [ ] Can capture full screen
- [ ] Can capture specific monitor
- [ ] Screenshots saved as WebP
- [ ] Timestamps recorded for each frame
- _Requirements: FR-2.1, FR-2.2_

### AC2: Window Tracking
- [ ] Active window title captured
- [ ] Window focus changes detected
- [ ] Window bounds recorded
- _Requirements: FR-2.3_

### AC3: Cursor Tracking
- [ ] Cursor X/Y position captured each frame
- [ ] Position relative to screen origin
- _Requirements: FR-2.4_

### AC4: Storage
- [ ] Frames stored in temp directory
- [ ] Manifest file tracks all frames
- [ ] Cleanup on session end
- _Requirements: FR-2.5_

## Dependencies
- S01: App Core

## Files to Create
- src-tauri/src/commands/capture.rs
- src/lib/capture.ts
- src/types/capture.ts
