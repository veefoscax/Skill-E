# S06: Skill Export - Implementation Tasks

> **Reference Workflow**: See `.kiro/steering/workflow.md` for execution guidelines.

## Overview

Generates SKILL.md files in AgentSkills format from processed sessions, with preview and editing capabilities.

---

## Phase 1: Skill Generator

- [ ] 1. Generator Implementation
  - Create src/lib/skill-generator.ts
  - Implement generateSkill() function
  - Create prompt template for Claude
  - Call Claude API with processed context
  - Parse response as markdown
  - _Requirements: FR-6.1_

- [ ] 2. Prompt Engineering
  - Design effective prompt for skill generation
  - Include all context (steps, transcript, annotations)
  - Request specific SKILL.md format
  - Add few-shot examples if needed
  - _Requirements: FR-6.1_

## Phase 2: Preview Component

- [ ] 3. Skill Preview
  - Create src/components/SkillPreview/SkillPreview.tsx
  - Render markdown with syntax highlighting
  - Parse and display YAML frontmatter
  - Add copy to clipboard button
  - Show file size estimate
  - _Requirements: FR-6.2_

## Phase 3: Editor Component

- [ ] 4. Skill Editor
  - Create src/components/SkillEditor/SkillEditor.tsx
  - Add markdown editor with highlighting
  - Implement live preview side-by-side
  - Add undo/redo support
  - Add regenerate section button
  - _Requirements: FR-6.3_

## Phase 4: Export

- [ ] 5. Export Dialog
  - Create export location picker
  - Default to workspace/skills folder
  - Allow custom folder selection
  - Show preview of folder structure
  - _Requirements: FR-6.4_

- [ ] 6. Save Implementation
  - Create skill folder (skill-name/)
  - Save SKILL.md inside folder
  - Copy reference screenshots if selected
  - Validate file was saved successfully
  - _Requirements: FR-6.4_

## Phase 5: Validation

- [ ] 7. Format Validation
  - Validate YAML frontmatter syntax
  - Check required fields (name, description)
  - Show validation errors inline
  - Block save until valid
  - _Requirements: FR-6.5_

## Phase 6: Settings

- [ ] 8. API Key Settings
  - Add Claude API key input to settings
  - Validate API key on save
  - Store key securely
  - Show connection status
  - _Requirements: FR-6.1_

## Phase 7: Testing

- [ ] 9. Export Testing
  - Test skill generation with sample processed session
  - Test preview rendering
  - Test editor functionality
  - Test export saves correctly
  - Test generated skill works in Claude Code
  - _Requirements: All ACs_

- [ ] 10. Checkpoint - Verify Phase Complete
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
