# S02: Screen Capture - Implementation Tasks

> **Reference Workflow**: See `.kiro/steering/workflow.md` for execution guidelines.

## Overview

Implements screen capture functionality with periodic screenshots, window tracking, and cursor position logging.

---

## Phase 1: Plugin Setup

- [x] 1. Install Screenshot Plugin
  - Add tauri-plugin-screenshots to Cargo.toml
  - Register plugin in main.rs
  - Add plugin permissions to capabilities
  - Verify plugin loads correctly
  - _Requirements: FR-2.1_

## Phase 2: Rust Commands

- [-] 2. Create Capture Commands
  - Create src-tauri/src/commands/capture.rs
  - Implement capture_screen command
  - Save screenshot as WebP format
  - Return path and timestamp
  - _Requirements: FR-2.1, NFR-2.2_

- [~] 3. Window Tracking
  - Implement get_active_window using Windows API
  - Return window title, process name, bounds
  - Handle permission errors gracefully
  - _Requirements: FR-2.3_

- [~] 4. Cursor Position
  - Implement get_cursor_position command
  - Return X/Y coordinates relative to screen
  - _Requirements: FR-2.4_

- [~] 5. Register Commands
  - Register all commands in main.rs
  - Test commands via Tauri invoke
  - _Requirements: All_

## Phase 3: TypeScript Layer

- [~] 6. Type Definitions
  - Create src/types/capture.ts
  - Define CaptureFrame interface
  - Define WindowInfo interface
  - Define CaptureSession interface
  - _Requirements: FR-2.5_

- [~] 7. Capture Hook
  - Create src/hooks/useCapture.ts
  - Implement startCapture() with setInterval
  - Implement stopCapture()
  - Store frames in session data
  - Configure capture interval (1000ms default)
  - _Requirements: FR-2.2_

## Phase 4: Storage

- [~] 8. Session Storage
  - Create temp directory for session
  - Save screenshots to temp folder
  - Create manifest.json for frame metadata
  - Implement cleanup on session end
  - _Requirements: FR-2.5, NFR-2.3_

## Phase 5: Testing

- [~] 9. Capture Testing
  - Test screenshot capture works
  - Test active window detection
  - Test cursor tracking
  - Verify capture rate is ~1/sec
  - Measure capture latency < 100ms
  - _Requirements: All ACs_

- [~] 10. Checkpoint - Verify Phase Complete
  - Ensure all tests pass, ask the user if questions arise.

---

## Success Criteria

- Screenshots captured at 1fps
- Active window tracked correctly
- Cursor position logged each frame
- WebP files < 100KB each
- Capture latency < 100ms

## Notes

- Use WebP for good compression
- Don't load all captures into RAM - stream to disk
- Clean up temp files after processing
