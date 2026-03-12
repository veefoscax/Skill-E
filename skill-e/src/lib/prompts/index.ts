/**
 * Prompt System
 *
 * Optimized prompt generation for skill creation.
 * Uses XML tag structure and few-shot examples for better results.
 *
 * @example
 * ```typescript
 * import { PromptBuilder, getTemplate, getExamplesByComplexity } from '@/lib/prompts';
 *
 * const prompt = PromptBuilder.build({
 *   optimizedContext,
 *   template: getTemplate('standard'),
 *   options: { includeExamples: true, exampleCount: 2 },
 * });
 * ```
 */

export { PromptBuilder, buildPrompt, buildMinimalPrompt } from './builder'
export {
  getTemplate,
  autoSelectTemplate,
  getTemplateRecommendations,
  minimalTemplate,
  standardTemplate,
  complexTemplate,
  apiIntegrationTemplate,
} from './templates'
export {
  getExamplesByComplexity,
  getExamplesByTemplate,
  simpleLoginExample,
  apiIntegrationExample,
  fileProcessingExample,
} from './examples'
export type {
  PromptOptions,
  PromptSection,
  FewShotExample,
  GeneratedPrompt,
  SkillTemplate,
  SkillTemplateType,
  PromptBuildContext,
} from './types'
