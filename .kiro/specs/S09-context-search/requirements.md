# S09: Context Search - Requirements

## Feature Description
Integration with Context7 MCP and web search to automatically fetch documentation for libraries, APIs, and tools mentioned during demonstration. Adds reference material to generated skills.

## User Stories

### US1: Auto-Detect Libraries
**As a** user
**I want** Skill-E to detect when I mention libraries or APIs
**So that** documentation is automatically included

### US2: Search Documentation
**As a** user
**I want** relevant documentation fetched automatically
**So that** the skill is self-contained and always works

### US3: Manual Doc Addition
**As a** user
**I want** to manually add documentation references
**So that** I can include specific resources

## Functional Requirements

- **FR-9.1**: Detect library/API mentions in transcription
- **FR-9.2**: Integrate with Context7 MCP for doc search
- **FR-9.3**: Fallback to web search (GitHub, official docs)
- **FR-9.4**: Extract relevant snippets from documentation
- **FR-9.5**: Add references section to generated skill
- **FR-9.6**: Allow manual URL addition for documentation
- **FR-9.7**: Cache fetched documentation locally
- **FR-9.8**: Include code examples from docs when relevant

## Non-Functional Requirements

- **NFR-9.1**: Doc fetch time < 10 seconds per library
- **NFR-9.2**: Cache docs for 24 hours
- **NFR-9.3**: Keep reference snippets < 500 tokens each

## Acceptance Criteria

### AC1: Library Detection
- [ ] Detects common libraries (pandas, react, etc.)
- [ ] Detects API mentions (REST, GraphQL endpoints)
- [ ] Detects tool mentions (git, docker, etc.)
- _Requirements: FR-9.1_

### AC2: Context7 Integration
- [ ] Sends query to Context7 MCP
- [ ] Receives relevant documentation
- [ ] Extracts usage examples
- _Requirements: FR-9.2_

### AC3: Fallback Search
- [ ] Falls back to web search if Context7 unavailable
- [ ] Searches GitHub repos for READMEs
- [ ] Searches official documentation sites
- _Requirements: FR-9.3_

### AC4: Skill Integration
- [ ] Adds "Technical References" section to SKILL.md
- [ ] Includes relevant code snippets
- [ ] Links to full documentation
- _Requirements: FR-9.5, FR-9.8_

### AC5: Manual Addition
- [ ] UI to add documentation URLs
- [ ] Fetches and extracts from provided URL
- [ ] User can edit extracted content
- _Requirements: FR-9.6_

## Dependencies
- S05: Processing (library detection from OCR/transcription)
- S06: Skill Export (references section)
- External: Context7 MCP, Web search API

## Files to Create
- src/lib/context-search.ts
- src/lib/library-detector.ts
- src/lib/doc-extractor.ts
- src/components/DocReferences/DocReferences.tsx

## Common Libraries to Detect

### Python
pandas, numpy, matplotlib, requests, flask, django, fastapi, sqlalchemy, pytest

### JavaScript
react, vue, angular, express, axios, lodash, moment, tailwind, vite

### Tools
git, docker, kubernetes, terraform, aws, gcloud, npm, pip, cargo

### Databases
postgresql, mysql, mongodb, redis, sqlite, elasticsearch
