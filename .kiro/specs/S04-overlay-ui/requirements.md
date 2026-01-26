# S04: Overlay UI - Requirements

## Feature Description
Transparent overlay for visual feedback during recording. Shows click indicators, drawing annotations, keyboard input, and optional browser element selection. Designed for tutorial creation based on best practices from Camtasia, FocuSee, Screen Studio, and Tango.

## User Stories

### US1: Click Visualization
**As a** user
**I want** to see where I click with numbered indicators
**So that** the recording clearly shows the click sequence

### US2: Quick Annotations
**As a** user
**I want** to draw arrows and rectangles quickly
**So that** I can highlight important areas

### US3: Fading vs Fixed
**As a** user
**I want** drawings to fade by default but optionally stay
**So that** annotations don't clutter the screen

### US4: Keyboard Display
**As a** user
**I want** to show what I'm typing (with password redaction)
**So that** viewers understand the input

### US5: Element Selection
**As a** user
**I want** to optionally select browser elements
**So that** I can generate precise selectors for automation

## Functional Requirements

### Click Visualization
- **FR-4.1**: Show numbered click indicator (1, 2, 3...) at each click
- **FR-4.2**: Cycle through 3 colors for click indicators
- **FR-4.3**: Display ripple animation on click
- **FR-4.4**: Track and display click sequence order
- **FR-4.5**: Cursor highlighting/enlargement during recording

### Drawing Tools
- **FR-4.6**: Click gesture = Circle/dot marker
- **FR-4.7**: Drag gesture = Arrow (direction follows drag)
- **FR-4.8**: Diagonal drag gesture = Rectangle
- **FR-4.9**: Use 3 fixed colors only (no color picker)
- **FR-4.10**: Toggle between color 1, 2, 3 with keyboard shortcut

### Drawing Behavior
- **FR-4.11**: Default mode: Drawings fade out after 3-5 seconds
- **FR-4.12**: Pin mode: Drawings stay until manually cleared
- **FR-4.13**: Toggle pin mode via toolbar button or hotkey
- **FR-4.14**: Clear all drawings with hotkey

### Keyboard Input Display
- **FR-4.15**: Show typed text in overlay
- **FR-4.16**: Show modifier keys (Shift, Ctrl/Cmd, Alt)
- **FR-4.17**: Auto-detect and redact password field input
- **FR-4.18**: Replace password text with ●●●●●● or ${variable}
- **FR-4.19**: Keyboard display position configurable

### Recording Feedback
- **FR-4.25**: **Screen Border**: Optional colored border (Red default) around screen/window when recording
- **FR-4.26**: **Status Light**: Small pulsing red dot indicator in overlay or toolbar
- **FR-4.27**: **Pause State**: Border turns Yellow when paused
- **FR-4.28**: Visual feedback configurable (Border width/opacity)

## Non-Functional Requirements

- **NFR-4.1**: Overlay must be transparent (click-through except for tool area)
- **NFR-4.2**: Drawing latency < 16ms (60fps)
- **NFR-4.3**: Click indicators shouldn't obscure content
- **NFR-4.4**: Password redaction must be 100% reliable

## Color Palette (Fixed)

| Name | Hex | Use Case |
|------|-----|----------|
| **Color 1** | #FF4444 (Red) | Primary emphasis, Click 1, 4, 7... |
| **Color 2** | #4488FF (Blue) | Secondary, Click 2, 5, 8... |
| **Color 3** | #44CC44 (Green) | Tertiary, Click 3, 6, 9... |

## Acceptance Criteria

### AC1: Click Indicators
- [ ] Click shows numbered circle at cursor position
- [ ] Number increments with each click (1, 2, 3...)
- [ ] Color cycles: Red → Blue → Green → Red...
- [ ] Ripple animation plays on click
- [ ] Click indicators persist for 3 seconds then fade
- _Requirements: FR-4.1, FR-4.2, FR-4.3, FR-4.4_

### AC2: Drawing Tools
- [ ] Tap creates dot marker at position
- [ ] Drag creates arrow from start to end
- [ ] Diagonal drag creates rectangle
- [ ] 1, 2, 3 keys switch between colors
- [ ] No color picker needed (only 3 colors)
- _Requirements: FR-4.6, FR-4.7, FR-4.8, FR-4.9, FR-4.10_

### AC3: Fade vs Pin
- [ ] Default: drawings fade after 3 seconds
- [ ] P key toggles pin mode
- [ ] Pinned drawings stay until cleared
- [ ] C key clears all drawings
- [ ] Visual indicator shows current mode
- _Requirements: FR-4.11, FR-4.12, FR-4.13, FR-4.14_

### AC4: Keyboard Display
- [ ] Typed text appears in overlay
- [ ] Shows Shift, Ctrl, Alt, Cmd keys
- [ ] Password fields show ●●●●●● instead of actual text
- [ ] Keyboard display can be repositioned
- _Requirements: FR-4.15, FR-4.16, FR-4.17, FR-4.18, FR-4.19_

### AC5: Browser Element Selector
- [ ] Toggle button enables element picker
- [ ] Elements highlight on hover when enabled
- [ ] Click captures selector information
- [ ] Captured selectors saved with recording
- [ ] Feature is disabled by default
- _Requirements: FR-4.20, FR-4.21, FR-4.22, FR-4.23, FR-4.24_

## Dependencies
- S01: App Core (overlay window)
- S02: Screen Capture (cursor tracking)

## Files to Create
- src/components/Overlay/Overlay.tsx
- src/components/Overlay/ClickIndicator.tsx
- src/components/Overlay/DrawingCanvas.tsx
- src/components/Overlay/KeyboardDisplay.tsx
- src/components/Overlay/ElementSelector.tsx
- src/lib/overlay/click-tracker.ts
- src/lib/overlay/drawing-tools.ts
- src/lib/overlay/keyboard-tracker.ts
- src/stores/overlay.ts

## Reference: Screen Recorder Best Practices

**Inspiration from industry tools:**
- **Camtasia**: Cursor effects, highlight circles
- **Screen Studio**: Auto-zoom on actions, cursor enlargement
- **FocuSee**: Click ripple effects, spotlight
- **Movavi**: Real-time drawing, keystroke display
- **Tango**: Automatic workflow capture with highlights

## Hotkeys

| Key | Action |
|-----|--------|
| 1 | Select Color 1 (Red) |
| 2 | Select Color 2 (Blue) |
| 3 | Select Color 3 (Green) |
| P | Toggle Pin mode |
| C | Clear all drawings |
| E | Toggle Element Selector |
| K | Toggle Keyboard Display |
