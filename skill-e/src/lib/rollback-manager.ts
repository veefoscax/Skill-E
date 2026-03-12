/**
 * Rollback Manager - State Management and Rollback Support
 *
 * Provides rollback capability for destructive actions by saving state
 * before execution and offering rollback options on failure.
 *
 * Requirements: FR-10.10
 */

import type { SkillStep } from './skill-parser'

/**
 * Rollback action types
 */
export type RollbackActionType =
  | 'dom_change' // DOM modification (text change, attribute change)
  | 'navigation' // Page navigation
  | 'form_submit' // Form submission
  | 'delete' // Delete action
  | 'file_upload' // File upload
  | 'storage_change' // LocalStorage/SessionStorage change
  | 'unknown' // Unknown or unsupported action

/**
 * Saved state for rollback
 */
export interface SavedState {
  /** Unique state identifier */
  id: string

  /** Step ID this state is associated with */
  stepId: string

  /** Action type */
  actionType: RollbackActionType

  /** Timestamp when state was saved */
  timestamp: number

  /** Whether this action is reversible */
  isReversible: boolean

  /** State data (varies by action type) */
  data: StateData

  /** Human-readable description */
  description: string
}

/**
 * State data union type
 */
export type StateData =
  | DOMChangeState
  | NavigationState
  | FormSubmitState
  | DeleteState
  | FileUploadState
  | StorageChangeState
  | UnknownState

/**
 * DOM change state (text, attributes, etc.)
 */
export interface DOMChangeState {
  type: 'dom_change'

  /** Element selector */
  selector: string

  /** Previous value (text content, attribute value, etc.) */
  previousValue: string

  /** Property that was changed (textContent, value, attribute name) */
  property: string

  /** Element snapshot (for verification) */
  elementSnapshot?: {
    tagName: string
    id?: string
    className?: string
  }
}

/**
 * Navigation state (URL change)
 */
export interface NavigationState {
  type: 'navigation'

  /** Previous URL */
  previousUrl: string

  /** Previous page title */
  previousTitle?: string

  /** Scroll position */
  scrollPosition?: { x: number; y: number }

  /** History state */
  historyState?: any
}

/**
 * Form submit state
 */
export interface FormSubmitState {
  type: 'form_submit'

  /** Form selector */
  formSelector: string

  /** Form data before submission */
  formData: Record<string, string>

  /** Current URL (before submission) */
  currentUrl: string
}

/**
 * Delete action state
 */
export interface DeleteState {
  type: 'delete'

  /** Element selector */
  selector: string

  /** Deleted element HTML */
  deletedHTML: string

  /** Parent selector (for restoration) */
  parentSelector: string

  /** Position in parent (for restoration) */
  positionInParent: number
}

/**
 * File upload state
 */
export interface FileUploadState {
  type: 'file_upload'

  /** Input selector */
  inputSelector: string

  /** Previous file name (if any) */
  previousFileName?: string

  /** Note: Cannot restore actual file, only clear the input */
  canOnlyClear: true
}

/**
 * Storage change state (localStorage, sessionStorage)
 */
export interface StorageChangeState {
  type: 'storage_change'

  /** Storage type */
  storageType: 'localStorage' | 'sessionStorage'

  /** Key that was changed */
  key: string

  /** Previous value */
  previousValue: string | null

  /** Operation type */
  operation: 'set' | 'remove'
}

/**
 * Unknown state (cannot rollback)
 */
export interface UnknownState {
  type: 'unknown'

  /** Reason why state cannot be saved */
  reason: string
}

/**
 * Rollback result
 */
export interface RollbackResult {
  /** Whether rollback was successful */
  success: boolean

  /** Error message (if failed) */
  error?: string

  /** State that was rolled back */
  state?: SavedState

  /** Verification result */
  verified?: boolean

  /** Additional details */
  details?: string
}

/**
 * Rollback Manager
 *
 * Manages state snapshots and rollback operations for skill execution.
 */
export class RollbackManager {
  /** Saved states stack (most recent first) */
  private stateStack: SavedState[] = []

  /** Maximum number of states to keep */
  private maxStates: number = 50

  /** Target window for DOM operations */
  private targetWindow?: Window

  /**
   * Create a new rollback manager
   *
   * @param targetWindow - Target window for DOM operations (optional)
   * @param maxStates - Maximum number of states to keep (default: 50)
   */
  constructor(targetWindow?: Window, maxStates: number = 50) {
    this.targetWindow = targetWindow
    this.maxStates = maxStates
  }

  /**
   * Save state before executing a step
   *
   * @param step - Skill step about to be executed
   * @returns Saved state (or null if not reversible)
   */
  async saveState(step: SkillStep): Promise<SavedState | null> {
    // Determine if this action is destructive/reversible
    const actionType = this.classifyAction(step)
    const isReversible = this.isActionReversible(actionType, step)

    // If not reversible, don't save state
    if (!isReversible) {
      return null
    }

    try {
      // Capture state based on action type
      const data = await this.captureState(step, actionType)

      const savedState: SavedState = {
        id: `state-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        stepId: step.id,
        actionType,
        timestamp: Date.now(),
        isReversible,
        data,
        description: this.generateStateDescription(step, actionType),
      }

      // Add to stack
      this.stateStack.unshift(savedState)

      // Trim stack if too large
      if (this.stateStack.length > this.maxStates) {
        this.stateStack = this.stateStack.slice(0, this.maxStates)
      }

      return savedState
    } catch (error) {
      console.error('Failed to save state:', error)
      return null
    }
  }

  /**
   * Classify action type for rollback purposes
   */
  private classifyAction(step: SkillStep): RollbackActionType {
    const instruction = step.instruction.toLowerCase()

    // Check for delete/remove actions
    if (
      instruction.includes('delete') ||
      instruction.includes('remove') ||
      instruction.includes('clear')
    ) {
      return 'delete'
    }

    // Check for navigation
    if (
      step.actionType === 'navigate' ||
      instruction.includes('navigate') ||
      instruction.includes('go to')
    ) {
      return 'navigation'
    }

    // Check for form submission
    if (instruction.includes('submit') || instruction.includes('send form')) {
      return 'form_submit'
    }

    // Check for file upload
    if (instruction.includes('upload') || instruction.includes('attach file')) {
      return 'file_upload'
    }

    // Check for typing (DOM change)
    if (step.actionType === 'type') {
      return 'dom_change'
    }

    // Check for storage operations
    if (instruction.includes('localstorage') || instruction.includes('sessionstorage')) {
      return 'storage_change'
    }

    // Default to unknown
    return 'unknown'
  }

  /**
   * Check if an action is reversible
   */
  private isActionReversible(actionType: RollbackActionType, step: SkillStep): boolean {
    switch (actionType) {
      case 'dom_change':
        // Reversible if we have a selector
        return !!step.target?.selector

      case 'navigation':
        // Reversible (can navigate back)
        return true

      case 'form_submit':
        // Partially reversible (can navigate back, but submission happened)
        return true

      case 'delete':
        // Reversible if we can capture the element
        return !!step.target?.selector

      case 'file_upload':
        // Partially reversible (can clear input, but cannot restore file)
        return true

      case 'storage_change':
        // Reversible
        return true

      case 'unknown':
      default:
        // Not reversible
        return false
    }
  }

  /**
   * Capture state based on action type
   */
  private async captureState(step: SkillStep, actionType: RollbackActionType): Promise<StateData> {
    const win = this.targetWindow || window

    switch (actionType) {
      case 'dom_change':
        return await this.captureDOMChangeState(step, win)

      case 'navigation':
        return this.captureNavigationState(win)

      case 'form_submit':
        return await this.captureFormSubmitState(step, win)

      case 'delete':
        return await this.captureDeleteState(step, win)

      case 'file_upload':
        return this.captureFileUploadState(step)

      case 'storage_change':
        return this.captureStorageChangeState(step, win)

      case 'unknown':
      default:
        return {
          type: 'unknown',
          reason: 'Action type not supported for rollback',
        }
    }
  }

  /**
   * Capture DOM change state
   */
  private async captureDOMChangeState(step: SkillStep, win: Window): Promise<DOMChangeState> {
    const selector = step.target?.selector || ''
    const element = win.document.querySelector(selector)

    if (!element) {
      throw new Error(`Element not found: ${selector}`)
    }

    // Determine what property will be changed
    let property = 'value'
    let previousValue = ''

    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
      property = 'value'
      previousValue = element.value
    } else if (element instanceof HTMLSelectElement) {
      property = 'value'
      previousValue = element.value
    } else {
      property = 'textContent'
      previousValue = element.textContent || ''
    }

    // Safely get element properties for snapshot
    let elementId: string | undefined
    let elementClassName: string | undefined

    try {
      elementId = element.id || undefined
    } catch (e) {
      // Ignore errors accessing id
    }

    try {
      elementClassName = element.className || undefined
    } catch (e) {
      // Ignore errors accessing className
    }

    return {
      type: 'dom_change',
      selector,
      previousValue,
      property,
      elementSnapshot: {
        tagName: element.tagName,
        id: elementId,
        className: elementClassName,
      },
    }
  }

  /**
   * Capture navigation state
   */
  private captureNavigationState(win: Window): NavigationState {
    return {
      type: 'navigation',
      previousUrl: win.location.href,
      previousTitle: win.document.title,
      scrollPosition: {
        x: win.scrollX,
        y: win.scrollY,
      },
      historyState: win.history.state,
    }
  }

  /**
   * Capture form submit state
   */
  private async captureFormSubmitState(step: SkillStep, win: Window): Promise<FormSubmitState> {
    const formSelector = step.target?.selector || 'form'
    const form = win.document.querySelector(formSelector)

    if (!form || !(form instanceof HTMLFormElement)) {
      throw new Error(`Form not found: ${formSelector}`)
    }

    // Capture form data
    const formData: Record<string, string> = {}

    try {
      const formDataObj = new FormData(form)

      formDataObj.forEach((value, key) => {
        formData[key] = value.toString()
      })
    } catch (e) {
      // If FormData fails, try to manually extract form fields
      const inputs = form.querySelectorAll('input, textarea, select')
      inputs.forEach((input: any) => {
        if (input.name) {
          formData[input.name] = input.value || ''
        }
      })
    }

    return {
      type: 'form_submit',
      formSelector,
      formData,
      currentUrl: win.location.href,
    }
  }

  /**
   * Capture delete state
   */
  private async captureDeleteState(step: SkillStep, win: Window): Promise<DeleteState> {
    const selector = step.target?.selector || ''
    const element = win.document.querySelector(selector)

    if (!element) {
      throw new Error(`Element not found: ${selector}`)
    }

    const parent = element.parentElement
    if (!parent) {
      throw new Error('Element has no parent')
    }

    // Find position in parent
    const siblings = Array.from(parent.children)
    const positionInParent = siblings.indexOf(element)

    // Generate parent selector (simple approach)
    let parentSelector = parent.tagName.toLowerCase()
    if (parent.id) {
      parentSelector += `#${parent.id}`
    } else if (parent.className) {
      parentSelector += `.${parent.className.split(' ')[0]}`
    }

    return {
      type: 'delete',
      selector,
      deletedHTML: element.outerHTML,
      parentSelector,
      positionInParent,
    }
  }

  /**
   * Capture file upload state
   */
  private captureFileUploadState(step: SkillStep): FileUploadState {
    return {
      type: 'file_upload',
      inputSelector: step.target?.selector || 'input[type="file"]',
      previousFileName: undefined, // Cannot access file name for security reasons
      canOnlyClear: true,
    }
  }

  /**
   * Capture storage change state
   */
  private captureStorageChangeState(step: SkillStep, win: Window): StorageChangeState {
    // Parse instruction to determine storage type and key
    const instruction = step.instruction.toLowerCase()
    const storageType: 'localStorage' | 'sessionStorage' = instruction.includes('sessionstorage')
      ? 'sessionStorage'
      : 'localStorage'

    // Extract key from target or instruction
    const key = step.target?.text || ''

    const storage = storageType === 'localStorage' ? win.localStorage : win.sessionStorage
    const previousValue = storage.getItem(key)

    return {
      type: 'storage_change',
      storageType,
      key,
      previousValue,
      operation: 'set',
    }
  }

  /**
   * Generate human-readable state description
   */
  private generateStateDescription(step: SkillStep, actionType: RollbackActionType): string {
    switch (actionType) {
      case 'dom_change':
        return `Text change in ${step.target?.selector || 'element'}`

      case 'navigation':
        return `Navigation to ${step.target?.text || 'new page'}`

      case 'form_submit':
        return `Form submission: ${step.instruction}`

      case 'delete':
        return `Delete ${step.target?.selector || 'element'}`

      case 'file_upload':
        return `File upload: ${step.instruction}`

      case 'storage_change':
        return `Storage change: ${step.instruction}`

      default:
        return step.instruction
    }
  }

  /**
   * Rollback to a previous state
   *
   * @param stateId - ID of the state to rollback to
   * @returns Rollback result
   */
  async rollback(stateId: string): Promise<RollbackResult> {
    const state = this.stateStack.find(s => s.id === stateId)

    if (!state) {
      return {
        success: false,
        error: `State not found: ${stateId}`,
      }
    }

    if (!state.isReversible) {
      return {
        success: false,
        error: 'This action is not reversible',
        state,
      }
    }

    try {
      const win = this.targetWindow || window

      switch (state.data.type) {
        case 'dom_change':
          await this.rollbackDOMChange(state.data, win)
          break

        case 'navigation':
          await this.rollbackNavigation(state.data, win)
          break

        case 'form_submit':
          await this.rollbackFormSubmit(state.data, win)
          break

        case 'delete':
          await this.rollbackDelete(state.data, win)
          break

        case 'file_upload':
          await this.rollbackFileUpload(state.data, win)
          break

        case 'storage_change':
          await this.rollbackStorageChange(state.data, win)
          break

        default:
          throw new Error('Unsupported state type for rollback')
      }

      // Remove this state and all states after it from the stack
      const stateIndex = this.stateStack.findIndex(s => s.id === stateId)
      if (stateIndex >= 0) {
        this.stateStack = this.stateStack.slice(stateIndex + 1)
      }

      return {
        success: true,
        state,
        verified: true,
        details: `Successfully rolled back: ${state.description}`,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        state,
      }
    }
  }

  /**
   * Rollback DOM change
   */
  private async rollbackDOMChange(state: DOMChangeState, win: Window): Promise<void> {
    const element = win.document.querySelector(state.selector)

    if (!element) {
      throw new Error(`Element not found: ${state.selector}`)
    }

    // Restore previous value
    if (state.property === 'value') {
      if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
        element.value = state.previousValue
      } else if (element instanceof HTMLSelectElement) {
        element.value = state.previousValue
      }
    } else if (state.property === 'textContent') {
      element.textContent = state.previousValue
    } else {
      // Generic attribute
      element.setAttribute(state.property, state.previousValue)
    }
  }

  /**
   * Rollback navigation
   */
  private async rollbackNavigation(state: NavigationState, win: Window): Promise<void> {
    // Navigate back to previous URL
    win.history.back()

    // Wait for navigation to complete
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Restore scroll position
    if (state.scrollPosition) {
      win.scrollTo(state.scrollPosition.x, state.scrollPosition.y)
    }
  }

  /**
   * Rollback form submit
   */
  private async rollbackFormSubmit(state: FormSubmitState, win: Window): Promise<void> {
    // Navigate back to the form page
    win.history.back()

    // Wait for navigation
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Restore form data
    const form = win.document.querySelector(state.formSelector)
    if (form && form instanceof HTMLFormElement) {
      Object.entries(state.formData).forEach(([key, value]) => {
        const input = form.elements.namedItem(key)
        if (input && (input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement)) {
          input.value = value
        }
      })
    }
  }

  /**
   * Rollback delete
   */
  private async rollbackDelete(state: DeleteState, win: Window): Promise<void> {
    const parent = win.document.querySelector(state.parentSelector)

    if (!parent) {
      throw new Error(`Parent element not found: ${state.parentSelector}`)
    }

    // Create element from HTML
    const temp = win.document.createElement('div')
    temp.innerHTML = state.deletedHTML
    const restoredElement = temp.firstElementChild

    if (!restoredElement) {
      throw new Error('Failed to restore element from HTML')
    }

    // Insert at original position
    if (state.positionInParent >= parent.children.length) {
      parent.appendChild(restoredElement)
    } else {
      parent.insertBefore(restoredElement, parent.children[state.positionInParent])
    }
  }

  /**
   * Rollback file upload
   */
  private async rollbackFileUpload(state: FileUploadState, win: Window): Promise<void> {
    const input = win.document.querySelector(state.inputSelector)

    if (!input || !(input instanceof HTMLInputElement)) {
      throw new Error(`File input not found: ${state.inputSelector}`)
    }

    // Clear the file input (cannot restore original file for security reasons)
    input.value = ''
  }

  /**
   * Rollback storage change
   */
  private async rollbackStorageChange(state: StorageChangeState, win: Window): Promise<void> {
    const storage = state.storageType === 'localStorage' ? win.localStorage : win.sessionStorage

    if (state.previousValue === null) {
      // Key didn't exist before, remove it
      storage.removeItem(state.key)
    } else {
      // Restore previous value
      storage.setItem(state.key, state.previousValue)
    }
  }

  /**
   * Rollback the most recent state
   *
   * @returns Rollback result
   */
  async rollbackLast(): Promise<RollbackResult> {
    if (this.stateStack.length === 0) {
      return {
        success: false,
        error: 'No states to rollback',
      }
    }

    const lastState = this.stateStack[0]
    return this.rollback(lastState.id)
  }

  /**
   * Rollback to a specific step
   *
   * @param stepId - Step ID to rollback to
   * @returns Rollback result
   */
  async rollbackToStep(stepId: string): Promise<RollbackResult> {
    const state = this.stateStack.find(s => s.stepId === stepId)

    if (!state) {
      return {
        success: false,
        error: `No state found for step: ${stepId}`,
      }
    }

    return this.rollback(state.id)
  }

  /**
   * Get all saved states
   *
   * @returns Array of saved states
   */
  getStates(): SavedState[] {
    return [...this.stateStack]
  }

  /**
   * Get state by ID
   *
   * @param stateId - State ID
   * @returns Saved state or undefined
   */
  getState(stateId: string): SavedState | undefined {
    return this.stateStack.find(s => s.id === stateId)
  }

  /**
   * Get state for a specific step
   *
   * @param stepId - Step ID
   * @returns Saved state or undefined
   */
  getStateForStep(stepId: string): SavedState | undefined {
    return this.stateStack.find(s => s.stepId === stepId)
  }

  /**
   * Check if a step has a saved state
   *
   * @param stepId - Step ID
   * @returns True if state exists
   */
  hasStateForStep(stepId: string): boolean {
    return this.stateStack.some(s => s.stepId === stepId)
  }

  /**
   * Clear all saved states
   */
  clearStates(): void {
    this.stateStack = []
  }

  /**
   * Set target window for DOM operations
   *
   * @param targetWindow - Target window
   */
  setTargetWindow(targetWindow: Window): void {
    this.targetWindow = targetWindow
  }

  /**
   * Get rollback summary
   */
  getSummary() {
    return {
      totalStates: this.stateStack.length,
      reversibleStates: this.stateStack.filter(s => s.isReversible).length,
      oldestState: this.stateStack[this.stateStack.length - 1],
      newestState: this.stateStack[0],
      statesByType: this.getStatesByType(),
    }
  }

  /**
   * Get states grouped by type
   */
  private getStatesByType(): Record<RollbackActionType, number> {
    const counts: Record<string, number> = {}

    this.stateStack.forEach(state => {
      counts[state.actionType] = (counts[state.actionType] || 0) + 1
    })

    return counts as Record<RollbackActionType, number>
  }
}

/**
 * Create a new rollback manager
 *
 * @param targetWindow - Target window for DOM operations (optional)
 * @param maxStates - Maximum number of states to keep (default: 50)
 * @returns Rollback manager instance
 */
export function createRollbackManager(targetWindow?: Window, maxStates?: number): RollbackManager {
  return new RollbackManager(targetWindow, maxStates)
}
