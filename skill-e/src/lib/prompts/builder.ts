/**
 * XML Prompt Builder
 *
 * Builds optimized prompts using XML tag structure.
 * Research shows XML tags provide clear boundaries that LLMs
 * parse more effectively than plain text or markdown.
 *
 * Key principles:
 * 1. Use XML tags as "boundary markers" between components
 * 2. Include few-shot examples for pattern matching
 * 3. Keep total prompt under 2000 tokens
 * 4. Prioritize information (most important first)
 */

import type { PromptBuildContext, GeneratedPrompt, PromptSection, FewShotExample } from './types'
import { getExamplesByComplexity, getExamplesByTemplate } from './examples'

/**
 * Default prompt options
 */
const DEFAULT_OPTIONS: Required<PromptBuildContext['options']> = {
  includeExamples: true,
  exampleCount: 2,
  maxTokens: 2000,
  structure: 'xml',
}

/**
 * Estimate token count (rough approximation)
 * 1 token ≈ 4 characters for English text
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

/**
 * Build XML tag
 */
function buildXMLTag(name: string, content: string, attributes?: Record<string, string>): string {
  const attrs = attributes
    ? ' ' +
      Object.entries(attributes)
        .map(([k, v]) => `${k}="${v}"`)
        .join(' ')
    : ''
  return `<${name}${attrs}>\n${content}\n</${name}>`
}

/**
 * Build self-closing XML tag
 */
function buildXMLSelfClosing(name: string, attributes: Record<string, string>): string {
  const attrs = Object.entries(attributes)
    .map(([k, v]) => `${k}="${v}"`)
    .join(' ')
  return `<${name} ${attrs} />`
}

/**
 * Escape XML special characters
 */
 
function escapeXML(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Build context section from optimized context
 */
function buildContextSection(context: PromptBuildContext): string {
  const { optimizedContext } = context

  const metadata = buildXMLTag(
    'metadata',
    `
${buildXMLSelfClosing('duration', { seconds: String(optimizedContext.summary.durationSeconds) })}
${buildXMLSelfClosing('application', { name: optimizedContext.summary.mainApplication || 'unknown' })}
${buildXMLSelfClosing('statistics', {
  steps: String(optimizedContext.summary.totalSteps),
  clicks: String(optimizedContext.summary.totalClicks),
  inputs: String(optimizedContext.summary.totalTextInputs),
})}
`
  )

  const taskGoal = buildXMLTag('task_goal', optimizedContext.taskGoal)

  // Build key steps (limited to max 10)
  const stepsContent = optimizedContext.keySteps
    .slice(0, 10)
    .map(step =>
      buildXMLTag(
        'step',
        `
${buildXMLSelfClosing('number', { value: String(step.number) })}
${buildXMLSelfClosing('time', { start: String(step.timeRange.start), end: String(step.timeRange.end) })}
${buildXMLTag('description', step.description)}
${step.context?.application ? buildXMLTag('application', step.context.application) : ''}
${step.actions.clicks > 0 ? buildXMLSelfClosing('actions', { clicks: String(step.actions.clicks) }) : ''}
${step.notes.length > 0 ? buildXMLTag('notes', step.notes.map(n => `- ${n}`).join('\n')) : ''}
`,
        { number: String(step.number) }
      )
    )
    .join('\n')

  const keySteps = buildXMLTag('key_steps', stepsContent, {
    count: String(optimizedContext.keySteps.length),
  })

  // Build variables section
  const variablesContent =
    optimizedContext.variables.length > 0
      ? optimizedContext.variables
          .map(v =>
            buildXMLTag(
              'variable',
              `
${buildXMLSelfClosing('name', { value: v.name })}
${buildXMLSelfClosing('type', { value: v.type })}
${buildXMLTag('description', v.description)}
${v.exampleValue ? buildXMLTag('example', v.exampleValue) : ''}
`
            )
          )
          .join('\n')
      : '<!-- No variables detected -->'

  const variables = buildXMLTag('detected_variables', variablesContent)

  // Build conditionals section
  const conditionalsContent =
    optimizedContext.conditionals.length > 0
      ? optimizedContext.conditionals
          .map(c =>
            buildXMLTag(
              'conditional',
              `
${buildXMLTag('if', c.condition)}
${buildXMLTag('then', c.thenAction)}
${c.elseAction ? buildXMLTag('else', c.elseAction) : ''}
`
            )
          )
          .join('\n')
      : '<!-- No conditionals detected -->'

  const conditionals = buildXMLTag('detected_conditionals', conditionalsContent)

  return buildXMLTag(
    'recording_context',
    `
${metadata}
${taskGoal}
${keySteps}
${variables}
${conditionals}
`
  )
}

/**
 * Build instructions section
 */
function buildInstructionsSection(context: PromptBuildContext): string {
  const instructions = [
    'Generate a SKILL.md file following AgentSkills.io specification',
    'Use XML-style structure with clear section tags',
    `Target audience: ${context.preferences?.targetAudience || 'intermediate'}`,
    '',
    '<output_requirements>',
    '1. Start with YAML frontmatter (name, description)',
    '2. Use {variable_name} syntax for detected variables',
    '3. Include "When to Use" section with trigger phrases',
    '4. Include "Guardrails" section (✅ What covers, ❌ What does NOT cover, ⚠️ Never Do)',
    '5. Keep total length under 500 lines',
    '6. Use hierarchical structure: Quick Start → Detailed Steps → References',
    '</output_requirements>',
    '',
    '<format_rules>',
    '- Use markdown tables for parameters',
    '- Use numbered lists for sequential steps',
    '- Use "If X / Then Y" for conditionals',
    '- Include verification checklist',
    '- Include troubleshooting table',
    '</format_rules>',
  ].join('\n')

  return buildXMLTag('instructions', instructions)
}

/**
 * Build example section from few-shot examples
 */
function buildExampleSection(examples: FewShotExample[]): string {
  const examplesContent = examples
    .map(ex =>
      buildXMLTag(
        'example',
        `
${buildXMLTag('name', ex.name)}
${buildXMLTag('description', ex.description)}
${buildXMLTag(
  'input_context',
  `
Task: ${ex.input.taskGoal}
Steps:
${ex.input.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}
${ex.input.variables ? `Variables: ${ex.input.variables.join(', ')}` : ''}
`
)}
${buildXMLTag('output_skill_md', ex.output)}
`
      )
    )
    .join('\n\n')

  return buildXMLTag('examples', examplesContent, { count: String(examples.length) })
}

/**
 * Build the complete prompt
 */
export function buildPrompt(context: PromptBuildContext): GeneratedPrompt {
  const options = { ...DEFAULT_OPTIONS, ...context.options }

  // Determine which examples to use
  let examples: FewShotExample[] = []
  if (options.includeExamples) {
    if (context.preferences?.targetAudience === 'beginner') {
      examples = getExamplesByTemplate('minimal')
    } else if (context.preferences?.targetAudience === 'expert') {
      examples = getExamplesByTemplate('complex')
    } else {
      // Auto-select based on complexity
      examples = getExamplesByComplexity(
        context.optimizedContext.keySteps.length,
        context.optimizedContext.variables.length
      )
    }

    // Limit to requested count
    examples = examples.slice(0, options.exampleCount)
  }

  // Build sections
  const sections: PromptSection[] = [
    {
      tag: 'objective',
      content:
        'You are an expert at creating Agent Skills from demonstration recordings. Transform the provided recording data into a high-quality SKILL.md following AgentSkills.io specification.',
      priority: 1,
    },
    {
      tag: 'context',
      content: buildContextSection(context),
      priority: 2,
    },
    {
      tag: 'instructions',
      content: buildInstructionsSection(context),
      priority: 3,
    },
  ]

  // Add examples if enabled
  if (examples.length > 0) {
    sections.push({
      tag: 'examples',
      content: buildExampleSection(examples),
      priority: 4,
    })
  }

  // Add output format section
  sections.push({
    tag: 'output_format',
    content: `Generate ONLY the SKILL.md content, starting with YAML frontmatter (---).
Do NOT include any explanations or meta-commentary.
Do NOT wrap the output in markdown code blocks.
Just output the raw SKILL.md content.

Required frontmatter fields:
- name: lowercase with hyphens, 1-64 chars
- description: 1-2 sentences, what it does and when to use (include trigger phrases like "Use when...")`,
    priority: 5,
  })

  // Combine all sections
  const promptParts = sections.map(s => s.content)
  const prompt = promptParts.join('\n\n')

  // Estimate tokens
  const tokenEstimate = estimateTokens(prompt)

  return {
    prompt,
    tokenEstimate,
    sections: sections.map(s => s.tag || 'unnamed'),
    examples: examples.map(e => e.name),
  }
}

/**
 * Build minimal prompt (for token-constrained scenarios)
 */
export function buildMinimalPrompt(context: PromptBuildContext): GeneratedPrompt {
  const { optimizedContext } = context

  const prompt = `<objective>
Create SKILL.md from recording demonstration.
</objective>

<context>
Task: ${optimizedContext.taskGoal}
Steps: ${optimizedContext.keySteps.length}
Duration: ${optimizedContext.summary.durationSeconds}s
App: ${optimizedContext.summary.mainApplication || 'unknown'}
Variables: ${optimizedContext.variables.map(v => v.name).join(', ') || 'none'}
</context>

<instructions>
1. Generate SKILL.md with YAML frontmatter
2. Use {varname} syntax for variables
3. Include: Parameters, When to Use, Instructions, Verification
4. Keep under 400 lines
</instructions>

<output_format>
---
name: skill-name
description: "Description. Use when..."
---
# Skill Title
...
</output_format>`

  return {
    prompt,
    tokenEstimate: estimateTokens(prompt),
    sections: ['objective', 'context', 'instructions', 'output_format'],
    examples: [],
  }
}

/**
 * Export builder functions
 */
export const PromptBuilder = {
  build: buildPrompt,
  buildMinimal: buildMinimalPrompt,
  estimateTokens,
}
