# S08: LLM Providers - Implementation Tasks

> **Reference Workflow**: See `.kiro/steering/workflow.md` for execution guidelines.

## Overview

Implements simplified multi-provider LLM support with only 5 essential providers. Prioritizes OpenRouter free tier and integration with existing subscriptions (Antigravity, Claude Code).

---

## Phase 1: Types and Base

- [ ] 1. Provider Types (Simplified)
  - Create src/lib/providers/types.ts
  - Define only 5 ProviderTypes
  - Define Provider interface
  - Define ProviderConfig interface
  - _Requirements: FR-8.1_

- [ ] 2. Base Provider
  - Create src/lib/providers/base-provider.ts
  - Implement shared streaming logic
  - Implement error handling
  - Implement connection test base
  - _Requirements: FR-8.2_

## Phase 2: Core Providers

- [ ] 3. OpenRouter Provider (Priority)
  - Create src/lib/providers/openrouter.ts
  - Works without API key (free models)
  - Default provider for new installs
  - Include free model list
  - Test with gemma-2-9b-it:free
  - _Requirements: FR-8.5_

- [ ] 4. Anthropic Provider
  - Create src/lib/providers/anthropic.ts
  - Adapt from SidePilot
  - Support Claude 3.5 Sonnet
  - Streaming support
  - _Requirements: FR-8.1_

- [ ] 5. OpenAI Provider
  - Create src/lib/providers/openai.ts
  - Adapt from SidePilot
  - Support GPT-4
  - Streaming support
  - _Requirements: FR-8.1_

- [ ] 6. Google Provider
  - Create src/lib/providers/google.ts
  - Adapt from SidePilot
  - Support Gemini 1.5
  - Streaming support
  - _Requirements: FR-8.1_

- [ ] 7. Ollama Provider
  - Create src/lib/providers/ollama.ts
  - Adapt from SidePilot
  - Local, no API key needed
  - Good for offline/free usage
  - _Requirements: FR-8.1_

## Phase 3: Provider Factory

- [ ] 8. Factory (Simplified)
  - Create src/lib/providers/factory.ts
  - Only 5 providers in registry
  - createProvider(type) function
  - getProviderInfo() for UI
  - _Requirements: FR-8.2_

## Phase 4: Storage

- [ ] 9. Provider Store
  - Create src/stores/provider.ts
  - Persist selected provider
  - Persist API keys securely
  - Default to OpenRouter
  - _Requirements: FR-8.3_

## Phase 5: Settings UI

- [ ] 10. Provider Settings
  - Create src/components/settings/ProviderSettings.tsx
  - Dropdown with 5 providers
  - API key input (hidden for OpenRouter free)
  - Model selector
  - Test connection button
  - _Requirements: FR-8.4_

## Phase 6: Integrations

- [ ] 11. Integration Detection
  - Create src/lib/integrations.ts
  - Detect Antigravity availability
  - Detect Claude Code availability
  - Auto-detect on app start
  - _Requirements: FR-8.7, FR-8.8, NFR-8.3_

- [ ] 12. Antigravity Integration
  - If detected, add as provider option
  - Route requests through Antigravity
  - Use existing Google subscription
  - _Requirements: FR-8.7_

- [ ] 13. Claude Code Integration
  - If detected, add as provider option
  - Route requests through Claude Code
  - Use existing Anthropic subscription
  - _Requirements: FR-8.8_

## Phase 7: Streaming

- [ ] 14. Stream Handler
  - Implement async generator pattern
  - Parse SSE responses
  - Yield chunks to UI
  - Handle errors mid-stream
  - _Requirements: FR-8.6_

## Phase 8: Testing

- [ ] 15. Provider Testing
  - Test OpenRouter with free model (no key)
  - Test other providers with API keys
  - Verify streaming works
  - Test connection test feature
  - _Requirements: All_

- [ ] 16. Checkpoint - Verify Phase Complete
  - Ensure all tests pass, ask the user if questions arise.

---

## Success Criteria

- OpenRouter works with free tier (no API key)
- All 5 providers can connect and stream
- API keys stored securely
- Antigravity/Claude Code detected when available
- Settings UI is simple and clear

## Notes

- Only 5 providers, not 40+ (keep it simple!)
- OpenRouter is priority for hackathon (free tier)
- Antigravity/Claude Code use existing subscriptions
- Copy minimal code from SidePilot, remove the rest
