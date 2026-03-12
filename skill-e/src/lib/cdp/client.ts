/**
 * Chrome DevTools Protocol (CDP) Client
 *
 * Provides direct communication with Chrome/Chromium browsers via CDP
 * for reliable automation that bypasses anti-bot detection.
 *
 * Based on Claude extension architecture analysis.
 */

import { invoke } from '@tauri-apps/api/core'

/**
 * CDP Session configuration
 */
export interface CDPSessionConfig {
  /** WebSocket URL for CDP connection (e.g., ws://localhost:9222/devtools/browser/...) */
  wsUrl?: string

  /** Chrome debugging port (default: 9222) */
  port?: number

  /** Host (default: localhost) */
  host?: string

  /** Target ID to attach to */
  targetId?: string

  /** Timeout for commands in ms (default: 30000) */
  timeout?: number
}

/**
 * CDP Connection state
 */
export type CDPConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error'

/**
 * CDP Mouse button types
 */
export type CDPMouseButton = 'none' | 'left' | 'middle' | 'right' | 'back' | 'forward'

/**
 * CDP Key event types
 */
export type CDPKeyEventType = 'keyDown' | 'keyUp' | 'char'

/**
 * CDP Mouse event types
 */
export type CDPMouseEventType = 'mousePressed' | 'mouseReleased' | 'mouseMoved' | 'mouseWheel'

/**
 * CDP Point (coordinates)
 */
export interface CDPPoint {
  x: number
  y: number
}

/**
 * CDP Screenshot options
 */
export interface CDPScreenshotOptions {
  /** Screenshot format (jpeg, png, webp) */
  format?: 'jpeg' | 'png' | 'webp'

  /** Compression quality (0-100) for jpeg/webp */
  quality?: number

  /** Target width for scaling */
  targetWidth?: number

  /** Target height for scaling */
  targetHeight?: number

  /** Clip region */
  clip?: {
    x: number
    y: number
    width: number
    height: number
    scale?: number
  }

  /** Capture from surface (true) or viewport (false) */
  fromSurface?: boolean

  /** Capture specific node ID */
  nodeId?: number
}

/**
 * Accessibility node from CDP
 */
export interface CDPAccessibilityNode {
  /** Node ID */
  nodeId: number

  /** Backend node ID */
  backendNodeId?: number

  /** Parent node ID */
  parentId?: number

  /** Node role (button, link, input, etc.) */
  role?: string

  /** Accessible name */
  name?: string

  /** Accessible description */
  description?: string

  /** Node value */
  value?: string

  /** Whether node is ignored */
  ignored?: boolean

  /** Whether node is disabled */
  disabled?: boolean

  /** Bounding box coordinates */
  bounds?: {
    x: number
    y: number
    width: number
    height: number
  }

  /** Child nodes */
  children?: CDPAccessibilityNode[]

  /** Properties */
  properties?: Array<{ name: string; value: any }>
}

/**
 * CDP Target info
 */
export interface CDPTarget {
  /** Target ID */
  targetId: string

  /** Target type (page, background_page, service_worker, etc.) */
  type: string

  /** Page title */
  title: string

  /** URL */
  url: string

  /** Favicon URL */
  faviconUrl?: string

  /** Whether target is attached */
  attached: boolean

  /** Opener target ID */
  openerId?: string

  /** Browser context ID */
  browserContextId?: string
}

/**
 * Chrome DevTools Protocol Client
 *
 * Provides high-level methods for browser automation via CDP
 */
export class CDPClient {
  private state: CDPConnectionState = 'disconnected'
  private config: CDPSessionConfig
  private eventListeners: Map<string, Set<Function>> = new Map()
  private commandId = 0
  private pendingCommands: Map<number, { resolve: Function; reject: Function; timer: number }> =
    new Map()
  private ws: WebSocket | null = null
  private sessionId: string | null = null
  private targetId: string | null = null

  constructor(config: CDPSessionConfig = {}) {
    this.config = {
      port: 9222,
      host: 'localhost',
      timeout: 30000,
      ...config,
    }
  }

  /**
   * Get current connection state
   */
  getState(): CDPConnectionState {
    return this.state
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.state === 'connected'
  }

  /**
   * Connect to Chrome via CDP
   */
  async connect(): Promise<void> {
    if (this.state === 'connected') {
      return
    }

    this.state = 'connecting'

    try {
      // If wsUrl provided, use it directly
      if (this.config.wsUrl) {
        await this.connectToWebSocket(this.config.wsUrl)
        return
      }

      // Otherwise, discover targets via HTTP
      const targets = await this.discoverTargets()

      if (targets.length === 0) {
        throw new Error('No Chrome targets found. Is Chrome running with --remote-debugging-port?')
      }

      // Find a page target or use the specified target
      let target = targets.find(t => t.type === 'page' && !t.attached)

      if (this.config.targetId) {
        target = targets.find(t => t.targetId === this.config.targetId)
      }

      if (!target) {
        target = targets[0]
      }

      // Get WebSocket URL for target
      const wsUrl = await this.getWebSocketUrl(target.targetId)
      await this.connectToWebSocket(wsUrl)

      this.targetId = target.targetId
    } catch (error) {
      this.state = 'error'
      throw error
    }
  }

  /**
   * Discover available Chrome targets
   */
  private async discoverTargets(): Promise<CDPTarget[]> {
    const response = await fetch(`http://${this.config.host}:${this.config.port}/json/list`)

    if (!response.ok) {
      throw new Error(`Failed to discover targets: ${response.statusText}`)
    }

    return await response.json()
  }

  /**
   * Get WebSocket URL for a target
   */
  private async getWebSocketUrl(targetId: string): Promise<string> {
    const response = await fetch(
      `http://${this.config.host}:${this.config.port}/json/activate/${targetId}`,
      { method: 'PUT' }
    )

    if (!response.ok) {
      throw new Error(`Failed to activate target: ${response.statusText}`)
    }

    // Get updated list with WebSocket URL
    const targets = await this.discoverTargets()
    const target = targets.find(t => t.targetId === targetId)

    if (!target || !(target as any).webSocketDebuggerUrl) {
      throw new Error('Target does not have WebSocket debugger URL')
    }

    return (target as any).webSocketDebuggerUrl
  }

  /**
   * Connect to WebSocket
   */
  private async connectToWebSocket(wsUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(wsUrl)

      const timeout = setTimeout(() => {
        reject(new Error('WebSocket connection timeout'))
      }, this.config.timeout)

      this.ws.onopen = () => {
        clearTimeout(timeout)
        this.state = 'connected'
        resolve()
      }

      this.ws.onerror = error => {
        clearTimeout(timeout)
        this.state = 'error'
        reject(new Error(`WebSocket error: ${error}`))
      }

      this.ws.onclose = () => {
        this.state = 'disconnected'
        this.cleanup()
      }

      this.ws.onmessage = event => {
        this.handleMessage(event.data)
      }
    })
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data)

      // Handle command responses
      if (message.id !== undefined) {
        const pending = this.pendingCommands.get(message.id)
        if (pending) {
          clearTimeout(pending.timer)
          this.pendingCommands.delete(message.id)

          if (message.error) {
            pending.reject(new Error(message.error.message))
          } else {
            pending.resolve(message.result)
          }
        }
        return
      }

      // Handle events
      if (message.method) {
        this.emit(message.method, message.params)
      }
    } catch (error) {
      console.error('Failed to handle CDP message:', error)
    }
  }

  /**
   * Send CDP command
   */
  async sendCommand<T = any>(method: string, params?: Record<string, any>): Promise<T> {
    if (!this.isConnected()) {
      throw new Error('CDP client not connected')
    }

    const id = ++this.commandId
    const command = { id, method, params }

    return new Promise((resolve, reject) => {
      // Set timeout
      const timer = window.setTimeout(() => {
        this.pendingCommands.delete(id)
        reject(new Error(`Command ${method} timed out`))
      }, this.config.timeout)

      this.pendingCommands.set(id, { resolve, reject, timer })

      // Send command
      this.ws?.send(JSON.stringify(command))
    })
  }

  /**
   * Emit event to listeners
   */
  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data)
        } catch (error) {
          console.error('Event listener error:', error)
        }
      })
    }
  }

  /**
   * Add event listener
   */
  on(event: string, listener: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set())
    }
    this.eventListeners.get(event)!.add(listener)
  }

  /**
   * Remove event listener
   */
  off(event: string, listener: Function): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.delete(listener)
    }
  }

  /**
   * Disconnect from CDP
   */
  async disconnect(): Promise<void> {
    if (this.ws) {
      this.ws.close()
    }
    this.cleanup()
    this.state = 'disconnected'
  }

  /**
   * Cleanup resources
   */
  private cleanup(): void {
    // Clear pending commands
    this.pendingCommands.forEach(pending => {
      clearTimeout(pending.timer)
      pending.reject(new Error('Connection closed'))
    })
    this.pendingCommands.clear()

    // Clear event listeners
    this.eventListeners.clear()

    this.ws = null
    this.sessionId = null
    this.targetId = null
  }

  // ==================== CDP Commands ====================

  /**
   * Navigate to URL
   */
  async navigate(
    url: string,
    waitUntil: 'load' | 'domcontentloaded' | 'networkidle' = 'load'
  ): Promise<void> {
    await this.sendCommand('Page.navigate', { url })

    // Wait for navigation to complete
    if (waitUntil === 'load') {
      await this.sendCommand('Page.loadEventFired')
    }
  }

  /**
   * Dispatch mouse event
   */
  async dispatchMouseEvent(
    type: CDPMouseEventType,
    x: number,
    y: number,
    options: {
      button?: CDPMouseButton
      clickCount?: number
      deltaX?: number
      deltaY?: number
    } = {}
  ): Promise<void> {
    await this.sendCommand('Input.dispatchMouseEvent', {
      type,
      x,
      y,
      button: options.button || 'left',
      clickCount: options.clickCount || 1,
      deltaX: options.deltaX || 0,
      deltaY: options.deltaY || 0,
    })
  }

  /**
   * Click at coordinates using CDP
   */
  async click(
    x: number,
    y: number,
    options?: { button?: CDPMouseButton; clickCount?: number }
  ): Promise<void> {
    await this.dispatchMouseEvent('mousePressed', x, y, options)
    await this.dispatchMouseEvent('mouseReleased', x, y, options)
  }

  /**
   * Dispatch key event
   */
  async dispatchKeyEvent(
    type: CDPKeyEventType,
    options: {
      key?: string
      code?: string
      text?: string
      unmodifiedText?: string
      nativeVirtualKeyCode?: number
      windowsVirtualKeyCode?: number
      autoRepeat?: boolean
      isKeypad?: boolean
      isSystemKey?: boolean
      location?: number
      commands?: string[]
    } = {}
  ): Promise<void> {
    await this.sendCommand('Input.dispatchKeyEvent', {
      type,
      key: options.key,
      code: options.code,
      text: options.text,
      unmodifiedText: options.unmodifiedText,
      nativeVirtualKeyCode: options.nativeVirtualKeyCode,
      windowsVirtualKeyCode: options.windowsVirtualKeyCode,
      autoRepeat: options.autoRepeat,
      isKeypad: options.isKeypad,
      isSystemKey: options.isSystemKey,
      location: options.location,
      commands: options.commands,
    })
  }

  /**
   * Type text using CDP
   */
  async type(text: string): Promise<void> {
    for (const char of text) {
      await this.dispatchKeyEvent('char', { text: char })
    }
  }

  /**
   * Press key combination
   */
  async pressKey(key: string, modifiers: string[] = []): Promise<void> {
    const modifierCodes: Record<string, number> = {
      Alt: 1,
      Control: 2,
      Meta: 4,
      Shift: 8,
    }

    const modifiersValue = modifiers.reduce((acc, mod) => acc | (modifierCodes[mod] || 0), 0)

    // Send keyDown with modifiers
    await this.sendCommand('Input.dispatchKeyEvent', {
      type: 'keyDown',
      key,
      code: `Key${key.toUpperCase()}`,
      modifiers: modifiersValue,
    })

    // Send keyUp with modifiers
    await this.sendCommand('Input.dispatchKeyEvent', {
      type: 'keyUp',
      key,
      code: `Key${key.toUpperCase()}`,
      modifiers: modifiersValue,
    })
  }

  /**
   * Capture screenshot
   */
  async captureScreenshot(options: CDPScreenshotOptions = {}): Promise<string> {
    const result = await this.sendCommand<{ data: string }>('Page.captureScreenshot', {
      format: options.format || 'png',
      quality: options.quality,
      clip: options.clip,
      fromSurface: options.fromSurface !== false,
    })

    return result.data
  }

  /**
   * Get full accessibility tree
   */
  async getAccessibilityTree(): Promise<CDPAccessibilityNode | null> {
    const result = await this.sendCommand<{ nodes: CDPAccessibilityNode[] }>(
      'Accessibility.getFullAXTree'
    )

    if (!result.nodes || result.nodes.length === 0) {
      return null
    }

    // Build tree from flat list
    const nodeMap = new Map<number, CDPAccessibilityNode>()
    let rootNode: CDPAccessibilityNode | null = null

    result.nodes.forEach(node => {
      nodeMap.set(node.nodeId, node)
      if (!node.parentId) {
        rootNode = node
      }
    })

    // Link children
    result.nodes.forEach(node => {
      if (node.parentId) {
        const parent = nodeMap.get(node.parentId)
        if (parent) {
          if (!parent.children) {
            parent.children = []
          }
          parent.children.push(node)
        }
      }
    })

    return rootNode
  }

  /**
   * Query accessibility node by selector
   */
  async queryAccessibilityNode(selector: string): Promise<CDPAccessibilityNode | null> {
    const tree = await this.getAccessibilityTree()
    if (!tree) return null

    // Search recursively
    const search = (node: CDPAccessibilityNode): CDPAccessibilityNode | null => {
      // Match by name
      if (node.name?.toLowerCase().includes(selector.toLowerCase())) {
        return node
      }

      // Match by role
      if (node.role?.toLowerCase() === selector.toLowerCase()) {
        return node
      }

      // Search children
      if (node.children) {
        for (const child of node.children) {
          const found = search(child)
          if (found) return found
        }
      }

      return null
    }

    return search(tree)
  }

  /**
   * Get node bounds
   */
  async getNodeBounds(backendNodeId: number): Promise<CDPPoint | null> {
    try {
      const result = await this.sendCommand<{ model: { contentQuad: number[] } }>(
        'DOM.getBoxModel',
        { backendNodeId }
      )

      if (result.model && result.model.contentQuad) {
        const quad = result.model.contentQuad
        // Calculate center from quad (8 values: x1,y1, x2,y2, x3,y3, x4,y4)
        const centerX = (quad[0] + quad[2] + quad[4] + quad[6]) / 4
        const centerY = (quad[1] + quad[3] + quad[5] + quad[7]) / 4
        return { x: centerX, y: centerY }
      }

      return null
    } catch {
      return null
    }
  }

  /**
   * Wait for specific time
   */
  async wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Wait for element to appear in accessibility tree
   */
  async waitForElement(
    selector: string,
    options: { timeout?: number; interval?: number } = {}
  ): Promise<CDPAccessibilityNode | null> {
    const timeout = options.timeout || 10000
    const interval = options.interval || 500
    const startTime = Date.now()

    while (Date.now() - startTime < timeout) {
      const element = await this.queryAccessibilityNode(selector)
      if (element) {
        return element
      }
      await this.wait(interval)
    }

    return null
  }
}

/**
 * Create CDP client with configuration
 */
export function createCDPClient(config?: CDPSessionConfig): CDPClient {
  return new CDPClient(config)
}

/**
 * Check if Chrome is available with remote debugging
 */
export async function isChromeAvailable(port: number = 9222): Promise<boolean> {
  try {
    const response = await fetch(`http://localhost:${port}/json/version`, {
      method: 'GET',
      signal: AbortSignal.timeout(2000),
    })
    return response.ok
  } catch {
    return false
  }
}

/**
 * Launch Chrome with remote debugging (if available via Tauri)
 */
export async function launchChromeWithDebugging(port: number = 9222): Promise<boolean> {
  try {
    return await invoke('launch_chrome_debugging', { port })
  } catch {
    return false
  }
}
