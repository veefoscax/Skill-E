/**
 * Hybrid Executor Tests
 * 
 * Tests the hybrid automation executor that combines DOM and image-based approaches.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HybridExecutor, createHybridExecutor, executeStepHybrid } from './hybrid-executor';
import type { SkillStep } from './skill-parser';
import type { AutomationResult } from './browser-automation';

// Mock the executors
vi.mock('./browser-automation', () => ({
  DOMExecutor: vi.fn().mockImplementation(() => ({
    executeStep: vi.fn(),
    setTargetWindow: vi.fn(),
    getTargetWindow: vi.fn(),
  })),
  createDOMExecutor: vi.fn(),
  executeStepDOM: vi.fn(),
}));

vi.mock('./image-executor', () => ({
  ImageExecutor: vi.fn().mockImplementation(() => ({
    executeStep: vi.fn(),
    clearCache: vi.fn(),
  })),
  createImageExecutor: vi.fn(),
  executeStepImage: vi.fn(),
}));

describe('HybridExecutor', () => {
  let executor: HybridExecutor;
  let mockDOMExecutor: any;
  let mockImageExecutor: any;

  beforeEach(() => {
    executor = new HybridExecutor();
    mockDOMExecutor = (executor as any).domExecutor;
    mockImageExecutor = (executor as any).imageExecutor;
  });

  describe('DOM-first execution', () => {
    it('should use DOM executor when selector is available', async () => {
      const step: SkillStep = {
        id: 'step-1',
        index: 0,
        instruction: 'Click the submit button',
        actionType: 'click',
        target: {
          selector: '#submit-btn',
          description: 'Submit button',
        },
        requiresConfirmation: false,
        status: 'pending',
      };

      const domResult: AutomationResult = {
        success: true,
        context: {
          elementFound: true,
          selector: '#submit-btn',
          duration: 100,
        },
      };

      mockDOMExecutor.executeStep.mockResolvedValue(domResult);

      const result = await executor.executeStep(step);

      expect(result.success).toBe(true);
      expect(result.executorUsed).toBe('dom');
      expect(mockDOMExecutor.executeStep).toHaveBeenCalledWith(step, expect.any(Object));
      expect(mockImageExecutor.executeStep).not.toHaveBeenCalled();
    });

    it('should include execution log', async () => {
      const step: SkillStep = {
        id: 'step-1',
        index: 0,
        instruction: 'Click the button',
        actionType: 'click',
        target: { selector: '#btn' },
        requiresConfirmation: false,
        status: 'pending',
      };

      mockDOMExecutor.executeStep.mockResolvedValue({ success: true });

      const result = await executor.executeStep(step);

      expect(result.executionLog).toBeDefined();
      expect(result.executionLog).toContain('Starting execution of step: Click the button');
      expect(result.executionLog).toContain('Phase 1: Attempting DOM execution...');
      expect(result.executionLog).toContain('✓ DOM execution succeeded');
    });
  });

  describe('Image fallback', () => {
    it('should fall back to image executor when DOM fails', async () => {
      const step: SkillStep = {
        id: 'step-1',
        index: 0,
        instruction: 'Click at coordinates',
        actionType: 'click',
        target: {
          selector: '#missing-element',
          coordinates: { x: 100, y: 200 },
        },
        requiresConfirmation: false,
        status: 'pending',
      };

      const domResult: AutomationResult = {
        success: false,
        error: 'Element not found',
      };

      const imageResult: AutomationResult = {
        success: true,
        context: {
          duration: 150,
        },
      };

      mockDOMExecutor.executeStep.mockResolvedValue(domResult);
      mockImageExecutor.executeStep.mockResolvedValue(imageResult);

      const result = await executor.executeStep(step);

      expect(result.success).toBe(true);
      expect(result.executorUsed).toBe('image');
      expect(mockDOMExecutor.executeStep).toHaveBeenCalled();
      expect(mockImageExecutor.executeStep).toHaveBeenCalled();
    });

    it('should include both attempts in execution log', async () => {
      const step: SkillStep = {
        id: 'step-1',
        index: 0,
        instruction: 'Click element',
        actionType: 'click',
        target: {
          selector: '#btn',
          imageRef: 'button.png',
        },
        requiresConfirmation: false,
        status: 'pending',
      };

      mockDOMExecutor.executeStep.mockResolvedValue({
        success: false,
        error: 'Element not found',
      });
      mockImageExecutor.executeStep.mockResolvedValue({ success: true });

      const result = await executor.executeStep(step);

      expect(result.executionLog).toContain('Phase 1: Attempting DOM execution...');
      expect(result.executionLog).toContain('✗ DOM execution failed: Element not found');
      expect(result.executionLog).toContain('Phase 2: Falling back to image-based execution...');
      expect(result.executionLog).toContain('✓ Image execution succeeded');
    });

    it('should skip image fallback when not available', async () => {
      const step: SkillStep = {
        id: 'step-1',
        index: 0,
        instruction: 'Click button',
        actionType: 'click',
        target: {
          selector: '#btn',
          // No coordinates or imageRef
        },
        requiresConfirmation: false,
        status: 'pending',
      };

      mockDOMExecutor.executeStep.mockResolvedValue({
        success: false,
        error: 'Element not found',
      });

      const result = await executor.executeStep(step, { pauseOnFailure: false });

      expect(result.success).toBe(false);
      expect(result.executorUsed).toBe('none');
      expect(mockImageExecutor.executeStep).not.toHaveBeenCalled();
      expect(result.executionLog).toBeDefined();
      expect(result.executionLog!.some(log => log.includes('Skipping image execution'))).toBe(true);
    });
  });

  describe('Human intervention', () => {
    it('should pause for human when both executors fail', async () => {
      const step: SkillStep = {
        id: 'step-1',
        index: 0,
        instruction: 'Click button',
        actionType: 'click',
        target: {
          selector: '#btn',
          coordinates: { x: 100, y: 200 },
        },
        requiresConfirmation: false,
        status: 'pending',
      };

      mockDOMExecutor.executeStep.mockResolvedValue({
        success: false,
        error: 'DOM failed',
      });
      mockImageExecutor.executeStep.mockResolvedValue({
        success: false,
        error: 'Image failed',
      });

      const result = await executor.executeStep(step);

      expect(result.success).toBe(false);
      expect(result.needsHuman).toBe(true);
      expect(result.executorUsed).toBe('none');
      expect(result.suggestions).toBeDefined();
      expect(result.suggestions!.length).toBeGreaterThan(0);
    });

    it('should include helpful suggestions', async () => {
      const step: SkillStep = {
        id: 'step-1',
        index: 0,
        instruction: 'Click the submit button',
        actionType: 'click',
        target: {
          selector: '#submit',
          description: 'Submit button',
        },
        requiresConfirmation: false,
        status: 'pending',
      };

      mockDOMExecutor.executeStep.mockResolvedValue({
        success: false,
        error: 'Failed',
      });

      const result = await executor.executeStep(step);

      expect(result.suggestions).toContain('Try clicking the element manually');
      expect(result.suggestions).toContain('Look for: Submit button');
    });

    it('should not pause when pauseOnFailure is false', async () => {
      const step: SkillStep = {
        id: 'step-1',
        index: 0,
        instruction: 'Click button',
        actionType: 'click',
        target: { selector: '#btn' },
        requiresConfirmation: false,
        status: 'pending',
      };

      mockDOMExecutor.executeStep.mockResolvedValue({
        success: false,
        error: 'Failed',
      });

      const result = await executor.executeStep(step, { pauseOnFailure: false });

      expect(result.success).toBe(false);
      expect(result.needsHuman).toBeUndefined();
      expect(result.suggestions).toBeUndefined();
    });
  });

  describe('Execution modes', () => {
    it('should use only DOM when mode is "dom"', async () => {
      const step: SkillStep = {
        id: 'step-1',
        index: 0,
        instruction: 'Click button',
        actionType: 'click',
        target: {
          selector: '#btn',
          coordinates: { x: 100, y: 200 },
        },
        requiresConfirmation: false,
        status: 'pending',
      };

      mockDOMExecutor.executeStep.mockResolvedValue({
        success: false,
        error: 'Failed',
      });

      const result = await executor.executeStep(step, { mode: 'dom' });

      expect(mockDOMExecutor.executeStep).toHaveBeenCalled();
      expect(mockImageExecutor.executeStep).not.toHaveBeenCalled();
      expect(result.executorUsed).toBe('none');
    });

    it('should use only image when mode is "image"', async () => {
      const step: SkillStep = {
        id: 'step-1',
        index: 0,
        instruction: 'Click at coordinates',
        actionType: 'click',
        target: {
          coordinates: { x: 100, y: 200 },
        },
        requiresConfirmation: false,
        status: 'pending',
      };

      mockImageExecutor.executeStep.mockResolvedValue({ success: true });

      const result = await executor.executeStep(step, { mode: 'image' });

      expect(mockImageExecutor.executeStep).toHaveBeenCalled();
      expect(mockDOMExecutor.executeStep).not.toHaveBeenCalled();
      expect(result.executorUsed).toBe('image');
    });

    it('should try both when mode is "hybrid"', async () => {
      const step: SkillStep = {
        id: 'step-1',
        index: 0,
        instruction: 'Click button',
        actionType: 'click',
        target: {
          selector: '#btn',
          coordinates: { x: 100, y: 200 },
        },
        requiresConfirmation: false,
        status: 'pending',
      };

      mockDOMExecutor.executeStep.mockResolvedValue({
        success: false,
        error: 'Failed',
      });
      mockImageExecutor.executeStep.mockResolvedValue({ success: true });

      const result = await executor.executeStep(step, { mode: 'hybrid' });

      expect(mockDOMExecutor.executeStep).toHaveBeenCalled();
      expect(mockImageExecutor.executeStep).toHaveBeenCalled();
      expect(result.executorUsed).toBe('image');
    });
  });

  describe('Action type handling', () => {
    it('should handle navigate action with DOM', async () => {
      const step: SkillStep = {
        id: 'step-1',
        index: 0,
        instruction: 'Navigate to example.com',
        actionType: 'navigate',
        target: { text: 'https://example.com' },
        requiresConfirmation: false,
        status: 'pending',
      };

      mockDOMExecutor.executeStep.mockResolvedValue({ success: true });

      const result = await executor.executeStep(step);

      expect(result.success).toBe(true);
      expect(result.executorUsed).toBe('dom');
    });

    it('should handle wait action', async () => {
      const step: SkillStep = {
        id: 'step-1',
        index: 0,
        instruction: 'Wait 2 seconds',
        actionType: 'wait',
        requiresConfirmation: false,
        status: 'pending',
      };

      mockDOMExecutor.executeStep.mockResolvedValue({ success: true });

      const result = await executor.executeStep(step);

      expect(result.success).toBe(true);
      expect(result.executorUsed).toBe('dom');
    });

    it('should handle type action', async () => {
      const step: SkillStep = {
        id: 'step-1',
        index: 0,
        instruction: 'Type email',
        actionType: 'type',
        target: {
          selector: '#email',
          text: 'test@example.com',
        },
        requiresConfirmation: false,
        status: 'pending',
      };

      mockDOMExecutor.executeStep.mockResolvedValue({ success: true });

      const result = await executor.executeStep(step);

      expect(result.success).toBe(true);
      expect(result.executorUsed).toBe('dom');
    });

    it('should handle verify action', async () => {
      const step: SkillStep = {
        id: 'step-1',
        index: 0,
        instruction: 'Verify element exists',
        actionType: 'verify',
        target: { selector: '#success-message' },
        requiresConfirmation: false,
        status: 'pending',
      };

      mockDOMExecutor.executeStep.mockResolvedValue({ success: true });

      const result = await executor.executeStep(step);

      expect(result.success).toBe(true);
      expect(result.executorUsed).toBe('dom');
    });
  });

  describe('Suggestions generation', () => {
    it('should generate click suggestions', async () => {
      const step: SkillStep = {
        id: 'step-1',
        index: 0,
        instruction: 'Click button',
        actionType: 'click',
        target: {
          description: 'Submit button',
          // No selector - should trigger suggestion
        },
        requiresConfirmation: false,
        status: 'pending',
      };

      mockDOMExecutor.executeStep.mockResolvedValue({
        success: false,
        error: 'Failed',
      });

      const result = await executor.executeStep(step);

      expect(result.suggestions).toBeDefined();
      expect(result.suggestions).toContain('Try clicking the element manually');
      expect(result.suggestions).toContain('Look for: Submit button');
      // Check that suggestions include helpful advice
      expect(result.suggestions!.length).toBeGreaterThan(2);
    });

    it('should generate type suggestions', async () => {
      const step: SkillStep = {
        id: 'step-1',
        index: 0,
        instruction: 'Type text',
        actionType: 'type',
        target: {
          text: 'Hello World',
        },
        requiresConfirmation: false,
        status: 'pending',
      };

      mockDOMExecutor.executeStep.mockResolvedValue({
        success: false,
        error: 'Failed',
      });

      const result = await executor.executeStep(step);

      expect(result.suggestions).toContain('Try typing the text manually');
      expect(result.suggestions).toContain('Text to type: Hello World');
      expect(result.suggestions).toContain('Add a selector for the input field');
    });

    it('should generate navigate suggestions', async () => {
      const step: SkillStep = {
        id: 'step-1',
        index: 0,
        instruction: 'Navigate to URL',
        actionType: 'navigate',
        target: {
          text: 'https://example.com',
        },
        requiresConfirmation: false,
        status: 'pending',
      };

      mockDOMExecutor.executeStep.mockResolvedValue({
        success: false,
        error: 'Failed',
      });

      const result = await executor.executeStep(step);

      expect(result.suggestions).toContain('Try navigating to the URL manually');
      expect(result.suggestions).toContain('URL: https://example.com');
    });
  });

  describe('Utility methods', () => {
    it('should set target window', () => {
      const mockWindow = {} as Window;
      executor.setTargetWindow(mockWindow);
      expect(mockDOMExecutor.setTargetWindow).toHaveBeenCalledWith(mockWindow);
    });

    it('should get DOM executor', () => {
      const domExec = executor.getDOMExecutor();
      expect(domExec).toBe(mockDOMExecutor);
    });

    it('should get image executor', () => {
      const imageExec = executor.getImageExecutor();
      expect(imageExec).toBe(mockImageExecutor);
    });

    it('should clear cache', () => {
      executor.clearCache();
      expect(mockImageExecutor.clearCache).toHaveBeenCalled();
    });
  });

  describe('Factory functions', () => {
    it('should create hybrid executor', () => {
      const exec = createHybridExecutor();
      expect(exec).toBeInstanceOf(HybridExecutor);
    });

    it('should execute step with factory function', async () => {
      const step: SkillStep = {
        id: 'step-1',
        index: 0,
        instruction: 'Click button',
        actionType: 'click',
        target: { selector: '#btn' },
        requiresConfirmation: false,
        status: 'pending',
      };

      // Mock the constructor to return our mocked executor
      const mockExecuteStep = vi.fn().mockResolvedValue({ success: true });
      vi.spyOn(HybridExecutor.prototype, 'executeStep').mockImplementation(mockExecuteStep);

      await executeStepHybrid(step);

      expect(mockExecuteStep).toHaveBeenCalledWith(step, undefined);
    });
  });

  describe('Edge cases', () => {
    it('should handle step with no target', async () => {
      const step: SkillStep = {
        id: 'step-1',
        index: 0,
        instruction: 'Wait',
        actionType: 'wait',
        requiresConfirmation: false,
        status: 'pending',
      };

      mockDOMExecutor.executeStep.mockResolvedValue({ success: true });

      const result = await executor.executeStep(step);

      expect(result.success).toBe(true);
    });

    it('should respect fallbackToImage option', async () => {
      const step: SkillStep = {
        id: 'step-1',
        index: 0,
        instruction: 'Click button',
        actionType: 'click',
        target: {
          selector: '#btn',
          coordinates: { x: 100, y: 200 },
        },
        requiresConfirmation: false,
        status: 'pending',
      };

      mockDOMExecutor.executeStep.mockResolvedValue({
        success: false,
        error: 'Failed',
      });

      await executor.executeStep(step, { 
        fallbackToImage: false, 
        pauseOnFailure: true
      });

      // Image executor should not be called when fallbackToImage is false
      expect(mockImageExecutor.executeStep).not.toHaveBeenCalled();
    });
  });
});
