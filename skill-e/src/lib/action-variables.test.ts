/**
 * Tests for Action Variable Extraction
 * Requirements: FR-7.2, FR-7.4
 */

import { describe, it, expect } from 'vitest';
import { extractActionVariables, type ActionEvent } from './action-variables';
import { VariableType } from '../types/variables';
import type { SelectedElement } from '../stores/overlay';

describe('extractActionVariables', () => {
  describe('Text Input Detection', () => {
    it('should detect email input as text variable', () => {
      const actions: ActionEvent[] = [
        {
          type: 'keyboard',
          timestamp: 1000,
          keyboard: {
            currentText: 'john@example.com',
            isPasswordField: false,
            modifiers: { shift: false, ctrl: false, alt: false, meta: false },
            displayPosition: 'bottom-left',
            isVisible: true,
          },
        },
      ];

      const hints = extractActionVariables(actions);

      expect(hints).toHaveLength(1);
      expect(hints[0].suggestedName).toBe('email');
      expect(hints[0].type).toBe(VariableType.TEXT);
      expect(hints[0].value).toBe('john@example.com');
      expect(hints[0].confidence).toBeGreaterThan(0.8);
      expect(hints[0].actionType).toBe('text_input');
    });

    it('should detect password field input', () => {
      const actions: ActionEvent[] = [
        {
          type: 'keyboard',
          timestamp: 1000,
          keyboard: {
            currentText: 'mySecretPassword123',
            isPasswordField: true,
            modifiers: { shift: false, ctrl: false, alt: false, meta: false },
            displayPosition: 'bottom-left',
            isVisible: true,
          },
        },
      ];

      const hints = extractActionVariables(actions);

      expect(hints).toHaveLength(1);
      expect(hints[0].suggestedName).toBe('password');
      expect(hints[0].type).toBe(VariableType.TEXT);
      expect(hints[0].confidence).toBeGreaterThan(0.9);
      expect(hints[0].context).toContain('Password');
    });

    it('should detect phone number input', () => {
      const actions: ActionEvent[] = [
        {
          type: 'keyboard',
          timestamp: 1000,
          keyboard: {
            currentText: '+1 (555) 123-4567',
            isPasswordField: false,
            modifiers: { shift: false, ctrl: false, alt: false, meta: false },
            displayPosition: 'bottom-left',
            isVisible: true,
          },
        },
      ];

      const hints = extractActionVariables(actions);

      expect(hints).toHaveLength(1);
      expect(hints[0].suggestedName).toBe('phone');
      expect(hints[0].type).toBe(VariableType.TEXT);
      expect(hints[0].confidence).toBeGreaterThan(0.8);
    });

    it('should detect numeric input', () => {
      const actions: ActionEvent[] = [
        {
          type: 'keyboard',
          timestamp: 1000,
          keyboard: {
            currentText: '42.50',
            isPasswordField: false,
            modifiers: { shift: false, ctrl: false, alt: false, meta: false },
            displayPosition: 'bottom-left',
            isVisible: true,
          },
        },
      ];

      const hints = extractActionVariables(actions);

      expect(hints).toHaveLength(1);
      expect(hints[0].suggestedName).toBe('number');
      expect(hints[0].type).toBe(VariableType.NUMBER);
    });

    it('should detect date input', () => {
      const actions: ActionEvent[] = [
        {
          type: 'keyboard',
          timestamp: 1000,
          keyboard: {
            currentText: '2024-01-15',
            isPasswordField: false,
            modifiers: { shift: false, ctrl: false, alt: false, meta: false },
            displayPosition: 'bottom-left',
            isVisible: true,
          },
        },
      ];

      const hints = extractActionVariables(actions);

      expect(hints).toHaveLength(1);
      expect(hints[0].suggestedName).toBe('date');
      expect(hints[0].type).toBe(VariableType.DATE);
    });

    it('should detect file path input', () => {
      const actions: ActionEvent[] = [
        {
          type: 'keyboard',
          timestamp: 1000,
          keyboard: {
            currentText: 'C:\\Users\\Documents\\report.pdf',
            isPasswordField: false,
            modifiers: { shift: false, ctrl: false, alt: false, meta: false },
            displayPosition: 'bottom-left',
            isVisible: true,
          },
        },
      ];

      const hints = extractActionVariables(actions);

      expect(hints).toHaveLength(1);
      expect(hints[0].suggestedName).toBe('filePath');
      expect(hints[0].type).toBe(VariableType.FILE);
    });

    it('should detect name pattern (capitalized words)', () => {
      const actions: ActionEvent[] = [
        {
          type: 'keyboard',
          timestamp: 1000,
          keyboard: {
            currentText: 'John Smith',
            isPasswordField: false,
            modifiers: { shift: false, ctrl: false, alt: false, meta: false },
            displayPosition: 'bottom-left',
            isVisible: true,
          },
        },
      ];

      const hints = extractActionVariables(actions);

      expect(hints).toHaveLength(1);
      expect(hints[0].suggestedName).toBe('name');
      expect(hints[0].type).toBe(VariableType.TEXT);
    });

    it('should skip very short inputs', () => {
      const actions: ActionEvent[] = [
        {
          type: 'keyboard',
          timestamp: 1000,
          keyboard: {
            currentText: 'a',
            isPasswordField: false,
            modifiers: { shift: false, ctrl: false, alt: false, meta: false },
            displayPosition: 'bottom-left',
            isVisible: true,
          },
        },
      ];

      const hints = extractActionVariables(actions);

      expect(hints).toHaveLength(0);
    });

    it('should group continuous text inputs into sessions', () => {
      const actions: ActionEvent[] = [
        {
          type: 'keyboard',
          timestamp: 1000,
          keyboard: {
            currentText: 'john',
            isPasswordField: false,
            modifiers: { shift: false, ctrl: false, alt: false, meta: false },
            displayPosition: 'bottom-left',
            isVisible: true,
          },
        },
        {
          type: 'keyboard',
          timestamp: 1500,
          keyboard: {
            currentText: 'john@',
            isPasswordField: false,
            modifiers: { shift: false, ctrl: false, alt: false, meta: false },
            displayPosition: 'bottom-left',
            isVisible: true,
          },
        },
        {
          type: 'keyboard',
          timestamp: 2000,
          keyboard: {
            currentText: 'john@example.com',
            isPasswordField: false,
            modifiers: { shift: false, ctrl: false, alt: false, meta: false },
            displayPosition: 'bottom-left',
            isVisible: true,
          },
        },
      ];

      const hints = extractActionVariables(actions);

      // Should group into one session with final text
      expect(hints).toHaveLength(1);
      expect(hints[0].value).toBe('john@example.com');
      expect(hints[0].suggestedName).toBe('email');
    });
  });

  describe('Element Selection Detection', () => {
    it('should detect dropdown selection', () => {
      const element: SelectedElement = {
        cssSelector: 'select#country',
        xpath: '//*[@id="country"]',
        tagName: 'select',
        textContent: 'United States',
        boundingBox: { x: 100, y: 100, width: 200, height: 30 },
        timestamp: 1000,
      };

      const actions: ActionEvent[] = [
        {
          type: 'element_selection',
          timestamp: 1000,
          element,
        },
      ];

      const hints = extractActionVariables(actions);

      expect(hints).toHaveLength(1);
      expect(hints[0].suggestedName).toBe('country');
      expect(hints[0].type).toBe(VariableType.SELECTION);
      expect(hints[0].value).toBe('United States');
      expect(hints[0].actionType).toBe('dropdown');
      expect(hints[0].confidence).toBeGreaterThan(0.8);
    });

    it('should detect file upload input', () => {
      const element: SelectedElement = {
        cssSelector: 'input[type="file"]#document',
        xpath: '//*[@id="document"]',
        tagName: 'input',
        textContent: 'report.pdf',
        boundingBox: { x: 100, y: 100, width: 200, height: 30 },
        timestamp: 1000,
      };

      const actions: ActionEvent[] = [
        {
          type: 'element_selection',
          timestamp: 1000,
          element,
        },
      ];

      const hints = extractActionVariables(actions);

      expect(hints).toHaveLength(1);
      expect(hints[0].suggestedName).toBe('file');
      expect(hints[0].type).toBe(VariableType.FILE);
      expect(hints[0].actionType).toBe('file_upload');
      expect(hints[0].confidence).toBeGreaterThan(0.85);
    });

    it('should detect date input field', () => {
      const element: SelectedElement = {
        cssSelector: 'input[type="date"]#birthdate',
        xpath: '//*[@id="birthdate"]',
        tagName: 'input',
        textContent: '2024-01-15',
        boundingBox: { x: 100, y: 100, width: 200, height: 30 },
        timestamp: 1000,
      };

      const actions: ActionEvent[] = [
        {
          type: 'element_selection',
          timestamp: 1000,
          element,
        },
      ];

      const hints = extractActionVariables(actions);

      expect(hints).toHaveLength(1);
      expect(hints[0].suggestedName).toBe('birthdate');
      expect(hints[0].type).toBe(VariableType.DATE);
      expect(hints[0].actionType).toBe('form_field');
    });

    it('should detect number input field', () => {
      const element: SelectedElement = {
        cssSelector: 'input[type="number"]#age',
        xpath: '//*[@id="age"]',
        tagName: 'input',
        textContent: '25',
        boundingBox: { x: 100, y: 100, width: 200, height: 30 },
        timestamp: 1000,
      };

      const actions: ActionEvent[] = [
        {
          type: 'element_selection',
          timestamp: 1000,
          element,
        },
      ];

      const hints = extractActionVariables(actions);

      expect(hints).toHaveLength(1);
      expect(hints[0].suggestedName).toBe('age');
      expect(hints[0].type).toBe(VariableType.NUMBER);
    });

    it('should detect textarea element', () => {
      const element: SelectedElement = {
        cssSelector: 'textarea#comments',
        xpath: '//*[@id="comments"]',
        tagName: 'textarea',
        textContent: 'This is a long comment...',
        boundingBox: { x: 100, y: 100, width: 400, height: 100 },
        timestamp: 1000,
      };

      const actions: ActionEvent[] = [
        {
          type: 'element_selection',
          timestamp: 1000,
          element,
        },
      ];

      const hints = extractActionVariables(actions);

      expect(hints).toHaveLength(1);
      expect(hints[0].suggestedName).toBe('comments');
      expect(hints[0].type).toBe(VariableType.TEXT);
      expect(hints[0].actionType).toBe('form_field');
    });

    it('should extract field name from name attribute', () => {
      const element: SelectedElement = {
        cssSelector: 'input[name="user_email"]',
        xpath: '//input[@name="user_email"]',
        tagName: 'input',
        textContent: 'test@example.com',
        boundingBox: { x: 100, y: 100, width: 200, height: 30 },
        timestamp: 1000,
      };

      const actions: ActionEvent[] = [
        {
          type: 'element_selection',
          timestamp: 1000,
          element,
        },
      ];

      const hints = extractActionVariables(actions);

      expect(hints).toHaveLength(1);
      expect(hints[0].fieldName).toBe('useremail');
    });

    it('should extract field name from semantic class names', () => {
      const element: SelectedElement = {
        cssSelector: 'input.email-input',
        xpath: '//input[@class="email-input"]',
        tagName: 'input',
        textContent: 'test@example.com',
        boundingBox: { x: 100, y: 100, width: 200, height: 30 },
        timestamp: 1000,
      };

      const actions: ActionEvent[] = [
        {
          type: 'element_selection',
          timestamp: 1000,
          element,
        },
      ];

      const hints = extractActionVariables(actions);

      expect(hints).toHaveLength(1);
      expect(hints[0].fieldName).toBe('email');
    });
  });

  describe('Deduplication', () => {
    it('should deduplicate hints with same name and type, keeping highest confidence', () => {
      const actions: ActionEvent[] = [
        {
          type: 'keyboard',
          timestamp: 1000,
          keyboard: {
            currentText: 'test@example.com',
            isPasswordField: false,
            modifiers: { shift: false, ctrl: false, alt: false, meta: false },
            displayPosition: 'bottom-left',
            isVisible: true,
          },
        },
        {
          type: 'element_selection',
          timestamp: 2000,
          element: {
            cssSelector: 'input#email',
            xpath: '//*[@id="email"]',
            tagName: 'input',
            textContent: 'test@example.com',
            boundingBox: { x: 100, y: 100, width: 200, height: 30 },
            timestamp: 2000,
          },
        },
      ];

      const hints = extractActionVariables(actions);

      // Should have only one email hint (highest confidence)
      const emailHints = hints.filter(h => h.suggestedName === 'email');
      expect(emailHints.length).toBeLessThanOrEqual(1);
    });
  });

  describe('Mixed Actions', () => {
    it('should handle multiple different action types', () => {
      const actions: ActionEvent[] = [
        {
          type: 'keyboard',
          timestamp: 1000,
          keyboard: {
            currentText: 'john@example.com',
            isPasswordField: false,
            modifiers: { shift: false, ctrl: false, alt: false, meta: false },
            displayPosition: 'bottom-left',
            isVisible: true,
          },
        },
        {
          type: 'keyboard',
          timestamp: 5000,
          keyboard: {
            currentText: 'myPassword123',
            isPasswordField: true,
            modifiers: { shift: false, ctrl: false, alt: false, meta: false },
            displayPosition: 'bottom-left',
            isVisible: true,
          },
        },
        {
          type: 'element_selection',
          timestamp: 8000,
          element: {
            cssSelector: 'select#country',
            xpath: '//*[@id="country"]',
            tagName: 'select',
            textContent: 'United States',
            boundingBox: { x: 100, y: 100, width: 200, height: 30 },
            timestamp: 8000,
          },
        },
      ];

      const hints = extractActionVariables(actions);

      expect(hints.length).toBeGreaterThanOrEqual(3);
      
      const emailHint = hints.find(h => h.suggestedName === 'email');
      expect(emailHint).toBeDefined();
      expect(emailHint?.type).toBe(VariableType.TEXT);
      
      const passwordHint = hints.find(h => h.suggestedName === 'password');
      expect(passwordHint).toBeDefined();
      expect(passwordHint?.type).toBe(VariableType.TEXT);
      
      const countryHint = hints.find(h => h.suggestedName === 'country');
      expect(countryHint).toBeDefined();
      expect(countryHint?.type).toBe(VariableType.SELECTION);
    });
  });
});
