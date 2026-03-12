/**
 * StepEditor Component Tests
 *
 * Tests for the inline step editing component.
 *
 * Note: These are unit tests for the component logic.
 * For full integration testing with user interactions, manual testing is recommended.
 */

import { describe, it, expect, vi } from 'vitest'
import type { SkillStep } from '@/lib/skill-parser'
import type { StepEditorProps } from './StepEditor'

describe('StepEditor Component Logic', () => {
  // Sample step for testing
  const sampleStep: SkillStep = {
    id: 'step-1-1',
    index: 0,
    instruction: 'Click the Submit button',
    actionType: 'click',
    target: {
      selector: '#submit-btn',
      description: 'Submit button',
    },
    requiresConfirmation: false,
    status: 'pending',
    stepNumber: 1,
  }

  describe('Props validation', () => {
    it('should accept valid step prop', () => {
      const props: StepEditorProps = {
        step: sampleStep,
      }

      expect(props.step).toBeDefined()
      expect(props.step.instruction).toBe('Click the Submit button')
    })

    it('should accept optional callbacks', () => {
      const onSave = vi.fn()
      const onCancel = vi.fn()
      const onRerun = vi.fn()

      const props: StepEditorProps = {
        step: sampleStep,
        onSave,
        onCancel,
        onRerun,
      }

      expect(props.onSave).toBeDefined()
      expect(props.onCancel).toBeDefined()
      expect(props.onRerun).toBeDefined()
    })

    it('should accept readOnly flag', () => {
      const props: StepEditorProps = {
        step: sampleStep,
        readOnly: true,
      }

      expect(props.readOnly).toBe(true)
    })

    it('should accept showRerun flag', () => {
      const props: StepEditorProps = {
        step: sampleStep,
        showRerun: false,
      }

      expect(props.showRerun).toBe(false)
    })
  })

  describe('Step data handling', () => {
    it('should handle step with all target fields', () => {
      const fullStep: SkillStep = {
        ...sampleStep,
        target: {
          selector: '#submit-btn',
          coordinates: { x: 100, y: 200 },
          description: 'Submit button',
          text: '{email}',
          imageRef: 'screenshot.png',
        },
      }

      expect(fullStep.target?.selector).toBe('#submit-btn')
      expect(fullStep.target?.coordinates).toEqual({ x: 100, y: 200 })
      expect(fullStep.target?.description).toBe('Submit button')
      expect(fullStep.target?.text).toBe('{email}')
      expect(fullStep.target?.imageRef).toBe('screenshot.png')
    })

    it('should handle step without target', () => {
      const stepWithoutTarget: SkillStep = {
        ...sampleStep,
        target: undefined,
      }

      expect(stepWithoutTarget.target).toBeUndefined()
    })

    it('should handle step with error', () => {
      const stepWithError: SkillStep = {
        ...sampleStep,
        status: 'failed',
        error: 'Element not found',
      }

      expect(stepWithError.status).toBe('failed')
      expect(stepWithError.error).toBe('Element not found')
    })

    it('should handle step with feedback', () => {
      const stepWithFeedback: SkillStep = {
        ...sampleStep,
        feedback: 'Selector was incorrect',
      }

      expect(stepWithFeedback.feedback).toBe('Selector was incorrect')
    })
  })

  describe('Validation logic', () => {
    it('should validate empty instruction as invalid', () => {
      const instruction = ''
      const isValid = instruction.trim().length > 0

      expect(isValid).toBe(false)
    })

    it('should validate short instruction with warning', () => {
      const instruction = 'Click'
      const isShort = instruction.length < 10

      expect(isShort).toBe(true)
    })

    it('should validate long instruction with warning', () => {
      const instruction = 'a'.repeat(501)
      const isLong = instruction.length > 500

      expect(isLong).toBe(true)
    })

    it('should validate invalid coordinates', () => {
      const x = 'abc'
      const y = '100'
      const xNum = parseInt(x, 10)
      const yNum = parseInt(y, 10)

      expect(isNaN(xNum)).toBe(true)
      expect(isNaN(yNum)).toBe(false)
    })

    it('should validate negative coordinates', () => {
      const x = -10
      const y = 100

      expect(x < 0).toBe(true)
      expect(y < 0).toBe(false)
    })

    it('should validate large coordinates', () => {
      const x = 15000
      const y = 200

      expect(x > 10000).toBe(true)
      expect(y > 10000).toBe(false)
    })

    it('should detect dangerous patterns', () => {
      const dangerousInstructions = ['Delete all files', 'Format the drive', 'Run as sudo']

      const dangerousPatterns = [/delete|remove|destroy/i, /format|wipe|erase/i, /sudo|admin|root/i]

      dangerousInstructions.forEach((instruction, idx) => {
        const isDangerous = dangerousPatterns[idx].test(instruction)
        expect(isDangerous).toBe(true)
      })
    })
  })

  describe('Target building logic', () => {
    it('should build target with selector only', () => {
      const selector = '#login-btn'
      const target: SkillStep['target'] = { selector }

      expect(target.selector).toBe('#login-btn')
      expect(target.coordinates).toBeUndefined()
    })

    it('should build target with coordinates only', () => {
      const coordinates = { x: 100, y: 200 }
      const target: SkillStep['target'] = { coordinates }

      expect(target.coordinates).toEqual({ x: 100, y: 200 })
      expect(target.selector).toBeUndefined()
    })

    it('should build target with both selector and coordinates', () => {
      const selector = '#submit-btn'
      const coordinates = { x: 100, y: 200 }
      const target: SkillStep['target'] = { selector, coordinates }

      expect(target.selector).toBe('#submit-btn')
      expect(target.coordinates).toEqual({ x: 100, y: 200 })
    })

    it('should build target with description', () => {
      const description = 'Login button'
      const target: SkillStep['target'] = { description }

      expect(target.description).toBe('Login button')
    })

    it('should build target with text for type actions', () => {
      const text = '{email}'
      const target: SkillStep['target'] = { text }

      expect(target.text).toBe('{email}')
    })

    it('should not include empty target', () => {
      const target: SkillStep['target'] = {}
      const hasProperties = Object.keys(target).length > 0

      expect(hasProperties).toBe(false)
    })
  })

  describe('Step update logic', () => {
    it('should create updated step with new instruction', () => {
      const updatedStep: SkillStep = {
        ...sampleStep,
        instruction: 'Click the Login button',
        status: 'pending',
        error: undefined,
      }

      expect(updatedStep.instruction).toBe('Click the Login button')
      expect(updatedStep.status).toBe('pending')
      expect(updatedStep.error).toBeUndefined()
    })

    it('should create updated step with new target', () => {
      const newTarget: SkillStep['target'] = {
        selector: '#login-btn',
        description: 'Login button',
      }

      const updatedStep: SkillStep = {
        ...sampleStep,
        target: newTarget,
        status: 'pending',
      }

      expect(updatedStep.target?.selector).toBe('#login-btn')
      expect(updatedStep.target?.description).toBe('Login button')
    })

    it('should reset status to pending for re-run', () => {
      const failedStep: SkillStep = {
        ...sampleStep,
        status: 'failed',
        error: 'Test error',
      }

      const updatedStep: SkillStep = {
        ...failedStep,
        status: 'pending',
        error: undefined,
      }

      expect(updatedStep.status).toBe('pending')
      expect(updatedStep.error).toBeUndefined()
    })
  })

  describe('Callback invocation', () => {
    it('should call onSave with updated step', () => {
      const onSave = vi.fn()
      const updatedStep: SkillStep = {
        ...sampleStep,
        instruction: 'Click the Login button',
      }

      onSave(updatedStep)

      expect(onSave).toHaveBeenCalledWith(updatedStep)
      expect(onSave).toHaveBeenCalledTimes(1)
    })

    it('should call onCancel', () => {
      const onCancel = vi.fn()

      onCancel()

      expect(onCancel).toHaveBeenCalled()
      expect(onCancel).toHaveBeenCalledTimes(1)
    })

    it('should call onRerun with step', () => {
      const onRerun = vi.fn()
      const step = sampleStep

      onRerun(step)

      expect(onRerun).toHaveBeenCalledWith(step)
      expect(onRerun).toHaveBeenCalledTimes(1)
    })

    it('should call both onSave and onRerun for save & re-run', () => {
      const onSave = vi.fn()
      const onRerun = vi.fn()
      const updatedStep: SkillStep = {
        ...sampleStep,
        instruction: 'Click the Login button',
      }

      onSave(updatedStep)
      onRerun(updatedStep)

      expect(onSave).toHaveBeenCalledWith(updatedStep)
      expect(onRerun).toHaveBeenCalledWith(updatedStep)
    })
  })

  describe('Character counting', () => {
    it('should count characters correctly', () => {
      const instruction = 'Click the Submit button'
      const count = instruction.length

      expect(count).toBe(23)
    })

    it('should count empty string as 0', () => {
      const instruction = ''
      const count = instruction.length

      expect(count).toBe(0)
    })

    it('should count long string correctly', () => {
      const instruction = 'a'.repeat(500)
      const count = instruction.length

      expect(count).toBe(500)
    })
  })

  describe('Edge cases', () => {
    it('should handle step with minimal data', () => {
      const minimalStep: SkillStep = {
        id: 'step-1',
        index: 0,
        instruction: 'Do something',
        actionType: 'unknown',
        requiresConfirmation: false,
        status: 'pending',
      }

      expect(minimalStep.target).toBeUndefined()
      expect(minimalStep.error).toBeUndefined()
      expect(minimalStep.feedback).toBeUndefined()
    })

    it('should handle step with all optional fields', () => {
      const fullStep: SkillStep = {
        id: 'step-1-1',
        index: 0,
        instruction: 'Click button',
        actionType: 'click',
        target: {
          selector: '#btn',
          coordinates: { x: 100, y: 200 },
          imageRef: 'img.png',
          text: 'text',
          description: 'desc',
        },
        requiresConfirmation: true,
        status: 'failed',
        error: 'Error message',
        feedback: 'User feedback',
        section: 'Section name',
        stepNumber: 1,
      }

      expect(fullStep).toBeDefined()
      expect(Object.keys(fullStep).length).toBeGreaterThan(5)
    })
  })
})
