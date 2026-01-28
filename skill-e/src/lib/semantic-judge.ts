/**
 * Semantic Judge
 * 
 * LLM-based quality scoring and critique for generated skills.
 * Compares the original task goal with the generated skill to assess
 * Safety, Clarity, and Completeness.
 * 
 * Requirements: FR-10.12, FR-10.13
 */

import type { Provider, Message } from './providers/types';
import { createProvider } from './providers/factory';
import type { ProviderConfig } from './providers/types';

/**
 * Semantic validation result
 */
export interface SemanticValidationResult {
  /** Overall quality score (0-100) */
  score: number;
  
  /** Dimension scores */
  dimensions: {
    /** Safety score (0-100) - Are there proper guardrails and confirmations? */
    safety: number;
    
    /** Clarity score (0-100) - Are instructions clear and unambiguous? */
    clarity: number;
    
    /** Completeness score (0-100) - Does it cover all aspects of the task? */
    completeness: number;
  };
  
  /** Strengths identified in the skill */
  strengths: string[];
  
  /** Weaknesses and areas for improvement */
  weaknesses: string[];
  
  /** Specific recommendations for improvement */
  recommendations: string[];
  
  /** Whether the skill is production-ready (score >= 90) */
  isVerified: boolean;
  
  /** Raw LLM response for debugging */
  rawResponse?: string;
}

/**
 * Options for semantic validation
 */
export interface SemanticValidationOptions {
  /** Provider configuration (defaults to OpenRouter if not specified) */
  providerConfig?: ProviderConfig;
  
  /** Custom weights for dimensions (must sum to 1.0) */
  weights?: {
    safety: number;
    clarity: number;
    completeness: number;
  };
  
  /** Temperature for LLM (default: 0.3 for consistency) */
  temperature?: number;
  
  /** Maximum tokens for response (default: 2000) */
  maxTokens?: number;
}

/**
 * Default dimension weights
 * Safety is weighted highest as it's critical for production use
 */
const DEFAULT_WEIGHTS = {
  safety: 0.4,      // 40% - Most important
  clarity: 0.35,    // 35% - Very important
  completeness: 0.25, // 25% - Important but can be iterated
};

/**
 * Default provider configuration
 * Uses OpenRouter with a free model for demos
 */
const DEFAULT_PROVIDER_CONFIG: ProviderConfig = {
  type: 'openrouter',
  model: 'google/gemma-2-9b-it:free',
  temperature: 0.3,
  maxTokens: 2000,
};

/**
 * Validate a generated skill against the original task goal
 * 
 * @param taskGoal - Original task description/goal from S05 processing
 * @param generatedSkill - Generated SKILL.md content from S06
 * @param options - Validation options
 * @returns Semantic validation result with scores and feedback
 * 
 * @example
 * ```typescript
 * const result = await validateSkillSemantics(
 *   "Create a new GitHub repository",
 *   skillMarkdown,
 *   {
 *     providerConfig: {
 *       type: 'anthropic',
 *       apiKey: 'sk-ant-...',
 *       model: 'claude-3-5-sonnet-20241022',
 *     }
 *   }
 * );
 * 
 * console.log(`Score: ${result.score}/100`);
 * console.log(`Verified: ${result.isVerified}`);
 * ```
 */
export async function validateSkillSemantics(
  taskGoal: string,
  generatedSkill: string,
  options: SemanticValidationOptions = {}
): Promise<SemanticValidationResult> {
  // Merge options with defaults
  const weights = options.weights || DEFAULT_WEIGHTS;
  const providerConfig = options.providerConfig || DEFAULT_PROVIDER_CONFIG;
  
  // Validate weights sum to 1.0
  const weightSum = weights.safety + weights.clarity + weights.completeness;
  if (Math.abs(weightSum - 1.0) > 0.01) {
    throw new Error(`Weights must sum to 1.0, got ${weightSum}`);
  }
  
  // Create provider
  const provider = createProvider({
    ...providerConfig,
    temperature: options.temperature ?? providerConfig.temperature ?? 0.3,
    maxTokens: options.maxTokens ?? providerConfig.maxTokens ?? 2000,
  });
  
  // Build the critique prompt
  const prompt = buildCritiquePrompt(taskGoal, generatedSkill);
  
  // Call LLM
  const response = await callLLM(provider, prompt, {
    temperature: options.temperature ?? 0.3,
    maxTokens: options.maxTokens ?? 2000,
  });
  
  // Parse the response
  const result = parseValidationResponse(response, weights);
  
  return result;
}

/**
 * Build the semantic critique prompt
 * 
 * @param taskGoal - Original task goal
 * @param generatedSkill - Generated skill markdown
 * @returns Prompt for LLM
 */
function buildCritiquePrompt(taskGoal: string, generatedSkill: string): string {
  return `# Task: Semantic Skill Validation

You are an expert at evaluating Agent Skills for quality, safety, and completeness.
Your job is to compare the **Original Task Goal** with the **Generated Skill** and provide
a structured critique.

## Original Task Goal

The user wanted to accomplish this:

\`\`\`
${taskGoal}
\`\`\`

## Generated Skill

Here is the skill that was generated from the demonstration:

\`\`\`markdown
${generatedSkill}
\`\`\`

## Evaluation Criteria

Evaluate the skill on three dimensions:

### 1. Safety (0-100)
- Are there proper PAUSE/CONFIRM markers for destructive actions?
- Are there guardrails to prevent mistakes?
- Are there verification steps to check success?
- Are there rollback instructions if something goes wrong?
- Are sensitive data (passwords, API keys) handled securely?

**Scoring Guide:**
- 90-100: Excellent safety measures, multiple confirmations, clear rollback
- 70-89: Good safety, some confirmations, basic verification
- 50-69: Minimal safety, few confirmations, limited verification
- 0-49: Unsafe, no confirmations, no verification, potential for harm

### 2. Clarity (0-100)
- Are instructions clear and unambiguous?
- Are steps numbered and easy to follow?
- Are parameters well-documented with examples?
- Are prerequisites clearly stated?
- Is the language concise and professional?

**Scoring Guide:**
- 90-100: Crystal clear, anyone could follow, excellent documentation
- 70-89: Clear, minor ambiguities, good documentation
- 50-69: Somewhat clear, some confusing parts, basic documentation
- 0-49: Confusing, ambiguous, poor documentation

### 3. Completeness (0-100)
- Does the skill cover all aspects of the original task goal?
- Are edge cases and error conditions handled?
- Are all necessary steps included?
- Are there troubleshooting tips?
- Are there verification steps to confirm success?

**Scoring Guide:**
- 90-100: Comprehensive, covers everything, handles edge cases
- 70-89: Complete, covers main path, some edge cases
- 50-69: Mostly complete, missing some steps or edge cases
- 0-49: Incomplete, missing critical steps or information

## Output Format

Provide your evaluation in the following JSON format:

\`\`\`json
{
  "safety": <score 0-100>,
  "clarity": <score 0-100>,
  "completeness": <score 0-100>,
  "strengths": [
    "Specific strength 1",
    "Specific strength 2",
    "Specific strength 3"
  ],
  "weaknesses": [
    "Specific weakness 1",
    "Specific weakness 2",
    "Specific weakness 3"
  ],
  "recommendations": [
    "Specific recommendation 1",
    "Specific recommendation 2",
    "Specific recommendation 3"
  ]
}
\`\`\`

## Important Guidelines

1. **Be Specific**: Don't say "good documentation" - say "Parameters table includes types, examples, and clear descriptions"
2. **Be Constructive**: Focus on actionable improvements, not just criticism
3. **Be Honest**: If something is missing or unclear, say so
4. **Be Consistent**: Use the scoring guides above
5. **Be Concise**: Keep each point to 1-2 sentences

## Output

Provide ONLY the JSON object, no additional text or explanation.
`;
}

/**
 * Call LLM provider and collect response
 * 
 * @param provider - LLM provider instance
 * @param prompt - Critique prompt
 * @param options - Chat options
 * @returns LLM response text
 */
async function callLLM(
  provider: Provider,
  prompt: string,
  options: { temperature?: number; maxTokens?: number }
): Promise<string> {
  const messages: Message[] = [
    {
      role: 'user',
      content: prompt,
    },
  ];
  
  let fullResponse = '';
  
  try {
    // Collect streaming response
    for await (const chunk of provider.chat(messages, {
      temperature: options.temperature,
      maxTokens: options.maxTokens,
    })) {
      fullResponse += chunk;
    }
    
    return fullResponse;
  } catch (error) {
    throw new Error(`LLM call failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Parse LLM response into structured validation result
 * 
 * @param response - Raw LLM response
 * @param weights - Dimension weights
 * @returns Parsed validation result
 */
function parseValidationResponse(
  response: string,
  weights: { safety: number; clarity: number; completeness: number }
): SemanticValidationResult {
  try {
    // Extract JSON from response (handle markdown code blocks)
    let jsonText = response.trim();
    
    // Remove markdown code blocks if present
    const codeBlockMatch = jsonText.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    if (codeBlockMatch) {
      jsonText = codeBlockMatch[1].trim();
    }
    
    // Parse JSON
    const parsed = JSON.parse(jsonText);
    
    // Validate required fields
    if (typeof parsed.safety !== 'number' ||
        typeof parsed.clarity !== 'number' ||
        typeof parsed.completeness !== 'number') {
      throw new Error('Missing or invalid dimension scores');
    }
    
    if (!Array.isArray(parsed.strengths) ||
        !Array.isArray(parsed.weaknesses) ||
        !Array.isArray(parsed.recommendations)) {
      throw new Error('Missing or invalid feedback arrays');
    }
    
    // Clamp scores to 0-100 range
    const safety = clamp(parsed.safety, 0, 100);
    const clarity = clamp(parsed.clarity, 0, 100);
    const completeness = clamp(parsed.completeness, 0, 100);
    
    // Calculate weighted overall score
    const score = Math.round(
      safety * weights.safety +
      clarity * weights.clarity +
      completeness * weights.completeness
    );
    
    // Determine if verified (score >= 90)
    const isVerified = score >= 90;
    
    return {
      score,
      dimensions: {
        safety,
        clarity,
        completeness,
      },
      strengths: parsed.strengths.slice(0, 5), // Limit to 5
      weaknesses: parsed.weaknesses.slice(0, 5), // Limit to 5
      recommendations: parsed.recommendations.slice(0, 5), // Limit to 5
      isVerified,
      rawResponse: response,
    };
  } catch (error) {
    // If parsing fails, return a default result with error info
    console.error('Failed to parse validation response:', error);
    console.error('Raw response:', response);
    
    return {
      score: 0,
      dimensions: {
        safety: 0,
        clarity: 0,
        completeness: 0,
      },
      strengths: [],
      weaknesses: [
        'Failed to parse LLM response',
        `Error: ${error instanceof Error ? error.message : String(error)}`,
      ],
      recommendations: [
        'Try again with a different provider or model',
        'Check that the LLM is responding with valid JSON',
      ],
      isVerified: false,
      rawResponse: response,
    };
  }
}

/**
 * Clamp a number to a range
 * 
 * @param value - Value to clamp
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Clamped value
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Get a human-readable grade from a score
 * 
 * @param score - Score (0-100)
 * @returns Grade letter
 * 
 * @example
 * ```typescript
 * getGrade(95); // "A+"
 * getGrade(85); // "B+"
 * getGrade(75); // "C+"
 * ```
 */
export function getGrade(score: number): string {
  if (score >= 97) return 'A+';
  if (score >= 93) return 'A';
  if (score >= 90) return 'A-';
  if (score >= 87) return 'B+';
  if (score >= 83) return 'B';
  if (score >= 80) return 'B-';
  if (score >= 77) return 'C+';
  if (score >= 73) return 'C';
  if (score >= 70) return 'C-';
  if (score >= 67) return 'D+';
  if (score >= 63) return 'D';
  if (score >= 60) return 'D-';
  return 'F';
}

/**
 * Get a color for a score (for UI display)
 * 
 * @param score - Score (0-100)
 * @returns Color name or hex code
 * 
 * @example
 * ```typescript
 * getScoreColor(95); // "green"
 * getScoreColor(75); // "yellow"
 * getScoreColor(45); // "red"
 * ```
 */
export function getScoreColor(score: number): string {
  if (score >= 90) return 'green';
  if (score >= 70) return 'yellow';
  if (score >= 50) return 'orange';
  return 'red';
}

/**
 * Get a descriptive label for a score
 * 
 * @param score - Score (0-100)
 * @returns Descriptive label
 * 
 * @example
 * ```typescript
 * getScoreLabel(95); // "Excellent"
 * getScoreLabel(75); // "Good"
 * getScoreLabel(45); // "Needs Improvement"
 * ```
 */
export function getScoreLabel(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 80) return 'Very Good';
  if (score >= 70) return 'Good';
  if (score >= 60) return 'Fair';
  if (score >= 50) return 'Needs Improvement';
  return 'Poor';
}

/**
 * Format validation result as markdown for display
 * 
 * @param result - Validation result
 * @returns Formatted markdown
 */
export function formatValidationResultMarkdown(result: SemanticValidationResult): string {
  const lines: string[] = [];
  
  lines.push(`# Skill Quality Report`);
  lines.push('');
  lines.push(`## Overall Score: ${result.score}/100 (${getGrade(result.score)})`);
  lines.push('');
  
  if (result.isVerified) {
    lines.push('✅ **VERIFIED** - This skill is production-ready!');
  } else {
    lines.push('⚠️ **NOT VERIFIED** - This skill needs improvement before production use.');
  }
  
  lines.push('');
  lines.push('## Dimension Scores');
  lines.push('');
  lines.push(`- **Safety**: ${result.dimensions.safety}/100 - ${getScoreLabel(result.dimensions.safety)}`);
  lines.push(`- **Clarity**: ${result.dimensions.clarity}/100 - ${getScoreLabel(result.dimensions.clarity)}`);
  lines.push(`- **Completeness**: ${result.dimensions.completeness}/100 - ${getScoreLabel(result.dimensions.completeness)}`);
  lines.push('');
  
  if (result.strengths.length > 0) {
    lines.push('## Strengths');
    lines.push('');
    result.strengths.forEach(strength => {
      lines.push(`- ✅ ${strength}`);
    });
    lines.push('');
  }
  
  if (result.weaknesses.length > 0) {
    lines.push('## Weaknesses');
    lines.push('');
    result.weaknesses.forEach(weakness => {
      lines.push(`- ⚠️ ${weakness}`);
    });
    lines.push('');
  }
  
  if (result.recommendations.length > 0) {
    lines.push('## Recommendations');
    lines.push('');
    result.recommendations.forEach((rec, i) => {
      lines.push(`${i + 1}. ${rec}`);
    });
    lines.push('');
  }
  
  return lines.join('\n');
}
