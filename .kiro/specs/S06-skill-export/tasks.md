# S06: Skill Export - Implementation Tasks

> **Reference Workflow**: See `.kiro/steering/workflow.md` for execution guidelines.

## Overview

Generates SKILL.md files in AgentSkills format from processed sessions, with preview and editing capabilities.

---

## Phase 1: Skill Generator

- [x] 1. Context Preparation & Optimization
  - **Implement "Smart Context Selection" (FR-6.19)**
  - Filter S05 data to "Key Steps" only
  - **Apply Hierarchical Summarization (FR-6.20)**
  - Compress console/network logs into summaries
  - Construct compact JSON payload for generator
  - _Requirements: FR-6.19, FR-6.20_

- [x] 2. Generator Implementation
  - Create src/lib/skill-generator.ts
  - Implement generateSkill() function
  - Create prompt template for Claude
  - Call Claude API with **Optimized Context** (from Task 1)
  - Parse response as markdown
  - Generate tool_definition.json (OpenAI/Anthropic compatible)
  - _Requirements: FR-6.1, FR-6.17_

- [x] 2. Prompt Engineering
  - Design effective prompt for skill generation
  - Include all context (steps, transcript, annotations)
  - Request specific SKILL.md format
  - Add few-shot examples if needed
  - _Requirements: FR-6.1_

## Phase 2: Preview Component

- [x] 3. Skill Preview
  - Create src/components/SkillPreview/SkillPreview.tsx
  - Render markdown with syntax highlighting
  - Parse and display YAML frontmatter
  - Add copy to clipboard button
  - Show file size estimate
  - _Requirements: FR-6.2_

## Phase 3: Editor Component

- [x] 4. Skill Editor
  - Create src/components/SkillEditor/SkillEditor.tsx
  - Add markdown editor with highlighting
  - Implement live preview side-by-side
  - Add undo/redo support
  - Add regenerate section button
  - _Requirements: FR-6.3_

## Phase 4: Export

- [x] 5. Export Dialog
  - Create export location picker
  - Default to workspace/skills folder
  - Allow custom folder selection
  - Show preview of folder structure
  - _Requirements: FR-6.4_

- [x] 6. Save Implementation
  - Create skill folder (skill-name/)
  - Save SKILL.md inside folder
  - Copy reference screenshots if selected
  - Validate file was saved successfully
  - _Requirements: FR-6.4_

## Phase 5: Validation

- [x] 7. Format Validation & Linter
  - Create src/lib/skill-validator.ts
  - Validate YAML frontmatter syntax
  - **NEW: Lint tool definitions (snake_case, description length)**
  - **NEW: Check for atomic scope violations**
  - Check required fields (name, description)
  - Show validation errors inline
  - Block save until valid
  - _Requirements: FR-6.5, FR-6.18_

## Phase 6: Settings

- [x] 8. API Key Settings
  - Add Claude API key input to settings
  - Validate API key on save
  - Store key securely
  - Show connection status
  - _Requirements: FR-6.1_

## Phase 7: Testing

- [x] 9. Export Testing
  - Test skill generation with sample processed session
  - Test preview rendering
  - Test editor functionality
  - Test export saves correctly
  - Test generated skill works in Claude Code
  - _Requirements: All ACs_

- [x] 10. Checkpoint - Verify Phase Complete
  - Ensure all tests pass, ask the user if questions arise.

---

## Success Criteria

- Skills generate in < 60 seconds
- Generated skills have valid YAML frontmatter
- Preview shows correctly rendered markdown
- Editor allows inline modifications
- Exported skills work in Claude Code/Bot

## Notes

- Use Claude API (not OpenAI) for skill generation
- Consider streaming response for better UX
- Add example skills as reference
- Handle API rate limits gracefully
