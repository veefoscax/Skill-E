/**
 * Hybrid Executor Integration Tests
 * 
 * Validates acceptance criteria AC3: Browser Automation Modes
 * - Image-based: Uses screenshot + click coordinates
 * - DOM-based: Uses CSS selectors or XPath
 * - Hybrid: Tries DOM first, falls back to image
 * - Warns when anti-bot measures detected (handled by bot-detection module)
 * 
 * Requirements: FR-10.4, FR-10.5
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HybridExecutor } from './hybrid-executor';
import type { SkillStep } from './skill-parser';

// Mock the executors for integration tests
vi.mock('./browser-automation', () => ({
  DOMExecutor: vi.fn().mockImplementation(() => ({
    executeStep: vi.fn().mockResolvedValue({ success: false, error: 'Element not found' }),
    setTargetWindow: vi.fn(),
    getTargetWindow: vi.fn(),
  })),
  createDOMExecutor: vi.fn(),
  executeStepDOM: vi.fn(),
}));

vi.mock('./image-executor', () => ({
  ImageExecutor: vi.fn().mockImplementation(() => ({
    executeStep: vi.fn().mockResolvedValue({ success: false, error: 'Image not found' }),
    clearCache: vi.fn(),
  })),
  createImageExecutor: vi.fn(),
  executeStepImage: vi.fn(),
}));

describe('Hybrid Executor - Integration Tests', () => {
  let executor: HybridExecutor;

  beforeEach(() => {
    executor = new HybridExecutor();
  });

  describe('AC3: Browser Automation Modes', () => {
    describe('Image-based: Uses screenshot + click coordinates', () => {
      it('should execute using coordinates when provided', async () => {
        const step: SkillStep = {
          id: 'step-1',
          index: 0,
          instruction: 'Click at specific coordinates',
          actionType: 'click',
          target: {
            coordinates: { x: 150, y: 250 },
            description: 'Button at coordinates',
          },
          requiresConfirmation: false,
          status: 'pending',
        };

        const result = await executor.executeStep(step, { mode: 'image' });

        // Should attempt image-based execution
        expect(result.executionLog).toBeDefined();
        expect(result.executionLog!.some(log => 
          log.includes('image-based execution')
        )).toBe(true);
      });

      it('should use image reference when provided', async () => {
        const step: SkillStep = {
          id: 'step-2',
          index: 1,
          instruction: 'Click button from screenshot',
          actionType: 'click',
          target: {
            imageRef: 'button-screenshot.png',
            description: 'Submit button',
          },
          requiresConfirmation: false,
          status: 'pending',
        };

        const result = await executor.executeStep(step, { mode: 'image' });

        expect(result.executionLog).toBeDefined();
        expect(result.executionLog!.some(log => 
          log.includes('image-based execution')
        )).toBe(true);
      });
    });

    describe('DOM-based: Uses CSS selectors or XPath', () => {
      it('should execute using CSS selector', async () => {
        const step: SkillStep = {
          id: 'step-3',
          index: 2,
          instruction: 'Click submit button',
          actionType: 'click',
          target: {
            selector: '#submit-button',
            description: 'Submit button',
          },
          requiresConfirmation: false,
          status: 'pending',
        };

        const result = await executor.executeStep(step, { mode: 'dom' });

        expect(result.executionLog).toBeDefined();
        expect(result.executionLog!.some(log => 
          log.includes('DOM execution')
        )).toBe(true);
      });

      it('should execute using XPath selector', async () => {
        const step: SkillStep = {
          id: 'step-4',
          index: 3,
          instruction: 'Click button by XPath',
          actionType: 'click',
          target: {
            selector: '//button[@type="submit"]',
            description: 'Submit button via XPath',
          },
          requiresConfirmation: false,
          status: 'pending',
        };

        const result = await executor.executeStep(step, { mode: 'dom' });

        expect(result.executionLog).toBeDefined();
        expect(result.executionLog!.some(log => 
          log.includes('DOM execution')
        )).toBe(true);
      });

      it('should handle type action with selector', async () => {
        const step: SkillStep = {
          id: 'step-5',
          index: 4,
          instruction: 'Type email address',
          actionType: 'type',
          target: {
            selector: 'input[name="email"]',
            text: 'user@example.com',
          },
          requiresConfirmation: false,
          status: 'pending',
        };

        const result = await executor.executeStep(step, { mode: 'dom' });

        expect(result.executionLog).toBeDefined();
        expect(result.executionLog!.some(log => 
          log.includes('DOM execution')
        )).toBe(true);
      });
    });

    describe('Hybrid: Tries DOM first, falls back to image', () => {
      it('should try DOM first when both selector and coordinates available', async () => {
        const step: SkillStep = {
          id: 'step-6',
          index: 5,
          instruction: 'Click button (hybrid)',
          actionType: 'click',
          target: {
            selector: '#button',
            coordinates: { x: 100, y: 200 },
            description: 'Button with both selector and coordinates',
          },
          requiresConfirmation: false,
          status: 'pending',
        };

        const result = await executor.executeStep(step, { mode: 'hybrid' });

        expect(result.executionLog).toBeDefined();
        // Should show Phase 1 (DOM) attempt
        expect(result.executionLog!.some(log => 
          log.includes('Phase 1: Attempting DOM execution')
        )).toBe(true);
      });

      it('should fall back to image when DOM fails', async () => {
        const step: SkillStep = {
          id: 'step-7',
          index: 6,
          instruction: 'Click button (fallback scenario)',
          actionType: 'click',
          target: {
            selector: '#non-existent-button',
            coordinates: { x: 100, y: 200 },
          },
          requiresConfirmation: false,
          status: 'pending',
        };

        const result = await executor.executeStep(step, { mode: 'hybrid' });

        expect(result.executionLog).toBeDefined();
        // Should show both Phase 1 (DOM) and Phase 2 (Image) attempts
        expect(result.executionLog!.some(log => 
          log.includes('Phase 1: Attempting DOM execution')
        )).toBe(true);
        expect(result.executionLog!.some(log => 
          log.includes('Phase 2: Falling back to image-based execution')
        )).toBe(true);
      });

      it('should skip image fallback when not available', async () => {
        const step: SkillStep = {
          id: 'step-8',
          index: 7,
          instruction: 'Click button (no image fallback)',
          actionType: 'click',
          target: {
            selector: '#button',
            // No coordinates or imageRef
          },
          requiresConfirmation: false,
          status: 'pending',
        };

        const result = await executor.executeStep(step, { mode: 'hybrid' });

        expect(result.executionLog).toBeDefined();
        expect(result.executionLog!.some(log => 
          log.includes('Skipping image execution')
        )).toBe(true);
      });
    });

    describe('Human intervention when both fail', () => {
      it('should pause for human when both DOM and image fail', async () => {
        const step: SkillStep = {
          id: 'step-9',
          index: 8,
          instruction: 'Click difficult element',
          actionType: 'click',
          target: {
            selector: '#missing-element',
            coordinates: { x: 100, y: 200 },
          },
          requiresConfirmation: false,
          status: 'pending',
        };

        const result = await executor.executeStep(step, { 
          mode: 'hybrid',
          pauseOnFailure: true 
        });

        // Should indicate need for human intervention
        expect(result.needsHuman).toBe(true);
        expect(result.executorUsed).toBe('none');
        expect(result.suggestions).toBeDefined();
        expect(result.suggestions!.length).toBeGreaterThan(0);
      });

      it('should provide helpful suggestions for manual intervention', async () => {
        const step: SkillStep = {
          id: 'step-10',
          index: 9,
          instruction: 'Click the submit button',
          actionType: 'click',
          target: {
            selector: '#submit',
            description: 'Submit button',
          },
          requiresConfirmation: false,
          status: 'pending',
        };

        const result = await executor.executeStep(step, { 
          mode: 'hybrid',
          pauseOnFailure: true 
        });

        expect(result.suggestions).toBeDefined();
        expect(result.suggestions!.some(s => 
          s.includes('Try clicking the element manually')
        )).toBe(true);
        expect(result.suggestions!.some(s => 
          s.includes('Submit button')
        )).toBe(true);
      });
    });
  });

  describe('FR-10.4: Image-based click (screenshot + coordinates)', () => {
    it('should support clicking by coordinates', async () => {
      const step: SkillStep = {
        id: 'fr-10.4-1',
        index: 0,
        instruction: 'Click at pixel coordinates',
        actionType: 'click',
        target: {
          coordinates: { x: 500, y: 300 },
        },
        requiresConfirmation: false,
        status: 'pending',
      };

      const result = await executor.executeStep(step, { mode: 'image' });

      expect(result.executionLog).toBeDefined();
      expect(result.executionLog!.some(log => 
        log.includes('image-based execution')
      )).toBe(true);
    });

    it('should support clicking by image reference', async () => {
      const step: SkillStep = {
        id: 'fr-10.4-2',
        index: 1,
        instruction: 'Click element from screenshot',
        actionType: 'click',
        target: {
          imageRef: 'target-element.png',
        },
        requiresConfirmation: false,
        status: 'pending',
      };

      const result = await executor.executeStep(step, { mode: 'image' });

      expect(result.executionLog).toBeDefined();
      expect(result.executionLog!.some(log => 
        log.includes('image-based execution')
      )).toBe(true);
    });
  });

  describe('FR-10.5: DOM-based actions (CSS selectors, XPath)', () => {
    it('should support CSS selectors', async () => {
      const step: SkillStep = {
        id: 'fr-10.5-1',
        index: 0,
        instruction: 'Click using CSS selector',
        actionType: 'click',
        target: {
          selector: '.btn-primary',
        },
        requiresConfirmation: false,
        status: 'pending',
      };

      const result = await executor.executeStep(step, { mode: 'dom' });

      expect(result.executionLog).toBeDefined();
      expect(result.executionLog!.some(log => 
        log.includes('DOM execution')
      )).toBe(true);
    });

    it('should support XPath selectors', async () => {
      const step: SkillStep = {
        id: 'fr-10.5-2',
        index: 1,
        instruction: 'Click using XPath',
        actionType: 'click',
        target: {
          selector: '//div[@class="container"]/button[1]',
        },
        requiresConfirmation: false,
        status: 'pending',
      };

      const result = await executor.executeStep(step, { mode: 'dom' });

      expect(result.executionLog).toBeDefined();
      expect(result.executionLog!.some(log => 
        log.includes('DOM execution')
      )).toBe(true);
    });

    it('should support typing into input fields', async () => {
      const step: SkillStep = {
        id: 'fr-10.5-3',
        index: 2,
        instruction: 'Type into input field',
        actionType: 'type',
        target: {
          selector: 'input#username',
          text: 'testuser',
        },
        requiresConfirmation: false,
        status: 'pending',
      };

      const result = await executor.executeStep(step, { mode: 'dom' });

      expect(result.executionLog).toBeDefined();
      expect(result.executionLog!.some(log => 
        log.includes('DOM execution')
      )).toBe(true);
    });

    it('should support navigation', async () => {
      const step: SkillStep = {
        id: 'fr-10.5-4',
        index: 3,
        instruction: 'Navigate to URL',
        actionType: 'navigate',
        target: {
          text: 'https://example.com',
        },
        requiresConfirmation: false,
        status: 'pending',
      };

      const result = await executor.executeStep(step, { mode: 'dom' });

      expect(result.executionLog).toBeDefined();
      expect(result.executionLog!.some(log => 
        log.includes('DOM execution')
      )).toBe(true);
    });

    it('should support element verification', async () => {
      const step: SkillStep = {
        id: 'fr-10.5-5',
        index: 4,
        instruction: 'Verify element exists',
        actionType: 'verify',
        target: {
          selector: '#success-message',
        },
        requiresConfirmation: false,
        status: 'pending',
      };

      const result = await executor.executeStep(step, { mode: 'dom' });

      expect(result.executionLog).toBeDefined();
      expect(result.executionLog!.some(log => 
        log.includes('DOM execution')
      )).toBe(true);
    });
  });

  describe('Execution result structure', () => {
    it('should return complete execution result', async () => {
      const step: SkillStep = {
        id: 'result-1',
        index: 0,
        instruction: 'Test step',
        actionType: 'click',
        target: {
          selector: '#test',
        },
        requiresConfirmation: false,
        status: 'pending',
      };

      const result = await executor.executeStep(step);

      // Verify result structure
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('executorUsed');
      expect(result).toHaveProperty('executionLog');
      expect(Array.isArray(result.executionLog)).toBe(true);
    });

    it('should include error details on failure', async () => {
      const step: SkillStep = {
        id: 'result-2',
        index: 1,
        instruction: 'Failing step',
        actionType: 'click',
        target: {
          selector: '#non-existent',
        },
        requiresConfirmation: false,
        status: 'pending',
      };

      const result = await executor.executeStep(step, { pauseOnFailure: true });

      if (!result.success) {
        expect(result.error).toBeDefined();
        expect(typeof result.error).toBe('string');
      }
    });
  });

  describe('Configuration options', () => {
    it('should respect mode option', async () => {
      const step: SkillStep = {
        id: 'config-1',
        index: 0,
        instruction: 'Test mode',
        actionType: 'click',
        target: {
          selector: '#test',
          coordinates: { x: 100, y: 100 },
        },
        requiresConfirmation: false,
        status: 'pending',
      };

      // Test DOM mode
      const domResult = await executor.executeStep(step, { mode: 'dom' });
      expect(domResult.executionLog!.some(log => 
        log.includes('Execution mode: dom')
      )).toBe(true);

      // Test image mode
      const imageResult = await executor.executeStep(step, { mode: 'image' });
      expect(imageResult.executionLog!.some(log => 
        log.includes('Execution mode: image')
      )).toBe(true);

      // Test hybrid mode
      const hybridResult = await executor.executeStep(step, { mode: 'hybrid' });
      expect(hybridResult.executionLog!.some(log => 
        log.includes('Execution mode: hybrid')
      )).toBe(true);
    });

    it('should respect fallbackToImage option', async () => {
      const step: SkillStep = {
        id: 'config-2',
        index: 1,
        instruction: 'Test fallback',
        actionType: 'click',
        target: {
          selector: '#missing',
          coordinates: { x: 100, y: 100 },
        },
        requiresConfirmation: false,
        status: 'pending',
      };

      // With fallback enabled
      const withFallback = await executor.executeStep(step, { 
        mode: 'hybrid',
        fallbackToImage: true 
      });
      expect(withFallback.executionLog!.some(log => 
        log.includes('Falling back to image-based execution')
      )).toBe(true);

      // With fallback disabled
      const noFallback = await executor.executeStep(step, { 
        mode: 'hybrid',
        fallbackToImage: false,
        pauseOnFailure: false
      });
      expect(noFallback.executionLog!.some(log => 
        log.includes('Skipping image execution')
      )).toBe(true);
    });

    it('should respect pauseOnFailure option', async () => {
      const step: SkillStep = {
        id: 'config-3',
        index: 2,
        instruction: 'Test pause',
        actionType: 'click',
        target: {
          selector: '#missing',
        },
        requiresConfirmation: false,
        status: 'pending',
      };

      // With pause enabled
      const withPause = await executor.executeStep(step, { 
        pauseOnFailure: true 
      });
      expect(withPause.needsHuman).toBe(true);
      expect(withPause.suggestions).toBeDefined();

      // With pause disabled
      const noPause = await executor.executeStep(step, { 
        pauseOnFailure: false 
      });
      expect(noPause.needsHuman).toBeUndefined();
      expect(noPause.suggestions).toBeUndefined();
    });
  });
});
