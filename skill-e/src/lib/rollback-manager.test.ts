/**
 * Rollback Manager Tests
 *
 * Tests for state management and rollback functionality.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { RollbackManager, createRollbackManager } from './rollback-manager'
import type { SkillStep } from './skill-parser'

describe('RollbackManager', () => {
  let manager: RollbackManager
  let mockWindow: Window

  beforeEach(() => {
    // Create mock window with DOM
    mockWindow = {
      document: {
        querySelector: vi.fn(),
        createElement: vi.fn(),
        title: 'Test Page',
      },
      location: {
        href: 'https://example.com/page1',
      },
      history: {
        back: vi.fn(),
        state: null,
      },
      scrollX: 0,
      scrollY: 100,
      scrollTo: vi.fn(),
      localStorage: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      },
      sessionStorage: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      },
    } as any

    manager = new RollbackManager(mockWindow)
  })

  describe('Action Classification', () => {
    it('should classify delete actions', async () => {
      const step: SkillStep = {
        id: 'step-1',
        index: 0,
        instruction: 'Delete the item',
        actionType: 'click',
        target: { selector: '.item' },
        requiresConfirmation: false,
        status: 'pending',
      }

      // Mock element
      const mockElement = {
        tagName: 'DIV',
        outerHTML: '<div class="item">Test</div>',
        parentElement: {
          tagName: 'DIV',
          id: 'parent',
          children: [{ outerHTML: '<div class="item">Test</div>' }],
        },
      }
      vi.mocked(mockWindow.document.querySelector).mockReturnValue(mockElement as any)

      const state = await manager.saveState(step)

      expect(state).toBeTruthy()
      expect(state?.actionType).toBe('delete')
      expect(state?.isReversible).toBe(true)
    })

    it('should classify navigation actions', async () => {
      const step: SkillStep = {
        id: 'step-2',
        index: 1,
        instruction: 'Navigate to settings',
        actionType: 'navigate',
        target: { text: 'https://example.com/settings' },
        requiresConfirmation: false,
        status: 'pending',
      }

      const state = await manager.saveState(step)

      expect(state).toBeTruthy()
      expect(state?.actionType).toBe('navigation')
      expect(state?.isReversible).toBe(true)
    })

    it('should classify form submit actions', async () => {
      const step: SkillStep = {
        id: 'step-3',
        index: 2,
        instruction: 'Submit the form',
        actionType: 'click',
        target: { selector: 'form' },
        requiresConfirmation: false,
        status: 'pending',
      }

      // Mock form element with proper structure
      const mockInput1 = { name: 'field1', value: 'value1' }
      const mockInput2 = { name: 'field2', value: 'value2' }

      const mockForm = {
        tagName: 'FORM',
        elements: {
          namedItem: vi.fn(),
        },
        querySelectorAll: vi.fn().mockReturnValue([mockInput1, mockInput2]),
      }

      // Make instanceof work
      Object.setPrototypeOf(mockForm, HTMLFormElement.prototype)

      // Mock FormData to throw (to test fallback)
      global.FormData = vi.fn().mockImplementation(() => {
        throw new Error('FormData not supported in test')
      }) as any

      vi.mocked(mockWindow.document.querySelector).mockReturnValue(mockForm as any)

      const state = await manager.saveState(step)

      expect(state).toBeTruthy()
      expect(state?.actionType).toBe('form_submit')
      expect(state?.isReversible).toBe(true)
    })

    it('should classify DOM change actions', async () => {
      const step: SkillStep = {
        id: 'step-4',
        index: 3,
        instruction: 'Type username',
        actionType: 'type',
        target: { selector: '#username', text: 'testuser' },
        requiresConfirmation: false,
        status: 'pending',
      }

      // Mock input element - needs to be an actual HTMLInputElement-like object
      const mockInput = {
        tagName: 'INPUT',
        id: 'username',
        className: 'form-input',
        value: 'oldvalue',
        // Add constructor check for instanceof
        constructor: { name: 'HTMLInputElement' },
      }

      // Make instanceof work
      Object.setPrototypeOf(mockInput, HTMLInputElement.prototype)

      vi.mocked(mockWindow.document.querySelector).mockReturnValue(mockInput as any)

      const state = await manager.saveState(step)

      expect(state).toBeTruthy()
      expect(state?.actionType).toBe('dom_change')
      expect(state?.isReversible).toBe(true)
      expect(state?.data.type).toBe('dom_change')
      if (state?.data.type === 'dom_change') {
        expect(state.data.previousValue).toBe('oldvalue')
        expect(state.data.property).toBe('value')
      }
    })

    it('should classify file upload actions', async () => {
      const step: SkillStep = {
        id: 'step-5',
        index: 4,
        instruction: 'Upload file',
        actionType: 'click',
        target: { selector: 'input[type="file"]' },
        requiresConfirmation: false,
        status: 'pending',
      }

      const state = await manager.saveState(step)

      expect(state).toBeTruthy()
      expect(state?.actionType).toBe('file_upload')
      expect(state?.isReversible).toBe(true)
    })

    it('should classify storage change actions', async () => {
      const step: SkillStep = {
        id: 'step-6',
        index: 5,
        instruction: 'Set localStorage value',
        actionType: 'click',
        target: { text: 'userToken' },
        requiresConfirmation: false,
        status: 'pending',
      }

      vi.mocked(mockWindow.localStorage.getItem).mockReturnValue('oldToken')

      const state = await manager.saveState(step)

      expect(state).toBeTruthy()
      expect(state?.actionType).toBe('storage_change')
      expect(state?.isReversible).toBe(true)
    })

    it('should not save state for non-reversible actions', async () => {
      const step: SkillStep = {
        id: 'step-7',
        index: 6,
        instruction: 'Click the button',
        actionType: 'click',
        target: { selector: '.button' },
        requiresConfirmation: false,
        status: 'pending',
      }

      const state = await manager.saveState(step)

      expect(state).toBeNull()
    })
  })

  describe('State Capture', () => {
    it('should capture DOM change state correctly', async () => {
      const step: SkillStep = {
        id: 'step-1',
        index: 0,
        instruction: 'Type in field',
        actionType: 'type',
        target: { selector: '#field', text: 'new value' },
        requiresConfirmation: false,
        status: 'pending',
      }

      const mockInput = {
        tagName: 'INPUT',
        id: 'field',
        className: 'input',
        value: 'old value',
      }
      Object.setPrototypeOf(mockInput, HTMLInputElement.prototype)
      vi.mocked(mockWindow.document.querySelector).mockReturnValue(mockInput as any)

      const state = await manager.saveState(step)

      expect(state).toBeTruthy()
      expect(state?.data.type).toBe('dom_change')
      if (state?.data.type === 'dom_change') {
        expect(state.data.selector).toBe('#field')
        expect(state.data.previousValue).toBe('old value')
        expect(state.data.property).toBe('value')
        expect(state.data.elementSnapshot?.tagName).toBe('INPUT')
        expect(state.data.elementSnapshot?.id).toBe('field')
      }
    })

    it('should capture navigation state correctly', async () => {
      const step: SkillStep = {
        id: 'step-2',
        index: 1,
        instruction: 'Go to page 2',
        actionType: 'navigate',
        target: { text: 'https://example.com/page2' },
        requiresConfirmation: false,
        status: 'pending',
      }

      const state = await manager.saveState(step)

      expect(state).toBeTruthy()
      expect(state?.data.type).toBe('navigation')
      if (state?.data.type === 'navigation') {
        expect(state.data.previousUrl).toBe('https://example.com/page1')
        expect(state.data.previousTitle).toBe('Test Page')
        expect(state.data.scrollPosition).toEqual({ x: 0, y: 100 })
      }
    })

    it('should capture delete state with element HTML', async () => {
      const step: SkillStep = {
        id: 'step-3',
        index: 2,
        instruction: 'Delete item',
        actionType: 'click',
        target: { selector: '.item' },
        requiresConfirmation: false,
        status: 'pending',
      }

      const mockOther = { outerHTML: '<div class="other">Other</div>' }

      // Create the element that will be returned by querySelector
      const mockElement = {
        tagName: 'DIV',
        className: 'item',
        outerHTML: '<div class="item">Content</div>',
        parentElement: null as any, // Will be set below
      }

      // Create parent with children array that includes the actual mockElement reference
      mockElement.parentElement = {
        tagName: 'DIV',
        id: 'parent',
        children: [mockOther, mockElement], // Use the same reference
      }

      vi.mocked(mockWindow.document.querySelector).mockReturnValue(mockElement as any)

      const state = await manager.saveState(step)

      expect(state).toBeTruthy()
      expect(state?.data.type).toBe('delete')
      if (state?.data.type === 'delete') {
        expect(state.data.deletedHTML).toBe('<div class="item">Content</div>')
        expect(state.data.parentSelector).toBe('div#parent')
        // The element is the second child (index 1)
        expect(state.data.positionInParent).toBe(1)
      }
    })
  })

  describe('Rollback Operations', () => {
    it('should rollback DOM changes', async () => {
      const step: SkillStep = {
        id: 'step-1',
        index: 0,
        instruction: 'Type new value',
        actionType: 'type',
        target: { selector: '#input', text: 'new' },
        requiresConfirmation: false,
        status: 'pending',
      }

      const mockInput = {
        tagName: 'INPUT',
        id: 'input',
        value: 'old',
      }
      Object.setPrototypeOf(mockInput, HTMLInputElement.prototype)

      // Return the same mock for both saveState and rollback calls
      vi.mocked(mockWindow.document.querySelector).mockReturnValue(mockInput as any)

      const state = await manager.saveState(step)
      expect(state).toBeTruthy()

      // Simulate change
      mockInput.value = 'new'
      expect(mockInput.value).toBe('new')

      // Rollback - querySelector should still return the same mock
      const result = await manager.rollback(state!.id)

      expect(result.success).toBe(true)
      expect(mockInput.value).toBe('old')
    })

    it('should rollback navigation', async () => {
      const step: SkillStep = {
        id: 'step-2',
        index: 1,
        instruction: 'Navigate away',
        actionType: 'navigate',
        target: { text: 'https://example.com/other' },
        requiresConfirmation: false,
        status: 'pending',
      }

      const state = await manager.saveState(step)
      expect(state).toBeTruthy()

      // Rollback
      const result = await manager.rollback(state!.id)

      expect(result.success).toBe(true)
      expect(mockWindow.history.back).toHaveBeenCalled()
    })

    it('should rollback storage changes', async () => {
      const step: SkillStep = {
        id: 'step-3',
        index: 2,
        instruction: 'Set localStorage key',
        actionType: 'click',
        target: { text: 'myKey' },
        requiresConfirmation: false,
        status: 'pending',
      }

      vi.mocked(mockWindow.localStorage.getItem).mockReturnValue('oldValue')

      const state = await manager.saveState(step)
      expect(state).toBeTruthy()

      // Rollback
      const result = await manager.rollback(state!.id)

      expect(result.success).toBe(true)
      expect(mockWindow.localStorage.setItem).toHaveBeenCalledWith('myKey', 'oldValue')
    })

    it('should rollback file upload by clearing input', async () => {
      const step: SkillStep = {
        id: 'step-4',
        index: 3,
        instruction: 'Upload file',
        actionType: 'click',
        target: { selector: 'input[type="file"]' },
        requiresConfirmation: false,
        status: 'pending',
      }

      const mockFileInput = {
        tagName: 'INPUT',
        type: 'file',
        value: 'C:\\fakepath\\file.txt',
      }
      Object.setPrototypeOf(mockFileInput, HTMLInputElement.prototype)
      vi.mocked(mockWindow.document.querySelector).mockReturnValue(mockFileInput as any)

      const state = await manager.saveState(step)
      expect(state).toBeTruthy()

      // Rollback
      const result = await manager.rollback(state!.id)

      expect(result.success).toBe(true)
      expect(mockFileInput.value).toBe('')
    })

    it('should handle rollback errors gracefully', async () => {
      const step: SkillStep = {
        id: 'step-5',
        index: 4,
        instruction: 'Type value',
        actionType: 'type',
        target: { selector: '#missing', text: 'value' },
        requiresConfirmation: false,
        status: 'pending',
      }

      const mockInput = {
        tagName: 'INPUT',
        value: 'old',
      }
      vi.mocked(mockWindow.document.querySelector).mockReturnValue(mockInput as any)

      const state = await manager.saveState(step)
      expect(state).toBeTruthy()

      // Element disappears before rollback
      vi.mocked(mockWindow.document.querySelector).mockReturnValue(null)

      const result = await manager.rollback(state!.id)

      expect(result.success).toBe(false)
      expect(result.error).toContain('not found')
    })
  })

  describe('State Management', () => {
    it('should maintain state stack', async () => {
      const steps: SkillStep[] = [
        {
          id: 'step-1',
          index: 0,
          instruction: 'Type value 1',
          actionType: 'type',
          target: { selector: '#input1', text: 'value1' },
          requiresConfirmation: false,
          status: 'pending',
        },
        {
          id: 'step-2',
          index: 1,
          instruction: 'Type value 2',
          actionType: 'type',
          target: { selector: '#input2', text: 'value2' },
          requiresConfirmation: false,
          status: 'pending',
        },
      ]

      const mockInput = {
        tagName: 'INPUT',
        value: 'old',
      }
      vi.mocked(mockWindow.document.querySelector).mockReturnValue(mockInput as any)

      await manager.saveState(steps[0])
      await manager.saveState(steps[1])

      const states = manager.getStates()
      expect(states).toHaveLength(2)
      expect(states[0].stepId).toBe('step-2') // Most recent first
      expect(states[1].stepId).toBe('step-1')
    })

    it('should limit state stack size', async () => {
      const smallManager = new RollbackManager(mockWindow, 3)

      const mockInput = {
        tagName: 'INPUT',
        value: 'old',
      }
      vi.mocked(mockWindow.document.querySelector).mockReturnValue(mockInput as any)

      // Add 5 states
      for (let i = 0; i < 5; i++) {
        await smallManager.saveState({
          id: `step-${i}`,
          index: i,
          instruction: `Type value ${i}`,
          actionType: 'type',
          target: { selector: `#input${i}`, text: `value${i}` },
          requiresConfirmation: false,
          status: 'pending',
        })
      }

      const states = smallManager.getStates()
      expect(states).toHaveLength(3) // Limited to 3
      expect(states[0].stepId).toBe('step-4') // Most recent
      expect(states[2].stepId).toBe('step-2') // Oldest kept
    })

    it('should retrieve state by ID', async () => {
      const step: SkillStep = {
        id: 'step-1',
        index: 0,
        instruction: 'Type value',
        actionType: 'type',
        target: { selector: '#input', text: 'value' },
        requiresConfirmation: false,
        status: 'pending',
      }

      const mockInput = {
        tagName: 'INPUT',
        value: 'old',
      }
      vi.mocked(mockWindow.document.querySelector).mockReturnValue(mockInput as any)

      const savedState = await manager.saveState(step)
      expect(savedState).toBeTruthy()

      const retrieved = manager.getState(savedState!.id)
      expect(retrieved).toEqual(savedState)
    })

    it('should retrieve state by step ID', async () => {
      const step: SkillStep = {
        id: 'step-1',
        index: 0,
        instruction: 'Type value',
        actionType: 'type',
        target: { selector: '#input', text: 'value' },
        requiresConfirmation: false,
        status: 'pending',
      }

      const mockInput = {
        tagName: 'INPUT',
        value: 'old',
      }
      vi.mocked(mockWindow.document.querySelector).mockReturnValue(mockInput as any)

      await manager.saveState(step)

      const retrieved = manager.getStateForStep('step-1')
      expect(retrieved).toBeTruthy()
      expect(retrieved?.stepId).toBe('step-1')
    })

    it('should check if step has saved state', async () => {
      const step: SkillStep = {
        id: 'step-1',
        index: 0,
        instruction: 'Type value',
        actionType: 'type',
        target: { selector: '#input', text: 'value' },
        requiresConfirmation: false,
        status: 'pending',
      }

      const mockInput = {
        tagName: 'INPUT',
        value: 'old',
      }
      vi.mocked(mockWindow.document.querySelector).mockReturnValue(mockInput as any)

      expect(manager.hasStateForStep('step-1')).toBe(false)

      await manager.saveState(step)

      expect(manager.hasStateForStep('step-1')).toBe(true)
    })

    it('should clear all states', async () => {
      const step: SkillStep = {
        id: 'step-1',
        index: 0,
        instruction: 'Type value',
        actionType: 'type',
        target: { selector: '#input', text: 'value' },
        requiresConfirmation: false,
        status: 'pending',
      }

      const mockInput = {
        tagName: 'INPUT',
        value: 'old',
      }
      vi.mocked(mockWindow.document.querySelector).mockReturnValue(mockInput as any)

      await manager.saveState(step)
      expect(manager.getStates()).toHaveLength(1)

      manager.clearStates()
      expect(manager.getStates()).toHaveLength(0)
    })
  })

  describe('Rollback Helpers', () => {
    it('should rollback last state', async () => {
      const steps: SkillStep[] = [
        {
          id: 'step-1',
          index: 0,
          instruction: 'Type value 1',
          actionType: 'type',
          target: { selector: '#input1', text: 'value1' },
          requiresConfirmation: false,
          status: 'pending',
        },
        {
          id: 'step-2',
          index: 1,
          instruction: 'Type value 2',
          actionType: 'type',
          target: { selector: '#input2', text: 'value2' },
          requiresConfirmation: false,
          status: 'pending',
        },
      ]

      const mockInput = {
        tagName: 'INPUT',
        value: 'old',
      }
      vi.mocked(mockWindow.document.querySelector).mockReturnValue(mockInput as any)

      await manager.saveState(steps[0])
      await manager.saveState(steps[1])

      const result = await manager.rollbackLast()

      expect(result.success).toBe(true)
      expect(result.state?.stepId).toBe('step-2')
      expect(manager.getStates()).toHaveLength(1)
    })

    it('should rollback to specific step', async () => {
      const steps: SkillStep[] = [
        {
          id: 'step-1',
          index: 0,
          instruction: 'Type value 1',
          actionType: 'type',
          target: { selector: '#input1', text: 'value1' },
          requiresConfirmation: false,
          status: 'pending',
        },
        {
          id: 'step-2',
          index: 1,
          instruction: 'Type value 2',
          actionType: 'type',
          target: { selector: '#input2', text: 'value2' },
          requiresConfirmation: false,
          status: 'pending',
        },
      ]

      const mockInput = {
        tagName: 'INPUT',
        value: 'old',
      }
      vi.mocked(mockWindow.document.querySelector).mockReturnValue(mockInput as any)

      await manager.saveState(steps[0])
      await manager.saveState(steps[1])

      const result = await manager.rollbackToStep('step-1')

      expect(result.success).toBe(true)
      expect(result.state?.stepId).toBe('step-1')
      expect(manager.getStates()).toHaveLength(0) // All states after step-1 removed
    })
  })

  describe('Summary and Statistics', () => {
    it('should provide summary', async () => {
      const steps: SkillStep[] = [
        {
          id: 'step-1',
          index: 0,
          instruction: 'Type value',
          actionType: 'type',
          target: { selector: '#input', text: 'value' },
          requiresConfirmation: false,
          status: 'pending',
        },
        {
          id: 'step-2',
          index: 1,
          instruction: 'Navigate away',
          actionType: 'navigate',
          target: { text: 'https://example.com/other' },
          requiresConfirmation: false,
          status: 'pending',
        },
      ]

      const mockInput = {
        tagName: 'INPUT',
        value: 'old',
      }
      vi.mocked(mockWindow.document.querySelector).mockReturnValue(mockInput as any)

      await manager.saveState(steps[0])
      await manager.saveState(steps[1])

      const summary = manager.getSummary()

      expect(summary.totalStates).toBe(2)
      expect(summary.reversibleStates).toBe(2)
      expect(summary.newestState?.stepId).toBe('step-2')
      expect(summary.oldestState?.stepId).toBe('step-1')
      expect(summary.statesByType).toHaveProperty('dom_change')
      expect(summary.statesByType).toHaveProperty('navigation')
    })
  })

  describe('Factory Function', () => {
    it('should create rollback manager with factory', () => {
      const manager = createRollbackManager(mockWindow, 10)

      expect(manager).toBeInstanceOf(RollbackManager)
    })
  })
})
