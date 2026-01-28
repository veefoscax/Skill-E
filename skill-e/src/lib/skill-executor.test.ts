/**
 * Tests for Skill Executor - Execution Session Manager
 * 
 * Requirements: FR-10.1, FR-10.9
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ExecutionSession, createExecutionSession } from './skill-executor';
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

describe('ExecutionSession', () => {
  let mockSkill: ParsedSkill;
  let mockSteps: SkillStep[];

  beforeEach(() => {
    // Create mock steps
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
      {
        id: 'step-3',
        index: 2,
        instruction: 'PAUSE - Confirm before submitting',
        actionType: 'confirm',
        requiresConfirmation: true,
        status: 'pending',
      },
    ];

    // Create mock skill
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

  describe('Session Creation', () => {
    it('should create a session with default config', () => {
      const session = createExecutionSession(mockSkill);

      expect(session).toBeInstanceOf(ExecutionSession);
      expect(session.sessionId).toMatch(/^session-/);
      expect(session.skill).toBe(mockSkill);
      expect(session.config.mode).toBe('hybrid');
      expect(session.config.captureScreenshots).toBe(true);
      expect(session.config.pauseOnError).toBe(true);
    });

    it('should create a session with custom config', () => {
      const session = createExecutionSession(mockSkill, {
        mode: 'dom',
        captureScreenshots: false,
        pauseOnError: false,
        stepTimeout: 10000,
      });

      expect(session.config.mode).toBe('dom');
      expect(session.config.captureScreenshots).toBe(false);
      expect(session.config.pauseOnError).toBe(false);
      expect(session.config.stepTimeout).toBe(10000);
    });

    it('should initialize with idle state', () => {
      const session = createExecutionSession(mockSkill);

      expect(session.getState()).toBe('idle');
      expect(session.getCurrentStepIndex()).toBe(0);
      expect(session.getSteps()).toHaveLength(3);
    });
  });

  describe('Session State Management', () => {
    it('should track current step', () => {
      const session = createExecutionSession(mockSkill);

      expect(session.getCurrentStepIndex()).toBe(0);
      expect(session.getCurrentStep()?.id).toBe('step-1');
    });

    it('should get step by ID', () => {
      const session = createExecutionSession(mockSkill);

      const step = session.getStep('step-2');
      expect(step?.instruction).toBe('Type email address');
    });

    it('should return undefined for non-existent step', () => {
      const session = createExecutionSession(mockSkill);

      const step = session.getStep('non-existent');
      expect(step).toBeUndefined();
    });

    it('should get all steps', () => {
      const session = createExecutionSession(mockSkill);

      const steps = session.getSteps();
      expect(steps).toHaveLength(3);
      expect(steps[0].id).toBe('step-1');
    });
  });

  describe('Timeline Management', () => {
    it('should initialize with empty timeline', () => {
      const session = createExecutionSession(mockSkill);

      const timeline = session.getTimeline();
      expect(timeline).toHaveLength(0);
    });

    it('should add timeline entries during execution', async () => {
      const session = createExecutionSession(mockSkill, {
        captureScreenshots: false,
      });

      // Mock successful execution
      const mockExecutor = (session as any).executor;
      mockExecutor.executeStep.mockResolvedValue({
        success: true,
        executorUsed: 'dom',
      } as HybridExecutionResult);

      await session.start();

      const timeline = session.getTimeline();
      expect(timeline.length).toBeGreaterThan(0);
      
      // Should have start entry
      const startEntry = timeline.find(e => e.type === 'resume' && e.message.includes('started'));
      expect(startEntry).toBeDefined();
    });
  });

  describe('Screenshot Management', () => {
    it('should initialize with empty screenshots', () => {
      const session = createExecutionSession(mockSkill);

      const screenshots = session.getScreenshots();
      expect(screenshots).toHaveLength(0);
    });

    it('should capture screenshots when enabled', async () => {
      const session = createExecutionSession(mockSkill, {
        captureScreenshots: true,
      });

      // Mock successful execution
      const mockExecutor = (session as any).executor;
      mockExecutor.executeStep.mockResolvedValue({
        success: true,
        executorUsed: 'dom',
      } as HybridExecutionResult);

      await session.start();

      const screenshots = session.getScreenshots();
      // Should have before and after screenshots for each step
      expect(screenshots.length).toBeGreaterThan(0);
    });

    it('should not capture screenshots when disabled', async () => {
      const session = createExecutionSession(mockSkill, {
        captureScreenshots: false,
      });

      // Mock successful execution
      const mockExecutor = (session as any).executor;
      mockExecutor.executeStep.mockResolvedValue({
        success: true,
        executorUsed: 'dom',
      } as HybridExecutionResult);

      await session.start();

      const screenshots = session.getScreenshots();
      expect(screenshots).toHaveLength(0);
    });

    it('should get screenshots for specific step', async () => {
      const session = createExecutionSession(mockSkill, {
        captureScreenshots: true,
      });

      // Mock successful execution
      const mockExecutor = (session as any).executor;
      mockExecutor.executeStep.mockResolvedValue({
        success: true,
        executorUsed: 'dom',
      } as HybridExecutionResult);

      await session.start();

      const stepScreenshots = session.getStepScreenshots('step-1');
      expect(stepScreenshots.every(s => s.stepId === 'step-1')).toBe(true);
    });
  });

  describe('Statistics', () => {
    it('should calculate stats for idle session', () => {
      const session = createExecutionSession(mockSkill);

      const stats = session.getStats();
      expect(stats.totalSteps).toBe(3);
      expect(stats.completedSteps).toBe(0);
      expect(stats.failedSteps).toBe(0);
      expect(stats.skippedSteps).toBe(0);
      expect(stats.successRate).toBe(0);
    });

    it('should calculate stats after successful execution', async () => {
      const session = createExecutionSession(mockSkill, {
        captureScreenshots: false,
        pauseOnConfirmation: false,
      });

      // Mock successful execution
      const mockExecutor = (session as any).executor;
      mockExecutor.executeStep.mockResolvedValue({
        success: true,
        executorUsed: 'dom',
      } as HybridExecutionResult);

      await session.start();

      const stats = session.getStats();
      expect(stats.totalSteps).toBe(3);
      expect(stats.completedSteps).toBe(3);
      expect(stats.failedSteps).toBe(0);
      expect(stats.successRate).toBe(1);
      expect(stats.totalTime).toBeGreaterThanOrEqual(0);
    });

    it('should calculate stats with failures', async () => {
      // Create a skill with only 2 steps to avoid confirmation pause
      const simpleSkill: ParsedSkill = {
        ...mockSkill,
        steps: [mockSteps[0], mockSteps[1]], // Only first 2 steps
      };

      const session = createExecutionSession(simpleSkill, {
        captureScreenshots: false,
        pauseOnError: false,
        continueOnFailure: true,
        maxRetries: 0,
      });

      // Mock mixed results
      const mockExecutor = (session as any).executor;
      mockExecutor.executeStep
        .mockResolvedValueOnce({
          success: true,
          executorUsed: 'dom',
        } as HybridExecutionResult)
        .mockResolvedValueOnce({
          success: false,
          error: 'Element not found',
        } as HybridExecutionResult);

      await session.start();

      const stats = session.getStats();
      expect(stats.completedSteps).toBe(1);
      expect(stats.failedSteps).toBe(1);
      expect(stats.successRate).toBe(0.5);
    });
  });

  describe('Session Summary', () => {
    it('should provide session summary', () => {
      const session = createExecutionSession(mockSkill);

      const summary = session.getSummary();
      expect(summary.sessionId).toBe(session.sessionId);
      expect(summary.skillName).toBe('Test Skill');
      expect(summary.state).toBe('idle');
      expect(summary.currentStepIndex).toBe(0);
      expect(summary.stats).toBeDefined();
    });

    it('should update summary after execution', async () => {
      const session = createExecutionSession(mockSkill, {
        captureScreenshots: false,
        pauseOnConfirmation: false,
      });

      // Mock successful execution
      const mockExecutor = (session as any).executor;
      mockExecutor.executeStep.mockResolvedValue({
        success: true,
        executorUsed: 'dom',
      } as HybridExecutionResult);

      await session.start();

      const summary = session.getSummary();
      expect(summary.state).toBe('completed');
      expect(summary.startTime).toBeDefined();
      expect(summary.endTime).toBeDefined();
    });
  });

  describe('Event Listeners', () => {
    it('should register and emit events', async () => {
      const session = createExecutionSession(mockSkill, {
        captureScreenshots: false,
        pauseOnConfirmation: false,
      });

      const startListener = vi.fn();
      const completeListener = vi.fn();

      session.on('start', startListener);
      session.on('complete', completeListener);

      // Mock successful execution
      const mockExecutor = (session as any).executor;
      mockExecutor.executeStep.mockResolvedValue({
        success: true,
        executorUsed: 'dom',
      } as HybridExecutionResult);

      await session.start();

      expect(startListener).toHaveBeenCalledWith({ sessionId: session.sessionId });
      expect(completeListener).toHaveBeenCalled();
    });

    it('should unregister event listeners', () => {
      const session = createExecutionSession(mockSkill);

      const listener = vi.fn();
      session.on('start', listener);
      session.off('start', listener);

      // Emit event manually
      (session as any).emit('start', {});

      expect(listener).not.toHaveBeenCalled();
    });

    it('should emit step events', async () => {
      // Use a skill without confirmation steps for this test
      const simpleSkill: ParsedSkill = {
        ...mockSkill,
        steps: [mockSteps[0], mockSteps[1]], // Only first 2 steps (no confirmation)
      };

      const session = createExecutionSession(simpleSkill, {
        captureScreenshots: false,
        pauseOnConfirmation: false,
      });

      const stepStartListener = vi.fn();
      const stepCompleteListener = vi.fn();

      session.on('stepStart', stepStartListener);
      session.on('stepComplete', stepCompleteListener);

      // Mock successful execution
      const mockExecutor = (session as any).executor;
      mockExecutor.executeStep.mockResolvedValue({
        success: true,
        executorUsed: 'dom',
      } as HybridExecutionResult);

      await session.start();

      expect(stepStartListener).toHaveBeenCalledTimes(2);
      expect(stepCompleteListener).toHaveBeenCalledTimes(2);
    });
  });

  describe('Pause and Resume', () => {
    it('should pause execution', async () => {
      const session = createExecutionSession(mockSkill, {
        captureScreenshots: false,
      });

      // Mock slow execution
      const mockExecutor = (session as any).executor;
      mockExecutor.executeStep.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
      );

      const startPromise = session.start();
      
      // Pause after a short delay
      setTimeout(() => session.pause(), 10);

      await startPromise;

      expect(session.getState()).toBe('paused');
    });

    it('should resume execution', async () => {
      // Use manual pause instead of confirmation pause
      const simpleSkill: ParsedSkill = {
        ...mockSkill,
        steps: [mockSteps[0], mockSteps[1]], // No confirmation step
      };

      const session = createExecutionSession(simpleSkill, {
        captureScreenshots: false,
        pauseOnConfirmation: false,
      });

      // Mock successful execution with delay
      const mockExecutor = (session as any).executor;
      mockExecutor.executeStep.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve({ success: true, executorUsed: 'dom' }), 50))
      );

      // Start execution
      const startPromise = session.start();
      
      // Pause after first step starts
      await new Promise(resolve => setTimeout(resolve, 25));
      session.pause();
      
      await startPromise;
      expect(session.getState()).toBe('paused');

      // Resume and complete
      const resumePromise = session.resume();
      await resumePromise;

      expect(session.getState()).toBe('completed');
    });

    it('should throw error when resuming non-paused session', async () => {
      const session = createExecutionSession(mockSkill);

      await expect(session.resume()).rejects.toThrow('Session is not paused');
    });
  });

  describe('Cancel', () => {
    it('should cancel execution', async () => {
      const session = createExecutionSession(mockSkill, {
        captureScreenshots: false,
      });

      // Mock slow execution
      const mockExecutor = (session as any).executor;
      mockExecutor.executeStep.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
      );

      const startPromise = session.start();
      
      // Cancel after a short delay
      setTimeout(() => session.cancel(), 10);

      await startPromise;

      expect(session.getState()).toBe('cancelled');
    });

    it('should emit cancel event', async () => {
      const session = createExecutionSession(mockSkill, {
        captureScreenshots: false,
      });

      const cancelListener = vi.fn();
      session.on('cancel', cancelListener);

      // Mock slow execution
      const mockExecutor = (session as any).executor;
      mockExecutor.executeStep.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
      );

      const startPromise = session.start();
      setTimeout(() => session.cancel(), 10);

      await startPromise;

      expect(cancelListener).toHaveBeenCalled();
    });
  });

  describe('Skip Step', () => {
    it('should skip current step when paused', async () => {
      const session = createExecutionSession(mockSkill, {
        captureScreenshots: false,
        pauseOnConfirmation: true,
      });

      // Mock successful execution
      const mockExecutor = (session as any).executor;
      mockExecutor.executeStep.mockResolvedValue({
        success: true,
        executorUsed: 'dom',
      } as HybridExecutionResult);

      // Start execution (will pause at confirmation step)
      await session.start();

      expect(session.getState()).toBe('paused');
      expect(session.getPausedStep()?.id).toBe('step-3');

      // Skip the confirmation step
      session.skipCurrentStep();

      const steps = session.getSteps();
      const skippedStep = steps.find(s => s.id === 'step-3');
      expect(skippedStep?.status).toBe('skipped');
    });

    it('should throw error when skipping while not paused', () => {
      const session = createExecutionSession(mockSkill);

      expect(() => session.skipCurrentStep()).toThrow('Can only skip steps when paused');
    });
  });

  describe('Retry Step', () => {
    it('should retry current step when paused', async () => {
      // Use a simple skill with just one step
      const simpleSkill: ParsedSkill = {
        ...mockSkill,
        steps: [mockSteps[0]], // Only first step
      };

      const session = createExecutionSession(simpleSkill, {
        captureScreenshots: false,
        pauseOnError: true,
        maxRetries: 0,
      });

      // Mock failed then successful execution
      const mockExecutor = (session as any).executor;
      mockExecutor.executeStep
        .mockResolvedValueOnce({
          success: false,
          error: 'Element not found',
        } as HybridExecutionResult)
        .mockResolvedValue({
          success: true,
          executorUsed: 'dom',
        } as HybridExecutionResult);

      // Start execution (will pause on error)
      const startPromise = session.start();
      await startPromise;

      expect(session.getState()).toBe('paused');

      // Retry the failed step
      const retryPromise = session.retryCurrentStep();
      await retryPromise;

      expect(session.getState()).toBe('completed');
    });

    it('should throw error when retrying while not paused', async () => {
      const session = createExecutionSession(mockSkill);

      await expect(session.retryCurrentStep()).rejects.toThrow('Can only retry steps when paused');
    });
  });

  describe('Update Step and Retry', () => {
    it('should update step instruction and retry', async () => {
      const session = createExecutionSession(mockSkill, {
        captureScreenshots: false,
        pauseOnError: true,
        maxRetries: 0,
      });

      // Mock failed then successful execution
      const mockExecutor = (session as any).executor;
      mockExecutor.executeStep
        .mockResolvedValueOnce({
          success: false,
          error: 'Element not found',
        } as HybridExecutionResult)
        .mockResolvedValue({
          success: true,
          executorUsed: 'dom',
        } as HybridExecutionResult);

      // Start execution (will pause on error)
      await session.start();

      expect(session.getState()).toBe('paused');

      const currentStep = session.getCurrentStep();
      expect(currentStep).toBeDefined();

      // Update and retry
      await session.updateStepAndRetry(currentStep!.id, 'Click the updated button');

      const updatedStep = session.getStep(currentStep!.id);
      expect(updatedStep?.instruction).toBe('Click the updated button');
    });

    it('should throw error for non-existent step', async () => {
      const session = createExecutionSession(mockSkill);

      await expect(
        session.updateStepAndRetry('non-existent', 'New instruction')
      ).rejects.toThrow('Step non-existent not found');
    });
  });

  describe('Retry Logic', () => {
    it('should retry failed steps up to maxRetries', async () => {
      // Use a simple skill with just one step to make counting easier
      const simpleSkill: ParsedSkill = {
        ...mockSkill,
        steps: [mockSteps[0]], // Only first step
      };

      const session = createExecutionSession(simpleSkill, {
        captureScreenshots: false,
        pauseOnError: false,
        continueOnFailure: true,
        maxRetries: 2,
      });

      // Mock failures then success
      const mockExecutor = (session as any).executor;
      mockExecutor.executeStep
        .mockResolvedValueOnce({
          success: false,
          error: 'Attempt 1 failed',
        } as HybridExecutionResult)
        .mockResolvedValueOnce({
          success: false,
          error: 'Attempt 2 failed',
        } as HybridExecutionResult)
        .mockResolvedValueOnce({
          success: true,
          executorUsed: 'dom',
        } as HybridExecutionResult);

      await session.start();

      // Should have called executeStep 3 times (initial + 2 retries)
      expect(mockExecutor.executeStep).toHaveBeenCalledTimes(3);
      
      const stats = session.getStats();
      expect(stats.completedSteps).toBe(1);
    });

    it('should mark step as failed after max retries', async () => {
      const session = createExecutionSession(mockSkill, {
        captureScreenshots: false,
        pauseOnError: false,
        continueOnFailure: true,
        maxRetries: 1,
      });

      // Mock all failures
      const mockExecutor = (session as any).executor;
      mockExecutor.executeStep.mockResolvedValue({
        success: false,
        error: 'Always fails',
      } as HybridExecutionResult);

      await session.start();

      const steps = session.getSteps();
      expect(steps[0].status).toBe('failed');
      // Error message is now enhanced with categorization
      expect(steps[0].error).toContain('Always fails');
    });
  });

  describe('Timeout Handling', () => {
    it('should timeout long-running steps', async () => {
      const session = createExecutionSession(mockSkill, {
        captureScreenshots: false,
        pauseOnError: false,
        continueOnFailure: true,
        stepTimeout: 100,
        maxRetries: 0,
      });

      // Mock slow execution
      const mockExecutor = (session as any).executor;
      mockExecutor.executeStep.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ success: true }), 200))
      );

      await session.start();

      const steps = session.getSteps();
      expect(steps[0].status).toBe('failed');
      expect(steps[0].error).toContain('timed out');
    });
  });

  describe('Target Window', () => {
    it('should set target window for DOM automation', () => {
      const session = createExecutionSession(mockSkill);
      const mockWindow = {} as Window;

      session.setTargetWindow(mockWindow);

      const mockExecutor = (session as any).executor;
      expect(mockExecutor.setTargetWindow).toHaveBeenCalledWith(mockWindow);
    });
  });

  describe('Cache Management', () => {
    it('should clear executor cache', () => {
      const session = createExecutionSession(mockSkill);

      session.clearCache();

      const mockExecutor = (session as any).executor;
      expect(mockExecutor.clearCache).toHaveBeenCalled();
    });
  });

  describe('Confirmation Points', () => {
    it('should pause at confirmation points', async () => {
      const session = createExecutionSession(mockSkill, {
        captureScreenshots: false,
        pauseOnConfirmation: true,
      });

      // Mock successful execution for non-confirmation steps
      const mockExecutor = (session as any).executor;
      mockExecutor.executeStep.mockResolvedValue({
        success: true,
        executorUsed: 'dom',
      } as HybridExecutionResult);

      // Start execution
      await session.start();

      // Should pause at step 3 (confirmation step)
      expect(session.getState()).toBe('paused');
      expect(session.getPausedStep()?.id).toBe('step-3');
      expect(session.getPausedStep()?.requiresConfirmation).toBe(true);
    });

    it('should emit pauseForConfirmation event with pending action details', async () => {
      const session = createExecutionSession(mockSkill, {
        captureScreenshots: false,
        pauseOnConfirmation: true,
      });

      const pauseListener = vi.fn();
      session.on('pauseForConfirmation', pauseListener);

      // Mock successful execution
      const mockExecutor = (session as any).executor;
      mockExecutor.executeStep.mockResolvedValue({
        success: true,
        executorUsed: 'dom',
      } as HybridExecutionResult);

      await session.start();

      expect(pauseListener).toHaveBeenCalled();
      const eventData = pauseListener.mock.calls[0][0];
      expect(eventData.step.id).toBe('step-3');
      expect(eventData.pendingAction).toBeDefined();
      expect(eventData.pendingAction.description).toBe('PAUSE - Confirm before submitting');
      expect(eventData.pendingAction.actionType).toBe('confirm');
    });

    it('should show pending action details for click actions', async () => {
      const clickStep: SkillStep = {
        id: 'step-click',
        index: 0,
        instruction: 'Click the delete button',
        actionType: 'click',
        target: { selector: '#delete-btn' },
        requiresConfirmation: true,
        status: 'pending',
      };

      const skillWithClick: ParsedSkill = {
        ...mockSkill,
        steps: [clickStep],
      };

      const session = createExecutionSession(skillWithClick, {
        captureScreenshots: false,
        pauseOnConfirmation: true,
      });

      const pauseListener = vi.fn();
      session.on('pauseForConfirmation', pauseListener);

      await session.start();

      const eventData = pauseListener.mock.calls[0][0];
      expect(eventData.pendingAction.target).toBe('element "#delete-btn"');
      expect(eventData.pendingAction.isDestructive).toBe(true);
    });

    it('should show pending action details for type actions', async () => {
      const typeStep: SkillStep = {
        id: 'step-type',
        index: 0,
        instruction: 'Type password',
        actionType: 'type',
        target: { selector: '#password', text: 'secret123' },
        requiresConfirmation: true,
        status: 'pending',
      };

      const skillWithType: ParsedSkill = {
        ...mockSkill,
        steps: [typeStep],
      };

      const session = createExecutionSession(skillWithType, {
        captureScreenshots: false,
        pauseOnConfirmation: true,
      });

      const pauseListener = vi.fn();
      session.on('pauseForConfirmation', pauseListener);

      await session.start();

      const eventData = pauseListener.mock.calls[0][0];
      expect(eventData.pendingAction.requiresInput).toBe(true);
      expect(eventData.pendingAction.target).toBe('element "#password"');
    });

    it('should approve confirmation and continue execution', async () => {
      const session = createExecutionSession(mockSkill, {
        captureScreenshots: false,
        pauseOnConfirmation: true,
      });

      const approveListener = vi.fn();
      session.on('confirmationApproved', approveListener);

      // Mock successful execution
      const mockExecutor = (session as any).executor;
      mockExecutor.executeStep.mockResolvedValue({
        success: true,
        executorUsed: 'dom',
      } as HybridExecutionResult);

      // Start execution (will pause at confirmation)
      await session.start();
      expect(session.getState()).toBe('paused');

      // Approve confirmation - this awaits until execution completes
      await session.approveConfirmation();

      expect(approveListener).toHaveBeenCalled();
      expect(session.getState()).toBe('completed');
    });

    it('should reject confirmation and abort execution', async () => {
      const session = createExecutionSession(mockSkill, {
        captureScreenshots: false,
        pauseOnConfirmation: true,
      });

      const rejectListener = vi.fn();
      session.on('confirmationRejected', rejectListener);

      // Mock successful execution
      const mockExecutor = (session as any).executor;
      mockExecutor.executeStep.mockResolvedValue({
        success: true,
        executorUsed: 'dom',
      } as HybridExecutionResult);

      // Start execution (will pause at confirmation)
      await session.start();
      expect(session.getState()).toBe('paused');

      // Reject confirmation
      session.rejectConfirmation('User cancelled the action');

      expect(rejectListener).toHaveBeenCalled();
      const eventData = rejectListener.mock.calls[0][0];
      expect(eventData.reason).toBe('User cancelled the action');
      expect(session.getState()).toBe('cancelled');
    });

    it('should throw error when approving without pending confirmation', async () => {
      const session = createExecutionSession(mockSkill);

      await expect(session.approveConfirmation()).rejects.toThrow(
        'No confirmation pending - session is not paused'
      );
    });

    it('should throw error when rejecting without pending confirmation', () => {
      const session = createExecutionSession(mockSkill);

      expect(() => session.rejectConfirmation()).toThrow(
        'No confirmation pending - session is not paused'
      );
    });

    it('should skip confirmation points when pauseOnConfirmation is false', async () => {
      const session = createExecutionSession(mockSkill, {
        captureScreenshots: false,
        pauseOnConfirmation: false,
      });

      const pauseListener = vi.fn();
      session.on('pauseForConfirmation', pauseListener);

      // Mock successful execution
      const mockExecutor = (session as any).executor;
      mockExecutor.executeStep.mockResolvedValue({
        success: true,
        executorUsed: 'dom',
      } as HybridExecutionResult);

      await session.start();

      // Should not pause
      expect(pauseListener).not.toHaveBeenCalled();
      expect(session.getState()).toBe('completed');
    });

    it('should mark pure confirmation steps as success after approval', async () => {
      const session = createExecutionSession(mockSkill, {
        captureScreenshots: false,
        pauseOnConfirmation: true,
      });

      // Mock successful execution
      const mockExecutor = (session as any).executor;
      mockExecutor.executeStep.mockResolvedValue({
        success: true,
        executorUsed: 'dom',
      } as HybridExecutionResult);

      // Start and approve
      await session.start();
      await session.approveConfirmation();

      const confirmStep = session.getStep('step-3');
      expect(confirmStep?.status).toBe('success');
    });

    it('should handle multiple confirmation points in sequence', async () => {
      const multiConfirmSteps: SkillStep[] = [
        {
          id: 'step-1',
          index: 0,
          instruction: 'Click button 1',
          actionType: 'click',
          target: { selector: '#btn1' },
          requiresConfirmation: false,
          status: 'pending',
        },
        {
          id: 'step-2',
          index: 1,
          instruction: 'PAUSE - Confirm action 1',
          actionType: 'confirm',
          requiresConfirmation: true,
          status: 'pending',
        },
        {
          id: 'step-3',
          index: 2,
          instruction: 'Click button 2',
          actionType: 'click',
          target: { selector: '#btn2' },
          requiresConfirmation: false,
          status: 'pending',
        },
        {
          id: 'step-4',
          index: 3,
          instruction: 'PAUSE - Confirm action 2',
          actionType: 'confirm',
          requiresConfirmation: true,
          status: 'pending',
        },
      ];

      const multiConfirmSkill: ParsedSkill = {
        ...mockSkill,
        steps: multiConfirmSteps,
      };

      const session = createExecutionSession(multiConfirmSkill, {
        captureScreenshots: false,
        pauseOnConfirmation: true,
      });

      const pauseListener = vi.fn();
      session.on('pauseForConfirmation', pauseListener);

      // Mock successful execution
      const mockExecutor = (session as any).executor;
      mockExecutor.executeStep.mockResolvedValue({
        success: true,
        executorUsed: 'dom',
      } as HybridExecutionResult);

      // Start execution - will pause at first confirmation
      await session.start();
      expect(session.getState()).toBe('paused');
      expect(session.getPausedStep()?.id).toBe('step-2');

      // Approve first confirmation - will pause at second confirmation
      await session.approveConfirmation();
      expect(session.getState()).toBe('paused');
      expect(session.getPausedStep()?.id).toBe('step-4');

      // Approve second confirmation - will complete
      await session.approveConfirmation();
      expect(session.getState()).toBe('completed');

      // Should have paused twice
      expect(pauseListener).toHaveBeenCalledTimes(2);
    });

    it('should add timeline entries for confirmation approval', async () => {
      const session = createExecutionSession(mockSkill, {
        captureScreenshots: false,
        pauseOnConfirmation: true,
      });

      // Mock successful execution
      const mockExecutor = (session as any).executor;
      mockExecutor.executeStep.mockResolvedValue({
        success: true,
        executorUsed: 'dom',
      } as HybridExecutionResult);

      await session.start();
      await session.approveConfirmation();

      const timeline = session.getTimeline();
      const approvalEntry = timeline.find(
        e => e.type === 'resume' && e.message.includes('Confirmation approved')
      );
      expect(approvalEntry).toBeDefined();
      expect(approvalEntry?.stepId).toBe('step-3');
    });

    it('should add timeline entries for confirmation rejection', async () => {
      const session = createExecutionSession(mockSkill, {
        captureScreenshots: false,
        pauseOnConfirmation: true,
      });

      // Mock successful execution
      const mockExecutor = (session as any).executor;
      mockExecutor.executeStep.mockResolvedValue({
        success: true,
        executorUsed: 'dom',
      } as HybridExecutionResult);

      await session.start();
      session.rejectConfirmation('Too risky');

      const timeline = session.getTimeline();
      const rejectionEntry = timeline.find(
        e => e.type === 'error' && e.message.includes('Confirmation rejected')
      );
      expect(rejectionEntry).toBeDefined();
      expect(rejectionEntry?.stepId).toBe('step-3');
      expect(rejectionEntry?.data?.reason).toBe('Too risky');
    });

    it('should detect destructive actions in pending action details', async () => {
      const destructiveSteps: SkillStep[] = [
        {
          id: 'delete-step',
          index: 0,
          instruction: 'Delete all files',
          actionType: 'click',
          target: { selector: '#delete-all' },
          requiresConfirmation: true,
          status: 'pending',
        },
        {
          id: 'remove-step',
          index: 1,
          instruction: 'Remove user account',
          actionType: 'click',
          target: { selector: '#remove-account' },
          requiresConfirmation: true,
          status: 'pending',
        },
        {
          id: 'clear-step',
          index: 2,
          instruction: 'Clear database',
          actionType: 'click',
          target: { selector: '#clear-db' },
          requiresConfirmation: true,
          status: 'pending',
        },
      ];

      for (const step of destructiveSteps) {
        const skill: ParsedSkill = {
          ...mockSkill,
          steps: [step],
        };

        const session = createExecutionSession(skill, {
          captureScreenshots: false,
          pauseOnConfirmation: true,
        });

        const pauseListener = vi.fn();
        session.on('pauseForConfirmation', pauseListener);

        await session.start();

        const eventData = pauseListener.mock.calls[0][0];
        expect(eventData.pendingAction.isDestructive).toBe(true);
      }
    });

    it('should handle coordinates in pending action details', async () => {
      const coordStep: SkillStep = {
        id: 'coord-step',
        index: 0,
        instruction: 'Click at specific location',
        actionType: 'click',
        target: { coordinates: { x: 100, y: 200 } },
        requiresConfirmation: true,
        status: 'pending',
      };

      const skill: ParsedSkill = {
        ...mockSkill,
        steps: [coordStep],
      };

      const session = createExecutionSession(skill, {
        captureScreenshots: false,
        pauseOnConfirmation: true,
      });

      const pauseListener = vi.fn();
      session.on('pauseForConfirmation', pauseListener);

      await session.start();

      const eventData = pauseListener.mock.calls[0][0];
      expect(eventData.pendingAction.target).toBe('coordinates (100, 200)');
    });
  });
});
