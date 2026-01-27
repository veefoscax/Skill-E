/**
 * Browser Capture Injector
 * 
 * Injects the content script into web pages for capture during recording.
 * Works with Tauri's webview or external browser windows.
 * 
 * Requirements: FR-2.6, FR-2.7, FR-2.10
 * 
 * @example
 * ```typescript
 * const injector = new BrowserCaptureInjector();
 * 
 * // Inject into webview
 * await injector.inject(webview);
 * 
 * // Start capturing
 * await injector.startCapture({ sessionId: 'abc123' });
 * 
 * // Later, get data
 * const data = await injector.getCaptureData();
 * 
 * // Stop and cleanup
 * await injector.stopCapture();
 * ```
 */

import type { WebviewWindow } from '@tauri-apps/api/webviewWindow';
import type { BrowserCaptureData } from '../browser-capture';

/**
 * Injector configuration
 */
interface InjectorConfig {
  /** Session identifier */
  sessionId: string;
  /** Capture console logs */
  captureConsole?: boolean;
  /** Capture network requests */
  captureNetwork?: boolean;
  /** Capture DOM events */
  captureDOM?: boolean;
  /** Max body size for network */
  maxBodySize?: number;
}

/**
 * Browser Capture Injector
 * 
 * Manages injection of content script and communication.
 */
export class BrowserCaptureInjector {
  private webview: WebviewWindow | null = null;
  private config: InjectorConfig | null = null;
  private isCapturing = false;

  /**
   * Inject content script into webview
   * 
   * @param webview - Tauri webview window
   */
  async inject(webview: WebviewWindow): Promise<void> {
    this.webview = webview;

    // Get the content script code
    const scriptContent = await this.loadContentScript();

    // Inject into webview
    await webview.eval(scriptContent);

    // Wait for script to initialize
    await new Promise((resolve) => setTimeout(resolve, 100));

    console.log('[BrowserCapture] Content script injected');
  }

  /**
   * Load content script code
   */
  private async loadContentScript(): Promise<string> {
    // In production, this would be bundled
    // For now, return the minified content script
    return `
      (function() {
        ${CONTENT_SCRIPT_MINIFIED}
      })();
    `;
  }

  /**
   * Start capturing browser data
   */
  async startCapture(config: InjectorConfig): Promise<void> {
    if (!this.webview) {
      throw new Error('Content script not injected. Call inject() first.');
    }

    this.config = config;
    this.isCapturing = true;

    // Send start command to content script
    await this.sendMessage({
      source: 'skill-e-parent',
      command: 'start',
      config: {
        sessionId: config.sessionId,
        captureConsole: config.captureConsole ?? true,
        captureNetwork: config.captureNetwork ?? true,
        captureDOM: config.captureDOM ?? true,
        maxBodySize: config.maxBodySize ?? 10 * 1024,
      },
    });

    console.log('[BrowserCapture] Capture started:', config.sessionId);
  }

  /**
   * Stop capturing and get data
   */
  async stopCapture(): Promise<BrowserCaptureData> {
    if (!this.webview) {
      throw new Error('Content script not injected');
    }

    this.isCapturing = false;

    // Send stop command
    await this.sendMessage({
      source: 'skill-e-parent',
      command: 'stop',
    });

    // Get final data
    const data = await this.getCaptureData();

    console.log('[BrowserCapture] Capture stopped');

    return data;
  }

  /**
   * Get current capture data
   */
  async getCaptureData(): Promise<BrowserCaptureData> {
    if (!this.webview) {
      throw new Error('Content script not injected');
    }

    // Send getData command and wait for response
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout getting capture data'));
      }, 5000);

      // Set up one-time listener
      const handleMessage = (event: MessageEvent) => {
        if (
          event.data?.source === 'skill-e-content-script' &&
          event.data?.type === 'data'
        ) {
          clearTimeout(timeout);
          window.removeEventListener('message', handleMessage);
          resolve(event.data.payload as BrowserCaptureData);
        }
      };

      window.addEventListener('message', handleMessage);

      // Send command
      this.sendMessage({
        source: 'skill-e-parent',
        command: 'getData',
      });
    });
  }

  /**
   * Send message to content script via webview
   */
  private async sendMessage(message: unknown): Promise<void> {
    if (!this.webview) return;

    const script = `
      window.postMessage(${JSON.stringify(message)}, '*');
    `;

    await this.webview.eval(script);
  }

  /**
   * Check if content script is alive
   */
  async ping(): Promise<boolean> {
    if (!this.webview) return false;

    try {
      await this.sendMessage({
        source: 'skill-e-parent',
        command: 'ping',
      });

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Cleanup and remove injection
   */
  async dispose(): Promise<void> {
    if (this.isCapturing) {
      await this.stopCapture();
    }

    this.webview = null;
    this.config = null;
  }
}

/**
 * Minified content script for injection
 * In production, this would be built and bundled
 */
const CONTENT_SCRIPT_MINIFIED = `
let config={sessionId:"default",captureConsole:!0,captureNetwork:!0,captureDOM:!0,maxBodySize:10240},
buffer={consoleLogs:[],networkRequests:[],domEvents:[],startTime:Date.now()},
isActive=!1,originals={};
function sendToParent(e){window.parent.postMessage({source:"skill-e-content-script",...e},"*")}
function captureConsole(){if(config.captureConsole){originals.console={...console};
["log","info","warn","error","debug"].forEach(e=>{const o=console[e];
console[e]=(...n)=>{o.apply(console,n);if(!isActive)return;const t=n.map(e=>"object"==typeof e?JSON.stringify(e):String(e)).join(" "),s={level:e,message:t,timestamp:Date.now()};
"error"===e&&(s.stack=new Error().stack?.split("\n").slice(2).join("\n"));
buffer.consoleLogs.push(s);("error"===e||"warn"===e)&&sendToParent({type:"console",payload:s,timestamp:Date.now(),sessionId:config.sessionId});
buffer.consoleLogs.length>1e3&&(buffer.consoleLogs=buffer.consoleLogs.slice(-1e3))}})})}}
function captureNetwork(){config.captureNetwork&&(originals.fetch=window.fetch,window.fetch=async(e,o)=>{const n=Date.now(),t="string"==typeof e?e:e.toString(),s=o?.method||"GET",r=\`fetch-\${n}-\${Math.random().toString(36).substr(2,9)}\`,a={id:r,url:t.substring(0,500),method:s,startTime:n};
return o?.body&&"string"==typeof o.body&&o.body.length<=config.maxBodySize&&(a.requestBody=o.body),
isActive&&buffer.networkRequests.push(a),originals.fetch(e,o).then(e=>{if(isActive){a.endTime=Date.now(),a.status=e.status,a.statusText=e.statusText;
const o=e.headers.get("content-length"),n=o?parseInt(o,10):0;
if(n<=config.maxBodySize&&e.body){const o=e.clone();
o.text().then(e=>{e.length<=config.maxBodySize&&(a.responseBody=e)}).catch(()=>{})}(e.status>=400||"GET"!==s)&&sendToParent({type:"network",payload:a,timestamp:Date.now(),sessionId:config.sessionId})}return e}).catch(e=>{throw isActive&&(a.endTime=Date.now(),a.error=e instanceof Error?e.message:"Network error"),e}))},
originals.xhrOpen=XMLHttpRequest.prototype.open,originals.xhrSend=XMLHttpRequest.prototype.send,
XMLHttpRequest.prototype.open=function(e,o,n,t,s){return(this._captureMethod=e,this._captureUrl=o.toString(),originals.xhrOpen.apply(this,[e,o,null==n||n,t,s]))},
XMLHttpRequest.prototype.send=function(e){const o=this,n=o._captureMethod||"GET",t=o._captureUrl||"",s=Date.now(),r={id:\`xhr-\${s}-\${Math.random().toString(36).substr(2,9)}\`,url:t.substring(0,500),method:n,startTime:s};
return e&&"string"==typeof e&&e.length<=config.maxBodySize&&(r.requestBody=e),isActive&&buffer.networkRequests.push(r),
o.addEventListener("load",()=>{isActive&&(r.endTime=Date.now(),r.status=o.status,r.statusText=o.statusText)}),
o.addEventListener("error",()=>{isActive&&(r.endTime=Date.now(),r.error="XHR Error")}),
originals.xhrSend.apply(this,[e])})}
function captureDOM(){if(config.captureDOM){const e=e=>{if(!isActive)return;const o=e.target,n=o.tagName.toLowerCase();
let t=n;o.id?t+=\`#\${o.id}\`:o.className&&"string"==typeof o.className&&(t+=\`.\${o.className.split(" ")[0]}\`);
const s={type:e.type,targetSelector:t,targetTag:n,timestamp:Date.now()};
e instanceof MouseEvent?s.data={x:e.clientX,y:e.clientY,button:e.button}:e instanceof KeyboardEvent?s.data={key:e.key,code:e.code,ctrl:e.ctrlKey,shift:e.shiftKey}:e instanceof InputEvent&&o instanceof HTMLInputElement&&(s.data={type:o.type,name:o.name,id:o.id}),
buffer.domEvents.push(s),("click"===e.type||"submit"===e.type)&&sendToParent({type:"dom",payload:s,timestamp:Date.now(),sessionId:config.sessionId}),
buffer.domEvents.length>500&&(buffer.domEvents=buffer.domEvents.slice(-500))};
document.addEventListener("click",e,!0),document.addEventListener("submit",e,!0),document.addEventListener("input",e,!0),document.addEventListener("change",e,!0),document.addEventListener("keydown",e,!0)}}
function startCapture(e){config={...config,...e},isActive=!0,buffer.startTime=Date.now(),buffer.consoleLogs=[],buffer.networkRequests=[],buffer.domEvents=[],captureConsole(),captureNetwork(),captureDOM(),console.log("[Skill-E] Content script started capturing",config.sessionId),sendToParent({type:"init",payload:{status:"started",url:window.location.href},timestamp:Date.now(),sessionId:config.sessionId})}
function stopCapture(){return isActive=!1,buffer.endTime=Date.now(),originals.console&&["log","info","warn","error","debug"].forEach(e=>{console[e]=originals.console[e]}),originals.fetch&&(window.fetch=originals.fetch),originals.xhrOpen&&(XMLHttpRequest.prototype.open=originals.xhrOpen),originals.xhrSend&&(XMLHttpRequest.prototype.send=originals.xhrSend),console.log("[Skill-E] Content script stopped capturing"),{...buffer}}
window.addEventListener("message",e=>{if(e.source===window.parent){const{data:o}=e;if(o&&"skill-e-parent"===o.source)switch(o.command){case"start":startCapture(o.config);break;case"stop":stopCapture();break;case"getData":e.source.postMessage({source:"skill-e-content-script",type:"data",payload:{...buffer}},e.origin);break;case"ping":sendToParent({type:"ping",payload:{active:isActive},timestamp:Date.now(),sessionId:config.sessionId})}}}),
window.self!==window.top&&sendToParent({type:"init",payload:{status:"loaded",url:window.location.href},timestamp:Date.now(),sessionId:config.sessionId}),
window.__SKILL_E_CAPTURE__={start:startCapture,stop:stopCapture,getData:()=>({...buffer})};
`;

/**
 * Convenience function for quick capture
 * 
 * @param webview - Tauri webview
 * @param sessionId - Session identifier
 * @param durationMs - Capture duration in milliseconds
 * @returns Captured data
 */
export async function captureForDuration(
  webview: WebviewWindow,
  sessionId: string,
  durationMs: number
): Promise<BrowserCaptureData> {
  const injector = new BrowserCaptureInjector();

  try {
    await injector.inject(webview);
    await injector.startCapture({ sessionId });

    // Wait for duration
    await new Promise((resolve) => setTimeout(resolve, durationMs));

    return await injector.stopCapture();
  } finally {
    await injector.dispose();
  }
}
