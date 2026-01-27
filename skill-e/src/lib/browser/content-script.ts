/**
 * Browser Content Script
 * 
 * Injected into web pages during recording to capture:
 * - Console logs
 * - Network requests (fetch/XHR)
 * - DOM events (clicks, inputs, etc.)
 * 
 * Requirements: FR-2.6, FR-2.7, FR-2.8, FR-2.10
 * 
 * This script runs in the context of the web page and communicates
 * with the Skill-E application via window.postMessage or Tauri API.
 * 
 * @example
 * ```typescript
 * // Injected automatically during recording
 * // Or manually inject:
 * injectContentScript();
 * ```
 */

import {
  BrowserCaptureData,
  ConsoleEntry,
  NetworkRequest,
  DOMEvent,
} from '../browser-capture';

/**
 * Message types for communication with parent
 */
interface CaptureMessage {
  type: 'console' | 'network' | 'dom' | 'init' | 'ping';
  payload: unknown;
  timestamp: number;
  sessionId: string;
}

/**
 * Content script configuration
 */
interface ContentScriptConfig {
  /** Session identifier */
  sessionId: string;
  /** Whether to capture console */
  captureConsole: boolean;
  /** Whether to capture network */
  captureNetwork: boolean;
  /** Whether to capture DOM events */
  captureDOM: boolean;
  /** Max body size for network requests */
  maxBodySize: number;
}

/** Default configuration */
const DEFAULT_CONFIG: ContentScriptConfig = {
  sessionId: 'default',
  captureConsole: true,
  captureNetwork: true,
  captureDOM: true,
  maxBodySize: 10 * 1024, // 10KB
};

/** Current configuration */
let config: ContentScriptConfig = { ...DEFAULT_CONFIG };

/** Captured data buffer */
const buffer: BrowserCaptureData = {
  consoleLogs: [],
  networkRequests: [],
  domEvents: [],
  startTime: Date.now(),
};

/** Whether capturing is active */
let isActive = false;

/** Original methods storage */
const originals: {
  console?: typeof console;
  fetch?: typeof fetch;
  xhrOpen?: typeof XMLHttpRequest.prototype.open;
  xhrSend?: typeof XMLHttpRequest.prototype.send;
} = {};

/**
 * Send data to parent window
 */
function sendToParent(message: CaptureMessage): void {
  window.parent.postMessage(
    {
      source: 'skill-e-content-script',
      ...message,
    },
    '*'
  );
}

/**
 * Capture console logs
 */
function captureConsole(): void {
  if (!config.captureConsole) return;

  originals.console = { ...console };

  const levels: Array<'log' | 'info' | 'warn' | 'error' | 'debug'> = [
    'log',
    'info',
    'warn',
    'error',
    'debug',
  ];

  levels.forEach((level) => {
    const original = console[level];
    console[level] = (...args: unknown[]) => {
      // Call original
      original.apply(console, args);

      if (!isActive) return;

      const message = args
        .map((arg) => {
          if (typeof arg === 'object') {
            try {
              return JSON.stringify(arg);
            } catch {
              return String(arg);
            }
          }
          return String(arg);
        })
        .join(' ');

      const entry: ConsoleEntry = {
        level,
        message,
        timestamp: Date.now(),
      };

      if (level === 'error') {
        const stack = new Error().stack;
        if (stack) {
          entry.stack = stack.split('\n').slice(2).join('\n');
        }
      }

      buffer.consoleLogs.push(entry);

      // Send immediately for errors
      if (level === 'error' || level === 'warn') {
        sendToParent({
          type: 'console',
          payload: entry,
          timestamp: Date.now(),
          sessionId: config.sessionId,
        });
      }

      // Limit buffer size
      if (buffer.consoleLogs.length > 1000) {
        buffer.consoleLogs = buffer.consoleLogs.slice(-1000);
      }
    };
  });
}

/**
 * Restore console methods
 */
function restoreConsole(): void {
  if (!originals.console) return;

  Object.assign(console, originals.console);
  originals.console = undefined;
}

/**
 * Capture network requests
 */
function captureNetwork(): void {
  if (!config.captureNetwork) return;

  // Capture fetch
  originals.fetch = window.fetch;
  window.fetch = async (
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> => {
    const startTime = Date.now();
    const url = typeof input === 'string' ? input : input.toString();
    const method = init?.method || 'GET';

    const requestId = `fetch-${startTime}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // Store request info
    const request: NetworkRequest = {
      id: requestId,
      url: url.substring(0, 500),
      method,
      startTime,
    };

    // Capture request body if small enough
    if (init?.body && typeof init.body === 'string') {
      if (init.body.length <= config.maxBodySize) {
        request.requestBody = init.body;
      }
    }

    if (isActive) {
      buffer.networkRequests.push(request);
    }

    try {
      const response = await originals.fetch!(input, init);

      if (isActive) {
        request.endTime = Date.now();
        request.status = response.status;
        request.statusText = response.statusText;

        // Clone to read body
        if (response.body) {
          const clone = response.clone();
          const contentLength = response.headers.get('content-length');
          const size = contentLength ? parseInt(contentLength, 10) : 0;

          if (size <= config.maxBodySize) {
            clone
              .text()
              .then((text) => {
                if (text.length <= config.maxBodySize) {
                  request.responseBody = text;
                }
              })
              .catch(() => {
                // Ignore read errors
              });
          }
        }

        // Send to parent for important requests
        if (response.status >= 400 || method !== 'GET') {
          sendToParent({
            type: 'network',
            payload: request,
            timestamp: Date.now(),
            sessionId: config.sessionId,
          });
        }
      }

      return response;
    } catch (error) {
      if (isActive) {
        request.endTime = Date.now();
        request.error = error instanceof Error ? error.message : 'Network error';
      }
      throw error;
    }
  };

  // Capture XMLHttpRequest
  originals.xhrOpen = XMLHttpRequest.prototype.open;
  originals.xhrSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (
    method: string,
    url: string | URL,
    async?: boolean,
    username?: string | null,
    password?: string | null
  ): void {
    (this as unknown as Record<string, unknown>)._captureMethod = method;
    (this as unknown as Record<string, unknown>)._captureUrl = url.toString();
    return originals.xhrOpen!.apply(this, [
      method,
      url,
      async ?? true,
      username,
      password,
    ]);
  };

  XMLHttpRequest.prototype.send = function (body?: Document | BodyInit | null) {
    const xhr = this;
    const method =
      ((xhr as unknown as Record<string, unknown>)._captureMethod as string) ||
      'GET';
    const url =
      ((xhr as unknown as Record<string, unknown>)._captureUrl as string) || '';
    const startTime = Date.now();

    const requestId = `xhr-${startTime}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    const request: NetworkRequest = {
      id: requestId,
      url: url.substring(0, 500),
      method,
      startTime,
    };

    if (body && typeof body === 'string' && body.length <= config.maxBodySize) {
      request.requestBody = body;
    }

    if (isActive) {
      buffer.networkRequests.push(request);
    }

    xhr.addEventListener('load', function () {
      if (isActive) {
        request.endTime = Date.now();
        request.status = xhr.status;
        request.statusText = xhr.statusText;
      }
    });

    xhr.addEventListener('error', function () {
      if (isActive) {
        request.endTime = Date.now();
        request.error = 'XHR Error';
      }
    });

    return originals.xhrSend!.apply(this, [body]);
  };
}

/**
 * Restore network methods
 */
function restoreNetwork(): void {
  if (originals.fetch) {
    window.fetch = originals.fetch;
    originals.fetch = undefined;
  }
  if (originals.xhrOpen) {
    XMLHttpRequest.prototype.open = originals.xhrOpen;
    originals.xhrOpen = undefined;
  }
  if (originals.xhrSend) {
    XMLHttpRequest.prototype.send = originals.xhrSend;
    originals.xhrSend = undefined;
  }
}

/**
 * Capture DOM events
 */
function captureDOM(): void {
  if (!config.captureDOM) return;

  const captureEvent = (event: Event) => {
    if (!isActive) return;

    const target = event.target as HTMLElement;
    if (!target) return;

    // Generate selector
    let selector = target.tagName.toLowerCase();
    if (target.id) {
      selector += `#${target.id}`;
    } else if (target.className && typeof target.className === 'string') {
      selector += `.${target.className.split(' ')[0]}`;
    }

    const domEvent: DOMEvent = {
      type: event.type,
      targetSelector: selector,
      targetTag: target.tagName.toLowerCase(),
      timestamp: Date.now(),
    };

    // Add event-specific data
    if (event instanceof MouseEvent) {
      domEvent.data = {
        x: event.clientX,
        y: event.clientY,
        button: event.button,
      };
    } else if (event instanceof KeyboardEvent) {
      domEvent.data = {
        key: event.key,
        code: event.code,
        ctrl: event.ctrlKey,
        shift: event.shiftKey,
      };
    } else if (
      event instanceof InputEvent &&
      target instanceof HTMLInputElement
    ) {
      domEvent.data = {
        type: target.type,
        name: target.name,
        id: target.id,
      };
    }

    buffer.domEvents.push(domEvent);

    // Send important events immediately
    if (event.type === 'click' || event.type === 'submit') {
      sendToParent({
        type: 'dom',
        payload: domEvent,
        timestamp: Date.now(),
        sessionId: config.sessionId,
      });
    }

    // Limit buffer
    if (buffer.domEvents.length > 500) {
      buffer.domEvents = buffer.domEvents.slice(-500);
    }
  };

  // Add event listeners
  document.addEventListener('click', captureEvent, true);
  document.addEventListener('submit', captureEvent, true);
  document.addEventListener('input', captureEvent, true);
  document.addEventListener('change', captureEvent, true);
  document.addEventListener('keydown', captureEvent, true);
}

/**
 * Start capturing with configuration
 */
function startCapture(userConfig: Partial<ContentScriptConfig>): void {
  config = { ...DEFAULT_CONFIG, ...userConfig };
  isActive = true;
  buffer.startTime = Date.now();
  buffer.consoleLogs = [];
  buffer.networkRequests = [];
  buffer.domEvents = [];

  captureConsole();
  captureNetwork();
  captureDOM();

  console.log('[Skill-E] Content script started capturing', config.sessionId);

  // Notify parent
  sendToParent({
    type: 'init',
    payload: { status: 'started', url: window.location.href },
    timestamp: Date.now(),
    sessionId: config.sessionId,
  });
}

/**
 * Stop capturing
 */
function stopCapture(): BrowserCaptureData {
  isActive = false;
  buffer.endTime = Date.now();

  restoreConsole();
  restoreNetwork();

  // Note: DOM listeners are not removed as they use capture phase
  // and don't impact performance when isActive is false

  console.log('[Skill-E] Content script stopped capturing');

  return { ...buffer };
}

/**
 * Get current capture data
 */
function getCaptureData(): BrowserCaptureData {
  return { ...buffer };
}

/**
 * Listen for messages from parent
 */
window.addEventListener('message', (event) => {
  // Only accept messages from parent
  if (event.source !== window.parent) return;

  const { data } = event;
  if (!data || data.source !== 'skill-e-parent') return;

  switch (data.command) {
    case 'start':
      startCapture(data.config);
      break;
    case 'stop':
      stopCapture();
      break;
    case 'getData':
      event.source.postMessage(
        {
          source: 'skill-e-content-script',
          type: 'data',
          payload: getCaptureData(),
        },
        event.origin
      );
      break;
    case 'ping':
      sendToParent({
        type: 'ping',
        payload: { active: isActive },
        timestamp: Date.now(),
        sessionId: config.sessionId,
      });
      break;
  }
});

/**
 * Auto-inject if running in iframe or specific conditions
 */
function autoInject(): void {
  // Check if we're in an iframe (likely embedded in Skill-E)
  if (window.self !== window.top) {
    // Notify parent that content script is loaded
    sendToParent({
      type: 'init',
      payload: { status: 'loaded', url: window.location.href },
      timestamp: Date.now(),
      sessionId: config.sessionId,
    });
  }
}

// Run auto-inject
autoInject();

// Export for manual use
export { startCapture, stopCapture, getCaptureData };

// Make available globally for debugging
if (typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).__SKILL_E_CAPTURE__ = {
    start: startCapture,
    stop: stopCapture,
    getData: getCaptureData,
  };
}
