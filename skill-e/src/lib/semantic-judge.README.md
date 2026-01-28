# Semantic Judge

LLM-based quality scoring and critique system for generated Agent Skills.

## Overview

The Semantic Judge compares the **original task goal** (from S05 processing) with the **generated skill** (from S06) to provide:

- **Quality Score** (0-100): Overall skill quality
- **Dimension Scores**: Safety, Clarity, Completeness
- **Structured Feedback**: Strengths, weaknesses, and recommendations
- **Verified Badge**: Visual indicator for high-quality skills (≥90)

## Requirements

- **FR-10.12**: LLM-based critique of generated skill vs user intent
- **FR-10.13**: Quality score (0-100) based on Clarity, Safety, and Completeness
- **FR-10.14**: Verified badge for high-scoring skills (>90)

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Semantic Judge                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Input: Task Goal + Generated Skill                         │
│              ↓                                               │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Build Critique Prompt                              │     │
│  │  - Include task goal                                │     │
│  │  - Include generated skill                          │     │
│  │  - Define evaluation criteria                       │     │
│  │  - Request structured JSON output                   │     │
│  └────────────────────────────────────────────────────┘     │
│              ↓                                               │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Call LLM Provider                                  │     │
│  │  - OpenRouter (default, free)                       │     │
│  │  - Anthropic (Claude)                               │     │
│  │  - OpenAI (GPT)                                     │     │
│  │  - Google (Gemini)                                  │     │
│  │  - Ollama (local)                                   │     │
│  └────────────────────────────────────────────────────┘     │
│              ↓                                               │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Parse Response                                     │     │
│  │  - Extract dimension scores                         │     │
│  │  - Extract feedback arrays                          │     │
│  │  - Calculate weighted score                         │     │
│  │  - Determine verified status                        │     │
│  └────────────────────────────────────────────────────┘     │
│              ↓                                               │
│  Output: SemanticValidationResult                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Evaluation Dimensions

### 1. Safety (Default Weight: 40%)

Evaluates whether the skill has proper guardrails:

- **PAUSE/CONFIRM markers** for destructive actions
- **Verification steps** to check success
- **Rollback instructions** if something goes wrong
- **Secure handling** of sensitive data (passwords, API keys)

**Scoring Guide:**
- 90-100: Excellent safety measures, multiple confirmations, clear rollback
- 70-89: Good safety, some confirmations, basic verification
- 50-69: Minimal safety, few confirmations, limited verification
- 0-49: Unsafe, no confirmations, no verification, potential for harm

### 2. Clarity (Default Weight: 35%)

Evaluates whether instructions are clear and easy to follow:

- **Clear and unambiguous** instructions
- **Numbered steps** that are easy to follow
- **Well-documented parameters** with examples
- **Clearly stated prerequisites**
- **Concise and professional** language

**Scoring Guide:**
- 90-100: Crystal clear, anyone could follow, excellent documentation
- 70-89: Clear, minor ambiguities, good documentation
- 50-69: Somewhat clear, some confusing parts, basic documentation
- 0-49: Confusing, ambiguous, poor documentation

### 3. Completeness (Default Weight: 25%)

Evaluates whether the skill covers all aspects of the task:

- **Covers all aspects** of the original task goal
- **Handles edge cases** and error conditions
- **Includes all necessary steps**
- **Provides troubleshooting tips**
- **Has verification steps** to confirm success

**Scoring Guide:**
- 90-100: Comprehensive, covers everything, handles edge cases
- 70-89: Complete, covers main path, some edge cases
- 50-69: Mostly complete, missing some steps or edge cases
- 0-49: Incomplete, missing critical steps or information

## Usage

### Basic Usage

```typescript
import { validateSkillSemantics } from './semantic-judge';

const result = await validateSkillSemantics(
  taskGoal,      // Original task description
  generatedSkill // Generated SKILL.md content
);

console.log(`Score: ${result.score}/100`);
console.log(`Verified: ${result.isVerified}`);
```

### With Custom Provider

```typescript
const result = await validateSkillSemantics(
  taskGoal,
  generatedSkill,
  {
    providerConfig: {
      type: 'anthropic',
      apiKey: 'sk-ant-...',
      model: 'claude-3-5-sonnet-20241022',
    }
  }
);
```

### With Custom Weights

```typescript
// Prioritize safety for destructive operations
const result = await validateSkillSemantics(
  taskGoal,
  generatedSkill,
  {
    weights: {
      safety: 0.6,      // 60%
      clarity: 0.25,    // 25%
      completeness: 0.15 // 15%
    }
  }
);
```

### Format as Markdown

```typescript
import { formatValidationResultMarkdown } from './semantic-judge';

const markdown = formatValidationResultMarkdown(result);
console.log(markdown);
```

## API Reference

### `validateSkillSemantics()`

Main validation function.

```typescript
async function validateSkillSemantics(
  taskGoal: string,
  generatedSkill: string,
  options?: SemanticValidationOptions
): Promise<SemanticValidationResult>
```

**Parameters:**
- `taskGoal`: Original task description from S05 processing
- `generatedSkill`: Generated SKILL.md content from S06
- `options`: Optional configuration

**Returns:** `SemanticValidationResult` with scores and feedback

### `SemanticValidationResult`

```typescript
interface SemanticValidationResult {
  score: number;              // Overall score (0-100)
  dimensions: {
    safety: number;           // Safety score (0-100)
    clarity: number;          // Clarity score (0-100)
    completeness: number;     // Completeness score (0-100)
  };
  strengths: string[];        // Identified strengths
  weaknesses: string[];       // Areas for improvement
  recommendations: string[];  // Specific recommendations
  isVerified: boolean;        // True if score >= 90
  rawResponse?: string;       // Raw LLM response
}
```

### `SemanticValidationOptions`

```typescript
interface SemanticValidationOptions {
  providerConfig?: ProviderConfig;  // LLM provider config
  weights?: {                       // Custom dimension weights
    safety: number;                 // Must sum to 1.0
    clarity: number;
    completeness: number;
  };
  temperature?: number;             // LLM temperature (default: 0.3)
  maxTokens?: number;               // Max response tokens (default: 2000)
}
```

### Helper Functions

```typescript
// Get letter grade from score
getGrade(score: number): string  // "A+", "B", "C-", etc.

// Get color for UI display
getScoreColor(score: number): string  // "green", "yellow", "orange", "red"

// Get descriptive label
getScoreLabel(score: number): string  // "Excellent", "Good", "Poor", etc.

// Format result as markdown
formatValidationResultMarkdown(result: SemanticValidationResult): string
```

## Default Configuration

### Provider

- **Type**: OpenRouter (free tier)
- **Model**: `google/gemma-2-9b-it:free`
- **Temperature**: 0.3 (for consistency)
- **Max Tokens**: 2000

### Weights

- **Safety**: 40% (most important)
- **Clarity**: 35% (very important)
- **Completeness**: 25% (important but can be iterated)

## Examples

See `semantic-judge.example.ts` for comprehensive examples:

1. **Basic Validation** - Default settings with OpenRouter
2. **Custom Provider** - Using Claude for sophisticated critique
3. **Custom Weights** - Prioritizing safety for destructive actions
4. **Format Markdown** - Displaying results in UI
5. **Batch Validation** - Comparing multiple skill versions
6. **Integration Workflow** - Full generate → validate → improve flow

## Testing

Run tests with:

```bash
npm test -- semantic-judge.test.ts
```

Tests cover:
- High, medium, and low quality skills
- Custom weights and validation
- Error handling (invalid JSON, malformed responses)
- Score clamping and feedback limiting
- Markdown formatting
- Helper functions (grade, color, label)

## Integration Points

### S05: Processing

The task goal comes from the processing pipeline:

```typescript
const taskGoal = optimizedContext.taskGoal;
```

### S06: Skill Export

The generated skill comes from the skill generator:

```typescript
const generatedSkill = skillResult.markdown;
```

### S10: Skill Validation

The semantic judge is used in the validation UI:

```typescript
const validation = await validateSkillSemantics(
  session.taskGoal,
  skill.markdown
);

if (validation.isVerified) {
  showVerifiedBadge();
} else {
  showImprovementSuggestions(validation.recommendations);
}
```

## Performance

- **Latency**: 2-5 seconds (depends on LLM provider)
- **Cost**: Free with OpenRouter, ~$0.01-0.03 with Claude/GPT
- **Accuracy**: High consistency with temperature=0.3

## Error Handling

The semantic judge handles errors gracefully:

- **Invalid JSON**: Returns default result with error message
- **LLM timeout**: Throws error with clear message
- **Invalid weights**: Throws error before calling LLM
- **Missing API key**: Throws error with helpful message

## Future Improvements

- [ ] Cache validation results to avoid re-validating unchanged skills
- [ ] Support for custom evaluation criteria
- [ ] Multi-language support for feedback
- [ ] Confidence scores for each dimension
- [ ] Comparison mode (validate multiple versions side-by-side)
- [ ] Historical tracking (see how scores improve over time)

## License

Apache-2.0
