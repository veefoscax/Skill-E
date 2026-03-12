/**
 * Variable Detection - LLM Enhancement
 *
 * Optional enhancement layer that uses LLM for semantic analysis
 * to improve variable detection in edge cases:
 * - Ambiguous speech patterns
 * - Complex multi-step correlations
 * - Context-dependent variable types
 *
 * This is an optional enhancement that augments the pattern-based
 * detection with LLM-powered semantic understanding when needed.
 *
 * @module lib/variable-detection-llm
 */

import type { ILLMProvider } from './llm/types'
import type { VariableHint, VariableType, VariableDetectionResult } from '../types/variables'
import type { TranscriptSegment } from './variable-detection'

/**
 * Action event for variable detection
 */
export interface ActionEvent {
  /** Action type */
  type: 'click' | 'keyboard' | 'scroll' | 'navigation' | 'file' | 'select'
  /** Timestamp */
  timestamp: number
  /** Target element */
  target?: string
  /** Additional data */
  data?: Record<string, unknown>
}

/**
 * Configuration for LLM enhancement
 */
export interface LLMEnhancementConfig {
  /** Enable LLM enhancement (default: true) */
  enabled: boolean
  /** Minimum confidence threshold for pattern-based detection (default: 0.6) */
  minConfidenceThreshold: number
  /** Maximum number of LLM calls per detection (default: 1) */
  maxLLMCalls: number
  /** Use LLM only for edge cases (default: true) */
  edgeCaseOnly: boolean
}

const DEFAULT_LLM_CONFIG: LLMEnhancementConfig = {
  enabled: true,
  minConfidenceThreshold: 0.6,
  maxLLMCalls: 1,
  edgeCaseOnly: true,
}

/**
 * Context for LLM semantic analysis
 */
interface SemanticContext {
  speechSegments: TranscriptSegment[]
  actions: ActionEvent[]
  preliminaryHints: VariableHint[]
  lowConfidenceHints: VariableHint[]
}

/**
 * LLM analysis result
 */
interface LLMAnalysisResult {
  /** Enhanced variables with improved confidence/type */
  enhancedVariables: VariableHint[]
  /** New variables detected by LLM */
  newVariables: VariableHint[]
  /** Variables to remove (false positives) */
  removedVariables: string[]
  /** Analysis reasoning */
  reasoning: string
  /** Analysis metadata */
  metadata: {
    tokensUsed: number
    analysisTimeMs: number
    reasoning: string
  }
}

/**
 * Check if detection result needs LLM enhancement
 *
 * Triggers enhancement when:
 * - Low confidence hints exist
 * - Ambiguous patterns detected
 * - Complex multi-step sequences
 */
export function needsLLMEnhancement(
  result: VariableDetectionResult,
  config: Partial<LLMEnhancementConfig> = {}
): boolean {
  const cfg = { ...DEFAULT_LLM_CONFIG, ...config }

  if (!cfg.enabled) {
    return false
  }

  // Check for low confidence hints
  const hasLowConfidence = result.variables.some(v => v.confidence < cfg.minConfidenceThreshold)

  // Check for ambiguous patterns (multiple hints with similar names)
  const nameGroups = new Map<string, VariableHint[]>()
  for (const hint of result.variables) {
    const key = hint.name.toLowerCase().replace(/[^a-z0-9]/g, '')
    const group = nameGroups.get(key) || []
    group.push(hint)
    nameGroups.set(key, group)
  }
  const hasAmbiguousPatterns = Array.from(nameGroups.values()).some(
    group => group.length > 1 && group.some(h => h.confidence < 0.8)
  )

  return hasLowConfidence || hasAmbiguousPatterns
}

/**
 * Enhance variable detection with LLM semantic analysis
 *
 * Uses LLM to:
 * 1. Analyze ambiguous patterns
 * 2. Resolve conflicts between hints
 * 3. Detect context-dependent variables
 * 4. Improve confidence scores
 */
export async function enhanceWithLLM(
  preliminaryResult: VariableDetectionResult,
  speechSegments: TranscriptSegment[],
  actions: ActionEvent[],
  llmProvider: ILLMProvider,
  config: Partial<LLMEnhancementConfig> = {}
): Promise<VariableDetectionResult> {
  const startTime = Date.now()
  const cfg = { ...DEFAULT_LLM_CONFIG, ...config }

  if (!cfg.enabled) {
    return preliminaryResult
  }

  // Filter hints that need enhancement
  const lowConfidenceHints = preliminaryResult.variables.filter(
    v => v.confidence < cfg.minConfidenceThreshold
  )

  if (lowConfidenceHints.length === 0 && cfg.edgeCaseOnly) {
    return preliminaryResult
  }

  const context: SemanticContext = {
    speechSegments,
    actions,
    preliminaryHints: preliminaryResult.variables,
    lowConfidenceHints,
  }

  try {
    const llmResult = await performLLMAnalysis(context, llmProvider)

    // Merge LLM results with preliminary results
    const mergedVariables = mergeLLMResults(preliminaryResult.variables, llmResult)

    const processingTime = Date.now() - startTime + preliminaryResult.processingTime

    return {
      variables: mergedVariables,
      conditionals: preliminaryResult.conditionals,
      processingTime,
      warnings: preliminaryResult.warnings,
    }
  } catch (error) {
    console.warn('LLM enhancement failed, using pattern-based results:', error)
    return preliminaryResult
  }
}

/**
 * Perform LLM semantic analysis
 */
async function performLLMAnalysis(
  context: SemanticContext,
  llmProvider: ILLMProvider
): Promise<LLMAnalysisResult> {
  const prompt = buildAnalysisPrompt(context)

  const startTime = Date.now()
  const result = await llmProvider.generate(prompt, {
    model: llmProvider.config.defaultModel,
    maxTokens: 2000,
    temperature: 0.2, // Low temperature for consistent results
  })

  const analysisTimeMs = Date.now() - startTime

  // Parse LLM response
  const parsed = parseLLMResponse(result.text)

  return {
    ...parsed,
    metadata: {
      tokensUsed: result.usage?.totalTokens || 0,
      analysisTimeMs,
      reasoning: parsed.reasoning || 'No reasoning provided',
    },
  }
}

/**
 * Build analysis prompt for LLM
 */
function buildAnalysisPrompt(context: SemanticContext): string {
  const { speechSegments, actions, preliminaryHints, lowConfidenceHints } = context

  return `You are a semantic analyzer for variable detection in screen recordings. Your task is to analyze speech transcripts and user actions to identify variables with high confidence.

<speech_transcript>
${speechSegments.map(s => `[${formatTime(s.start)}-${formatTime(s.end)}] ${s.text}`).join('\n')}
</speech_transcript>

<user_actions>
${actions
  .slice(0, 20)
  .map(a => `- ${a.type} at ${formatTime(a.timestamp)}${a.target ? ` on "${a.target}"` : ''}`)
  .join('\n')}
</user_actions>

<preliminary_detection>
${preliminaryHints.map(h => `- "${h.name}" (${h.type}, confidence: ${Math.round(h.confidence * 100)}%) - ${h.description}`).join('\n')}
</preliminary_detection>

<low_confidence_candidates>
${lowConfidenceHints.map(h => `- "${h.name}" - source: ${h.origin.source}`).join('\n')}
</low_confidence_candidates>

<task>
Analyze the low confidence candidates and determine:
1. Should they be confirmed as variables?
2. What is their correct type?
3. What is their confidence level (0.0-1.0)?
4. Any false positives to remove?
5. Any new variables not detected?

Consider context from speech and actions to resolve ambiguities.
</task>

<output_format>
Respond in this exact JSON format:
{
  "enhancedVariables": [
    {
      "name": "variable_name",
      "type": "text|number|email|phone|date|selection|file",
      "confidence": 0.85,
      "reasoning": "Brief explanation"
    }
  ],
  "newVariables": [
    {
      "name": "new_var",
      "type": "text",
      "confidence": 0.75,
      "reasoning": "Detected from context"
    }
  ],
  "removedVariables": ["false_positive_name"],
  "reasoning": "Overall analysis reasoning"
}
</output_format>

Respond only with the JSON object, no markdown formatting.`
}

/**
 * Parse LLM response into structured result
 */
function parseLLMResponse(response: string): Omit<LLMAnalysisResult, 'metadata'> {
  try {
    // Clean response (remove markdown code blocks if present)
    const cleanResponse = response
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim()

    const parsed = JSON.parse(cleanResponse)

    return {
      enhancedVariables: (parsed.enhancedVariables || []).map((v: Record<string, unknown>) => ({
        id: crypto.randomUUID(),
        name: v.name as string,
        type: (v.type as VariableType) || 'text',
        confidence: v.confidence as number,
        description: (v.reasoning as string) || 'Enhanced by LLM',
        origin: { source: 'llm' as const },
        status: 'detected' as const,
      })),
      newVariables: (parsed.newVariables || []).map((v: Record<string, unknown>) => ({
        id: crypto.randomUUID(),
        name: v.name as string,
        type: (v.type as VariableType) || 'text',
        confidence: v.confidence as number,
        description: (v.reasoning as string) || 'Detected by LLM',
        origin: { source: 'llm' as const },
        status: 'detected' as const,
      })),
      removedVariables: parsed.removedVariables || [],
      reasoning: parsed.reasoning || 'Analysis completed',
    }
  } catch (error) {
    console.error('Failed to parse LLM response:', error)
    return {
      enhancedVariables: [],
      newVariables: [],
      removedVariables: [],
      reasoning: 'Parse error',
    }
  }
}

/**
 * Merge LLM results with preliminary results
 */
function mergeLLMResults(
  preliminary: VariableHint[],
  llmResult: LLMAnalysisResult
): VariableHint[] {
  const result = new Map<string, VariableHint>()

  // Add preliminary hints (excluding removed ones)
  for (const hint of preliminary) {
    if (!llmResult.removedVariables.includes(hint.name)) {
      result.set(hint.id, hint)
    }
  }

  // Update with enhanced variables
  for (const enhanced of llmResult.enhancedVariables) {
    const existing = Array.from(result.values()).find(
      h => h.name.toLowerCase() === enhanced.name.toLowerCase()
    )

    if (existing) {
      result.set(existing.id, {
        ...existing,
        type: enhanced.type,
        confidence: Math.max(existing.confidence, enhanced.confidence),
        description: `${existing.description} | LLM: ${enhanced.description}`,
      })
    }
  }

  // Add new variables from LLM
  for (const newVar of llmResult.newVariables) {
    const existing = Array.from(result.values()).find(
      h => h.name.toLowerCase() === newVar.name.toLowerCase()
    )

    if (!existing) {
      result.set(newVar.id, newVar)
    }
  }

  return Array.from(result.values()).sort((a, b) => b.confidence - a.confidence)
}

/**
 * Format time in MM:SS.ms
 */
function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  const millis = Math.floor((ms % 1000) / 10)
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${millis.toString().padStart(2, '0')}`
}

/**
 * Quick LLM validation for a single ambiguous hint
 *
 * Lightweight alternative for real-time scenarios
 */
export async function quickValidateHint(
  hint: VariableHint,
  speechContext: string,
  llmProvider: ILLMProvider
): Promise<{ valid: boolean; confidence: number; reasoning: string }> {
  const prompt = `Quick validation:

Speech: "${speechContext}"
Detected variable: "${hint.name}" (${hint.type})
Confidence: ${Math.round(hint.confidence * 100)}%

Is this a real variable the user would customize? Respond with ONLY "yes" or "no" and a brief reason.

Format: "yes|reason" or "no|reason"`

  try {
    const result = await llmProvider.generate(prompt, {
      model: llmProvider.config.defaultModel,
      maxTokens: 100,
      temperature: 0.1,
    })

    const [validStr, ...reasonParts] = result.text.trim().split('|')
    const valid = validStr.trim().toLowerCase() === 'yes'
    const reasoning = reasonParts.join('|').trim() || 'No reasoning provided'

    return {
      valid,
      confidence: valid ? Math.max(hint.confidence, 0.75) : hint.confidence * 0.5,
      reasoning,
    }
  } catch (error) {
    return {
      valid: hint.confidence >= 0.6,
      confidence: hint.confidence,
      reasoning: 'LLM validation failed',
    }
  }
}
