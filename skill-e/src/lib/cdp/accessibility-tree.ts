/**
 * Accessibility Tree Generator
 * 
 * Generates a text representation of the page structure from CDP accessibility tree
 * Similar to Claude extension's window.__generateAccessibilityTree()
 * 
 * This is more reliable than DOM-based selectors because:
 * 1. Uses accessibility APIs (bypasses anti-bot detection)
 * 2. Works with dynamic content
 * 3. Provides semantic understanding of elements
 */

import type { CDPClient, CDPAccessibilityNode } from './client';

/**
 * Accessibility tree node with computed properties
 */
export interface AccessibilityTreeNode {
  /** Node role */
  role: string;
  
  /** Accessible name */
  name?: string;
  
  /** Element description */
  description?: string;
  
  /** Whether element is interactive */
  interactive: boolean;
  
  /** Element bounds */
  bounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  
  /** Center point for clicking */
  center?: {
    x: number;
    y: number;
  };
  
  /** Backend node ID for CDP operations */
  backendNodeId?: number;
  
  /** Child nodes */
  children: AccessibilityTreeNode[];
  
  /** Original CDP node */
  sourceNode: CDPAccessibilityNode;
}

/**
 * Text representation of accessibility tree
 */
export interface AccessibilityTreeText {
  /** Text representation for LLM consumption */
  text: string;
  
  /** Number of interactive elements */
  interactiveCount: number;
  
  /** All interactive elements with coordinates */
  interactiveElements: Array<{
    role: string;
    name?: string;
    center: { x: number; y: number };
    index: number;
  }>;
}

/**
 * Interactive roles that can be clicked
 */
const INTERACTIVE_ROLES = new Set([
  'button',
  'link',
  'textbox',
  'combobox',
  'checkbox',
  'radio',
  'menuitem',
  'menuitemcheckbox',
  'menuitemradio',
  'tab',
  'treeitem',
  'listbox',
  'searchbox',
  'switch',
  'slider',
  'spinbutton',
]);

/**
 * Roles to ignore in text representation
 */
const IGNORED_ROLES = new Set([
  'generic',
  'none',
  'presentation',
  'separator',
  'scrollbar',
]);

/**
 * Check if node is interactive
 */
function isInteractive(node: CDPAccessibilityNode): boolean {
  if (!node.role) return false;
  
  // Check role
  if (INTERACTIVE_ROLES.has(node.role.toLowerCase())) {
    return true;
  }
  
  // Check if it has a click action
  if (node.properties) {
    const clickable = node.properties.find(p => 
      p.name === 'clickable' || p.name === 'focusable'
    );
    if (clickable?.value === true) {
      return true;
    }
  }
  
  return false;
}

/**
 * Check if node should be included in text representation
 */
function shouldInclude(node: CDPAccessibilityNode): boolean {
  if (!node.role) return false;
  if (IGNORED_ROLES.has(node.role.toLowerCase())) return false;
  if (node.ignored) return false;
  
  // Include if it has a name or is interactive
  return !!node.name || isInteractive(node);
}

/**
 * Transform CDP node to tree node
 */
function transformNode(node: CDPAccessibilityNode): AccessibilityTreeNode | null {
  if (!shouldInclude(node)) {
    return null;
  }

  const interactive = isInteractive(node);
  
  return {
    role: node.role || 'unknown',
    name: node.name,
    description: node.description,
    interactive,
    bounds: node.bounds,
    center: node.bounds ? {
      x: node.bounds.x + node.bounds.width / 2,
      y: node.bounds.y + node.bounds.height / 2,
    } : undefined,
    backendNodeId: node.backendNodeId,
    children: [],
    sourceNode: node,
  };
}

/**
 * Build tree from CDP nodes
 */
function buildTree(node: CDPAccessibilityNode): AccessibilityTreeNode | null {
  const transformed = transformNode(node);
  if (!transformed) return null;

  if (node.children) {
    for (const child of node.children) {
      const childTree = buildTree(child);
      if (childTree) {
        transformed.children.push(childTree);
      }
    }
  }

  return transformed;
}

/**
 * Generate text representation of tree
 */
function generateTextRepresentation(
  node: AccessibilityTreeNode,
  depth = 0,
  interactiveElements: Array<{ role: string; name?: string; center: { x: number; y: number }; index: number }> = [],
  prefix = ''
): string {
  const indent = '  '.repeat(depth);
  let text = '';

  // Build node description
  const parts: string[] = [];
  parts.push(node.role);
  
  if (node.name) {
    parts.push(`"${node.name}"`);
  }
  
  if (node.interactive && node.center) {
    const index = interactiveElements.length;
    interactiveElements.push({
      role: node.role,
      name: node.name,
      center: node.center,
      index,
    });
    parts.push(`[${index}]`);
  }

  // Add to text
  text += `${indent}${prefix}${parts.join(' ')}
`;

  // Process children
  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i];
    const isLast = i === node.children.length - 1;
    const childPrefix = isLast ? '└─ ' : '├─ ';
    text += generateTextRepresentation(child, depth + 1, interactiveElements, childPrefix);
  }

  return text;
}

/**
 * Accessibility Tree Generator
 * 
 * Generates accessible text representation of web pages
 */
export class AccessibilityTreeGenerator {
  private client: CDPClient;

  constructor(client: CDPClient) {
    this.client = client;
  }

  /**
   * Generate accessibility tree from current page
   */
  async generate(): Promise<AccessibilityTreeNode | null> {
    const root = await this.client.getAccessibilityTree();
    if (!root) return null;

    return buildTree(root);
  }

  /**
   * Generate text representation for LLM consumption
   */
  async generateText(): Promise<AccessibilityTreeText> {
    const tree = await this.generate();
    
    if (!tree) {
      return {
        text: '(Page has no accessible content)',
        interactiveCount: 0,
        interactiveElements: [],
      };
    }

    const interactiveElements: Array<{ role: string; name?: string; center: { x: number; y: number }; index: number }> = [];
    
    const text = generateTextRepresentation(tree, 0, interactiveElements);

    return {
      text: text.trim(),
      interactiveCount: interactiveElements.length,
      interactiveElements,
    };
  }

  /**
   * Find element by index (from text representation)
   */
  async findByIndex(index: number): Promise<{ role: string; name?: string; center: { x: number; y: number } } | null> {
    const text = await this.generateText();
    return text.interactiveElements.find(e => e.index === index) || null;
  }

  /**
   * Find element by name
   */
  async findByName(name: string): Promise<{ role: string; name?: string; center: { x: number; y: number }; index: number } | null> {
    const text = await this.generateText();
    const lowerName = name.toLowerCase();
    
    return text.interactiveElements.find(e => 
      e.name?.toLowerCase().includes(lowerName)
    ) || null;
  }

  /**
   * Find element by role
   */
  async findByRole(role: string): Promise<Array<{ role: string; name?: string; center: { x: number; y: number }; index: number }>> {
    const text = await this.generateText();
    const lowerRole = role.toLowerCase();
    
    return text.interactiveElements.filter(e => 
      e.role.toLowerCase() === lowerRole
    );
  }

  /**
   * Click element by index
   */
  async clickByIndex(index: number): Promise<boolean> {
    const element = await this.findByIndex(index);
    if (!element) return false;

    await this.client.click(element.center.x, element.center.y);
    return true;
  }

  /**
   * Click element by name
   */
  async clickByName(name: string): Promise<boolean> {
    const element = await this.findByName(name);
    if (!element) return false;

    await this.client.click(element.center.x, element.center.y);
    return true;
  }

  /**
   * Type text into focused element
   */
  async type(text: string): Promise<void> {
    await this.client.type(text);
  }

  /**
   * Wait for element with specific name to appear
   */
  async waitForElement(name: string, timeout = 10000): Promise<boolean> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const element = await this.findByName(name);
      if (element) return true;
      await new Promise(r => setTimeout(r, 500));
    }
    
    return false;
  }
}

/**
 * Create accessibility tree generator
 */
export function createAccessibilityTreeGenerator(client: CDPClient): AccessibilityTreeGenerator {
  return new AccessibilityTreeGenerator(client);
}

/**
 * Quick function to get accessibility text
 */
export async function getAccessibilityText(client: CDPClient): Promise<string> {
  const generator = createAccessibilityTreeGenerator(client);
  const result = await generator.generateText();
  return result.text;
}


