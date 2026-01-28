/**
 * Image Executor - Image-based Browser Automation
 * 
 * Provides image-based automation for skill validation when DOM automation fails.
 * Uses screenshot capture and template matching to find and interact with UI elements.
 * 
 * Requirements: FR-10.4
 */

import { invoke } from '@tauri-apps/api/core';
import type { SkillStep } from './skill-parser';
import type { AutomationResult, AutomationOptions } from './browser-automation';

/**
 * Template match result
 */
export interface TemplateMatch {
  /** X coordinate of the match center */
  x: number;
  
  /** Y coordinate of the match center */
  y: number;
  
  /** Width of the matched region */
  width: number;
  
  /** Height of the matched region */
  height: number;
  
  /** Confidence score (0-1) */
  confidence: number;
}

/**
 * Screenshot capture result
 */
interface CaptureResult {
  /** Path to the saved screenshot */
  path: string;
  
  /** Timestamp when captured */
  timestamp: number;
}

/**
 * Image Executor
 * 
 * Executes browser automation actions using image recognition and coordinates.
 * Useful as a fallback when DOM automation fails or for anti-bot sites.
 */
export class ImageExecutor {
  private screenshotCache: Map<string, string> = new Map();
  private defaultOptions: AutomationOptions = {
    timeout: 5000,
    waitForVisible: true,
    scrollIntoView: false,
    captureOnError: true,
  };

  /**
   * Execute a skill step using image-based automation
   * 
   * @param step - Skill step to execute
   * @param options - Automation options
   * @returns Automation result
   */
  async executeStep(step: SkillStep, options?: AutomationOptions): Promise<AutomationResult> {
    const opts = { ...this.defaultOptions, ...options };
    const startTime = Date.now();

    try {
      switch (step.actionType) {
        case 'click':
          if (step.target?.coordinates) {
            // Direct coordinate click
            return await this.clickAt(
              step.target.coordinates.x,
              step.target.coordinates.y,
              opts
            );
          } else if (step.target?.imageRef) {
            // Template matching click
            return await this.clickByImage(step.target.imageRef, opts);
          } else {
            return {
              success: false,
              error: 'No coordinates or image reference provided for click',
            };
          }
        
        case 'verify':
          if (step.target?.imageRef) {
            return await this.verifyImage(step.target.imageRef, opts);
          } else {
            return {
              success: false,
              error: 'No image reference provided for verification',
            };
          }
        
        case 'wait':
          return await this.wait(opts.timeout || 1000);
        
        default:
          return {
            success: false,
            error: `Image executor does not support action type: ${step.actionType}`,
          };
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        context: {
          duration,
        },
      };
    }
  }

  /**
   * Click at specific screen coordinates
   * 
   * @param x - X coordinate
   * @param y - Y coordinate
   * @param options - Automation options
   * @returns Automation result
   */
  async clickAt(x: number, y: number, options?: AutomationOptions): Promise<AutomationResult> {
    const opts = { ...this.defaultOptions, ...options };
    const startTime = Date.now();

    try {
      // Capture screenshot before click if needed
      let screenshotPath: string | undefined;
      if (opts.captureOnError) {
        const screenshot = await this.captureScreen();
        screenshotPath = screenshot.path;
      }

      // Simulate mouse click at coordinates
      // Note: This requires platform-specific implementation
      // For now, we'll use a JavaScript-based approach
      await this.simulateClick(x, y);

      return {
        success: true,
        context: {
          duration: Date.now() - startTime,
          screenshot: screenshotPath,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Click failed',
        context: {
          duration: Date.now() - startTime,
        },
      };
    }
  }

  /**
   * Click by finding a template image on screen
   * 
   * @param referenceImage - Path to reference image
   * @param options - Automation options
   * @returns Automation result
   */
  async clickByImage(referenceImage: string, options?: AutomationOptions): Promise<AutomationResult> {
    const opts = { ...this.defaultOptions, ...options };
    const startTime = Date.now();

    try {
      // Capture current screen
      const screenshot = await this.captureScreen();
      
      // Find template match
      const match = await this.findTemplate(screenshot.path, referenceImage, opts);
      
      if (!match) {
        return {
          success: false,
          error: 'Template not found on screen',
          context: {
            duration: Date.now() - startTime,
            screenshot: screenshot.path,
          },
        };
      }

      if (match.confidence < 0.7) {
        return {
          success: false,
          error: `Template match confidence too low: ${match.confidence.toFixed(2)}`,
          context: {
            duration: Date.now() - startTime,
            screenshot: screenshot.path,
          },
        };
      }

      // Click at match center
      await this.simulateClick(match.x, match.y);

      return {
        success: true,
        context: {
          duration: Date.now() - startTime,
          screenshot: screenshot.path,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Image click failed',
        context: {
          duration: Date.now() - startTime,
        },
      };
    }
  }

  /**
   * Verify that an image appears on screen
   * 
   * @param referenceImage - Path to reference image
   * @param options - Automation options
   * @returns Automation result
   */
  async verifyImage(referenceImage: string, options?: AutomationOptions): Promise<AutomationResult> {
    const opts = { ...this.defaultOptions, ...options };
    const startTime = Date.now();

    try {
      // Capture current screen
      const screenshot = await this.captureScreen();
      
      // Find template match
      const match = await this.findTemplate(screenshot.path, referenceImage, opts);
      
      if (!match) {
        return {
          success: false,
          error: 'Image not found on screen',
          context: {
            duration: Date.now() - startTime,
            screenshot: screenshot.path,
          },
        };
      }

      if (match.confidence < 0.7) {
        return {
          success: false,
          error: `Image match confidence too low: ${match.confidence.toFixed(2)}`,
          context: {
            duration: Date.now() - startTime,
            screenshot: screenshot.path,
          },
        };
      }

      return {
        success: true,
        context: {
          duration: Date.now() - startTime,
          screenshot: screenshot.path,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Image verification failed',
        context: {
          duration: Date.now() - startTime,
        },
      };
    }
  }

  /**
   * Wait for a specified duration
   * 
   * @param duration - Duration in milliseconds
   * @returns Automation result
   */
  async wait(duration: number): Promise<AutomationResult> {
    const startTime = Date.now();

    try {
      await new Promise(resolve => setTimeout(resolve, duration));

      return {
        success: true,
        context: {
          duration: Date.now() - startTime,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Wait failed',
        context: {
          duration: Date.now() - startTime,
        },
      };
    }
  }

  /**
   * Capture the current screen
   * 
   * @returns Screenshot result with path and timestamp
   */
  private async captureScreen(): Promise<CaptureResult> {
    try {
      // Generate unique filename
      const timestamp = Date.now();
      const filename = `screenshot_${timestamp}.webp`;
      
      // Use temp directory for screenshots
      const tempDir = await this.getTempDir();
      const outputPath = `${tempDir}/${filename}`;

      // Invoke Tauri command to capture screen
      const result = await invoke<CaptureResult>('capture_screen', {
        outputPath,
      });

      // Cache the screenshot path
      this.screenshotCache.set(timestamp.toString(), result.path);

      return result;
    } catch (error) {
      throw new Error(`Failed to capture screen: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find a template image within a screenshot
   * 
   * @param screenshotPath - Path to screenshot to search in
   * @param templatePath - Path to template image to find
   * @param options - Automation options
   * @returns Template match or null if not found
   */
  private async findTemplate(
    screenshotPath: string,
    templatePath: string,
    options: AutomationOptions
  ): Promise<TemplateMatch | null> {
    try {
      // Load images
      const screenshot = await this.loadImage(screenshotPath);
      const template = await this.loadImage(templatePath);

      // Perform template matching
      const match = await this.matchTemplate(screenshot, template);

      return match;
    } catch (error) {
      console.error('Template matching failed:', error);
      return null;
    }
  }

  /**
   * Load an image from a file path
   * 
   * @param path - Path to image file
   * @returns HTMLImageElement
   */
  private async loadImage(path: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load image: ${path}`));
      
      // Convert file path to data URL or blob URL
      // For now, assume path is accessible
      img.src = path;
    });
  }

  /**
   * Perform template matching using canvas-based correlation
   * 
   * @param screenshot - Screenshot image
   * @param template - Template image to find
   * @returns Best match or null
   */
  private async matchTemplate(
    screenshot: HTMLImageElement,
    template: HTMLImageElement
  ): Promise<TemplateMatch | null> {
    // Create canvases for image processing
    const screenshotCanvas = document.createElement('canvas');
    const templateCanvas = document.createElement('canvas');
    
    screenshotCanvas.width = screenshot.width;
    screenshotCanvas.height = screenshot.height;
    templateCanvas.width = template.width;
    templateCanvas.height = template.height;

    const screenshotCtx = screenshotCanvas.getContext('2d');
    const templateCtx = templateCanvas.getContext('2d');

    if (!screenshotCtx || !templateCtx) {
      return null;
    }

    // Draw images to canvases
    screenshotCtx.drawImage(screenshot, 0, 0);
    templateCtx.drawImage(template, 0, 0);

    // Get image data
    const screenshotData = screenshotCtx.getImageData(0, 0, screenshot.width, screenshot.height);
    const templateData = templateCtx.getImageData(0, 0, template.width, template.height);

    // Perform simple template matching (sliding window)
    let bestMatch: TemplateMatch | null = null;
    let bestScore = -Infinity;

    const stepSize = 5; // Skip pixels for performance

    for (let y = 0; y <= screenshot.height - template.height; y += stepSize) {
      for (let x = 0; x <= screenshot.width - template.width; x += stepSize) {
        const score = this.calculateSimilarity(
          screenshotData,
          templateData,
          x,
          y
        );

        if (score > bestScore) {
          bestScore = score;
          bestMatch = {
            x: x + template.width / 2,
            y: y + template.height / 2,
            width: template.width,
            height: template.height,
            confidence: score,
          };
        }
      }
    }

    return bestMatch;
  }

  /**
   * Calculate similarity between template and region in screenshot
   * 
   * @param screenshotData - Screenshot image data
   * @param templateData - Template image data
   * @param offsetX - X offset in screenshot
   * @param offsetY - Y offset in screenshot
   * @returns Similarity score (0-1)
   */
  private calculateSimilarity(
    screenshotData: ImageData,
    templateData: ImageData,
    offsetX: number,
    offsetY: number
  ): number {
    let totalDiff = 0;
    let pixelCount = 0;

    const templateWidth = templateData.width;
    const templateHeight = templateData.height;
    const screenshotWidth = screenshotData.width;

    // Sample every few pixels for performance
    const sampleRate = 2;

    for (let ty = 0; ty < templateHeight; ty += sampleRate) {
      for (let tx = 0; tx < templateWidth; tx += sampleRate) {
        const sx = offsetX + tx;
        const sy = offsetY + ty;

        const templateIdx = (ty * templateWidth + tx) * 4;
        const screenshotIdx = (sy * screenshotWidth + sx) * 4;

        // Compare RGB values
        const rDiff = Math.abs(
          templateData.data[templateIdx] - screenshotData.data[screenshotIdx]
        );
        const gDiff = Math.abs(
          templateData.data[templateIdx + 1] - screenshotData.data[screenshotIdx + 1]
        );
        const bDiff = Math.abs(
          templateData.data[templateIdx + 2] - screenshotData.data[screenshotIdx + 2]
        );

        totalDiff += (rDiff + gDiff + bDiff) / 3;
        pixelCount++;
      }
    }

    // Convert to similarity score (0-1)
    const avgDiff = totalDiff / pixelCount;
    const similarity = 1 - (avgDiff / 255);

    return similarity;
  }

  /**
   * Simulate a mouse click at coordinates
   * 
   * @param x - X coordinate
   * @param y - Y coordinate
   */
  private async simulateClick(x: number, y: number): Promise<void> {
    // For browser-based automation, we can use JavaScript to simulate clicks
    // This works for elements within the current page
    
    // Get element at coordinates
    const element = document.elementFromPoint(x, y);
    
    if (element) {
      // Create and dispatch click event
      // Note: In test environments, window might not be a proper Window object
      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        clientX: x,
        clientY: y,
      });
      
      element.dispatchEvent(clickEvent);
      
      // Also trigger native click if it's an HTML element
      if (element instanceof HTMLElement) {
        element.click();
      }
    } else {
      throw new Error(`No element found at coordinates (${x}, ${y})`);
    }

    // Wait a bit for the click to process
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  /**
   * Get temporary directory path
   * 
   * @returns Temp directory path
   */
  private async getTempDir(): Promise<string> {
    // Use browser's temporary storage or a predefined path
    // For Tauri apps, we can use the app's data directory
    try {
      // Try to get from Tauri
      const appDir = await invoke<string>('get_app_data_dir');
      return `${appDir}/temp`;
    } catch {
      // Fallback to a default path
      return '/tmp/skill-e';
    }
  }

  /**
   * Clear screenshot cache
   */
  clearCache(): void {
    this.screenshotCache.clear();
  }

  /**
   * Get cached screenshot path by timestamp
   * 
   * @param timestamp - Screenshot timestamp
   * @returns Screenshot path or undefined
   */
  getCachedScreenshot(timestamp: string): string | undefined {
    return this.screenshotCache.get(timestamp);
  }
}

/**
 * Create a new image executor instance
 * 
 * @returns Image executor instance
 */
export function createImageExecutor(): ImageExecutor {
  return new ImageExecutor();
}

/**
 * Execute a single step using image-based automation
 * 
 * @param step - Skill step to execute
 * @param options - Automation options
 * @returns Automation result
 */
export async function executeStepImage(
  step: SkillStep,
  options?: AutomationOptions
): Promise<AutomationResult> {
  const executor = createImageExecutor();
  return executor.executeStep(step, options);
}
