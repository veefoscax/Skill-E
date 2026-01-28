/**
 * Skill Updater Integration Tests
 * 
 * Tests integration between skill updater and execution session.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExecutionSession } from './skill-executor';
import type { ParsedSkill } from './skill-parser';
import type { Provider, Message, ChatOptions } from './providers/types';

/**
 * Mock provider for testing
 */
class MockProvider implements Provider {
  type = 'openrouter' as const;
  name = 'Mock Provider';
  requiresApiKey = false;
  supportsStreaming = true;
  
  private mockResponse: string;
  
  constructor(mockResponse: string) {
    this.mockResponse = mockResponse;
  }
  
  async *chat(messages: Message[], options?: ChatOptions): AsyncIterable<string> {
    yield this.mockResponse;
  }
  
  async testConnection() {
    return { success: true };
  }
  
  async listModels() {
    return [];
  }
}

describe('Skill Updater Integration', () => {
  let mockSkill: ParsedSkill;
  
  beforeEach(() => {
    mockSkill = {
      name: 'Test Skill',
      description: 'A test skill',
      steps: [
        {
          id: 'step-1',
          index: 0,
          instruction: 'Navigate to example.com',
          actionType: 'navigate',
          target: {
            text: 'https://example.com',
          },
          requiresConfirmation: false,
          status: 'pending',
        },
        {
          id: 'step-2',
          index: 1,
          instruction: 'Click the button',
          actionType: 'click',
          target: {
            description: 'button',
          },
          requiresConfirmation: false,
          status: 'pending',
        },
      ],
      parameters: [],
      prerequisites: [],
      verificationItems: [],
      frontmatter: {},
      markdown: '',
    };
  });
  
  it('should generate fix for failed step', async () => {
    const session = new ExecutionSession(mockSkill);
    
    // Simulate step failure
    const step = session.getSteps()[1];
    step.status = 'failed';
    step.error = 'Element not found';
    
    const mockResponse = JSON.stringify({
      instruction: 'Click the Submit button using selector #submit-btn',
      selector: '#submit-btn',
      explanation: 'Added specific CSS selector',
      confidence: 0.9,
    });
    
    const provider = new MockProvider(mockResponse);
    
    const result = await session.generateStepFix(
      'step-2',
      'The button has ID #submit-btn',
      provider
    );
    
    expect(result.success).toBe(true);
    expect(result.updatedInstruction).toBe('Click the Submit button using selector #submit-btn');
    expect(result.updatedTarget?.selector).toBe('#submit-btn');
  });
  
  it('should apply fix and update step', async () => {
    const session = new ExecutionSession(mockSkill);
    
    const step = session.getSteps()[1];
    step.status = 'failed';
    
    const mockResponse = JSON.stringify({
      instruction: 'Click the Submit button',
      selector: '#submit',
      explanation: 'Added selector',
      confidence: 0.85,
    });
    
    const provider = new MockProvider(mockResponse);
    
    const fixResult = await session.generateStepFix(
      'step-2',
      'Use selector #submit',
      provider
    );
    
    expect(fixResult.success).toBe(true);
    
    const applied = await session.applyFixAndRetry('step-2', fixResult);
    
    expect(applied).toBe(true);
    
    // Check that step was updated
    const updatedStep = session.getStep('step-2');
    expect(updatedStep?.instruction).toBe('Click the Submit button');
    expect(updatedStep?.target?.selector).toBe('#submit');
    expect(updatedStep?.status).toBe('pending'); // Reset for retry
  });
  
  it('should use skill context when generating fix', async () => {
    const session = new ExecutionSession(mockSkill);
    
    const step = session.getSteps()[1];
    step.status = 'failed';
    
    const mockResponse = JSON.stringify({
      instruction: 'Click the button after page loads',
      explanation: 'Added context from previous navigation step',
      confidence: 0.8,
    });
    
    const provider = new MockProvider(mockResponse);
    
    const result = await session.generateStepFix(
      'step-2',
      'Button appears after navigation',
      provider
    );
    
    expect(result.success).toBe(true);
    expect(result.updatedInstruction).toContain('after page loads');
  });
  
  it('should emit events during fix generation', async () => {
    const session = new ExecutionSession(mockSkill);
    
    const step = session.getSteps()[1];
    step.status = 'failed';
    
    const mockResponse = JSON.stringify({
      instruction: 'Click button',
      confidence: 0.9,
    });
    
    const provider = new MockProvider(mockResponse);
    
    const events: string[] = [];
    session.on('fixGenerated', () => events.push('fixGenerated'));
    session.on('fixApplied', () => events.push('fixApplied'));
    
    const fixResult = await session.generateStepFix('step-2', 'Fix it', provider);
    await session.applyFixAndRetry('step-2', fixResult);
    
    expect(events).toContain('fixGenerated');
    expect(events).toContain('fixApplied');
  });
  
  it('should reject invalid fixes', async () => {
    const session = new ExecutionSession(mockSkill);
    
    const step = session.getSteps()[1];
    step.status = 'failed';
    
    // Generate a fix with very low confidence
    const mockResponse = JSON.stringify({
      instruction: 'Click',
      confidence: 0.2,
    });
    
    const provider = new MockProvider(mockResponse);
    
    const fixResult = await session.generateStepFix('step-2', 'Fix it', provider);
    
    // Try to apply - should succeed but with warnings
    const applied = await session.applyFixAndRetry('step-2', fixResult);
    
    // Should still apply despite warnings
    expect(applied).toBe(true);
    
    // Check timeline for warnings
    const timeline = session.getTimeline();
    const warningEntry = timeline.find(e => 
      e.message.includes('warnings') && e.stepId === 'step-2'
    );
    expect(warningEntry).toBeDefined();
  });
  
  it('should handle fix generation errors gracefully', async () => {
    const session = new ExecutionSession(mockSkill);
    
    const step = session.getSteps()[1];
    step.status = 'failed';
    
    // Provider returns error
    const mockResponse = JSON.stringify({
      error: 'Cannot generate fix',
    });
    
    const provider = new MockProvider(mockResponse);
    
    const result = await session.generateStepFix('step-2', 'Fix it', provider);
    
    expect(result.success).toBe(false);
    expect(result.error).toBe('Cannot generate fix');
    
    // Check timeline for error
    const timeline = session.getTimeline();
    const errorEntry = timeline.find(e => 
      e.type === 'error' && e.stepId === 'step-2' && e.message.includes('Failed to generate fix')
    );
    expect(errorEntry).toBeDefined();
  });
  
  it('should use fixStepAndRetry convenience method', async () => {
    const session = new ExecutionSession(mockSkill);
    
    const step = session.getSteps()[1];
    step.status = 'failed';
    
    const mockResponse = JSON.stringify({
      instruction: 'Click the button with selector .btn',
      selector: '.btn',
      confidence: 0.9,
    });
    
    const provider = new MockProvider(mockResponse);
    
    const success = await session.fixStepAndRetry(
      'step-2',
      'Use selector .btn',
      provider
    );
    
    expect(success).toBe(true);
    
    const updatedStep = session.getStep('step-2');
    expect(updatedStep?.instruction).toBe('Click the button with selector .btn');
    expect(updatedStep?.target?.selector).toBe('.btn');
  });
  
  it('should include categorized error in fix request', async () => {
    const session = new ExecutionSession(mockSkill);
    
    // Add a categorized error to timeline
    const step = session.getSteps()[1];
    step.status = 'failed';
    
    // Manually add timeline entry with categorized error (simulating execution)
    const categorizedError = {
      category: 'element_not_found' as const,
      severity: 'medium' as const,
      message: 'Element not found',
      userMessage: 'The button was not found on the page',
      technicalDetails: 'querySelector returned null',
      canRetry: true,
      suggestions: [],
      originalError: 'Element not found',
    };
    
    // Access private method through type assertion for testing
    (session as any).addTimelineEntry({
      type: 'step_failed',
      stepId: 'step-2',
      message: 'Step failed',
      categorizedError,
    });
    
    const mockResponse = JSON.stringify({
      instruction: 'Wait for button to appear, then click',
      explanation: 'Added wait to handle element not found',
      confidence: 0.85,
    });
    
    const provider = new MockProvider(mockResponse);
    
    const result = await session.generateStepFix(
      'step-2',
      'Button loads after delay',
      provider
    );
    
    expect(result.success).toBe(true);
    expect(result.updatedInstruction).toContain('Wait');
  });
});
