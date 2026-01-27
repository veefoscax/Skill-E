veja se precisa atualizar apra# S10: Skill Validation - Implementation Tasks

> **Reference Workflow**: See `.kiro/steering/workflow.md` for execution guidelines.

## Overview

Implements interactive skill testing with step-by-step execution, error feedback, and iterative refinement. Supports both DOM-based and image-based automation with hybrid fallback.

---

## Phase 1: Skill Parser

- [ ] 1. Step Extractor
  - Create src/lib/skill-parser.ts
  - Parse SKILL.md markdown into steps
  - Extract action types from instructions
  - Identify confirmation points (PAUSE markers)
  - _Requirements: FR-10.1_

- [ ] 2. Action Classifier
  - Classify steps by action type (click, type, navigate, wait, verify)
  - Extract target selectors from instructions
  - Extract coordinates from reference screenshots
  - _Requirements: FR-10.1_

## Phase 2: Step Executor

- [ ] 3. DOM Executor
  - Create src/lib/browser-automation.ts
  - Implement click by CSS selector
  - Implement type into input fields
  - Implement navigation
  - Use Playwright or Tauri webview commands
  - _Requirements: FR-10.5_

- [ ] 4. Image Executor
  - Implement screenshot capture
  - Implement template matching (OpenCV.js or similar)
  - Implement click by coordinates
  - Fall back when DOM fails
  - _Requirements: FR-10.4_

- [ ] 5. Hybrid Executor
  - Try DOM first
  - Fall back to image if DOM fails
  - Pause for human if both fail
  - Return execution result
  - _Requirements: FR-10.4, FR-10.5_

## Phase 3: Anti-Bot Detection

- [ ] 6. Bot Detection
  - Detect Cloudflare challenges
  - Detect CAPTCHAs (reCAPTCHA, hCaptcha)
  - Warn user before proceeding
  - Suggest image-based automation
  - _Requirements: FR-10.6_

## Phase 4: Execution Monitor

- [ ] 7. Execution Session Manager
  - Create src/lib/skill-executor.ts
  - Track current step and status
  - Capture before/after screenshots
  - Log execution timeline
  - _Requirements: FR-10.1, FR-10.9_

- [ ] 8. Confirmation Points
  - Pause at PAUSE markers
  - Show pending action to user
  - Wait for approval/cancel
  - Resume or abort execution
  - _Requirements: FR-10.3_

## Phase 5: Error Handling

- [ ] 9. Error Detection
  - Detect step failures
  - Capture error screenshots
  - Generate clear error messages
  - Pause execution
  - _Requirements: FR-10.2_

- [ ] 10. Rollback Support
  - Save state before destructive actions
  - Offer rollback option on failure
  - Track which actions are reversible
  - _Requirements: FR-10.10_

## Phase 6: Feedback Loop

- [ ] 11. Feedback Dialog Component
  - Create src/components/FeedbackDialog/FeedbackDialog.tsx
  - Show what went wrong
  - Input for user feedback
  - Options: Fix, Skip, Edit manually
  - _Requirements: FR-10.7_

- [ ] 12. Skill Update Logic
  - Take feedback text
  - Use LLM to generate fix
  - Update step in skill
  - Retry step
  - _Requirements: FR-10.8_

- [ ] 13. Direct Step Editing
  - Allow inline editing of step
  - Save changes to skill
  - Re-run edited step
  - _Requirements: FR-10.8_

## Phase 7: UI Components

- [ ] 14. SkillValidator Main Component
  - Create src/components/SkillValidator/SkillValidator.tsx
  - Left panel: step list with status
  - Right panel: execution view
  - Top bar: controls and progress
  - _Requirements: FR-10.1_

- [ ] 15. StepRunner Component
  - Create src/components/StepRunner/StepRunner.tsx
  - Show step instruction
  - Show status indicator
  - Before/after screenshots
  - Retry/Skip/Edit buttons
  - _Requirements: FR-10.1, FR-10.7_

- [ ] 16. Progress Tracking
  - Show overall progress bar
  - Count successful/failed/pending steps
  - Estimate remaining time
  - _Requirements: FR-10.9_

## Phase 8: External Integration

- [ ] 17. Antigravity Integration (Optional)
  - Detect if Antigravity is available
  - Delegate execution if user prefers
  - Monitor progress via callbacks
  - _Requirements: FR-10.11_

- [ ] 18. Claude Code Integration (Optional)
  - Detect if in VS Code with Claude Code
  - Use Claude Code for execution
  - Benefit from existing subscription
  - _Requirements: FR-10.11_

## Phase 9: Testing

- [ ] 19. Executor Testing
  - Test DOM executor with mock page
  - Test image executor with templates
  - Test hybrid fallback logic
  - _Requirements: FR-10.4, FR-10.5_

- [ ] 20. Integration Testing
  - Test full validation flow
  - Test feedback and retry
  - Test skill update on fix
  - _Requirements: All_

- [ ] 21. Checkpoint - Verify Phase Complete
  - Ensure all tests pass, ask the user if questions arise.

---

## Success Criteria

- Can run skill step-by-step
- Pauses correctly on errors and confirmations
- User can provide feedback and fix steps
- Skill is updated with fixes
- Both DOM and image automation work

## Notes

- Prioritize DOM automation (faster, more reliable)
- Image automation is fallback for anti-bot sites
- Antigravity/Claude Code integration is optional bonus
- Focus on feedback loop for hackathon demo
