/**
 * Tests for Context Optimizer
 * 
 * Requirements: FR-6.19, FR-6.20
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  optimizeContext,
  DEFAULT_OPTIMIZATION_CONFIG,
  type OptimizedContext,
  type OptimizationConfig,
  toLLMContext,
} from './context-optimizer';
import type { ProcessedSession, ProcessedStep } from '../types/processing';

describe('Context Optimizer', () => {
  let mockSession: ProcessedSession;

  beforeEach(() => {
    // Create a mock processed session with multiple steps
    mockSession = {
      sessionId: 'test-session-123',
      duration: 120000, // 2 minutes
      steps: [
        createMockStep(1, 0, 10000, 'Click the login button', {
          clicks: 1,
          drawings: 0,
          selectedElements: 0,
          hasTranscript: true,
          hasOcr: true,
          windowTitle: 'Login Page - Chrome',
          applicationName: 'chrome.exe',
        }),
        createMockStep(2, 10000, 25000, 'Enter your email address', {
          clicks: 1,
          drawings: 0,
          selectedElements: 1,
          hasTranscript: true,
          hasOcr: true,
          windowTitle: 'Login Page - Chrome',
          applicationName: 'chrome.exe',
        }),
        createMockStep(3, 25000, 40000, 'Enter your password', {
          clicks: 1,
          drawings: 0,
          selectedElements: 1,
          hasTranscript: true,
          hasOcr: true,
          windowTitle: 'Login Page - Chrome',
          applicationName: 'chrome.exe',
        }),
        createMockStep(4, 40000, 55000, 'Click submit', {
          clicks: 1,
          drawings: 1,
          selectedElements: 0,
          hasTranscript: true,
          hasOcr: true,
          windowTitle: 'Login Page - Chrome',
          applicationName: 'chrome.exe',
        }),
        createMockStep(5, 55000, 70000, 'Wait for dashboard to load', {
          clicks: 0,
          drawings: 0,
          selectedElements: 0,
          hasTranscript: true,
          hasOcr: true,
          windowTitle: 'Dashboard - Chrome',
          applicationName: 'chrome.exe',
        }),
        // Add more steps to test key step selection
        ...Array.from({ length: 10 }, (_, i) =>
          createMockStep(6 + i, 70000 + i * 5000, 75000 + i * 5000, `Step ${6 + i}`, {
            clicks: 0,
            drawings: 0,
            selectedElements: 0,
            hasTranscript: false,
            hasOcr: false,
          })
        ),
      ],
      fullTranscript: 'Click the login button. Enter your email address. Enter your password. Click submit. Wait for dashboard to load.',
      allAnnotations: {
        clicks: [],
        drawings: [],
        selectedElements: [],
        keyboardInputs: [],
      },
      timeline: [],
      allVariables: [
        {
          name: 'email',
          description: 'User email address',
          timestamp: 10000,
          transcriptSegment: 'Enter your email address like "user@example.com"',
        },
        {
          name: 'password',
          description: 'User password',
          timestamp: 25000,
          transcriptSegment: 'Enter your password',
        },
      ],
      allConditionals: [
        {
          condition: 'If login fails',
          thenAction: 'Check credentials and try again',
          timestamp: 55000,
          transcriptSegment: 'If login fails, check credentials and try again',
        },
      ],
      startTime: Date.now(),
      endTime: Date.now() + 120000,
    };

    // Populate allAnnotations from steps
    for (const step of mockSession.steps) {
      mockSession.allAnnotations.clicks.push(...step.annotations.clicks);
      mockSession.allAnnotations.drawings.push(...step.annotations.drawings);
      mockSession.allAnnotations.selectedElements.push(...step.annotations.selectedElements);
      mockSession.allAnnotations.keyboardInputs.push(...step.annotations.keyboardInputs);
    }
  });

  describe('optimizeContext', () => {
    it('should create optimized context with default config', async () => {
      const optimized = await optimizeContext(mockSession);

      expect(optimized).toBeDefined();
      expect(optimized.taskGoal).toBe('Click the login button');
      expect(optimized.keySteps).toBeDefined();
      expect(optimized.fullNarration).toBe(mockSession.fullTranscript);
      expect(optimized.variables).toHaveLength(2);
      expect(optimized.conditionals).toHaveLength(1);
      expect(optimized.summary).toBeDefined();
      expect(optimized.references).toBeDefined();
    });

    it('should limit key steps to maxKeySteps (FR-6.19)', async () => {
      const config: OptimizationConfig = {
        ...DEFAULT_OPTIMIZATION_CONFIG,
        maxKeySteps: 5,
      };

      const optimized = await optimizeContext(mockSession, config);

      expect(optimized.keySteps.length).toBeLessThanOrEqual(5);
    });

    it('should select steps with highest importance scores', async () => {
      const config: OptimizationConfig = {
        ...DEFAULT_OPTIMIZATION_CONFIG,
        maxKeySteps: 3,
      };

      const optimized = await optimizeContext(mockSession, config);

      // Should select steps with annotations and transcript
      expect(optimized.keySteps.length).toBe(3);
      
      // All selected steps should have transcript or annotations
      for (const step of optimized.keySteps) {
        const hasContent = 
          step.description.length > 0 ||
          step.actions.clicks > 0 ||
          step.actions.annotations > 0;
        expect(hasContent).toBe(true);
      }
    });

    it('should maintain chronological order of selected steps', async () => {
      const config: OptimizationConfig = {
        ...DEFAULT_OPTIMIZATION_CONFIG,
        maxKeySteps: 5,
      };

      const optimized = await optimizeContext(mockSession, config);

      // Check that step numbers are in ascending order
      for (let i = 1; i < optimized.keySteps.length; i++) {
        expect(optimized.keySteps[i].number).toBeGreaterThan(
          optimized.keySteps[i - 1].number
        );
      }
    });

    it('should compress variables with inferred types', async () => {
      const optimized = await optimizeContext(mockSession);

      expect(optimized.variables).toHaveLength(2);
      
      const emailVar = optimized.variables.find(v => v.name === 'email');
      expect(emailVar).toBeDefined();
      expect(emailVar?.type).toBe('email');
      expect(emailVar?.exampleValue).toBe('user@example.com');
      
      const passwordVar = optimized.variables.find(v => v.name === 'password');
      expect(passwordVar).toBeDefined();
      expect(passwordVar?.type).toBe('password');
    });

    it('should compress conditionals', async () => {
      const optimized = await optimizeContext(mockSession);

      expect(optimized.conditionals).toHaveLength(1);
      expect(optimized.conditionals[0].condition).toBe('If login fails');
      expect(optimized.conditionals[0].thenAction).toBe('Check credentials and try again');
    });

    it('should calculate summary statistics', async () => {
      const optimized = await optimizeContext(mockSession);

      expect(optimized.summary.totalSteps).toBe(mockSession.steps.length);
      expect(optimized.summary.durationSeconds).toBe(120);
      expect(optimized.summary.mainApplication).toBe('chrome.exe');
    });

    it('should truncate OCR text to maxOcrLength', async () => {
      const longOcrText = 'A'.repeat(1000);
      mockSession.steps[0].ocrText = longOcrText;

      const config: OptimizationConfig = {
        ...DEFAULT_OPTIMIZATION_CONFIG,
        maxOcrLength: 100,
      };

      const optimized = await optimizeContext(mockSession, config);

      const firstStep = optimized.keySteps[0];
      if (firstStep.ocrText) {
        expect(firstStep.ocrText.length).toBeLessThanOrEqual(100);
        expect(firstStep.ocrText).toContain('...');
      }
    });

    it('should exclude screenshots when includeScreenshots is false', async () => {
      const config: OptimizationConfig = {
        ...DEFAULT_OPTIMIZATION_CONFIG,
        includeScreenshots: false,
      };

      const optimized = await optimizeContext(mockSession, config);

      for (const step of optimized.keySteps) {
        expect(step.screenshot).toBeUndefined();
      }
    });

    it('should exclude OCR when includeOcr is false', async () => {
      const config: OptimizationConfig = {
        ...DEFAULT_OPTIMIZATION_CONFIG,
        includeOcr: false,
      };

      const optimized = await optimizeContext(mockSession, config);

      for (const step of optimized.keySteps) {
        expect(step.ocrText).toBeUndefined();
      }
    });

    it('should handle session with no transcript', async () => {
      mockSession.fullTranscript = '';
      mockSession.steps.forEach(step => {
        step.transcript = '';
      });

      const optimized = await optimizeContext(mockSession);

      // Should infer from application and actions (has clicks)
      expect(optimized.taskGoal).toBe('Navigate through chrome.exe');
      expect(optimized.fullNarration).toBe('');
    });

    it('should handle session with no variables', async () => {
      mockSession.allVariables = [];

      const optimized = await optimizeContext(mockSession);

      expect(optimized.variables).toHaveLength(0);
    });

    it('should handle session with no conditionals', async () => {
      mockSession.allConditionals = [];

      const optimized = await optimizeContext(mockSession);

      expect(optimized.conditionals).toHaveLength(0);
    });
  });

  describe('Hierarchical Summarization (FR-6.20)', () => {
    it('should create Level 1: High-level goal', async () => {
      const optimized = await optimizeContext(mockSession);

      // Level 1: Task goal should be concise
      expect(optimized.taskGoal).toBeDefined();
      expect(optimized.taskGoal.length).toBeGreaterThan(0);
      expect(optimized.taskGoal.length).toBeLessThan(200);
    });

    it('should create Level 2: Step summaries', async () => {
      const optimized = await optimizeContext(mockSession);

      // Level 2: Each step should have a summary
      for (const step of optimized.keySteps) {
        expect(step.description).toBeDefined();
        expect(step.actions).toBeDefined();
        expect(step.notes).toBeDefined();
      }
    });

    it('should create Level 3: Compressed logs (when available)', async () => {
      const optimized = await optimizeContext(mockSession);

      // Level 3: Logs should be compressed (or undefined if not available)
      // Currently returns undefined as console/network capture not implemented
      expect(optimized.logs).toBeUndefined();
    });

    it('should limit notes per step to avoid bloat', async () => {
      // Add many annotations to a step
      const step = mockSession.steps[0];
      for (let i = 0; i < 20; i++) {
        step.annotations.drawings.push({
          id: `drawing-${i}`,
          type: 'arrow',
          startPoint: { x: 100, y: 100 },
          endPoint: { x: 200, y: 200 },
          color: '#ff0000',
          strokeWidth: 2,
          timestamp: Date.now(),
          isPinned: true,
        });
      }

      const optimized = await optimizeContext(mockSession);

      // Should limit notes to 5 per step
      const firstStep = optimized.keySteps[0];
      expect(firstStep.notes.length).toBeLessThanOrEqual(5);
    });
  });

  describe('toLLMContext', () => {
    it('should convert optimized context to LLM context format', async () => {
      const optimized = await optimizeContext(mockSession);
      const llmContext = toLLMContext(optimized);

      expect(llmContext.taskDescription).toBe(optimized.taskGoal);
      expect(llmContext.steps.length).toBe(optimized.keySteps.length);
      expect(llmContext.fullNarration).toBe(optimized.fullNarration);
      expect(llmContext.variables.length).toBe(optimized.variables.length);
      expect(llmContext.conditionals.length).toBe(optimized.conditionals.length);
      expect(llmContext.summary).toEqual(optimized.summary);
      expect(llmContext.references).toEqual(optimized.references);
    });

    it('should map steps correctly', async () => {
      const optimized = await optimizeContext(mockSession);
      const llmContext = toLLMContext(optimized);

      for (let i = 0; i < llmContext.steps.length; i++) {
        const llmStep = llmContext.steps[i];
        const optimizedStep = optimized.keySteps[i];

        expect(llmStep.number).toBe(optimizedStep.number);
        expect(llmStep.description).toBe(optimizedStep.description);
        expect(llmStep.screenshot).toBe(optimizedStep.screenshot);
        expect(llmStep.notes).toEqual(optimizedStep.notes);
        expect(llmStep.timeRange).toEqual(optimizedStep.timeRange);
        expect(llmStep.actions).toEqual(optimizedStep.actions);
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty session', async () => {
      const emptySession: ProcessedSession = {
        sessionId: 'empty',
        duration: 0,
        steps: [],
        fullTranscript: '',
        allAnnotations: {
          clicks: [],
          drawings: [],
          selectedElements: [],
          keyboardInputs: [],
        },
        timeline: [],
        allVariables: [],
        allConditionals: [],
        startTime: Date.now(),
        endTime: Date.now(),
      };

      const optimized = await optimizeContext(emptySession);

      expect(optimized.keySteps).toHaveLength(0);
      expect(optimized.variables).toHaveLength(0);
      expect(optimized.conditionals).toHaveLength(0);
      expect(optimized.summary.totalSteps).toBe(0);
    });

    it('should handle very long text truncation', async () => {
      const veryLongText = 'A'.repeat(10000);
      mockSession.steps[0].transcript = veryLongText;

      const optimized = await optimizeContext(mockSession);

      // Description should be the full transcript (not truncated at step level)
      // Truncation happens at note level
      expect(optimized.keySteps[0].description).toBe(veryLongText);
    });

    it('should handle special characters in text', async () => {
      mockSession.fullTranscript = 'Test with "quotes" and \'apostrophes\' and <tags>';
      mockSession.steps[0].transcript = 'Test with "quotes"';

      const optimized = await optimizeContext(mockSession);

      expect(optimized.fullNarration).toContain('"quotes"');
      expect(optimized.fullNarration).toContain("'apostrophes'");
      expect(optimized.fullNarration).toContain('<tags>');
    });
  });
});

/**
 * Helper function to create a mock processed step
 */
function createMockStep(
  stepNumber: number,
  startTime: number,
  endTime: number,
  transcript: string,
  options: {
    clicks?: number;
    drawings?: number;
    selectedElements?: number;
    hasTranscript?: boolean;
    hasOcr?: boolean;
    windowTitle?: string;
    applicationName?: string;
  } = {}
): ProcessedStep {
  const clicks = options.clicks ?? 0;
  const drawings = options.drawings ?? 0;
  const selectedElements = options.selectedElements ?? 0;

  return {
    stepNumber,
    timeRange: { start: startTime, end: endTime },
    screenshotPath: `/mock/screenshot-${stepNumber}.png`,
    transcript: options.hasTranscript ? transcript : '',
    annotations: {
      clicks: Array.from({ length: clicks }, (_, i) => ({
        id: `click-${stepNumber}-${i}`,
        x: 100 + i * 10,
        y: 100 + i * 10,
        timestamp: startTime + i * 100,
      })),
      drawings: Array.from({ length: drawings }, (_, i) => ({
        id: `drawing-${stepNumber}-${i}`,
        type: 'arrow' as const,
        startPoint: { x: 100, y: 100 },
        endPoint: { x: 200, y: 200 },
        color: '#ff0000',
        strokeWidth: 2,
        timestamp: startTime + i * 100,
        isPinned: true,
      })),
      selectedElements: Array.from({ length: selectedElements }, (_, i) => ({
        tagName: 'input',
        id: `input-${i}`,
        className: 'form-control',
        textContent: 'Email input field',
        selector: `#input-${i}`,
        boundingBox: { x: 100, y: 100, width: 200, height: 40 },
        timestamp: startTime + i * 100,
      })),
      keyboardInputs: [],
    },
    windowTitle: options.windowTitle,
    applicationName: options.applicationName,
    events: [],
    variables: [],
    conditionals: [],
    ocrText: options.hasOcr ? `OCR text for step ${stepNumber}` : undefined,
  };
}
