/**
 * Skill Validator Tests
 *
 * Tests for skill validation and linting functionality.
 */

import { describe, it, expect } from 'vitest'
import { validateSkill, formatValidationErrors } from './skill-validator'
import type { ToolDefinition } from './skill-generator'

describe('validateSkill', () => {
  describe('Frontmatter Validation', () => {
    it('should reject missing frontmatter', () => {
      const markdown = '# My Skill\n\nSome content'
      const result = validateSkill(markdown)

      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          severity: 'error',
          code: 'MISSING_FRONTMATTER',
        })
      )
    })

    it('should reject missing name field', () => {
      const markdown = `---
description: A test skill
---

# Test Skill`
      const result = validateSkill(markdown)

      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          severity: 'error',
          code: 'MISSING_FIELD_NAME',
        })
      )
    })

    it('should reject missing description field', () => {
      const markdown = `---
name: test-skill
---

# Test Skill`
      const result = validateSkill(markdown)

      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          severity: 'error',
          code: 'MISSING_FIELD_DESCRIPTION',
        })
      )
    })

    it('should accept valid frontmatter', () => {
      const markdown = `---
name: test-skill
description: A valid test skill for testing
---

# Test Skill

## Instructions

1. Do something

## Verification

- [ ] Check something`
      const result = validateSkill(markdown)

      expect(result.valid).toBe(true)
      expect(result.frontmatter).toEqual(
        expect.objectContaining({
          name: 'test-skill',
          description: 'A valid test skill for testing',
        })
      )
    })
  })

  describe('Name Validation', () => {
    it('should reject names that are too short', () => {
      const markdown = `---
name: ab
description: A test skill
---

# Test`
      const result = validateSkill(markdown)

      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          severity: 'error',
          code: 'NAME_TOO_SHORT',
        })
      )
    })

    it('should reject names that are too long', () => {
      const markdown = `---
name: this-is-a-very-long-skill-name-that-exceeds-the-maximum-allowed-length-of-sixty-four-characters
description: A test skill
---

# Test`
      const result = validateSkill(markdown)

      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          severity: 'error',
          code: 'NAME_TOO_LONG',
        })
      )
    })

    it('should reject names with invalid characters', () => {
      const markdown = `---
name: Test_Skill!
description: A test skill
---

# Test`
      const result = validateSkill(markdown)

      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          severity: 'error',
          code: 'INVALID_NAME_FORMAT',
        })
      )
    })

    it('should reject names with leading/trailing hyphens', () => {
      const markdown = `---
name: -test-skill-
description: A test skill
---

# Test`
      const result = validateSkill(markdown)

      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          severity: 'error',
          code: 'INVALID_NAME_HYPHENS',
        })
      )
    })

    it('should warn about consecutive hyphens', () => {
      const markdown = `---
name: test--skill
description: A test skill
---

# Test`
      const result = validateSkill(markdown)

      expect(result.errors).toContainEqual(
        expect.objectContaining({
          severity: 'warning',
          code: 'CONSECUTIVE_HYPHENS',
        })
      )
    })

    it('should accept valid names', () => {
      const validNames = ['test-skill', 'my-awesome-skill', 'skill123', 'a-b-c']

      for (const name of validNames) {
        const markdown = `---
name: ${name}
description: A test skill
---

# Test

## Instructions

1. Do something

## Verification

- [ ] Check`
        const result = validateSkill(markdown)

        const nameErrors = result.errors.filter(
          e => e.code.includes('NAME') && e.severity === 'error'
        )
        expect(nameErrors).toHaveLength(0)
      }
    })
  })

  describe('Description Validation', () => {
    it('should warn about short descriptions', () => {
      const markdown = `---
name: test-skill
description: Short
---

# Test`
      const result = validateSkill(markdown)

      expect(result.errors).toContainEqual(
        expect.objectContaining({
          severity: 'warning',
          code: 'SHORT_DESCRIPTION',
        })
      )
    })

    it('should warn about long descriptions', () => {
      const longDesc = 'A'.repeat(250)
      const markdown = `---
name: test-skill
description: ${longDesc}
---

# Test`
      const result = validateSkill(markdown)

      expect(result.errors).toContainEqual(
        expect.objectContaining({
          severity: 'warning',
          code: 'LONG_DESCRIPTION',
        })
      )
    })
  })

  describe('Body Validation', () => {
    it('should warn about missing Instructions section', () => {
      const markdown = `---
name: test-skill
description: A test skill
---

# Test Skill

## Verification

- [ ] Check something`
      const result = validateSkill(markdown)

      expect(result.errors).toContainEqual(
        expect.objectContaining({
          severity: 'warning',
          code: 'MISSING_SECTION_INSTRUCTIONS',
        })
      )
    })

    it('should warn about missing Verification section', () => {
      const markdown = `---
name: test-skill
description: A test skill
---

# Test Skill

## Instructions

1. Do something`
      const result = validateSkill(markdown)

      expect(result.errors).toContainEqual(
        expect.objectContaining({
          severity: 'warning',
          code: 'MISSING_SECTION_VERIFICATION',
        })
      )
    })
  })

  describe('Token Count Validation', () => {
    it('should warn when token count exceeds limit', () => {
      // Create a skill with > 5000 tokens (> 20000 characters)
      const longContent = 'A'.repeat(21000)
      const markdown = `---
name: test-skill
description: A test skill
---

# Test Skill

${longContent}

## Instructions

1. Do something

## Verification

- [ ] Check`
      const result = validateSkill(markdown)

      expect(result.tokenCount).toBeGreaterThan(5000)
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          severity: 'warning',
          code: 'TOKEN_LIMIT_EXCEEDED',
        })
      )
    })
  })

  describe('Tool Definition Validation', () => {
    it('should reject invalid tool name format', () => {
      const markdown = `---
name: test-skill
description: A test skill
---

# Test`

      const toolDefinition: ToolDefinition = {
        name: 'TestSkill',
        description: 'A test tool',
        input_schema: {
          type: 'object',
          properties: {},
          required: [],
        },
      }

      const result = validateSkill(markdown, toolDefinition)

      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          severity: 'error',
          code: 'INVALID_TOOL_NAME_FORMAT',
        })
      )
    })

    it('should reject missing tool description', () => {
      const markdown = `---
name: test-skill
description: A test skill
---

# Test`

      const toolDefinition: ToolDefinition = {
        name: 'test_skill',
        description: '',
        input_schema: {
          type: 'object',
          properties: {},
          required: [],
        },
      }

      const result = validateSkill(markdown, toolDefinition)

      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          severity: 'error',
          code: 'MISSING_TOOL_DESCRIPTION',
        })
      )
    })

    it('should warn about short tool description', () => {
      const markdown = `---
name: test-skill
description: A test skill
---

# Test`

      const toolDefinition: ToolDefinition = {
        name: 'test_skill',
        description: 'Short',
        input_schema: {
          type: 'object',
          properties: {},
          required: [],
        },
      }

      const result = validateSkill(markdown, toolDefinition)

      expect(result.errors).toContainEqual(
        expect.objectContaining({
          severity: 'warning',
          code: 'SHORT_TOOL_DESCRIPTION',
        })
      )
    })

    it('should reject invalid parameter name format', () => {
      const markdown = `---
name: test-skill
description: A test skill
---

# Test`

      const toolDefinition: ToolDefinition = {
        name: 'test_skill',
        description: 'A test tool for testing',
        input_schema: {
          type: 'object',
          properties: {
            userName: {
              type: 'string',
              description: 'The user name',
            },
          },
          required: ['userName'],
        },
      }

      const result = validateSkill(markdown, toolDefinition)

      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          severity: 'error',
          code: 'INVALID_PARAMETER_NAME_FORMAT',
        })
      )
    })

    it('should accept valid tool definition', () => {
      const markdown = `---
name: test-skill
description: A test skill
---

# Test

## Instructions

1. Do something

## Verification

- [ ] Check`

      const toolDefinition: ToolDefinition = {
        name: 'test_skill',
        description: 'A test tool for testing purposes',
        input_schema: {
          type: 'object',
          properties: {
            user_name: {
              type: 'string',
              description: 'The user name to process',
            },
            action: {
              type: 'string',
              description: 'The action to perform',
              enum: ['create', 'update', 'delete'],
            },
          },
          required: ['user_name', 'action'],
        },
      }

      const result = validateSkill(markdown, toolDefinition)

      expect(result.valid).toBe(true)
    })
  })

  describe('Atomic Scope Validation', () => {
    it('should warn about "and" in skill name', () => {
      const markdown = `---
name: create-and-update-user
description: A test skill
---

# Test`
      const result = validateSkill(markdown)

      expect(result.errors).toContainEqual(
        expect.objectContaining({
          severity: 'warning',
          code: 'ATOMIC_SCOPE_NAME',
        })
      )
    })

    it('should warn about too many steps', () => {
      const steps = Array.from({ length: 20 }, (_, i) => `### Step ${i + 1}\n\nDo something`).join(
        '\n\n'
      )
      const markdown = `---
name: test-skill
description: A test skill
---

# Test Skill

## Instructions

${steps}

## Verification

- [ ] Check`
      const result = validateSkill(markdown)

      expect(result.errors).toContainEqual(
        expect.objectContaining({
          severity: 'warning',
          code: 'TOO_MANY_STEPS',
        })
      )
    })
  })
})

describe('formatValidationErrors', () => {
  it('should format errors by severity', () => {
    const errors = [
      {
        severity: 'error' as const,
        message: 'Error 1',
        code: 'ERR1',
        fix: 'Fix 1',
      },
      {
        severity: 'warning' as const,
        message: 'Warning 1',
        code: 'WARN1',
      },
      {
        severity: 'info' as const,
        message: 'Info 1',
        code: 'INFO1',
      },
    ]

    const formatted = formatValidationErrors(errors)

    expect(formatted).toContain('❌ 1 Error(s)')
    expect(formatted).toContain('⚠️  1 Warning(s)')
    expect(formatted).toContain('ℹ️  1 Info')
    expect(formatted).toContain('Error 1')
    expect(formatted).toContain('Fix: Fix 1')
    expect(formatted).toContain('Warning 1')
    expect(formatted).toContain('Info 1')
  })

  it('should handle no errors', () => {
    const formatted = formatValidationErrors([])
    expect(formatted).toBe('No validation errors')
  })
})
