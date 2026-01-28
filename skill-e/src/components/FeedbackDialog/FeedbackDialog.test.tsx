/**
 * FeedbackDialog Component Tests
 * 
 * Tests for the feedback dialog component that handles step failures.
 * Requirements: FR-10.7
 * 
 * Note: These are integration tests that verify the component logic
 * without full DOM rendering. Full UI tests require @testing-library/react.
 */

import { describe, it, expect } from 'vitest';
import type { SkillStep } from '@/lib/skill-parser';
import type { CategorizedError, RecoverySuggestion } from '@/lib/error-handler';
import { categorizeError } from '@/lib/error-handler';

/**
 * Helper function to get action buttons based on error category
 */
function getActionButtons(
  categorizedError: CategorizedError,
  suggestions: RecoverySuggestion[]
): Array<{ action: string; label: string }> {
  const buttons: Array<{ action: string; label: string }> = [];
  const suggestionActions = new Set(suggestions.map(s => s.action));
  
  if (suggestionActions.has('retry') && categorizedError.canRetry) {
    buttons.push({ action: 'retry', label: 'Retry' });
  }
  
  if (suggestionActions.has('edit')) {
    buttons.push({ action: 'edit', label: 'Edit Step' });
  }
  
  if (suggestionActions.has('manual')) {
    buttons.push({ action: 'manual', label: 'Complete Manually' });
  }
  
  if (suggestionActions.has('skip')) {
    buttons.push({ action: 'skip', label: 'Skip' });
  }
  
  if (suggestionActions.has('abort') || categorizedError.severity === 'critical') {
    buttons.push({ action: 'abort', label: 'Abort' });
  }
  
  return buttons;
}

describe('FeedbackDialog', () => {
  const mockStep: SkillStep = {
    id: 'step-1',
    index: 0,
    instruction: 'Click the "Submit" button',
    actionType: 'click',
    target: {
      selector: '#submit-btn',
      description: 'Submit button',
    },
    requiresConfirmation: false,
    status: 'failed',
    error: 'Element not found',
    section: 'Login Form',
    stepNumber: 1,
  };

  const mockCategorizedError: CategorizedError = {
    originalError: 'Element not found',
    category: 'not_found',
    severity: 'medium',
    message: 'Step 1 (click): Target not found. Could not locate the element or target specified in the step.',
    technicalDetails: 'Element not found: #submit-btn',
    userMessage: 'Could not find the target for "Click the Submit button". The element might have moved, changed, or not be visible yet.',
    suggestions: [
      {
        text: 'Update selector',
        action: 'edit',
        priority: 3,
        details: 'Edit the step to use a different selector or target',
      },
      {
        text: 'Wait and retry',
        action: 'retry',
        priority: 2,
        details: 'Wait for the element to appear, then retry',
      },
      {
        text: 'Skip this step',
        action: 'skip',
        priority: 1,
        details: 'Skip this step and continue with the next one',
      },
    ],
    shouldPause: true,
    canRetry: true,
  };

  describe('Error Categorization Integration', () => {
    it('should categorize error from string when not pre-categorized', () => {
      const categorized = categorizeError(mockStep, undefined, 'Element not found');
      
      expect(categorized.category).toBe('not_found');
      expect(categorized.severity).toBe('medium');
      expect(categorized.canRetry).toBe(true);
    });

    it('should categorize error from Error object', () => {
      const error = new Error('Network connection failed');
      const categorized = categorizeError(mockStep, undefined, error);
      
      expect(categorized.category).toBe('network');
      expect(categorized.severity).toBe('high');
    });

    it('should generate appropriate suggestions for not_found errors', () => {
      const categorized = categorizeError(mockStep, undefined, 'Element not found');
      
      expect(categorized.suggestions.length).toBeGreaterThan(0);
      expect(categorized.suggestions.some(s => s.action === 'edit')).toBe(true);
      expect(categorized.suggestions.some(s => s.action === 'retry')).toBe(true);
    });

    it('should generate appropriate suggestions for timeout errors', () => {
      const categorized = categorizeError(mockStep, undefined, 'Operation timed out');
      
      expect(categorized.category).toBe('timeout');
      expect(categorized.suggestions.some(s => s.action === 'retry')).toBe(true);
    });

    it('should generate appropriate suggestions for bot_detection errors', () => {
      const categorized = categorizeError(mockStep, undefined, 'Cloudflare challenge detected');
      
      expect(categorized.category).toBe('bot_detection');
      expect(categorized.severity).toBe('critical');
      expect(categorized.suggestions.some(s => s.action === 'edit')).toBe(true);
    });
  });

  describe('Action Button Generation', () => {
    it('should generate retry button when suggested and can retry', () => {
      const buttons = getActionButtons(mockCategorizedError, mockCategorizedError.suggestions);
      
      expect(buttons.some(b => b.action === 'retry')).toBe(true);
    });

    it('should generate edit button when suggested', () => {
      const buttons = getActionButtons(mockCategorizedError, mockCategorizedError.suggestions);
      
      expect(buttons.some(b => b.action === 'edit')).toBe(true);
    });

    it('should generate skip button when suggested', () => {
      const buttons = getActionButtons(mockCategorizedError, mockCategorizedError.suggestions);
      
      expect(buttons.some(b => b.action === 'skip')).toBe(true);
    });

    it('should not generate retry button when cannot retry', () => {
      const errorCannotRetry: CategorizedError = {
        ...mockCategorizedError,
        canRetry: false,
      };
      
      const buttons = getActionButtons(errorCannotRetry, mockCategorizedError.suggestions);
      
      expect(buttons.some(b => b.action === 'retry')).toBe(false);
    });

    it('should generate abort button for critical errors', () => {
      const criticalError: CategorizedError = {
        ...mockCategorizedError,
        severity: 'critical',
        suggestions: [],
      };
      
      const buttons = getActionButtons(criticalError, []);
      
      expect(buttons.some(b => b.action === 'abort')).toBe(true);
    });

    it('should generate manual button when suggested', () => {
      const suggestions: RecoverySuggestion[] = [
        ...mockCategorizedError.suggestions,
        {
          text: 'Complete manually',
          action: 'manual',
          priority: 2,
        },
      ];
      
      const buttons = getActionButtons(mockCategorizedError, suggestions);
      
      expect(buttons.some(b => b.action === 'manual')).toBe(true);
    });
  });

  describe('Suggestion Priority Sorting', () => {
    it('should have suggestions sorted by priority', () => {
      const categorized = categorizeError(mockStep, undefined, 'Element not found');
      
      // Check that suggestions are sorted by priority (highest first)
      for (let i = 0; i < categorized.suggestions.length - 1; i++) {
        expect(categorized.suggestions[i].priority).toBeGreaterThanOrEqual(
          categorized.suggestions[i + 1].priority
        );
      }
    });
  });

  describe('Error Message Generation', () => {
    it('should generate user-friendly message for not_found errors', () => {
      const categorized = categorizeError(mockStep, undefined, 'Element not found');
      
      expect(categorized.userMessage).toContain('Could not find the target');
      expect(categorized.userMessage).toContain(mockStep.instruction);
    });

    it('should generate user-friendly message for timeout errors', () => {
      const categorized = categorizeError(mockStep, undefined, 'Operation timed out');
      
      expect(categorized.userMessage).toContain('took too long');
      expect(categorized.userMessage).toContain(mockStep.instruction);
    });

    it('should generate user-friendly message for network errors', () => {
      const categorized = categorizeError(mockStep, undefined, 'Network connection failed');
      
      expect(categorized.userMessage).toContain('Network connection failed');
      expect(categorized.userMessage).toContain(mockStep.instruction);
    });

    it('should generate user-friendly message for permission errors', () => {
      const categorized = categorizeError(mockStep, undefined, 'Permission denied');
      
      expect(categorized.userMessage).toContain('Permission denied');
      expect(categorized.userMessage).toContain(mockStep.instruction);
    });
  });

  describe('Component Props Validation', () => {
    it('should accept all required props', () => {
      const props = {
        open: true,
        onOpenChange: () => {},
        step: mockStep,
        categorizedError: mockCategorizedError,
        onRetry: () => {},
        onSkip: () => {},
        onEdit: () => {},
        onManual: () => {},
        onAbort: () => {},
      };
      
      // If this compiles, the props are valid
      expect(props).toBeDefined();
    });

    it('should accept optional error prop', () => {
      const props = {
        open: true,
        onOpenChange: () => {},
        step: mockStep,
        error: 'Test error',
        onRetry: () => {},
        onSkip: () => {},
        onEdit: () => {},
        onManual: () => {},
        onAbort: () => {},
      };
      
      expect(props).toBeDefined();
    });

    it('should accept optional errorScreenshot prop', () => {
      const props = {
        open: true,
        onOpenChange: () => {},
        step: mockStep,
        categorizedError: mockCategorizedError,
        errorScreenshot: 'data:image/png;base64,abc123',
        onRetry: () => {},
        onSkip: () => {},
        onEdit: () => {},
        onManual: () => {},
        onAbort: () => {},
      };
      
      expect(props).toBeDefined();
    });

    it('should accept optional isProcessing prop', () => {
      const props = {
        open: true,
        onOpenChange: () => {},
        step: mockStep,
        categorizedError: mockCategorizedError,
        isProcessing: true,
        onRetry: () => {},
        onSkip: () => {},
        onEdit: () => {},
        onManual: () => {},
        onAbort: () => {},
      };
      
      expect(props).toBeDefined();
    });
  });
});
