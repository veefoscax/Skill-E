/**
 * Tests for Integration Detection
 */

import { describe, it, expect } from 'vitest'
import {
  detectAntigravity,
  detectClaudeCode,
  isRunningInAntigravity,
  isRunningInClaudeCode,
  detectAllIntegrations,
  getIntegrationUnavailableMessage,
  getManualWorkflowInstructions,
} from './integration-detection'

describe('Integration Detection', () => {
  describe('detectAntigravity', () => {
    it('should return false (not available)', async () => {
      const result = await detectAntigravity()
      expect(result).toBe(false)
    })

    it('should be async and resolve quickly', async () => {
      const start = Date.now()
      await detectAntigravity()
      const duration = Date.now() - start

      // Should resolve in less than 100ms (it's just returning false)
      expect(duration).toBeLessThan(100)
    })
  })

  describe('detectClaudeCode', () => {
    it('should return false (not available)', async () => {
      const result = await detectClaudeCode()
      expect(result).toBe(false)
    })

    it('should be async and resolve quickly', async () => {
      const start = Date.now()
      await detectClaudeCode()
      const duration = Date.now() - start

      // Should resolve in less than 100ms
      expect(duration).toBeLessThan(100)
    })
  })

  describe('isRunningInAntigravity', () => {
    it('should return false (not running in Antigravity)', () => {
      const result = isRunningInAntigravity()
      expect(result).toBe(false)
    })

    it('should be synchronous', () => {
      // Should not return a promise
      const result = isRunningInAntigravity()
      expect(result).not.toBeInstanceOf(Promise)
    })
  })

  describe('isRunningInClaudeCode', () => {
    it('should return false (not running in Claude Code)', () => {
      const result = isRunningInClaudeCode()
      expect(result).toBe(false)
    })

    it('should be synchronous', () => {
      // Should not return a promise
      const result = isRunningInClaudeCode()
      expect(result).not.toBeInstanceOf(Promise)
    })
  })

  describe('detectAllIntegrations', () => {
    it('should detect all integrations and return status', async () => {
      const result = await detectAllIntegrations()

      expect(result).toEqual({
        antigravity: false,
        claudeCode: false,
      })
    })

    it('should have correct structure', async () => {
      const result = await detectAllIntegrations()

      expect(result).toHaveProperty('antigravity')
      expect(result).toHaveProperty('claudeCode')
      expect(typeof result.antigravity).toBe('boolean')
      expect(typeof result.claudeCode).toBe('boolean')
    })

    it('should resolve quickly (parallel detection)', async () => {
      const start = Date.now()
      await detectAllIntegrations()
      const duration = Date.now() - start

      // Should resolve in less than 200ms (both checks in parallel)
      expect(duration).toBeLessThan(200)
    })
  })

  describe('getIntegrationUnavailableMessage', () => {
    it('should return message for Antigravity', () => {
      const message = getIntegrationUnavailableMessage('antigravity')

      expect(message).toContain('Antigravity')
      expect(message).toContain('not available')
      expect(message.length).toBeGreaterThan(20)
    })

    it('should return message for Claude Code', () => {
      const message = getIntegrationUnavailableMessage('claudeCode')

      expect(message).toContain('Claude Code')
      expect(message).toContain('not available')
      expect(message.length).toBeGreaterThan(20)
    })

    it('should provide helpful context in messages', () => {
      const antigravityMsg = getIntegrationUnavailableMessage('antigravity')
      const claudeCodeMsg = getIntegrationUnavailableMessage('claudeCode')

      // Should mention manual workflow
      expect(antigravityMsg).toContain('manually')
      expect(claudeCodeMsg).toContain('manually')

      // Should mention SKILL.md
      expect(antigravityMsg).toContain('SKILL.md')
      expect(claudeCodeMsg).toContain('SKILL.md')
    })
  })

  describe('getManualWorkflowInstructions', () => {
    it('should return instructions for Antigravity', () => {
      const instructions = getManualWorkflowInstructions('antigravity')

      expect(Array.isArray(instructions)).toBe(true)
      expect(instructions.length).toBeGreaterThan(0)

      // Should mention key steps
      const allText = instructions.join(' ').toLowerCase()
      expect(allText).toContain('skill')
      expect(allText).toContain('antigravity')
    })

    it('should return instructions for Claude Code', () => {
      const instructions = getManualWorkflowInstructions('claudeCode')

      expect(Array.isArray(instructions)).toBe(true)
      expect(instructions.length).toBeGreaterThan(0)

      // Should mention key steps
      const allText = instructions.join(' ').toLowerCase()
      expect(allText).toContain('skill')
      expect(allText).toContain('claude')
    })

    it('should provide step-by-step instructions', () => {
      const antigravitySteps = getManualWorkflowInstructions('antigravity')
      const claudeCodeSteps = getManualWorkflowInstructions('claudeCode')

      // Should have multiple steps
      expect(antigravitySteps.length).toBeGreaterThanOrEqual(3)
      expect(claudeCodeSteps.length).toBeGreaterThanOrEqual(3)

      // Each step should be a non-empty string
      antigravitySteps.forEach(step => {
        expect(typeof step).toBe('string')
        expect(step.length).toBeGreaterThan(0)
      })

      claudeCodeSteps.forEach(step => {
        expect(typeof step).toBe('string')
        expect(step.length).toBeGreaterThan(0)
      })
    })

    it('should include export step in workflow', () => {
      const antigravitySteps = getManualWorkflowInstructions('antigravity')
      const claudeCodeSteps = getManualWorkflowInstructions('claudeCode')

      const antigravityText = antigravitySteps.join(' ').toLowerCase()
      const claudeCodeText = claudeCodeSteps.join(' ').toLowerCase()

      // Should mention exporting
      expect(antigravityText).toContain('export')
      expect(claudeCodeText).toContain('export')
    })
  })

  describe('Integration consistency', () => {
    it('should have consistent return types across all detection functions', async () => {
      const antigravity = await detectAntigravity()
      const claudeCode = await detectClaudeCode()
      const runningInAntigravity = isRunningInAntigravity()
      const runningInClaudeCode = isRunningInClaudeCode()

      expect(typeof antigravity).toBe('boolean')
      expect(typeof claudeCode).toBe('boolean')
      expect(typeof runningInAntigravity).toBe('boolean')
      expect(typeof runningInClaudeCode).toBe('boolean')
    })

    it('should have all integrations return false (not available)', async () => {
      const all = await detectAllIntegrations()

      // All should be false for MVP
      expect(all.antigravity).toBe(false)
      expect(all.claudeCode).toBe(false)
    })
  })

  describe('Future-proofing', () => {
    it('should be easy to extend with new integrations', async () => {
      // The structure should support adding new integrations
      const result = await detectAllIntegrations()

      // Should be a plain object that can be extended
      expect(typeof result).toBe('object')
      expect(result).not.toBeNull()
      expect(Array.isArray(result)).toBe(false)
    })

    it('should handle integration names consistently', () => {
      // Both functions should accept the same integration names
      const antigravityMsg = getIntegrationUnavailableMessage('antigravity')
      const antigravitySteps = getManualWorkflowInstructions('antigravity')

      expect(antigravityMsg).toBeTruthy()
      expect(antigravitySteps).toBeTruthy()

      const claudeCodeMsg = getIntegrationUnavailableMessage('claudeCode')
      const claudeCodeSteps = getManualWorkflowInstructions('claudeCode')

      expect(claudeCodeMsg).toBeTruthy()
      expect(claudeCodeSteps).toBeTruthy()
    })
  })
})
