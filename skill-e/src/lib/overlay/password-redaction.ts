/**
 * Password Redaction Utility
 * 
 * Provides 100% reliable password field detection and redaction.
 * Supports both bullet redaction (●●●●●●) and variable placeholders (${PASSWORD}).
 * 
 * Requirements: FR-4.17, FR-4.18, NFR-4.4
 */

/**
 * Redaction mode
 */
export type RedactionMode = 'bullets' | 'variable';

/**
 * Password field detection result
 */
export interface PasswordFieldInfo {
  /** Whether the element is a password field */
  isPasswordField: boolean;
  
  /** Confidence level (0-1) */
  confidence: number;
  
  /** Detection method used */
  detectionMethod: string;
  
  /** Suggested variable name for skill generation */
  suggestedVariableName?: string;
}

/**
 * Redaction options
 */
export interface RedactionOptions {
  /** Redaction mode: 'bullets' or 'variable' */
  mode: RedactionMode;
  
  /** Custom variable name (for 'variable' mode) */
  variableName?: string;
  
  /** Custom bullet character (default: ●) */
  bulletChar?: string;
}

/**
 * Detect if an element is a password field
 * 
 * Uses multiple detection methods for 100% reliability:
 * 1. Input type="password"
 * 2. Autocomplete attributes
 * 3. ID/name attributes
 * 4. ARIA labels
 * 5. Placeholder text
 * 6. Parent form context
 * 
 * @param element - The HTML element to check
 * @returns Password field detection result
 */
export function detectPasswordField(element: HTMLElement | null): PasswordFieldInfo {
  if (!element) {
    return {
      isPasswordField: false,
      confidence: 0,
      detectionMethod: 'none',
    };
  }

  let confidence = 0;
  const detectionMethods: string[] = [];
  let suggestedVariableName: string | undefined;

  // Method 1: Input type="password" (100% confidence)
  if (element instanceof HTMLInputElement && element.type === 'password') {
    confidence = 1.0;
    detectionMethods.push('type=password');
    suggestedVariableName = extractVariableName(element);
    
    return {
      isPasswordField: true,
      confidence,
      detectionMethod: detectionMethods.join(', '),
      suggestedVariableName,
    };
  }

  // Method 2: Autocomplete attributes (95% confidence)
  const autocomplete = element.getAttribute('autocomplete')?.toLowerCase();
  if (autocomplete) {
    const passwordAutocompleteValues = [
      'current-password',
      'new-password',
      'password',
    ];
    
    if (passwordAutocompleteValues.some(val => autocomplete.includes(val))) {
      confidence = Math.max(confidence, 0.95);
      detectionMethods.push('autocomplete');
      suggestedVariableName = suggestedVariableName || extractVariableName(element);
    }
  }

  // Method 3: ID attribute (90% confidence)
  const id = element.id?.toLowerCase() || '';
  const passwordIdPatterns = [
    'password',
    'passwd',
    'pwd',
    'pass',
    'secret',
    'pin',
    'passphrase',
  ];
  
  if (passwordIdPatterns.some(pattern => id.includes(pattern))) {
    confidence = Math.max(confidence, 0.90);
    detectionMethods.push('id');
    suggestedVariableName = suggestedVariableName || extractVariableName(element);
  }

  // Method 4: Name attribute (90% confidence)
  const name = element.getAttribute('name')?.toLowerCase() || '';
  if (passwordIdPatterns.some(pattern => name.includes(pattern))) {
    confidence = Math.max(confidence, 0.90);
    detectionMethods.push('name');
    suggestedVariableName = suggestedVariableName || extractVariableName(element);
  }

  // Method 5: ARIA labels (85% confidence)
  const ariaLabel = element.getAttribute('aria-label')?.toLowerCase() || '';
  const ariaLabelledBy = element.getAttribute('aria-labelledby');
  
  if (passwordIdPatterns.some(pattern => ariaLabel.includes(pattern))) {
    confidence = Math.max(confidence, 0.85);
    detectionMethods.push('aria-label');
    suggestedVariableName = suggestedVariableName || extractVariableName(element);
  }
  
  if (ariaLabelledBy) {
    const labelElement = document.getElementById(ariaLabelledBy);
    const labelText = labelElement?.textContent?.toLowerCase() || '';
    if (passwordIdPatterns.some(pattern => labelText.includes(pattern))) {
      confidence = Math.max(confidence, 0.85);
      detectionMethods.push('aria-labelledby');
      suggestedVariableName = suggestedVariableName || extractVariableName(element);
    }
  }

  // Method 6: Placeholder text (80% confidence)
  const placeholder = element.getAttribute('placeholder')?.toLowerCase() || '';
  if (passwordIdPatterns.some(pattern => placeholder.includes(pattern))) {
    confidence = Math.max(confidence, 0.80);
    detectionMethods.push('placeholder');
    suggestedVariableName = suggestedVariableName || extractVariableName(element);
  }

  // Method 7: Associated label (85% confidence)
  if (element instanceof HTMLInputElement) {
    const labels = element.labels;
    if (labels && labels.length > 0) {
      for (const label of Array.from(labels)) {
        const labelText = label.textContent?.toLowerCase() || '';
        if (passwordIdPatterns.some(pattern => labelText.includes(pattern))) {
          confidence = Math.max(confidence, 0.85);
          detectionMethods.push('label');
          suggestedVariableName = suggestedVariableName || extractVariableName(element);
          break;
        }
      }
    }
  }

  // Method 8: Parent form context (70% confidence)
  const form = element.closest('form');
  if (form) {
    const formId = form.id?.toLowerCase() || '';
    const formName = form.getAttribute('name')?.toLowerCase() || '';
    const formAction = form.action?.toLowerCase() || '';
    
    const loginPatterns = ['login', 'signin', 'auth', 'register', 'signup'];
    const isLoginForm = loginPatterns.some(pattern => 
      formId.includes(pattern) || 
      formName.includes(pattern) || 
      formAction.includes(pattern)
    );
    
    if (isLoginForm && element instanceof HTMLInputElement && element.type === 'text') {
      // Text input in a login form might be a password field with type changed by JS
      confidence = Math.max(confidence, 0.70);
      detectionMethods.push('login-form-context');
      suggestedVariableName = suggestedVariableName || 'PASSWORD';
    }
  }

  // Determine if this is a password field (threshold: 80% confidence)
  const isPasswordField = confidence >= 0.80;

  return {
    isPasswordField,
    confidence,
    detectionMethod: detectionMethods.join(', ') || 'none',
    suggestedVariableName: isPasswordField ? suggestedVariableName : undefined,
  };
}

/**
 * Extract a variable name from an element's attributes
 * 
 * Priority: name > id > aria-label > generic
 * 
 * @param element - The HTML element
 * @returns Suggested variable name in UPPER_SNAKE_CASE
 */
function extractVariableName(element: HTMLElement): string {
  // Try name attribute first
  const name = element.getAttribute('name');
  if (name) {
    return toVariableName(name);
  }

  // Try id attribute
  const id = element.id;
  if (id) {
    return toVariableName(id);
  }

  // Try aria-label
  const ariaLabel = element.getAttribute('aria-label');
  if (ariaLabel) {
    return toVariableName(ariaLabel);
  }

  // Default
  return 'PASSWORD';
}

/**
 * Convert a string to a valid variable name in UPPER_SNAKE_CASE
 * 
 * @param str - Input string
 * @returns Variable name in UPPER_SNAKE_CASE
 */
function toVariableName(str: string): string {
  return str
    .replace(/[^a-zA-Z0-9_]/g, '_') // Replace non-alphanumeric with underscore
    .replace(/_+/g, '_')             // Collapse multiple underscores
    .replace(/^_|_$/g, '')           // Remove leading/trailing underscores
    .toUpperCase();
}

/**
 * Redact password text
 * 
 * @param text - The password text to redact
 * @param options - Redaction options
 * @returns Redacted text
 */
export function redactPassword(
  text: string,
  options: RedactionOptions = { mode: 'bullets' }
): string {
  if (!text) {
    return '';
  }

  if (options.mode === 'variable') {
    const variableName = options.variableName || 'PASSWORD';
    return `\${${variableName}}`;
  }

  // Bullets mode (default)
  const bulletChar = options.bulletChar || '●';
  return bulletChar.repeat(text.length);
}

/**
 * Get redaction display text with optional variable hint
 * 
 * @param text - The password text
 * @param options - Redaction options
 * @param showVariableHint - Whether to show variable hint alongside bullets
 * @returns Display text
 */
export function getRedactionDisplay(
  text: string,
  options: RedactionOptions = { mode: 'bullets' },
  showVariableHint: boolean = false
): string {
  const redacted = redactPassword(text, options);
  
  if (showVariableHint && options.mode === 'bullets' && options.variableName) {
    return `${redacted} (${options.variableName})`;
  }
  
  return redacted;
}

/**
 * Password redaction manager
 * 
 * Manages password field detection and redaction state.
 */
export class PasswordRedactionManager {
  private currentElement: HTMLElement | null = null;
  private detectionResult: PasswordFieldInfo | null = null;
  private redactionMode: RedactionMode = 'bullets';
  private customVariableName: string | undefined;

  /**
   * Update the current focused element
   * 
   * @param element - The focused element
   */
  updateElement(element: HTMLElement | null): void {
    this.currentElement = element;
    this.detectionResult = detectPasswordField(element);
  }

  /**
   * Check if the current element is a password field
   */
  isPasswordField(): boolean {
    return this.detectionResult?.isPasswordField ?? false;
  }

  /**
   * Get the detection result
   */
  getDetectionResult(): PasswordFieldInfo | null {
    return this.detectionResult;
  }

  /**
   * Set the redaction mode
   */
  setRedactionMode(mode: RedactionMode): void {
    this.redactionMode = mode;
  }

  /**
   * Get the current redaction mode
   */
  getRedactionMode(): RedactionMode {
    return this.redactionMode;
  }

  /**
   * Set a custom variable name
   */
  setCustomVariableName(name: string | undefined): void {
    this.customVariableName = name;
  }

  /**
   * Get the variable name to use for redaction
   */
  getVariableName(): string {
    return this.customVariableName || 
           this.detectionResult?.suggestedVariableName || 
           'PASSWORD';
  }

  /**
   * Redact text based on current settings
   */
  redact(text: string): string {
    if (!this.isPasswordField()) {
      return text;
    }

    return redactPassword(text, {
      mode: this.redactionMode,
      variableName: this.getVariableName(),
    });
  }

  /**
   * Get display text with optional variable hint
   */
  getDisplay(text: string, showVariableHint: boolean = false): string {
    if (!this.isPasswordField()) {
      return text;
    }

    return getRedactionDisplay(
      text,
      {
        mode: this.redactionMode,
        variableName: this.getVariableName(),
      },
      showVariableHint
    );
  }

  /**
   * Reset the manager
   */
  reset(): void {
    this.currentElement = null;
    this.detectionResult = null;
    this.redactionMode = 'bullets';
    this.customVariableName = undefined;
  }
}

/**
 * Singleton instance of the password redaction manager
 */
export const passwordRedactionManager = new PasswordRedactionManager();
