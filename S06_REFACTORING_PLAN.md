# S06 Refactoring Plan: Multi-Provider Support & Prompt Optimization

## Executive Summary

The current S06 implementation has several gaps that limit its effectiveness and flexibility:

1. **Prompt Quality Issues**: Not following industry best practices for LLM prompts (no XML tags, too verbose, missing examples)
2. **Limited API Support**: Only Anthropic, OpenAI, and OpenRouter implemented - missing Zifu AI (GLM), Kimi, Google Anti-Gravity
3. **SKILL.md Structure**: Not optimized for token efficiency and progressive disclosure
4. **No Provider-Agnostic Architecture**: Hard-coded provider-specific logic

## Critical Findings from Research

### 1. Prompt Engineering Best Practices (from docs)

**❌ Current Approach (Problems):**
- Prompt is ~3000+ tokens without examples
- No XML tag structure
- Verbose descriptions instead of concise templates
- No few-shot examples embedded
- "BE CONCISE" instruction ignored by model

**✅ Recommended Approach:**
- Use XML tags as "boundary markers" (`<context>`, `<instructions>`, `<example>`)
- Follow "Tool to X. Use when Y." pattern (10x reduction in tool failures)
- Include 1-3 few-shot examples for complex formatting
- Keep tool descriptions under 1024 chars (OpenAI limit for good reason)
- Hierarchical loading: Skill summary → Step details → Full logs (on demand)

### 2. Multi-Provider Architecture

**Current Providers Supported:**
- Anthropic (Claude) - ✅ Implemented
- OpenAI (GPT) - ✅ Implemented  
- OpenRouter - ✅ Implemented
- Ollama - ❌ Interface only

**Missing Providers (User Needs):**
- **Zifu AI** (GLM models) - Uses OpenAI-compatible API
- **Kimi Code** (Moonshot) - Uses OpenAI-compatible API with differences
- **Google Anti-Gravity** - Likely Gemini/Vertex AI

**Key Insight**: Most Chinese providers use OpenAI-compatible APIs with minor differences:
- Different base URLs
- Different auth header formats
- Different parameter names (max_tokens vs maxTokens)
- Some require special headers (Referer, App-ID)

### 3. SKILL.md Optimization

**Current Issues:**
- SKILL.md body is often 3000+ tokens
- All content in one file (no progressive disclosure)
- No external references/ folder structure
- Missing guardrails section

**Recommended Structure:**
```
skill-name/
├── SKILL.md (200-300 lines max)
├── references/
│   ├── detailed-steps.md
│   ├── troubleshooting.md
│   └── api-reference.md
└── assets/
    └── templates/
```

## Action Plan

### Phase 1: Refactor Prompt System (Priority: HIGH)

**1.1 Create New Prompt Builder Module**
```typescript
src/lib/prompts/
├── index.ts           # Main exports
├── builder.ts         # PromptBuilder class
├── templates.ts       # Prompt templates
├── examples.ts        # Few-shot examples
└── types.ts           # Type definitions
```

**1.2 Implement XML-Based Prompt Structure**
```xml
<skill_generation_task>
  <context>
    <recording_metadata>
      <duration>120s</duration>
      <application>Chrome</application>
    </recording_metadata>
    <task_goal>Login to dashboard and export report</task_goal>
    <key_steps count="5">
      <!-- Only key steps, not all -->
    </key_steps>
    <detected_variables>
      <variable name="username" type="string" />
    </detected_variables>
  </context>
  
  <instructions>
    1. Generate SKILL.md following AgentSkills.io spec
    2. Use variables with {varname} syntax
    3. Include guardrails section
    4. Keep under 500 lines
  </instructions>
  
  <example>
    <input>[context with login task]</input>
    <output>
      ---
      name: dashboard-login
      description: "Login to admin dashboard. Use when user asks to 'login', 'access dashboard', or 'sign in'."
      ---
      ...
    </output>
  </example>
</skill_generation_task>
```

**1.3 Add Few-Shot Examples**
- Include 2-3 complete examples of good SKILL.md outputs
- Show handling of variables, conditionals, different task types
- Reduces errors by providing "pattern to follow"

### Phase 2: Multi-Provider Architecture (Priority: HIGH)

**2.1 Create Provider Abstraction Layer**
```typescript
src/lib/llm/
├── index.ts
├── types.ts           # Common types
├── base-provider.ts   # Abstract base class
├── providers/
│   ├── anthropic.ts
│   ├── openai.ts
│   ├── openrouter.ts
│   ├── zifu.ts        # NEW - GLM models
│   ├── kimi.ts        # NEW - Moonshot
│   └── google.ts      # NEW - Gemini
└── factory.ts         # Provider factory
```

**2.2 Provider Configuration System**
```typescript
interface ProviderConfig {
  name: string;
  baseUrl: string;
  authHeader: string;
  authPrefix?: string;
  models: string[];
  specialHeaders?: Record<string, string>;
  parameterMapping?: {
    maxTokens?: string;
    temperature?: string;
  };
  responsePath: string; // Path to extract text from response
}
```

**2.3 Implement Missing Providers**

**Zifu AI (GLM-4, GLM-4V)**
- Base URL: `https://api.zifu.ai/v1` or similar
- OpenAI-compatible
- May need custom headers

**Kimi Code (Moonshot)**
- Base URL: `https://api.moonshot.cn/v1`
- OpenAI-compatible
- Supports streaming

**Google (Gemini/Anti-Gravity)**
- Base URL: `https://generativelanguage.googleapis.com`
- Different API format (contents vs messages)
- Different auth (API key in query param)

### Phase 3: SKILL.md Structure Optimization (Priority: MEDIUM)

**3.1 Create Skill Template System**
```typescript
src/lib/skill-templates/
├── index.ts
├── minimal.ts         # For simple tasks
├── standard.ts        # Default template
├── complex.ts         # For multi-step workflows
└── types.ts
```

**3.2 Implement Progressive Disclosure**
- Generate SKILL.md with references/ folder
- Split long content into external files
- Include only "Quick Start" + "Decision Tree" in main file

**3.3 Add Guardrails Section**
Mandatory sections in generated SKILL.md:
```markdown
## What This Covers ✅
- Specific capability 1
- Specific capability 2

## What This Does NOT Cover ❌
- Out of scope item 1
- Out of scope item 2

## Never Do ⚠️
- [ ] Never do X
- [ ] Never do Y
```

### Phase 4: Testing & Validation (Priority: MEDIUM)

**4.1 Create Provider Test Suite**
- Test each provider with same prompt
- Verify output format consistency
- Check token usage differences

**4.2 Create Prompt Quality Metrics**
```typescript
interface PromptQualityMetrics {
  tokenCount: number;
  clarity: number;      // Heuristic based on structure
  exampleCount: number;
  instructionCount: number;
}
```

## Implementation Priority

### Week 1: Prompt Refactoring
1. [ ] Create prompt builder module
2. [ ] Implement XML-based structure
3. [ ] Add few-shot examples
4. [ ] Test with existing recordings

### Week 2: Multi-Provider Support
1. [ ] Create provider abstraction
2. [ ] Implement Zifu AI provider
3. [ ] Implement Kimi provider  
4. [ ] Implement Google provider
5. [ ] Add provider configuration UI

### Week 3: SKILL.md Optimization
1. [ ] Create template system
2. [ ] Implement progressive disclosure
3. [ ] Add guardrails generation
4. [ ] Update export to create references/ folder

### Week 4: Testing & Polish
1. [ ] Test all providers
2. [ ] Validate prompt quality
3. [ ] Measure token efficiency
4. [ ] Update documentation

## Key Technical Decisions

### 1. Provider Abstraction Pattern
Use Strategy pattern with factory:
```typescript
abstract class BaseLLMProvider {
  abstract generate(prompt: string, options: GenerateOptions): Promise<string>;
  abstract stream(prompt: string, options: StreamOptions): AsyncIterator<string>;
  abstract getModels(): string[];
}

class ProviderFactory {
  create(provider: string, config: ProviderConfig): BaseLLMProvider {
    switch(provider) {
      case 'anthropic': return new AnthropicProvider(config);
      case 'zifu': return new ZifuProvider(config);
      // ...
    }
  }
}
```

### 2. Prompt Template Strategy
Use tagged template literals:
```typescript
const prompt = buildSkillPrompt`
  <context>
    <task>${task}</task>
    <steps>${steps.map(s => `<step>${s}</step>`).join('')}</steps>
  </context>
  ${includeExamples ? EXAMPLES : ''}
`;
```

### 3. SKILL.md Generation Strategy
Two-phase generation:
1. Generate minimal SKILL.md with core instructions
2. If content > 500 lines, split into references/

## Success Metrics

| Metric | Before | Target | How to Measure |
|--------|--------|--------|----------------|
| Prompt tokens | ~3000 | <1500 | Token counter |
| Provider support | 3 | 6+ | Provider enum count |
| SKILL.md size | 3000+ tokens | <2000 tokens | Generated file size |
| Tool selection accuracy | Unknown | >90% | Manual testing |
| Generation success rate | Unknown | >95% | Error rate tracking |

## Open Questions

1. **Zifu AI API Details**: Need exact base URL and authentication method
2. **Google Anti-Gravity**: Is this Vertex AI or Gemini? Need API spec
3. **Kimi Model Names**: What are the available model IDs?
4. **Cost Comparison**: Should we track token costs per provider?

## Next Steps

1. Review this plan with team
2. Get API credentials for Zifu, Kimi, Google
3. Start Phase 1 implementation
4. Create test recordings for validation
