/**
 * Element Selector Utilities
 * 
 * Generates CSS selectors and XPath for DOM elements.
 * Prefers unique identifiers (ID, data-testid) over complex paths.
 * 
 * Requirements: FR-4.22, FR-4.23
 */

/**
 * Generate CSS selector for an element
 * 
 * Strategy:
 * 1. If element has ID → use #id
 * 2. If element has data-testid → use [data-testid="value"]
 * 3. If element has unique class → use .class
 * 4. Otherwise → generate path with nth-child
 */
export function generateCSSSelector(element: Element): string {
  // Strategy 1: Use ID if available
  if (element.id) {
    return `#${element.id}`;
  }

  // Strategy 2: Use data-testid if available
  const testId = element.getAttribute('data-testid');
  if (testId) {
    return `[data-testid="${testId}"]`;
  }

  // Strategy 3: Use unique class if available
  if (element.className && typeof element.className === 'string') {
    const classes = element.className.trim().split(/\s+/);
    for (const cls of classes) {
      if (cls && document.querySelectorAll(`.${cls}`).length === 1) {
        return `.${cls}`;
      }
    }
  }

  // Strategy 4: Generate path with nth-child
  const path: string[] = [];
  let current: Element | null = element;

  while (current && current !== document.body && current !== document.documentElement) {
    let selector = current.tagName.toLowerCase();

    // Add nth-child if there are siblings of the same type
    if (current.parentElement) {
      const siblings = Array.from(current.parentElement.children).filter(
        (child) => child.tagName === current!.tagName
      );

      if (siblings.length > 1) {
        const index = siblings.indexOf(current) + 1;
        selector += `:nth-child(${index})`;
      }
    }

    path.unshift(selector);
    current = current.parentElement;
  }

  return path.join(' > ');
}

/**
 * Generate XPath for an element
 * 
 * Generates an absolute XPath from the root to the element.
 * Uses position-based indexing for reliability.
 */
export function generateXPath(element: Element): string {
  if (element.id) {
    return `//*[@id="${element.id}"]`;
  }

  const path: string[] = [];
  let current: Element | null = element;

  while (current && current !== document.body && current !== document.documentElement) {
    let index = 1;
    let sibling = current.previousElementSibling;

    // Count preceding siblings of the same type
    while (sibling) {
      if (sibling.tagName === current.tagName) {
        index++;
      }
      sibling = sibling.previousElementSibling;
    }

    const tagName = current.tagName.toLowerCase();
    path.unshift(`${tagName}[${index}]`);
    current = current.parentElement;
  }

  return '/' + path.join('/');
}

/**
 * Capture screenshot of a specific element
 * 
 * Uses html2canvas to capture a screenshot of just the element.
 * Returns a base64-encoded PNG image.
 */
export async function captureElementScreenshot(element: Element): Promise<string | undefined> {
  try {
    // Dynamically import html2canvas to avoid bundling if not needed
    const html2canvas = (await import('html2canvas')).default;
    
    const canvas = await html2canvas(element as HTMLElement, {
      backgroundColor: null,
      logging: false,
      scale: 2, // Higher quality
      useCORS: true,
      allowTaint: true,
    });
    
    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Failed to capture element screenshot:', error);
    return undefined;
  }
}

/**
 * Get element information for recording
 * 
 * Captures comprehensive information about an element for skill generation.
 * Optionally captures a screenshot of the element.
 */
export async function getElementInfo(element: Element, captureScreenshot = false) {
  const rect = element.getBoundingClientRect();

  const info = {
    tagName: element.tagName.toLowerCase(),
    id: element.id || undefined,
    className: element.className || undefined,
    textContent: element.textContent?.trim() || '',
    attributes: Array.from(element.attributes).reduce(
      (acc, attr) => {
        acc[attr.name] = attr.value;
        return acc;
      },
      {} as Record<string, string>
    ),
    cssSelector: generateCSSSelector(element),
    xpath: generateXPath(element),
    boundingBox: {
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height,
    },
    screenshot: undefined as string | undefined,
  };

  // Capture screenshot if requested
  if (captureScreenshot) {
    info.screenshot = await captureElementScreenshot(element);
  }

  return info;
}

/**
 * Check if an element is visible
 * 
 * Determines if an element is actually visible to the user.
 */
export function isElementVisible(element: Element): boolean {
  const rect = element.getBoundingClientRect();
  const style = window.getComputedStyle(element);

  return (
    rect.width > 0 &&
    rect.height > 0 &&
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    style.opacity !== '0'
  );
}

/**
 * Find element by CSS selector
 * 
 * Safely queries for an element and returns it if found and visible.
 */
export function findElement(selector: string): Element | null {
  try {
    const element = document.querySelector(selector);
    if (element && isElementVisible(element)) {
      return element;
    }
  } catch (error) {
    console.error('Invalid selector:', selector, error);
  }
  return null;
}

/**
 * Find element by XPath
 * 
 * Safely queries for an element using XPath and returns it if found and visible.
 */
export function findElementByXPath(xpath: string): Element | null {
  try {
    const result = document.evaluate(
      xpath,
      document,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null
    );
    const element = result.singleNodeValue as Element | null;
    if (element && isElementVisible(element)) {
      return element;
    }
  } catch (error) {
    console.error('Invalid XPath:', xpath, error);
  }
  return null;
}
