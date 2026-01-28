/**
 * Prompt System Types
 * 
 * Type definitions for the optimized prompt generation system.
 * Follows best practices from research on LLM prompt engineering.
 */

import type { OptimizedContext, OptimizedStep } from '../context-optimizer';

/**
 * Prompt generation options
 */
export interface PromptOptions {
  /** Include few-shot examples in prompt */
  includeExamples?: boolean;
  /** Number of examples to include (1-3) */
  exampleCount?: number;
  /** Maximum prompt length in tokens (approximate) */
  maxTokens?: number;
  /** Style of prompt structure */
  structure?: 'xml' | 'markdown' | 'json';
}

/**
 * Prompt section for modular construction
 */
export interface PromptSection {
  /** Section tag name (for XML structure) */
  tag?: string;
  /** Section title (for markdown structure) */
  title?: string;
  /** Section content */
  content: string;
  /** Section priority (for truncation) */
  priority: number;
  /** Approximate token count */
  tokenEstimate?: number;
}

/**
 * Few-shot example for skill generation
 */
export interface FewShotExample {
  /** Example name/identifier */
  name: string;
  /** Input context */
  input: {
    taskGoal: string;
    steps: string[];
    variables?: string[];
  };
  /** Expected output (SKILL.md content) */
  output: string;
  /** Why this example is useful */
  description: string;
}

/**
 * Generated prompt result
 */
export interface GeneratedPrompt {
  /** Final prompt string */
  prompt: string;
  /** Token count estimate */
  tokenEstimate: number;
  /** Sections included */
  sections: string[];
  /** Examples included */
  examples: string[];
}

/**
 * Skill template type
 */
export type SkillTemplateType = 'minimal' | 'standard' | 'complex' | 'api-integration';

/**
 * Skill template configuration
 */
export interface SkillTemplate {
  /** Template name */
  name: string;
  /** Template type */
  type: SkillTemplateType;
  /** Template description */
  description: string;
  /** Sections to include */
  sections: {
    quickStart: boolean;
    parameters: boolean;
    whenToUse: boolean;
    prerequisites: boolean;
    instructions: boolean;
    verification: boolean;
    troubleshooting: boolean;
    guardrails: boolean;
    references: boolean;
  };
  /** Target token count for output */
  targetTokens: number;
}

/**
 * Context for prompt building
 */
export interface PromptBuildContext {
  /** Optimized context from S05 */
  optimizedContext: OptimizedContext;
  /** Template to use */
  template: SkillTemplate;
  /** Options for generation */
  options: PromptOptions;
  /** User preferences */
  preferences?: {
    skillName?: string;
    skillDescription?: string;
    includeScreenshots?: boolean;
    targetAudience?: 'beginner' | 'intermediate' | 'expert';
  };
}

/**
 * Prompt builder interface
 */
export interface IPromptBuilder {
  /** Build complete prompt */
  build(context: PromptBuildContext): GeneratedPrompt;
  /** Build specific section */
  buildSection(section: keyof SkillTemplate['sections'], context: PromptBuildContext): string;
  /** Add few-shot examples */
  addExamples(examples: FewShotExample[]): void;
  /** Estimate token count */
  estimateTokens(prompt: string): number;
}
