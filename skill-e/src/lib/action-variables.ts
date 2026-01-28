/**
 * Action Variable Extraction
 * 
 * Analyzes user actions (clicks, keyboard inputs, element selections) to detect
 * potential variables based on interaction patterns.
 * 
 * Requirements: FR-7.2, FR-7.4
 * 
 * @module lib/action-variables
 */

import { VariableType } from '../types/variables';
import type { ClickIndicator, KeyboardState, SelectedElement } from '../stores/overlay';

/**
 * Result of extracting a variable from an action
 */
export interface ActionVariableHint {
  /** Suggested variable name derived from context */
  suggestedName: string;
  
  /** Variable type based on action type */
  type: VariableType;
  
  /** The value entered/selected during the action */
  value: string;
  
  /** Confidence score (0-1) based on action characteristics */
  confidence: number;
  
  /** Type of action that suggested this variable */
  actionType: 'text_input' | 'selection' | 'file_upload' | 'dropdown' | 'form_field';
  
  /** Timestamp when the action occurred */
  timestamp: number;
  
  /** Field name extracted from OCR or element attributes (if available) */
  fieldName?: string;
  
  /** Additional context about the action */
  context?: string;
}

/**
 * Action event that can be analyzed for variables
 */
export interface ActionEvent {
  /** Type of action */
  type: 'click' | 'keyboard' | 'element_selection';
  
  /** Timestamp of the action */
  timestamp: number;
  
  /** Click data (if type is 'click') */
  click?: ClickIndicator;
  
  /** Keyboard data (if type is 'keyboard') */
  keyboard?: KeyboardState;
  
  /** Element selection data (if type is 'element_selection') */
  element?: SelectedElement;
  
  /** OCR text from the screen at this moment (optional) */
  ocrText?: string;
}

/**
 * Extracts variable hints from a sequence of action events
 * 
 * Analyzes user interactions to identify:
 * - Text inputs → text variables
 * - Dropdown/select actions → selection variables
 * - File upload actions → file variables
 * - Form field interactions → typed variables
 * 
 * @param actions - Array of action events to analyze
 * @returns Array of detected variable hints from actions
 * 
 * @example
 * ```typescript
 * const actions = [
 *   { type: 'keyboard', timestamp: 1000, keyboard: { currentText: 'john@example.com', ... } },
 *   { type: 'element_selection', timestamp: 2000, element: { tagName: 'select', ... } }
 * ];
 * const hints = extractActionVariables(actions);
 * ```
 */
export function extractActionVariables(actions: ActionEvent[]): ActionVariableHint[] {
  const hints: ActionVariableHint[] = [];
  
  // Group keyboard events by proximity to detect complete text inputs
  const textInputs = groupTextInputs(actions);
  
  for (const input of textInputs) {
    const hint = analyzeTextInput(input);
    if (hint) {
      hints.push(hint);
    }
  }
  
  // Analyze element selections for dropdowns and form fields
  for (const action of actions) {
    if (action.type === 'element_selection' && action.element) {
      const hint = analyzeElementSelection(action.element, action.timestamp, action.ocrText);
      if (hint) {
        hints.push(hint);
      }
    }
  }
  
  // Deduplicate and sort by confidence
  return deduplicateActionHints(hints);
}

/**
 * Groups keyboard events into logical text input sessions
 * Text inputs are grouped if they occur within 2 seconds of each other
 */
function groupTextInputs(actions: ActionEvent[]): TextInputSession[] {
  const sessions: TextInputSession[] = [];
  let currentSession: TextInputSession | null = null;
  const SESSION_GAP_MS = 2000; // 2 seconds
  
  for (const action of actions) {
    if (action.type === 'keyboard' && action.keyboard && action.keyboard.currentText) {
      const text = action.keyboard.currentText;
      const timestamp = action.timestamp;
      const isPasswordField = action.keyboard.isPasswordField;
      
      // Start new session or continue existing one
      if (!currentSession || timestamp - currentSession.endTimestamp > SESSION_GAP_MS) {
        // Start new session
        if (currentSession) {
          sessions.push(currentSession);
        }
        currentSession = {
          text,
          startTimestamp: timestamp,
          endTimestamp: timestamp,
          isPasswordField,
          keyboardStates: [action.keyboard],
        };
      } else {
        // Continue existing session
        currentSession.text = text; // Update to latest text
        currentSession.endTimestamp = timestamp;
        currentSession.keyboardStates.push(action.keyboard);
      }
    }
  }
  
  // Add final session
  if (currentSession) {
    sessions.push(currentSession);
  }
  
  return sessions;
}

/**
 * A session of continuous text input
 */
interface TextInputSession {
  text: string;
  startTimestamp: number;
  endTimestamp: number;
  isPasswordField: boolean;
  keyboardStates: KeyboardState[];
}

/**
 * Analyzes a text input session to extract variable hints
 */
function analyzeTextInput(session: TextInputSession): ActionVariableHint | null {
  const { text, startTimestamp, isPasswordField } = session;
  
  // Skip very short inputs (likely not variables)
  if (text.length < 2) {
    return null;
  }
  
  // Determine variable type and name based on content
  const analysis = analyzeTextContent(text, isPasswordField);
  
  return {
    suggestedName: analysis.suggestedName,
    type: analysis.type,
    value: text,
    confidence: analysis.confidence,
    actionType: 'text_input',
    timestamp: startTimestamp,
    fieldName: analysis.fieldName,
    context: isPasswordField ? 'Password field detected' : undefined,
  };
}

/**
 * Analyzes text content to determine variable type and name
 */
function analyzeTextContent(
  text: string,
  isPasswordField: boolean
): {
  suggestedName: string;
  type: VariableType;
  confidence: number;
  fieldName?: string;
} {
  // Password fields
  if (isPasswordField) {
    return {
      suggestedName: 'password',
      type: VariableType.TEXT,
      confidence: 0.95,
      fieldName: 'password',
    };
  }
  
  // Email pattern
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) {
    return {
      suggestedName: 'email',
      type: VariableType.TEXT,
      confidence: 0.9,
      fieldName: 'email',
    };
  }
  
  // Date pattern (various formats) - check before phone to avoid confusion
  if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$/.test(text) || /^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}$/.test(text)) {
    return {
      suggestedName: 'date',
      type: VariableType.DATE,
      confidence: 0.85,
      fieldName: 'date',
    };
  }
  
  // Phone number pattern - must have phone-like formatting (spaces, parens, or plus)
  if (/^[\d\s\-\(\)\+]{8,}$/.test(text) && (/[\s\(\)\+]/.test(text) || text.split('-').length > 3)) {
    return {
      suggestedName: 'phone',
      type: VariableType.TEXT,
      confidence: 0.85,
      fieldName: 'phone',
    };
  }
  
  // Number pattern
  if (/^\d+(\.\d+)?$/.test(text)) {
    return {
      suggestedName: 'number',
      type: VariableType.NUMBER,
      confidence: 0.8,
      fieldName: 'number',
    };
  }
  
  // URL pattern
  if (/^https?:\/\/.+/.test(text)) {
    return {
      suggestedName: 'url',
      type: VariableType.TEXT,
      confidence: 0.85,
      fieldName: 'url',
    };
  }
  
  // File path pattern
  if (/^[A-Za-z]:\\|^\/|^\.\//.test(text) || /\.(pdf|doc|docx|xls|xlsx|txt|csv|jpg|png)$/i.test(text)) {
    return {
      suggestedName: 'filePath',
      type: VariableType.FILE,
      confidence: 0.8,
      fieldName: 'filePath',
    };
  }
  
  // Name pattern (capitalized words)
  if (/^[A-Z][a-z]+(\s[A-Z][a-z]+)+$/.test(text)) {
    return {
      suggestedName: 'name',
      type: VariableType.TEXT,
      confidence: 0.7,
      fieldName: 'name',
    };
  }
  
  // Generic text input
  return {
    suggestedName: 'textInput',
    type: VariableType.TEXT,
    confidence: 0.6,
  };
}

/**
 * Analyzes an element selection to extract variable hints
 */
function analyzeElementSelection(
  element: SelectedElement,
  timestamp: number,
  ocrText?: string
): ActionVariableHint | null {
  const { tagName, textContent, cssSelector } = element;
  
  // Detect dropdown/select elements
  if (tagName.toLowerCase() === 'select') {
    const fieldName = extractFieldNameFromSelector(cssSelector, ocrText);
    
    return {
      suggestedName: fieldName || 'selection',
      type: VariableType.SELECTION,
      value: textContent,
      confidence: 0.85,
      actionType: 'dropdown',
      timestamp,
      fieldName,
      context: 'Dropdown selection detected',
    };
  }
  
  // Detect input elements
  if (tagName.toLowerCase() === 'input') {
    const inputType = extractInputType(cssSelector);
    
    // File input
    if (inputType === 'file') {
      return {
        suggestedName: 'file',
        type: VariableType.FILE,
        value: textContent,
        confidence: 0.9,
        actionType: 'file_upload',
        timestamp,
        fieldName: extractFieldNameFromSelector(cssSelector, ocrText),
        context: 'File upload input detected',
      };
    }
    
    // Date input
    if (inputType === 'date') {
      const fieldName = extractFieldNameFromSelector(cssSelector, ocrText);
      return {
        suggestedName: fieldName || 'date',
        type: VariableType.DATE,
        value: textContent,
        confidence: 0.9,
        actionType: 'form_field',
        timestamp,
        fieldName,
        context: 'Date input detected',
      };
    }
    
    // Number input
    if (inputType === 'number') {
      const fieldName = extractFieldNameFromSelector(cssSelector, ocrText);
      return {
        suggestedName: fieldName || 'number',
        type: VariableType.NUMBER,
        value: textContent,
        confidence: 0.85,
        actionType: 'form_field',
        timestamp,
        fieldName,
        context: 'Number input detected',
      };
    }
    
    // Generic input field
    const fieldName = extractFieldNameFromSelector(cssSelector, ocrText);
    return {
      suggestedName: fieldName || 'input',
      type: VariableType.TEXT,
      value: textContent,
      confidence: 0.7,
      actionType: 'form_field',
      timestamp,
      fieldName,
      context: 'Form input detected',
    };
  }
  
  // Detect textarea elements
  if (tagName.toLowerCase() === 'textarea') {
    const fieldName = extractFieldNameFromSelector(cssSelector, ocrText);
    
    return {
      suggestedName: fieldName || 'textArea',
      type: VariableType.TEXT,
      value: textContent,
      confidence: 0.75,
      actionType: 'form_field',
      timestamp,
      fieldName,
      context: 'Text area detected',
    };
  }
  
  return null;
}

/**
 * Extracts field name from CSS selector or nearby OCR text
 */
function extractFieldNameFromSelector(cssSelector: string, ocrText?: string): string | undefined {
  // Try to extract from id attribute
  const idMatch = cssSelector.match(/#([a-zA-Z][\w-]*)/);
  if (idMatch) {
    return cleanFieldName(idMatch[1]);
  }
  
  // Try to extract from name attribute
  const nameMatch = cssSelector.match(/\[name=["']?([^"'\]]+)["']?\]/);
  if (nameMatch) {
    return cleanFieldName(nameMatch[1]);
  }
  
  // Try to extract from class names (look for semantic classes)
  const classMatch = cssSelector.match(/\.(email|phone|name|address|city|zip|postal|country|username|password|search|query)[\w-]*/i);
  if (classMatch) {
    return cleanFieldName(classMatch[1]);
  }
  
  // Try to extract from OCR text (look for labels near the field)
  if (ocrText) {
    const labelMatch = ocrText.match(/([A-Za-z]+)\s*:?\s*$/);
    if (labelMatch) {
      return cleanFieldName(labelMatch[1]);
    }
  }
  
  return undefined;
}

/**
 * Extracts input type from CSS selector
 */
function extractInputType(cssSelector: string): string | undefined {
  const typeMatch = cssSelector.match(/\[type=["']?([^"'\]]+)["']?\]/);
  return typeMatch ? typeMatch[1] : undefined;
}

/**
 * Cleans and normalizes a field name
 */
function cleanFieldName(name: string): string {
  return name
    .replace(/[-_]/g, '')
    .replace(/([A-Z])/g, (_match, letter, offset) => 
      offset > 0 ? letter.toLowerCase() : letter.toLowerCase()
    )
    .trim();
}

/**
 * Deduplicates action hints, keeping the highest confidence for each name
 */
function deduplicateActionHints(hints: ActionVariableHint[]): ActionVariableHint[] {
  const hintMap = new Map<string, ActionVariableHint>();
  
  for (const hint of hints) {
    const key = `${hint.suggestedName}_${hint.type}`;
    const existing = hintMap.get(key);
    
    if (!existing || hint.confidence > existing.confidence) {
      hintMap.set(key, hint);
    }
  }
  
  return Array.from(hintMap.values())
    .sort((a, b) => b.confidence - a.confidence); // Sort by confidence descending
}
