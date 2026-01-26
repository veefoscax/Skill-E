# S08: LLM Providers - Requirements

## Feature Description
Simplified multi-provider LLM integration with only essential providers. Prioritizes integration with tools the user already has subscriptions for (Antigravity, Claude Code) to avoid extra costs.

## User Stories

### US1: Provider Selection
**As a** user
**I want** to choose from the most common LLM providers
**So that** I can use what I already have

### US2: Free Demo Mode
**As a** hackathon evaluator
**I want** to test the app with free models
**So that** I can evaluate without API costs

### US3: Use Existing Subscriptions
**As a** user
**I want** to use my existing Claude/GPT subscriptions
**So that** I don't pay twice

## Supported Providers (Essential Only)

| Provider | Type | Use Case |
|----------|------|----------|
| **OpenRouter** | Agregador | 🆓 Free tier for demos |
| **Anthropic** | Direct | Claude API (production) |
| **OpenAI** | Direct | GPT-4 (fallback) |
| **Google** | Direct | Gemini (alternative) |
| **Ollama** | Local | 🆓 Free, offline |
| **Antigravity** | Integration | Uses existing subscription |
| **Claude Code** | Integration | Uses existing subscription |

## Functional Requirements

- **FR-8.1**: Support 5 core providers (OpenRouter, Anthropic, OpenAI, Google, Ollama)
- **FR-8.2**: Factory pattern for provider instantiation
- **FR-8.3**: API key management with secure storage
- **FR-8.4**: Provider settings UI with test connection
- **FR-8.5**: OpenRouter free tier as default for demos
- **FR-8.6**: Streaming responses for better UX
- **FR-8.7**: Integration with Antigravity (if available)
- **FR-8.8**: Integration with Claude Code (if available)

## Non-Functional Requirements

- **NFR-8.1**: Response time < 30 seconds for typical requests
- **NFR-8.2**: Secure API key storage
- **NFR-8.3**: Auto-detect available integrations

## Acceptance Criteria

### AC1: Core Providers
- [ ] OpenRouter works with free models
- [ ] Anthropic works with Claude API
- [ ] OpenAI works with GPT-4
- [ ] Google works with Gemini
- [ ] Ollama works locally
- _Requirements: FR-8.1_

### AC2: Free Demo
- [ ] OpenRouter is default for new installs
- [ ] Free models available: gemma, llama, mistral
- [ ] Works without any API key configuration
- _Requirements: FR-8.5_

### AC3: Existing Subscriptions
- [ ] Detects Antigravity availability
- [ ] Detects Claude Code availability
- [ ] Routes requests through existing subscription
- _Requirements: FR-8.7, FR-8.8_

### AC4: Streaming
- [ ] Responses stream to UI progressively
- [ ] Shows generation progress
- _Requirements: FR-8.6_

## Dependencies
- S01: App Core (for settings storage)

## Files to Create
- src/lib/providers/types.ts
- src/lib/providers/base-provider.ts
- src/lib/providers/factory.ts
- src/lib/providers/openrouter.ts
- src/lib/providers/anthropic.ts
- src/lib/providers/openai.ts
- src/lib/providers/google.ts
- src/lib/providers/ollama.ts
- src/stores/provider.ts
- src/components/settings/ProviderSettings.tsx

## OpenRouter Free Models (Priority)

For hackathon demo, use these free models:
- `google/gemma-2-9b-it:free` (default)
- `meta-llama/llama-3.1-8b-instruct:free`
- `mistralai/mistral-7b-instruct:free`
- `microsoft/phi-3-mini-128k-instruct:free`
