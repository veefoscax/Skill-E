/**
 * Skill Updater Tests
 * 
 * Tests LLM-based skill fix generation and update application.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  generateSkillFix,
  applySkillUpdate,
  generateFixSuggestions,
  validateSkillUpdate,
  type SkillUpdateRequest,
  type SkillUpdateResult,
} from './skill-updater';
import type { SkillStep } from './skill-parser';
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
    // Yield response in chunks to simulate streaming
    const chunks = this.mockResponse.split(' ');
    for (const chunk of chunks) {
      yield chunk + ' ';
    }
  }
  
  async testConnection() {
    return { success: true };
  }
  
  async listModels() {
    return [];
  }
}

describe('generateSkillFix', () => {
  it('should generate a fix from LLM response', async () => {
    const mockResponse = JSON.stringify({
      instruction: 'Click the "Sign Up" button using selector #signup-btn',
      selector: '#signup-btn',
      explanation: 'Added specific CSS selector for better targeting',
      confidence: 0.9,
    });
    
    const provider = new MockProvider(mockResponse);
    
    const request: SkillUpdateRequest = {
      step: {
        id: 'step-1',
        index: 0,
        instruction: 'Click the Sign Up button',
        actionType: 'click',
        target: {
          description: 'Sign Up button',
        },
        requiresConfirmation: false,
        status: 'failed',
        error: 'Element not found',
      },
      feedback: 'The button has ID #signup-btn',
    };
    
    const result = await generateSkillFix(request, provider);
    
    expect(result.success).toBe(true);
    expect(result.updatedInstruction).toBe('Click the "Sign Up" button using selector #signup-btn');
    expect(result.updatedTarget?.selector).toBe('#signup-btn');
    expect(result.explanation).toBe('Added specific CSS selector for better targeting');
    expect(result.confidence).toBe(0.9);
  });
  
  it('should handle LLM error responses', async () => {
    const mockResponse = JSON.stringify({
      error: 'Cannot generate fix without more information',
    });
    
    const provider = new MockProvider(mockResponse);
    
    const request: SkillUpdateRequest = {
      step: {
        id: 'step-1',
        index: 0,
        instruction: 'Do something',
        actionType: 'unknown',
        requiresConfirmation: false,
        status: 'failed',
      },
      feedback: 'It did not work',
    };
    
    const result = await generateSkillFix(request, provider);
    
    expect(result.success).toBe(false);
    expect(result.error).toBe('Cannot generate fix without more information');
  });
  
  it('should handle invalid JSON responses', async () => {
    const mockResponse = 'This is not valid JSON';
    
    const provider = new MockProvider(mockResponse);
    
    const request: SkillUpdateRequest = {
      step: {
        id: 'step-1',
        index: 0,
        instruction: 'Click button',
        actionType: 'click',
        requiresConfirmation: false,
        status: 'failed',
      },
      feedback: 'Button not found',
    };
    
    const result = await generateSkillFix(request, provider);
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('JSON');
  });
  
  it('should include categorized error in prompt', async () => {
    const mockResponse = JSON.stringify({
      instruction: 'Wait for page to load, then click the button',
      explanation: 'Added wait step to handle timing issue',
      confidence: 0.85,
    });
    
    const provider = new MockProvider(mockResponse);
    
    const request: SkillUpdateRequest = {
      step: {
        id: 'step-1',
        index: 0,
        instruction: 'Click the button',
        actionType: 'click',
        requiresConfirmation: false,
        status: 'failed',
      },
      feedback: 'Button appears after page loads',
      categorizedError: {
        category: 'timing_issue',
        severity: 'medium',
        message: 'Element not found - may be a timing issue',
        userMessage: 'The element was not found. It might not have loaded yet.',
        technicalDetails: 'Element not found: button',
        canRetry: true,
        suggestions: [],
        originalError: 'Element not found',
      },
    };
    
    const result = await generateSkillFix(request, provider);
    
    expect(result.success).toBe(true);
    expect(result.updatedInstruction).toContain('Wait');
  });
  
  it('should include skill context in prompt', async () => {
    const mockResponse = JSON.stringify({
      instruction: 'Enter email address in the email field',
      selector: 'input[type="email"]',
      explanation: 'Made instruction more specific based on context',
      confidence: 0.88,
    });
    
    const provider = new MockProvider(mockResponse);
    
    const request: SkillUpdateRequest = {
      step: {
        id: 'step-2',
        index: 1,
        instruction: 'Enter email',
        actionType: 'type',
        requiresConfirmation: false,
        status: 'failed',
      },
      feedback: 'Need to specify which field',
      skillContext: {
        skillName: 'User Registration',
        skillDescription: 'Register a new user account',
        previousSteps: [
          {
            id: 'step-1',
            index: 0,
            instruction: 'Navigate to signup page',
            actionType: 'navigate',
            requiresConfirmation: false,
            status: 'success',
          },
        ],
        nextSteps: [
          {
            id: 'step-3',
            index: 2,
            instruction: 'Enter password',
            actionType: 'type',
            requiresConfirmation: false,
            status: 'pending',
          },
        ],
      },
    };
    
    const result = await generateSkillFix(request, provider);
    
    expect(result.success).toBe(true);
    expect(result.updatedTarget?.selector).toBe('input[type="email"]');
  });
  
  it('should handle coordinates in response', async () => {
    const mockResponse = JSON.stringify({
      instruction: 'Click at coordinates (150, 200)',
      coordinates: { x: 150, y: 200 },
      explanation: 'Using image-based coordinates as fallback',
      confidence: 0.75,
    });
    
    const provider = new MockProvider(mockResponse);
    
    const request: SkillUpdateRequest = {
      step: {
        id: 'step-1',
        index: 0,
        instruction: 'Click the button',
        actionType: 'click',
        requiresConfirmation: false,
        status: 'failed',
      },
      feedback: 'Button is at coordinates 150, 200',
    };
    
    const result = await generateSkillFix(request, provider);
    
    expect(result.success).toBe(true);
    expect(result.updatedTarget?.coordinates).toEqual({ x: 150, y: 200 });
  });
});

describe('applySkillUpdate', () => {
  it('should apply successful update to step', () => {
    const step: SkillStep = {
      id: 'step-1',
      index: 0,
      instruction: 'Click button',
      actionType: 'click',
      requiresConfirmation: false,
      status: 'failed',
      error: 'Element not found',
    };
    
    const update: SkillUpdateResult = {
      success: true,
      updatedInstruction: 'Click the Submit button using #submit-btn',
      updatedTarget: {
        selector: '#submit-btn',
        description: 'Submit button',
      },
      explanation: 'Added specific selector',
      confidence: 0.9,
    };
    
    const updated = applySkillUpdate(step, update);
    
    expect(updated.instruction).toBe('Click the Submit button using #submit-btn');
    expect(updated.target?.selector).toBe('#submit-btn');
    expect(updated.status).toBe('pending'); // Reset for retry
    expect(updated.error).toBeUndefined(); // Error cleared
    expect(updated.feedback).toBe('Added specific selector');
  });
  
  it('should not modify step if update failed', () => {
    const step: SkillStep = {
      id: 'step-1',
      index: 0,
      instruction: 'Click button',
      actionType: 'click',
      requiresConfirmation: false,
      status: 'failed',
      error: 'Element not found',
    };
    
    const update: SkillUpdateResult = {
      success: false,
      error: 'Could not generate fix',
    };
    
    const updated = applySkillUpdate(step, update);
    
    expect(updated).toEqual(step); // Unchanged
  });
  
  it('should preserve original target if no updated target provided', () => {
    const step: SkillStep = {
      id: 'step-1',
      index: 0,
      instruction: 'Click button',
      actionType: 'click',
      target: {
        selector: '.old-selector',
      },
      requiresConfirmation: false,
      status: 'failed',
    };
    
    const update: SkillUpdateResult = {
      success: true,
      updatedInstruction: 'Click the button',
      explanation: 'Clarified instruction',
      confidence: 0.8,
    };
    
    const updated = applySkillUpdate(step, update);
    
    expect(updated.target?.selector).toBe('.old-selector'); // Preserved
  });
});

describe('generateFixSuggestions', () => {
  it('should generate multiple fix suggestions', async () => {
    const responses = [
      JSON.stringify({
        instruction: 'Click the "Sign Up" button',
        selector: '#signup',
        confidence: 0.9,
      }),
      JSON.stringify({
        instruction: 'Click the Sign Up button',
        selector: '.signup-btn',
        confidence: 0.85,
      }),
      JSON.stringify({
        instruction: 'Click button at coordinates (100, 200)',
        coordinates: { x: 100, y: 200 },
        confidence: 0.7,
      }),
    ];
    
    let responseIndex = 0;
    const provider = {
      type: 'openrouter' as const,
      name: 'Mock',
      requiresApiKey: false,
      supportsStreaming: true,
      async *chat() {
        const response = responses[responseIndex % responses.length];
        responseIndex++;
        yield response;
      },
      async testConnection() {
        return { success: true };
      },
      async listModels() {
        return [];
      },
    };
    
    const request: SkillUpdateRequest = {
      step: {
        id: 'step-1',
        index: 0,
        instruction: 'Click Sign Up',
        actionType: 'click',
        requiresConfirmation: false,
        status: 'failed',
      },
      feedback: 'Button not found',
    };
    
    const suggestions = await generateFixSuggestions(request, 3, provider);
    
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions.length).toBeLessThanOrEqual(3);
    
    // All suggestions should be successful
    suggestions.forEach(suggestion => {
      expect(suggestion.success).toBe(true);
      expect(suggestion.updatedInstruction).toBeDefined();
    });
  });
});

describe('validateSkillUpdate', () => {
  const baseStep: SkillStep = {
    id: 'step-1',
    index: 0,
    instruction: 'Click the Submit button',
    actionType: 'click',
    requiresConfirmation: false,
    status: 'failed',
  };
  
  it('should validate successful update', () => {
    const update: SkillUpdateResult = {
      success: true,
      updatedInstruction: 'Click the Submit button using selector #submit-btn',
      updatedTarget: {
        selector: '#submit-btn',
      },
      confidence: 0.9,
    };
    
    const validation = validateSkillUpdate(baseStep, update);
    
    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });
  
  it('should reject failed update', () => {
    const update: SkillUpdateResult = {
      success: false,
      error: 'Could not generate fix',
    };
    
    const validation = validateSkillUpdate(baseStep, update);
    
    expect(validation.valid).toBe(false);
    expect(validation.errors).toContain('Update was not successful');
  });
  
  it('should reject update without instruction', () => {
    const update: SkillUpdateResult = {
      success: true,
      // Missing updatedInstruction
    };
    
    const validation = validateSkillUpdate(baseStep, update);
    
    expect(validation.valid).toBe(false);
    expect(validation.errors).toContain('No updated instruction provided');
  });
  
  it('should warn about very short instructions', () => {
    const update: SkillUpdateResult = {
      success: true,
      updatedInstruction: 'Click',
      confidence: 0.8,
    };
    
    const validation = validateSkillUpdate(baseStep, update);
    
    expect(validation.valid).toBe(true);
    expect(validation.warnings).toContain('Updated instruction is very short');
  });
  
  it('should warn about very long instructions', () => {
    const update: SkillUpdateResult = {
      success: true,
      updatedInstruction: 'A'.repeat(600),
      confidence: 0.8,
    };
    
    const validation = validateSkillUpdate(baseStep, update);
    
    expect(validation.valid).toBe(true);
    expect(validation.warnings).toContain('Updated instruction is very long');
  });
  
  it('should warn about low confidence', () => {
    const update: SkillUpdateResult = {
      success: true,
      updatedInstruction: 'Click the button',
      confidence: 0.3,
    };
    
    const validation = validateSkillUpdate(baseStep, update);
    
    expect(validation.valid).toBe(true);
    expect(validation.warnings).toContain('LLM has low confidence in this fix');
  });
  
  it('should warn about dangerous operations', () => {
    const update: SkillUpdateResult = {
      success: true,
      updatedInstruction: 'Delete all files from the system',
      confidence: 0.9,
    };
    
    const validation = validateSkillUpdate(baseStep, update);
    
    expect(validation.valid).toBe(true);
    expect(validation.warnings.some(w => w.includes('dangerous'))).toBe(true);
  });
  
  it('should not warn if dangerous operation was in original', () => {
    const step: SkillStep = {
      ...baseStep,
      instruction: 'Delete the temporary file',
    };
    
    const update: SkillUpdateResult = {
      success: true,
      updatedInstruction: 'Delete the temporary file using rm command',
      confidence: 0.9,
    };
    
    const validation = validateSkillUpdate(step, update);
    
    expect(validation.valid).toBe(true);
    expect(validation.warnings.some(w => w.includes('dangerous'))).toBe(false);
  });
  
  it('should warn if instruction is too similar', () => {
    const update: SkillUpdateResult = {
      success: true,
      updatedInstruction: 'Click the Submit button.',
      confidence: 0.9,
    };
    
    const validation = validateSkillUpdate(baseStep, update);
    
    expect(validation.valid).toBe(true);
    expect(validation.warnings.some(w => w.includes('similar'))).toBe(true);
  });
  
  it('should warn if instruction is too different', () => {
    const update: SkillUpdateResult = {
      success: true,
      updatedInstruction: 'Navigate to the settings page and configure the options',
      confidence: 0.9,
    };
    
    const validation = validateSkillUpdate(baseStep, update);
    
    expect(validation.valid).toBe(true);
    expect(validation.warnings.some(w => w.includes('different'))).toBe(true);
  });
});
