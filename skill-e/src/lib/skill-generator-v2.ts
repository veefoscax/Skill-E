/**
 * Skill Generator V2
 *
 * Refactored skill generator using:
 * 1. XML-based prompts with few-shot examples
 * 2. Multi-provider LLM architecture
 * 3. Optimized token usage
 *
 * This replaces the original skill-generator.ts while maintaining
 * backward compatibility with the existing interface.
 *
 * Requirements: FR-6.1, FR-6.17
 */

import type { OptimizedContext } from './context-optimizer'
import { PromptBuilder, getTemplate, autoSelectTemplate } from './prompts'
import { createProviderSimple, type LLMProvider } from './llm'
import type { GenerateOptions } from './llm/types'

// Re-export types from original for compatibility
export type { GeneratedSkill, SkillFrontmatter, ToolDefinition } from './skill-generator'

/**
 * Skill generation options (extended with new providers)
 */
export interface SkillGenerationOptionsV2 {
  /** LLM provider to use */
  provider?: LLMProvider | 'anthropic' | 'openai' | 'openrouter' | 'zhipu' | 'moonshot'

  /** Model to use */
  model?: string

  /** API key for the provider */
  apiKey?: string

  /** Maximum tokens for response (default: 4000) */
  maxTokens?: number

  /** Temperature for generation (default: 0.3) */
  temperature?: number

  /** Whether to stream the response (default: false) */
  stream?: boolean

  /** Callback for streaming chunks */
  onChunk?: (chunk: string) => void

  /**
   * Template type to use (new in V2)
   * 'auto' will select based on task complexity
   */
  template?: 'auto' | 'minimal' | 'standard' | 'complex'

  /**
   * Whether to use optimized XML prompts (new in V2)
   * @default true
   */
  useOptimizedPrompts?: boolean
}

/**
 * Default options
 */
const DEFAULT_OPTIONS: Required<Omit<SkillGenerationOptionsV2, 'apiKey' | 'onChunk'>> = {
  provider: 'anthropic',
  model: 'claude-3-5-sonnet-20241022',
  maxTokens: 4000,
  temperature: 0.3,
  stream: false,
  template: 'auto',
  useOptimizedPrompts: true,
}

/**
 * Generate a SKILL.md from optimized context (V2)
 *
 * Uses the new prompt system and multi-provider architecture.
 * Falls back to original implementation if useOptimizedPrompts is false.
 *
 * @param context - Optimized context from context-optimizer
 * @param options - Generation options
 * @returns Generated skill
 */
export async function generateSkillV2(
  context: OptimizedContext,
  options: SkillGenerationOptionsV2 = {}
): Promise<import('./skill-generator').GeneratedSkill> {
  const startTime = Date.now()

  // Merge options with defaults
  const opts = { ...DEFAULT_OPTIONS, ...options }

  // Validate API key
  if (!opts.apiKey) {
    throw new Error('API key is required for skill generation')
  }

  // Select template
  const templateType =
    opts.template === 'auto'
      ? autoSelectTemplate(
          context.keySteps.length,
          context.variables.length,
          context.conditionals.length
        ).type
      : opts.template

  const template = getTemplate(templateType)

  // Build prompt using new system
  const promptResult = PromptBuilder.build({
    optimizedContext: context,
    template,
    options: {
      includeExamples: true,
      exampleCount: 2,
      structure: 'xml',
    },
  })

  // Log prompt stats for debugging
  console.log(`[Skill Generator V2] Prompt stats:`, {
    sections: promptResult.sections,
    examples: promptResult.examples,
    estimatedTokens: promptResult.tokenEstimate,
    template: templateType,
  })

  // Create provider
  const provider = createProviderSimple(opts.provider, opts.apiKey)

  // Generate
  let markdown: string

  const generateOptions: GenerateOptions = {
    model: opts.model,
    maxTokens: opts.maxTokens,
    temperature: opts.temperature,
  }

  if (opts.stream && opts.onChunk) {
    // Streaming generation
    let fullText = ''

    await provider.stream(promptResult.prompt, {
      ...generateOptions,
      onChunk: chunk => {
        fullText += chunk
        opts.onChunk!(chunk)
      },
    })

    markdown = fullText
  } else {
    // Non-streaming generation
    const result = await provider.generate(promptResult.prompt, generateOptions)
    markdown = result.text
  }

  // Parse the generated markdown
  const { frontmatter, body } = parseMarkdown(markdown)

  // Generate tool definition
  const toolDefinition = generateToolDefinition(frontmatter, body, context)

  // Calculate token count
  const tokenCount = Math.ceil(markdown.length / 4)

  const generationTimeMs = Date.now() - startTime

  return {
    markdown,
    frontmatter,
    toolDefinition,
    tokenCount,
    metadata: {
      generatedAt: Date.now(),
      provider: opts.provider,
      model: opts.model,
      generationTimeMs,
    },
  }
}

/**
 * Parse markdown into frontmatter and body
 */
function parseMarkdown(markdown: string): {
  frontmatter: import('./skill-generator').SkillFrontmatter
  body: string
} {
  // Extract YAML frontmatter
  const frontmatterMatch = markdown.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)

  if (!frontmatterMatch) {
    throw new Error('Invalid SKILL.md format: missing YAML frontmatter')
  }

  const yamlText = frontmatterMatch[1]
  const body = frontmatterMatch[2]

  // Parse YAML (simple parser for our specific format)
  const frontmatter = parseYAML(yamlText)

  return { frontmatter, body }
}

/**
 * Simple YAML parser for frontmatter
 */
function parseYAML(yaml: string): import('./skill-generator').SkillFrontmatter {
  const lines = yaml.split('\n')
  const result: any = {}
  let currentKey: string | null = null
  let currentObject: any = null

  for (const line of lines) {
    const trimmed = line.trim()

    if (trimmed === '') continue

    // Check for nested object
    if (trimmed.endsWith(':') && !trimmed.includes('"')) {
      currentKey = trimmed.slice(0, -1)
      currentObject = {}
      result[currentKey] = currentObject
      continue
    }

    // Parse key-value pair
    const match = trimmed.match(/^(\w+):\s*(.+)$/)
    if (match) {
      const [, key, value] = match
      const cleanValue = value.replace(/^["']|["']$/g, '')

      if (currentObject) {
        currentObject[key] = cleanValue
      } else {
        result[key] = cleanValue
      }
    }
  }

  return result as import('./skill-generator').SkillFrontmatter
}

/**
 * Generate tool definition from skill
 */
function generateToolDefinition(
  frontmatter: import('./skill-generator').SkillFrontmatter,
  body: string,
  context: OptimizedContext
): import('./skill-generator').ToolDefinition {
  // Convert skill name to snake_case
  const toolName = frontmatter.name.replace(/-/g, '_')

  // Extract parameters from the skill body
  const properties: Record<string, { type: string; description: string; enum?: string[] }> = {}
  const required: string[] = []

  // Parse parameters table from markdown
  const parametersMatch = body.match(/## Parameters\s+([\s\S]*?)(?=\n##|$)/)

  if (parametersMatch) {
    const parametersSection = parametersMatch[1]
    const rows = parametersSection
      .split('\n')
      .filter(line => line.includes('|') && !line.includes('---'))

    // Skip header row
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i]
      const cells = row
        .split('|')
        .map(cell => cell.trim())
        .filter(cell => cell !== '')

      if (cells.length >= 4) {
        const paramName = cells[0].replace(/[`{}]/g, '')
        const paramType = cells[1]
        const isRequired = cells[2].toLowerCase() === 'yes'
        const description = cells[3]

        // Map skill types to JSON Schema types
        let schemaType = 'string'
        let enumValues: string[] | undefined

        if (paramType.includes('number')) {
          schemaType = 'number'
        } else if (paramType.includes('boolean')) {
          schemaType = 'boolean'
        } else if (paramType.includes('selection') || paramType.includes('|')) {
          schemaType = 'string'
          // Extract enum values
          const enumMatch = description.match(/Options?:\s*`([^`]+)`/)
          if (enumMatch) {
            enumValues = enumMatch[1].split(/\s*\|\s*/)
          }
        }

        properties[paramName] = {
          type: schemaType,
          description,
          ...(enumValues && { enum: enumValues }),
        }

        if (isRequired) {
          required.push(paramName)
        }
      }
    }
  }

  // If no parameters found in table, use detected variables
  if (Object.keys(properties).length === 0 && context.variables.length > 0) {
    for (const variable of context.variables) {
      properties[variable.name] = {
        type: mapVariableTypeToJsonSchema(variable.type),
        description: variable.description,
      }
      required.push(variable.name)
    }
  }

  return {
    name: toolName,
    description: frontmatter.description,
    input_schema: {
      type: 'object',
      properties,
      required,
    },
  }
}

/**
 * Map variable type to JSON Schema type
 */
function mapVariableTypeToJsonSchema(type: string): string {
  switch (type) {
    case 'number':
      return 'number'
    case 'boolean':
      return 'boolean'
    case 'email':
    case 'url':
    case 'date':
    case 'file':
    case 'password':
    case 'text':
    case 'selection':
    default:
      return 'string'
  }
}

/**
 * Compare original vs V2 prompt (for testing)
 */
export function comparePrompts(context: OptimizedContext): {
  original: { prompt: string; tokens: number }
  v2: { prompt: string; tokens: number }
} {
  // Import original prompt builder
  const { buildSkillPrompt } = require('./skill-generator')
  const originalPrompt = buildSkillPrompt(context)

  const promptResult = PromptBuilder.build({
    optimizedContext: context,
    template: getTemplate('standard'),
    options: { includeExamples: true },
  })

  return {
    original: {
      prompt: originalPrompt,
      tokens: Math.ceil(originalPrompt.length / 4),
    },
    v2: {
      prompt: promptResult.prompt,
      tokens: promptResult.tokenEstimate,
    },
  }
}
