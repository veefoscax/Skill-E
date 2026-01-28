/**
 * Tests for Error Handler - Enhanced Error Detection and Categorization
 * 
 * Requirements: FR-10.2
 */

import { describe, it, expect } from 'vitest';
import {
  categorizeError,
  formatErrorForDisplay,
  getErrorIcon,
  getErrorColor,
  type ErrorCategory,
  type ErrorSeverity,
} from './error-handler';
import type { SkillStep } from './skill-parser';
import type { HybridExecutionResult } from './hybrid-executor';

describe('Error Handler', () => {
  const mockStep: SkillStep = {
    id: 'step-1',
    index: 0,
    instruction: 'Click the login button',
    actionType: 'click',
    target: { selector: '#login-btn' },
    requiresConfirmation: false,
    status: 'pending',
  };

  describe('Error Categorization', () => {
    it('should categorize timeout errors', () => {
      const result = categorizeError(mockStep, {
        success: false,
        error: 'Step execution timed out after 30000ms',
      } as HybridExecutionResult);

      expect(result.category).toBe('timeout');
      expect(result.severity).toBe('medium');
      expect(result.canRetry).toBe(true);
    });

    it('should categorize not found errors', () => {
      const result = categorizeError(mockStep, {
        success: false,
        error: 'Element not found: #login-btn',
      } as HybridExecutionResult);

      expect(result.category).toBe('not_found');
      expect(result.severity).toBe('medium');
      expect(result.canRetry).toBe(true);
    });

    it('should categorize network errors', () => {
      const result = categorizeError(mockStep, {
        success: false,
        error: 'Network connection failed',
      } as HybridExecutionResult);

      expect(result.category).toBe('network');
      expect(result.severity).toBe('high');
      expect(result.canRetry).toBe(true);
    });

    it('should categorize permission errors', () => {
      const result = categorizeError(mockStep, {
        success: false,
        error: 'Permission denied: access forbidden',
      } as HybridExecutionResult);

      expect(result.category).toBe('permission');
      expect(result.severity).toBe('critical');
      expect(result.canRetry).toBe(false);
    });

    it('should categorize validation errors', () => {
      const result = categorizeError(mockStep, {
        success: false,
        error: 'Validation failed: expected result not found',
      } as HybridExecutionResult);

      expect(result.category).toBe('validation');
      expect(result.severity).toBe('high');
      expect(result.canRetry).toBe(true);
    });

    it('should categorize bot detection errors', () => {
      const result = categorizeError(mockStep, {
        success: false,
        error: 'Cloudflare challenge detected',
      } as HybridExecutionResult);

      expect(result.category).toBe('bot_detection');
      expect(result.severity).toBe('critical');
      expect(result.canRetry).toBe(true);
    });

    it('should categorize user cancelled errors', () => {
      const result = categorizeError(mockStep, {
        success: false,
        error: 'Action cancelled by user',
      } as HybridExecutionResult);

      expect(result.category).toBe('user_cancelled');
      expect(result.severity).toBe('low');
      expect(result.canRetry).toBe(false);
    });

    it('should categorize unexpected errors', () => {
      const result = categorizeError(mockStep, {
        success: false,
        error: 'Something went wrong',
      } as HybridExecutionResult);

      expect(result.category).toBe('unexpected');
      expect(result.severity).toBe('medium');
      expect(result.canRetry).toBe(true);
    });

    it('should handle Error objects', () => {
      const error = new Error('Element not found');
      const result = categorizeError(mockStep, undefined, error);

      expect(result.category).toBe('not_found');
      expect(result.originalError).toBe('Element not found');
    });

    it('should handle string errors', () => {
      const result = categorizeError(mockStep, undefined, 'Timeout occurred');

      expect(result.category).toBe('timeout');
      expect(result.originalError).toBe('Timeout occurred');
    });

    it('should handle missing error information', () => {
      const result = categorizeError(mockStep);

      expect(result.category).toBe('unexpected');
      expect(result.originalError).toBe('Unknown error');
    });
  });

  describe('Error Severity', () => {
    it('should assign critical severity to permission errors', () => {
      const result = categorizeError(mockStep, {
        success: false,
        error: 'Access denied',
      } as HybridExecutionResult);

      expect(result.severity).toBe('critical');
      expect(result.shouldPause).toBe(true);
    });

    it('should assign critical severity to bot detection', () => {
      const result = categorizeError(mockStep, {
        success: false,
        error: 'CAPTCHA detected',
      } as HybridExecutionResult);

      expect(result.severity).toBe('critical');
      expect(result.shouldPause).toBe(true);
    });

    it('should assign high severity to network errors', () => {
      const result = categorizeError(mockStep, {
        success: false,
        error: 'Connection failed',
      } as HybridExecutionResult);

      expect(result.severity).toBe('high');
      expect(result.shouldPause).toBe(true);
    });

    it('should assign high severity to destructive actions', () => {
      const destructiveStep: SkillStep = {
        ...mockStep,
        instruction: 'Delete all files',
      };

      const result = categorizeError(destructiveStep, {
        success: false,
        error: 'Something went wrong',
      } as HybridExecutionResult);

      expect(result.severity).toBe('high');
    });

    it('should assign medium severity to timeout errors', () => {
      const result = categorizeError(mockStep, {
        success: false,
        error: 'Timed out',
      } as HybridExecutionResult);

      expect(result.severity).toBe('medium');
      expect(result.shouldPause).toBe(false);
    });

    it('should assign low severity to user cancelled', () => {
      const result = categorizeError(mockStep, {
        success: false,
        error: 'Cancelled',
      } as HybridExecutionResult);

      expect(result.severity).toBe('low');
      expect(result.shouldPause).toBe(false);
    });
  });

  describe('Error Messages', () => {
    it('should generate enhanced error message for timeout', () => {
      const result = categorizeError(mockStep, {
        success: false,
        error: 'Timed out after 30s',
      } as HybridExecutionResult);

      expect(result.message).toContain('Step 1');
      expect(result.message).toContain('timed out');
      expect(result.message).toContain('Timed out after 30s');
    });

    it('should generate enhanced error message for not found', () => {
      const result = categorizeError(mockStep, {
        success: false,
        error: 'Element not found',
      } as HybridExecutionResult);

      expect(result.message).toContain('Step 1');
      expect(result.message).toContain('not found');
      expect(result.message).toContain('Element not found');
    });

    it('should generate user-friendly message', () => {
      const result = categorizeError(mockStep, {
        success: false,
        error: 'Element not found',
      } as HybridExecutionResult);

      expect(result.userMessage).toContain('Could not find');
      expect(result.userMessage).toContain(mockStep.instruction);
    });

    it('should include step information in messages', () => {
      const result = categorizeError(mockStep, {
        success: false,
        error: 'Failed',
      } as HybridExecutionResult);

      expect(result.message).toContain('Step 1');
      expect(result.message).toContain('click');
    });
  });

  describe('Recovery Suggestions', () => {
    it('should provide timeout recovery suggestions', () => {
      const result = categorizeError(mockStep, {
        success: false,
        error: 'Timed out',
      } as HybridExecutionResult);

      expect(result.suggestions.length).toBeGreaterThan(0);
      expect(result.suggestions.some(s => s.action === 'retry')).toBe(true);
      expect(result.suggestions.some(s => s.text.includes('timeout'))).toBe(true);
    });

    it('should provide not found recovery suggestions', () => {
      const result = categorizeError(mockStep, {
        success: false,
        error: 'Element not found',
      } as HybridExecutionResult);

      expect(result.suggestions.length).toBeGreaterThan(0);
      expect(result.suggestions.some(s => s.action === 'edit')).toBe(true);
      expect(result.suggestions.some(s => s.action === 'retry')).toBe(true);
      expect(result.suggestions.some(s => s.text.includes('selector'))).toBe(true);
    });

    it('should provide network recovery suggestions', () => {
      const result = categorizeError(mockStep, {
        success: false,
        error: 'Network error',
      } as HybridExecutionResult);

      expect(result.suggestions.length).toBeGreaterThan(0);
      expect(result.suggestions.some(s => s.action === 'retry')).toBe(true);
      expect(result.suggestions.some(s => s.text.includes('connection'))).toBe(true);
    });

    it('should provide permission recovery suggestions', () => {
      const result = categorizeError(mockStep, {
        success: false,
        error: 'Permission denied',
      } as HybridExecutionResult);

      expect(result.suggestions.length).toBeGreaterThan(0);
      expect(result.suggestions.some(s => s.action === 'manual')).toBe(true);
      expect(result.suggestions.some(s => s.text.includes('permission'))).toBe(true);
    });

    it('should provide bot detection recovery suggestions', () => {
      const result = categorizeError(mockStep, {
        success: false,
        error: 'CAPTCHA detected',
      } as HybridExecutionResult);

      expect(result.suggestions.length).toBeGreaterThan(0);
      expect(result.suggestions.some(s => s.text.includes('image-based'))).toBe(true);
      expect(result.suggestions.some(s => s.text.includes('CAPTCHA'))).toBe(true);
    });

    it('should sort suggestions by priority', () => {
      const result = categorizeError(mockStep, {
        success: false,
        error: 'Element not found',
      } as HybridExecutionResult);

      // Verify suggestions are sorted by priority (descending)
      for (let i = 0; i < result.suggestions.length - 1; i++) {
        expect(result.suggestions[i].priority).toBeGreaterThanOrEqual(
          result.suggestions[i + 1].priority
        );
      }
    });

    it('should include suggestion details', () => {
      const result = categorizeError(mockStep, {
        success: false,
        error: 'Element not found',
      } as HybridExecutionResult);

      const editSuggestion = result.suggestions.find(s => s.action === 'edit');
      expect(editSuggestion).toBeDefined();
      expect(editSuggestion?.details).toBeDefined();
      expect(editSuggestion?.details).not.toBe('');
    });
  });

  describe('Error Formatting', () => {
    it('should format error for display', () => {
      const categorized = categorizeError(mockStep, {
        success: false,
        error: 'Element not found',
      } as HybridExecutionResult);

      const formatted = formatErrorForDisplay(categorized);

      expect(formatted).toContain('❌');
      expect(formatted).toContain('📋');
      expect(formatted).toContain('💡');
      expect(formatted).toContain('Suggestions:');
    });

    it('should include error message in formatted output', () => {
      const categorized = categorizeError(mockStep, {
        success: false,
        error: 'Element not found',
      } as HybridExecutionResult);

      const formatted = formatErrorForDisplay(categorized);

      expect(formatted).toContain(categorized.message);
      expect(formatted).toContain(categorized.userMessage);
    });

    it('should include suggestions in formatted output', () => {
      const categorized = categorizeError(mockStep, {
        success: false,
        error: 'Element not found',
      } as HybridExecutionResult);

      const formatted = formatErrorForDisplay(categorized);

      categorized.suggestions.forEach(suggestion => {
        expect(formatted).toContain(suggestion.text);
      });
    });

    it('should number suggestions in formatted output', () => {
      const categorized = categorizeError(mockStep, {
        success: false,
        error: 'Element not found',
      } as HybridExecutionResult);

      const formatted = formatErrorForDisplay(categorized);

      expect(formatted).toMatch(/1\./);
      expect(formatted).toMatch(/2\./);
    });
  });

  describe('Error Icons and Colors', () => {
    it('should return correct icon for critical severity', () => {
      expect(getErrorIcon('critical')).toBe('🔴');
    });

    it('should return correct icon for high severity', () => {
      expect(getErrorIcon('high')).toBe('🟠');
    });

    it('should return correct icon for medium severity', () => {
      expect(getErrorIcon('medium')).toBe('🟡');
    });

    it('should return correct icon for low severity', () => {
      expect(getErrorIcon('low')).toBe('🟢');
    });

    it('should return correct color for critical severity', () => {
      expect(getErrorColor('critical')).toBe('#dc2626');
    });

    it('should return correct color for high severity', () => {
      expect(getErrorColor('high')).toBe('#ea580c');
    });

    it('should return correct color for medium severity', () => {
      expect(getErrorColor('medium')).toBe('#ca8a04');
    });

    it('should return correct color for low severity', () => {
      expect(getErrorColor('low')).toBe('#16a34a');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty error message', () => {
      const result = categorizeError(mockStep, {
        success: false,
        error: '',
      } as HybridExecutionResult);

      expect(result.category).toBe('unexpected');
      expect(result.message).toBeDefined();
      expect(result.suggestions.length).toBeGreaterThan(0);
    });

    it('should handle very long error messages', () => {
      const longError = 'Error: ' + 'x'.repeat(1000);
      const result = categorizeError(mockStep, {
        success: false,
        error: longError,
      } as HybridExecutionResult);

      expect(result.originalError).toBe(longError);
      expect(result.message).toBeDefined();
    });

    it('should handle special characters in error messages', () => {
      const result = categorizeError(mockStep, {
        success: false,
        error: 'Error: <script>alert("xss")</script>',
      } as HybridExecutionResult);

      expect(result.originalError).toContain('<script>');
      expect(result.message).toBeDefined();
    });

    it('should handle multiple error indicators', () => {
      const result = categorizeError(mockStep, {
        success: false,
        error: 'Network timeout: element not found',
      } as HybridExecutionResult);

      // Should prioritize first match in detection order (timeout is checked first)
      expect(result.category).toBe('timeout');
    });
  });

  describe('Context-Aware Suggestions', () => {
    it('should suggest image-based automation for not found errors', () => {
      const result = categorizeError(mockStep, {
        success: false,
        error: 'Element not found',
      } as HybridExecutionResult);

      const imageSuggestion = result.suggestions.find(
        s => s.text.includes('image-based')
      );
      expect(imageSuggestion).toBeDefined();
    });

    it('should suggest manual completion for permission errors', () => {
      const result = categorizeError(mockStep, {
        success: false,
        error: 'Permission denied',
      } as HybridExecutionResult);

      const manualSuggestion = result.suggestions.find(
        s => s.action === 'manual'
      );
      expect(manualSuggestion).toBeDefined();
    });

    it('should suggest abort for critical errors', () => {
      const result = categorizeError(mockStep, {
        success: false,
        error: 'Cloudflare challenge',
      } as HybridExecutionResult);

      const abortSuggestion = result.suggestions.find(
        s => s.action === 'abort'
      );
      expect(abortSuggestion).toBeDefined();
    });
  });
});
