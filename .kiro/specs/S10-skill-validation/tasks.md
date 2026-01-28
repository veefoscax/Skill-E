# S10: Skill Validation - Implementation Tasks

> **Reference Workflow**: See `.kiro/steering/workflow.md` for execution guidelines.

## Overview

Implements interactive skill testing with step-by-step execution, error feedback, and iterative refinement. Supports CDP-based (Chrome DevTools Protocol), DOM-based, and image-based automation with intelligent hybrid fallback chain (CDP → DOM → Image → Human).

**Based on Claude extension architecture analysis**: CDP automation provides the most reliable execution by using Chrome's native accessibility APIs, bypassing anti-bot detection, and scaling screenshots for token-efficient LLM consumption.

---

## Phase 1: Skill Parser

- [x] 1. Step Extractor
  - Create src/lib/skill-parser.ts
  - Parse SKILL.md markdown into steps
  - Extract action types from instructions
  - Identify confirmation points (PAUSE markers)
  - _Requirements: FR-10.1_

- [x] 2. Action Classifier
  - Classify steps by action type (click, type, navigate, wait, verify)
  - Extract target selectors from instructions
  - Extract coordinates from reference screenshots
  - _Requirements: FR-10.1_

## Phase 2: Step Executor

- [x] 3. DOM Executor
  - Create src/lib/browser-automation.ts
  - Implement click by CSS selector
  - Implement type into input fields
  - Implement navigation
  - Use Playwright or Tauri webview commands
  - _Requirements: FR-10.5_

- [x] 4. Image Executor
  - Implement screenshot capture
  - Implement template matching (OpenCV.js or similar)
  - Implement click by coordinates
  - Fall back when DOM fails
  - _Requirements: FR-10.4_

- [x] 5. Hybrid Executor
  - Try DOM first
  - Fall back to image if DOM fails
  - Pause for human if both fail
  - Return execution result
  - _Requirements: FR-10.4, FR-10.5_

## Phase 3: Anti-Bot Detection

- [x] 6. Bot Detection
  - Detect Cloudflare challenges
  - Detect CAPTCHAs (reCAPTCHA, hCaptcha)
  - Warn user before proceeding
  - Suggest image-based automation
  - _Requirements: FR-10.6_

## Phase 4: Execution Monitor

- [x] 7. Execution Session Manager
  - Create src/lib/skill-executor.ts
  - Track current step and status
  - Capture before/after screenshots
  - Log execution timeline
  - _Requirements: FR-10.1, FR-10.9_

- [x] 8. Confirmation Points
  - Pause at PAUSE markers
  - Show pending action to user
  - Wait for approval/cancel
  - Resume or abort execution
  - _Requirements: FR-10.3_

## Phase 5: Error Handling

- [x] 9. Error Detection
  - Detect step failures
  - Capture error screenshots
  - Generate clear error messages
  - Pause execution
  - _Requirements: FR-10.2_

- [x] 10. Rollback Support
  - Save state before destructive actions
  - Offer rollback option on failure
  - Track which actions are reversible
  - _Requirements: FR-10.10_

## Phase 6: Feedback Loop

- [x] 11. Feedback Dialog Component
  - Create src/components/FeedbackDialog/FeedbackDialog.tsx
  - Show what went wrong
  - Input for user feedback
  - Options: Fix, Skip, Edit manually
  - _Requirements: FR-10.7_

- [x] 12. Skill Update Logic
  - Take feedback text
  - Use LLM to generate fix
  - Update step in skill
  - Retry step
  - _Requirements: FR-10.8_

- [x] 13. Direct Step Editing
  - Allow inline editing of step
  - Save changes to skill
  - Re-run edited step
  - _Requirements: FR-10.8_

## Phase 7: UI Components

- [x] 14. SkillValidator Main Component
  - Create src/components/SkillValidator/SkillValidator.tsx
  - Left panel: step list with status
  - Right panel: execution view
  - Top bar: controls and progress
  - Quality badge with semantic validation display
  - Execution timeline log
  - Settings dialog
  - _Requirements: FR-10.1_, FR-10.14

- [x] 15. StepRunner Component
  - Create src/components/StepRunner/StepRunner.tsx
  - Show step instruction
  - Show status indicator
  - Before/after screenshots
  - Retry/Skip/Edit buttons
  - _Requirements: FR-10.1, FR-10.7_
  - NOTE: Integrated into SkillValidator

- [x] 16. Progress Tracking
  - Show overall progress bar
  - Count successful/failed/pending steps
  - Estimate remaining time
  - _Requirements: FR-10.9_

## Phase 8: External Integration

- [x] 17. Antigravity Integration (Optional)
  - Detect if Antigravity is available
  - Delegate execution if user prefers
  - Monitor progress via callbacks
  - _Requirements: FR-10.11_

- [x] 18. Claude Code Integration (Optional)
  - Detect if in VS Code with Claude Code
  - Use Claude Code for execution
  - Benefit from existing subscription
  - _Requirements: FR-10.11_

## Phase 9: Semantic Judge (Quality)

- [x] 19. Semantic Validator Logic
  - Create src/lib/semantic-judge.ts
  - Implement LLM critique prompt (compare Goal vs Skill)
  - Define scoring rubrics (0-100)
  - Return structured feedback (Strengths, Weaknesses, Score)
  - Dimension scoring: Safety (40%), Clarity (35%), Completeness (25%)
  - Grade calculation (A+, A, A-, B+, etc.)
  - Score color coding for UI
  - _Requirements: FR-10.12, FR-10.13_

- [x] 20. Quality Badge UI
  - Show score component in Skill Validator
  - Show "Verified" shield if >90
  - Show breakdown tooltip on hover
  - Score display with color coding (green/yellow/orange/red)
  - Integrated into SkillValidator header
  - _Requirements: FR-10.14_

## Phase 10: CDP Integration (Chrome DevTools Protocol)

- [x] 21. CDP Client Module
  - Create src/lib/cdp/client.ts
  - WebSocket connection to Chrome DevTools Protocol
  - Input domain: mouse and keyboard events
  - Page domain: navigation and screenshots
  - Accessibility domain: tree generation
  - _Requirements: FR-10.5, FR-10.6_

- [x] 22. Accessibility Tree Generator
  - Create src/lib/cdp/accessibility-tree.ts
  - Generate text representation from CDP AX tree
  - Identify interactive elements with index numbers
  - Provide center coordinates for clicking
  - Filter ignored/presentation roles
  - _Requirements: FR-10.5_

- [x] 23. Screenshot Scaling Utility
  - Create src/lib/cdp/screenshot-scale.ts
  - Scale screenshots to 1024x768 for token efficiency
  - Coordinate mapping between scaled and original
  - Support JPEG/PNG/WebP formats
  - Token savings calculation
  - _Requirements: FR-10.4_

- [x] 24. CDP Executor
  - Create src/lib/cdp/executor.ts
  - Execute skill steps using CDP automation
  - Click, type, navigate, wait, verify actions
  - Capture scaled screenshots with accessibility tree
  - Fallback handling for CDP unavailability
  - _Requirements: FR-10.4, FR-10.5_

- [x] 25. Hybrid Executor CDP Integration
  - Update src/lib/hybrid-executor.ts
  - Add 'cdp' execution mode
  - Execution order: CDP → DOM → Image → Human
  - Configuration options for CDP port and enablement
  - Methods: isCDPAvailable(), getCDPExecutor()
  - _Requirements: FR-10.4, FR-10.5, FR-10.6_

## Phase 11: Testing

- [x] 26. Executor Testing
  - Test DOM executor with mock page
  - Test image executor with templates
  - Test CDP executor (requires Chrome with debugging)
  - Test hybrid fallback logic
  - _Requirements: FR-10.4, FR-10.5_

- [x] 27. Integration Testing
  - Test full validation flow
  - Test feedback and retry
  - Test skill update on fix
  - Test CDP mode execution
  - _Requirements: All_

- [x] 28. Checkpoint - Verify Phase Complete
  - Ensure all tests pass, ask the user if questions arise.

---

## Success Criteria

- Can run skill step-by-step
- Pauses correctly on errors and confirmations
- User can provide feedback and fix steps
- Skill is updated with fixes
- CDP automation works (Chrome with debugging port)
- DOM automation works (traditional selectors)
- Image automation works (coordinate fallback)
- Hybrid execution follows fallback chain (CDP → DOM → Image → Human)

## Notes

- **Execution Priority**: CDP → DOM → Image → Human
- **CDP Mode**: Most reliable, bypasses anti-bot detection (requires Chrome with --remote-debugging-port)
- **DOM Mode**: Traditional selectors, fast but detectable
- **Image Mode**: Coordinate-based, works on any site
- **Human Mode**: Fallback when automation fails

### Chrome CDP Setup
```bash
# Start Chrome with remote debugging
chrome --remote-debugging-port=9222

# Verify connection
curl http://localhost:9222/json/version
```

### Claude Extension Architecture Alignment
- ✅ CDP for input dispatch (bypasses anti-bot)
- ✅ Accessibility tree for element understanding
- ✅ Scaled screenshots (1024x768) for token efficiency
- ✅ Hybrid execution with fallback chain

### Production Recommendations
- Launch Chrome automatically with debugging flag
- Implement retry logic for CDP connection
- Cache accessibility tree for performance
- Use scaled screenshots for LLM vision calls
