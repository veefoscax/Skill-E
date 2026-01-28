/**
 * Context Preparation & Optimization
 * 
 * Implements Smart Context Selection (FR-6.19) and Hierarchical Summarization (FR-6.20)
 * to prevent context bloat when generating skills.
 * 
 * Key principles:
 * - Use only "Key Steps" (max ~10 key frames) instead of raw video/frames
 * - Compress console/network logs into summaries
 * - Hierarchical structure: High-level goal → Step summaries → Detailed logs (on demand)
 * - Prefer API/DOM automation; fall back to image-based only when necessary
 * 
 * Requirements: FR-6.19, FR-6.20
 */

import type { ProcessedSession, ProcessedStep, LLMContext } from '../types/processing';

/**
 * Optimized context for skill generation
 * Compact JSON payload with only essential information
 */
export interface OptimizedContext {
  /** High-level task description (Level 1) */
  taskGoal: string;
  
  /** Key steps only (max ~10) with summaries (Level 2) */
  keySteps: OptimizedStep[];
  
  /** Complete narration for context */
  fullNarration: string;
  
  /** Detected variables */
  variables: Array<{
    name: string;
    type: string;
    description: string;
    exampleValue: string;
  }>;
  
  /** Detected conditionals */
  conditionals: Array<{
    condition: string;
    thenAction: string;
    elseAction?: string;
  }>;
  
  /** Compressed summary statistics */
  summary: {
    totalSteps: number;
    totalClicks: number;
    totalTextInputs: number;
    totalAnnotations: number;
    durationSeconds: number;
    mainApplication?: string;
  };
  
  /** Compressed console/network logs (Level 3 - summary only) */
  logs?: {
    consoleErrors: number;
    consoleWarnings: number;
    consoleInfo: number;
    networkRequests: number;
    apiCallPatterns?: string[]; // e.g., ["POST /login", "GET /user"]
  };
  
  /** Reference to full data (not embedded in prompt) */
  references: {
    screenshotArchive: string;
    sessionDataPath: string;
  };
}

/**
 * Optimized step with only essential information
 */
export interface OptimizedStep {
  /** Step number */
  number: number;
  
  /** Brief description (from transcript or inferred) */
  description: string;
  
  /** Base64 screenshot (key frame only) */
  screenshot?: string;
  
  /** Time range */
  timeRange: {
    start: number;
    end: number;
  };
  
  /** Action summary (not detailed logs) */
  actions: {
    clicks: number;
    textInputs: number;
    annotations: number;
  };
  
  /** Important notes only (filtered) */
  notes: string[];
  
  /** Window/app context */
  context?: {
    window?: string;
    application?: string;
  };
  
  /** OCR text (truncated if too long) */
  ocrText?: string;
}

/**
 * Configuration for context optimization
 */
export interface OptimizationConfig {
  /** Maximum number of key steps to include (default: 10) */
  maxKeySteps: number;
  
  /** Maximum OCR text length per step (default: 500 chars) */
  maxOcrLength: number;
  
  /** Maximum note length (default: 200 chars) */
  maxNoteLength: number;
  
  /** Whether to include screenshots (default: true) */
  includeScreenshots: boolean;
  
  /** Whether to include OCR text (default: true) */
  includeOcr: boolean;
}

/**
 * Default optimization configuration
 */
export const DEFAULT_OPTIMIZATION_CONFIG: OptimizationConfig = {
  maxKeySteps: 10,
  maxOcrLength: 500,
  maxNoteLength: 200,
  includeScreenshots: true,
  includeOcr: true,
};

/**
 * Optimize processed session for skill generation
 * 
 * Implements Smart Context Selection (FR-6.19) and Hierarchical Summarization (FR-6.20)
 * 
 * @param processedSession - Complete processed session from S05
 * @param config - Optimization configuration
 * @returns Optimized context ready for LLM
 */
export async function optimizeContext(
  processedSession: ProcessedSession,
  config: OptimizationConfig = DEFAULT_OPTIMIZATION_CONFIG
): Promise<OptimizedContext> {
  // Level 1: High-level goal
  const taskGoal = extractTaskGoal(processedSession);
  
  // Smart Context Selection: Select key steps only (FR-6.19)
  const keySteps = selectKeySteps(processedSession.steps, config.maxKeySteps);
  
  // Level 2: Step summaries
  const optimizedSteps = await Promise.all(
    keySteps.map(step => optimizeStep(step, config))
  );
  
  // Compress variables
  const variables = processedSession.allVariables.map(v => ({
    name: v.name,
    type: inferVariableType(v.description),
    description: truncateText(v.description, 200),
    exampleValue: extractExampleValue(v.transcriptSegment),
  }));
  
  // Compress conditionals
  const conditionals = processedSession.allConditionals.map(c => ({
    condition: truncateText(c.condition, 150),
    thenAction: truncateText(c.thenAction, 150),
    elseAction: c.elseAction ? truncateText(c.elseAction, 150) : undefined,
  }));
  
  // Calculate summary statistics
  const summary = {
    totalSteps: processedSession.steps.length,
    totalClicks: processedSession.allAnnotations.clicks.length,
    totalTextInputs: processedSession.allAnnotations.keyboardInputs.length,
    totalAnnotations: 
      processedSession.allAnnotations.drawings.length +
      processedSession.allAnnotations.selectedElements.length,
    durationSeconds: Math.round(processedSession.duration / 1000),
    mainApplication: extractMainApplication(processedSession.steps),
  };
  
  // Hierarchical Summarization: Compress logs (FR-6.20, Level 3)
  const logs = compressLogs(processedSession);
  
  return {
    taskGoal,
    keySteps: optimizedSteps,
    fullNarration: processedSession.fullTranscript,
    variables,
    conditionals,
    summary,
    logs,
    references: {
      screenshotArchive: processedSession.sessionId,
      sessionDataPath: processedSession.sessionId,
    },
  };
}

/**
 * Extract high-level task goal from session (Level 1)
 * 
 * @param session - Processed session
 * @returns Task goal description
 */
function extractTaskGoal(session: ProcessedSession): string {
  // Try to extract from first sentence of transcript
  if (session.fullTranscript) {
    const firstSentence = session.fullTranscript.split(/[.!?]/)[0].trim();
    if (firstSentence.length > 10 && firstSentence.length < 200) {
      return firstSentence;
    }
  }
  
  // Fallback: Infer from application and actions
  const mainApp = extractMainApplication(session.steps);
  const hasClicks = session.allAnnotations.clicks.length > 0;
  const hasTextInput = session.allAnnotations.keyboardInputs.length > 0;
  
  if (mainApp) {
    if (hasClicks && hasTextInput) {
      return `Demonstrate workflow in ${mainApp}`;
    } else if (hasClicks) {
      return `Navigate through ${mainApp}`;
    } else if (hasTextInput) {
      return `Enter data in ${mainApp}`;
    }
    return `Use ${mainApp}`;
  }
  
  return 'Demonstrate task';
}

/**
 * Select key steps from all steps (Smart Context Selection - FR-6.19)
 * 
 * Prioritizes steps with:
 * - Annotations (drawings, element selections)
 * - Transcript content
 * - Window changes
 * - Variables or conditionals
 * 
 * @param steps - All processed steps
 * @param maxKeySteps - Maximum number of steps to select
 * @returns Selected key steps
 */
function selectKeySteps(
  steps: ProcessedStep[],
  maxKeySteps: number
): ProcessedStep[] {
  // If we have fewer steps than the limit, return all
  if (steps.length <= maxKeySteps) {
    return steps;
  }

  // Score each step by importance
  const scoredSteps = steps.map((step) => {
    let score = 0;

    // Transcript content (higher score for longer transcripts)
    score += Math.min(step.transcript.length / 100, 5);

    // Annotations (high importance)
    score += step.annotations.drawings.filter(d => d.isPinned).length * 3;
    score += step.annotations.selectedElements.length * 3;
    score += step.annotations.clicks.length * 1;

    // Window/app context
    if (step.windowTitle) score += 2;
    if (step.applicationName) score += 1;

    // Variables and conditionals (very high importance)
    score += step.variables.length * 5;
    score += step.conditionals.length * 5;

    // OCR content (indicates important visual information)
    if (step.ocrText && step.ocrText.length > 50) score += 2;

    return { step, score };
  });

  // Sort by score (descending)
  scoredSteps.sort((a, b) => b.score - a.score);

  // Take top N steps
  const selectedSteps = scoredSteps.slice(0, maxKeySteps).map(s => s.step);

  // Re-sort by step number to maintain chronological order
  selectedSteps.sort((a, b) => a.stepNumber - b.stepNumber);

  return selectedSteps;
}

/**
 * Optimize a single step (Level 2)
 * 
 * @param step - Processed step
 * @param config - Optimization configuration
 * @returns Optimized step
 */
async function optimizeStep(
  step: ProcessedStep,
  config: OptimizationConfig
): Promise<OptimizedStep> {
  // Read screenshot if needed
  let screenshot: string | undefined;
  if (config.includeScreenshots && step.screenshotPath) {
    try {
      screenshot = await readImageAsBase64(step.screenshotPath);
    } catch (error) {
      console.warn(`Failed to read screenshot for step ${step.stepNumber}:`, error);
    }
  }
  
  // Build notes (filter and truncate)
  const notes: string[] = [];
  
  // Add important drawing annotations
  for (const drawing of step.annotations.drawings) {
    if (drawing.isPinned) {
      const note = `${drawing.type} annotation at (${Math.round(drawing.startPoint.x)}, ${Math.round(drawing.startPoint.y)})`;
      notes.push(truncateText(note, config.maxNoteLength));
    }
  }
  
  // Add element selections (very important)
  for (const element of step.annotations.selectedElements) {
    const note = `Selected: ${element.tagName} - "${element.textContent}"`;
    notes.push(truncateText(note, config.maxNoteLength));
  }
  
  // Limit total notes to avoid bloat
  const limitedNotes = notes.slice(0, 5);
  
  // Build context
  const context: OptimizedStep['context'] = {};
  if (step.windowTitle) {
    context.window = truncateText(step.windowTitle, 100);
  }
  if (step.applicationName) {
    context.application = truncateText(step.applicationName, 50);
  }
  
  // Truncate OCR text if needed
  let ocrText: string | undefined;
  if (config.includeOcr && step.ocrText) {
    ocrText = truncateText(step.ocrText, config.maxOcrLength);
  }
  
  return {
    number: step.stepNumber,
    description: step.transcript || `Step ${step.stepNumber}`,
    screenshot,
    timeRange: step.timeRange,
    actions: {
      clicks: step.annotations.clicks.length,
      textInputs: step.annotations.keyboardInputs.length,
      annotations: step.annotations.drawings.length + step.annotations.selectedElements.length,
    },
    notes: limitedNotes,
    context: Object.keys(context).length > 0 ? context : undefined,
    ocrText,
  };
}

/**
 * Compress console/network logs into summaries (Level 3 - FR-6.20)
 * 
 * Instead of including full logs, provide counts and patterns
 * 
 * @param session - Processed session
 * @returns Compressed log summary
 */
function compressLogs(session: ProcessedSession): OptimizedContext['logs'] {
  // TODO: When console/network capture is implemented in future tasks,
  // extract and compress that data here
  
  // For now, return undefined (no log data available yet)
  // This will be populated when S02 adds console/network capture
  
  return undefined;
}

/**
 * Extract main application from steps
 * 
 * @param steps - Processed steps
 * @returns Most common application name
 */
function extractMainApplication(steps: ProcessedStep[]): string | undefined {
  const appCounts = new Map<string, number>();
  
  for (const step of steps) {
    if (step.applicationName) {
      const count = appCounts.get(step.applicationName) || 0;
      appCounts.set(step.applicationName, count + 1);
    }
  }
  
  if (appCounts.size === 0) {
    return undefined;
  }
  
  // Find most common application
  let maxCount = 0;
  let mainApp: string | undefined;
  
  for (const [app, count] of appCounts.entries()) {
    if (count > maxCount) {
      maxCount = count;
      mainApp = app;
    }
  }
  
  return mainApp;
}

/**
 * Infer variable type from description
 * 
 * @param description - Variable description
 * @returns Inferred type
 */
function inferVariableType(description: string): string {
  const lower = description.toLowerCase();
  
  if (lower.includes('email')) return 'email';
  if (lower.includes('password')) return 'password';
  if (lower.includes('url') || lower.includes('link')) return 'url';
  if (lower.includes('number') || lower.includes('count')) return 'number';
  if (lower.includes('date')) return 'date';
  if (lower.includes('file') || lower.includes('path')) return 'file';
  if (lower.includes('select') || lower.includes('choose') || lower.includes('option')) return 'selection';
  
  return 'text';
}

/**
 * Extract example value from transcript segment
 * 
 * @param segment - Transcript segment
 * @returns Example value
 */
function extractExampleValue(segment: string): string {
  // Try to extract quoted values
  const quotedMatch = segment.match(/["']([^"']+)["']/);
  if (quotedMatch) {
    return quotedMatch[1];
  }
  
  // Try to extract email-like patterns
  const emailMatch = segment.match(/\b[\w.+-]+@[\w.-]+\.\w+\b/);
  if (emailMatch) {
    return emailMatch[0];
  }
  
  // Try to extract URL-like patterns
  const urlMatch = segment.match(/https?:\/\/[^\s]+/);
  if (urlMatch) {
    return urlMatch[0];
  }
  
  // Fallback: use first few words
  const words = segment.split(/\s+/).slice(0, 3);
  return words.join(' ');
}

/**
 * Truncate text to maximum length
 * 
 * @param text - Text to truncate
 * @param maxLength - Maximum length
 * @returns Truncated text
 */
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Read image file and convert to base64
 * 
 * @param imagePath - Path to image file
 * @returns Base64-encoded image data with data URL prefix
 */
async function readImageAsBase64(imagePath: string): Promise<string> {
  try {
    // Universal approach: use fetch which works in both Tauri and web
    const response = await fetch(imagePath);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }
    
    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read image'));
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.warn('Failed to read image as base64:', error);
    throw error;
  }
}

/**
 * Convert optimized context to LLM context format
 * 
 * This bridges the new optimized format with the existing LLMContext interface
 * 
 * @param optimizedContext - Optimized context
 * @returns LLM context
 */
export function toLLMContext(optimizedContext: OptimizedContext): LLMContext {
  return {
    taskDescription: optimizedContext.taskGoal,
    steps: optimizedContext.keySteps.map(step => ({
      number: step.number,
      description: step.description,
      screenshot: step.screenshot,
      notes: step.notes,
      timeRange: step.timeRange,
      actions: step.actions,
    })),
    fullNarration: optimizedContext.fullNarration,
    variables: optimizedContext.variables.map(v => ({
      name: v.name,
      description: v.description,
      timestamp: 0, // Not available in optimized format
      transcriptSegment: v.exampleValue,
    })),
    conditionals: optimizedContext.conditionals.map(c => ({
      condition: c.condition,
      thenAction: c.thenAction,
      elseAction: c.elseAction,
      timestamp: 0, // Not available in optimized format
      transcriptSegment: '',
    })),
    summary: {
      ...optimizedContext.summary,
      totalPageLoads: 0, // Not tracked in optimized format
    },
    references: optimizedContext.references,
  };
}
