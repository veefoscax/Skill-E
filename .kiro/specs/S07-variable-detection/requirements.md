# S07: Variable Detection - Requirements

## Feature Description
Intelligent detection of variables, parameters, and dynamic content from demonstration recordings. Correlates speech patterns with user actions to identify what should become parametric inputs in the generated skill.

## User Stories

### US1: Automatic Variable Detection
**As a** skill creator
**I want** the system to automatically detect variables from my demonstration
**So that** the generated skill is reusable with different inputs

### US2: Variable Confirmation
**As a** skill creator
**I want** to review and confirm detected variables
**So that** I have control over what becomes parametric

### US3: Manual Variable Addition
**As a** skill creator
**I want** to manually add variables after detection
**So that** I can mark things the system missed

## Functional Requirements

- **FR-7.1**: Detect mentions of variable data in speech (names, IDs, selections)
- **FR-7.2**: Detect variable-like inputs from actions (text fields, dropdowns)
- **FR-7.3**: Correlate speech segments with actions to identify variables
- **FR-7.4**: Classify variable types (text, number, selection, file)
- **FR-7.5**: Suggest default values from demonstration
- **FR-7.6**: Allow user confirmation/rejection of detected variables
- **FR-7.7**: Allow manual variable addition/editing
- **FR-7.8**: Detect conditional patterns from speech ("if X then Y")

## Non-Functional Requirements

- **NFR-7.1**: Detection accuracy > 80% for common patterns
- **NFR-7.2**: Processing time < 10 seconds for 2-minute recording
- **NFR-7.3**: Support Portuguese and English speech

## Acceptance Criteria

### AC1: Speech-Based Detection
- [ ] Detects "o nome do cliente" as variable hint
- [ ] Detects "qualquer X" patterns
- [ ] Detects "depende de X" conditional patterns
- _Requirements: FR-7.1, FR-7.8_

### AC2: Action-Based Detection
- [ ] Text inputs in form fields suggest variables
- [ ] Dropdown selections suggest selection variables
- [ ] File uploads suggest file variables
- _Requirements: FR-7.2, FR-7.4_

### AC3: Correlation
- [ ] Speech + Action within 5 seconds = high confidence
- [ ] Correlates "digite o nome" + text input
- _Requirements: FR-7.3_

### AC4: User Interface
- [ ] Shows list of detected variables
- [ ] Allows rename, delete, mark as fixed
- [ ] Shows origin (speech snippet / action)
- [ ] Allows manual addition
- _Requirements: FR-7.6, FR-7.7_

## Dependencies
- S03: Audio Recording (transcription)
- S05: Processing (action detection)

## Files to Create
- src/lib/variable-detection.ts
- src/lib/speech-patterns.ts
- src/components/VariableConfirmation/VariableConfirmation.tsx
- src/types/variables.ts
