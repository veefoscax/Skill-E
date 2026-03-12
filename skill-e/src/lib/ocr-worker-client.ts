/**
 * OCR Worker Client
 *
 * Client-side wrapper for the OCR Web Worker.
 * Provides a simple API for text extraction using worker threads.
 *
 * Requirements: FR-5.6, Performance Optimization
 *
 * @example
 * ```typescript
 * const ocr = new OCRWorkerClient();
 * const result = await ocr.extractText('/path/to/image.png');
 * console.log(result.text);
 * await ocr.terminate();
 * ```
 */

import type { OCRResult, OCRRegion } from '../types/processing'

/**
 * OCR Worker Client options
 */
interface OCRWorkerOptions {
  /** Language for OCR (default: 'eng') */
  language?: string
  /** Confidence threshold (0-1, default: 0.6) */
  confidenceThreshold?: number
  /** Timeout in milliseconds (default: 30000) */
  timeout?: number
}

/**
 * OCR extraction result
 */
interface OCRWorkerResult {
  /** Success status */
  success: boolean
  /** Extracted text (if successful) */
  text?: string
  /** Confidence score (if successful) */
  confidence?: number
  /** Text regions (if successful) */
  regions?: OCRRegion[]
  /** Error message (if failed) */
  error?: string
}

/**
 * OCR Worker Client
 *
 * Manages a Web Worker for OCR processing.
 */
export class OCRWorkerClient {
  private worker: Worker | null = null
  private messageId = 0
  private pendingMessages = new Map<
    string,
    { resolve: (value: OCRWorkerResult) => void; reject: (reason: Error) => void }
  >()
  private options: Required<OCRWorkerOptions>

  constructor(options: OCRWorkerOptions = {}) {
    this.options = {
      language: options.language ?? 'eng',
      confidenceThreshold: options.confidenceThreshold ?? 0.6,
      timeout: options.timeout ?? 30000,
    }
  }

  /**
   * Initialize the worker
   */
  private async initWorker(): Promise<Worker> {
    if (this.worker) return this.worker

    // Create worker from the worker file
    this.worker = new Worker(new URL('../workers/ocr-worker.ts', import.meta.url), {
      type: 'module',
    })

    this.worker.onmessage = event => {
      const { id, type, payload } = event.data
      const pending = this.pendingMessages.get(id)

      if (!pending) return

      this.pendingMessages.delete(id)

      if (type === 'result') {
        // Convert worker result to OCRRegion format
        const regions: OCRRegion[] = payload.regions.map(
          (region: {
            text: string
            bbox: { x0: number; y0: number; x1: number; y1: number }
            confidence: number
          }) => ({
            text: region.text,
            boundingBox: {
              x: region.bbox.x0,
              y: region.bbox.y0,
              width: region.bbox.x1 - region.bbox.x0,
              height: region.bbox.y1 - region.bbox.y0,
            },
            confidence: region.confidence,
          })
        )

        pending.resolve({
          success: true,
          text: payload.text,
          confidence: payload.confidence,
          regions,
        })
      } else if (type === 'error') {
        pending.resolve({
          success: false,
          error: payload.error,
        })
      }
    }

    this.worker.onerror = error => {
      console.error('OCR Worker error:', error)
      // Reject all pending messages
      this.pendingMessages.forEach(pending => {
        pending.reject(new Error('Worker error'))
      })
      this.pendingMessages.clear()
    }

    return this.worker
  }

  /**
   * Extract text from an image
   *
   * @param imagePath - Path to image or base64 data URL
   * @returns OCR result
   */
  async extractText(imagePath: string): Promise<OCRWorkerResult> {
    const worker = await this.initWorker()
    const id = `ocr-${++this.messageId}`

    return new Promise((resolve, reject) => {
      // Set timeout
      const timeoutId = setTimeout(() => {
        this.pendingMessages.delete(id)
        resolve({
          success: false,
          error: 'OCR extraction timed out',
        })
      }, this.options.timeout)

      // Store pending message
      this.pendingMessages.set(id, {
        resolve: result => {
          clearTimeout(timeoutId)
          resolve(result)
        },
        reject: error => {
          clearTimeout(timeoutId)
          reject(error)
        },
      })

      // Send message to worker
      worker.postMessage({
        id,
        type: 'extract',
        payload: {
          imagePath,
          language: this.options.language,
          confidenceThreshold: this.options.confidenceThreshold,
        },
      })
    })
  }

  /**
   * Extract text from multiple images in parallel
   *
   * @param imagePaths - Array of image paths
   * @returns Array of OCR results
   */
  async extractMultiple(imagePaths: string[]): Promise<OCRWorkerResult[]> {
    // Process in batches to avoid overwhelming the worker
    const BATCH_SIZE = 3
    const results: OCRWorkerResult[] = []

    for (let i = 0; i < imagePaths.length; i += BATCH_SIZE) {
      const batch = imagePaths.slice(i, i + BATCH_SIZE)
      const batchResults = await Promise.all(batch.map(path => this.extractText(path)))
      results.push(...batchResults)
    }

    return results
  }

  /**
   * Terminate the worker and cleanup resources
   */
  async terminate(): Promise<void> {
    if (!this.worker) return

    // Reject all pending messages
    this.pendingMessages.forEach(pending => {
      pending.reject(new Error('Worker terminated'))
    })
    this.pendingMessages.clear()

    // Send terminate message
    this.worker.postMessage({ id: 'terminate', type: 'terminate' })

    // Wait a bit for cleanup
    await new Promise(resolve => setTimeout(resolve, 100))

    this.worker.terminate()
    this.worker = null
  }
}

/**
 * Convenience function for one-off OCR extraction
 *
 * @param imagePath - Path to image
 * @param options - OCR options
 * @returns OCR result
 */
export async function extractTextWithWorker(
  imagePath: string,
  options?: OCRWorkerOptions
): Promise<OCRResult | null> {
  const client = new OCRWorkerClient(options)

  try {
    const result = await client.extractText(imagePath)

    if (result.success && result.text !== undefined) {
      return {
        frameId: extractFrameId(imagePath),
        text: result.text,
        confidence: result.confidence ?? 0,
        regions: result.regions ?? [],
      }
    }

    return null
  } finally {
    await client.terminate()
  }
}

/**
 * Extract frame ID from image path
 */
function extractFrameId(imagePath: string): string {
  const match = imagePath.match(/frame-([\w-]+)\./)
  return match ? match[1] : `frame-${Date.now()}`
}

/**
 * Batch process multiple images with progress callback
 *
 * @param imagePaths - Array of image paths
 * @param onProgress - Progress callback
 * @returns Map of frameId to OCR result
 */
export async function batchExtractWithWorker(
  imagePaths: string[],
  onProgress?: (processed: number, total: number) => void
): Promise<Map<string, OCRResult>> {
  const client = new OCRWorkerClient()
  const results = new Map<string, OCRResult>()

  try {
    for (let i = 0; i < imagePaths.length; i++) {
      const path = imagePaths[i]
      const result = await client.extractText(path)

      if (result.success) {
        const frameId = extractFrameId(path)
        results.set(frameId, {
          frameId,
          text: result.text ?? '',
          confidence: result.confidence ?? 0,
          regions: result.regions ?? [],
        })
      }

      onProgress?.(i + 1, imagePaths.length)
    }
  } finally {
    await client.terminate()
  }

  return results
}
