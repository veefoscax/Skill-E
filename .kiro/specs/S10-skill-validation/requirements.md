# S10: Skill Validation - Requirements

## Feature Description
Interactive skill testing and validation system. Allows users to run the generated skill step-by-step, see if it works, provide feedback when it fails, and iteratively refine the skill until it's perfect.

## User Stories

### US1: Test Run
**As a** skill creator
**I want** to run my skill step-by-step
**So that** I can verify it works correctly

### US2: Pause and Feedback
**As a** skill creator
**I want** the system to pause when something fails
**So that** I can provide feedback and fix the skill

### US3: Browser Automation Choice
**As a** skill creator
**I want** to choose between image-based or DOM-based automation
**So that** I can handle different websites (including anti-bot)

### US4: Iterative Refinement
**As a** skill creator
**I want** to refine the skill based on test results
**So that** the final skill is reliable

### US5: Quality Scoring (Semantic Judge)
**As a** skill creator
**I want** to see a "Quality Score" (0-100) and semantic critique
**So that** I know if the skill is safe, clear, and complete before saving

## Functional Requirements

- **FR-10.1**: Step-by-step skill execution with visual feedback
- **FR-10.2**: Pause execution on error or uncertainty
- **FR-10.3**: Human-in-the-loop confirmations at defined points
- **FR-10.4**: Option for image-based click (screenshot + coordinates)
- **FR-10.5**: Option for DOM-based actions (CSS selectors, XPath)
- **FR-10.6**: Anti-bot detection awareness and warnings
- **FR-10.7**: Feedback capture for failed steps
- **FR-10.8**: Automatic skill update based on feedback
- **FR-10.9**: Success/failure tracking per step
- **FR-10.10**: Rollback capability for destructive actions
- **FR-10.11**: Integration with Antigravity/Claude Code execution
- **FR-10.12**: **Semantic Judge**: LLM-based critique of the generated skill vs user intent.
- **FR-10.13**: **Quality Score**: 0-100 score based on Clarity, Safety, and Completeness.
- **FR-10.14**: **Verified Badge**: Visual indicator for high-scoring skills (>90).

## Non-Functional Requirements

- **NFR-10.1**: Visual highlight of current step being executed
- **NFR-10.2**: < 2 seconds delay between steps
- **NFR-10.3**: Clear error messages explaining what went wrong

## Acceptance Criteria

### AC1: Step Execution
- [ ] Skill steps are executed one at a time
- [ ] Current step is visually highlighted
- [ ] User can see what's happening on screen
- [ ] Next step waits for previous to complete
- _Requirements: FR-10.1_

### AC2: Error Handling
- [ ] Execution pauses on error
- [ ] Error message is displayed clearly
- [ ] User can provide feedback on what went wrong
- [ ] User can skip, retry, or modify step
- _Requirements: FR-10.2, FR-10.7_

### AC3: Browser Automation Modes
- [ ] Image-based: Uses screenshot + click coordinates
- [ ] DOM-based: Uses CSS selectors or XPath
- [ ] Hybrid: Tries DOM first, falls back to image
- [ ] Warns when anti-bot measures detected
- _Requirements: FR-10.4, FR-10.5, FR-10.6_

### AC4: Human Confirmation Points
- [ ] Pauses at marked confirmation points
- [ ] Shows what action will be taken
- [ ] Waits for user approval to proceed
- [ ] Can cancel and modify
- _Requirements: FR-10.3_

### AC5: Skill Refinement
- [ ] Feedback is saved with the step
- [ ] User can edit step directly
- [ ] Changes are merged back to SKILL.md
- [ ] Can regenerate step with LLM
- _Requirements: FR-10.8, FR-10.9_

### AC6: Antigravity/Claude Code Integration
- [ ] Can delegate execution to Antigravity (if available)
- [ ] Can delegate to Claude Code (if available)
- [ ] Uses existing subscriptions (no extra cost)
- [ ] Uses existing subscriptions (no extra cost)
- _Requirements: FR-10.11_

### AC7: Semantic Judge
- [ ] LLM compares "Task Goal" (S05) vs "Generated Skill" (S06)
- [ ] Returns structured critique (Safety, Clarity, Completeness)
- [ ] Calculates weighted score (0-100)
- [ ] Shows "Verified" badge if score is high
- _Requirements: FR-10.12, FR-10.13, FR-10.14_

## Dependencies
- S06: Skill Export (skill format)
- S08: LLM Providers (for regeneration)
- External: Browser automation (Playwright or Tauri webview)

## Files to Create
- src/lib/skill-executor.ts
- src/lib/browser-automation.ts
- src/components/SkillValidator/SkillValidator.tsx
- src/components/StepRunner/StepRunner.tsx
- src/components/FeedbackDialog/FeedbackDialog.tsx

## Browser Automation Strategy

### When to use Image-based (coordinates):
- Anti-bot sites (Cloudflare, etc.)
- Canvas/WebGL applications
- Non-standard UI frameworks
- When DOM is inaccessible

### When to use DOM-based (selectors):
- Standard websites
- SPAs with accessible DOM
- Forms and inputs
- When reliability is critical

### Hybrid Approach (Recommended):
1. Try DOM selector first
2. If fails, try image recognition
3. If both fail, pause for human feedback
