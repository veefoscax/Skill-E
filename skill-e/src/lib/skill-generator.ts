/**
 * Skill Generator
 * 
 * Generates SKILL.md files in AgentSkills format from processed sessions.
 * Uses Claude API with optimized context to create high-quality skills.
 * 
 * Requirements: FR-6.1, FR-6.17
 */

import type { OptimizedContext } from './context-optimizer';
import type { DocReference } from '../types/context-search';
import { formatReferencesSection, shouldIncludeReferences } from './skill-references-formatter';

/**
 * Generated skill content
 */
export interface GeneratedSkill {
  /** SKILL.md markdown content */
  markdown: string;
  
  /** Parsed frontmatter */
  frontmatter: SkillFrontmatter;
  
  /** Tool definition for LLM APIs (OpenAI/Anthropic compatible) */
  toolDefinition: ToolDefinition;
  
  /** Token count estimate */
  tokenCount: number;
  
  /** Generation metadata */
  metadata: {
    generatedAt: number;
    provider: string;
    model: string;
    generationTimeMs: number;
  };
}

/**
 * SKILL.md frontmatter structure
 */
export interface SkillFrontmatter {
  name: string;
  description: string;
  compatibility?: string;
  license?: string;
  metadata?: {
    author?: string;
    version?: string;
    recorded?: string;
    source?: string;
  };
}

/**
 * Tool definition for LLM APIs (OpenAI/Anthropic compatible)
 * Requirements: FR-6.17
 */
export interface ToolDefinition {
  /** Tool name (snake_case) */
  name: string;
  
  /** Tool description */
  description: string;
  
  /** Input schema (JSON Schema) */
  input_schema: {
    type: 'object';
    properties: Record<string, {
      type: string;
      description: string;
      enum?: string[];
    }>;
    required: string[];
  };
}

/**
 * Skill generation options
 */
export interface SkillGenerationOptions {
  /** LLM provider to use (default: 'anthropic') */
  provider?: 'anthropic' | 'openai' | 'openrouter' | 'google' | 'ollama';
  
  /** Model to use (default: 'claude-3-5-sonnet-20241022') */
  model?: string;
  
  /** API key for the provider */
  apiKey?: string;
  
  /** Maximum tokens for response (default: 4000) */
  maxTokens?: number;
  
  /** Temperature for generation (default: 0.3) */
  temperature?: number;
  
  /** Whether to stream the response (default: false) */
  stream?: boolean;
  
  /** Callback for streaming chunks */
  onChunk?: (chunk: string) => void;
  
  /** Documentation references to include (optional) */
  docReferences?: DocReference[];
}

/**
 * Default generation options
 */
const DEFAULT_OPTIONS: Required<Omit<SkillGenerationOptions, 'apiKey' | 'onChunk' | 'docReferences'>> = {
  provider: 'anthropic',
  model: 'claude-3-5-sonnet-20241022',
  maxTokens: 4000,
  temperature: 0.3,
  stream: false,
};

/**
 * Generate a SKILL.md from optimized context
 * 
 * @param context - Optimized context from context-optimizer
 * @param options - Generation options
 * @returns Generated skill
 */
export async function generateSkill(
  context: OptimizedContext,
  options: SkillGenerationOptions = {}
): Promise<GeneratedSkill> {
  const startTime = Date.now();
  
  // Merge options with defaults
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Validate API key
  if (!opts.apiKey) {
    throw new Error('API key is required for skill generation');
  }
  
  // Build the prompt
  const prompt = buildSkillPrompt(context, opts.docReferences);
  
  // Call the LLM
  let markdown: string;
  
  if (opts.stream && opts.onChunk) {
    markdown = await generateWithStreaming(prompt, opts as unknown as Required<SkillGenerationOptions>);
  } else {
    markdown = await generateWithoutStreaming(prompt, opts as unknown as Required<SkillGenerationOptions>);
  }
  
  // Append documentation references if provided
  if (opts.docReferences && shouldIncludeReferences(opts.docReferences)) {
    const referencesSection = formatReferencesSection(opts.docReferences, {
      headingLevel: 2,
      maxSnippetLength: 400,
    });
    
    if (referencesSection) {
      markdown += '\n\n' + referencesSection;
    }
  }
  
  // Parse the generated markdown
  const { frontmatter, body } = parseMarkdown(markdown);
  
  // Generate tool definition
  const toolDefinition = generateToolDefinition(frontmatter, body, context);
  
  // Calculate token count (rough estimate: 1 token ≈ 4 characters)
  const tokenCount = Math.ceil(markdown.length / 4);
  
  const generationTimeMs = Date.now() - startTime;
  
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
  };
}

/**
 * Build the skill generation prompt
 * 
 * @param context - Optimized context
 * @param docReferences - Optional documentation references
 * @returns Prompt string
 */
function buildSkillPrompt(context: OptimizedContext, docReferences?: DocReference[]): string {
  const { taskGoal, keySteps, fullNarration, variables, conditionals, summary } = context;
  
  // Format steps
  const stepsText = keySteps.map((step, i) => {
    const parts = [
      `### Step ${step.number} (${formatTime(step.timeRange.start)} - ${formatTime(step.timeRange.end)})`,
      `**Description**: ${step.description}`,
    ];
    
    if (step.context?.window) {
      parts.push(`**Window**: ${step.context.window}`);
    }
    
    if (step.context?.application) {
      parts.push(`**Application**: ${step.context.application}`);
    }
    
    if (step.actions.clicks > 0 || step.actions.textInputs > 0 || step.actions.annotations > 0) {
      parts.push(`**Actions**: ${step.actions.clicks} clicks, ${step.actions.textInputs} text inputs, ${step.actions.annotations} annotations`);
    }
    
    if (step.notes.length > 0) {
      parts.push(`**Notes**:`);
      step.notes.forEach(note => parts.push(`  - ${note}`));
    }
    
    if (step.ocrText) {
      parts.push(`**OCR Text**: ${step.ocrText}`);
    }
    
    return parts.join('\n');
  }).join('\n\n');
  
  // Format variables
  const variablesText = variables.length > 0
    ? variables.map(v => `- **{${v.name}}** (${v.type}): ${v.description}\n  - Example: "${v.exampleValue}"`).join('\n')
    : 'None detected';
  
  // Format conditionals
  const conditionalsText = conditionals.length > 0
    ? conditionals.map(c => {
        const parts = [`- IF: "${c.condition}" THEN: "${c.thenAction}"`];
        if (c.elseAction) {
          parts.push(`  ELSE: "${c.elseAction}"`);
        }
        return parts.join('\n');
      }).join('\n')
    : 'None detected';
  
  // Format documentation references
  let referencesText = '';
  if (docReferences && docReferences.length > 0) {
    referencesText = '\n\n## Referenced Documentation\n\n';
    referencesText += 'The following libraries/APIs were detected and documentation was fetched:\n\n';
    
    for (const ref of docReferences.slice(0, 3)) { // Limit to top 3 for prompt
      referencesText += `### ${ref.library}\n`;
      referencesText += `**${ref.title}**\n`;
      referencesText += `${ref.snippet.slice(0, 200)}...\n\n`;
      
      if (ref.codeExample) {
        referencesText += `Example:\n\`\`\`\n${ref.codeExample.slice(0, 150)}\n\`\`\`\n\n`;
      }
    }
    
    referencesText += '*Note: Full documentation references will be appended automatically.*\n';
  }
  
  return `# Objective

You are an expert at creating Agent Skills from demonstration recordings.
Transform the provided recording data into a high-quality SKILL.md following
the AgentSkills.io specification.

# Recording Context

## Metadata
- **Duration**: ${summary.durationSeconds} seconds
- **Application**: ${summary.mainApplication || 'Unknown'}
- **Total Steps**: ${summary.totalSteps}
- **Total Clicks**: ${summary.totalClicks}
- **Total Text Inputs**: ${summary.totalTextInputs}
- **Total Annotations**: ${summary.totalAnnotations}

## Task Goal
${taskGoal}

## Full Narration
${fullNarration || 'No narration provided'}

## Detected Steps

${stepsText}

## Confirmed Variables

${variablesText}

## Detected Conditions

${conditionalsText}
${referencesText}

# Generation Instructions

1. **BE CONCISE**: Keep the skill body under 5000 tokens. Claude is smart - 
   only include what's specific to this task.

2. **USE VARIABLES**: Use the confirmed variables with {variable_name} syntax.
   Include a Parameters table with types and descriptions.

3. **HANDLE CONDITIONALS**: When the user demonstrated different paths,
   create clear **If X:** / **Then Y:** sections.

4. **PRESERVE CONTEXT**: Include important explanations from narration as
   notes (> **Note**: ...) but keep them brief.

5. **ADD VERIFICATION**: Include a checklist to confirm successful execution.

6. **REFERENCE SCREENSHOTS**: Mention reference images for critical steps
   using format: [Reference N](references/stepN.png)

7. **ADD TROUBLESHOOTING**: If the user mentioned errors or edge cases,
   add a troubleshooting table.

8. **FOLLOW FORMAT**: Use this exact structure:

\`\`\`yaml
---
name: skill-name-here
description: Clear description of what this skill does and when to use it.
compatibility: ${summary.mainApplication || 'Desktop application'}
license: Apache-2.0
metadata:
  author: Skill-E
  version: "1.0"
  recorded: "${new Date().toISOString().split('T')[0]}"
  source: demonstration
---
\`\`\`

\`\`\`markdown
# Skill Title

Brief description from narration.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| \`{parameter_name}\` | text | yes | Description |

## When to Use

- Situation 1 when this skill applies
- Situation 2 when this skill applies

## Prerequisites

- Required access or permissions
- Required applications open

## Instructions

### Step 1: Title

1. First action
2. Second action

> **Note**: Important context from annotation or narration

### Step 2: Title

**If \`{parameter}\` = \`value1\`:**
1. Do this path
2. Continue here

**If \`{parameter}\` = \`value2\`:**
1. Do alternative path
2. Continue here

## Verification

- [ ] Checkpoint 1 completed
- [ ] Checkpoint 2 completed
- [ ] Final state matches expected

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Error X | Try solution Y |

---
*Generated by Skill-E from demonstration recording*
\`\`\`

# Output Format

Generate ONLY the SKILL.md content, starting with YAML frontmatter (---).
Do NOT include any explanations or meta-commentary.
Do NOT wrap the output in markdown code blocks.
Just output the raw SKILL.md content.

Required frontmatter fields:
- name: lowercase with hyphens, 1-64 chars
- description: 1-2 sentences, what it does and when to use

Required body sections:
- Title with #
- Parameters (if variables exist)
- When to Use
- Instructions (numbered steps)
- Verification (checklist)
`;
}

/**
 * Generate skill without streaming
 * 
 * @param prompt - Generation prompt
 * @param options - Generation options
 * @returns Generated markdown
 */
async function generateWithoutStreaming(
  prompt: string,
  options: Required<Omit<SkillGenerationOptions, 'apiKey' | 'onChunk'>> & { apiKey: string }
): Promise<string> {
  const { provider, model, apiKey, maxTokens, temperature } = options;
  
  if (provider === 'anthropic') {
    return await callAnthropicAPI(prompt, model, apiKey, maxTokens, temperature);
  } else if (provider === 'openai') {
    return await callOpenAIAPI(prompt, model, apiKey, maxTokens, temperature);
  } else if (provider === 'openrouter') {
    return await callOpenRouterAPI(prompt, model, apiKey, maxTokens, temperature);
  } else {
    throw new Error(`Provider ${provider} not yet implemented`);
  }
}

/**
 * Generate skill with streaming
 * 
 * @param prompt - Generation prompt
 * @param options - Generation options
 * @returns Generated markdown
 */
async function generateWithStreaming(
  prompt: string,
  options: Required<SkillGenerationOptions>
): Promise<string> {
  const { provider, model, apiKey, maxTokens, temperature, onChunk } = options;
  
  if (provider === 'anthropic') {
    return await callAnthropicAPIStreaming(prompt, model, apiKey, maxTokens, temperature, onChunk!);
  } else {
    throw new Error(`Streaming not yet implemented for provider ${provider}`);
  }
}

/**
 * Call Anthropic API (Claude)
 * 
 * @param prompt - Generation prompt
 * @param model - Model name
 * @param apiKey - API key
 * @param maxTokens - Maximum tokens
 * @param temperature - Temperature
 * @returns Generated text
 */
async function callAnthropicAPI(
  prompt: string,
  model: string,
  apiKey: string,
  maxTokens: number,
  temperature: number
): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      temperature,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Anthropic API error: ${response.status} ${error}`);
  }
  
  const data = await response.json();
  
  if (!data.content || !data.content[0] || !data.content[0].text) {
    throw new Error('Invalid response from Anthropic API');
  }
  
  return data.content[0].text;
}

/**
 * Call Anthropic API with streaming
 * 
 * @param prompt - Generation prompt
 * @param model - Model name
 * @param apiKey - API key
 * @param maxTokens - Maximum tokens
 * @param temperature - Temperature
 * @param onChunk - Callback for chunks
 * @returns Generated text
 */
async function callAnthropicAPIStreaming(
  prompt: string,
  model: string,
  apiKey: string,
  maxTokens: number,
  temperature: number,
  onChunk: (chunk: string) => void
): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      temperature,
      stream: true,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Anthropic API error: ${response.status} ${error}`);
  }
  
  if (!response.body) {
    throw new Error('No response body from Anthropic API');
  }
  
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullText = '';
  
  try {
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;
      
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter(line => line.trim() !== '');
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          
          if (data === '[DONE]') {
            break;
          }
          
          try {
            const parsed = JSON.parse(data);
            
            if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
              const text = parsed.delta.text;
              fullText += text;
              onChunk(text);
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
  
  return fullText;
}

/**
 * Call OpenAI API
 * 
 * @param prompt - Generation prompt
 * @param model - Model name
 * @param apiKey - API key
 * @param maxTokens - Maximum tokens
 * @param temperature - Temperature
 * @returns Generated text
 */
async function callOpenAIAPI(
  prompt: string,
  model: string,
  apiKey: string,
  maxTokens: number,
  temperature: number
): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      temperature,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${response.status} ${error}`);
  }
  
  const data = await response.json();
  
  if (!data.choices || !data.choices[0] || !data.choices[0].message?.content) {
    throw new Error('Invalid response from OpenAI API');
  }
  
  return data.choices[0].message.content;
}

/**
 * Call OpenRouter API
 * 
 * @param prompt - Generation prompt
 * @param model - Model name
 * @param apiKey - API key
 * @param maxTokens - Maximum tokens
 * @param temperature - Temperature
 * @returns Generated text
 */
async function callOpenRouterAPI(
  prompt: string,
  model: string,
  apiKey: string,
  maxTokens: number,
  temperature: number
): Promise<string> {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://skill-e.app',
      'X-Title': 'Skill-E',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      temperature,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} ${error}`);
  }
  
  const data = await response.json();
  
  if (!data.choices || !data.choices[0] || !data.choices[0].message?.content) {
    throw new Error('Invalid response from OpenRouter API');
  }
  
  return data.choices[0].message.content;
}

/**
 * Parse markdown into frontmatter and body
 * 
 * @param markdown - Raw markdown content
 * @returns Parsed frontmatter and body
 */
function parseMarkdown(markdown: string): { frontmatter: SkillFrontmatter; body: string } {
  // Extract YAML frontmatter
  const frontmatterMatch = markdown.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  
  if (!frontmatterMatch) {
    throw new Error('Invalid SKILL.md format: missing YAML frontmatter');
  }
  
  const yamlText = frontmatterMatch[1];
  const body = frontmatterMatch[2];
  
  // Parse YAML (simple parser for our specific format)
  const frontmatter = parseYAML(yamlText);
  
  return { frontmatter, body };
}

/**
 * Simple YAML parser for frontmatter
 * 
 * @param yaml - YAML text
 * @returns Parsed frontmatter
 */
function parseYAML(yaml: string): SkillFrontmatter {
  const lines = yaml.split('\n');
  const result: any = {};
  let currentKey: string | null = null;
  let currentObject: any = null;
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    if (trimmed === '') continue;
    
    // Check for nested object
    if (trimmed.endsWith(':') && !trimmed.includes('"')) {
      currentKey = trimmed.slice(0, -1);
      currentObject = {};
      result[currentKey] = currentObject;
      continue;
    }
    
    // Parse key-value pair
    const match = trimmed.match(/^(\w+):\s*(.+)$/);
    if (match) {
      const [, key, value] = match;
      const cleanValue = value.replace(/^["']|["']$/g, '');
      
      if (currentObject) {
        currentObject[key] = cleanValue;
      } else {
        result[key] = cleanValue;
      }
    }
  }
  
  return result as SkillFrontmatter;
}

/**
 * Generate tool definition from skill
 * Requirements: FR-6.17
 * 
 * @param frontmatter - Parsed frontmatter
 * @param body - Skill body
 * @param context - Optimized context
 * @returns Tool definition
 */
function generateToolDefinition(
  frontmatter: SkillFrontmatter,
  body: string,
  context: OptimizedContext
): ToolDefinition {
  // Convert skill name to snake_case
  const toolName = frontmatter.name.replace(/-/g, '_');
  
  // Extract parameters from the skill body
  const properties: Record<string, { type: string; description: string; enum?: string[] }> = {};
  const required: string[] = [];
  
  // Parse parameters table from markdown
  const parametersMatch = body.match(/## Parameters\s+([\s\S]*?)(?=\n##|$)/);
  
  if (parametersMatch) {
    const parametersSection = parametersMatch[1];
    const rows = parametersSection.split('\n').filter(line => line.includes('|') && !line.includes('---'));
    
    // Skip header row
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const cells = row.split('|').map(cell => cell.trim()).filter(cell => cell !== '');
      
      if (cells.length >= 4) {
        const paramName = cells[0].replace(/[`{}]/g, '');
        const paramType = cells[1];
        const isRequired = cells[2].toLowerCase() === 'yes';
        const description = cells[3];
        
        // Map skill types to JSON Schema types
        let schemaType = 'string';
        let enumValues: string[] | undefined;
        
        if (paramType.includes('number')) {
          schemaType = 'number';
        } else if (paramType.includes('boolean')) {
          schemaType = 'boolean';
        } else if (paramType.includes('selection') || paramType.includes('|')) {
          schemaType = 'string';
          // Extract enum values
          const enumMatch = description.match(/Options?:\s*`([^`]+)`/);
          if (enumMatch) {
            enumValues = enumMatch[1].split(/\s*\|\s*/);
          }
        }
        
        properties[paramName] = {
          type: schemaType,
          description,
          ...(enumValues && { enum: enumValues }),
        };
        
        if (isRequired) {
          required.push(paramName);
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
      };
      required.push(variable.name);
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
  };
}

/**
 * Map variable type to JSON Schema type
 * 
 * @param type - Variable type
 * @returns JSON Schema type
 */
function mapVariableTypeToJsonSchema(type: string): string {
  switch (type) {
    case 'number':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'email':
    case 'url':
    case 'date':
    case 'file':
    case 'password':
    case 'text':
    case 'selection':
    default:
      return 'string';
  }
}

/**
 * Format time in MM:SS format
 * 
 * @param ms - Time in milliseconds
 * @returns Formatted time
 */
function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}
