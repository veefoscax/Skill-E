# S01: App Core - Implementation Tasks

> **Reference Workflow**: See `.kiro/steering/workflow.md` for execution guidelines.

## Overview

Sets up the Tauri 2.0 application with floating toolbar, always-on-top behavior, global hotkeys, and window persistence.

---

## Phase 1: Project Setup

- [x] 1. Initialize Tauri Project
  - Run `pnpm create tauri-app skill-e` with React template
  - Configure pnpm workspace
  - Install dependencies: `zustand`, `framer-motion`, `lucide-react`, `clsx`, `tailwind-merge`
  - Install fonts: `@fontsource/nunito-sans`
  - Configure ESLint and Prettier
  - _Requirements: NFR-1.1, NFR-1.2_

- [-] 2. Design System Setup (shadcn/ui - Mira)
  - Initialize shadcn: `npx shadcn@latest init`
  - Configure `components.json` manually for "Mira" style:
    - Style: `new-york`
    - Base Color: `neutral`
    - Radius: `0.5`
    - CSS Variables: `true`
  - Configure `tailwind.config.js` for Nunito Sans
  - Add core components: `button`, `tooltip`, `dropdown-menu`, `separator`
  - _Requirements: NFR-1.6, NFR-1.7_

- [~] 3. Window & Glass Effects
  - Configure tauri.conf.json with transparent window
  - Set width: 300, height: 60, decorations: false
  - Add `tauri-plugin-window-vibrancy`
  - Implement Mica (Windows) and Vibrancy (MacOS)
  - Enable alwaysOnTop: true, transparent: true
  - _Requirements: FR-1.1, FR-1.2, NFR-1.6_

- [~] 3. Window Drag Region
  - Setup custom title bar for dragging
  - Implement data-tauri-drag-region attribute
  - Test drag behavior across screen
  - _Requirements: FR-1.3, AC2_

## Phase 2: Core Components

- [~] 4. Toolbar Component
  - Create src/components/Toolbar/Toolbar.tsx
  - Add recording controls placeholder (Start/Pause/Stop)
  - Add timer display component
  - Add annotation mode toggle button
  - Style with CSS modules
  - _Requirements: FR-1.1, AC1_

- [~] 5. State Management
  - Create src/stores/recording.ts with Zustand
  - Define RecordingState interface
  - Implement persist middleware
  - Create src/stores/settings.ts
  - _Requirements: FR-1.6, AC5_

- [~] 6. Window Persistence
  - Save window position to localStorage
  - Restore position on app launch
  - Handle off-screen position correction
  - _Requirements: FR-1.6, AC5_

## Phase 3: System Integration

- [~] 7. System Tray
  - Add tauri-plugin-positioner
  - Configure tray icon
  - Implement minimize to tray on close
  - Add tray context menu with Quit option
  - _Requirements: FR-1.4, AC3_

- [~] 8. Global Hotkeys
  - Add @tauri-apps/plugin-global-shortcut
  - Configure Ctrl+Shift+R for record toggle
  - Configure Ctrl+Shift+A for annotation mode
  - Configure Esc to cancel recording
  - _Requirements: FR-1.5, AC4_

## Phase 4: Testing

- [~] 9. Manual Testing
  - Verify window launches as floating toolbar
  - Verify always-on-top works
  - Verify drag behavior
  - Verify hotkeys register correctly
  - Verify position persistence
  - _Requirements: All ACs_

- [~] 10. Checkpoint - Verify Phase Complete
  - Ensure all tests pass, ask the user if questions arise.

---

## Success Criteria

- Window appears as small floating toolbar (300x60px)
- Window stays on top of all other windows
- Window is draggable to any position
- Position persists across app restarts
- Global hotkeys work when app is not focused
- Bundle size < 20MB

## Notes

- Use Tauri 2.0 (not 1.x) for latest features
- Test on Windows first, macOS support is secondary
- Keep UI minimal during this phase - just the toolbar shell
