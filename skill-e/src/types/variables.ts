/**
 * Variable Detection Type Definitions
 * 
 * Defines types for intelligent variable detection from demonstration recordings.
 * Correlates speech patterns with user actions to identify parametric inputs.
 * 
 * @module types/variables
 */

/**
 * Variable type classification
 */
export enum VariableType {
  TEXT = 'text',
  NUMBER = 'number',
  SELECTION = 'selection',
  FILE = 'file',
  DATE = 'date',
}

/**
 * Variable detection status
 */
export type VariableStatus = 'detected' | 'confirmed' | 'rejected' | 'manual';

/**
 * Variable origin source
 */
export type VariableSource = 'speech' | 'action' | 'correlation' | 'llm' | 'manual';

/**
 * Origin information for a detected variable
 * Tracks where and how the variable was detected
 */
export interface VariableOrigin {
  /** Source of the variable detection */
  source: VariableSource;
  
  /** Speech snippet that mentioned the variable (if from speech) */
  speechSnippet?: string;
  
  /** Timestamp of speech mention in milliseconds (if from speech) */
  speechTimestamp?: number;
  
  /** Type of action that suggested the variable (e.g., 'text_input', 'dropdown') */
  actionType?: string;
  
  /** Value entered/selected in the action (if from action) */
  actionValue?: string;
  
  /** Timestamp of action in milliseconds (if from action) */
  actionTimestamp?: number;
}

/**
 * A detected or manually added variable hint
 * Represents a potential parametric input for the generated skill
 */
export interface VariableHint {
  /** Unique identifier for this variable hint */
  id: string;
  
  /** Suggested variable name (e.g., 'customerName', 'email') */
  name: string;
  
  /** Variable type classification */
  type: VariableType;
  
  /** Default value from the demonstration (optional) */
  defaultValue?: string;
  
  /** Available options for selection type variables */
  options?: string[];
  
  /** Human-readable description of the variable */
  description: string;
  
  /** Confidence score (0-1) indicating detection certainty */
  confidence: number;
  
  /** Origin information tracking how this variable was detected */
  origin: VariableOrigin;
  
  /** Current status of the variable hint */
  status: VariableStatus;
}

/**
 * A detected conditional pattern from speech
 * Represents "if X then Y" logic mentioned during demonstration
 */
export interface ConditionalHint {
  /** Unique identifier for this conditional hint */
  id: string;
  
  /** The condition expression (e.g., "user is admin", "file exists") */
  condition: string;
  
  /** Action to take when condition is true */
  thenAction: string;
  
  /** Action to take when condition is false (optional) */
  elseAction?: string;
  
  /** Confidence score (0-1) indicating detection certainty */
  confidence: number;
  
  /** Timestamp in milliseconds when this was mentioned */
  sourceTimestamp: number;
}

/**
 * Result of variable detection process
 */
export interface VariableDetectionResult {
  /** Detected variable hints */
  variables: VariableHint[];
  
  /** Detected conditional patterns */
  conditionals: ConditionalHint[];
  
  /** Processing time in milliseconds */
  processingTime: number;
  
  /** Any warnings or issues during detection */
  warnings?: string[];
}
