# S07: Variable Detection - Implementation Tasks

> **Reference Workflow**: See `.kiro/steering/workflow.md` for execution guidelines.

## Overview

Implements intelligent variable detection from demonstration recordings, correlating speech patterns with user actions to identify parametric inputs.

---

## Phase 1: Type Definitions

- [ ] 1. Variable Types
  - Create src/types/variables.ts
  - Define VariableHint interface
  - Define VariableOrigin interface
  - Define ConditionalHint interface
  - Define VariableType enum
  - _Requirements: FR-7.4_

## Phase 2: Speech Pattern Matching

- [ ] 2. Pattern Definitions
  - Create src/lib/speech-patterns.ts
  - Define Portuguese variable patterns (10+ patterns)
  - Define English variable patterns (10+ patterns)
  - Define conditional patterns (5+ patterns)
  - Define context patterns (5+ patterns)
  - _Requirements: FR-7.1, FR-7.8, NFR-7.3_

- [ ] 3. Pattern Matcher
  - Implement extractSpeechVariables() function
  - Extract variable hints from transcript text
  - Assign confidence scores based on pattern match
  - Return suggested variable names and types
  - _Requirements: FR-7.1_

## Phase 3: Action Analysis

- [ ] 4. Action Variable Extractor
  - Create extractActionVariables() function
  - Detect text input actions → text variables
  - Detect dropdown/select actions → selection variables
  - Detect file upload actions → file variables
  - Use OCR text to get field names
  - _Requirements: FR-7.2, FR-7.4_

## Phase 4: Correlation Engine

- [ ] 5. Correlation Algorithm
  - Create src/lib/variable-detection.ts
  - Implement correlateVariables() main function
  - Use 5-second correlation window
  - Match speech hints with action hints
  - Calculate combined confidence scores
  - _Requirements: FR-7.3_

- [ ] 6. Deduplication
  - Implement deduplicateHints() function
  - Merge similar variables
  - Keep highest confidence version
  - Preserve origins for merged hints
  - _Requirements: FR-7.3_

## Phase 5: LLM Enhancement (Optional)

- [ ] 7. Semantic Analysis
  - Create enhanceWithLLM() function (optional)
  - Send edge cases to Claude for analysis
  - Extract implicit variables from context
  - Only use when pattern matching fails
  - _Requirements: NFR-7.1_

## Phase 6: User Interface

- [ ] 8. Variable Confirmation Component
  - Create src/components/VariableConfirmation/VariableConfirmation.tsx
  - Display detected variables with confidence indicators
  - Show origin (speech snippet / action)
  - Add rename, delete, mark as fixed controls
  - Highlight low-confidence detections
  - _Requirements: FR-7.6_

- [ ] 9. Manual Variable Addition
  - Create AddVariable dialog component
  - Form with name, type, default value, description
  - Validate variable name format
  - Add to confirmed list
  - _Requirements: FR-7.7_

- [ ] 10. Variable Editing
  - Edit existing variable inline
  - Change type with dropdown
  - Edit default value
  - Edit description
  - _Requirements: FR-7.7_

## Phase 7: Testing

- [ ] 11. Pattern Testing
  - Test speech patterns with sample transcripts
  - Test Portuguese and English patterns
  - Verify confidence scoring
  - _Requirements: NFR-7.3_

- [ ] 12. Correlation Testing
  - Test with mock transcript + actions
  - Verify correlation window works
  - Test deduplication
  - _Requirements: FR-7.3_

- [ ] 13. Checkpoint - Verify Phase Complete
  - Ensure all tests pass, ask the user if questions arise.

---

## Success Criteria

- Detects > 80% of obvious variables (names, IDs, selections)
- Processing completes in < 10 seconds
- UI clearly shows variable origins
- User can easily confirm/reject/edit variables

## Notes

- Start with rule-based detection, add LLM later
- Portuguese patterns are priority (user's language)
- Confidence score helps user prioritize review
- Low confidence = needs human review
