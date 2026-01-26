# S06: Skill Export - Requirements

## Feature Description
Generate advanced SKILL.md files in AgentSkills format with support for variables, parameters, conditionals, workflows, and reference materials. Includes preview, editing, and validation.

## User Stories

### US1: Skill Generation
**As a** user
**I want** my recording converted to a high-quality SKILL.md
**So that** I can use it with Claude Code/Bot

### US2: Variables & Parameters
**As a** user
**I want** the skill to have proper variables for dynamic content
**So that** it can be reused with different inputs

### US3: Preview & Edit
**As a** user
**I want** to preview and edit the skill before saving
**So that** I can refine it

### US4: Reference Materials
**As a** user
**I want** screenshots and templates included as references
**So that** the agent has visual context

## Functional Requirements

- **FR-6.1**: Generate SKILL.md in AgentSkills format (spec-compliant)
- **FR-6.2**: Include parameters section with detected variables
- **FR-6.3**: Generate conditional workflows from detected conditions
- **FR-6.4**: Include verification checklist
- **FR-6.5**: Include troubleshooting section when applicable
- **FR-6.6**: Preview generated skill with markdown rendering
- **FR-6.7**: Edit skill inline with live preview
- **FR-6.8**: Choose export location (custom or workspace/skills)
- **FR-6.9**: Generate references/ folder with screenshots
- **FR-6.10**: Validate skill format before saving
- **FR-6.11**: Support skill regeneration with different settings

### Programmatic-First Automation Strategy
_Prefer API/DOM automation; fall back to image-based only when necessary_

#### Step Generation Priority
- **FR-6.12**: **Selector Priority**: For each click, prefer automation in this order:
  1. `id` attribute (most reliable)
  2. `data-testid` / `data-cy` (test-friendly attributes)
  3. Unique CSS selector (class + hierarchy)
  4. XPath (structural path)
  5. Text match (last resort DOM)
  6. Image-based click (fallback when DOM unavailable)

- **FR-6.13**: **API Detection**: If captured network shows API call immediately after click:
  - Include API endpoint in skill as "programmatic alternative"
  - Example: "Click Submit OR call POST /api/form"

- **FR-6.14**: **Fallback Instructions**: Each step includes:
  - Primary: DOM selector/API call
  - Fallback: Image-based or retry strategy
  - Example format in SKILL.md:
    ```
    1. Click the "Submit" button
       - Selector: `button#submit-form`
       - Fallback: Look for green button with text "Submit"
    ```

- **FR-6.15**: **Anti-Bot Awareness**: Detect and flag steps that may trigger anti-bot:
  - CAPTCHA forms
  - Rate-limited endpoints
  - CloudFlare challenges
  - Suggest human intervention or delay strategies

- **FR-6.16**: **Console Context**: Include relevant console logs in skill context:
  - Success messages (for verification)
  - Error patterns (for troubleshooting)

## Non-Functional Requirements

- **NFR-6.1**: Generated skill works with Claude Code without modification
- **NFR-6.2**: Skill body < 5000 tokens (per best practices)
- **NFR-6.3**: Generation time < 60 seconds

## Acceptance Criteria

### AC1: SKILL.md Generation
- [ ] Valid YAML frontmatter (name, description, compatibility)
- [ ] Parameters section with types and descriptions
- [ ] Step-by-step instructions with conditionals
- [ ] Verification checklist
- [ ] Context notes from annotations
- _Requirements: FR-6.1, FR-6.2, FR-6.3, FR-6.4_

### AC2: Variable Integration
- [ ] Variables from S07 appear in Parameters section
- [ ] Variables used with {name} syntax in instructions
- [ ] Default values shown as examples
- _Requirements: FR-6.2_

### AC3: Conditional Workflows
- [ ] "If X then Y" patterns rendered properly
- [ ] Multiple workflow paths shown clearly
- [ ] Decision points highlighted
- _Requirements: FR-6.3_

### AC4: Preview
- [ ] Shows rendered markdown
- [ ] Parses and shows frontmatter
- [ ] Copy to clipboard button
- [ ] Token count display
- _Requirements: FR-6.6_

### AC5: Editor
- [ ] Markdown editor with syntax highlighting
- [ ] Live preview side-by-side
- [ ] Undo/redo support
- [ ] Regenerate section button
- _Requirements: FR-6.7_

### AC6: Export Structure
- [ ] Creates skill-name/ folder
- [ ] SKILL.md inside folder
- [ ] references/ with screenshots if selected
- [ ] assets/ with templates if applicable
- _Requirements: FR-6.8, FR-6.9_

### AC7: Validation
- [ ] Validates YAML syntax
- [ ] Checks required fields
- [ ] Validates name format (lowercase, hyphens)
- [ ] Warns if body > 5000 tokens
- _Requirements: FR-6.10, NFR-6.2_

## Prompt Template

The skill generator uses a specialized prompt that:
1. Instructs Claude to be CONCISE (< 5000 tokens)
2. Includes all session context (steps, transcript, variables)
3. Requests specific sections (Parameters, Instructions, Verification)
4. Handles conditionals and context properly

See design.md for full prompt template.

## Dependencies
- S05: Processing
- S07: Variable Detection
- External: Claude API

## Files to Create
- src/lib/skill-generator.ts
- src/lib/prompt-templates.ts
- src/components/SkillPreview/SkillPreview.tsx
- src/components/SkillEditor/SkillEditor.tsx
- src/components/ExportDialog/ExportDialog.tsx
- src/lib/skill-validator.ts
