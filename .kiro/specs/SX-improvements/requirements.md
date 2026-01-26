# SX: Future Improvements - Requirements

## Feature Description
Technical debt and quality improvements to enhance code maintainability, cross-platform support, and developer experience. These are non-blocking enhancements that should be addressed as time permits.

## Priority
**Low** - Can be done after MVP is complete

---

## Category 1: Code Quality & Linting

### FR-X.1: Strict ESLint Rules
- **FR-X.1.1**: Add ESLint rule `@typescript-eslint/no-unused-vars` with error level
- **FR-X.1.2**: Add ESLint rule `@typescript-eslint/no-unused-imports` 
- **FR-X.1.3**: Configure Husky pre-commit hook to run ESLint
- **FR-X.1.4**: Add `eslint --fix` as npm script for auto-fixing

### FR-X.2: Code Formatting
- **FR-X.2.1**: Add Prettier configuration for consistent formatting
- **FR-X.2.2**: Configure Prettier + ESLint integration
- **FR-X.2.3**: Add format-on-save VS Code settings

---

## Category 2: Testing Infrastructure

### FR-X.3: Frontend Unit Tests
- **FR-X.3.1**: Install Vitest for React component testing
- **FR-X.3.2**: Install @testing-library/react for component assertions
- **FR-X.3.3**: Add test coverage reporting
- **FR-X.3.4**: Create test utilities for mocking Tauri invoke

### FR-X.4: Test Coverage Targets
- **FR-X.4.1**: Unit tests for all Zustand stores
- **FR-X.4.2**: Unit tests for all custom hooks
- **FR-X.4.3**: Component tests for Toolbar interactions
- **FR-X.4.4**: Mock tests for Tauri commands

### FR-X.5: Rust Testing
- **FR-X.5.1**: Add integration tests for capture commands
- **FR-X.5.2**: Add benchmarks for capture performance
- **FR-X.5.3**: Add CI test matrix for Windows/macOS/Linux

---

## Category 3: Cross-Platform Support

### FR-X.6: macOS Window Tracking
- **FR-X.6.1**: Implement `get_active_window` using AppKit/CoreGraphics
- **FR-X.6.2**: Get window title via CGWindowListCopyWindowInfo
- **FR-X.6.3**: Get process name via NSRunningApplication
- **FR-X.6.4**: Get window bounds from window info dictionary

### FR-X.7: macOS Cursor Tracking
- **FR-X.7.1**: Implement `get_cursor_position` using NSEvent
- **FR-X.7.2**: Convert screen coordinates appropriately

### FR-X.8: Linux Window Tracking
- **FR-X.8.1**: Implement using xcb or x11 crate for X11
- **FR-X.8.2**: Add Wayland support via wayland-client (optional)
- **FR-X.8.3**: Fall back gracefully if not available

### FR-X.9: Linux Cursor Tracking
- **FR-X.9.1**: Implement using XQueryPointer for X11
- **FR-X.9.2**: Add Wayland support (compositor-dependent)

---

## Category 4: Developer Experience

### FR-X.10: Documentation
- **FR-X.10.1**: Add JSDoc to all public functions
- **FR-X.10.2**: Generate API docs with TypeDoc
- **FR-X.10.3**: Add CONTRIBUTING.md with coding guidelines
- **FR-X.10.4**: Add architecture diagram in README

### FR-X.11: Debug Tools
- **FR-X.11.1**: Add dev-only debug panel component
- **FR-X.11.2**: Show current state of all stores
- **FR-X.11.3**: Add console log toggle for verbose mode
- **FR-X.11.4**: Add performance timing for capture operations

---

## Category 5: Performance Optimizations

### FR-X.12: Memory Optimization
- **FR-X.12.1**: Implement frame buffer limit (keep only last N frames in memory)
- **FR-X.12.2**: Add lazy loading for session manifests
- **FR-X.12.3**: Compress screenshots in memory before writing

### FR-X.13: Capture Performance
- **FR-X.13.1**: Profile capture latency on different systems
- **FR-X.13.2**: Optimize WebP encoding settings
- **FR-X.13.3**: Consider multi-threaded capture for multi-monitor

---

## Implementation Priority

| Category | Priority | Effort | Impact |
|----------|----------|--------|--------|
| Linting (FR-X.1-2) | High | Low | High |
| Frontend Tests (FR-X.3-4) | Medium | Medium | High |
| macOS Support (FR-X.6-7) | Medium | High | Medium |
| Linux Support (FR-X.8-9) | Low | High | Low |
| Documentation (FR-X.10) | Low | Low | Medium |
| Debug Tools (FR-X.11) | Low | Low | Medium |
| Performance (FR-X.12-13) | Medium | Medium | Medium |

---

## Files to Create/Modify

### Code Quality
- `.eslintrc.cjs` (update rules)
- `.prettierrc` (new)
- `.husky/pre-commit` (new)
- `package.json` (add scripts)

### Testing
- `vitest.config.ts` (new)
- `src/test/setup.ts` (new)
- `src/test/mocks/tauri.ts` (new)
- `src/**/*.test.ts` (new test files)

### Cross-Platform
- `src-tauri/src/commands/capture.rs` (add macOS/Linux implementations)

### Documentation
- `docs/` (new directory)
- `CONTRIBUTING.md` (new)

---

## Dependencies to Add

### Frontend
```json
{
  "devDependencies": {
    "vitest": "^3.0.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "@vitest/coverage-v8": "^3.0.0",
    "prettier": "^3.0.0",
    "eslint-config-prettier": "^10.0.0",
    "husky": "^9.0.0"
  }
}
```

### Rust (for macOS/Linux)
```toml
[target.'cfg(target_os = "macos")'.dependencies]
cocoa = "0.26"
core-graphics = "0.24"

[target.'cfg(target_os = "linux")'.dependencies]
x11 = "2.21"
```

---

## Acceptance Criteria

### AC-X.1: Linting
- [ ] ESLint catches unused variables/imports
- [ ] Pre-commit hook blocks commits with lint errors
- [ ] `npm run lint` passes with 0 warnings

### AC-X.2: Testing
- [ ] Vitest runs with `npm test`
- [ ] Coverage report generated
- [ ] At least 50% coverage on stores and hooks

### AC-X.3: Cross-Platform
- [ ] Window tracking works on macOS
- [ ] Cursor tracking works on macOS
- [ ] Graceful fallback on unsupported platforms

### AC-X.4: Documentation
- [ ] All public APIs have JSDoc comments
- [ ] CONTRIBUTING.md exists with guidelines
- [ ] README has architecture section

---

## Notes

This spec is a collection of improvements that don't affect MVP functionality but improve long-term maintainability. Prioritize based on developer pain points and user requests for platform support.
