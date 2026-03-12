/**
 * Processing Pipeline
 *
 * Combines screen captures, transcription, and annotations into structured context
 * for LLM skill generation.
 *
 * Requirements: FR-5.1, FR-5.2, FR-5.3, FR-5.4, FR-5.5
 */

import type { CaptureSession, CaptureFrame } from '../types/capture'
import type { TranscriptionResult, TranscriptionSegment } from './whisper'
import type {
  ProcessedSession,
  ProcessedStep,
  TimelineEvent,
  ScreenshotEvent,
  VoiceEvent,
  ClickEvent,
  DrawingEvent,
  ElementSelectionEvent,
  WindowChangeEvent,
  PauseEvent,
  ProcessingProgress,
} from '../types/processing'
import type {
  ClickIndicator,
  DrawingElement,
  SelectedElement,
  KeyboardState,
} from '../stores/overlay'
import { extractTextFromImages } from './ocr'
import { getClassificationStats } from './speech-classifier'
import { readFile } from '@tauri-apps/plugin-fs' // ADDED: Use Tauri FS

/**
 * Session data loaded from various sources
 */
export interface SessionData {
  /** Capture session with frames */
  captureSession: CaptureSession
  /** Transcription result with segments */
  transcription: TranscriptionResult | null
  /** Click annotations */
  clicks: ClickIndicator[]
  /** Drawing annotations */
  drawings: DrawingElement[]
  /** Selected elements */
  selectedElements: SelectedElement[]
  /** Keyboard inputs */
  keyboardInputs: KeyboardState[]
}

/**
 * Load all session data from various sources
 *
 * Requirements: FR-5.1
 *
 * @param sessionId - Unique session identifier
 * @param captureSession - Capture session with frames
 * @param transcription - Transcription result (optional)
 * @param annotations - Annotations from overlay store
 * @returns Complete session data
 */
export async function loadSession(
  sessionId: string,
  captureSession: CaptureSession,
  transcription: TranscriptionResult | null,
  annotations: {
    clicks: ClickIndicator[]
    drawings: DrawingElement[]
    selectedElements: SelectedElement[]
    keyboardInputs: KeyboardState[]
  }
): Promise<SessionData> {
  // Validate inputs
  if (!sessionId || sessionId.trim() === '') {
    throw new Error('Session ID is required')
  }

  if (!captureSession) {
    throw new Error('Capture session is required')
  }

  if (!captureSession.frames || captureSession.frames.length === 0) {
    throw new Error('Capture session must contain at least one frame')
  }

  // Load transcription with timestamps (if available)
  const transcriptionData = transcription || null

  // Load annotations from store
  const clicks = annotations.clicks || []
  const drawings = annotations.drawings || []
  const selectedElements = annotations.selectedElements || []
  const keyboardInputs = annotations.keyboardInputs || []

  // Return complete session data
  return {
    captureSession,
    transcription: transcriptionData,
    clicks,
    drawings,
    selectedElements,
    keyboardInputs,
  }
}

/**
 * Build unified timeline from all events
 *
 * Requirements: FR-5.2, FR-5.10
 *
 * @param sessionData - Complete session data
 * @returns Sorted timeline of all events
 */
export function buildTimeline(sessionData: SessionData): TimelineEvent[] {
  const timeline: TimelineEvent[] = []

  // Add screenshot events
  for (const frame of sessionData.captureSession.frames) {
    const event: ScreenshotEvent = {
      id: frame.id,
      type: 'screenshot',
      timestamp: frame.timestamp,
      frame,
    }
    timeline.push(event)
  }

  // Add voice events (if transcription available)
  if (sessionData.transcription) {
    const sessionStartTime = sessionData.captureSession.startTime

    for (const segment of sessionData.transcription.segments) {
      // Convert segment timestamps (in seconds) to absolute timestamps
      const absoluteTimestamp = sessionStartTime + segment.start * 1000

      const event: VoiceEvent = {
        id: `voice-${segment.id}`,
        type: 'voice',
        timestamp: absoluteTimestamp,
        segment: {
          text: segment.text,
          startTime: (segment as any).startTime || (segment as any).start || 0,
          endTime: (segment as any).endTime || (segment as any).end || 0,
        },
      }
      timeline.push(event)
    }
  }

  // Add click events
  for (const click of sessionData.clicks) {
    const event: ClickEvent = {
      id: click.id,
      type: 'click',
      timestamp: click.timestamp,
      click,
    }
    timeline.push(event)
  }

  // Add drawing events
  for (const drawing of sessionData.drawings) {
    const event: DrawingEvent = {
      id: drawing.id,
      type: 'drawing',
      timestamp: drawing.timestamp,
      drawing,
    }
    timeline.push(event)
  }

  // Add element selection events
  for (const element of sessionData.selectedElements) {
    const event: ElementSelectionEvent = {
      id: `element-${element.timestamp}`,
      type: 'element_selection',
      timestamp: element.timestamp,
      element,
    }
    timeline.push(event)
  }

  // Add keyboard events
  // Note: KeyboardState from overlay store doesn't have a timestamp field
  // This would need to be added to the KeyboardState interface to include keyboard events
  // For now, keyboard events are tracked but not included in the timeline

  // Sort timeline chronologically
  timeline.sort((a, b) => a.timestamp - b.timestamp)

  return timeline
}

/**
 * Detect voice pauses in transcription
 *
 * Requirements: FR-5.3
 *
 * @param segments - Transcription segments
 * @param sessionStartTime - Session start timestamp
 * @param pauseThresholdMs - Minimum pause duration to detect (default: 2000ms)
 * @returns Array of pause events
 */
export function detectVoicePauses(
  segments: TranscriptionSegment[],
  sessionStartTime: number,
  pauseThresholdMs: number = 2000
): PauseEvent[] {
  const pauses: PauseEvent[] = []

  for (let i = 0; i < segments.length - 1; i++) {
    const currentSegment = segments[i]
    const nextSegment = segments[i + 1]

    // Calculate pause duration (in seconds)
    const pauseDuration = nextSegment.start - currentSegment.end
    const pauseDurationMs = pauseDuration * 1000

    // If pause is longer than threshold, create a pause event
    if (pauseDurationMs >= pauseThresholdMs) {
      const pauseTimestamp = sessionStartTime + currentSegment.end * 1000

      const pauseEvent: PauseEvent = {
        id: `pause-${i}`,
        type: 'pause',
        timestamp: pauseTimestamp,
        duration: pauseDurationMs,
      }

      pauses.push(pauseEvent)
    }
  }

  return pauses
}

/**
 * Detect window changes in timeline
 *
 * Requirements: FR-5.3, FR-5.7
 *
 * @param frames - Capture frames with window info
 * @returns Array of window change events
 */
export function detectWindowChanges(frames: CaptureFrame[]): WindowChangeEvent[] {
  const windowChanges: WindowChangeEvent[] = []
  let previousWindow: string | null = null

  for (const frame of frames) {
    if (frame.activeWindow) {
      const currentWindow = frame.activeWindow.title

      // Detect window change
      if (previousWindow !== null && currentWindow !== previousWindow) {
        const event: WindowChangeEvent = {
          id: `window-change-${frame.id}`,
          type: 'window_change',
          timestamp: frame.timestamp,
          window: frame.activeWindow,
        }
        windowChanges.push(event)
      }

      previousWindow = currentWindow
    }
  }

  return windowChanges
}

/**
 * Create processing progress state
 *
 * Requirements: FR-5.5, NFR-5.2
 *
 * @param stage - Current processing stage
 * @param percentage - Progress percentage (0-100)
 * @param currentStep - Current step label
 * @param estimatedTimeRemaining - Estimated time remaining in seconds
 * @returns Processing progress state
 */
export function createProgress(
  stage: ProcessingProgress['stage'],
  percentage: number,
  currentStep: string,
  estimatedTimeRemaining?: number
): ProcessingProgress {
  return {
    stage,
    percentage: Math.max(0, Math.min(100, percentage)),
    currentStep,
    estimatedTimeRemaining,
  }
}

/**
 * Detect logical steps from timeline events
 *
 * Groups timeline events into logical steps based on:
 * - Voice pauses > 2 seconds
 * - Window focus changes
 * - Explicit annotations (drawings, element selections)
 *
 * Requirements: FR-5.3
 *
 * @param timeline - Sorted timeline of all events
 * @param sessionData - Complete session data
 * @returns Array of processed steps
 */
export function detectSteps(
  timeline: TimelineEvent[],
  sessionData: SessionData & {
    allVariables: import('../types/processing').DetectedVariable[]
    allConditionals: import('../types/processing').DetectedConditional[]
  }
): ProcessedStep[] {
  if (timeline.length === 0) {
    return []
  }

  const steps: ProcessedStep[] = []
  let currentStepEvents: TimelineEvent[] = []
  let stepStartTime = timeline[0].timestamp
  let stepNumber = 1

  for (let i = 0; i < timeline.length; i++) {
    const event = timeline[i]
    const nextEvent = i < timeline.length - 1 ? timeline[i + 1] : null

    // Add current event to the step
    currentStepEvents.push(event)

    // Determine if we should start a new step
    let shouldStartNewStep = false

    // Check for voice pause (> 2 seconds)
    if (event.type === 'pause' && event.duration >= 2000) {
      shouldStartNewStep = true
    }

    // Check for window focus change
    if (event.type === 'window_change') {
      shouldStartNewStep = true
    }

    // Check for explicit annotations (drawings, element selections)
    // These indicate user is marking something important
    if (event.type === 'drawing' || event.type === 'element_selection') {
      // Only create boundary if this is a significant annotation
      // (not just a quick click or small drawing)
      if (event.type === 'drawing') {
        const drawing = event.drawing
        // Consider it significant if it's pinned or has substantial content
        if (drawing.isPinned) {
          shouldStartNewStep = true
        }
      } else if (event.type === 'element_selection') {
        // Element selections are always significant
        shouldStartNewStep = true
      }
    }

    // Check if this is the last event
    const isLastEvent = !nextEvent

    // Finalize current step if we should start a new one or if this is the last event
    if ((shouldStartNewStep || isLastEvent) && currentStepEvents.length > 0) {
      const stepEndTime = event.timestamp

      // Create the processed step
      const step = createProcessedStep(
        stepNumber,
        stepStartTime,
        stepEndTime,
        currentStepEvents,
        sessionData
      )

      steps.push(step)

      // Start new step (if not the last event)
      if (!isLastEvent && shouldStartNewStep) {
        stepNumber++
        currentStepEvents = []
        stepStartTime = nextEvent!.timestamp
      }
    }
  }

  return steps
}

/**
 * Create a processed step from timeline events
 *
 * @param stepNumber - Step number (1-indexed)
 * @param startTime - Step start timestamp
 * @param endTime - Step end timestamp
 * @param events - Timeline events in this step
 * @param sessionData - Complete session data
 * @returns Processed step
 */
function createProcessedStep(
  stepNumber: number,
  startTime: number,
  endTime: number,
  events: TimelineEvent[],
  sessionData: SessionData & {
    allVariables: import('../types/processing').DetectedVariable[]
    allConditionals: import('../types/processing').DetectedConditional[]
  }
): ProcessedStep {
  // Find representative screenshot (prefer one closest to the middle of the step)
  const screenshotEvents = events.filter((e): e is ScreenshotEvent => e.type === 'screenshot')

  let representativeScreenshot: CaptureFrame | undefined
  if (screenshotEvents.length > 0) {
    // Use the middle screenshot as representative
    const middleIndex = Math.floor(screenshotEvents.length / 2)
    representativeScreenshot = screenshotEvents[middleIndex].frame
  }

  // Extract transcript for this step
  const voiceEvents = events.filter((e): e is VoiceEvent => e.type === 'voice')
  const transcript = voiceEvents
    .map(e => e.segment.text)
    .join(' ')
    .trim()

  // Collect annotations for this step
  const clicks = events.filter((e): e is ClickEvent => e.type === 'click').map(e => e.click)

  const drawings = events.filter((e): e is DrawingEvent => e.type === 'drawing').map(e => e.drawing)

  const selectedElements = events
    .filter((e): e is ElementSelectionEvent => e.type === 'element_selection')
    .map(e => e.element)

  // Get keyboard inputs (filter by timestamp range)
  // Note: KeyboardState doesn't have timestamp, so we can't filter by time
  // We'll include all keyboard inputs from the session data for now
  const keyboardInputs = sessionData.keyboardInputs

  // Get window info from the first screenshot in this step
  let windowTitle: string | undefined
  let applicationName: string | undefined
  if (representativeScreenshot?.activeWindow) {
    windowTitle = representativeScreenshot.activeWindow.title
    applicationName = representativeScreenshot.activeWindow.processName
  }

  return {
    stepNumber,
    timeRange: {
      start: startTime,
      end: endTime,
    },
    screenshotPath: representativeScreenshot?.imagePath || '',
    transcript,
    annotations: {
      clicks,
      drawings,
      selectedElements,
      keyboardInputs,
    },
    windowTitle,
    applicationName,
    events,
    variables: sessionData.allVariables.filter(
      v => v.timestamp >= startTime && v.timestamp <= endTime
    ),
    conditionals: sessionData.allConditionals.filter(
      c => c.timestamp >= startTime && c.timestamp <= endTime
    ),
  }
}

/**
 * Generate LLM context from processed session
 *
 * Creates a structured JSON context optimized for LLM skill generation.
 * Selects representative screenshots, extracts relevant transcript segments,
 * and includes annotations for each step.
 *
 * Requirements: FR-5.4, FR-5.11 through FR-5.22
 *
 * @param processedSession - Processed session with steps
 * @param maxKeyFrames - Maximum number of key frames to include (default: 10)
 * @returns LLM context ready for skill generation
 */
export async function generateLLMContext(
  processedSession: ProcessedSession,
  maxKeyFrames: number = 10
): Promise<import('../types/processing').LLMContext> {
  // Generate task description from multiple sources
  let taskDescription = ''

  if (processedSession.fullTranscript && processedSession.fullTranscript.trim()) {
    // Priority 1: Use transcript if available (USE FULL TRANSCRIPT, not just first sentence)
    taskDescription = processedSession.fullTranscript.trim()
  } else {
    // Priority 2: Build from application context and actions
    const apps = [...new Set(processedSession.steps.map(s => s.applicationName).filter(Boolean))]
    const totalClicks = processedSession.steps.reduce(
      (acc, s) => acc + s.annotations.clicks.length,
      0
    )
    const totalInputs = processedSession.steps.reduce(
      (acc, s) => acc + s.annotations.keyboardInputs.length,
      0
    )
    const totalSteps = processedSession.steps.length

    if (apps.length > 0) {
      taskDescription = `Workflow demonstration in ${apps.join(', ')}`
      taskDescription += ` (${totalSteps} steps, ${totalClicks} clicks, ${totalInputs} text inputs)`
    } else {
      taskDescription = `Recorded workflow (${totalSteps} steps, ${totalClicks} interactions)`
    }
  }

  // Select key frames (limit to maxKeyFrames)
  const selectedSteps = selectKeySteps(processedSession.steps, maxKeyFrames)

  // Build LLM steps with screenshots and context
  const llmSteps: import('../types/processing').LLMStep[] = []

  for (const step of selectedSteps) {
    // Read screenshot and convert to base64 (if available)
    let screenshotBase64: string | undefined
    if (step.screenshotPath) {
      try {
        screenshotBase64 = await readImageAsBase64(step.screenshotPath)
      } catch (error) {
        console.warn(`Failed to read screenshot for step ${step.stepNumber}:`, error)
      }
    }

    // Build notes from annotations
    const notes: string[] = []

    // Add drawing annotations as notes
    for (const drawing of step.annotations.drawings) {
      if (drawing.isPinned) {
        const drawingType = drawing.type
        const x = Math.round(drawing.startPoint.x)
        const y = Math.round(drawing.startPoint.y)
        notes.push(`Drawing annotation: ${drawingType} at (${x}, ${y})`)
      }
    }

    // Add element selections as notes
    for (const element of step.annotations.selectedElements) {
      notes.push(`Selected element: ${element.tagName} - "${element.textContent.substring(0, 50)}"`)
    }

    // Add keyboard inputs as notes
    if (step.annotations.keyboardInputs.length > 0) {
      const keyCount = step.annotations.keyboardInputs.length
      notes.push(`Keyboard input: ${keyCount} key${keyCount > 1 ? 's' : ''} pressed`)
    }

    // Add window context
    if (step.windowTitle) {
      notes.push(`Window: ${step.windowTitle}`)
    }
    if (step.applicationName) {
      notes.push(`Application: ${step.applicationName}`)
    }

    // Count actions
    const actions = {
      clicks: step.annotations.clicks.length,
      textInputs: step.annotations.keyboardInputs.length,
      annotations: step.annotations.drawings.length + step.annotations.selectedElements.length,
    }

    // Build rich description from multiple sources
    let stepDescription = step.transcript

    if (!stepDescription || stepDescription.trim() === '') {
      // No transcript - build description from actions
      const clickDescriptions: string[] = []

      for (const click of step.annotations.clicks.slice(0, 3)) {
        const app = step.windowTitle || step.applicationName || 'application'
        const x = Math.round(click.position?.x || 0)
        const y = Math.round(click.position?.y || 0)
        clickDescriptions.push(`Click at position (${x}, ${y}) in ${app}`)
      }

      if (clickDescriptions.length > 0) {
        stepDescription = clickDescriptions.join('; ')
      } else if (step.annotations.keyboardInputs.length > 0) {
        stepDescription = `Type ${step.annotations.keyboardInputs.length} character(s)`
      } else if (step.windowTitle) {
        stepDescription = `Interact with ${step.windowTitle}`
      } else {
        stepDescription = `Step ${step.stepNumber}: Automated action`
      }

      // Add OCR context if available
      const ocrResult = processedSession.ocrResults?.find(o =>
        step.screenshotPath?.includes(o.frameId)
      )
      if (ocrResult?.text) {
        const shortText = ocrResult.text.substring(0, 100).replace(/\n/g, ' ')
        if (shortText.length > 10) {
          stepDescription += ` (Screen shows: "${shortText}...")`
        }
      }
    }

    // Create LLM step
    const llmStep: import('../types/processing').LLMStep = {
      number: step.stepNumber,
      description: stepDescription,
      screenshot: screenshotBase64,
      notes,
      timeRange: step.timeRange,
      actions,
      applicationName: step.applicationName,
      windowTitle: step.windowTitle,
    }

    llmSteps.push(llmStep)
  }

  // Debug: Log what we're generating
  console.log('📋 generateLLMContext:')
  console.log('   Task:', taskDescription)
  console.log('   Steps:', llmSteps.length)
  llmSteps.forEach(s => {
    console.log(`   Step ${s.number}: ${s.description?.substring(0, 80)}...`)
  })

  // Calculate summary statistics
  const summary = {
    totalClicks: processedSession.allAnnotations.clicks.length,
    totalTextInputs: processedSession.allAnnotations.keyboardInputs.length,
    totalPageLoads: countWindowChanges(processedSession.timeline),
    totalAnnotations:
      processedSession.allAnnotations.drawings.length +
      processedSession.allAnnotations.selectedElements.length,
    durationSeconds: Math.round(processedSession.duration / 1000),
  }

  // Build LLM context
  const llmContext: import('../types/processing').LLMContext = {
    taskDescription,
    steps: llmSteps,
    fullNarration: processedSession.fullTranscript,
    variables: processedSession.allVariables,
    conditionals: processedSession.allConditionals,
    summary,
    references: {
      screenshotArchive: processedSession.sessionId,
      sessionDataPath: processedSession.sessionId,
    },
  }

  return llmContext
}

/**
 * Select key steps from all steps (limit to maxKeyFrames)
 *
 * Prioritizes steps with:
 * - Annotations (drawings, element selections)
 * - Transcript content
 * - Window changes
 *
 * Requirements: FR-5.11 through FR-5.15
 *
 * @param steps - All processed steps
 * @param maxKeyFrames - Maximum number of steps to select
 * @returns Selected key steps
 */
function selectKeySteps(steps: ProcessedStep[], maxKeyFrames: number): ProcessedStep[] {
  // If we have fewer steps than the limit, return all
  if (steps.length <= maxKeyFrames) {
    return steps
  }

  // Score each step by importance
  const scoredSteps = steps.map(step => {
    let score = 0

    // Transcript content (higher score for longer transcripts)
    score += Math.min(step.transcript.length / 100, 5)

    // Annotations (high importance)
    score += step.annotations.drawings.filter(d => d.isPinned).length * 3
    score += step.annotations.selectedElements.length * 3
    score += step.annotations.clicks.length * 1

    // Window/app context
    if (step.windowTitle) score += 2
    if (step.applicationName) score += 1

    // Variables and conditionals (very high importance)
    score += step.variables.length * 5
    score += step.conditionals.length * 5

    return { step, score }
  })

  // Sort by score (descending)
  scoredSteps.sort((a, b) => b.score - a.score)

  // Take top N steps
  const selectedSteps = scoredSteps.slice(0, maxKeyFrames).map(s => s.step)

  // Re-sort by step number to maintain chronological order
  selectedSteps.sort((a, b) => a.stepNumber - b.stepNumber)

  return selectedSteps
}

/**
 * Count window change events in timeline
 *
 * @param timeline - Timeline events
 * @returns Number of window changes
 */
function countWindowChanges(timeline: TimelineEvent[]): number {
  return timeline.filter(e => e.type === 'window_change').length
}

/**
 * Read image file and convert to base64
 *
 * Uses Tauri FS API to read binary file and convert to base64.
 *
 * Requirements: FR-5.4
 *
 * @param imagePath - Path to image file
 * @returns Base64-encoded image data with data URL prefix
 */
async function readImageAsBase64(imagePath: string): Promise<string> {
  try {
    // UPDATED: Use Tauri FS to read file directly
    const bytes = await readFile(imagePath)

    // Convert Uint8Array to base64
    let binary = ''
    const len = bytes.byteLength
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    const base64 = btoa(binary)

    // Assume PNG for now (or detect from extension)
    // Most screenshots are WebP or PNG in this app
    const isWebp = imagePath.toLowerCase().endsWith('.webp')
    const mimeType = isWebp ? 'image/webp' : 'image/png'

    return `data:${mimeType};base64,${base64}`
  } catch (error) {
    console.warn(`Failed to read image as base64 using FS: ${imagePath}`, error)

    // Fallback? Probably not if blocked.
    // Return placeholder
    return `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKwftQAAAABJRU5ErkJggg==`
  }
}

/**
 * Process complete session
 *
 * This is the main entry point for processing a recording session.
 *
 * Requirements: FR-5.1, FR-5.2, FR-5.3, FR-5.4, FR-5.5
 *
 * @param sessionId - Unique session identifier
 * @param captureSession - Capture session with frames
 * @param transcription - Transcription result (optional)
 * @param annotations - Annotations from overlay store
 * @param onProgress - Progress callback
 * @returns Processed session
 */
export async function processSession(
  sessionId: string,
  captureSession: CaptureSession,
  transcription: TranscriptionResult | null,
  annotations: {
    clicks: ClickIndicator[]
    drawings: DrawingElement[]
    selectedElements: SelectedElement[]
    keyboardInputs: KeyboardState[]
  },
  onProgress?: (progress: ProcessingProgress) => void
): Promise<ProcessedSession> {
  try {
    // Stage 1: Load session data
    onProgress?.(createProgress('loading', 10, 'Loading session data...'))
    const sessionData = await loadSession(sessionId, captureSession, transcription, annotations)

    // Stage 2: Build timeline
    onProgress?.(createProgress('timeline', 30, 'Building timeline...'))
    const timeline = buildTimeline(sessionData)

    // Add pause events to timeline
    if (sessionData.transcription) {
      const pauses = detectVoicePauses(
        sessionData.transcription.segments,
        sessionData.captureSession.startTime
      )
      timeline.push(...pauses)
      timeline.sort((a, b) => a.timestamp - b.timestamp)
    }

    // Add window change events to timeline
    const windowChanges = detectWindowChanges(sessionData.captureSession.frames)
    timeline.push(...windowChanges)
    timeline.sort((a, b) => a.timestamp - b.timestamp)

    // Stage 3: Speech classification (Moved before step detection)
    onProgress?.(createProgress('classification', 40, 'Classifying speech...'))

    // Classify speech segments
    let allVariables: import('../types/processing').DetectedVariable[] = []
    let allConditionals: import('../types/processing').DetectedConditional[] = []

    if (sessionData.transcription?.segments) {
      const stats = getClassificationStats(sessionData.transcription.segments)
      allVariables = stats.allVariables
      allConditionals = stats.allConditionals
    }

    // Stage 4: Step detection
    onProgress?.(createProgress('step_detection', 60, 'Detecting steps...'))
    const steps = detectSteps(timeline, { ...sessionData, allVariables, allConditionals })

    // Stage 4b: OCR extraction
    onProgress?.(createProgress('classification', 75, 'Extracting text from screenshots...'))

    // Extract OCR from key frames only (max 10 to avoid performance issues)
    const keyFramePaths = steps
      .map(step => step.screenshotPath)
      .filter((path): path is string => !!path)
      .slice(0, 10)

    let ocrResults: import('../types/processing').OCRResult[] = []
    if (keyFramePaths.length > 0) {
      try {
        ocrResults = await extractTextFromImages(keyFramePaths)
      } catch (error) {
        console.warn('OCR extraction failed:', error)
        // Continue without OCR data
      }
    }

    // Build processed session first (needed for context generation)
    const processedSession: ProcessedSession = {
      sessionId,
      duration: sessionData.captureSession.endTime
        ? sessionData.captureSession.endTime - sessionData.captureSession.startTime
        : 0,
      steps,
      fullTranscript: sessionData.transcription?.text || '',
      allAnnotations: {
        clicks: sessionData.clicks,
        drawings: sessionData.drawings,
        selectedElements: sessionData.selectedElements,
        keyboardInputs: sessionData.keyboardInputs,
      },
      timeline,
      allVariables,
      allConditionals,
      ocrResults,
      startTime: sessionData.captureSession.startTime,
      endTime: sessionData.captureSession.endTime || Date.now(),
    }

    // Generate LLM context (will be used by skill generation in future tasks)
    await generateLLMContext(processedSession)

    // Complete
    onProgress?.(createProgress('complete', 100, 'Processing complete'))

    return processedSession
  } catch (error) {
    // Report error
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    onProgress?.(createProgress('error', 0, 'Processing failed', undefined))
    throw new Error(`Session processing failed: ${errorMessage}`)
  }
}
