/**
 * Integration Tests for Error Detection
 * 
 * Verifies the complete error detection flow from step execution
 * through error categorization to user feedback.
 * 
 * Requirements: FR-10.2
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createExecutionSession } from './skill-executor';
import type { ParsedSkill, SkillStep } from './skill-parser';
import type { HybridExecutionResult } from './hybrid-executor';

// Mock the hybrid executor
vi.mock('./hybrid-executor', () => ({
  HybridExecutor: vi.fn().mockImplementation(() => ({
    executeStep: vi.fn(),
    setTargetWindow: vi.fn(),
    clearCache: vi.fn(),
  })),
}));

describe('Error Detection Integration', () => {
  let mockSkill: ParsedSkill;
  let mockSteps: SkillStep[];

  beforeEach(() => {
    mockSteps = [
      {
        id: 'step-1',
        index: 0,
        instruction: 'Click the login button',
        actionType: 'click',
        target: { selector: '#login-btn' },
        requiresConfirmation: false,
        status: 'pending',
      },
      {
        id: 'step-2',
        index: 1,
        instruction: 'Type email address',
        actionType: 'type',
        target: { selector: '#email', text: '{email}' },
        requiresConfirmation: false,
        status: 'pending',
      },
    ];

    mockSkill = {
      name: 'Test Skill',
      description: 'A test skill',
      steps: mockSteps,
      parameters: [],
      prerequisites: [],
      verificationItems: [],
      frontmatter: {},
      markdown: '',
    };
  });

  describe('Error Detection and Categorization', () => {
    it('should detect and categorize timeout errors', async () => {
      const session = createExecutionSession(mockSkill, {
        captureScreenshots: false,
        pauseOnError: true,
        maxRetries: 0,
      });

      const errorListener = vi.fn();
      session.on('stepFailed', errorListener);

      // Mock timeout error
      const mockExecutor = (session as any).executor;
      mockExecutor.executeStep.mockResolvedValue({
        success: false,
        error: 'Step execution timed out after 30000ms',
      } as HybridExecutionResult);

      await session.start();

      expect(errorListener).toHaveBeenCalled();
      const eventData = errorListener.mock.calls[0][0];
      
      expect(eventData.categorizedError).toBeDefined();
      expect(eventData.categorizedError.category).toBe('timeout');
      expect(eventData.categorizedError.severity).toBe('medium');
      expect(eventData.categorizedError.shouldPause).toBe(false);
      expect(eventData.categorizedError.canRetry).toBe(true);
    });

    it('should detect and categorize not found errors', async () => {
      const session = createExecutionSession(mockSkill, {
        captureScreenshots: false,
        pauseOnError: true,
        maxRetries: 0,
      });

      const errorListener = vi.fn();
      session.on('stepFailed', errorListener);

      // Mock not found error
      const mockExecutor = (session as any).executor;
      mockExecutor.executeStep.mockResolvedValue({
        success: false,
        error: 'Element not found: #login-btn',
      } as HybridExecutionResult);

      await session.start();

      expect(errorListener).toHaveBeenCalled();
      const eventData = errorListener.mock.calls[0][0];
      
      expect(eventData.categorizedError.category).toBe('not_found');
      expect(eventData.categorizedError.severity).toBe('medium');
      expect(eventData.categorizedError.suggestions.length).toBeGreaterThan(0);
    });
  });

  describe('Error Screenshots', () => {
    it('should capture error screenshots when enabled', async () => {
      const session = createExecutionSession(mockSkill, {
        captureScreenshots: true,
        pauseOnError: true,
        maxRetries: 0,
      });

      // Mock error
      const mockExecutor = (session as any).executor;
      mockExecutor.executeStep.mockResolvedValue({
        success: false,
        error: 'Element not found',
      } as HybridExecutionResult);

      await session.start();

      const screenshots = session.getScreenshots();
      const errorScreenshots = screenshots.filter(s => s.timing === 'error');
      
      expect(errorScreenshots.length).toBeGreaterThan(0);
      expect(errorScreenshots[0].stepId).toBe('step-1');
    });
  });

  describe('Pause on Error', () => {
    it('should pause execution on error when enabled', async () => {
      const session = createExecutionSession(mockSkill, {
        captureScreenshots: false,
        pauseOnError: true,
        maxRetries: 0,
      });

      const pauseListener = vi.fn();
      session.on('pauseForError', pauseListener);

      // Mock error
      const mockExecutor = (session as any).executor;
      mockExecutor.executeStep.mockResolvedValue({
        success: false,
        error: 'Element not found',
      } as HybridExecutionResult);

      await session.start();

      expect(session.getState()).toBe('paused');
      expect(pauseListener).toHaveBeenCalled();
      
      const pauseData = pauseListener.mock.calls[0][0];
      expect(pauseData.step.id).toBe('step-1');
    });
  });

  describe('Recovery Suggestions', () => {
    it('should provide retry suggestions for timeout errors', async () => {
      const session = createExecutionSession(mockSkill, {
        captureScreenshots: false,
        pauseOnError: true,
        maxRetries: 0,
      });

      const errorListener = vi.fn();
      session.on('stepFailed', errorListener);

      // Mock timeout error
      const mockExecutor = (session as any).executor;
      mockExecutor.executeStep.mockResolvedValue({
        success: false,
        error: 'Timed out after 30s',
      } as HybridExecutionResult);

      await session.start();

      const eventData = errorListener.mock.calls[0][0];
      const suggestions = eventData.categorizedError.suggestions;
      
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some((s: any) => s.action === 'retry')).toBe(true);
      expect(suggestions.some((s: any) => s.text.includes('timeout'))).toBe(true);
    });
  });
});
