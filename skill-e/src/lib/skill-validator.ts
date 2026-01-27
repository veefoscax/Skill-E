/**
 * Skill Validator & Linter
 * 
 * Validates SKILL.md format and enforces best practices:
 * - YAML frontmatter syntax validation
 * - Tool definition linting (snake_case, description length)
 * - Atomic scope checking
 * - Required fields validation
 * 
 * Requirements: FR-6.5, FR-6.10, FR-6.18, AC7
 */

import type { SkillFrontmatter, ToolDefinition } from './skill-generator';

/**
 * Validation error severity
 */
export type ValidationSeverity = 'error' | 'warning' | 'info';

/**
 * Validation error
 */
export interface ValidationError {
  /** Error severity */
  severity: ValidationSeverity;
  
  /** Error message */
  message: string;
  
  /** Line number (if applicable) */
  line?: number;
  
  /** Column number (if applicable) */
  column?: number;
  
  /** Error code for programmatic handling */
  code: string;
  
  /** Suggested fix (if available) */
  fix?: string;
}

/**
 * Validation result
 */
export interface ValidationResult {
  /** Whether the skill is valid (no errors) */
  valid: boolean;
  
  /** List of validation errors/warnings */
  errors: ValidationError[];
  
  /** Parsed frontmatter (if valid) */
  frontmatter?: SkillFrontmatter;
  
  /** Token count estimate */
  tokenCount?: number;
}

/**
 * Validate a SKILL.md file
 * 
 * @param markdown - SKILL.md content
 * @param toolDefinition - Optional tool definition to validate
 * @returns Validation result
 */
export function validateSkill(
  markdown: string,
  toolDefinition?: ToolDefinition
): ValidationResult {
  const errors: ValidationError[] = [];
  
  // 1. Validate YAML frontmatter
  const { frontmatter, frontmatterErrors } = validateFrontmatter(markdown);
  errors.push(...frontmatterErrors);
  
  // 2. Validate skill body
  const bodyErrors = validateBody(markdown);
  errors.push(...bodyErrors);
  
  // 3. Validate tool definition (if provided)
  if (toolDefinition) {
    const toolErrors = validateToolDefinition(toolDefinition);
    errors.push(...toolErrors);
  }
  
  // 4. Check token count
  const tokenCount = Math.ceil(markdown.length / 4);
  if (tokenCount > 5000) {
    errors.push({
      severity: 'warning',
      message: `Skill body exceeds recommended token limit (${tokenCount} > 5000 tokens)`,
      code: 'TOKEN_LIMIT_EXCEEDED',
      fix: 'Consider removing unnecessary details or splitting into multiple skills',
    });
  }
  
  // 5. Check for atomic scope violations
  const scopeErrors = checkAtomicScope(markdown);
  errors.push(...scopeErrors);
  
  // Determine if valid (no errors, warnings are OK)
  const valid = !errors.some(e => e.severity === 'error');
  
  return {
    valid,
    errors,
    frontmatter,
    tokenCount,
  };
}

/**
 * Validate YAML frontmatter
 * 
 * @param markdown - SKILL.md content
 * @returns Parsed frontmatter and errors
 */
function validateFrontmatter(markdown: string): {
  frontmatter?: SkillFrontmatter;
  frontmatterErrors: ValidationError[];
} {
  const errors: ValidationError[] = [];
  
  // Check for frontmatter presence
  const frontmatterMatch = markdown.match(/^---\n([\s\S]*?)\n---/);
  
  if (!frontmatterMatch) {
    errors.push({
      severity: 'error',
      message: 'Missing YAML frontmatter (must start with --- and end with ---)',
      code: 'MISSING_FRONTMATTER',
      line: 1,
      fix: 'Add YAML frontmatter at the beginning of the file',
    });
    return { frontmatterErrors: errors };
  }
  
  const yamlText = frontmatterMatch[1];
  
  // Parse YAML
  let frontmatter: SkillFrontmatter;
  try {
    frontmatter = parseYAML(yamlText);
  } catch (error) {
    errors.push({
      severity: 'error',
      message: `Invalid YAML syntax: ${error instanceof Error ? error.message : 'Unknown error'}`,
      code: 'INVALID_YAML',
      line: 1,
    });
    return { frontmatterErrors: errors };
  }
  
  // Validate required fields
  if (!frontmatter.name) {
    errors.push({
      severity: 'error',
      message: 'Missing required field: name',
      code: 'MISSING_FIELD_NAME',
      line: 1,
      fix: 'Add "name: skill-name-here" to frontmatter',
    });
  } else {
    // Validate name format
    const nameErrors = validateSkillName(frontmatter.name);
    errors.push(...nameErrors);
  }
  
  if (!frontmatter.description) {
    errors.push({
      severity: 'error',
      message: 'Missing required field: description',
      code: 'MISSING_FIELD_DESCRIPTION',
      line: 1,
      fix: 'Add "description: Clear description of what this skill does" to frontmatter',
    });
  } else {
    // Validate description length
    if (frontmatter.description.length < 10) {
      errors.push({
        severity: 'warning',
        message: 'Description is too short (should be at least 10 characters)',
        code: 'SHORT_DESCRIPTION',
        fix: 'Provide a more detailed description',
      });
    }
    
    if (frontmatter.description.length > 200) {
      errors.push({
        severity: 'warning',
        message: 'Description is too long (should be under 200 characters)',
        code: 'LONG_DESCRIPTION',
        fix: 'Shorten the description to be more concise',
      });
    }
  }
  
  return { frontmatter, frontmatterErrors: errors };
}

/**
 * Validate skill name format
 * 
 * @param name - Skill name
 * @returns Validation errors
 */
function validateSkillName(name: string): ValidationError[] {
  const errors: ValidationError[] = [];
  
  // Check length
  if (name.length < 3) {
    errors.push({
      severity: 'error',
      message: 'Skill name is too short (minimum 3 characters)',
      code: 'NAME_TOO_SHORT',
      fix: 'Use a more descriptive name',
    });
  }
  
  if (name.length > 64) {
    errors.push({
      severity: 'error',
      message: 'Skill name is too long (maximum 64 characters)',
      code: 'NAME_TOO_LONG',
      fix: 'Shorten the skill name',
    });
  }
  
  // Check format (lowercase with hyphens)
  if (!/^[a-z0-9-]+$/.test(name)) {
    errors.push({
      severity: 'error',
      message: 'Skill name must be lowercase with hyphens only (e.g., "my-skill-name")',
      code: 'INVALID_NAME_FORMAT',
      fix: `Suggested: "${name.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-')}"`,
    });
  }
  
  // Check for leading/trailing hyphens
  if (name.startsWith('-') || name.endsWith('-')) {
    errors.push({
      severity: 'error',
      message: 'Skill name cannot start or end with a hyphen',
      code: 'INVALID_NAME_HYPHENS',
      fix: `Suggested: "${name.replace(/^-+|-+$/g, '')}"`,
    });
  }
  
  // Check for consecutive hyphens
  if (name.includes('--')) {
    errors.push({
      severity: 'warning',
      message: 'Skill name contains consecutive hyphens',
      code: 'CONSECUTIVE_HYPHENS',
      fix: `Suggested: "${name.replace(/-+/g, '-')}"`,
    });
  }
  
  return errors;
}

/**
 * Validate skill body
 * 
 * @param markdown - SKILL.md content
 * @returns Validation errors
 */
function validateBody(markdown: string): ValidationError[] {
  const errors: ValidationError[] = [];
  
  // Extract body (after frontmatter)
  const bodyMatch = markdown.match(/^---\n[\s\S]*?\n---\n([\s\S]*)$/);
  
  if (!bodyMatch) {
    return errors; // Already handled by frontmatter validation
  }
  
  const body = bodyMatch[1];
  
  // Check for required sections
  const requiredSections = [
    { name: 'Instructions', pattern: /##\s+Instructions/i },
    { name: 'Verification', pattern: /##\s+Verification/i },
  ];
  
  for (const section of requiredSections) {
    if (!section.pattern.test(body)) {
      errors.push({
        severity: 'warning',
        message: `Missing recommended section: ${section.name}`,
        code: `MISSING_SECTION_${section.name.toUpperCase()}`,
        fix: `Add a "## ${section.name}" section to the skill`,
      });
    }
  }
  
  // Check for empty sections
  const sections = body.split(/^##\s+/m);
  for (let i = 1; i < sections.length; i++) {
    const section = sections[i];
    const titleMatch = section.match(/^(.+?)\n/);
    if (titleMatch) {
      const title = titleMatch[1].trim();
      const content = section.slice(titleMatch[0].length).trim();
      
      if (content.length < 10) {
        errors.push({
          severity: 'warning',
          message: `Section "${title}" is empty or too short`,
          code: 'EMPTY_SECTION',
          fix: `Add content to the "${title}" section`,
        });
      }
    }
  }
  
  return errors;
}

/**
 * Validate tool definition
 * Requirements: FR-6.18
 * 
 * @param toolDefinition - Tool definition
 * @returns Validation errors
 */
function validateToolDefinition(toolDefinition: ToolDefinition): ValidationError[] {
  const errors: ValidationError[] = [];
  
  // 1. Validate name format (snake_case)
  if (!/^[a-z][a-z0-9_]*$/.test(toolDefinition.name)) {
    errors.push({
      severity: 'error',
      message: 'Tool name must be in snake_case format (e.g., "my_tool_name")',
      code: 'INVALID_TOOL_NAME_FORMAT',
      fix: `Suggested: "${toolDefinition.name.toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/_+/g, '_')}"`,
    });
  }
  
  // 2. Validate description length
  if (!toolDefinition.description) {
    errors.push({
      severity: 'error',
      message: 'Tool definition is missing a description',
      code: 'MISSING_TOOL_DESCRIPTION',
    });
  } else {
    if (toolDefinition.description.length < 20) {
      errors.push({
        severity: 'warning',
        message: 'Tool description is too short (should be at least 20 characters)',
        code: 'SHORT_TOOL_DESCRIPTION',
        fix: 'Provide a more detailed description of what the tool does',
      });
    }
    
    if (toolDefinition.description.length > 500) {
      errors.push({
        severity: 'warning',
        message: 'Tool description is too long (should be under 500 characters)',
        code: 'LONG_TOOL_DESCRIPTION',
        fix: 'Shorten the description to be more concise',
      });
    }
  }
  
  // 3. Validate input schema
  if (!toolDefinition.input_schema) {
    errors.push({
      severity: 'error',
      message: 'Tool definition is missing input_schema',
      code: 'MISSING_INPUT_SCHEMA',
    });
  } else {
    // Validate properties
    if (!toolDefinition.input_schema.properties || Object.keys(toolDefinition.input_schema.properties).length === 0) {
      errors.push({
        severity: 'info',
        message: 'Tool has no input parameters',
        code: 'NO_INPUT_PARAMETERS',
      });
    } else {
      // Validate each property
      for (const [propName, propSchema] of Object.entries(toolDefinition.input_schema.properties)) {
        // Check property name format (snake_case)
        if (!/^[a-z][a-z0-9_]*$/.test(propName)) {
          errors.push({
            severity: 'error',
            message: `Parameter "${propName}" must be in snake_case format`,
            code: 'INVALID_PARAMETER_NAME_FORMAT',
            fix: `Suggested: "${propName.toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/_+/g, '_')}"`,
          });
        }
        
        // Check property description
        if (!propSchema.description) {
          errors.push({
            severity: 'warning',
            message: `Parameter "${propName}" is missing a description`,
            code: 'MISSING_PARAMETER_DESCRIPTION',
          });
        } else if (propSchema.description.length < 5) {
          errors.push({
            severity: 'warning',
            message: `Parameter "${propName}" has a very short description`,
            code: 'SHORT_PARAMETER_DESCRIPTION',
            fix: 'Provide a more detailed description',
          });
        }
      }
    }
  }
  
  return errors;
}

/**
 * Check for atomic scope violations
 * Requirements: FR-6.18
 * 
 * A skill should do ONE thing well. Check for signs of multiple responsibilities.
 * 
 * @param markdown - SKILL.md content
 * @returns Validation errors
 */
function checkAtomicScope(markdown: string): ValidationError[] {
  const errors: ValidationError[] = [];
  
  // Extract body
  const bodyMatch = markdown.match(/^---\n[\s\S]*?\n---\n([\s\S]*)$/);
  if (!bodyMatch) return errors;
  
  const body = bodyMatch[1];
  
  // 1. Check for "and" in skill name/description (sign of multiple responsibilities)
  const frontmatterMatch = markdown.match(/^---\n([\s\S]*?)\n---/);
  if (frontmatterMatch) {
    const yamlText = frontmatterMatch[1];
    
    // Check name
    const nameMatch = yamlText.match(/^name:\s*(.+)$/m);
    if (nameMatch && nameMatch[1].toLowerCase().includes('-and-')) {
      errors.push({
        severity: 'warning',
        message: 'Skill name contains "and", which may indicate multiple responsibilities',
        code: 'ATOMIC_SCOPE_NAME',
        fix: 'Consider splitting into separate skills',
      });
    }
    
    // Check description
    const descMatch = yamlText.match(/^description:\s*(.+)$/m);
    if (descMatch && descMatch[1].toLowerCase().match(/\band\b.*\band\b/)) {
      errors.push({
        severity: 'info',
        message: 'Description contains multiple "and" clauses, which may indicate multiple responsibilities',
        code: 'ATOMIC_SCOPE_DESCRIPTION',
        fix: 'Consider if this skill is trying to do too much',
      });
    }
  }
  
  // 2. Check for too many top-level steps (> 15 suggests complexity)
  const stepMatches = body.match(/^###\s+Step\s+\d+/gm);
  if (stepMatches && stepMatches.length > 15) {
    errors.push({
      severity: 'warning',
      message: `Skill has ${stepMatches.length} steps, which may be too complex`,
      code: 'TOO_MANY_STEPS',
      fix: 'Consider breaking this into multiple smaller skills',
    });
  }
  
  // 3. Check for multiple main sections (sign of doing too much)
  const mainSections = body.match(/^##\s+(?!Parameters|When to Use|Prerequisites|Instructions|Verification|Troubleshooting|Notes)(.+)$/gm);
  if (mainSections && mainSections.length > 3) {
    errors.push({
      severity: 'info',
      message: 'Skill has many custom sections, which may indicate complexity',
      code: 'MANY_SECTIONS',
      fix: 'Ensure the skill has a single, clear purpose',
    });
  }
  
  return errors;
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
 * Format validation errors for display
 * 
 * @param errors - Validation errors
 * @returns Formatted error messages
 */
export function formatValidationErrors(errors: ValidationError[]): string {
  if (errors.length === 0) {
    return 'No validation errors';
  }
  
  const grouped = {
    error: errors.filter(e => e.severity === 'error'),
    warning: errors.filter(e => e.severity === 'warning'),
    info: errors.filter(e => e.severity === 'info'),
  };
  
  const lines: string[] = [];
  
  if (grouped.error.length > 0) {
    lines.push(`❌ ${grouped.error.length} Error(s):`);
    for (const error of grouped.error) {
      lines.push(`  • ${error.message}`);
      if (error.fix) {
        lines.push(`    Fix: ${error.fix}`);
      }
    }
    lines.push('');
  }
  
  if (grouped.warning.length > 0) {
    lines.push(`⚠️  ${grouped.warning.length} Warning(s):`);
    for (const error of grouped.warning) {
      lines.push(`  • ${error.message}`);
      if (error.fix) {
        lines.push(`    Fix: ${error.fix}`);
      }
    }
    lines.push('');
  }
  
  if (grouped.info.length > 0) {
    lines.push(`ℹ️  ${grouped.info.length} Info:`);
    for (const error of grouped.info) {
      lines.push(`  • ${error.message}`);
    }
  }
  
  return lines.join('\n');
}
