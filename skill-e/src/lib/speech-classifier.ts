/**
 * Speech Classification Module
 *
 * Classifies transcription segments into categories:
 * - instruction: Direct action commands
 * - context: Explanatory information
 * - variable: Mentions of dynamic data
 * - conditional: If/then patterns
 *
 * Requirements: FR-5.8, FR-5.9
 *
 * @example
 * ```typescript
 * const segment = { text: "Enter your email address", start: 0, end: 2 };
 * const classification = classifySpeechSegment(segment);
 * console.log(classification.type); // 'variable'
 * console.log(classification.variables); // [{ name: 'email', ... }]
 * ```
 */

import type {
  TranscriptionSegment,
  SpeechClassification,
  DetectedVariable,
  DetectedConditional,
} from '../types/processing'

/**
 * Classification result for a speech segment
 */
interface ClassificationResult {
  /** Primary classification type */
  type: SpeechClassification
  /** Confidence score (0-1) */
  confidence: number
  /** Detected variables in this segment */
  variables: DetectedVariable[]
  /** Detected conditionals in this segment */
  conditionals: DetectedConditional[]
  /** Reasoning for classification */
  reasoning: string
}

/**
 * Pattern definitions for speech classification
 */
const PATTERNS = {
  // Instruction patterns - direct commands
  instruction: {
    prefixes: [
      'click',
      'press',
      'type',
      'enter',
      'select',
      'choose',
      'open',
      'close',
      'go to',
      'navigate',
      'fill',
      'submit',
      'download',
      'upload',
      'scroll',
      'refresh',
      'clique',
      'pressione',
      'digite',
      'selecione',
      'escolha',
      'abra',
      'feche',
      'vá para',
      'navegue',
      'preencha',
      'envie',
      'baixe',
      'faça upload',
    ],
    verbs: [
      'click',
      'press',
      'type',
      'enter',
      'select',
      'choose',
      'open',
      'close',
      'navigate',
      'fill',
      'submit',
      'download',
      'upload',
      'scroll',
      'refresh',
      'copy',
      'paste',
      'delete',
      'create',
      'clique',
      'pressione',
      'digite',
      'selecione',
      'escolha',
      'abra',
      'feche',
      'navegue',
      'preencha',
      'envie',
    ],
  },

  // Variable patterns - indicate dynamic data
  variable: {
    indicators: [
      'your',
      "the user's",
      'any',
      'specific',
      'particular',
      'depending on',
      'based on',
      'enter your',
      'type your',
      'input the',
      'provide the',
      'seu',
      'sua',
      'do usuário',
      'qualquer',
      'específico',
      'particular',
      'dependendo de',
      'baseado em',
      'digite seu',
      'digite sua',
      'insira o',
      'forneça o',
    ],
    fieldTypes: [
      'name',
      'email',
      'password',
      'username',
      'address',
      'phone',
      'id',
      'code',
      'number',
      'date',
      'time',
      'file',
      'url',
      'nome',
      'e-mail',
      'senha',
      'usuário',
      'endereço',
      'telefone',
      'código',
      'número',
      'data',
      'hora',
      'arquivo',
    ],
    placeholders: ['xxx', '...', '[', ']', '{', '}', '<', '>', 'something', 'anything', 'example'],
  },

  // Conditional patterns - if/then statements
  conditional: {
    prefixes: [
      'if',
      'when',
      'in case',
      'should',
      'unless',
      'otherwise',
      'if you',
      'if there',
      'if it',
      'depending on',
      'se',
      'quando',
      'caso',
      'a menos que',
      'caso contrário',
      'se você',
      'se houver',
      'se isto',
      'dependendo de',
    ],
    connectors: [
      'then',
      'otherwise',
      'else',
      'or',
      'and',
      'então',
      'caso contrário',
      'senão',
      'ou',
      'e',
    ],
  },

  // Context patterns - explanatory
  context: {
    phrases: [
      'this is',
      'that is',
      'we are',
      'this means',
      'note that',
      'important',
      'remember',
      'keep in mind',
      'as you can see',
      'the reason',
      'because',
      'therefore',
      'esto é',
      'isso é',
      'estamos',
      'isso significa',
      'observe que',
      'importante',
      'lembre-se',
      'mantenha em mente',
      'como você pode ver',
      'a razão',
      'porque',
      'portanto',
    ],
  },
}

/**
 * Classify a single transcription segment
 *
 * @param segment - Transcription segment to classify
 * @returns Classification result with variables and conditionals
 */
export function classifySpeechSegment(segment: TranscriptionSegment): ClassificationResult {
  const text = segment.text.toLowerCase().trim()
  const results: ClassificationResult = {
    type: 'unknown',
    confidence: 0,
    variables: [],
    conditionals: [],
    reasoning: '',
  }

  // Detect variables first (highest priority)
  const variables = detectVariables(text, segment)
  if (variables.length > 0) {
    results.variables = variables
    results.type = 'variable'
    results.confidence = 0.8
    results.reasoning = `Detected ${variables.length} variable(s): ${variables.map(v => v.name).join(', ')}`
  }

  // Detect conditionals
  const conditionals = detectConditionals(text, segment)
  if (conditionals.length > 0) {
    results.conditionals = conditionals
    // Upgrade to conditional if no variables, or combine
    if (results.type === 'unknown') {
      results.type = 'conditional'
      results.confidence = 0.85
    }
    results.reasoning += `; Detected conditional: ${conditionals[0].condition}`
  }

  // Check for instruction patterns
  const instructionScore = calculateInstructionScore(text)
  if (instructionScore > 0.7 && results.type === 'unknown') {
    results.type = 'instruction'
    results.confidence = instructionScore
    results.reasoning = 'Contains action verbs and command structure'
  }

  // Check for context patterns
  const contextScore = calculateContextScore(text)
  if (contextScore > 0.6 && results.type === 'unknown') {
    results.type = 'context'
    results.confidence = contextScore
    results.reasoning = 'Explanatory language detected'
  }

  // Default to context if no other classification and segment is long
  if (results.type === 'unknown' && text.length > 50) {
    results.type = 'context'
    results.confidence = 0.5
    results.reasoning = 'Long explanatory segment'
  }

  return results
}

/**
 * Classify multiple transcription segments
 *
 * @param segments - Array of transcription segments
 * @returns Array of classification results
 */
export function classifySpeechSegments(segments: TranscriptionSegment[]): ClassificationResult[] {
  return segments.map(segment => classifySpeechSegment(segment))
}

/**
 * Detect variables mentioned in text
 *
 * @param text - Lowercase text to analyze
 * @param segment - Original transcription segment
 * @returns Array of detected variables
 */
function detectVariables(text: string, segment: TranscriptionSegment): DetectedVariable[] {
  const variables: DetectedVariable[] = []

  // Pattern: "your/enter/type X" or "o/seu X"
  const variablePatterns = [
    // English patterns
    { regex: /(?:your|the user's|enter your|type your)\s+(\w+(?:\s+\w+){0,2})/gi, type: 'text' },
    { regex: /(?:input|provide|fill in)\s+(?:the\s+)?(\w+(?:\s+\w+){0,2})/gi, type: 'text' },
    { regex: /(?:any|specific)\s+(\w+(?:\s+\w+){0,2})/gi, type: 'text' },
    // Portuguese patterns
    {
      regex: /(?:seu|sua|do usuário|digite seu|digite sua)\s+(\w+(?:\s+\w+){0,2})/gi,
      type: 'text',
    },
    { regex: /(?:insira|forneça|preencha)\s+(?:o\s+|a\s+)?(\w+(?:\s+\w+){0,2})/gi, type: 'text' },
    { regex: /(?:qualquer|específico|específica)\s+(\w+(?:\s+\w+){0,2})/gi, type: 'text' },
  ]

  for (const pattern of variablePatterns) {
    const matches = text.matchAll(pattern.regex)
    for (const match of matches) {
      const variableName = normalizeVariableName(match[1])
      if (isValidVariableName(variableName)) {
        variables.push({
          name: variableName,
          description: `User's ${match[1]}`,
          timestamp: segment.start * 1000, // Convert to ms
          transcriptSegment: segment.text,
        })
      }
    }
  }

  // Check for field type patterns
  for (const fieldType of PATTERNS.variable.fieldTypes) {
    const fieldPattern = new RegExp(`(?:your|the|o|a|seu|sua)\\s+${fieldType}\\b`, 'i')
    if (fieldPattern.test(text) && !variables.some(v => v.name === fieldType)) {
      variables.push({
        name: fieldType,
        description: `The ${fieldType} value`,
        timestamp: segment.start * 1000,
        transcriptSegment: segment.text,
      })
    }
  }

  // Remove duplicates
  return variables.filter((v, i, arr) => arr.findIndex(t => t.name === v.name) === i)
}

/**
 * Detect conditional statements in text
 *
 * @param text - Lowercase text to analyze
 * @param segment - Original transcription segment
 * @returns Array of detected conditionals
 */
function detectConditionals(text: string, segment: TranscriptionSegment): DetectedConditional[] {
  const conditionals: DetectedConditional[] = []

  // Pattern: "if X then Y" or "se X então Y"
  const conditionalPatterns = [
    // English: "if you see X, click Y"
    {
      regex: /if\s+(.+?)(?:,\s*|\s+then\s+)(.+)/i,
      conditionGroup: 1,
      thenGroup: 2,
    },
    // English: "when X happens, do Y"
    {
      regex: /when\s+(.+?)(?:,\s*|\s+do\s+)(.+)/i,
      conditionGroup: 1,
      thenGroup: 2,
    },
    // Portuguese: "se você ver X, clique Y"
    {
      regex: /se\s+(.+?)(?:,\s*|\s+então\s+)(.+)/i,
      conditionGroup: 1,
      thenGroup: 2,
    },
    // Portuguese: "quando X acontecer, faça Y"
    {
      regex: /quando\s+(.+?)(?:,\s*|\s+faça\s+)(.+)/i,
      conditionGroup: 1,
      thenGroup: 2,
    },
  ]

  for (const pattern of conditionalPatterns) {
    const match = text.match(pattern.regex)
    if (match) {
      const condition = match[pattern.conditionGroup].trim()
      const thenAction = match[pattern.thenGroup].trim()

      // Check for else clause
      let elseAction: string | undefined
      const elseMatch = thenAction.match(/(.+?)\s+(?:otherwise|else|caso contrário|senão)\s+(.+)/i)
      if (elseMatch) {
        elseAction = elseMatch[2].trim()
      }

      conditionals.push({
        condition: capitalizeFirst(condition),
        thenAction: capitalizeFirst(elseMatch ? elseMatch[1] : thenAction),
        elseAction: elseAction ? capitalizeFirst(elseAction) : undefined,
        timestamp: segment.start * 1000,
        transcriptSegment: segment.text,
      })
    }
  }

  // Check for "depending on X" patterns
  const dependingPattern = /depending\s+on\s+(.+?)[.,]|dependendo\s+de\s+(.+?)[.,]/i
  const dependingMatch = text.match(dependingPattern)
  if (dependingMatch && conditionals.length === 0) {
    conditionals.push({
      condition: `Depends on ${dependingMatch[1] || dependingMatch[2]}`,
      thenAction: 'Follow appropriate path',
      timestamp: segment.start * 1000,
      transcriptSegment: segment.text,
    })
  }

  return conditionals
}

/**
 * Calculate instruction pattern match score
 *
 * @param text - Lowercase text to analyze
 * @returns Score 0-1
 */
function calculateInstructionScore(text: string): number {
  let score = 0

  // Check for instruction prefixes
  for (const prefix of PATTERNS.instruction.prefixes) {
    if (text.startsWith(prefix)) {
      score += 0.4
      break
    }
  }

  // Check for action verbs
  for (const verb of PATTERNS.instruction.verbs) {
    if (text.includes(verb)) {
      score += 0.2
      break
    }
  }

  // Short segments with action words are likely instructions
  if (text.length < 30 && score > 0) {
    score += 0.2
  }

  return Math.min(score, 1)
}

/**
 * Calculate context pattern match score
 *
 * @param text - Lowercase text to analyze
 * @returns Score 0-1
 */
function calculateContextScore(text: string): number {
  let score = 0

  // Check for context phrases
  for (const phrase of PATTERNS.context.phrases) {
    if (text.includes(phrase)) {
      score += 0.3
    }
  }

  // Longer segments without action words are likely context
  if (text.length > 50) {
    score += 0.2
  }

  // Explanatory words
  const explanatoryWords = [
    'because',
    'since',
    'therefore',
    'reason',
    'why',
    'porque',
    'desde',
    'portanto',
    'razão',
  ]
  for (const word of explanatoryWords) {
    if (text.includes(word)) {
      score += 0.2
    }
  }

  return Math.min(score, 1)
}

/**
 * Normalize variable name for use in skills
 *
 * @param name - Raw variable name
 * @returns Normalized camelCase name
 */
function normalizeVariableName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+(.)/g, (_, char) => char.toUpperCase())
    .replace(/^(.)/, (_, char) => char.toLowerCase())
}

/**
 * Check if variable name is valid
 *
 * @param name - Variable name to check
 * @returns True if valid
 */
function isValidVariableName(name: string): boolean {
  // Must be at least 2 characters
  if (name.length < 2) return false

  // Must not be a common stop word
  const stopWords = new Set([
    'the',
    'a',
    'an',
    'this',
    'that',
    'these',
    'those',
    'it',
    'they',
    'o',
    'a',
    'os',
    'as',
    'este',
    'esta',
    'isto',
    'eles',
    'elas',
  ])
  if (stopWords.has(name.toLowerCase())) return false

  return true
}

/**
 * Capitalize first letter of text
 *
 * @param text - Text to capitalize
 * @returns Capitalized text
 */
function capitalizeFirst(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/**
 * Batch classify all segments in a transcription
 * Returns aggregated statistics
 *
 * @param segments - All transcription segments
 * @returns Classification statistics
 */
export function getClassificationStats(segments: TranscriptionSegment[]): {
  totalSegments: number
  byType: Record<SpeechClassification, number>
  allVariables: DetectedVariable[]
  allConditionals: DetectedConditional[]
} {
  const classifications = classifySpeechSegments(segments)

  const byType: Record<SpeechClassification, number> = {
    instruction: 0,
    context: 0,
    variable: 0,
    conditional: 0,
    unknown: 0,
  }

  const allVariables: DetectedVariable[] = []
  const allConditionals: DetectedConditional[] = []

  for (const classification of classifications) {
    byType[classification.type]++
    allVariables.push(...classification.variables)
    allConditionals.push(...classification.conditionals)
  }

  return {
    totalSegments: segments.length,
    byType,
    allVariables: allVariables.filter((v, i, arr) => arr.findIndex(t => t.name === v.name) === i),
    allConditionals,
  }
}
