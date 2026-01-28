/**
 * Skill Executor - Execution Session Manager
 * 
 * Manages skill validation sessions, tracks execution progress,
 * captures screenshots, and logs execution timeline.
 * 
 * Requirements: FR-10.1, FR-10.9
 */

import type { SkillStep, ParsedSkill } from './skill-parser';
import { HybridExecutor, type HybridExecutionResult, type ExecutionMode } from './hybrid-executor';
import { categorizeError, type CategorizedError } from './error-handler';
import { RollbackManager, type SavedState, type RollbackResult } from './rollback-manager';
import { 
  generateSkillFix, 
  applySkillUpdate, 
  validateSkillUpdate,
  type SkillUpdateRequest,
  type SkillUpdateResult 
} from './skill-updater';
import type { Provider } from './providers/types';

/**
 * Screenshot captured during execution
 */
export interface ExecutionScreenshot {
  /** Unique screenshot identifier */
  id: string;
  
  /** Step ID this screenshot is associated with */
  stepId: string;
  
  /** When the screenshot was taken (before or after step execution) */
  timing: 'before' | 'after' | 'error';
  
  /** Screenshot data (base64 or file path) */
  data: string;
  
  /** Timestamp when captured */
  timestamp: number;
  
  /** Optional description */
  description?: string;
}

/**
 * Timeline entry for execution events
 */
export interface ExecutionTimelineEntry {
  /** Unique entry identifier */
  id: string;
  
  /** Entry type */
  type: 'step_start' | 'step_complete' | 'step_failed' | 'screenshot' | 'pause' | 'resume' | 'error';
  
  /** Timestamp of the event */
  timestamp: number;
  
  /** Associated step ID (if applicable) */
  stepId?: string;
  
  /** Event message */
  message: string;
  
  /** Additional data */
  data?: Record<string, any>;
  
  /** Categorized error information (if this is an error event) */
  categorizedError?: CategorizedError;
}

/**
 * Execution session state
 */
export type ExecutionSessionState = 
  | 'idle'           // Not started
  | 'running'        // Currently executing
  | 'paused'         // Paused (waiting for user input or confirmation)
  | 'completed'      // All steps completed successfully
  | 'failed'         // Execution failed
  | 'cancelled';     // User cancelled execution

/**
 * Execution session configuration
 */
export interface ExecutionSessionConfig {
  /** Execution mode (dom, image, or hybrid) */
  mode?: ExecutionMode;
  
  /** Whether to capture screenshots before/after each step */
  captureScreenshots?: boolean;
  
  /** Whether to pause on errors */
  pauseOnError?: boolean;
  
  /** Whether to pause at confirmation points */
  pauseOnConfirmation?: boolean;
  
  /** Timeout for each step in milliseconds */
  stepTimeout?: number;
  
  /** Whether to continue on step failure */
  continueOnFailure?: boolean;
  
  /** Maximum number of retry attempts per step */
  maxRetries?: number;
}

/**
 * Execution session statistics
 */
export interface ExecutionSessionStats {
  /** Total number of steps */
  totalSteps: number;
  
  /** Number of completed steps */
  completedSteps: number;
  
  /** Number of failed steps */
  failedSteps: number;
  
  /** Number of skipped steps */
  skippedSteps: number;
  
  /** Number of steps requiring human intervention */
  humanInterventionSteps: number;
  
  /** Total execution time in milliseconds */
  totalTime: number;
  
  /** Average time per step in milliseconds */
  averageStepTime: number;
  
  /** Success rate (0-1) */
  successRate: number;
}

/**
 * Execution session
 * 
 * Manages the execution of a skill, tracking progress, capturing state,
 * and providing control over the execution flow.
 */
export class ExecutionSession {
  /** Unique session identifier */
  readonly sessionId: string;
  
  /** Parsed skill being executed */
  readonly skill: ParsedSkill;
  
  /** Session configuration */
  readonly config: Required<ExecutionSessionConfig>;
  
  /** Current session state */
  private state: ExecutionSessionState = 'idle';
  
  /** Current step index being executed */
  private currentStepIndex: number = 0;
  
  /** Step that triggered a pause (for confirmation or error) */
  private pausedStep?: SkillStep;
  
  /** Skill steps (mutable copy for status updates) */
  private steps: SkillStep[];
  
  /** Hybrid executor instance */
  private executor: HybridExecutor;
  
  /** Rollback manager instance */
  private rollbackManager: RollbackManager;
  
  /** Captured screenshots */
  private screenshots: ExecutionScreenshot[] = [];
  
  /** Execution timeline */
  private timeline: ExecutionTimelineEntry[] = [];
  
  /** Session start time */
  private startTime?: number;
  
  /** Session end time */
  private endTime?: number;
  
  /** Step start times (for timing tracking) */
  private stepStartTimes: Map<string, number> = new Map();
  
  /** Retry counts per step */
  private retryCount: Map<string, number> = new Map();
  
  /** Event listeners */
  private listeners: Map<string, Set<Function>> = new Map();

  /**
   * Create a new execution session
   * 
   * @param skill - Parsed skill to execute
   * @param config - Session configuration
   */
  constructor(skill: ParsedSkill, config?: ExecutionSessionConfig) {
    this.sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.skill = skill;
    this.steps = [...skill.steps]; // Mutable copy
    
    // Default configuration
    this.config = {
      mode: config?.mode ?? 'hybrid',
      captureScreenshots: config?.captureScreenshots ?? true,
      pauseOnError: config?.pauseOnError ?? true,
      pauseOnConfirmation: config?.pauseOnConfirmation ?? true,
      stepTimeout: config?.stepTimeout ?? 30000,
      continueOnFailure: config?.continueOnFailure ?? false,
      maxRetries: config?.maxRetries ?? 2,
    };
    
    this.executor = new HybridExecutor();
    this.rollbackManager = new RollbackManager();
  }

  /**
   * Start the execution session
   * 
   * Begins executing steps from the beginning or from the current position.
   */
  async start(): Promise<void> {
    if (this.state === 'running') {
      throw new Error('Session is already running');
    }
    
    if (this.state === 'completed') {
      throw new Error('Session has already completed');
    }
    
    this.state = 'running';
    this.startTime = Date.now();
    
    this.addTimelineEntry({
      type: 'resume',
      message: 'Execution session started',
      data: {
        skillName: this.skill.name,
        totalSteps: this.steps.length,
        mode: this.config.mode,
      },
    });
    
    this.emit('start', { sessionId: this.sessionId });
    
    // Execute steps sequentially
    await this.executeSteps();
  }

  /**
   * Execute steps sequentially
   */
  private async executeSteps(): Promise<void> {
    while (this.currentStepIndex < this.steps.length && this.state === 'running') {
      const step = this.steps[this.currentStepIndex];
      
      // Check if step requires confirmation
      if (step.requiresConfirmation) {
        if (this.config.pauseOnConfirmation) {
          // For pure confirmation steps, mark as success immediately
          if (step.actionType === 'confirm') {
            this.updateStepStatus(step.id, 'success');
          }
          
          // Move to next step BEFORE pausing (so resume continues from next step)
          this.currentStepIndex++;
          
          await this.pauseForConfirmation(step);
          
          // Wait for resume - state will be 'paused' after pauseForConfirmation
          // State is checked via isPaused() method
          if (this.isPaused()) {
            return; // Exit loop, will resume when resume() is called
          }
          
          // If we get here, confirmation was approved and we resumed
          // Continue to next iteration (already moved to next step above)
          continue;
        } else {
          // Skip confirmation pause but still mark pure confirmation steps as success
          if (step.actionType === 'confirm') {
            this.updateStepStatus(step.id, 'success');
            this.currentStepIndex++;
            continue;
          }
        }
      }
      
      // Execute the step (only if not a pure confirmation step)
      if (step.actionType !== 'confirm') {
        await this.executeStep(step);
        
        // Check if we should continue
        if (step.status === 'failed' && !this.config.continueOnFailure) {
          if (this.config.pauseOnError) {
            await this.pauseForError(step);
            
            // Wait for resume or skip
            if (this.isPaused()) {
              return; // Exit loop
            }
          } else {
            this.state = 'failed';
            this.endTime = Date.now();
            this.emit('failed', { step, sessionId: this.sessionId });
            return;
          }
        }
      }
      
      // Move to next step
      this.currentStepIndex++;
    }
    
    // All steps completed
    if (this.state === 'running') {
      this.state = 'completed';
      this.endTime = Date.now();
      
      this.addTimelineEntry({
        type: 'step_complete',
        message: 'All steps completed',
      });
      
      this.emit('complete', { 
        sessionId: this.sessionId,
        stats: this.getStats(),
      });
    }
  }

  /**
   * Execute a single step
   */
  private async executeStep(step: SkillStep): Promise<void> {
    const stepStartTime = Date.now();
    this.stepStartTimes.set(step.id, stepStartTime);
    
    // Update step status
    this.updateStepStatus(step.id, 'running');
    
    this.addTimelineEntry({
      type: 'step_start',
      stepId: step.id,
      message: `Starting step ${step.index + 1}: ${step.instruction}`,
      data: {
        actionType: step.actionType,
        target: step.target,
      },
    });
    
    this.emit('stepStart', { step, sessionId: this.sessionId });
    
    // Capture before screenshot
    if (this.config.captureScreenshots) {
      await this.captureScreenshot(step.id, 'before');
    }
    
    // Save state before destructive actions (for rollback)
    let savedState: SavedState | null = null;
    try {
      savedState = await this.rollbackManager.saveState(step);
      if (savedState) {
        this.addTimelineEntry({
          type: 'screenshot', // Using screenshot type for state save events
          stepId: step.id,
          message: `State saved for rollback: ${savedState.description}`,
          data: { 
            stateId: savedState.id,
            isReversible: savedState.isReversible,
            actionType: savedState.actionType,
          },
        });
      }
    } catch (error) {
      console.warn('Failed to save state for rollback:', error);
    }
    
    try {
      // Execute with timeout
      const result = await this.executeWithTimeout(step, this.config.stepTimeout);
      
      // Capture after screenshot
      if (this.config.captureScreenshots) {
        await this.captureScreenshot(step.id, 'after');
      }
      
      // Update step based on result
      if (result.success) {
        this.updateStepStatus(step.id, 'success');
        
        this.addTimelineEntry({
          type: 'step_complete',
          stepId: step.id,
          message: `Step ${step.index + 1} completed successfully`,
          data: {
            executorUsed: result.executorUsed,
            duration: Date.now() - stepStartTime,
          },
        });
        
        this.emit('stepComplete', { step, result, sessionId: this.sessionId });
      } else {
        // Categorize the error for better handling
        const categorizedError = categorizeError(step, result);
        
        // Check if we should retry
        const retries = this.retryCount.get(step.id) || 0;
        
        if (retries < this.config.maxRetries && categorizedError.canRetry) {
          this.retryCount.set(step.id, retries + 1);
          
          this.addTimelineEntry({
            type: 'error',
            stepId: step.id,
            message: `Step ${step.index + 1} failed, retrying (attempt ${retries + 1}/${this.config.maxRetries})`,
            data: { 
              error: result.error,
              category: categorizedError.category,
              severity: categorizedError.severity,
            },
            categorizedError,
          });
          
          // Retry the step
          await this.executeStep(step);
          return;
        }
        
        // Max retries reached or cannot retry - offer rollback if state was saved
        this.updateStepStatus(step.id, 'failed', categorizedError.message);
        
        if (this.config.captureScreenshots) {
          await this.captureScreenshot(step.id, 'error');
        }
        
        this.addTimelineEntry({
          type: 'step_failed',
          stepId: step.id,
          message: categorizedError.message,
          data: {
            error: result.error,
            category: categorizedError.category,
            severity: categorizedError.severity,
            executionLog: result.executionLog,
            suggestions: categorizedError.suggestions,
            userMessage: categorizedError.userMessage,
            rollbackAvailable: savedState !== null && savedState.isReversible,
            savedStateId: savedState?.id,
          },
          categorizedError,
        });
        
        this.emit('stepFailed', { 
          step, 
          result, 
          categorizedError,
          rollbackAvailable: savedState !== null && savedState.isReversible,
          savedState,
          sessionId: this.sessionId 
        });
      }
    } catch (error) {
      // Unexpected error
      const categorizedError = categorizeError(step, undefined, error as Error);
      
      this.updateStepStatus(step.id, 'failed', categorizedError.message);
      
      if (this.config.captureScreenshots) {
        await this.captureScreenshot(step.id, 'error');
      }
      
      this.addTimelineEntry({
        type: 'error',
        stepId: step.id,
        message: categorizedError.message,
        data: { 
          error: categorizedError.originalError,
          category: categorizedError.category,
          severity: categorizedError.severity,
          userMessage: categorizedError.userMessage,
          suggestions: categorizedError.suggestions,
          rollbackAvailable: savedState !== null && savedState.isReversible,
          savedStateId: savedState?.id,
        },
        categorizedError,
      });
      
      this.emit('stepError', { 
        step, 
        error, 
        categorizedError,
        rollbackAvailable: savedState !== null && savedState.isReversible,
        savedState,
        sessionId: this.sessionId 
      });
    }
  }

  /**
   * Execute step with timeout
   */
  private async executeWithTimeout(
    step: SkillStep,
    timeout: number
  ): Promise<HybridExecutionResult> {
    return Promise.race([
      this.executor.executeStep(step, { mode: this.config.mode }),
      new Promise<HybridExecutionResult>((_, reject) =>
        setTimeout(() => reject(new Error(`Step execution timed out after ${timeout}ms`)), timeout)
      ),
    ]);
  }

  /**
   * Pause execution for confirmation
   */
  private async pauseForConfirmation(step: SkillStep): Promise<void> {
    this.state = 'paused';
    this.pausedStep = step; // Track which step we paused on
    
    // Get the pending action details
    const pendingAction = this.getPendingActionDetails(step);
    
    this.addTimelineEntry({
      type: 'pause',
      stepId: step.id,
      message: `Paused for confirmation before step ${step.index + 1}`,
      data: { 
        instruction: step.instruction,
        actionType: step.actionType,
        target: step.target,
        pendingAction,
      },
    });
    
    this.emit('pauseForConfirmation', { 
      step, 
      pendingAction,
      sessionId: this.sessionId 
    });
  }

  /**
   * Get details about the pending action for user review
   */
  private getPendingActionDetails(step: SkillStep): {
    description: string;
    actionType: string;
    target?: string;
    isDestructive: boolean;
    requiresInput: boolean;
  } {
    const isDestructive = ['delete', 'remove', 'clear'].some(
      keyword => step.instruction.toLowerCase().includes(keyword)
    );
    
    const requiresInput = step.actionType === 'type' && !!step.target?.text;
    
    let targetDescription = 'unknown target';
    if (step.target?.selector) {
      targetDescription = `element "${step.target.selector}"`;
    } else if (step.target?.coordinates) {
      targetDescription = `coordinates (${step.target.coordinates.x}, ${step.target.coordinates.y})`;
    } else if (step.target?.text) {
      targetDescription = `text "${step.target.text}"`;
    }
    
    return {
      description: step.instruction,
      actionType: step.actionType,
      target: targetDescription,
      isDestructive,
      requiresInput,
    };
  }

  /**
   * Approve the current confirmation point and continue execution
   */
  async approveConfirmation(): Promise<void> {
    if (this.state !== 'paused') {
      throw new Error('No confirmation pending - session is not paused');
    }
    
    if (!this.pausedStep || !this.pausedStep.requiresConfirmation) {
      throw new Error('Current step does not require confirmation');
    }
    
    const step = this.pausedStep;
    
    this.addTimelineEntry({
      type: 'resume',
      stepId: step.id,
      message: `Confirmation approved for step ${step.index + 1}`,
    });
    
    this.emit('confirmationApproved', { 
      step, 
      sessionId: this.sessionId 
    });
    
    // Clear paused step
    this.pausedStep = undefined;
    
    // Resume execution
    await this.resume();
  }

  /**
   * Reject the current confirmation point and abort execution
   */
  rejectConfirmation(reason?: string): void {
    if (this.state !== 'paused') {
      throw new Error('No confirmation pending - session is not paused');
    }
    
    if (!this.pausedStep || !this.pausedStep.requiresConfirmation) {
      throw new Error('Current step does not require confirmation');
    }
    
    const step = this.pausedStep;
    
    this.addTimelineEntry({
      type: 'error',
      stepId: step.id,
      message: `Confirmation rejected for step ${step.index + 1}`,
      data: { reason },
    });
    
    this.emit('confirmationRejected', { 
      step, 
      reason,
      sessionId: this.sessionId 
    });
    
    // Clear paused step
    this.pausedStep = undefined;
    
    // Cancel execution
    this.cancel();
  }

  /**
   * Pause execution for error handling
   */
  private async pauseForError(step: SkillStep): Promise<void> {
    this.state = 'paused';
    this.pausedStep = step; // Track which step we paused on
    
    this.addTimelineEntry({
      type: 'pause',
      stepId: step.id,
      message: `Paused due to error in step ${step.index + 1}`,
      data: { error: step.error },
    });
    
    this.emit('pauseForError', { step, sessionId: this.sessionId });
  }

  /**
   * Resume execution after pause
   */
  async resume(): Promise<void> {
    if (this.state !== 'paused') {
      throw new Error('Session is not paused');
    }
    
    this.state = 'running';
    
    this.addTimelineEntry({
      type: 'resume',
      message: 'Execution resumed',
    });
    
    this.emit('resume', { sessionId: this.sessionId });
    
    // Continue executing steps
    await this.executeSteps();
  }

  /**
   * Pause execution
   */
  pause(): void {
    if (this.state !== 'running') {
      throw new Error('Session is not running');
    }
    
    this.state = 'paused';
    
    this.addTimelineEntry({
      type: 'pause',
      message: 'Execution paused by user',
    });
    
    this.emit('pause', { sessionId: this.sessionId });
  }

  /**
   * Cancel execution
   */
  cancel(): void {
    if (this.state === 'completed' || this.state === 'cancelled') {
      return;
    }
    
    this.state = 'cancelled';
    this.endTime = Date.now();
    
    this.addTimelineEntry({
      type: 'error',
      message: 'Execution cancelled by user',
    });
    
    this.emit('cancel', { sessionId: this.sessionId });
  }

  /**
   * Skip the current step
   */
  skipCurrentStep(): void {
    if (this.state !== 'paused') {
      throw new Error('Can only skip steps when paused');
    }
    
    // Use the paused step, not current step index (which may have moved forward)
    const step = this.pausedStep || this.steps[this.currentStepIndex];
    
    if (step) {
      this.updateStepStatus(step.id, 'skipped');
      
      this.addTimelineEntry({
        type: 'step_complete',
        stepId: step.id,
        message: `Step ${step.index + 1} skipped by user`,
      });
      
      this.emit('stepSkipped', { step, sessionId: this.sessionId });
      
      // Clear paused step
      this.pausedStep = undefined;
      
      // Note: Don't increment currentStepIndex here - it's already been incremented
      // before pausing for confirmation points
    }
  }

  /**
   * Retry the current step
   */
  async retryCurrentStep(): Promise<void> {
    if (this.state !== 'paused') {
      throw new Error('Can only retry steps when paused');
    }
    
    const step = this.steps[this.currentStepIndex];
    
    if (step) {
      // Reset retry count for manual retry
      this.retryCount.delete(step.id);
      
      this.addTimelineEntry({
        type: 'resume',
        stepId: step.id,
        message: `Retrying step ${step.index + 1}`,
      });
      
      this.emit('stepRetry', { step, sessionId: this.sessionId });
      
      // Resume execution (will retry current step)
      await this.resume();
    }
  }

  /**
   * Update a step's instruction and retry
   */
  async updateStepAndRetry(stepId: string, newInstruction: string): Promise<void> {
    const step = this.steps.find(s => s.id === stepId);
    
    if (!step) {
      throw new Error(`Step ${stepId} not found`);
    }
    
    step.instruction = newInstruction;
    
    this.addTimelineEntry({
      type: 'resume',
      stepId: step.id,
      message: `Step ${step.index + 1} instruction updated`,
      data: { newInstruction },
    });
    
    this.emit('stepUpdated', { step, sessionId: this.sessionId });
    
    // Retry the step
    await this.retryCurrentStep();
  }

  /**
   * Generate a fix for a failed step using LLM
   * 
   * @param stepId - ID of the step to fix
   * @param feedback - User feedback describing what went wrong
   * @param provider - Optional provider instance (uses store config if not provided)
   * @returns Update result with new instruction
   */
  async generateStepFix(
    stepId: string,
    feedback: string,
    provider?: Provider
  ): Promise<SkillUpdateResult> {
    const step = this.steps.find(s => s.id === stepId);
    
    if (!step) {
      throw new Error(`Step ${stepId} not found`);
    }
    
    // Get categorized error from timeline if available
    const errorEntry = this.timeline
      .filter(e => e.stepId === stepId && e.categorizedError)
      .pop();
    
    // Build context from surrounding steps
    const stepIndex = this.steps.indexOf(step);
    const previousSteps = this.steps.slice(Math.max(0, stepIndex - 3), stepIndex);
    const nextSteps = this.steps.slice(stepIndex + 1, stepIndex + 3);
    
    const request: SkillUpdateRequest = {
      step,
      feedback,
      categorizedError: errorEntry?.categorizedError,
      skillContext: {
        skillName: this.skill.name,
        skillDescription: this.skill.description,
        previousSteps,
        nextSteps,
      },
    };
    
    this.addTimelineEntry({
      type: 'resume',
      stepId: step.id,
      message: `Generating fix for step ${step.index + 1} using LLM`,
      data: { feedback },
    });
    
    const result = await generateSkillFix(request, provider);
    
    if (result.success) {
      this.addTimelineEntry({
        type: 'step_complete',
        stepId: step.id,
        message: `Fix generated for step ${step.index + 1}`,
        data: {
          updatedInstruction: result.updatedInstruction,
          explanation: result.explanation,
          confidence: result.confidence,
        },
      });
    } else {
      this.addTimelineEntry({
        type: 'error',
        stepId: step.id,
        message: `Failed to generate fix for step ${step.index + 1}`,
        data: { error: result.error },
      });
    }
    
    this.emit('fixGenerated', { step, result, sessionId: this.sessionId });
    
    return result;
  }

  /**
   * Apply a generated fix to a step and retry
   * 
   * @param stepId - ID of the step to update
   * @param update - Update result from generateStepFix
   * @returns Whether the update was applied
   */
  async applyFixAndRetry(
    stepId: string,
    update: SkillUpdateResult
  ): Promise<boolean> {
    const step = this.steps.find(s => s.id === stepId);
    
    if (!step) {
      throw new Error(`Step ${stepId} not found`);
    }
    
    // Validate the update
    const validation = validateSkillUpdate(step, update);
    
    if (!validation.valid) {
      this.addTimelineEntry({
        type: 'error',
        stepId: step.id,
        message: `Cannot apply fix: ${validation.errors.join(', ')}`,
        data: { validation },
      });
      
      this.emit('fixRejected', { 
        step, 
        update, 
        validation, 
        sessionId: this.sessionId 
      });
      
      return false;
    }
    
    // Log warnings if any
    if (validation.warnings.length > 0) {
      this.addTimelineEntry({
        type: 'resume',
        stepId: step.id,
        message: `Applying fix with warnings: ${validation.warnings.join(', ')}`,
        data: { validation },
      });
    }
    
    // Apply the update
    const updatedStep = applySkillUpdate(step, update);
    
    // Update the step in the steps array
    const stepIndex = this.steps.indexOf(step);
    this.steps[stepIndex] = updatedStep;
    
    this.addTimelineEntry({
      type: 'resume',
      stepId: step.id,
      message: `Fix applied to step ${step.index + 1}`,
      data: {
        oldInstruction: step.instruction,
        newInstruction: updatedStep.instruction,
        explanation: update.explanation,
      },
    });
    
    this.emit('fixApplied', { 
      step: updatedStep, 
      update, 
      validation,
      sessionId: this.sessionId 
    });
    
    // Retry the step if session is paused (typical use case)
    // If not paused, just update the step and let normal execution continue
    if (this.state === 'paused') {
      await this.retryCurrentStep();
    }
    
    return true;
  }

  /**
   * Generate fix and apply it in one step (convenience method)
   * 
   * @param stepId - ID of the step to fix
   * @param feedback - User feedback
   * @param provider - Optional provider instance
   * @returns Whether the fix was successfully applied
   */
  async fixStepAndRetry(
    stepId: string,
    feedback: string,
    provider?: Provider
  ): Promise<boolean> {
    const fixResult = await this.generateStepFix(stepId, feedback, provider);
    
    if (!fixResult.success) {
      return false;
    }
    
    return await this.applyFixAndRetry(stepId, fixResult);
  }

  /**
   * Capture a screenshot
   */
  private async captureScreenshot(
    stepId: string,
    timing: ExecutionScreenshot['timing']
  ): Promise<void> {
    try {
      // TODO: Implement actual screenshot capture using Tauri commands
      // For now, create a placeholder
      const screenshot: ExecutionScreenshot = {
        id: `screenshot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        stepId,
        timing,
        data: '', // Would contain base64 or file path
        timestamp: Date.now(),
        description: `Screenshot ${timing} step execution`,
      };
      
      this.screenshots.push(screenshot);
      
      this.addTimelineEntry({
        type: 'screenshot',
        stepId,
        message: `Screenshot captured (${timing})`,
        data: { screenshotId: screenshot.id },
      });
    } catch (error) {
      console.error('Failed to capture screenshot:', error);
    }
  }

  /**
   * Update step status
   */
  private updateStepStatus(
    stepId: string,
    status: SkillStep['status'],
    error?: string
  ): void {
    const step = this.steps.find(s => s.id === stepId);
    
    if (step) {
      step.status = status;
      if (error) {
        step.error = error;
      }
    }
  }

  /**
   * Add timeline entry
   */
  private addTimelineEntry(
    entry: Omit<ExecutionTimelineEntry, 'id' | 'timestamp'>
  ): void {
    const timelineEntry: ExecutionTimelineEntry = {
      id: `timeline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      ...entry,
    };
    
    this.timeline.push(timelineEntry);
  }

  /**
   * Get current session state
   */
  getState(): ExecutionSessionState {
    return this.state;
  }

  /**
   * Check if session is paused
   */
  isPaused(): boolean {
    return this.state === 'paused';
  }

  /**
   * Get current step
   */
  getCurrentStep(): SkillStep | undefined {
    return this.steps[this.currentStepIndex];
  }

  /**
   * Get the step that triggered the current pause (if any)
   */
  getPausedStep(): SkillStep | undefined {
    return this.pausedStep;
  }

  /**
   * Get current step index
   */
  getCurrentStepIndex(): number {
    return this.currentStepIndex;
  }

  /**
   * Get all steps
   */
  getSteps(): SkillStep[] {
    return [...this.steps];
  }

  /**
   * Get step by ID
   */
  getStep(stepId: string): SkillStep | undefined {
    return this.steps.find(s => s.id === stepId);
  }

  /**
   * Get all screenshots
   */
  getScreenshots(): ExecutionScreenshot[] {
    return [...this.screenshots];
  }

  /**
   * Get screenshots for a specific step
   */
  getStepScreenshots(stepId: string): ExecutionScreenshot[] {
    return this.screenshots.filter(s => s.stepId === stepId);
  }

  /**
   * Get execution timeline
   */
  getTimeline(): ExecutionTimelineEntry[] {
    return [...this.timeline];
  }

  /**
   * Get execution statistics
   */
  getStats(): ExecutionSessionStats {
    const completedSteps = this.steps.filter(s => s.status === 'success').length;
    const failedSteps = this.steps.filter(s => s.status === 'failed').length;
    const skippedSteps = this.steps.filter(s => s.status === 'skipped').length;
    
    // Count steps that needed human intervention (paused for error or confirmation)
    const humanInterventionSteps = this.timeline.filter(
      e => e.type === 'pause' && (e.message.includes('error') || e.message.includes('confirmation'))
    ).length;
    
    const totalTime = this.endTime 
      ? this.endTime - (this.startTime || 0)
      : Date.now() - (this.startTime || 0);
    
    const averageStepTime = completedSteps > 0 ? totalTime / completedSteps : 0;
    
    const successRate = this.steps.length > 0 ? completedSteps / this.steps.length : 0;
    
    return {
      totalSteps: this.steps.length,
      completedSteps,
      failedSteps,
      skippedSteps,
      humanInterventionSteps,
      totalTime,
      averageStepTime,
      successRate,
    };
  }

  /**
   * Get session summary
   */
  getSummary() {
    return {
      sessionId: this.sessionId,
      skillName: this.skill.name,
      state: this.state,
      currentStepIndex: this.currentStepIndex,
      config: this.config,
      stats: this.getStats(),
      startTime: this.startTime,
      endTime: this.endTime,
    };
  }

  /**
   * Register event listener
   */
  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  /**
   * Unregister event listener
   */
  off(event: string, callback: Function): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  /**
   * Emit event to listeners
   */
  private emit(event: string, data: any): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Set target window for DOM automation
   */
  setTargetWindow(targetWindow: Window): void {
    this.executor.setTargetWindow(targetWindow);
    this.rollbackManager.setTargetWindow(targetWindow);
  }

  /**
   * Clear executor cache
   */
  clearCache(): void {
    this.executor.clearCache();
  }

  /**
   * Rollback to a previous state
   * 
   * @param stateId - ID of the state to rollback to
   * @returns Rollback result
   */
  async rollback(stateId: string): Promise<RollbackResult> {
    const result = await this.rollbackManager.rollback(stateId);
    
    if (result.success) {
      this.addTimelineEntry({
        type: 'resume',
        message: `Rolled back: ${result.details}`,
        data: {
          stateId,
          state: result.state,
        },
      });
      
      this.emit('rollback', {
        stateId,
        state: result.state,
        sessionId: this.sessionId,
      });
    } else {
      this.addTimelineEntry({
        type: 'error',
        message: `Rollback failed: ${result.error}`,
        data: {
          stateId,
          error: result.error,
        },
      });
    }
    
    return result;
  }

  /**
   * Rollback the most recent state
   * 
   * @returns Rollback result
   */
  async rollbackLast(): Promise<RollbackResult> {
    return this.rollbackManager.rollbackLast();
  }

  /**
   * Rollback to a specific step
   * 
   * @param stepId - Step ID to rollback to
   * @returns Rollback result
   */
  async rollbackToStep(stepId: string): Promise<RollbackResult> {
    return this.rollbackManager.rollbackToStep(stepId);
  }

  /**
   * Get all saved states for rollback
   * 
   * @returns Array of saved states
   */
  getRollbackStates(): SavedState[] {
    return this.rollbackManager.getStates();
  }

  /**
   * Get saved state for a specific step
   * 
   * @param stepId - Step ID
   * @returns Saved state or undefined
   */
  getRollbackStateForStep(stepId: string): SavedState | undefined {
    return this.rollbackManager.getStateForStep(stepId);
  }

  /**
   * Check if a step has a saved state for rollback
   * 
   * @param stepId - Step ID
   * @returns True if state exists
   */
  hasRollbackStateForStep(stepId: string): boolean {
    return this.rollbackManager.hasStateForStep(stepId);
  }

  /**
   * Clear all rollback states
   */
  clearRollbackStates(): void {
    this.rollbackManager.clearStates();
  }
}

/**
 * Create a new execution session
 * 
 * @param skill - Parsed skill to execute
 * @param config - Session configuration
 * @returns Execution session instance
 */
export function createExecutionSession(
  skill: ParsedSkill,
  config?: ExecutionSessionConfig
): ExecutionSession {
  return new ExecutionSession(skill, config);
}
