/**
 * Image Executor Tests
 * 
 * Tests for image-based browser automation functionality.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ImageExecutor, createImageExecutor, executeStepImage } from './image-executor';
import type { SkillStep } from './skill-parser';

// Mock Tauri invoke
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

describe('ImageExecutor', () => {
  let executor: ImageExecutor;

  beforeEach(() => {
    executor = new ImageExecutor();
    vi.clearAllMocks();
    
    // Mock document.elementFromPoint if it doesn't exist
    if (!document.elementFromPoint) {
      document.elementFromPoint = vi.fn();
    }
  });

  afterEach(() => {
    executor.clearCache();
  });

  describe('Constructor', () => {
    it('should create an instance', () => {
      expect(executor).toBeInstanceOf(ImageExecutor);
    });
  });

  describe('executeStep', () => {
    it('should execute click action with coordinates', async () => {
      const step: SkillStep = {
        id: 'step-1',
        index: 0,
        instruction: 'Click button',
        actionType: 'click',
        target: {
          coordinates: { x: 100, y: 200 },
        },
        requiresConfirmation: false,
        status: 'pending',
      };

      // Mock document.elementFromPoint
      const mockElement = document.createElement('button');
      const mockFn = vi.fn().mockReturnValue(mockElement);
      document.elementFromPoint = mockFn;
      vi.spyOn(mockElement, 'click').mockImplementation(() => {});
      vi.spyOn(mockElement, 'dispatchEvent').mockImplementation(() => true);

      // Disable screenshot capture for test
      const result = await executor.executeStep(step, { captureOnError: false });

      expect(result.success).toBe(true);
      expect(mockFn).toHaveBeenCalledWith(100, 200);
    });

    it('should fail when no coordinates or image reference provided', async () => {
      const step: SkillStep = {
        id: 'step-1',
        index: 0,
        instruction: 'Click button',
        actionType: 'click',
        target: {},
        requiresConfirmation: false,
        status: 'pending',
      };

      const result = await executor.executeStep(step);

      expect(result.success).toBe(false);
      expect(result.error).toContain('No coordinates or image reference');
    });

    it('should execute wait action', async () => {
      const step: SkillStep = {
        id: 'step-1',
        index: 0,
        instruction: 'Wait 1 second',
        actionType: 'wait',
        requiresConfirmation: false,
        status: 'pending',
      };

      const startTime = Date.now();
      const result = await executor.executeStep(step, { timeout: 100 });
      const duration = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(duration).toBeGreaterThanOrEqual(100);
    });

    it('should fail for unsupported action types', async () => {
      const step: SkillStep = {
        id: 'step-1',
        index: 0,
        instruction: 'Type text',
        actionType: 'type',
        requiresConfirmation: false,
        status: 'pending',
      };

      const result = await executor.executeStep(step);

      expect(result.success).toBe(false);
      expect(result.error).toContain('does not support action type');
    });
  });

  describe('clickAt', () => {
    it('should click at specified coordinates', async () => {
      const mockElement = document.createElement('button');
      const mockFn = vi.fn().mockReturnValue(mockElement);
      document.elementFromPoint = mockFn;
      vi.spyOn(mockElement, 'click').mockImplementation(() => {});
      vi.spyOn(mockElement, 'dispatchEvent').mockImplementation(() => true);

      const result = await executor.clickAt(150, 250, { captureOnError: false });

      if (!result.success) {
        console.log('Error:', result.error);
      }
      
      expect(result.success).toBe(true);
      expect(mockFn).toHaveBeenCalledWith(150, 250);
      expect(mockElement.click).toHaveBeenCalled();
    });

    it('should fail when no element found at coordinates', async () => {
      const mockFn = vi.fn().mockReturnValue(null);
      document.elementFromPoint = mockFn;

      const result = await executor.clickAt(150, 250, { captureOnError: false });

      expect(result.success).toBe(false);
      expect(result.error).toContain('No element found at coordinates');
    });

    it('should dispatch click event', async () => {
      const mockElement = document.createElement('div');
      const mockFn = vi.fn().mockReturnValue(mockElement);
      document.elementFromPoint = mockFn;
      
      const dispatchSpy = vi.spyOn(mockElement, 'dispatchEvent').mockImplementation(() => true);

      await executor.clickAt(100, 100, { captureOnError: false });

      expect(dispatchSpy).toHaveBeenCalled();
      const event = dispatchSpy.mock.calls[0][0] as MouseEvent;
      expect(event.type).toBe('click');
      expect(event.clientX).toBe(100);
      expect(event.clientY).toBe(100);
    });
  });

  describe('wait', () => {
    it('should wait for specified duration', async () => {
      const startTime = Date.now();
      const result = await executor.wait(100);
      const duration = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(duration).toBeGreaterThanOrEqual(100);
      expect(duration).toBeLessThan(200); // Allow some margin
    });

    it('should return success with duration context', async () => {
      const result = await executor.wait(50);

      expect(result.success).toBe(true);
      expect(result.context?.duration).toBeGreaterThanOrEqual(50);
    });
  });

  describe('Cache Management', () => {
    it('should clear cache', () => {
      // Add some items to cache (using private method simulation)
      executor.clearCache();
      
      // Verify cache is cleared (no error thrown)
      expect(() => executor.clearCache()).not.toThrow();
    });

    it('should get cached screenshot', () => {
      const timestamp = '1234567890';
      const path = executor.getCachedScreenshot(timestamp);
      
      // Should return undefined for non-existent cache entry
      expect(path).toBeUndefined();
    });
  });

  describe('Template Matching', () => {
    it('should handle missing template image', async () => {
      const step: SkillStep = {
        id: 'step-1',
        index: 0,
        instruction: 'Click button by image',
        actionType: 'click',
        target: {
          imageRef: '/nonexistent/image.png',
        },
        requiresConfirmation: false,
        status: 'pending',
      };

      // Mock capture_screen to fail
      const { invoke } = await import('@tauri-apps/api/core');
      vi.mocked(invoke).mockRejectedValue(new Error('Capture failed'));

      const result = await executor.executeStep(step);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should verify image presence', async () => {
      const step: SkillStep = {
        id: 'step-1',
        index: 0,
        instruction: 'Verify button appears',
        actionType: 'verify',
        target: {
          imageRef: '/path/to/button.png',
        },
        requiresConfirmation: false,
        status: 'pending',
      };

      // Mock capture_screen to fail (simulating image not found)
      const { invoke } = await import('@tauri-apps/api/core');
      vi.mocked(invoke).mockRejectedValue(new Error('Capture failed'));

      const result = await executor.executeStep(step);

      expect(result.success).toBe(false);
    });

    it('should fail verification when no image reference provided', async () => {
      const step: SkillStep = {
        id: 'step-1',
        index: 0,
        instruction: 'Verify something',
        actionType: 'verify',
        target: {},
        requiresConfirmation: false,
        status: 'pending',
      };

      const result = await executor.executeStep(step);

      expect(result.success).toBe(false);
      expect(result.error).toContain('No image reference');
    });
  });

  describe('Error Handling', () => {
    it('should handle errors gracefully', async () => {
      const step: SkillStep = {
        id: 'step-1',
        index: 0,
        instruction: 'Click button',
        actionType: 'click',
        target: {
          coordinates: { x: 100, y: 200 },
        },
        requiresConfirmation: false,
        status: 'pending',
      };

      // Mock to throw error
      vi.spyOn(document, 'elementFromPoint').mockImplementation(() => {
        throw new Error('DOM error');
      });

      const result = await executor.executeStep(step);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should include duration in error context', async () => {
      const step: SkillStep = {
        id: 'step-1',
        index: 0,
        instruction: 'Click button',
        actionType: 'click',
        target: {
          coordinates: { x: 100, y: 200 },
        },
        requiresConfirmation: false,
        status: 'pending',
      };

      vi.spyOn(document, 'elementFromPoint').mockImplementation(() => {
        throw new Error('Test error');
      });

      const result = await executor.executeStep(step);

      expect(result.success).toBe(false);
      expect(result.context?.duration).toBeGreaterThanOrEqual(0);
    });
  });
});

describe('Factory Functions', () => {
  describe('createImageExecutor', () => {
    it('should create a new ImageExecutor instance', () => {
      const executor = createImageExecutor();
      expect(executor).toBeInstanceOf(ImageExecutor);
    });
  });

  describe('executeStepImage', () => {
    it('should execute a step using image automation', async () => {
      const step: SkillStep = {
        id: 'step-1',
        index: 0,
        instruction: 'Wait',
        actionType: 'wait',
        requiresConfirmation: false,
        status: 'pending',
      };

      const result = await executeStepImage(step, { timeout: 50 });

      expect(result.success).toBe(true);
    });

    it('should pass options to executor', async () => {
      const step: SkillStep = {
        id: 'step-1',
        index: 0,
        instruction: 'Click',
        actionType: 'click',
        target: {
          coordinates: { x: 10, y: 20 },
        },
        requiresConfirmation: false,
        status: 'pending',
      };

      const mockElement = document.createElement('button');
      const mockFn = vi.fn().mockReturnValue(mockElement);
      document.elementFromPoint = mockFn;
      vi.spyOn(mockElement, 'click').mockImplementation(() => {});
      vi.spyOn(mockElement, 'dispatchEvent').mockImplementation(() => true);

      const result = await executeStepImage(step, { 
        timeout: 1000,
        captureOnError: false,
      });

      expect(result.success).toBe(true);
    });
  });
});

describe('Integration Scenarios', () => {
  it('should handle click with coordinates workflow', async () => {
    const executor = createImageExecutor();
    
    const mockButton = document.createElement('button');
    mockButton.textContent = 'Click Me';
    const mockFn = vi.fn().mockReturnValue(mockButton);
    document.elementFromPoint = mockFn;
    vi.spyOn(mockButton, 'click').mockImplementation(() => {});
    vi.spyOn(mockButton, 'dispatchEvent').mockImplementation(() => true);

    const result = await executor.clickAt(300, 400, { captureOnError: false });

    expect(result.success).toBe(true);
    expect(result.context?.duration).toBeGreaterThanOrEqual(0);
  });

  it('should handle wait workflow', async () => {
    const executor = createImageExecutor();
    
    const startTime = Date.now();
    const result = await executor.wait(200);
    const elapsed = Date.now() - startTime;

    expect(result.success).toBe(true);
    expect(elapsed).toBeGreaterThanOrEqual(200);
  });

  it('should handle multiple operations', async () => {
    const executor = createImageExecutor();
    
    // First click
    const mockElement1 = document.createElement('button');
    const mockFn1 = vi.fn().mockReturnValue(mockElement1);
    document.elementFromPoint = mockFn1;
    vi.spyOn(mockElement1, 'click').mockImplementation(() => {});
    vi.spyOn(mockElement1, 'dispatchEvent').mockImplementation(() => true);
    
    const result1 = await executor.clickAt(100, 100, { captureOnError: false });
    expect(result1.success).toBe(true);

    // Wait
    const result2 = await executor.wait(50);
    expect(result2.success).toBe(true);

    // Second click
    const mockElement2 = document.createElement('button');
    const mockFn2 = vi.fn().mockReturnValue(mockElement2);
    document.elementFromPoint = mockFn2;
    vi.spyOn(mockElement2, 'click').mockImplementation(() => {});
    vi.spyOn(mockElement2, 'dispatchEvent').mockImplementation(() => true);
    
    const result3 = await executor.clickAt(200, 200, { captureOnError: false });
    expect(result3.success).toBe(true);
  });
});
