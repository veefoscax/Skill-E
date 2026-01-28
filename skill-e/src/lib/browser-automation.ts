/**
 * Browser Automation - DOM Executor
 * 
 * Provides DOM-based browser automation for skill validation.
 * Supports CSS selectors, XPath, and basic browser actions.
 * 
 * Requirements: FR-10.5
 */

import type { SkillStep } from './skill-parser';

/**
 * Browser automation result
 */
export interface AutomationResult {
  /** Whether the action succeeded */
  success: boolean;
  
  /** Error message if failed */
  error?: string;
  
  /** Additional context about the execution */
  context?: {
    /** Element found but not interactable */
    elementFound?: boolean;
    
    /** Element selector used */
    selector?: string;
    
    /** Time taken in milliseconds */
    duration?: number;
    
    /** Screenshot path if captured */
    screenshot?: string;
  };
}

/**
 * Browser automation options
 */
export interface AutomationOptions {
  /** Timeout in milliseconds (default: 5000) */
  timeout?: number;
  
  /** Whether to wait for element to be visible (default: true) */
  waitForVisible?: boolean;
  
  /** Whether to scroll element into view (default: true) */
  scrollIntoView?: boolean;
  
  /** Whether to capture screenshot on error (default: false) */
  captureOnError?: boolean;
}

/**
 * DOM Executor
 * 
 * Executes browser automation actions using DOM manipulation.
 * Can work with external browser windows or embedded webviews.
 */
export class DOMExecutor {
  private targetWindow: Window | null = null;
  private defaultOptions: AutomationOptions = {
    timeout: 5000,
    waitForVisible: true,
    scrollIntoView: true,
    captureOnError: false,
  };

  /**
   * Create a new DOM executor
   * 
   * @param targetWindow - Target window to execute actions in (defaults to current window)
   */
  constructor(targetWindow?: Window) {
    this.targetWindow = targetWindow || (typeof window !== 'undefined' ? window : null);
  }

  /**
   * Execute a skill step
   * 
   * @param step - Skill step to execute
   * @param options - Automation options
   * @returns Automation result
   */
  async executeStep(step: SkillStep, options?: AutomationOptions): Promise<AutomationResult> {
    const opts = { ...this.defaultOptions, ...options };
    const startTime = Date.now();

    try {
      switch (step.actionType) {
        case 'click':
          return await this.click(step.target?.selector || '', opts);
        
        case 'type':
          return await this.type(
            step.target?.selector || '',
            step.target?.text || '',
            opts
          );
        
        case 'navigate':
          return await this.navigate(step.target?.text || '', opts);
        
        case 'wait':
          return await this.wait(opts.timeout || 1000);
        
        case 'verify':
          return await this.verify(step.target?.selector || '', opts);
        
        default:
          return {
            success: false,
            error: `Unsupported action type: ${step.actionType}`,
          };
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        context: {
          duration,
          selector: step.target?.selector,
        },
      };
    }
  }

  /**
   * Click an element by selector
   * 
   * @param selector - CSS selector or XPath
   * @param options - Automation options
   * @returns Automation result
   */
  async click(selector: string, options?: AutomationOptions): Promise<AutomationResult> {
    const opts = { ...this.defaultOptions, ...options };
    const startTime = Date.now();

    if (!selector) {
      return {
        success: false,
        error: 'No selector provided',
      };
    }

    try {
      const element = await this.findElement(selector, opts);
      
      if (!element) {
        return {
          success: false,
          error: `Element not found: ${selector}`,
          context: {
            elementFound: false,
            selector,
            duration: Date.now() - startTime,
          },
        };
      }

      // Scroll into view if needed
      if (opts.scrollIntoView) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        await this.wait(300); // Wait for scroll animation
      }

      // Check if element is interactable
      if (opts.waitForVisible && !this.isElementInteractable(element)) {
        return {
          success: false,
          error: `Element not interactable: ${selector}`,
          context: {
            elementFound: true,
            selector,
            duration: Date.now() - startTime,
          },
        };
      }

      // Click the element
      if (element instanceof HTMLElement) {
        element.click();
      } else {
        // Fallback for non-HTML elements
        const clickEvent = new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          view: this.targetWindow || undefined,
        });
        element.dispatchEvent(clickEvent);
      }

      return {
        success: true,
        context: {
          elementFound: true,
          selector,
          duration: Date.now() - startTime,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Click failed',
        context: {
          selector,
          duration: Date.now() - startTime,
        },
      };
    }
  }

  /**
   * Type text into an input field
   * 
   * @param selector - CSS selector or XPath
   * @param text - Text to type
   * @param options - Automation options
   * @returns Automation result
   */
  async type(selector: string, text: string, options?: AutomationOptions): Promise<AutomationResult> {
    const opts = { ...this.defaultOptions, ...options };
    const startTime = Date.now();

    if (!selector) {
      return {
        success: false,
        error: 'No selector provided',
      };
    }

    if (text === undefined || text === null) {
      return {
        success: false,
        error: 'No text provided',
      };
    }

    try {
      const element = await this.findElement(selector, opts);
      
      if (!element) {
        return {
          success: false,
          error: `Element not found: ${selector}`,
          context: {
            elementFound: false,
            selector,
            duration: Date.now() - startTime,
          },
        };
      }

      // Scroll into view if needed
      if (opts.scrollIntoView) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        await this.wait(300);
      }

      // Check if element is an input or textarea
      if (!(element instanceof HTMLInputElement || 
            element instanceof HTMLTextAreaElement ||
            element.hasAttribute('contenteditable'))) {
        return {
          success: false,
          error: `Element is not an input field: ${selector}`,
          context: {
            elementFound: true,
            selector,
            duration: Date.now() - startTime,
          },
        };
      }

      // Focus the element
      if (element instanceof HTMLElement) {
        element.focus();
      }

      // Clear existing value
      if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
        element.value = '';
        
        // Trigger input event for frameworks that listen to it
        element.dispatchEvent(new Event('input', { bubbles: true }));
      }

      // Type the text (simulate typing with delays for more realistic behavior)
      if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
        // For standard inputs, set value directly
        element.value = text;
        
        // Trigger events that frameworks listen to
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
      } else if (element.hasAttribute('contenteditable')) {
        // For contenteditable elements
        element.textContent = text;
        
        // Trigger input event
        element.dispatchEvent(new Event('input', { bubbles: true }));
      }

      return {
        success: true,
        context: {
          elementFound: true,
          selector,
          duration: Date.now() - startTime,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Type failed',
        context: {
          selector,
          duration: Date.now() - startTime,
        },
      };
    }
  }

  /**
   * Navigate to a URL
   * 
   * @param url - URL to navigate to
   * @param options - Automation options
   * @returns Automation result
   */
  async navigate(url: string, options?: AutomationOptions): Promise<AutomationResult> {
    const opts = { ...this.defaultOptions, ...options };
    const startTime = Date.now();

    if (!url) {
      return {
        success: false,
        error: 'No URL provided',
      };
    }

    try {
      // Validate URL
      let validUrl: URL;
      try {
        validUrl = new URL(url);
      } catch {
        // Try adding https:// if no protocol
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          validUrl = new URL(`https://${url}`);
        } else {
          throw new Error('Invalid URL');
        }
      }

      // Navigate
      if (this.targetWindow) {
        this.targetWindow.location.href = validUrl.toString();
      } else {
        window.location.href = validUrl.toString();
      }

      // Wait for navigation to complete
      await this.wait(opts.timeout || 2000);

      return {
        success: true,
        context: {
          duration: Date.now() - startTime,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Navigation failed',
        context: {
          duration: Date.now() - startTime,
        },
      };
    }
  }

  /**
   * Wait for a specified duration
   * 
   * @param duration - Duration in milliseconds
   * @returns Automation result
   */
  async wait(duration: number): Promise<AutomationResult> {
    const startTime = Date.now();

    try {
      await new Promise(resolve => setTimeout(resolve, duration));

      return {
        success: true,
        context: {
          duration: Date.now() - startTime,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Wait failed',
        context: {
          duration: Date.now() - startTime,
        },
      };
    }
  }

  /**
   * Verify an element exists and is visible
   * 
   * @param selector - CSS selector or XPath
   * @param options - Automation options
   * @returns Automation result
   */
  async verify(selector: string, options?: AutomationOptions): Promise<AutomationResult> {
    const opts = { ...this.defaultOptions, ...options };
    const startTime = Date.now();

    if (!selector) {
      return {
        success: false,
        error: 'No selector provided',
      };
    }

    try {
      const element = await this.findElement(selector, opts);
      
      if (!element) {
        return {
          success: false,
          error: `Element not found: ${selector}`,
          context: {
            elementFound: false,
            selector,
            duration: Date.now() - startTime,
          },
        };
      }

      // Check visibility if required
      if (opts.waitForVisible && !this.isElementVisible(element)) {
        return {
          success: false,
          error: `Element not visible: ${selector}`,
          context: {
            elementFound: true,
            selector,
            duration: Date.now() - startTime,
          },
        };
      }

      return {
        success: true,
        context: {
          elementFound: true,
          selector,
          duration: Date.now() - startTime,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Verification failed',
        context: {
          selector,
          duration: Date.now() - startTime,
        },
      };
    }
  }

  /**
   * Find an element by selector (CSS or XPath)
   * 
   * @param selector - CSS selector or XPath
   * @param options - Automation options
   * @returns Element or null
   */
  private async findElement(selector: string, options: AutomationOptions): Promise<Element | null> {
    // Use global document if targetWindow is not set or doesn't have document
    const doc = (this.targetWindow && this.targetWindow.document) ? this.targetWindow.document : 
                (typeof document !== 'undefined' ? document : null);
    
    if (!doc) {
      return null;
    }
    
    const timeout = options.timeout || 5000;
    const startTime = Date.now();

    // Determine if selector is XPath or CSS
    const isXPath = selector.startsWith('//') || selector.startsWith('(//');

    // Poll for element with timeout
    while (Date.now() - startTime < timeout) {
      let element: Element | null = null;

      if (isXPath) {
        // XPath selector
        try {
          const result = doc.evaluate(
            selector,
            doc,
            null,
            XPathResult.FIRST_ORDERED_NODE_TYPE,
            null
          );
          element = result.singleNodeValue as Element | null;
        } catch (error) {
          // XPath evaluation failed
          return null;
        }
      } else {
        // CSS selector
        element = doc.querySelector(selector);
      }

      if (element) {
        // If we need to wait for visibility, check that too
        if (options.waitForVisible && !this.isElementVisible(element)) {
          await this.wait(100);
          continue;
        }
        
        return element;
      }

      // Wait a bit before retrying
      await this.wait(100);
    }

    return null;
  }

  /**
   * Check if an element is visible
   * 
   * @param element - Element to check
   * @returns True if visible
   */
  private isElementVisible(element: Element): boolean {
    if (!(element instanceof HTMLElement)) {
      return true; // Assume visible for non-HTML elements
    }

    // Check if element is in the DOM
    if (!element.isConnected) {
      return false;
    }

    // Check computed style
    const style = window.getComputedStyle(element);
    if (style.display === 'none' || 
        style.visibility === 'hidden' || 
        style.opacity === '0') {
      return false;
    }

    // Check if element has dimensions
    const rect = element.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      return false;
    }

    return true;
  }

  /**
   * Check if an element is interactable (visible and not disabled)
   * 
   * @param element - Element to check
   * @returns True if interactable
   */
  private isElementInteractable(element: Element): boolean {
    if (!this.isElementVisible(element)) {
      return false;
    }

    if (element instanceof HTMLButtonElement || 
        element instanceof HTMLInputElement ||
        element instanceof HTMLSelectElement ||
        element instanceof HTMLTextAreaElement) {
      if (element.disabled) {
        return false;
      }
    }

    return true;
  }

  /**
   * Set the target window for automation
   * 
   * @param targetWindow - Target window
   */
  setTargetWindow(targetWindow: Window): void {
    this.targetWindow = targetWindow;
  }

  /**
   * Get the current target window
   * 
   * @returns Target window or null
   */
  getTargetWindow(): Window | null {
    return this.targetWindow;
  }
}

/**
 * Create a new DOM executor instance
 * 
 * @param targetWindow - Optional target window
 * @returns DOM executor instance
 */
export function createDOMExecutor(targetWindow?: Window): DOMExecutor {
  return new DOMExecutor(targetWindow);
}

/**
 * Execute a single step using DOM automation
 * 
 * @param step - Skill step to execute
 * @param options - Automation options
 * @returns Automation result
 */
export async function executeStepDOM(
  step: SkillStep,
  options?: AutomationOptions
): Promise<AutomationResult> {
  const executor = createDOMExecutor();
  return executor.executeStep(step, options);
}
