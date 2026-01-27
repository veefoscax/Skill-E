/**
 * Browser Context Capture Module
 * 
 * Captures console logs, network requests, and DOM events during recording.
 * Injected into browser window during recording sessions.
 * 
 * Requirements: FR-2.6, FR-2.7, FR-2.8, FR-2.9, FR-2.10
 * Requirements: FR-5.16, FR-5.17, FR-5.18
 * 
 * @example
 * ```typescript
 * // Start capturing browser context
 * const capture = startBrowserCapture();
 * 
 * // Get captured data
 * const data = capture.getData();
 * console.log(data.consoleLogs); // Console entries
 * console.log(data.networkRequests); // Network calls
 * ```
 */

import type { OCRResult, OCRRegion } from '../types/processing';

/**
 * Console log entry
 */
export interface ConsoleEntry {
  /** Log level */
  level: 'log' | 'info' | 'warn' | 'error' | 'debug';
  /** Log message */
  message: string;
  /** Timestamp */
  timestamp: number;
  /** Stack trace for errors */
  stack?: string;
}

/**
 * Network request entry
 */
export interface NetworkRequest {
  /** Request ID */
  id: string;
  /** Request URL */
  url: string;
  /** HTTP method */
  method: string;
  /** Request headers */
  requestHeaders?: Record<string, string>;
  /** Request body (if applicable and < 10KB) */
  requestBody?: string;
  /** Response status */
  status?: number;
  /** Response status text */
  statusText?: string;
  /** Response headers */
  responseHeaders?: Record<string, string>;
  /** Response body (if applicable and < 10KB) */
  responseBody?: string;
  /** Request start timestamp */
  startTime: number;
  /** Request end timestamp */
  endTime?: number;
  /** Error message if failed */
  error?: string;
}

/**
 * DOM event entry
 */
export interface DOMEvent {
  /** Event type */
  type: string;
  /** Target element selector */
  targetSelector: string;
  /** Target element tag name */
  targetTag: string;
  /** Timestamp */
  timestamp: number;
  /** Additional event data */
  data?: Record<string, unknown>;
}

/**
 * Complete browser capture data
 */
export interface BrowserCaptureData {
  /** Console log entries */
  consoleLogs: ConsoleEntry[];
  /** Network requests */
  networkRequests: NetworkRequest[];
  /** DOM events */
  domEvents: DOMEvent[];
  /** Capture start time */
  startTime: number;
  /** Capture end time */
  endTime?: number;
}

/**
 * Capture configuration options
 */
export interface CaptureOptions {
  /** Capture console logs */
  captureConsole?: boolean;
  /** Capture network requests */
  captureNetwork?: boolean;
  /** Capture DOM events */
  captureDOM?: boolean;
  /** Max body size to capture (bytes, default: 10KB) */
  maxBodySize?: number;
  /** Log levels to capture (default: all) */
  consoleLevels?: ConsoleEntry['level'][];
  /** URL patterns to ignore */
  ignoreUrls?: RegExp[];
}

/** Default capture options */
const DEFAULT_OPTIONS: Required<CaptureOptions> = {
  captureConsole: true,
  captureNetwork: true,
  captureDOM: true,
  maxBodySize: 10 * 1024, // 10KB
  consoleLevels: ['log', 'info', 'warn', 'error', 'debug'],
  ignoreUrls: [
    /\.js$/i,
    /\.css$/i,
    /\.png$/i,
    /\.jpg$/i,
    /\.jpeg$/i,
    /\.svg$/i,
    /\.woff2?$/i,
    /\.ttf$/i,
    /\.eot$/i,
  ],
};

/**
 * Browser capture instance
 */
export interface BrowserCapture {
  /** Get captured data */
  getData: () => BrowserCaptureData;
  /** Stop capturing and cleanup */
  stop: () => BrowserCaptureData;
  /** Pause capturing */
  pause: () => void;
  /** Resume capturing */
  resume: () => void;
  /** Clear captured data */
  clear: () => void;
}

/**
 * Start capturing browser context
 * 
 * @param options - Capture configuration
 * @returns Browser capture instance
 */
export function startBrowserCapture(options: CaptureOptions = {}): BrowserCapture {
  const config = { ...DEFAULT_OPTIONS, ...options };
  
  const data: BrowserCaptureData = {
    consoleLogs: [],
    networkRequests: [],
    domEvents: [],
    startTime: Date.now(),
  };
  
  let isPaused = false;
  let isStopped = false;
  
  // Store original methods
  const originalConsole = {
    log: console.log,
    info: console.info,
    warn: console.warn,
    error: console.error,
    debug: console.debug,
  };
  
  // Capture console logs
  if (config.captureConsole) {
    const captureConsole = (level: ConsoleEntry['level']) => {
      return (...args: unknown[]) => {
        // Call original
        originalConsole[level].apply(console, args);
        
        if (isPaused || isStopped) return;
        if (!config.consoleLevels.includes(level)) return;
        
        const message = args.map(arg => {
          if (typeof arg === 'object') {
            try {
              return JSON.stringify(arg);
            } catch {
              return String(arg);
            }
          }
          return String(arg);
        }).join(' ');
        
        const entry: ConsoleEntry = {
          level,
          message,
          timestamp: Date.now(),
        };
        
        // Capture stack for errors
        if (level === 'error') {
          const stack = new Error().stack;
          if (stack) {
            entry.stack = stack.split('\n').slice(2).join('\n');
          }
        }
        
        data.consoleLogs.push(entry);
        
        // Keep only last 1000 entries to prevent memory issues
        if (data.consoleLogs.length > 1000) {
          data.consoleLogs = data.consoleLogs.slice(-1000);
        }
      };
    };
    
    console.log = captureConsole('log');
    console.info = captureConsole('info');
    console.warn = captureConsole('warn');
    console.error = captureConsole('error');
    console.debug = captureConsole('debug');
  }
  
  // Capture network requests
  if (config.captureNetwork && typeof window !== 'undefined') {
    const originalFetch = window.fetch;
    const originalXHROpen = XMLHttpRequest.prototype.open;
    const originalXHRSend = XMLHttpRequest.prototype.send;
    
    // Capture fetch
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const startTime = Date.now();
      const url = typeof input === 'string' ? input : input.toString();
      
      // Check if URL should be ignored
      const shouldIgnore = config.ignoreUrls.some(pattern => pattern.test(url));
      
      let requestId: string | undefined;
      
      if (!shouldIgnore && !isPaused && !isStopped) {
        requestId = `req-${startTime}-${Math.random().toString(36).substr(2, 9)}`;
        
        const request: NetworkRequest = {
          id: requestId,
          url: url.substring(0, 500), // Limit URL length
          method: init?.method || 'GET',
          requestHeaders: init?.headers ? Object.fromEntries(
            new Headers(init.headers).entries()
          ) : undefined,
          startTime,
        };
        
        // Capture request body if small enough
        if (init?.body && typeof init.body === 'string') {
          if (init.body.length <= config.maxBodySize) {
            request.requestBody = init.body;
          }
        }
        
        data.networkRequests.push(request);
      }
      
      try {
        const response = await originalFetch(input, init);
        
        if (requestId && !shouldIgnore) {
          const request = data.networkRequests.find(r => r.id === requestId);
          if (request) {
            request.endTime = Date.now();
            request.status = response.status;
            request.statusText = response.statusText;
            request.responseHeaders = Object.fromEntries(
              response.headers.entries()
            );
            
            // Clone response to read body without consuming original
            if (response.body) {
              const clone = response.clone();
              const contentLength = response.headers.get('content-length');
              const size = contentLength ? parseInt(contentLength, 10) : 0;
              
              if (size <= config.maxBodySize) {
                clone.text().then(text => {
                  if (request && text.length <= config.maxBodySize) {
                    request.responseBody = text;
                  }
                }).catch(() => {
                  // Ignore body read errors
                });
              }
            }
          }
        }
        
        return response;
      } catch (error) {
        if (requestId) {
          const request = data.networkRequests.find(r => r.id === requestId);
          if (request) {
            request.endTime = Date.now();
            request.error = error instanceof Error ? error.message : 'Network error';
          }
        }
        throw error;
      }
    };
    
    // Capture XMLHttpRequest
    XMLHttpRequest.prototype.open = function(
      method: string,
      url: string | URL,
      async?: boolean,
      username?: string | null,
      password?: string | null
    ) {
      (this as unknown as Record<string, unknown>)._captureMethod = method;
      (this as unknown as Record<string, unknown>)._captureUrl = url.toString();
      return originalXHROpen.apply(this, [method, url, async ?? true, username, password]);
    };
    
    XMLHttpRequest.prototype.send = function(body?: Document | BodyInit | null) {
      const xhr = this;
      const method = (xhr as unknown as Record<string, unknown>)._captureMethod as string || 'GET';
      const url = (xhr as unknown as Record<string, unknown>)._captureUrl as string || '';
      const startTime = Date.now();
      
      const shouldIgnore = config.ignoreUrls.some(pattern => pattern.test(url));
      
      let requestId: string | undefined;
      
      if (!shouldIgnore && !isPaused && !isStopped) {
        requestId = `xhr-${startTime}-${Math.random().toString(36).substr(2, 9)}`;
        
        const request: NetworkRequest = {
          id: requestId,
          url: url.substring(0, 500),
          method,
          startTime,
        };
        
        // Capture request body
        if (body && typeof body === 'string' && body.length <= config.maxBodySize) {
          request.requestBody = body;
        }
        
        data.networkRequests.push(request);
        
        // Add load listener
        xhr.addEventListener('load', function() {
          const req = data.networkRequests.find(r => r.id === requestId);
          if (req) {
            req.endTime = Date.now();
            req.status = xhr.status;
            req.statusText = xhr.statusText;
            
            // Get response headers
            const headerMap: Record<string, string> = {};
            const headerString = xhr.getAllResponseHeaders();
            if (headerString) {
              headerString.split('\r\n').forEach(line => {
                const parts = line.split(': ');
                if (parts.length === 2) {
                  headerMap[parts[0]] = parts[1];
                }
              });
            }
            req.responseHeaders = headerMap;
          }
        });
        
        // Add error listener
        xhr.addEventListener('error', function() {
          const req = data.networkRequests.find(r => r.id === requestId);
          if (req) {
            req.endTime = Date.now();
            req.error = 'XHR Error';
          }
        });
      }
      
      return originalXHRSend.apply(this, [body]);
    };
  }
  
  // Capture DOM events
  if (config.captureDOM && typeof document !== 'undefined') {
    const captureEvent = (event: Event) => {
      if (isPaused || isStopped) return;
      
      const target = event.target as HTMLElement;
      if (!target) return;
      
      // Generate simple selector
      let selector = target.tagName.toLowerCase();
      if (target.id) {
        selector += `#${target.id}`;
      } else if (target.className) {
        selector += `.${target.className.split(' ')[0]}`;
      }
      
      const domEvent: DOMEvent = {
        type: event.type,
        targetSelector: selector,
        targetTag: target.tagName.toLowerCase(),
        timestamp: Date.now(),
      };
      
      // Add specific data for certain events
      if (event instanceof MouseEvent) {
        domEvent.data = {
          x: event.clientX,
          y: event.clientY,
        };
      } else if (event instanceof KeyboardEvent) {
        domEvent.data = {
          key: event.key,
          code: event.code,
        };
      } else if (event instanceof InputEvent && target instanceof HTMLInputElement) {
        domEvent.data = {
          value: target.value.substring(0, 100), // Limit value length
          type: target.type,
        };
      }
      
      data.domEvents.push(domEvent);
      
      // Keep only last 500 DOM events
      if (data.domEvents.length > 500) {
        data.domEvents = data.domEvents.slice(-500);
      }
    };
    
    // Capture important events
    document.addEventListener('click', captureEvent, true);
    document.addEventListener('submit', captureEvent, true);
    document.addEventListener('input', captureEvent, true);
    document.addEventListener('change', captureEvent, true);
  }
  
  return {
    getData: () => ({ ...data }),
    
    stop: () => {
      isStopped = true;
      data.endTime = Date.now();
      
      // Restore original methods
      if (config.captureConsole) {
        console.log = originalConsole.log;
        console.info = originalConsole.info;
        console.warn = originalConsole.warn;
        console.error = originalConsole.error;
        console.debug = originalConsole.debug;
      }
      
      return data;
    },
    
    pause: () => {
      isPaused = true;
    },
    
    resume: () => {
      isPaused = false;
    },
    
    clear: () => {
      data.consoleLogs = [];
      data.networkRequests = [];
      data.domEvents = [];
    },
  };
}

/**
 * Generate console summary for context packager
 * 
 * Requirements: FR-5.16
 * 
 * @param logs - Console log entries
 * @returns Summary string
 */
export function generateConsoleSummary(logs: ConsoleEntry[]): string {
  if (logs.length === 0) {
    return 'No console output';
  }
  
  const counts = {
    error: 0,
    warn: 0,
    info: 0,
    log: 0,
    debug: 0,
  };
  
  for (const log of logs) {
    counts[log.level]++;
  }
  
  const parts: string[] = [];
  if (counts.error > 0) parts.push(`${counts.error} error${counts.error > 1 ? 's' : ''}`);
  if (counts.warn > 0) parts.push(`${counts.warn} warning${counts.warn > 1 ? 's' : ''}`);
  if (counts.info > 0) parts.push(`${counts.info} info`);
  if (counts.log > 0) parts.push(`${counts.log} log${counts.log > 1 ? 's' : ''}`);
  
  return parts.join(', ') || `${logs.length} entries`;
}

/**
 * Generate network summary for context packager
 * 
 * Requirements: FR-5.17
 * 
 * @param requests - Network requests
 * @returns Summary string
 */
export function generateNetworkSummary(requests: NetworkRequest[]): string {
  if (requests.length === 0) {
    return 'No network activity';
  }
  
  // Count unique endpoints
  const endpoints = new Map<string, number>();
  let errors = 0;
  
  for (const req of requests) {
    const key = `${req.method} ${req.url.split('?')[0].substring(0, 50)}`;
    endpoints.set(key, (endpoints.get(key) || 0) + 1);
    
    if (req.error || (req.status && req.status >= 400)) {
      errors++;
    }
  }
  
  const parts: string[] = [`${requests.length} requests`];
  
  if (errors > 0) {
    parts.push(`${errors} failed`);
  }
  
  // Add top 3 endpoints
  const topEndpoints = Array.from(endpoints.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  
  if (topEndpoints.length > 0) {
    parts.push(`Top: ${topEndpoints.map(([ep, count]) => `${ep}${count > 1 ? ` (${count}x)` : ''}`).join(', ')}`);
  }
  
  return parts.join(' | ');
}

/**
 * Generate action summary for context packager
 * 
 * Requirements: FR-5.18
 * 
 * @param domEvents - DOM events
 * @returns Summary string
 */
export function generateActionSummary(domEvents: DOMEvent[]): string {
  if (domEvents.length === 0) {
    return 'No recorded actions';
  }
  
  const counts = {
    click: 0,
    input: 0,
    change: 0,
    submit: 0,
    other: 0,
  };
  
  for (const event of domEvents) {
    if (event.type === 'click') counts.click++;
    else if (event.type === 'input') counts.input++;
    else if (event.type === 'change') counts.change++;
    else if (event.type === 'submit') counts.submit++;
    else counts.other++;
  }
  
  const parts: string[] = [];
  if (counts.click > 0) parts.push(`${counts.click} click${counts.click > 1 ? 's' : ''}`);
  if (counts.input > 0) parts.push(`${counts.input} input${counts.input > 1 ? 's' : ''}`);
  if (counts.change > 0) parts.push(`${counts.change} change${counts.change > 1 ? 's' : ''}`);
  if (counts.submit > 0) parts.push(`${counts.submit} submit${counts.submit > 1 ? 's' : ''}`);
  
  return parts.join(', ') || `${domEvents.length} actions`;
}

/**
 * Get error patterns from console logs
 * Useful for troubleshooting section in skills
 * 
 * @param logs - Console log entries
 * @returns Unique error messages
 */
export function getErrorPatterns(logs: ConsoleEntry[]): string[] {
  const errors = logs
    .filter(log => log.level === 'error')
    .map(log => log.message)
    .filter((msg, i, arr) => arr.indexOf(msg) === i); // Unique
  
  return errors.slice(0, 10); // Limit to 10 unique errors
}

/**
 * Get API endpoints from network requests
 * Useful for programmatic skill generation
 * 
 * @param requests - Network requests
 * @returns API endpoint patterns
 */
export function getAPIEndpoints(requests: NetworkRequest[]): Array<{
  method: string;
  path: string;
  pattern: string;
}> {
  const apis = requests
    .filter(req => req.url.includes('/api/') || req.url.includes('/v1/') || req.url.includes('/v2/'))
    .map(req => {
      const url = new URL(req.url);
      return {
        method: req.method,
        path: url.pathname,
        pattern: `${req.method} ${url.pathname}`,
      };
    })
    .filter((api, i, arr) => arr.findIndex(a => a.pattern === api.pattern) === i) // Unique
    .slice(0, 20); // Limit to 20 endpoints
  
  return apis;
}
