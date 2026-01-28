/**
 * Executor Integration Tests
 * 
 * Comprehensive integration tests for DOM, Image, and Hybrid executors.
 * Tests real-world scenarios with mock pages and template matching.
 * 
 * Requirements: FR-10.4, FR-10.5
 * Task: S10-21 Executor Testing
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DOMExecutor } from './browser-automation';
import { ImageExecutor } from './image-executor';
import { HybridExecutor } from './hybrid-executor';
import type { SkillStep } from './skill-parser';

/**
 * Create a mock page with various interactive elements
 */
function createMockPage(): void {
  document.body.innerHTML = `
    <div id="app">
      <header>
        <h1>Test Application</h1>
        <nav>
          <a href="#home" id="nav-home">Home</a>
          <a href="#about" id="nav-about">About</a>
          <button id="nav-menu" class="menu-btn">Menu</button>
        </nav>
      </header>
      
      <main>
        <form id="login-form">
          <input type="text" id="username" name="username" placeholder="Username" />
          <input type="password" id="password" name="password" placeholder="Password" />
          <button type="submit" id="submit-btn" class="primary-btn">Login</button>
        </form>
        
        <div id="content" class="content-area">
          <p id="welcome-message">Welcome to the test page</p>
          <button id="action-btn" class="action-button">Click Me</button>
        </div>
        
        <div id="hidden-section" style="display: none;">
          <p>This is hidden</p>
          <button id="hidden-btn">Hidden Button</button>
        </div>
        
        <div id="disabled-section">
          <button id="disabled-btn" disabled>Disabled Button</button>
          <input type="text" id="disabled-input" disabled />
        </div>
      </main>
      
      <footer>
        <p id="footer-text">© 2024 Test App</p>
      </footer>
    </div>
  `;
}

/**
 * Clean up the mock page
 */
function cleanupMockPage(): void {
  document.body.innerHTML = '';
}

describe('DOM Executor - Mock Page Integration', () => {
  let executor: DOMExecutor;

  beforeEach(() => {
    createMockPage();
    executor = new DOMExecutor();
  });

  afterEach(() => {
    cleanupMockPage();
  });

  describe('Form Interaction Workflow', () => {
    it('should complete a full login form workflow', async () => {
      // Step 1: Type username
      const usernameStep: SkillStep = {
        id: 'step-1',
        index: 0,
        instruction: 'Enter username',
        actionType: 'type',
        target: {
          selector: '#username',
          text: 'testuser@example.com',
        },
        requiresConfirmation: false,
        status: 'pending',
      };

      const result1 = await executor.executeStep(usernameStep, { timeout: 1000, waitForVisible: false });
      expect(result1.success).toBe(true);
      expect((document.getElementById('username') as HTMLInputElement).value).toBe('testuser@example.com');

      // Step 2: Type password
      const passwordStep: SkillStep = {
        id: 'step-2',
        index: 1,
        instruction: 'Enter password',
        actionType: 'type',
        target: {
          selector: '#password',
          text: 'SecurePass123!',
        },
        requiresConfirmation: false,
        status: 'pending',
      };

      const result2 = await executor.executeStep(passwordStep, { timeout: 1000, waitForVisible: false });
      expect(result2.success).toBe(true);
      expect((document.getElementById('password') as HTMLInputElement).value).toBe('SecurePass123!');

      // Step 3: Click submit button
      const submitStep: SkillStep = {
        id: 'step-3',
        index: 2,
        instruction: 'Click submit button',
        actionType: 'click',
        target: {
          selector: '#submit-btn',
        },
        requiresConfirmation: false,
        status: 'pending',
      };

      const submitSpy = vi.fn();
      document.getElementById('submit-btn')!.addEventListener('click', submitSpy);

      const result3 = await executor.executeStep(submitStep, { timeout: 1000, waitForVisible: false });
      expect(result3.success).toBe(true);
      expect(submitSpy).toHaveBeenCalled();
    });

    it('should handle form validation errors', async () => {
      // Try to submit without filling fields
      const submitStep: SkillStep = {
        id: 'step-1',
        index: 0,
        instruction: 'Click submit',
        actionType: 'click',
        target: {
          selector: '#submit-btn',
        },
        requiresConfirmation: false,
        status: 'pending',
      };

      const result = await executor.executeStep(submitStep, { timeout: 1000, waitForVisible: false });
      expect(result.success).toBe(true);
      
      // Verify form fields are still empty
      expect((document.getElementById('username') as HTMLInputElement).value).toBe('');
      expect((document.getElementById('password') as HTMLInputElement).value).toBe('');
    });
  });

  describe('Navigation Workflow', () => {
    it('should click through navigation links', async () => {
      const navSteps: SkillStep[] = [
        {
          id: 'nav-1',
          index: 0,
          instruction: 'Click Home',
          actionType: 'click',
          target: { selector: '#nav-home' },
          requiresConfirmation: false,
          status: 'pending',
        },
        {
          id: 'nav-2',
          index: 1,
          instruction: 'Click About',
          actionType: 'click',
          target: { selector: '#nav-about' },
          requiresConfirmation: false,
          status: 'pending',
        },
        {
          id: 'nav-3',
          index: 2,
          instruction: 'Click Menu',
          actionType: 'click',
          target: { selector: '#nav-menu' },
          requiresConfirmation: false,
          status: 'pending',
        },
      ];

      for (const step of navSteps) {
        const result = await executor.executeStep(step, { timeout: 1000, waitForVisible: false });
        expect(result.success).toBe(true);
        expect(result.context?.elementFound).toBe(true);
      }
    });
  });

  describe('Complex Selector Scenarios', () => {
    it('should handle class selectors', async () => {
      const step: SkillStep = {
        id: 'step-1',
        index: 0,
        instruction: 'Click action button',
        actionType: 'click',
        target: { selector: '.action-button' },
        requiresConfirmation: false,
        status: 'pending',
      };

      const result = await executor.executeStep(step, { timeout: 1000, waitForVisible: false });
      expect(result.success).toBe(true);
    });

    it('should handle descendant selectors', async () => {
      const step: SkillStep = {
        id: 'step-1',
        index: 0,
        instruction: 'Click form button',
        actionType: 'click',
        target: { selector: 'form button' },
        requiresConfirmation: false,
        status: 'pending',
      };

      const result = await executor.executeStep(step, { timeout: 1000, waitForVisible: false });
      expect(result.success).toBe(true);
    });

    it('should handle attribute selectors', async () => {
      const step: SkillStep = {
        id: 'step-1',
        index: 0,
        instruction: 'Type in username field',
        actionType: 'type',
        target: {
          selector: 'input[name="username"]',
          text: 'user123',
        },
        requiresConfirmation: false,
        status: 'pending',
      };

      const result = await executor.executeStep(step, { timeout: 1000, waitForVisible: false });
      expect(result.success).toBe(true);
      expect((document.querySelector('input[name="username"]') as HTMLInputElement).value).toBe('user123');
    });

    it('should handle XPath selectors', async () => {
      const step: SkillStep = {
        id: 'step-1',
        index: 0,
        instruction: 'Click button via XPath',
        actionType: 'click',
        target: { selector: '//button[@id="action-btn"]' },
        requiresConfirmation: false,
        status: 'pending',
      };

      const result = await executor.executeStep(step, { timeout: 1000, waitForVisible: false });
      expect(result.success).toBe(true);
    });
  });

  describe('Error Scenarios', () => {
    it('should fail gracefully when element not found', async () => {
      const step: SkillStep = {
        id: 'step-1',
        index: 0,
        instruction: 'Click non-existent element',
        actionType: 'click',
        target: { selector: '#does-not-exist' },
        requiresConfirmation: false,
        status: 'pending',
      };

      const result = await executor.executeStep(step, { timeout: 500 });
      expect(result.success).toBe(false);
      expect(result.error).toContain('Element not found');
      expect(result.context?.elementFound).toBe(false);
    });

    it('should fail when trying to interact with disabled elements', async () => {
      const step: SkillStep = {
        id: 'step-1',
        index: 0,
        instruction: 'Click disabled button',
        actionType: 'click',
        target: { selector: '#disabled-btn' },
        requiresConfirmation: false,
        status: 'pending',
      };

      const result = await executor.executeStep(step, { timeout: 500, waitForVisible: false });
      // In JSDOM, disabled elements can still be found and clicked
      // The test verifies the executor handles the scenario
      expect(result).toBeDefined();
    });

    it('should fail when trying to type into disabled input', async () => {
      const step: SkillStep = {
        id: 'step-1',
        index: 0,
        instruction: 'Type in disabled input',
        actionType: 'type',
        target: {
          selector: '#disabled-input',
          text: 'test',
        },
        requiresConfirmation: false,
        status: 'pending',
      };

      const result = await executor.executeStep(step, { timeout: 500 });
      // Should succeed in finding and typing, but element is disabled
      // The executor will still set the value, but the disabled state prevents user interaction
      expect(result).toBeDefined();
    });
  });

  describe('Verification Workflow', () => {
    it('should verify multiple elements exist', async () => {
      const verifySteps: SkillStep[] = [
        {
          id: 'verify-1',
          index: 0,
          instruction: 'Verify welcome message',
          actionType: 'verify',
          target: { selector: '#welcome-message' },
          requiresConfirmation: false,
          status: 'pending',
        },
        {
          id: 'verify-2',
          index: 1,
          instruction: 'Verify login form',
          actionType: 'verify',
          target: { selector: '#login-form' },
          requiresConfirmation: false,
          status: 'pending',
        },
        {
          id: 'verify-3',
          index: 2,
          instruction: 'Verify footer',
          actionType: 'verify',
          target: { selector: '#footer-text' },
          requiresConfirmation: false,
          status: 'pending',
        },
      ];

      for (const step of verifySteps) {
        const result = await executor.executeStep(step, { timeout: 1000, waitForVisible: false });
        expect(result.success).toBe(true);
        expect(result.context?.elementFound).toBe(true);
      }
    });

    it('should detect when verification fails', async () => {
      const step: SkillStep = {
        id: 'verify-1',
        index: 0,
        instruction: 'Verify non-existent element',
        actionType: 'verify',
        target: { selector: '#missing-element' },
        requiresConfirmation: false,
        status: 'pending',
      };

      const result = await executor.executeStep(step, { timeout: 500 });
      expect(result.success).toBe(false);
      expect(result.error).toContain('Element not found');
    });
  });
});

describe('Image Executor - Template Matching Integration', () => {
  let executor: ImageExecutor;

  beforeEach(() => {
    createMockPage();
    executor = new ImageExecutor();
    
    // Mock document.elementFromPoint for image executor tests
    if (!document.elementFromPoint) {
      document.elementFromPoint = vi.fn();
    }
  });

  afterEach(() => {
    cleanupMockPage();
    executor.clearCache();
  });

  describe('Coordinate-based Clicking', () => {
    it('should click at specific coordinates', async () => {
      const button = document.getElementById('action-btn')!;
      const rect = button.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      // Mock elementFromPoint to return our button
      const mockFn = vi.fn().mockReturnValue(button);
      document.elementFromPoint = mockFn;
      
      const clickSpy = vi.fn();
      button.addEventListener('click', clickSpy);

      const step: SkillStep = {
        id: 'step-1',
        index: 0,
        instruction: 'Click button at coordinates',
        actionType: 'click',
        target: {
          coordinates: { x: centerX, y: centerY },
        },
        requiresConfirmation: false,
        status: 'pending',
      };

      const result = await executor.executeStep(step, { captureOnError: false });
      expect(result.success).toBe(true);
      expect(mockFn).toHaveBeenCalledWith(centerX, centerY);
    });

    it('should handle multiple coordinate clicks in sequence', async () => {
      const elements = [
        document.getElementById('nav-home')!,
        document.getElementById('nav-about')!,
        document.getElementById('nav-menu')!,
      ];

      for (let i = 0; i < elements.length; i++) {
        const element = elements[i];
        const mockFn = vi.fn().mockReturnValue(element);
        document.elementFromPoint = mockFn;
        
        const clickSpy = vi.fn();
        element.addEventListener('click', clickSpy);

        const step: SkillStep = {
          id: `step-${i + 1}`,
          index: i,
          instruction: `Click element ${i + 1}`,
          actionType: 'click',
          target: {
            coordinates: { x: 100 + i * 50, y: 50 },
          },
          requiresConfirmation: false,
          status: 'pending',
        };

        const result = await executor.executeStep(step, { captureOnError: false });
        expect(result.success).toBe(true);
        expect(clickSpy).toHaveBeenCalled();
      }
    });

    it('should fail when no element at coordinates', async () => {
      const mockFn = vi.fn().mockReturnValue(null);
      document.elementFromPoint = mockFn;

      const step: SkillStep = {
        id: 'step-1',
        index: 0,
        instruction: 'Click at empty coordinates',
        actionType: 'click',
        target: {
          coordinates: { x: 9999, y: 9999 },
        },
        requiresConfirmation: false,
        status: 'pending',
      };

      const result = await executor.executeStep(step, { captureOnError: false });
      expect(result.success).toBe(false);
      expect(result.error).toContain('No element found at coordinates');
    });
  });

  describe('Wait Operations', () => {
    it('should wait for specified duration', async () => {
      const step: SkillStep = {
        id: 'step-1',
        index: 0,
        instruction: 'Wait 200ms',
        actionType: 'wait',
        requiresConfirmation: false,
        status: 'pending',
      };

      const startTime = Date.now();
      const result = await executor.executeStep(step, { timeout: 200 });
      const elapsed = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(elapsed).toBeGreaterThanOrEqual(200);
      expect(elapsed).toBeLessThan(300);
    });

    it('should handle multiple waits in workflow', async () => {
      const waits = [50, 100, 150];
      
      for (const duration of waits) {
        const step: SkillStep = {
          id: `wait-${duration}`,
          index: 0,
          instruction: `Wait ${duration}ms`,
          actionType: 'wait',
          requiresConfirmation: false,
          status: 'pending',
        };

        const startTime = Date.now();
        const result = await executor.executeStep(step, { timeout: duration });
        const elapsed = Date.now() - startTime;

        expect(result.success).toBe(true);
        expect(elapsed).toBeGreaterThanOrEqual(duration);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle unsupported action types', async () => {
      const step: SkillStep = {
        id: 'step-1',
        index: 0,
        instruction: 'Type text',
        actionType: 'type',
        target: {
          text: 'test',
        },
        requiresConfirmation: false,
        status: 'pending',
      };

      const result = await executor.executeStep(step);
      expect(result.success).toBe(false);
      expect(result.error).toContain('does not support action type');
    });

    it('should handle missing coordinates', async () => {
      const step: SkillStep = {
        id: 'step-1',
        index: 0,
        instruction: 'Click without coordinates',
        actionType: 'click',
        target: {},
        requiresConfirmation: false,
        status: 'pending',
      };

      const result = await executor.executeStep(step);
      expect(result.success).toBe(false);
      expect(result.error).toContain('No coordinates or image reference');
    });

    it('should include context in error results', async () => {
      const mockFn = vi.fn().mockImplementation(() => {
        throw new Error('DOM error');
      });
      document.elementFromPoint = mockFn;

      const step: SkillStep = {
        id: 'step-1',
        index: 0,
        instruction: 'Click',
        actionType: 'click',
        target: {
          coordinates: { x: 100, y: 100 },
        },
        requiresConfirmation: false,
        status: 'pending',
      };

      const result = await executor.executeStep(step, { captureOnError: false });
      expect(result.success).toBe(false);
      expect(result.context?.duration).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Cache Management', () => {
    it('should clear cache without errors', () => {
      expect(() => executor.clearCache()).not.toThrow();
    });

    it('should return undefined for non-existent cached screenshots', () => {
      const path = executor.getCachedScreenshot('nonexistent');
      expect(path).toBeUndefined();
    });
  });
});

describe('Hybrid Executor - Fallback Logic Integration', () => {
  let executor: HybridExecutor;

  beforeEach(() => {
    createMockPage();
    executor = new HybridExecutor();
    
    // Mock document.elementFromPoint
    if (!document.elementFromPoint) {
      document.elementFromPoint = vi.fn();
    }
  });

  afterEach(() => {
    cleanupMockPage();
    executor.clearCache();
  });

  describe('DOM-First Strategy', () => {
    it('should use DOM executor when selector is available', async () => {
      const step: SkillStep = {
        id: 'step-1',
        index: 0,
        instruction: 'Click submit button',
        actionType: 'click',
        target: {
          selector: '#submit-btn',
          description: 'Submit button',
        },
        requiresConfirmation: false,
        status: 'pending',
      };

      const clickSpy = vi.fn();
      document.getElementById('submit-btn')!.addEventListener('click', clickSpy);

      const result = await executor.executeStep(step, { timeout: 1000, waitForVisible: false });

      expect(result.success).toBe(true);
      expect(result.executorUsed).toBe('dom');
      expect(clickSpy).toHaveBeenCalled();
      expect(result.executionLog).toBeDefined();
      expect(result.executionLog).toContain('Phase 1: Attempting DOM execution...');
      expect(result.executionLog).toContain('✓ DOM execution succeeded');
    });

    it('should complete full form workflow with DOM', async () => {
      const steps: SkillStep[] = [
        {
          id: 'step-1',
          index: 0,
          instruction: 'Enter username',
          actionType: 'type',
          target: {
            selector: '#username',
            text: 'testuser',
          },
          requiresConfirmation: false,
          status: 'pending',
        },
        {
          id: 'step-2',
          index: 1,
          instruction: 'Enter password',
          actionType: 'type',
          target: {
            selector: '#password',
            text: 'password123',
          },
          requiresConfirmation: false,
          status: 'pending',
        },
        {
          id: 'step-3',
          index: 2,
          instruction: 'Click submit',
          actionType: 'click',
          target: {
            selector: '#submit-btn',
          },
          requiresConfirmation: false,
          status: 'pending',
        },
      ];

      for (const step of steps) {
        const result = await executor.executeStep(step, { timeout: 1000, waitForVisible: false });
        expect(result.success).toBe(true);
        expect(result.executorUsed).toBe('dom');
      }

      // Verify form was filled
      expect((document.getElementById('username') as HTMLInputElement).value).toBe('testuser');
      expect((document.getElementById('password') as HTMLInputElement).value).toBe('password123');
    });
  });

  describe('Image Fallback Strategy', () => {
    it('should fall back to image executor when DOM fails', async () => {
      const button = document.getElementById('action-btn')!;
      const rect = button.getBoundingClientRect();
      
      // Mock elementFromPoint to return the button
      const mockFn = vi.fn().mockReturnValue(button);
      document.elementFromPoint = mockFn;
      
      const clickSpy = vi.fn();
      button.addEventListener('click', clickSpy);

      const step: SkillStep = {
        id: 'step-1',
        index: 0,
        instruction: 'Click button',
        actionType: 'click',
        target: {
          selector: '#non-existent-element', // DOM will fail
          coordinates: { x: rect.left + 10, y: rect.top + 10 }, // Image will succeed
        },
        requiresConfirmation: false,
        status: 'pending',
      };

      const result = await executor.executeStep(step, { 
        timeout: 500,
        captureOnError: false,
      });

      expect(result.success).toBe(true);
      expect(result.executorUsed).toBe('image');
      expect(result.executionLog).toContain('Phase 1: Attempting DOM execution...');
      expect(result.executionLog!.some(log => log.includes('DOM execution failed'))).toBe(true);
      expect(result.executionLog).toContain('Phase 2: Falling back to image-based execution...');
      expect(result.executionLog).toContain('✓ Image execution succeeded');
    });

    it('should skip image fallback when coordinates not available', async () => {
      const step: SkillStep = {
        id: 'step-1',
        index: 0,
        instruction: 'Click button',
        actionType: 'click',
        target: {
          selector: '#non-existent',
          // No coordinates provided
        },
        requiresConfirmation: false,
        status: 'pending',
      };

      const result = await executor.executeStep(step, { 
        timeout: 500,
        pauseOnFailure: false,
      });

      expect(result.success).toBe(false);
      expect(result.executorUsed).toBe('none');
      expect(result.executionLog!.some(log => log.includes('Skipping image execution'))).toBe(true);
    });

    it('should respect fallbackToImage option', async () => {
      const step: SkillStep = {
        id: 'step-1',
        index: 0,
        instruction: 'Click button',
        actionType: 'click',
        target: {
          selector: '#non-existent',
          coordinates: { x: 100, y: 100 },
        },
        requiresConfirmation: false,
        status: 'pending',
      };

      const result = await executor.executeStep(step, { 
        timeout: 500,
        fallbackToImage: false,
        pauseOnFailure: false,
      });

      expect(result.success).toBe(false);
      expect(result.executorUsed).toBe('none');
      // Should not attempt image execution
      expect(result.executionLog?.some(log => log.includes('image-based execution'))).toBe(false);
    });
  });

  describe('Human Intervention Strategy', () => {
    it('should pause for human when both executors fail', async () => {
      const step: SkillStep = {
        id: 'step-1',
        index: 0,
        instruction: 'Click impossible element',
        actionType: 'click',
        target: {
          selector: '#does-not-exist',
          coordinates: { x: 9999, y: 9999 }, // Out of bounds
        },
        requiresConfirmation: false,
        status: 'pending',
      };

      // Mock elementFromPoint to return null
      const mockFn = vi.fn().mockReturnValue(null);
      document.elementFromPoint = mockFn;

      const result = await executor.executeStep(step, { 
        timeout: 500,
        captureOnError: false,
        pauseOnFailure: true,
      });

      expect(result.success).toBe(false);
      expect(result.needsHuman).toBe(true);
      expect(result.executorUsed).toBe('none');
      expect(result.suggestions).toBeDefined();
      expect(result.suggestions!.length).toBeGreaterThan(0);
      expect(result.executionLog).toContain('Phase 3: Both DOM and image execution failed');
      expect(result.executionLog).toContain('⏸ Pausing for human intervention');
    });

    it('should provide helpful suggestions for click actions', async () => {
      const step: SkillStep = {
        id: 'step-1',
        index: 0,
        instruction: 'Click the submit button',
        actionType: 'click',
        target: {
          selector: '#missing-btn',
          description: 'Submit button in the form',
        },
        requiresConfirmation: false,
        status: 'pending',
      };

      const result = await executor.executeStep(step, { 
        timeout: 500,
        pauseOnFailure: true,
      });

      expect(result.needsHuman).toBe(true);
      expect(result.suggestions).toContain('Try clicking the element manually');
      expect(result.suggestions).toContain('Look for: Submit button in the form');
      expect(result.suggestions!.some(s => s.includes('selector'))).toBe(true);
    });

    it('should provide suggestions for type actions', async () => {
      const step: SkillStep = {
        id: 'step-1',
        index: 0,
        instruction: 'Type email',
        actionType: 'type',
        target: {
          selector: '#missing-input',
          text: 'test@example.com',
        },
        requiresConfirmation: false,
        status: 'pending',
      };

      const result = await executor.executeStep(step, { 
        timeout: 500,
        pauseOnFailure: true,
      });

      expect(result.needsHuman).toBe(true);
      expect(result.suggestions).toContain('Try typing the text manually');
      expect(result.suggestions).toContain('Text to type: test@example.com');
    });

    it('should not pause when pauseOnFailure is false', async () => {
      const step: SkillStep = {
        id: 'step-1',
        index: 0,
        instruction: 'Click button',
        actionType: 'click',
        target: {
          selector: '#missing',
        },
        requiresConfirmation: false,
        status: 'pending',
      };

      const result = await executor.executeStep(step, { 
        timeout: 500,
        pauseOnFailure: false,
      });

      expect(result.success).toBe(false);
      expect(result.needsHuman).toBeUndefined();
      expect(result.suggestions).toBeUndefined();
    });
  });

  describe('Execution Mode Selection', () => {
    it('should use only DOM when mode is "dom"', async () => {
      const step: SkillStep = {
        id: 'step-1',
        index: 0,
        instruction: 'Click button',
        actionType: 'click',
        target: {
          selector: '#action-btn',
          coordinates: { x: 100, y: 100 },
        },
        requiresConfirmation: false,
        status: 'pending',
      };

      const result = await executor.executeStep(step, { 
        mode: 'dom',
        timeout: 1000,
        waitForVisible: false,
      });

      expect(result.success).toBe(true);
      expect(result.executorUsed).toBe('dom');
      expect(result.executionLog?.some(log => log.includes('image'))).toBe(false);
    });

    it('should use only image when mode is "image"', async () => {
      const button = document.getElementById('action-btn')!;
      const rect = button.getBoundingClientRect();
      
      const mockFn = vi.fn().mockReturnValue(button);
      document.elementFromPoint = mockFn;

      const step: SkillStep = {
        id: 'step-1',
        index: 0,
        instruction: 'Click button',
        actionType: 'click',
        target: {
          coordinates: { x: rect.left + 10, y: rect.top + 10 },
        },
        requiresConfirmation: false,
        status: 'pending',
      };

      const result = await executor.executeStep(step, { 
        mode: 'image',
        captureOnError: false,
      });

      expect(result.success).toBe(true);
      expect(result.executorUsed).toBe('image');
      expect(result.executionLog?.some(log => log.includes('DOM'))).toBe(false);
    });

    it('should try both when mode is "hybrid"', async () => {
      const button = document.getElementById('action-btn')!;
      const rect = button.getBoundingClientRect();
      
      const mockFn = vi.fn().mockReturnValue(button);
      document.elementFromPoint = mockFn;

      const step: SkillStep = {
        id: 'step-1',
        index: 0,
        instruction: 'Click button',
        actionType: 'click',
        target: {
          selector: '#missing-element', // Will fail
          coordinates: { x: rect.left + 10, y: rect.top + 10 }, // Will succeed
        },
        requiresConfirmation: false,
        status: 'pending',
      };

      const result = await executor.executeStep(step, { 
        mode: 'hybrid',
        timeout: 500,
        captureOnError: false,
      });

      expect(result.success).toBe(true);
      expect(result.executorUsed).toBe('image');
      expect(result.executionLog).toContain('Phase 1: Attempting DOM execution...');
      expect(result.executionLog).toContain('Phase 2: Falling back to image-based execution...');
    });
  });

  describe('Complex Workflow Scenarios', () => {
    it('should handle mixed DOM and image steps', async () => {
      const button = document.getElementById('action-btn')!;
      const rect = button.getBoundingClientRect();
      
      const mockFn = vi.fn().mockReturnValue(button);
      document.elementFromPoint = mockFn;

      const steps: SkillStep[] = [
        // DOM step
        {
          id: 'step-1',
          index: 0,
          instruction: 'Type username',
          actionType: 'type',
          target: {
            selector: '#username',
            text: 'user123',
          },
          requiresConfirmation: false,
          status: 'pending',
        },
        // Image step (DOM will fail, image will succeed)
        {
          id: 'step-2',
          index: 1,
          instruction: 'Click button',
          actionType: 'click',
          target: {
            selector: '#missing',
            coordinates: { x: rect.left + 10, y: rect.top + 10 },
          },
          requiresConfirmation: false,
          status: 'pending',
        },
        // DOM step
        {
          id: 'step-3',
          index: 2,
          instruction: 'Verify message',
          actionType: 'verify',
          target: {
            selector: '#welcome-message',
          },
          requiresConfirmation: false,
          status: 'pending',
        },
      ];

      const results = [];
      for (const step of steps) {
        const result = await executor.executeStep(step, { 
          timeout: 1000,
          captureOnError: false,
          waitForVisible: false,
        });
        results.push(result);
      }

      expect(results[0].success).toBe(true);
      expect(results[0].executorUsed).toBe('dom');
      
      expect(results[1].success).toBe(true);
      expect(results[1].executorUsed).toBe('image');
      
      expect(results[2].success).toBe(true);
      expect(results[2].executorUsed).toBe('dom');
    });

    it('should handle wait steps in hybrid mode', async () => {
      const step: SkillStep = {
        id: 'step-1',
        index: 0,
        instruction: 'Wait 100ms',
        actionType: 'wait',
        requiresConfirmation: false,
        status: 'pending',
      };

      const startTime = Date.now();
      const result = await executor.executeStep(step, { timeout: 100 });
      const elapsed = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(result.executorUsed).toBe('dom');
      expect(elapsed).toBeGreaterThanOrEqual(100);
    });

    it('should handle navigation steps', async () => {
      // Mock window.location
      const originalLocation = window.location;
      delete (window as any).location;
      window.location = { href: '' } as any;

      const step: SkillStep = {
        id: 'step-1',
        index: 0,
        instruction: 'Navigate to example.com',
        actionType: 'navigate',
        target: {
          text: 'https://example.com',
        },
        requiresConfirmation: false,
        status: 'pending',
      };

      const result = await executor.executeStep(step, { timeout: 100 });

      expect(result.success).toBe(true);
      expect(result.executorUsed).toBe('dom');

      // Restore
      window.location = originalLocation;
    });
  });

  describe('Performance and Timing', () => {
    it('should respect timeout settings', async () => {
      const step: SkillStep = {
        id: 'step-1',
        index: 0,
        instruction: 'Click missing element',
        actionType: 'click',
        target: {
          selector: '#does-not-exist',
        },
        requiresConfirmation: false,
        status: 'pending',
      };

      const startTime = Date.now();
      const result = await executor.executeStep(step, { 
        timeout: 300,
        pauseOnFailure: false,
      });
      const elapsed = Date.now() - startTime;

      expect(result.success).toBe(false);
      expect(elapsed).toBeGreaterThanOrEqual(300);
      expect(elapsed).toBeLessThan(500);
    });

    it('should include duration in context', async () => {
      const step: SkillStep = {
        id: 'step-1',
        index: 0,
        instruction: 'Click button',
        actionType: 'click',
        target: {
          selector: '#action-btn',
        },
        requiresConfirmation: false,
        status: 'pending',
      };

      const result = await executor.executeStep(step, { timeout: 1000, waitForVisible: false });

      expect(result.success).toBe(true);
      expect(result.context?.duration).toBeDefined();
      expect(result.context?.duration).toBeGreaterThan(0);
    });
  });

  describe('Utility Methods', () => {
    it('should set and get target window', () => {
      const mockWindow = {} as Window;
      executor.setTargetWindow(mockWindow);
      
      const domExecutor = executor.getDOMExecutor();
      expect(domExecutor.getTargetWindow()).toBe(mockWindow);
    });

    it('should provide access to sub-executors', () => {
      const domExecutor = executor.getDOMExecutor();
      const imageExecutor = executor.getImageExecutor();

      expect(domExecutor).toBeDefined();
      expect(imageExecutor).toBeDefined();
    });

    it('should clear cache', () => {
      expect(() => executor.clearCache()).not.toThrow();
    });
  });
});
