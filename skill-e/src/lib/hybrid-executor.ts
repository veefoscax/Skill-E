/**
 * Hybrid Executor - Combined DOM and Image-based Automation
 * 
 * Provides intelligent automation that tries DOM first, falls back to image-based,
 * and pauses for human intervention if both fail.
 * 
 * Requirements: FR-10.4, FR-10.5
 */

import type { SkillStep } from './skill-parser';
import { DOMExecutor, type AutomationResult, type AutomationOptions } from './browser-automation';
import { ImageExecutor } from './image-executor';

/**
 * Execution mode for hybrid executor
 */
export type ExecutionMode = 'dom' | 'image' | 'hybrid';

/**
 * Enhanced automation result with execution details
 */
export interface HybridExecutionResult extends AutomationResult {
  /** Which executor was used successfully */
  executorUsed?: 'dom' | 'image' | 'none';
  
  /** Whether human intervention is needed */
  needsHuman?: boolean;
  
  /** Detailed execution log */
  executionLog?: string[];
  
  /** Suggestions for manual intervention */
  suggestions?: string[];
}

/**
 * Hybrid executor options
 */
export interface HybridExecutorOptions extends AutomationOptions {
  /** Execution mode (default: 'hybrid') */
  mode?: ExecutionMode;
  
  /** Whether to try image executor if DOM fails (default: true) */
  fallbackToImage?: boolean;
  
  /** Minimum confidence for image matching (default: 0.7) */
  imageConfidence?: number;
  
  /** Whether to pause for human if both fail (default: true) */
  pauseOnFailure?: boolean;
}

/**
 * Hybrid Executor
 * 
 * Intelligently combines DOM and image-based automation:
 * 1. Try DOM first (faster, more reliable)
 * 2. Fall back to image if DOM fails
 * 3. Pause for human intervention if both fail
 */
export class HybridExecutor {
  private domExecutor: DOMExecutor;
  private imageExecutor: ImageExecutor;
  private defaultOptions: HybridExecutorOptions = {
    mode: 'hybrid',
    fallbackToImage: true,
    imageConfidence: 0.7,
    pauseOnFailure: true,
    timeout: 5000,
    waitForVisible: true,
    scrollIntoView: true,
    captureOnError: true,
  };

  /**
   * Create a new hybrid executor
   * 
   * @param targetWindow - Target window for DOM automation (optional)
   */
  constructor(targetWindow?: Window) {
    this.domExecutor = new DOMExecutor(targetWindow);
    this.imageExecutor = new ImageExecutor();
  }

  /**
   * Execute a skill step using hybrid automation
   * 
   * @param step - Skill step to execute
   * @param options - Hybrid executor options
   * @returns Hybrid execution result
   */
  async executeStep(
    step: SkillStep,
    options?: HybridExecutorOptions
  ): Promise<HybridExecutionResult> {
    const opts = { ...this.defaultOptions, ...options };
    const executionLog: string[] = [];
    const startTime = Date.now();

    executionLog.push(`Starting execution of step: ${step.instruction}`);
    executionLog.push(`Action type: ${step.actionType}`);
    executionLog.push(`Execution mode: ${opts.mode}`);

    // Determine execution strategy based on mode
    switch (opts.mode) {
      case 'dom':
        return await this.executeDOMOnly(step, opts, executionLog);
      
      case 'image':
        return await this.executeImageOnly(step, opts, executionLog);
      
      case 'hybrid':
      default:
        return await this.executeHybrid(step, opts, executionLog);
    }
  }

  /**
   * Execute using DOM only
   */
  private async executeDOMOnly(
    step: SkillStep,
    options: HybridExecutorOptions,
    executionLog: string[]
  ): Promise<HybridExecutionResult> {
    executionLog.push('Attempting DOM execution...');

    const result = await this.domExecutor.executeStep(step, options);

    if (result.success) {
      executionLog.push('✓ DOM execution succeeded');
      return {
        ...result,
        executorUsed: 'dom',
        executionLog,
      };
    }

    executionLog.push(`✗ DOM execution failed: ${result.error}`);

    if (options.pauseOnFailure) {
      return {
        ...result,
        executorUsed: 'none',
        needsHuman: true,
        executionLog,
        suggestions: this.generateSuggestions(step, 'dom'),
      };
    }

    return {
      ...result,
      executorUsed: 'none',
      executionLog,
    };
  }

  /**
   * Execute using image only
   */
  private async executeImageOnly(
    step: SkillStep,
    options: HybridExecutorOptions,
    executionLog: string[]
  ): Promise<HybridExecutionResult> {
    executionLog.push('Attempting image-based execution...');

    const result = await this.imageExecutor.executeStep(step, options);

    if (result.success) {
      executionLog.push('✓ Image execution succeeded');
      return {
        ...result,
        executorUsed: 'image',
        executionLog,
      };
    }

    executionLog.push(`✗ Image execution failed: ${result.error}`);

    if (options.pauseOnFailure) {
      return {
        ...result,
        executorUsed: 'none',
        needsHuman: true,
        executionLog,
        suggestions: this.generateSuggestions(step, 'image'),
      };
    }

    return {
      ...result,
      executorUsed: 'none',
      executionLog,
    };
  }

  /**
   * Execute using hybrid approach (DOM first, then image)
   */
  private async executeHybrid(
    step: SkillStep,
    options: HybridExecutorOptions,
    executionLog: string[]
  ): Promise<HybridExecutionResult> {
    // Phase 1: Try DOM first (if selector is available)
    if (this.canUseDOMExecutor(step)) {
      executionLog.push('Phase 1: Attempting DOM execution...');

      const domResult = await this.domExecutor.executeStep(step, options);

      if (domResult.success) {
        executionLog.push('✓ DOM execution succeeded');
        return {
          ...domResult,
          executorUsed: 'dom',
          executionLog,
        };
      }

      executionLog.push(`✗ DOM execution failed: ${domResult.error}`);
    } else {
      executionLog.push('Phase 1: Skipping DOM execution (no selector available)');
    }

    // Phase 2: Fall back to image-based (if enabled and possible)
    if (options.fallbackToImage && this.canUseImageExecutor(step)) {
      executionLog.push('Phase 2: Falling back to image-based execution...');

      const imageResult = await this.imageExecutor.executeStep(step, options);

      if (imageResult.success) {
        executionLog.push('✓ Image execution succeeded');
        return {
          ...imageResult,
          executorUsed: 'image',
          executionLog,
        };
      }

      executionLog.push(`✗ Image execution failed: ${imageResult.error}`);
    } else {
      executionLog.push('Phase 2: Skipping image execution (not available or disabled)');
    }

    // Phase 3: Both failed - pause for human intervention
    executionLog.push('Phase 3: Both DOM and image execution failed');

    if (options.pauseOnFailure) {
      executionLog.push('⏸ Pausing for human intervention');
      return {
        success: false,
        error: 'Automatic execution failed. Human intervention required.',
        executorUsed: 'none',
        needsHuman: true,
        executionLog,
        suggestions: this.generateSuggestions(step, 'hybrid'),
      };
    }

    return {
      success: false,
      error: 'Both DOM and image execution failed',
      executorUsed: 'none',
      executionLog,
    };
  }

  /**
   * Check if DOM executor can be used for this step
   */
  private canUseDOMExecutor(step: SkillStep): boolean {
    // DOM executor needs a selector or can handle certain action types without one
    if (step.target?.selector) {
      return true;
    }

    // Some actions don't need selectors
    if (step.actionType === 'navigate' || step.actionType === 'wait') {
      return true;
    }

    return false;
  }

  /**
   * Check if image executor can be used for this step
   */
  private canUseImageExecutor(step: SkillStep): boolean {
    // Image executor needs coordinates or an image reference
    if (step.target?.coordinates || step.target?.imageRef) {
      return true;
    }

    // Image executor can handle wait actions
    if (step.actionType === 'wait') {
      return true;
    }

    return false;
  }

  /**
   * Generate suggestions for manual intervention
   */
  private generateSuggestions(step: SkillStep, failedMode: 'dom' | 'image' | 'hybrid'): string[] {
    const suggestions: string[] = [];

    switch (step.actionType) {
      case 'click':
        suggestions.push('Try clicking the element manually');
        if (step.target?.description) {
          suggestions.push(`Look for: ${step.target.description}`);
        }
        if (failedMode === 'dom' && !step.target?.selector) {
          suggestions.push('Add a CSS selector or XPath to the step');
        }
        if (failedMode === 'image' && !step.target?.imageRef) {
          suggestions.push('Add a reference screenshot to the step');
        }
        break;

      case 'type':
        suggestions.push('Try typing the text manually');
        if (step.target?.text) {
          suggestions.push(`Text to type: ${step.target.text}`);
        }
        if (!step.target?.selector) {
          suggestions.push('Add a selector for the input field');
        }
        break;

      case 'navigate':
        suggestions.push('Try navigating to the URL manually');
        if (step.target?.text) {
          suggestions.push(`URL: ${step.target.text}`);
        }
        break;

      case 'verify':
        suggestions.push('Manually verify the element exists');
        if (step.target?.description) {
          suggestions.push(`Look for: ${step.target.description}`);
        }
        break;

      default:
        suggestions.push('Review the step instruction and try manually');
    }

    // Add general suggestions based on failed mode
    if (failedMode === 'hybrid') {
      suggestions.push('Consider updating the step with better selectors or coordinates');
      suggestions.push('Check if the page has loaded completely');
      suggestions.push('Verify the element is visible and not hidden');
    }

    return suggestions;
  }

  /**
   * Set the target window for DOM automation
   */
  setTargetWindow(targetWindow: Window): void {
    this.domExecutor.setTargetWindow(targetWindow);
  }

  /**
   * Get the DOM executor instance
   */
  getDOMExecutor(): DOMExecutor {
    return this.domExecutor;
  }

  /**
   * Get the image executor instance
   */
  getImageExecutor(): ImageExecutor {
    return this.imageExecutor;
  }

  /**
   * Clear image executor cache
   */
  clearCache(): void {
    this.imageExecutor.clearCache();
  }
}

/**
 * Create a new hybrid executor instance
 * 
 * @param targetWindow - Optional target window for DOM automation
 * @returns Hybrid executor instance
 */
export function createHybridExecutor(targetWindow?: Window): HybridExecutor {
  return new HybridExecutor(targetWindow);
}

/**
 * Execute a single step using hybrid automation
 * 
 * @param step - Skill step to execute
 * @param options - Hybrid executor options
 * @returns Hybrid execution result
 */
export async function executeStepHybrid(
  step: SkillStep,
  options?: HybridExecutorOptions
): Promise<HybridExecutionResult> {
  const executor = createHybridExecutor();
  return executor.executeStep(step, options);
}
