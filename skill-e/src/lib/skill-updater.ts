/**
 * Skill Updater - LLM-based Skill Fix Generation
 *
 * Takes user feedback and uses LLM to generate improved step instructions.
 * Updates the skill step and prepares it for retry.
 *
 * Requirements: FR-10.8
 */

import type { SkillStep } from './skill-parser'
import type { CategorizedError } from './error-handler'
import type { Provider, Message } from './providers/types'
import { createProvider } from './providers/factory'
import { useProviderStore } from '@/stores/provider'

/**
 * Skill update request
 */
export interface SkillUpdateRequest {
  /** The step that failed */
  step: SkillStep

  /** User feedback describing what went wrong */
  feedback: string

  /** Categorized error information (optional) */
  categorizedError?: CategorizedError

  /** Screenshot of the error state (optional) */
  errorScreenshot?: string

  /** Additional context about the skill (optional) */
  skillContext?: {
    skillName: string
    skillDescription: string
    previousSteps: SkillStep[]
    nextSteps: SkillStep[]
  }
}

/**
 * Skill update result
 */
export interface SkillUpdateResult {
  /** Whether the update was successful */
  success: boolean

  /** Updated step instruction */
  updatedInstruction?: string

  /** Updated target information (optional) */
  updatedTarget?: SkillStep['target']

  /** Explanation of what was changed */
  explanation?: string

  /** Confidence score (0-1) */
  confidence?: number

  /** Error message if update failed */
  error?: string

  /** Raw LLM response for debugging */
  rawResponse?: string
}

/**
 * Generate a fix for a failed skill step using LLM
 *
 * @param request - Update request with step and feedback
 * @param provider - Optional provider instance (uses store config if not provided)
 * @returns Update result with new instruction
 */
export async function generateSkillFix(
  request: SkillUpdateRequest,
  provider?: Provider
): Promise<SkillUpdateResult> {
  try {
    // Get provider from store if not provided
    if (!provider) {
      const config = useProviderStore.getState().config
      provider = createProvider(config)
    }

    // Build the prompt for the LLM
    const prompt = buildFixPrompt(request)

    // Call LLM
    const messages: Message[] = [
      {
        role: 'system',
        content: SYSTEM_PROMPT,
      },
      {
        role: 'user',
        content: prompt,
      },
    ]

    // Collect streaming response
    let response = ''
    for await (const chunk of provider.chat(messages, {
      temperature: 0.3, // Lower temperature for more focused fixes
      maxTokens: 1000,
    })) {
      response += chunk
    }

    // Parse the LLM response
    const result = parseFixResponse(response, request.step)

    return {
      ...result,
      rawResponse: response,
    }
  } catch (error) {
    console.error('Failed to generate skill fix:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * System prompt for skill fix generation
 */
const SYSTEM_PROMPT = `You are an expert at fixing automation skill instructions. Your job is to analyze failed skill steps and generate improved instructions based on user feedback.

CRITICAL RULES:
1. Generate ONLY the improved instruction text - no explanations, no markdown, no extra text
2. Keep instructions concise and actionable (1-2 sentences max)
3. Include specific selectors, coordinates, or element descriptions when available
4. Use the same format as the original instruction
5. If the user provides specific details (selectors, coordinates), incorporate them
6. Maintain consistency with the skill's overall goal

OUTPUT FORMAT:
Return ONLY a JSON object with this structure:
{
  "instruction": "The improved instruction text",
  "selector": "CSS selector or XPath (if applicable)",
  "coordinates": { "x": 100, "y": 200 } (if applicable),
  "description": "Element description (if applicable)",
  "explanation": "Brief explanation of what was changed",
  "confidence": 0.85 (0-1 score)
}

If you cannot generate a fix, return:
{
  "error": "Explanation of why fix cannot be generated"
}`

/**
 * Build the prompt for fix generation
 */
function buildFixPrompt(request: SkillUpdateRequest): string {
  const { step, feedback, categorizedError, skillContext } = request

  let prompt = `Fix this failed skill step:\n\n`

  // Original instruction
  prompt += `ORIGINAL INSTRUCTION:\n"${step.instruction}"\n\n`

  // Step details
  if (step.target) {
    prompt += `ORIGINAL TARGET:\n`
    if (step.target.selector) {
      prompt += `- Selector: ${step.target.selector}\n`
    }
    if (step.target.coordinates) {
      prompt += `- Coordinates: (${step.target.coordinates.x}, ${step.target.coordinates.y})\n`
    }
    if (step.target.description) {
      prompt += `- Description: ${step.target.description}\n`
    }
    if (step.target.text) {
      prompt += `- Text: ${step.target.text}\n`
    }
    prompt += `\n`
  }

  // Error information
  if (categorizedError) {
    prompt += `ERROR CATEGORY: ${categorizedError.category}\n`
    prompt += `ERROR MESSAGE: ${categorizedError.userMessage}\n\n`
  } else if (step.error) {
    prompt += `ERROR: ${step.error}\n\n`
  }

  // User feedback (most important!)
  prompt += `USER FEEDBACK:\n"${feedback}"\n\n`

  // Context (if available)
  if (skillContext) {
    prompt += `SKILL CONTEXT:\n`
    prompt += `- Skill: ${skillContext.skillName}\n`
    prompt += `- Goal: ${skillContext.skillDescription}\n`

    if (skillContext.previousSteps.length > 0) {
      prompt += `- Previous steps:\n`
      skillContext.previousSteps.slice(-3).forEach((s, i) => {
        prompt += `  ${i + 1}. ${s.instruction}\n`
      })
    }

    if (skillContext.nextSteps.length > 0) {
      prompt += `- Next steps:\n`
      skillContext.nextSteps.slice(0, 2).forEach((s, i) => {
        prompt += `  ${i + 1}. ${s.instruction}\n`
      })
    }
    prompt += `\n`
  }

  // Request
  prompt += `Generate an improved instruction that addresses the user's feedback and fixes the error.`

  return prompt
}

/**
 * Parse the LLM response into a structured result
 */
function parseFixResponse(
  response: string,
  originalStep: SkillStep
): Omit<SkillUpdateResult, 'rawResponse'> {
  try {
    // Try to extract JSON from the response
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return {
        success: false,
        error: 'LLM response did not contain valid JSON',
      }
    }

    const parsed = JSON.parse(jsonMatch[0])

    // Check for error response
    if (parsed.error) {
      return {
        success: false,
        error: parsed.error,
      }
    }

    // Validate required fields
    if (!parsed.instruction) {
      return {
        success: false,
        error: 'LLM response missing instruction field',
      }
    }

    // Build updated target
    const updatedTarget: SkillStep['target'] = {
      ...originalStep.target,
    }

    if (parsed.selector) {
      updatedTarget.selector = parsed.selector
    }

    if (parsed.coordinates) {
      updatedTarget.coordinates = parsed.coordinates
    }

    if (parsed.description) {
      updatedTarget.description = parsed.description
    }

    return {
      success: true,
      updatedInstruction: parsed.instruction,
      updatedTarget: Object.keys(updatedTarget).length > 0 ? updatedTarget : undefined,
      explanation: parsed.explanation || 'Instruction updated based on feedback',
      confidence: parsed.confidence || 0.7,
    }
  } catch (error) {
    console.error('Failed to parse LLM response:', error)
    return {
      success: false,
      error: 'Failed to parse LLM response as JSON',
    }
  }
}

/**
 * Apply a skill update to a step
 *
 * @param step - The step to update
 * @param update - The update result from generateSkillFix
 * @returns Updated step
 */
export function applySkillUpdate(step: SkillStep, update: SkillUpdateResult): SkillStep {
  if (!update.success || !update.updatedInstruction) {
    return step
  }

  return {
    ...step,
    instruction: update.updatedInstruction,
    target: update.updatedTarget || step.target,
    // Reset status to pending for retry
    status: 'pending',
    // Clear previous error
    error: undefined,
    // Add feedback note
    feedback: update.explanation,
  }
}

/**
 * Generate multiple fix suggestions for a step
 *
 * Useful for giving users options to choose from.
 *
 * @param request - Update request
 * @param count - Number of suggestions to generate (default: 3)
 * @param provider - Optional provider instance
 * @returns Array of update results
 */
export async function generateFixSuggestions(
  request: SkillUpdateRequest,
  count: number = 3,
  provider?: Provider
): Promise<SkillUpdateResult[]> {
  const suggestions: SkillUpdateResult[] = []

  // Generate multiple fixes with slightly different temperatures
  const temperatures = [0.2, 0.4, 0.6]

  for (let i = 0; i < Math.min(count, temperatures.length); i++) {
    try {
      // Get provider from store if not provided
      let llmProvider = provider
      if (!llmProvider) {
        const config = useProviderStore.getState().config
        llmProvider = createProvider(config)
      }

      const prompt = buildFixPrompt(request)

      const messages: Message[] = [
        {
          role: 'system',
          content: SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: prompt,
        },
      ]

      let response = ''
      for await (const chunk of llmProvider.chat(messages, {
        temperature: temperatures[i],
        maxTokens: 1000,
      })) {
        response += chunk
      }

      const result = parseFixResponse(response, request.step)

      if (result.success) {
        suggestions.push({
          ...result,
          rawResponse: response,
        })
      }
    } catch (error) {
      console.error(`Failed to generate suggestion ${i + 1}:`, error)
    }
  }

  return suggestions
}

/**
 * Validate a skill update before applying
 *
 * Checks if the update is reasonable and safe to apply.
 *
 * @param step - Original step
 * @param update - Proposed update
 * @returns Validation result
 */
export function validateSkillUpdate(
  step: SkillStep,
  update: SkillUpdateResult
): {
  valid: boolean
  warnings: string[]
  errors: string[]
} {
  const warnings: string[] = []
  const errors: string[] = []

  if (!update.success) {
    errors.push('Update was not successful')
    return { valid: false, warnings, errors }
  }

  if (!update.updatedInstruction) {
    errors.push('No updated instruction provided')
    return { valid: false, warnings, errors }
  }

  // Check instruction length
  if (update.updatedInstruction.length < 10) {
    warnings.push('Updated instruction is very short')
  }

  if (update.updatedInstruction.length > 500) {
    warnings.push('Updated instruction is very long')
  }

  // Check if instruction changed significantly
  const similarity = calculateSimilarity(step.instruction, update.updatedInstruction)
  if (similarity > 0.95) {
    warnings.push('Updated instruction is very similar to original')
  }

  if (similarity < 0.3) {
    warnings.push('Updated instruction is very different from original')
  }

  // Check confidence
  if (update.confidence && update.confidence < 0.5) {
    warnings.push('LLM has low confidence in this fix')
  }

  // Check for dangerous patterns
  const dangerousPatterns = [/delete|remove|destroy/i, /format|wipe|erase/i, /sudo|admin|root/i]

  for (const pattern of dangerousPatterns) {
    if (pattern.test(update.updatedInstruction) && !pattern.test(step.instruction)) {
      warnings.push('Updated instruction contains potentially dangerous operations')
      break
    }
  }

  return {
    valid: errors.length === 0,
    warnings,
    errors,
  }
}

/**
 * Calculate similarity between two strings (0-1)
 *
 * Simple Levenshtein-based similarity metric.
 */
function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2
  const shorter = str1.length > str2.length ? str2 : str1

  if (longer.length === 0) {
    return 1.0
  }

  const distance = levenshteinDistance(longer, shorter)
  return (longer.length - distance) / longer.length
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = []

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i]
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1 // deletion
        )
      }
    }
  }

  return matrix[str2.length][str1.length]
}
