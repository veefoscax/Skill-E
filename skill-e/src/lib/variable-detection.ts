/**
 * Variable Detection - Correlation Engine
 * 
 * Main correlation algorithm that brings together speech pattern matching
 * and action variable extraction to identify variables with high confidence
 * by correlating speech mentions with user actions within a time window.
 * 
 * Requirements: FR-7.3
 * 
 * @module lib/variable-detection
 */

import { extractSpeechVariables, type SpeechVariableHint } from './speech-patterns';
import { extractActionVariables, type ActionVariableHint, type ActionEvent } from './action-variables';
import { VariableHint, VariableType, VariableDetectionResult } from '../types/variables';

/**
 * Generates a unique ID for variable hints
 */
function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Transcript segment with timing information
 */
export interface TranscriptSegment {
  /** The transcribed text */
  text: string;
  
  /** Start time in milliseconds */
  start: number;
  
  /** End time in milliseconds */
  end: number;
}

/**
 * Configuration for correlation algorithm
 */
export interface CorrelationConfig {
  /** Time window in milliseconds for correlating speech with actions (default: 5000ms) */
  correlationWindowMs?: number;
  
  /** Minimum confidence threshold for including hints (default: 0.5) */
  minConfidence?: number;
  
  /** Boost factor for correlated hints (default: 0.2) */
  correlationBoost?: number;
}

const DEFAULT_CONFIG: Required<CorrelationConfig> = {
  correlationWindowMs: 5000,
  minConfidence: 0.5,
  correlationBoost: 0.2,
};

/**
 * Main correlation function that detects variables by correlating speech and actions
 * 
 * This is the core algorithm that:
 * 1. Extracts variable hints from speech patterns
 * 2. Extracts variable hints from user actions
 * 3. Correlates speech and actions within a time window
 * 4. Calculates combined confidence scores
 * 5. Deduplicates and returns the best hints
 * 
 * @param speechSegments - Array of transcript segments with timestamps
 * @param actions - Array of action events to analyze
 * @param config - Optional configuration for correlation behavior
 * @returns Detection result with correlated variable hints
 * 
 * @example
 * ```typescript
 * const result = correlateVariables(
 *   [{ text: "Digite o nome do cliente", start: 1000, end: 3000 }],
 *   [{ type: 'keyboard', timestamp: 4000, keyboard: { currentText: 'John Doe', ... } }]
 * );
 * // Returns hints with high confidence for 'cliente' variable
 * ```
 */
export function correlateVariables(
  speechSegments: TranscriptSegment[],
  actions: ActionEvent[],
  config: CorrelationConfig = {}
): VariableDetectionResult {
  const startTime = Date.now();
  const cfg = { ...DEFAULT_CONFIG, ...config };
  
  const hints: VariableHint[] = [];
  const warnings: string[] = [];
  
  // Extract hints from speech patterns
  const speechHints = extractAllSpeechHints(speechSegments);
  
  // Extract hints from actions
  const actionHints = extractActionVariables(actions);
  
  // Correlate speech hints with action hints
  const { correlatedHints, usedSpeechIndices, usedActionIndices } = performCorrelation(
    speechHints,
    actionHints,
    speechSegments,
    cfg
  );
  
  // Add standalone speech hints (no matching action)
  const standaloneSpeechHints = createStandaloneSpeechHints(
    speechHints,
    usedSpeechIndices,
    cfg
  );
  
  // Add standalone action hints (no matching speech)
  const standaloneActionHints = createStandaloneActionHints(
    actionHints,
    usedActionIndices,
    cfg
  );
  
  // Combine all hints
  hints.push(...correlatedHints, ...standaloneSpeechHints, ...standaloneActionHints);
  
  // Deduplicate hints
  const deduplicatedHints = deduplicateHints(hints);
  
  // Filter by minimum confidence
  const filteredHints = deduplicatedHints.filter(h => h.confidence >= cfg.minConfidence);
  
  const processingTime = Date.now() - startTime;
  
  return {
    variables: filteredHints,
    conditionals: [], // TODO: Implement conditional detection in future task
    processingTime,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Extracts speech hints from all transcript segments
 */
function extractAllSpeechHints(
  segments: TranscriptSegment[]
): Array<SpeechVariableHint & { segment: TranscriptSegment }> {
  const hints: Array<SpeechVariableHint & { segment: TranscriptSegment }> = [];
  
  for (const segment of segments) {
    const segmentHints = extractSpeechVariables(segment.text, segment.start);
    
    // Attach segment info to each hint
    for (const hint of segmentHints) {
      hints.push({ ...hint, segment });
    }
  }
  
  return hints;
}

/**
 * Performs correlation between speech hints and action hints
 * 
 * Correlation logic:
 * - Speech mention followed by action within window = high confidence correlation
 * - Type compatibility check (e.g., "seleciona" speech + dropdown action)
 * - Prefer closer actions in time
 * 
 * Returns both the correlated hints and the sets of used indices
 */
function performCorrelation(
  speechHints: Array<SpeechVariableHint & { segment: TranscriptSegment }>,
  actionHints: ActionVariableHint[],
  segments: TranscriptSegment[],
  config: Required<CorrelationConfig>
): {
  correlatedHints: VariableHint[];
  usedSpeechIndices: Set<number>;
  usedActionIndices: Set<number>;
} {
  const correlatedHints: VariableHint[] = [];
  const usedSpeechIndices = new Set<number>();
  const usedActionIndices = new Set<number>();
  
  for (let i = 0; i < speechHints.length; i++) {
    const speechHint = speechHints[i];
    const speechEndTime = speechHint.segment.end;
    
    // Find all candidate actions within correlation window
    const candidates: Array<{ index: number; hint: ActionVariableHint; timeDiff: number }> = [];
    
    for (let j = 0; j < actionHints.length; j++) {
      // Skip if action already used
      if (usedActionIndices.has(j)) {
        continue;
      }
      
      const actionHint = actionHints[j];
      const timeDiff = actionHint.timestamp - speechEndTime;
      
      // Check if action is within correlation window
      if (timeDiff >= 0 && timeDiff <= config.correlationWindowMs) {
        // Check if this is a likely correlation
        if (isLikelyCorrelated(speechHint, actionHint)) {
          candidates.push({ index: j, hint: actionHint, timeDiff });
        }
      }
    }
    
    // If we have candidates, choose the closest one in time
    if (candidates.length > 0) {
      candidates.sort((a, b) => a.timeDiff - b.timeDiff);
      const best = candidates[0];
      
      // Create correlated hint
      const correlatedHint = createCorrelatedHint(
        speechHint,
        best.hint,
        config.correlationBoost
      );
      
      correlatedHints.push(correlatedHint);
      usedSpeechIndices.add(i);
      usedActionIndices.add(best.index);
    }
  }
  
  return { correlatedHints, usedSpeechIndices, usedActionIndices };
}

/**
 * Checks if a speech hint and action hint are likely correlated
 * 
 * Correlation indicators:
 * - Type compatibility (e.g., selection speech + dropdown action)
 * - Name similarity
 * - Context clues
 * - For TEXT types, be more lenient since names often differ between languages
 */
function isLikelyCorrelated(
  speechHint: SpeechVariableHint,
  actionHint: ActionVariableHint
): boolean {
  // Check type compatibility
  const typesCompatible = areTypesCompatible(speechHint.type, actionHint.type);
  if (!typesCompatible) {
    return false;
  }
  
  // For TEXT types with generic action names, assume correlation
  // (e.g., Portuguese speech "cliente" + English action "name")
  if (speechHint.type === VariableType.TEXT && actionHint.type === VariableType.TEXT) {
    // If action has a generic name, likely correlated
    if (isGenericName(actionHint.suggestedName)) {
      return true;
    }
    
    // If speech has a specific name and action has a specific name, check similarity
    if (!isGenericName(speechHint.suggestedName) && !isGenericName(actionHint.suggestedName)) {
      const nameSimilarity = calculateNameSimilarity(
        speechHint.suggestedName,
        actionHint.suggestedName
      );
      return nameSimilarity > 0.5;
    }
    
    // If speech is generic, likely correlated
    if (isGenericName(speechHint.suggestedName)) {
      return true;
    }
  }
  
  // For SELECTION types, check name similarity
  if (speechHint.type === VariableType.SELECTION || actionHint.type === VariableType.SELECTION) {
    // For selections, be very lenient - if types match, likely correlated
    // (e.g., Portuguese "país" + English "country" should correlate)
    return true;
  }
  
  // For other types, check name similarity
  const nameSimilarity = calculateNameSimilarity(
    speechHint.suggestedName,
    actionHint.suggestedName
  );
  
  return nameSimilarity > 0.5 || isGenericName(speechHint.suggestedName) || isGenericName(actionHint.suggestedName);
}

/**
 * Checks if two variable types are compatible for correlation
 */
function areTypesCompatible(speechType: VariableType, actionType: VariableType): boolean {
  // Exact match
  if (speechType === actionType) {
    return true;
  }
  
  // TEXT type is compatible with most types (generic)
  if (speechType === VariableType.TEXT || actionType === VariableType.TEXT) {
    return true;
  }
  
  // NUMBER can be compatible with TEXT (numbers entered as text)
  if (
    (speechType === VariableType.NUMBER && actionType === VariableType.TEXT) ||
    (speechType === VariableType.TEXT && actionType === VariableType.NUMBER)
  ) {
    return true;
  }
  
  return false;
}

/**
 * Calculates name similarity between two variable names (0-1)
 * Uses simple string similarity metrics
 */
function calculateNameSimilarity(name1: string, name2: string): number {
  const n1 = name1.toLowerCase();
  const n2 = name2.toLowerCase();
  
  // Exact match
  if (n1 === n2) {
    return 1.0;
  }
  
  // One contains the other
  if (n1.includes(n2) || n2.includes(n1)) {
    return 0.8;
  }
  
  // Calculate Levenshtein distance ratio
  const maxLen = Math.max(n1.length, n2.length);
  if (maxLen === 0) {
    return 1.0;
  }
  
  const distance = levenshteinDistance(n1, n2);
  return 1 - distance / maxLen;
}

/**
 * Calculates Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;
  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));
  
  for (let i = 0; i <= m; i++) {
    dp[i][0] = i;
  }
  
  for (let j = 0; j <= n; j++) {
    dp[0][j] = j;
  }
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,    // deletion
          dp[i][j - 1] + 1,    // insertion
          dp[i - 1][j - 1] + 1 // substitution
        );
      }
    }
  }
  
  return dp[m][n];
}

/**
 * Checks if a name is generic (e.g., 'textValue', 'input')
 */
function isGenericName(name: string): boolean {
  const genericNames = [
    'textvalue', 'numbervalue', 'selection', 'file', 'date', 'value',
    'textinput', 'input', 'textarea', 'dynamicvalue', 'name', 'email',
    'phone', 'number', 'text', 'country', 'city', 'state', 'address'
  ];
  
  return genericNames.includes(name.toLowerCase());
}

/**
 * Creates a correlated variable hint from speech and action hints
 */
function createCorrelatedHint(
  speechHint: SpeechVariableHint & { segment: TranscriptSegment },
  actionHint: ActionVariableHint,
  correlationBoost: number
): VariableHint {
  // Choose the better name
  let name: string;
  
  // Prefer action name if speech name is too short (likely truncated by accent removal)
  if (speechHint.suggestedName.length < 3 && actionHint.suggestedName.length >= 3) {
    name = actionHint.suggestedName;
  }
  // Prefer non-generic names
  else if (isGenericName(speechHint.suggestedName) && !isGenericName(actionHint.suggestedName)) {
    name = actionHint.suggestedName;
  }
  // Prefer longer, more descriptive names
  else if (actionHint.suggestedName.length > speechHint.suggestedName.length + 3) {
    name = actionHint.suggestedName;
  }
  // Default to speech name
  else {
    name = speechHint.suggestedName;
  }
  
  // Choose the more specific type
  const type = speechHint.type === VariableType.TEXT ? actionHint.type : speechHint.type;
  
  // Calculate combined confidence (average + correlation boost)
  const baseConfidence = (speechHint.confidence + actionHint.confidence) / 2;
  const confidence = Math.min(1.0, baseConfidence + correlationBoost);
  
  // Create description from both sources
  const description = `From speech: "${speechHint.matchedText}" + Action: ${actionHint.actionType}`;
  
  return {
    id: generateId(),
    name,
    type,
    defaultValue: actionHint.value,
    description,
    confidence,
    origin: {
      source: 'correlation',
      speechSnippet: speechHint.matchedText,
      speechTimestamp: speechHint.segment.start,
      actionType: actionHint.actionType,
      actionValue: actionHint.value,
      actionTimestamp: actionHint.timestamp,
    },
    status: 'detected',
  };
}

/**
 * Creates standalone speech hints (no matching action found)
 */
function createStandaloneSpeechHints(
  speechHints: Array<SpeechVariableHint & { segment: TranscriptSegment }>,
  usedSpeechIndices: Set<number>,
  config: Required<CorrelationConfig>
): VariableHint[] {
  const hints: VariableHint[] = [];
  
  for (let i = 0; i < speechHints.length; i++) {
    // Skip if already correlated
    if (usedSpeechIndices.has(i)) {
      continue;
    }
    
    const speechHint = speechHints[i];
    
    // Skip generic names with low confidence
    if (isGenericName(speechHint.suggestedName) && speechHint.confidence < 0.7) {
      continue;
    }
    
    hints.push({
      id: generateId(),
      name: speechHint.suggestedName,
      type: speechHint.type,
      description: `From speech: "${speechHint.matchedText}"`,
      confidence: speechHint.confidence * 0.8, // Reduce confidence for standalone
      origin: {
        source: 'speech',
        speechSnippet: speechHint.matchedText,
        speechTimestamp: speechHint.segment.start,
      },
      status: 'detected',
    });
  }
  
  return hints;
}

/**
 * Creates standalone action hints (no matching speech found)
 */
function createStandaloneActionHints(
  actionHints: ActionVariableHint[],
  usedActionIndices: Set<number>,
  config: Required<CorrelationConfig>
): VariableHint[] {
  const hints: VariableHint[] = [];
  
  for (let j = 0; j < actionHints.length; j++) {
    // Skip if already correlated
    if (usedActionIndices.has(j)) {
      continue;
    }
    
    const actionHint = actionHints[j];
    
    // Skip generic names with low confidence
    if (isGenericName(actionHint.suggestedName) && actionHint.confidence < 0.7) {
      continue;
    }
    
    hints.push({
      id: generateId(),
      name: actionHint.suggestedName,
      type: actionHint.type,
      defaultValue: actionHint.value,
      description: `From action: ${actionHint.actionType}`,
      confidence: actionHint.confidence * 0.85, // Slight reduction for standalone
      origin: {
        source: 'action',
        actionType: actionHint.actionType,
        actionValue: actionHint.value,
        actionTimestamp: actionHint.timestamp,
      },
      status: 'detected',
    });
  }
  
  return hints;
}

/**
 * Deduplicates variable hints, keeping the highest confidence version
 * 
 * Deduplication strategy:
 * - Merge hints with same name and type
 * - Keep the highest confidence version
 * - Preserve origin information from all sources
 * - Prefer correlated hints over standalone hints
 */
export function deduplicateHints(hints: VariableHint[]): VariableHint[] {
  const hintMap = new Map<string, VariableHint>();
  
  for (const hint of hints) {
    const key = `${hint.name.toLowerCase()}_${hint.type}`;
    const existing = hintMap.get(key);
    
    if (!existing) {
      // First hint with this name/type
      hintMap.set(key, hint);
    } else {
      // Merge with existing hint
      const merged = mergeHints(existing, hint);
      hintMap.set(key, merged);
    }
  }
  
  return Array.from(hintMap.values())
    .sort((a, b) => b.confidence - a.confidence); // Sort by confidence descending
}

/**
 * Merges two variable hints, keeping the best information from both
 */
function mergeHints(hint1: VariableHint, hint2: VariableHint): VariableHint {
  // Prefer correlated hints over standalone
  const hint1IsCorrelated = hint1.origin.source === 'correlation';
  const hint2IsCorrelated = hint2.origin.source === 'correlation';
  
  let primary: VariableHint;
  let secondary: VariableHint;
  
  if (hint1IsCorrelated && !hint2IsCorrelated) {
    primary = hint1;
    secondary = hint2;
  } else if (hint2IsCorrelated && !hint1IsCorrelated) {
    primary = hint2;
    secondary = hint1;
  } else {
    // Both correlated or both standalone - use confidence
    primary = hint1.confidence >= hint2.confidence ? hint1 : hint2;
    secondary = hint1.confidence >= hint2.confidence ? hint2 : hint1;
  }
  
  // Merge descriptions
  const descriptions = [primary.description];
  if (secondary.description && !primary.description.includes(secondary.description)) {
    descriptions.push(secondary.description);
  }
  
  // Use the highest confidence
  const confidence = Math.max(hint1.confidence, hint2.confidence);
  
  // Prefer non-empty default values
  const defaultValue = primary.defaultValue || secondary.defaultValue;
  
  // Merge options for selection types
  const options = primary.options || secondary.options;
  
  return {
    ...primary,
    confidence,
    defaultValue,
    options,
    description: descriptions.join(' | '),
  };
}
