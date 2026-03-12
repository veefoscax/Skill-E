/**
 * Chrome DevTools Protocol (CDP) Integration Module
 *
 * Provides CDP-based browser automation for Skill-E
 * Based on Claude extension architecture analysis
 *
 * @example
 * ```typescript
 * import { createCDPExecutor, isChromeAvailable } from '@/lib/cdp';
 *
 * // Check if Chrome is available
 * if (await isChromeAvailable()) {
 *   const executor = createCDPExecutor();
 *   const result = await executor.executeStep(step);
 * }
 * ```
 */

// Client
export {
  CDPClient,
  createCDPClient,
  isChromeAvailable,
  launchChromeWithDebugging,
  type CDPSessionConfig,
  type CDPAccessibilityNode,
  type CDPTarget,
  type CDPPoint,
  type CDPScreenshotOptions,
  type CDPMouseButton,
  type CDPKeyEventType,
  type CDPMouseEventType,
} from './client'

// Accessibility Tree
export {
  AccessibilityTreeGenerator,
  createAccessibilityTreeGenerator,
  getAccessibilityText,
  type AccessibilityTreeNode,
  type AccessibilityTreeText,
} from './accessibility-tree'

// Screenshot Scaling
export {
  scaleScreenshot,
  scaleForLLM,
  scaleForStorage,
  scaleForThumbnail,
  CoordinateMapper,
  calculateScaleFactor,
  scaleCoordinates,
  unscaleCoordinates,
  estimateImageTokens,
  getTokenSavings,
  type ScreenshotScaleOptions,
  type ScaledScreenshot,
  type CoordinateMapping,
} from './screenshot-scale'

// Executor
export {
  CDPExecutor,
  createCDPExecutor,
  type CDPExecutionResult,
  type CDPExecutorOptions,
} from './executor'
