/**
 * Skill Parser
 *
 * Parses SKILL.md markdown files into structured step data for validation.
 * Extracts action types, targets, and confirmation points.
 *
 * Requirements: FR-10.1
 */

/**
 * Parsed skill step
 */
export interface SkillStep {
  /** Unique step identifier */
  id: string

  /** Step index (0-based) */
  index: number

  /** Step instruction text */
  instruction: string

  /** Detected action type */
  actionType: 'click' | 'type' | 'navigate' | 'wait' | 'verify' | 'confirm' | 'unknown'

  /** Target information for the action */
  target?: {
    /** CSS selector or XPath for DOM-based actions */
    selector?: string

    /** Coordinates for image-based actions */
    coordinates?: { x: number; y: number }

    /** Reference screenshot path */
    imageRef?: string

    /** Text to type or verify */
    text?: string

    /** Element description (e.g., "Sign Up button") */
    description?: string
  }

  /** Whether this step requires user confirmation before execution */
  requiresConfirmation: boolean

  /** Execution status */
  status: 'pending' | 'running' | 'success' | 'failed' | 'skipped'

  /** Error message if step failed */
  error?: string

  /** User feedback for failed steps */
  feedback?: string

  /** Original markdown section this step came from */
  section?: string

  /** Step number from the markdown (e.g., "Step 1", "Step 2") */
  stepNumber?: number
}

/**
 * Parsed skill document
 */
export interface ParsedSkill {
  /** Skill name from frontmatter */
  name: string

  /** Skill description */
  description: string

  /** Skill version */
  version?: string

  /** Skill author */
  author?: string

  /** Creation date */
  created?: string

  /** Skill title (from markdown heading) */
  title?: string

  /** All extracted steps */
  steps: SkillStep[]

  /** Parameters/variables defined in the skill */
  parameters: SkillParameter[]

  /** Prerequisites from the skill */
  prerequisites: string[]

  /** Verification checklist items */
  verificationItems: string[]

  /** Raw frontmatter */
  frontmatter: Record<string, any>

  /** Full markdown content */
  markdown: string
}

/**
 * Skill parameter/variable
 */
export interface SkillParameter {
  /** Parameter name (e.g., "email", "password") */
  name: string

  /** Parameter type */
  type: string

  /** Whether parameter is required */
  required: boolean

  /** Parameter description */
  description: string

  /** Example value */
  example?: string
}

/**
 * Action type detection patterns
 * Ordered by priority (more specific patterns first)
 */
const ACTION_PATTERNS = {
  // Confirmation markers (highest priority - must be uppercase)
  confirm: /\b(PAUSE|CONFIRM|STOP|WAIT FOR USER)\b/,

  // Type actions (check before navigate/click to catch "enter" as typing)
  // But exclude "press enter" which is a click
  type: /\b(type|input|fill|write|paste|insert)\b|(\benter\b(?!\s+key))/i,

  // Navigate actions (check before click, as "click link" could be navigation)
  navigate:
    /\b(navigate|go to|visit|browse|redirect)\b|(\bopen\b.*\b(page|url|site|website|link))/i,

  // Click actions (includes various click types)
  click: /\b(click|press|tap|select|choose|hit|activate)\b/i,

  // Wait actions (includes delays and pauses, but not "wait for user")
  wait: /\b(wait|pause|delay|hold|sleep)\b(?!\s+for\s+user)/i,

  // Verify actions (includes various validation methods)
  verify: /\b(verify|check|ensure|validate|confirm|assert|test)\b/i,
}

/**
 * Target extraction patterns
 * Enhanced for better selector and coordinate detection
 */
const TARGET_PATTERNS = {
  // Quoted text: "Sign Up", 'Submit', etc.
  quoted: /"([^"]+)"|'([^']+)'/g,

  // CSS selectors (more comprehensive)
  cssId: /#[\w-]+/g,
  cssClass: /\.[\w-]+/g,
  cssAttribute: /\[[\w-]+(?:=["']?[\w-]+["']?)?\]/g,
  cssComplex: /(?:^|\s)((?:#|\.|\[)[\w\-\[\]="']+(?:\s*>\s*|\s+)?)+/g,

  // XPath expressions
  xpath: /\/\/[\w\[\]@='"\s\/\*\.\(\)]+/g,

  // Data attributes (common in modern web apps)
  dataAttr: /data-[\w-]+(?:=["'][\w-]+["'])?/g,

  // ARIA attributes (accessibility selectors)
  ariaAttr: /aria-[\w-]+(?:=["'][\w-]+["'])?/g,

  // Variable placeholders: {email}, {password}
  variable: /\{(\w+)\}/g,

  // Coordinates: (x: 100, y: 200) or [100, 200] or (100, 200)
  coordinatesNamed: /\(x:\s*(\d+),\s*y:\s*(\d+)\)/i,
  coordinatesBracket: /\[(\d+),\s*(\d+)\]/,
  coordinatesParen: /\((\d+),\s*(\d+)\)/,

  // Image references: screenshot-1.png, ref-image.jpg
  imageRef: /(?:screenshot|image|ref|reference)[-_]?\w*\.(?:png|jpg|jpeg|webp)/gi,

  // Element descriptions: "the Submit button", "email input field"
  elementType:
    /\b(button|link|input|field|checkbox|radio|dropdown|select|textarea|form|menu|icon|image)\b/gi,
}

/**
 * Parse SKILL.md markdown into structured data
 *
 * @param markdown - SKILL.md content
 * @returns Parsed skill with steps
 */
export function parseSkill(markdown: string): ParsedSkill {
  // Extract frontmatter
  const frontmatter = extractFrontmatter(markdown)

  // Extract parameters
  const parameters = extractParameters(markdown)

  // Extract prerequisites
  const prerequisites = extractPrerequisites(markdown)

  // Extract verification items
  const verificationItems = extractVerificationItems(markdown)

  // Extract steps from Instructions section
  const steps = extractSteps(markdown)

  // Extract title from first heading
  const titleMatch = markdown.match(/^#\s+(.+)$/m)
  const title = titleMatch ? titleMatch[1] : undefined

  return {
    name: frontmatter.name || 'unnamed-skill',
    description: frontmatter.description || '',
    version: frontmatter.version,
    author: frontmatter.author,
    created: frontmatter.created,
    title,
    steps,
    parameters,
    prerequisites,
    verificationItems,
    frontmatter,
    markdown,
  }
}

/**
 * Extract YAML frontmatter from markdown
 */
function extractFrontmatter(markdown: string): Record<string, any> {
  const frontmatterMatch = markdown.match(/^---\s*\n([\s\S]*?)\n---/)

  if (!frontmatterMatch) {
    return {}
  }

  const frontmatterText = frontmatterMatch[1]
  const frontmatter: Record<string, any> = {}

  // Simple YAML parser (handles basic key: value pairs)
  const lines = frontmatterText.split('\n')
  let currentKey = ''

  for (const line of lines) {
    const trimmed = line.trim()

    if (!trimmed || trimmed.startsWith('#')) {
      continue
    }

    // Detect indentation level
    const indent = line.search(/\S/)
    const isIndented = indent >= 2

    // Handle nested keys (e.g., metadata:)
    if (trimmed.endsWith(':') && !trimmed.includes(': ')) {
      currentKey = trimmed.slice(0, -1)
      frontmatter[currentKey] = {}
      continue
    }

    // Handle key: value pairs
    const colonIndex = trimmed.indexOf(':')
    if (colonIndex > 0) {
      const key = trimmed.slice(0, colonIndex).trim()
      let value = trimmed.slice(colonIndex + 1).trim()

      // Remove quotes
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1)
      }

      if (currentKey && isIndented) {
        // Nested property
        frontmatter[currentKey][key] = value
      } else {
        // Top-level property
        frontmatter[key] = value
        currentKey = ''
      }
    }
  }

  return frontmatter
}

/**
 * Extract parameters from Parameters section
 */
function extractParameters(markdown: string): SkillParameter[] {
  const parameters: SkillParameter[] = []

  // Find Parameters section
  const parametersMatch = markdown.match(
    /## Parameters\s*\n([\s\S]*?)(?=\n##|\n---|\n\*Generated|$)/
  )

  if (!parametersMatch) {
    return parameters
  }

  const parametersSection = parametersMatch[1]

  // Parse markdown table
  const lines = parametersSection.split('\n')
  let inTable = false

  for (const line of lines) {
    const trimmed = line.trim()

    // Skip empty lines and table header separator
    if (!trimmed || trimmed.startsWith('|---')) {
      continue
    }

    // Check if this is a table row
    if (trimmed.startsWith('|')) {
      const cells = trimmed
        .split('|')
        .map(cell => cell.trim())
        .filter(Boolean)

      // Skip header row
      if (cells[0] === 'Parameter' || cells[0].toLowerCase() === 'parameter') {
        inTable = true
        continue
      }

      if (inTable && cells.length >= 4) {
        // Extract parameter name from backticks and braces
        const paramName = cells[0].replace(/`/g, '').replace(/[{}]/g, '')

        parameters.push({
          name: paramName,
          type: cells[1],
          required: cells[2].toLowerCase() === 'yes' || cells[2].toLowerCase() === 'true',
          description: cells[3],
          example: cells[4] || undefined,
        })
      }
    }
  }

  return parameters
}

/**
 * Extract prerequisites from Prerequisites section
 */
function extractPrerequisites(markdown: string): string[] {
  const prerequisites: string[] = []

  const prereqMatch = markdown.match(
    /## Prerequisites\s*\n([\s\S]*?)(?=\n##|\n---|\n\*Generated|$)/
  )

  if (!prereqMatch) {
    return prerequisites
  }

  const prereqSection = prereqMatch[1]
  const lines = prereqSection.split('\n')

  for (const line of lines) {
    const trimmed = line.trim()

    // Match list items (-, *, or numbered)
    if (trimmed.match(/^[-*]\s+/) || trimmed.match(/^\d+\.\s+/)) {
      const text = trimmed.replace(/^[-*]\s+/, '').replace(/^\d+\.\s+/, '')
      if (text) {
        prerequisites.push(text)
      }
    }
  }

  return prerequisites
}

/**
 * Extract verification items from Verification section
 */
function extractVerificationItems(markdown: string): string[] {
  const items: string[] = []

  const verifyMatch = markdown.match(/## Verification\s*\n([\s\S]*?)(?=\n##|\n---|\n\*Generated|$)/)

  if (!verifyMatch) {
    return items
  }

  const verifySection = verifyMatch[1]
  const lines = verifySection.split('\n')

  for (const line of lines) {
    const trimmed = line.trim()

    // Match checklist items: - [ ] or - [x]
    const checklistMatch = trimmed.match(/^-\s*\[[ x]\]\s+(.+)/)
    if (checklistMatch) {
      items.push(checklistMatch[1])
    }
  }

  return items
}

/**
 * Extract steps from Instructions section
 */
function extractSteps(markdown: string): SkillStep[] {
  const steps: SkillStep[] = []

  // Find Instructions section
  const instructionsMatch = markdown.match(
    /## Instructions\s*\n([\s\S]*?)(?=\n## Verification|## Troubleshooting|---|\*Generated|$)/
  )

  if (!instructionsMatch) {
    return steps
  }

  const instructionsSection = instructionsMatch[1]

  // Split by step headers (### Step N:)
  const stepSections = instructionsSection.split(/###\s+Step\s+(\d+):/i)

  // First element is content before first step (skip it)
  for (let i = 1; i < stepSections.length; i += 2) {
    const stepNumber = parseInt(stepSections[i], 10)
    const stepContent = stepSections[i + 1]

    if (!stepContent) continue

    // Extract step title (first line after step header)
    const lines = stepContent.trim().split('\n')
    const stepTitle = lines[0].trim()

    // Extract all instructions from this step
    const stepInstructions = extractStepInstructions(stepContent)

    // Create a step for each instruction
    stepInstructions.forEach((instruction, idx) => {
      const stepId = `step-${stepNumber}-${idx + 1}`

      steps.push({
        id: stepId,
        index: steps.length,
        instruction: instruction.text,
        actionType: detectActionType(instruction.text),
        target: extractTarget(instruction.text),
        requiresConfirmation: detectConfirmation(instruction.text),
        status: 'pending',
        section: stepTitle,
        stepNumber,
      })
    })
  }

  return steps
}

/**
 * Extract individual instructions from a step section
 */
function extractStepInstructions(stepContent: string): Array<{ text: string }> {
  const instructions: Array<{ text: string }> = []
  const lines = stepContent.split('\n')

  for (const line of lines) {
    const trimmed = line.trim()

    // Skip empty lines, headers, and blockquotes
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('>')) {
      continue
    }

    // Match numbered or bulleted list items
    const listMatch = trimmed.match(/^(?:\d+\.|[-*])\s+(.+)/)
    if (listMatch) {
      instructions.push({ text: listMatch[1] })
    }
  }

  return instructions
}

/**
 * Detect action type from instruction text
 * Enhanced with priority-based detection
 */
function detectActionType(instruction: string): SkillStep['actionType'] {
  // Check for confirmation markers first (highest priority)
  if (ACTION_PATTERNS.confirm.test(instruction)) {
    return 'confirm'
  }

  // Check type actions early (before navigate/click)
  if (ACTION_PATTERNS.type.test(instruction)) {
    return 'type'
  }

  // Check navigate actions
  if (ACTION_PATTERNS.navigate.test(instruction)) {
    return 'navigate'
  }

  // Click actions
  if (ACTION_PATTERNS.click.test(instruction)) {
    return 'click'
  }

  // Wait actions
  if (ACTION_PATTERNS.wait.test(instruction)) {
    return 'wait'
  }

  // Verify actions
  if (ACTION_PATTERNS.verify.test(instruction)) {
    return 'verify'
  }

  return 'unknown'
}

/**
 * Extract target information from instruction text
 * Enhanced for better selector and coordinate detection
 */
function extractTarget(instruction: string): SkillStep['target'] | undefined {
  const target: SkillStep['target'] = {}

  // 1. Extract quoted text (likely button/link text or element description)
  const quotedMatches = Array.from(instruction.matchAll(TARGET_PATTERNS.quoted))
  if (quotedMatches.length > 0) {
    const quotedText = quotedMatches[0][1] || quotedMatches[0][2]
    target.description = quotedText
  }

  // 2. Extract CSS selectors (try multiple patterns)
  // Try ID selector first (most specific)
  const idMatches = Array.from(instruction.matchAll(TARGET_PATTERNS.cssId))
  if (idMatches.length > 0) {
    target.selector = idMatches[0][0]
  }

  // Try class selector
  if (!target.selector) {
    const classMatches = Array.from(instruction.matchAll(TARGET_PATTERNS.cssClass))
    if (classMatches.length > 0) {
      target.selector = classMatches[0][0]
    }
  }

  // Try attribute selector
  if (!target.selector) {
    const attrMatches = Array.from(instruction.matchAll(TARGET_PATTERNS.cssAttribute))
    if (attrMatches.length > 0) {
      target.selector = attrMatches[0][0]
    }
  }

  // Try data attributes (common in modern apps)
  if (!target.selector) {
    const dataMatches = Array.from(instruction.matchAll(TARGET_PATTERNS.dataAttr))
    if (dataMatches.length > 0) {
      target.selector = `[${dataMatches[0][0]}]`
    }
  }

  // Try ARIA attributes (accessibility)
  if (!target.selector) {
    const ariaMatches = Array.from(instruction.matchAll(TARGET_PATTERNS.ariaAttr))
    if (ariaMatches.length > 0) {
      target.selector = `[${ariaMatches[0][0]}]`
    }
  }

  // 3. Extract XPath (if present, overrides CSS)
  const xpathMatches = Array.from(instruction.matchAll(TARGET_PATTERNS.xpath))
  if (xpathMatches.length > 0) {
    target.selector = xpathMatches[0][0]
  }

  // 4. Extract variables (text to type)
  const variableMatches = Array.from(instruction.matchAll(TARGET_PATTERNS.variable))
  if (variableMatches.length > 0) {
    target.text = variableMatches.map(m => `{${m[1]}}`).join(' ')
  }

  // 5. Extract coordinates (try multiple formats)
  // Try named format first: (x: 100, y: 200)
  let coordMatch = instruction.match(TARGET_PATTERNS.coordinatesNamed)
  if (coordMatch) {
    const x = parseInt(coordMatch[1], 10)
    const y = parseInt(coordMatch[2], 10)
    target.coordinates = { x, y }
  }

  // Try bracket format: [100, 200]
  if (!target.coordinates) {
    coordMatch = instruction.match(TARGET_PATTERNS.coordinatesBracket)
    if (coordMatch) {
      const x = parseInt(coordMatch[1], 10)
      const y = parseInt(coordMatch[2], 10)
      target.coordinates = { x, y }
    }
  }

  // Try parenthesis format: (100, 200)
  // Only if no named coordinates found (to avoid false positives)
  if (!target.coordinates && !instruction.match(/x:\s*\d+/i)) {
    coordMatch = instruction.match(TARGET_PATTERNS.coordinatesParen)
    if (coordMatch) {
      const x = parseInt(coordMatch[1], 10)
      const y = parseInt(coordMatch[2], 10)
      // Validate coordinates are reasonable (not too large)
      if (x < 10000 && y < 10000) {
        target.coordinates = { x, y }
      }
    }
  }

  // 6. Extract image references
  const imageMatches = Array.from(instruction.matchAll(TARGET_PATTERNS.imageRef))
  if (imageMatches.length > 0) {
    target.imageRef = imageMatches[0][0]
  }

  // 7. Extract element type if no description yet
  if (!target.description) {
    const elementMatches = Array.from(instruction.matchAll(TARGET_PATTERNS.elementType))
    if (elementMatches.length > 0) {
      // Find the element type
      const elementType = elementMatches[0][0].toLowerCase()
      const elementIndex = instruction.toLowerCase().indexOf(elementType)

      // Look for text before the element type (e.g., "Submit button" -> "Submit")
      const beforeElement = instruction.substring(0, elementIndex).trim()
      const words = beforeElement.split(/\s+/)

      // Get the last 1-2 words before the element type
      const relevantWords = words
        .slice(-2)
        .filter(word => word.length > 2 && !/^(the|a|an|this|that|on|in|at|to|for)$/i.test(word))

      if (relevantWords.length > 0) {
        target.description = `${relevantWords.join(' ')} ${elementType}`
      } else {
        target.description = elementType
      }
    }
  }

  // Return undefined if no target info found
  return Object.keys(target).length > 0 ? target : undefined
}

/**
 * Detect if step requires confirmation (PAUSE marker)
 */
function detectConfirmation(instruction: string): boolean {
  return ACTION_PATTERNS.confirm.test(instruction)
}

/**
 * Get step by ID
 */
export function getStepById(steps: SkillStep[], id: string): SkillStep | undefined {
  return steps.find(step => step.id === id)
}

/**
 * Get steps by status
 */
export function getStepsByStatus(steps: SkillStep[], status: SkillStep['status']): SkillStep[] {
  return steps.filter(step => step.status === status)
}

/**
 * Get next pending step
 */
export function getNextPendingStep(steps: SkillStep[]): SkillStep | undefined {
  return steps.find(step => step.status === 'pending')
}

/**
 * Update step status
 */
export function updateStepStatus(
  steps: SkillStep[],
  stepId: string,
  status: SkillStep['status'],
  error?: string
): SkillStep[] {
  return steps.map(step => {
    if (step.id === stepId) {
      return { ...step, status, error }
    }
    return step
  })
}

/**
 * Add feedback to step
 */
export function addStepFeedback(steps: SkillStep[], stepId: string, feedback: string): SkillStep[] {
  return steps.map(step => {
    if (step.id === stepId) {
      return { ...step, feedback }
    }
    return step
  })
}
