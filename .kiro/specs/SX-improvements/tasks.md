# SX: Future Improvements - Tasks

## Priority: Low (Post-MVP)

---

## Phase 1: Code Quality (Quick Wins) ⏱️ 1-2h

### Task 1: ESLint Configuration
- [x] Update `.eslintrc.cjs` with strict unused rules
- [x] Test lint catches unused imports
- [ ] Fix any existing violations

### Task 2: Prettier Setup
- [ ] Install prettier and eslint-config-prettier
- [ ] Create `.prettierrc` with project settings
- [ ] Add `npm run format` script
- [ ] Format existing codebase

### Task 3: Pre-commit Hooks
- [ ] Install husky
- [ ] Create pre-commit hook for lint + format
- [ ] Test hook blocks bad commits

---

## Phase 2: Testing Infrastructure ⏱️ 3-4h

### Task 4: Vitest Setup
- [ ] Install vitest and testing-library
- [ ] Create vitest.config.ts
- [ ] Create test setup file
- [ ] Create Tauri mock utilities

### Task 5: Store Tests
- [ ] Test recording store actions
- [ ] Test settings store persistence
- [ ] Test toolbar store state

### Task 6: Hook Tests
- [ ] Test useCapture hook
- [ ] Test useAudioRecording hook
- [ ] Mock Tauri invoke for tests

### Task 7: Component Tests
- [ ] Test Toolbar interactions
- [ ] Test button states
- [ ] Test timer display

---

## Phase 3: macOS Support ⏱️ 4-6h

### Task 8: macOS Window Tracking
- [ ] Add cocoa/core-graphics dependencies
- [ ] Implement get_active_window for macOS
- [ ] Test window title and process name
- [ ] Test window bounds

### Task 9: macOS Cursor Tracking
- [ ] Implement get_cursor_position for macOS
- [ ] Test coordinates match expected
- [ ] Handle screen coordinate conversion

### Task 10: macOS Testing
- [ ] Test capture flow on macOS VM/device
- [ ] Verify all commands work
- [ ] Document any platform-specific issues

---

## Phase 4: Linux Support (Optional) ⏱️ 4-6h

### Task 11: X11 Window Tracking
- [ ] Add x11 crate dependency
- [ ] Implement for X11 systems
- [ ] Test on Ubuntu/Debian

### Task 12: X11 Cursor Tracking
- [ ] Implement cursor position for X11
- [ ] Test coordinates

### Task 13: Graceful Fallback
- [ ] Return None/error for Wayland
- [ ] Log warning for unsupported desktops
- [ ] Ensure app doesn't crash

---

## Phase 5: Documentation ⏱️ 2-3h

### Task 14: API Documentation
- [ ] Add JSDoc to all exports
- [ ] Install typedoc
- [ ] Generate docs to docs/ folder

### Task 15: Developer Guides
- [ ] Create CONTRIBUTING.md
- [ ] Add architecture diagram
- [ ] Document testing approach

---

## Estimated Total: 14-21 hours

| Phase | Effort | Priority |
|-------|--------|----------|
| Code Quality | 1-2h | High |
| Testing | 3-4h | Medium |
| macOS | 4-6h | Medium |
| Linux | 4-6h | Low |
| Documentation | 2-3h | Low |

---

## Quick Reference

**Start with Phase 1** - Low effort, high impact on code quality.

**Skip Phase 4** unless Linux users specifically request it.

**Phase 2** should be done before any major refactoring to catch regressions.
