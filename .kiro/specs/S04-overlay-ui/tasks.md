# S04: Overlay UI - Implementation Tasks

> **Reference Workflow**: See `.kiro/steering/workflow.md` for execution guidelines.

## Overview

Implements transparent overlay with click visualization, drawing tools, keyboard display, and optional browser element selector. Based on best practices from Camtasia, FocuSee, Screen Studio, and Tango.

---

## Phase 1: Overlay Window Setup

- [ ] 1. Overlay Window (Rust/Tauri)
  - Create overlay window in src-tauri
  - Transparent, fullscreen, always-on-top
  - Click-through except for interactive elements
  - Skip taskbar
  - _Requirements: NFR-4.1_

- [ ] 2. Overlay React Component
  - Create src/components/Overlay/Overlay.tsx
  - Layer structure: Canvas → Clicks → Keyboard → Elements
  - Full screen positioning
  - _Requirements: FR-4.1_

## Phase 2: Click Visualization

- [ ] 3. Click Tracker
  - Create src/lib/overlay/click-tracker.ts
  - Listen for global mouse clicks
  - Track position and timestamp
  - Increment click number
  - _Requirements: FR-4.1, FR-4.4_

- [ ] 4. Click Indicator Component
  - Create src/components/Overlay/ClickIndicator.tsx
  - Numbered circle display
  - 3-color rotation (Red → Blue → Green)
  - CSS ripple animation
  - _Requirements: FR-4.1, FR-4.2, FR-4.3_

- [ ] 5. Click Fade Animation
  - Implement fade-out after 3 seconds
  - Respect pin mode (no fade when pinned)
  - Remove from DOM after hidden
  - _Requirements: FR-4.11_

## Phase 3: Drawing Tools

- [ ] 6. Drawing Canvas
  - Create src/components/Overlay/DrawingCanvas.tsx
  - SVG-based drawing surface
  - Mouse event handling (start, move, end)
  - _Requirements: FR-4.6, FR-4.7, FR-4.8_

- [ ] 7. Gesture Detection
  - Create src/lib/overlay/drawing-tools.ts
  - Detect tap (short click) → Dot
  - Detect drag → Arrow
  - Detect diagonal drag → Rectangle
  - _Requirements: FR-4.6, FR-4.7, FR-4.8_

- [ ] 8. Drawing Rendering
  - Render dots as circles
  - Render arrows with arrowhead
  - Render rectangles as outlines
  - Apply selected color
  - _Requirements: FR-4.6, FR-4.7, FR-4.8, FR-4.9_

- [ ] 9. Color Selection
  - 3 fixed colors only (Red, Blue, Green)
  - Number keys 1, 2, 3 to select
  - Visual indicator of current color
  - _Requirements: FR-4.9, FR-4.10_

- [ ] 10. Fade vs Pin Mode
  - Default: drawings fade after 3 seconds
  - P key toggles pin mode
  - Pinned drawings stay visible
  - C key clears all
  - _Requirements: FR-4.11, FR-4.12, FR-4.13, FR-4.14_

## Phase 4: Keyboard Display

- [ ] 11. Keyboard Tracker
  - Create src/lib/overlay/keyboard-tracker.ts
  - Listen for global keyboard events
  - Track modifier keys (Shift, Ctrl, Alt, Cmd)
  - Buffer typed text
  - _Requirements: FR-4.15, FR-4.16_

- [ ] 12. Keyboard Display Component
  - Create src/components/Overlay/KeyboardDisplay.tsx
  - Show modifier key badges
  - Show current typed text
  - Configurable position (corners)
  - _Requirements: FR-4.15, FR-4.16, FR-4.19_

- [ ] 13. Password Redaction
  - Detect password fields (type="password", id, name)
  - Replace text with ●●●●●●
  - Option to insert ${variable} reference
  - 100% reliable redaction
  - _Requirements: FR-4.17, FR-4.18, NFR-4.4_

## Phase 5: Browser Element Selector (Optional)

- [ ] 14. Element Picker Toggle
  - Create src/components/Overlay/ElementSelector.tsx
  - E key toggles element picker
  - Visual indicator when active
  - Disabled by default
  - _Requirements: FR-4.20_

- [ ] 15. Element Highlighting
  - Inject highlight CSS into page
  - Highlight element on hover
  - Show selector tooltip
  - _Requirements: FR-4.21_

- [ ] 16. Element Selection
  - Click captures element info
  - Generate CSS selector (prefer ID, data-testid)
  - Generate XPath as fallback
  - Capture element screenshot
  - Store with recording
  - _Requirements: FR-4.22, FR-4.23, FR-4.24_

## Phase 6: State Management

- [ ] 17. Overlay Store
  - Create src/stores/overlay.ts
  - Clicks array with fade state
  - Drawings array with fade state
  - Keyboard state
  - Element picker state
  - Pin mode flag
  - Current color
  - _Requirements: All_

- [ ] 18. Hotkey Integration
  - 1, 2, 3 = Select color
  - P = Toggle pin mode
  - C = Clear drawings
  - E = Toggle element picker
  - K = Toggle keyboard display
  - _Requirements: FR-4.10, FR-4.13, FR-4.14, FR-4.20_

## Phase 7: Polish

- [ ] 19. Performance Optimization
  - Ensure 60fps drawing (< 16ms)
  - Optimize ripple animations
  - Cleanup faded elements
  - _Requirements: NFR-4.2_

- [ ] 20. Visual Polish
  - Smooth animations
  - Consistent styling
  - Non-intrusive click indicators
  - _Requirements: NFR-4.3_

## Phase 8: Testing

- [ ] 21. Click Visualization Testing
  - Test click numbering sequence
  - Test color cycling
  - Test fade timing
  - Test pin mode
  - _Requirements: FR-4.1, FR-4.2, FR-4.11, FR-4.12_

- [ ] 22. Drawing Tools Testing
  - Test gestures (tap, drag, diagonal)
  - Test all 3 colors
  - Test fade and pin
  - Test clear function
  - _Requirements: FR-4.6-FR-4.14_

- [ ] 23. Keyboard Testing
  - Test modifier key display
  - Test text display
  - Test password redaction
  - Test position options
  - _Requirements: FR-4.15-FR-4.19_

- [ ] 24. Checkpoint - Verify Phase Complete
  - Ensure all tests pass, ask the user if questions arise.

---

## Priority Order

| Phase | Priority | MVP? |
|-------|----------|------|
| Phase 1-2: Click Visualization | P1 | ✅ Yes |
| Phase 3: Drawing Tools | P1 | ✅ Yes |
| Phase 4: Keyboard Display | P2 | Nice to have |
| Phase 5: Element Selector | P3 | Nice to have |

## Success Criteria

- Clicks show as numbered, colored circles with ripple
- Can draw arrows and rectangles with 3 colors
- Drawings fade by default, can be pinned
- Keyboard input shown (optional)
- Passwords are always redacted
- Element picker works in browser (optional)

## Notes

- Keep it simple: 3 colors, no color picker
- Fade is the default, pin is opt-in
- Password redaction is critical for security
- Element picker is advanced feature (P3)
- Test on both Windows and macOS
