# S09: Context Search - Implementation Tasks

> **Reference Workflow**: See `.kiro/steering/workflow.md` for execution guidelines.

## Overview

Implements automatic documentation lookup for libraries and APIs mentioned during demonstration. Uses Context7 MCP with web search fallback.

---

## Phase 1: Library Detection

- [x] 1. Detection Types
  - Create src/types/context-search.ts
  - Define DetectedLibrary interface
  - Define DocReference interface
  - Define DocSearchResult interface
  - _Requirements: FR-9.1_

- [x] 2. Library Detector
  - Create src/lib/library-detector.ts
  - Implement pattern matching for imports
  - Detect library names from OCR code
  - Detect from speech patterns
  - Support Python, JavaScript, tools
  - _Requirements: FR-9.1_

- [x] 3. Known Libraries Database
  - Create library patterns config
  - Map library names to documentation URLs
  - Include usage patterns for detection
  - Cover common libraries (pandas, react, etc.)
  - _Requirements: FR-9.1_

## Phase 2: Context7 Integration

- [x] 4. MCP Client Setup
  - Create src/lib/context-search.ts
  - Implement Context7 MCP client
  - Handle connection and authentication
  - _Requirements: FR-9.2_

- [x] 5. Query Builder
  - Build contextual queries from:
    - Library name
    - Usage context from transcription
    - Code snippets from OCR
  - Format for Context7 API
  - _Requirements: FR-9.2_

- [x] 6. Response Parser
  - Parse Context7 response
  - Extract relevant snippets
  - Extract code examples
  - Limit to 500 tokens per reference
  - _Requirements: FR-9.2, NFR-9.3_

## Phase 3: Web Search Fallback

- [x] 7. GitHub Search
  - Create src/lib/doc-extractor.ts
  - Search GitHub for library READMEs
  - Fetch and parse README.md
  - Extract relevant sections
  - _Requirements: FR-9.3_

- [x] 8. DevDocs Integration
  - Search devdocs.io API (if available)
  - Fallback to official docs URLs
  - Handle common documentation sites
  - _Requirements: FR-9.3_

- [x] 9. Fallback Logic
  - Try Context7 first
  - Fall back to web search on failure
  - Merge results from multiple sources
  - Rank by relevance
  - _Requirements: FR-9.3_

## Phase 4: Caching

- [x] 10. Cache Implementation
  - Cache fetched docs locally
  - Set 24-hour expiration
  - Use IndexedDB or Tauri storage
  - Evict stale entries
  - _Requirements: FR-9.7, NFR-9.2_

## Phase 5: Skill Integration

- [x] 11. References Section Generator
  - Format DocReferences for SKILL.md
  - Include markdown code blocks
  - Add source links
  - Keep snippets concise
  - _Requirements: FR-9.5, FR-9.8_

- [x] 12. Add to Skill Export
  - Integrate with S06 skill generator
  - Add "Technical References" section
  - Include in prompt context
  - _Requirements: FR-9.5_

## Phase 6: Manual Addition UI

- [x] 13. Doc References Component
  - Create src/components/DocReferences/DocReferences.tsx
  - Display detected libraries
  - Show fetched references
  - Edit/remove controls
  - _Requirements: FR-9.6_

- [x] 14. Manual URL Input
  - Add URL input field
  - Fetch and extract from URL
  - Allow content editing
  - Add to references list
  - _Requirements: FR-9.6_

## Phase 7: Testing

- [x] 15. Detection Testing
  - Test library detection with sample transcripts
  - Verify pattern matching accuracy
  - Test edge cases (similar names)
  - _Requirements: FR-9.1_

- [x] 16. Integration Testing
  - Test Context7 if available
  - Test web search fallback
  - Test skill generation with references
  - Verify cache works
  - _Requirements: All_

- [x] 17. Checkpoint - Verify Phase Complete
  - Ensure all tests pass, ask the user if questions arise.

---

## Success Criteria

- Detects common libraries from transcript/OCR
- Fetches relevant documentation automatically
- References section appears in generated skill
- Manual URL addition works
- Cache reduces redundant fetches

## Notes

- Context7 MCP may not be available everywhere
- Web fallback is critical for reliability
- Keep snippets short to respect token budget
- Consider rate limits on GitHub API
- This is lower priority than core features
