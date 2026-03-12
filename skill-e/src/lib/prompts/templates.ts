/**
 * Skill Templates
 *
 * Predefined templates for different types of skills.
 * Templates define which sections to include and
 * provide default content for common skill patterns.
 */

import type { SkillTemplate, SkillTemplateType } from './types'

/**
 * Minimal template for simple tasks
 * Best for: 2-4 steps, 0-2 variables, straightforward workflows
 */
export const minimalTemplate: SkillTemplate = {
  name: 'Minimal Skill',
  type: 'minimal',
  description: 'Lightweight template for simple, straightforward tasks',
  sections: {
    quickStart: true,
    parameters: true,
    whenToUse: true,
    prerequisites: false,
    instructions: true,
    verification: true,
    troubleshooting: false,
    guardrails: false,
    references: false,
  },
  targetTokens: 1000,
}

/**
 * Standard template for most tasks
 * Best for: 4-8 steps, 2-4 variables, typical workflows
 */
export const standardTemplate: SkillTemplate = {
  name: 'Standard Skill',
  type: 'standard',
  description: 'Balanced template for most use cases',
  sections: {
    quickStart: true,
    parameters: true,
    whenToUse: true,
    prerequisites: true,
    instructions: true,
    verification: true,
    troubleshooting: true,
    guardrails: true,
    references: false,
  },
  targetTokens: 2000,
}

/**
 * Complex template for multi-step workflows
 * Best for: 8+ steps, 4+ variables, conditional logic
 */
export const complexTemplate: SkillTemplate = {
  name: 'Complex Skill',
  type: 'complex',
  description: 'Comprehensive template for complex workflows',
  sections: {
    quickStart: true,
    parameters: true,
    whenToUse: true,
    prerequisites: true,
    instructions: true,
    verification: true,
    troubleshooting: true,
    guardrails: true,
    references: true,
  },
  targetTokens: 3000,
}

/**
 * API Integration template
 * Specialized for API-related tasks
 */
export const apiIntegrationTemplate: SkillTemplate = {
  name: 'API Integration Skill',
  type: 'api-integration',
  description: 'Template for API integration and automation tasks',
  sections: {
    quickStart: true,
    parameters: true,
    whenToUse: true,
    prerequisites: true,
    instructions: true,
    verification: true,
    troubleshooting: true,
    guardrails: true,
    references: true,
  },
  targetTokens: 2500,
}

/**
 * All available templates
 */
export const allTemplates: SkillTemplate[] = [
  minimalTemplate,
  standardTemplate,
  complexTemplate,
  apiIntegrationTemplate,
]

/**
 * Get template by type
 */
export function getTemplate(type: SkillTemplateType): SkillTemplate {
  switch (type) {
    case 'minimal':
      return minimalTemplate
    case 'standard':
      return standardTemplate
    case 'complex':
      return complexTemplate
    case 'api-integration':
      return apiIntegrationTemplate
    default:
      return standardTemplate
  }
}

/**
 * Auto-select template based on task characteristics
 */
export function autoSelectTemplate(
  stepCount: number,
  variableCount: number,
  conditionalCount: number
): SkillTemplate {
  const complexity = stepCount + variableCount * 2 + conditionalCount * 3

  if (complexity <= 6) {
    return minimalTemplate
  } else if (complexity <= 15) {
    return standardTemplate
  } else if (complexity <= 25) {
    return apiIntegrationTemplate
  } else {
    return complexTemplate
  }
}

/**
 * Get template recommendations with reasoning
 */
export function getTemplateRecommendations(
  stepCount: number,
  variableCount: number,
  conditionalCount: number
): Array<{ template: SkillTemplate; reason: string }> {
  const recommendations = []

  if (stepCount <= 4 && variableCount <= 2) {
    recommendations.push({
      template: minimalTemplate,
      reason: 'Simple workflow with few steps and variables',
    })
  }

  if (stepCount >= 4 && stepCount <= 10) {
    recommendations.push({
      template: standardTemplate,
      reason: 'Balanced complexity - most common use case',
    })
  }

  if (conditionalCount > 2 || variableCount > 4) {
    recommendations.push({
      template: complexTemplate,
      reason: 'Multiple paths or many variables require comprehensive documentation',
    })
  }

  return recommendations
}
