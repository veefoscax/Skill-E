/**
 * Semantic Judge Tests
 * 
 * Tests for LLM-based skill quality validation.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  validateSkillSemantics,
  getGrade,
  getScoreColor,
  getScoreLabel,
  formatValidationResultMarkdown,
  type SemanticValidationResult,
} from './semantic-judge';
import type { Provider, Message } from './providers/types';

// Mock provider for testing
class MockProvider implements Provider {
  type = 'openrouter' as const;
  name = 'Mock Provider';
  requiresApiKey = false;
  supportsStreaming = true;
  
  private mockResponse: string;
  
  constructor(mockResponse: string) {
    this.mockResponse = mockResponse;
  }
  
  async *chat(messages: Message[]): AsyncIterable<string> {
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

// Mock the provider factory
vi.mock('./providers/factory', () => ({
  createProvider: vi.fn((config) => {
    // Return a mock provider that will be configured by tests
    return new MockProvider('{}');
  }),
}));

describe('semantic-judge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  describe('validateSkillSemantics', () => {
    it('should validate a high-quality skill', async () => {
      const { createProvider } = await import('./providers/factory');
      
      // Mock a high-quality response
      const mockResponse = JSON.stringify({
        safety: 95,
        clarity: 92,
        completeness: 90,
        strengths: [
          'Includes PAUSE markers before destructive actions',
          'Clear step-by-step instructions',
          'Comprehensive verification checklist',
        ],
        weaknesses: [
          'Could add more troubleshooting tips',
        ],
        recommendations: [
          'Add a troubleshooting section for common errors',
        ],
      });
      
      vi.mocked(createProvider).mockReturnValue(new MockProvider(mockResponse));
      
      const result = await validateSkillSemantics(
        'Create a new GitHub repository',
        '# Create GitHub Repo\n\nSteps...',
      );
      
      expect(result.score).toBeGreaterThanOrEqual(90);
      expect(result.isVerified).toBe(true);
      expect(result.dimensions.safety).toBe(95);
      expect(result.dimensions.clarity).toBe(92);
      expect(result.dimensions.completeness).toBe(90);
      expect(result.strengths).toHaveLength(3);
      expect(result.weaknesses).toHaveLength(1);
      expect(result.recommendations).toHaveLength(1);
    });
    
    it('should validate a medium-quality skill', async () => {
      const { createProvider } = await import('./providers/factory');
      
      const mockResponse = JSON.stringify({
        safety: 70,
        clarity: 75,
        completeness: 65,
        strengths: [
          'Basic instructions are clear',
          'Includes some verification steps',
        ],
        weaknesses: [
          'Missing PAUSE markers for destructive actions',
          'No troubleshooting section',
          'Some steps are ambiguous',
        ],
        recommendations: [
          'Add PAUSE markers before deleting or modifying data',
          'Add a troubleshooting table',
          'Clarify ambiguous steps with more detail',
        ],
      });
      
      vi.mocked(createProvider).mockReturnValue(new MockProvider(mockResponse));
      
      const result = await validateSkillSemantics(
        'Delete old files',
        '# Delete Files\n\nSteps...',
      );
      
      expect(result.score).toBeLessThan(90);
      expect(result.score).toBeGreaterThanOrEqual(50);
      expect(result.isVerified).toBe(false);
      expect(result.dimensions.safety).toBe(70);
      expect(result.weaknesses.length).toBeGreaterThan(0);
    });
    
    it('should validate a low-quality skill', async () => {
      const { createProvider } = await import('./providers/factory');
      
      const mockResponse = JSON.stringify({
        safety: 30,
        clarity: 40,
        completeness: 35,
        strengths: [
          'Attempts to describe the task',
        ],
        weaknesses: [
          'No safety measures or confirmations',
          'Instructions are vague and unclear',
          'Missing critical steps',
          'No verification or error handling',
        ],
        recommendations: [
          'Add PAUSE markers before all destructive actions',
          'Rewrite instructions to be more specific',
          'Add missing steps to complete the workflow',
          'Add verification checklist',
        ],
      });
      
      vi.mocked(createProvider).mockReturnValue(new MockProvider(mockResponse));
      
      const result = await validateSkillSemantics(
        'Delete all user data',
        '# Delete Data\n\nJust delete everything.',
      );
      
      expect(result.score).toBeLessThan(50);
      expect(result.isVerified).toBe(false);
      expect(result.dimensions.safety).toBeLessThan(50);
      expect(result.weaknesses.length).toBeGreaterThan(2);
    });
    
    it('should handle custom weights', async () => {
      const { createProvider } = await import('./providers/factory');
      
      const mockResponse = JSON.stringify({
        safety: 100,
        clarity: 50,
        completeness: 50,
        strengths: ['Very safe'],
        weaknesses: ['Not very clear'],
        recommendations: ['Improve clarity'],
      });
      
      vi.mocked(createProvider).mockReturnValue(new MockProvider(mockResponse));
      
      // With default weights (safety: 0.4, clarity: 0.35, completeness: 0.25)
      const result1 = await validateSkillSemantics(
        'Task',
        'Skill',
      );
      
      // Expected: 100*0.4 + 50*0.35 + 50*0.25 = 40 + 17.5 + 12.5 = 70
      expect(result1.score).toBe(70);
      
      // With custom weights (safety: 0.8, clarity: 0.1, completeness: 0.1)
      const result2 = await validateSkillSemantics(
        'Task',
        'Skill',
        {
          weights: {
            safety: 0.8,
            clarity: 0.1,
            completeness: 0.1,
          },
        },
      );
      
      // Expected: 100*0.8 + 50*0.1 + 50*0.1 = 80 + 5 + 5 = 90
      expect(result2.score).toBe(90);
    });
    
    it('should reject invalid weights', async () => {
      await expect(
        validateSkillSemantics(
          'Task',
          'Skill',
          {
            weights: {
              safety: 0.5,
              clarity: 0.3,
              completeness: 0.1, // Sum = 0.9, not 1.0
            },
          },
        ),
      ).rejects.toThrow('Weights must sum to 1.0');
    });
    
    it('should handle LLM response with markdown code blocks', async () => {
      const { createProvider } = await import('./providers/factory');
      
      const mockResponse = `Here is my evaluation:

\`\`\`json
{
  "safety": 85,
  "clarity": 80,
  "completeness": 75,
  "strengths": ["Good structure"],
  "weaknesses": ["Missing details"],
  "recommendations": ["Add more examples"]
}
\`\`\`

Hope this helps!`;
      
      vi.mocked(createProvider).mockReturnValue(new MockProvider(mockResponse));
      
      const result = await validateSkillSemantics(
        'Task',
        'Skill',
      );
      
      expect(result.score).toBeGreaterThan(0);
      expect(result.dimensions.safety).toBe(85);
    });
    
    it('should handle invalid JSON response gracefully', async () => {
      const { createProvider } = await import('./providers/factory');
      
      const mockResponse = 'This is not valid JSON at all!';
      
      vi.mocked(createProvider).mockReturnValue(new MockProvider(mockResponse));
      
      const result = await validateSkillSemantics(
        'Task',
        'Skill',
      );
      
      expect(result.score).toBe(0);
      expect(result.isVerified).toBe(false);
      expect(result.weaknesses).toContain('Failed to parse LLM response');
      // Raw response includes trailing space from mock streaming
      expect(result.rawResponse?.trim()).toBe(mockResponse);
    });
    
    it('should clamp scores to 0-100 range', async () => {
      const { createProvider } = await import('./providers/factory');
      
      const mockResponse = JSON.stringify({
        safety: 150, // Over 100
        clarity: -10, // Below 0
        completeness: 75,
        strengths: ['Test'],
        weaknesses: ['Test'],
        recommendations: ['Test'],
      });
      
      vi.mocked(createProvider).mockReturnValue(new MockProvider(mockResponse));
      
      const result = await validateSkillSemantics(
        'Task',
        'Skill',
      );
      
      expect(result.dimensions.safety).toBe(100);
      expect(result.dimensions.clarity).toBe(0);
      expect(result.dimensions.completeness).toBe(75);
    });
    
    it('should limit feedback arrays to 5 items', async () => {
      const { createProvider } = await import('./providers/factory');
      
      const mockResponse = JSON.stringify({
        safety: 80,
        clarity: 80,
        completeness: 80,
        strengths: ['1', '2', '3', '4', '5', '6', '7'],
        weaknesses: ['1', '2', '3', '4', '5', '6'],
        recommendations: ['1', '2', '3', '4', '5', '6', '7', '8'],
      });
      
      vi.mocked(createProvider).mockReturnValue(new MockProvider(mockResponse));
      
      const result = await validateSkillSemantics(
        'Task',
        'Skill',
      );
      
      expect(result.strengths).toHaveLength(5);
      expect(result.weaknesses).toHaveLength(5);
      expect(result.recommendations).toHaveLength(5);
    });
  });
  
  describe('getGrade', () => {
    it('should return correct grades', () => {
      expect(getGrade(98)).toBe('A+');
      expect(getGrade(95)).toBe('A');
      expect(getGrade(91)).toBe('A-');
      expect(getGrade(88)).toBe('B+');
      expect(getGrade(85)).toBe('B');
      expect(getGrade(81)).toBe('B-');
      expect(getGrade(78)).toBe('C+');
      expect(getGrade(75)).toBe('C');
      expect(getGrade(71)).toBe('C-');
      expect(getGrade(68)).toBe('D+');
      expect(getGrade(65)).toBe('D');
      expect(getGrade(61)).toBe('D-');
      expect(getGrade(50)).toBe('F');
      expect(getGrade(0)).toBe('F');
    });
  });
  
  describe('getScoreColor', () => {
    it('should return correct colors', () => {
      expect(getScoreColor(95)).toBe('green');
      expect(getScoreColor(90)).toBe('green');
      expect(getScoreColor(85)).toBe('yellow');
      expect(getScoreColor(70)).toBe('yellow');
      expect(getScoreColor(65)).toBe('orange');
      expect(getScoreColor(50)).toBe('orange');
      expect(getScoreColor(45)).toBe('red');
      expect(getScoreColor(0)).toBe('red');
    });
  });
  
  describe('getScoreLabel', () => {
    it('should return correct labels', () => {
      expect(getScoreLabel(95)).toBe('Excellent');
      expect(getScoreLabel(85)).toBe('Very Good');
      expect(getScoreLabel(75)).toBe('Good');
      expect(getScoreLabel(65)).toBe('Fair');
      expect(getScoreLabel(55)).toBe('Needs Improvement');
      expect(getScoreLabel(45)).toBe('Poor');
    });
  });
  
  describe('formatValidationResultMarkdown', () => {
    it('should format a verified result', () => {
      const result: SemanticValidationResult = {
        score: 95,
        dimensions: {
          safety: 95,
          clarity: 92,
          completeness: 90,
        },
        strengths: [
          'Excellent safety measures',
          'Clear instructions',
        ],
        weaknesses: [
          'Minor improvement needed',
        ],
        recommendations: [
          'Add one more example',
        ],
        isVerified: true,
      };
      
      const markdown = formatValidationResultMarkdown(result);
      
      expect(markdown).toContain('# Skill Quality Report');
      expect(markdown).toContain('95/100');
      expect(markdown).toContain('A');
      expect(markdown).toContain('✅ **VERIFIED**');
      expect(markdown).toContain('## Dimension Scores');
      expect(markdown).toContain('**Safety**: 95/100');
      expect(markdown).toContain('## Strengths');
      expect(markdown).toContain('Excellent safety measures');
      expect(markdown).toContain('## Weaknesses');
      expect(markdown).toContain('## Recommendations');
    });
    
    it('should format an unverified result', () => {
      const result: SemanticValidationResult = {
        score: 65,
        dimensions: {
          safety: 60,
          clarity: 70,
          completeness: 65,
        },
        strengths: ['Some good parts'],
        weaknesses: ['Needs work'],
        recommendations: ['Improve safety'],
        isVerified: false,
      };
      
      const markdown = formatValidationResultMarkdown(result);
      
      expect(markdown).toContain('65/100');
      expect(markdown).toContain('⚠️ **NOT VERIFIED**');
      expect(markdown).toContain('needs improvement');
    });
    
    it('should handle empty feedback arrays', () => {
      const result: SemanticValidationResult = {
        score: 50,
        dimensions: {
          safety: 50,
          clarity: 50,
          completeness: 50,
        },
        strengths: [],
        weaknesses: [],
        recommendations: [],
        isVerified: false,
      };
      
      const markdown = formatValidationResultMarkdown(result);
      
      expect(markdown).toContain('# Skill Quality Report');
      expect(markdown).toContain('50/100');
      // Should not have empty sections
      expect(markdown).not.toContain('## Strengths\n\n## ');
    });
  });
});
