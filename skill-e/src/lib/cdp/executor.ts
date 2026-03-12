/**
 * CDP Executor
 *
 * Browser automation executor using Chrome DevTools Protocol
 * Provides more reliable automation than DOM-based methods
 *
 * Features:
 * - CDP-based click/type/navigate
 * - Accessibility tree for element finding
 * - Screenshot scaling for token efficiency
 * - Anti-bot bypass via accessibility APIs
 */

import type { SkillStep } from '../skill-parser'
import type { CDPClient, CDPAccessibilityNode } from './client'
import { createCDPClient, isChromeAvailable } from './client'
import { createAccessibilityTreeGenerator } from './accessibility-tree'
import { scaleForLLM, CoordinateMapper, type ScaledScreenshot } from './screenshot-scale'

/**
 * CDP execution result
 */
export interface CDPExecutionResult {
  /** Whether execution succeeded */
  success: boolean

  /** Error message if failed */
  error?: string

  /** Screenshot after execution */
  screenshot?: string

  /** Scaled screenshot info */
  scaledScreenshot?: ScaledScreenshot

  /** Accessibility tree text */
  accessibilityText?: string

  /** Element that was interacted with */
  element?: {
    role: string
    name?: string
    center: { x: number; y: number }
  }

  /** Execution log */
  executionLog: string[]
}

/**
 * CDP executor options
 */
export interface CDPExecutorOptions {
  /** Chrome debugging port */
  port?: number

  /** Capture screenshots */
  captureScreenshots?: boolean

  /** Scale screenshots for LLM */
  scaleScreenshots?: boolean

  /** Include accessibility tree */
  includeAccessibilityTree?: boolean

  /** Step timeout in ms */
  stepTimeout?: number

  /** Retry count */
  maxRetries?: number
}

/**
 * CDP Executor
 *
 * Executes skill steps using Chrome DevTools Protocol
 */
export class CDPExecutor {
  private client: CDPClient | null = null
  private options: Required<CDPExecutorOptions>
  private connected = false
  private currentScreenshot: string | null = null
  private coordinateMapper: CoordinateMapper | null = null

  constructor(options: CDPExecutorOptions = {}) {
    this.options = {
      port: 9222,
      captureScreenshots: true,
      scaleScreenshots: true,
      includeAccessibilityTree: true,
      stepTimeout: 30000,
      maxRetries: 2,
      ...options,
    }
  }

  /**
   * Check if Chrome with debugging is available
   */
  async isAvailable(): Promise<boolean> {
    return isChromeAvailable(this.options.port)
  }

  /**
   * Connect to Chrome
   */
  async connect(): Promise<void> {
    if (this.connected) return

    this.client = createCDPClient({ port: this.options.port })
    await this.client.connect()
    this.connected = true
  }

  /**
   * Disconnect from Chrome
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.disconnect()
    }
    this.connected = false
    this.client = null
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connected && !!this.client
  }

  /**
   * Close the executor and disconnect from Chrome
   */
  async close(): Promise<void> {
    await this.disconnect()
  }

  /**
   * Execute a skill step
   */
  async executeStep(step: SkillStep): Promise<CDPExecutionResult> {
    const executionLog: string[] = []

    const log = (message: string) => {
      executionLog.push(message)
      console.log(`[CDP] ${message}`)
    }

    // Ensure connected
    if (!this.isConnected()) {
      log('Connecting to Chrome...')
      try {
        await this.connect()
        log('Connected to Chrome')
      } catch (error) {
        return {
          success: false,
          error: `Failed to connect to Chrome: ${error instanceof Error ? error.message : String(error)}`,
          executionLog,
        }
      }
    }

    const client = this.client!

    try {
      // Capture before screenshot
      if (this.options.captureScreenshots) {
        log('Capturing before screenshot...')
        this.currentScreenshot = await client.captureScreenshot()
      }

      // Get accessibility tree
      let accessibilityText: string | undefined
      if (this.options.includeAccessibilityTree) {
        log('Getting accessibility tree...')
        const generator = createAccessibilityTreeGenerator(client)
        const treeResult = await generator.generateText()
        accessibilityText = treeResult.text
        log(`Found ${treeResult.interactiveCount} interactive elements`)
      }

      // Execute based on action type
      let result: CDPExecutionResult

      switch (step.actionType) {
        case 'click':
          result = await this.executeClick(step, client, log)
          break
        case 'type':
          result = await this.executeType(step, client, log)
          break
        case 'navigate':
          result = await this.executeNavigate(step, client, log)
          break
        case 'wait':
          result = await this.executeWait(step, client, log)
          break
        case 'verify':
          result = await this.executeVerify(step, client, log)
          break
        default:
          result = await this.executeGeneric(step, client, log)
      }

      // Capture after screenshot
      if (this.options.captureScreenshots) {
        log('Capturing after screenshot...')
        this.currentScreenshot = await client.captureScreenshot()

        // Scale screenshot if enabled
        if (this.options.scaleScreenshots && this.currentScreenshot) {
          try {
            const scaled = await scaleForLLM(this.currentScreenshot)
            result.scaledScreenshot = scaled
            result.screenshot = scaled.data
            log(
              `Screenshot scaled: ${scaled.originalWidth}x${scaled.originalHeight} → ${scaled.scaledWidth}x${scaled.scaledHeight}`
            )
          } catch (error) {
            log(`Failed to scale screenshot: ${error}`)
            result.screenshot = this.currentScreenshot
          }
        } else {
          result.screenshot = this.currentScreenshot
        }
      }

      // Add accessibility text to result
      if (accessibilityText) {
        result.accessibilityText = accessibilityText
      }

      result.executionLog = executionLog
      return result
    } catch (error) {
      log(`Execution error: ${error instanceof Error ? error.message : String(error)}`)
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        executionLog,
      }
    }
  }

  /**
   * Execute click action
   */
  private async executeClick(
    step: SkillStep,
    client: CDPClient,
    log: (msg: string) => void
  ): Promise<CDPExecutionResult> {
    log(`Executing click: ${step.instruction}`)

    let x: number | undefined
    let y: number | undefined
    let element: CDPAccessibilityNode | null = null

    // Try to find element by target
    if (step.target?.selector) {
      log(`Searching for element: ${step.target.selector}`)
      element = await client.queryAccessibilityNode(step.target.selector)

      if (element?.bounds) {
        x = element.bounds.x + element.bounds.width / 2
        y = element.bounds.y + element.bounds.height / 2
        log(`Found element at (${x}, ${y})`)
      }
    }

    // Try by text/description
    if (x === undefined && step.target?.text) {
      log(`Searching by text: ${step.target.text}`)
      element = await client.queryAccessibilityNode(step.target.text)

      if (element?.bounds) {
        x = element.bounds.x + element.bounds.width / 2
        y = element.bounds.y + element.bounds.height / 2
        log(`Found element at (${x}, ${y})`)
      }
    }

    // Use coordinates if provided
    if (x === undefined && step.target?.coordinates) {
      x = step.target.coordinates.x
      y = step.target.coordinates.y
      log(`Using provided coordinates: (${x}, ${y})`)
    }

    if (x === undefined || y === undefined) {
      return {
        success: false,
        error: 'Could not determine click coordinates',
        executionLog: [],
      }
    }

    // Perform click
    await client.click(x, y)
    log(`Clicked at (${x}, ${y})`)

    // Wait a moment for action to complete
    await client.wait(500)

    return {
      success: true,
      element: element
        ? {
            role: element.role || 'unknown',
            name: element.name,
            center: { x, y },
          }
        : undefined,
      executionLog: [],
    }
  }

  /**
   * Execute type action
   */
  private async executeType(
    step: SkillStep,
    client: CDPClient,
    log: (msg: string) => void
  ): Promise<CDPExecutionResult> {
    log(`Executing type: ${step.instruction}`)

    // First, try to focus the input field
    if (step.target?.selector) {
      log(`Focusing input: ${step.target.selector}`)
      const element = await client.queryAccessibilityNode(step.target.selector)

      if (element?.bounds) {
        const x = element.bounds.x + element.bounds.width / 2
        const y = element.bounds.y + element.bounds.height / 2
        await client.click(x, y)
        log(`Focused input at (${x}, ${y})`)
      }
    }

    // Type the text
    const text = step.target?.text || ''
    if (text) {
      await client.type(text)
      log(`Typed: "${text}"`)
    }

    return {
      success: true,
      executionLog: [],
    }
  }

  /**
   * Execute navigate action
   */
  private async executeNavigate(
    step: SkillStep,
    client: CDPClient,
    log: (msg: string) => void
  ): Promise<CDPExecutionResult> {
    // Extract URL from instruction or target
    let url = step.target?.text || ''

    // Try to extract URL from instruction text
    if (!url) {
      const urlMatch = step.instruction.match(/https?:\/\/[^\s]+/)
      if (urlMatch) {
        url = urlMatch[0]
      }
    }

    if (!url) {
      return {
        success: false,
        error: 'No URL found for navigation',
        executionLog: [],
      }
    }

    log(`Navigating to: ${url}`)
    await client.navigate(url)
    log('Navigation complete')

    return {
      success: true,
      executionLog: [],
    }
  }

  /**
   * Execute wait action
   */
  private async executeWait(
    step: SkillStep,
    client: CDPClient,
    log: (msg: string) => void
  ): Promise<CDPExecutionResult> {
    // Parse wait duration
    let duration = 1000 // Default 1 second

    const msMatch = step.instruction.match(/(\d+)\s*(?:ms|milliseconds?)/i)
    const secMatch = step.instruction.match(/(\d+)\s*(?:s|seconds?)/i)

    if (msMatch) {
      duration = parseInt(msMatch[1], 10)
    } else if (secMatch) {
      duration = parseInt(secMatch[1], 10) * 1000
    }

    log(`Waiting ${duration}ms...`)
    await client.wait(duration)
    log('Wait complete')

    return {
      success: true,
      executionLog: [],
    }
  }

  /**
   * Execute verify action
   */
  private async executeVerify(
    step: SkillStep,
    client: CDPClient,
    log: (msg: string) => void
  ): Promise<CDPExecutionResult> {
    log(`Executing verify: ${step.instruction}`)

    // Get accessibility tree
    const generator = createAccessibilityTreeGenerator(client)
    const treeResult = await generator.generateText()

    // Check if expected element exists
    const searchText = step.target?.text || step.target?.selector || ''
    const found = treeResult.text.toLowerCase().includes(searchText.toLowerCase())

    if (found) {
      log(`Verified: "${searchText}" found`)
    } else {
      log(`Verification failed: "${searchText}" not found`)
    }

    return {
      success: found,
      error: found ? undefined : `Expected element "${searchText}" not found`,
      accessibilityText: treeResult.text,
      executionLog: [],
    }
  }

  /**
   * Execute generic action
   */
  private async executeGeneric(
    step: SkillStep,
    client: CDPClient,
    log: (msg: string) => void
  ): Promise<CDPExecutionResult> {
    log(`Executing generic action: ${step.actionType}`)

    // For unknown actions, try to use target coordinates
    if (step.target?.coordinates) {
      const { x, y } = step.target.coordinates
      await client.click(x, y)
      log(`Clicked at (${x}, ${y})`)
    }

    return {
      success: true,
      executionLog: [],
    }
  }

  /**
   * Get current screenshot
   */
  getCurrentScreenshot(): string | null {
    return this.currentScreenshot
  }

  /**
   * Get coordinate mapper for converting between scaled and original coordinates
   */
  getCoordinateMapper(): CoordinateMapper | null {
    return this.coordinateMapper
  }

  /**
   * Update options
   */
  updateOptions(options: Partial<CDPExecutorOptions>): void {
    this.options = { ...this.options, ...options }
  }
}

/**
 * Create CDP executor
 */
export function createCDPExecutor(options?: CDPExecutorOptions): CDPExecutor {
  return new CDPExecutor(options)
}

// Export types
