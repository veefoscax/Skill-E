/**
 * OCR (Optical Character Recognition) Module
 *
 * Extracts text from screenshots for context enrichment.
 * Uses Tesseract.js for client-side OCR processing.
 *
 * Requirements: FR-5.6
 *
 * @example
 * ```typescript
 * const result = await extractTextFromImage('/path/to/screenshot.png');
 * console.log(result.text); // Extracted text
 * console.log(result.regions); // Text regions with bounding boxes
 * ```
 */

import type { OCRResult, OCRRegion } from '../types/processing'
import { readFile } from '@tauri-apps/plugin-fs'
import { createWorker } from 'tesseract.js'

/**
 * OCR Engine configuration
 */
interface OCROptions {
  /** Language for OCR (default: 'eng') */
  language?: string
  /** Confidence threshold (0-1, default: 0.6) */
  confidenceThreshold?: number
  /** Enable paragraph detection */
  detectParagraphs?: boolean
}

/**
 * Default OCR options
 */
const DEFAULT_OPTIONS: Required<OCROptions> = {
  language: 'eng',
  confidenceThreshold: 0.6,
  detectParagraphs: true,
}

/**
 * Tesseract.js dynamic import
 * Lazy-loaded to avoid bundling when not needed
 */
async function loadTesseract() {
  const { createWorker } = await import('tesseract.js')
  return createWorker
}

/**
 * Helper to read image as base64 using Tauri FS
 */
async function readImageAsBase64(imagePath: string): Promise<string> {
  try {
    console.log('🔍 OCR: Reading image file:', imagePath)
    const bytes = await readFile(imagePath)
    console.log('🔍 OCR: File read successfully, size:', bytes.byteLength, 'bytes')

    let binary = ''
    const len = bytes.byteLength
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    // Use browser's btoa for base64 encoding (Buffer not available in browser)
    let base64: string
    if (typeof btoa === 'function') {
      base64 = btoa(binary)
    } else {
      // Fallback for environments without btoa
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
      base64 = ''
      for (let i = 0; i < binary.length; i += 3) {
        const b1 = binary.charCodeAt(i)
        const b2 = i + 1 < binary.length ? binary.charCodeAt(i + 1) : 0
        const b3 = i + 2 < binary.length ? binary.charCodeAt(i + 2) : 0
        base64 += chars[b1 >> 2]
        base64 += chars[((b1 & 3) << 4) | (b2 >> 4)]
        base64 += i + 1 < binary.length ? chars[((b2 & 15) << 2) | (b3 >> 6)] : '='
        base64 += i + 2 < binary.length ? chars[b3 & 63] : '='
      }
    }

    // Determine mime
    const ext = imagePath.split('.').pop()?.toLowerCase()
    let mime = 'image/png'
    if (ext === 'jpg' || ext === 'jpeg') mime = 'image/jpeg'
    else if (ext === 'webp') mime = 'image/webp'

    console.log('🔍 OCR: Converted to base64, length:', base64.length)
    return `data:${mime};base64,${base64}`
  } catch (e) {
    console.warn('❌ OCR: Failed to read local file:', imagePath, e)
    return imagePath
  }
}

/**
 * Extract text from an image file using Web Worker
 *
 * Uses OCRWorkerClient for non-blocking processing.
 *
 * @param imagePath - Path to image file or base64 data URL
 * @param options - OCR configuration options
 * @returns OCR result with text and regions
 */
export async function extractTextFromImage(
  imagePath: string,
  options: OCROptions = {}
): Promise<OCRResult> {
  const config = { ...DEFAULT_OPTIONS, ...options }
  console.log('🔍 OCR: extractTextFromImage called for:', imagePath.substring(0, 50) + '...')

  try {
    // Pre-read file if it looks like a local path and not a data URL
    let inputPath = imagePath
    if (!imagePath.startsWith('data:') && !imagePath.startsWith('http')) {
      // Assume local file path
      console.log('🔍 OCR: Converting local path to base64')
      inputPath = await readImageAsBase64(imagePath)
    }

    console.log('🔍 OCR: Using worker client')
    // Use worker client for better performance
    const { OCRWorkerClient } = await import('./ocr-worker-client')
    const client = new OCRWorkerClient({
      language: config.language,
      confidenceThreshold: config.confidenceThreshold,
    })

    // Pass the (potentially base64) path
    console.log('🔍 OCR: Calling client.extractText')
    const result = await client.extractText(inputPath)
    console.log('🔍 OCR: client.extractText returned:', result.success ? 'success' : 'failed')
    await client.terminate()

    if (!result.success) {
      console.error('❌ OCR: Worker returned error:', result.error)
      throw new Error(result.error || 'OCR failed')
    }

    // Group into paragraphs if enabled
    const processedRegions = config.detectParagraphs
      ? groupIntoParagraphs(result.regions ?? [])
      : (result.regions ?? [])

    return {
      frameId: extractFrameId(imagePath),
      text: result.text ?? '',
      confidence: result.confidence ?? 0,
      regions: processedRegions,
    }
  } catch (error) {
    console.error('❌ OCR extraction failed with worker, trying fallback:', error)

    // Fallback: try direct Tesseract without worker
    try {
      console.log('🔍 OCR: Trying fallback with direct Tesseract...')
      const fallbackResult = await extractTextDirect(imagePath, config)
      console.log('✅ OCR: Fallback succeeded')
      return fallbackResult
    } catch (fallbackError) {
      console.error('❌ OCR: Fallback also failed:', fallbackError)
      // Return empty result instead of throwing, to be resilient
      return {
        frameId: extractFrameId(imagePath),
        text: '',
        confidence: 0,
        regions: [],
      }
    }
  }
}

/**
 * Fallback: Extract text using Tesseract directly (no worker)
 */
async function extractTextDirect(
  imagePath: string,
  config: Required<OCROptions>
): Promise<OCRResult> {
  let inputPath = imagePath

  // Convert to base64 if needed
  if (!imagePath.startsWith('data:') && !imagePath.startsWith('http')) {
    inputPath = await readImageAsBase64(imagePath)
  }

  console.log('🔍 OCR Direct: Creating worker...')
  const worker = await createWorker(config.language)
  console.log('🔍 OCR Direct: Worker created, recognizing...')

  const result = await worker.recognize(inputPath)
  console.log('🔍 OCR Direct: Recognition complete, terminating...')

  await worker.terminate()

  // Filter regions by confidence
  const regions: OCRRegion[] = result.data.words
    .filter(word => word.confidence >= config.confidenceThreshold * 100)
    .map(word => ({
      text: word.text,
      boundingBox: {
        x: word.bbox.x0,
        y: word.bbox.y0,
        width: word.bbox.x1 - word.bbox.x0,
        height: word.bbox.y1 - word.bbox.y0,
      },
      confidence: word.confidence / 100,
    }))

  return {
    frameId: extractFrameId(imagePath),
    text: result.data.text.trim(),
    confidence: result.data.confidence / 100,
    regions,
  }
}

/**
 * Extract text from multiple images in batch
 *
 * @param imagePaths - Array of image paths
 * @param options - OCR configuration options
 * @returns Array of OCR results
 */
export async function extractTextFromImages(
  imagePaths: string[],
  options: OCROptions = {}
): Promise<OCRResult[]> {
  // Process in batches to avoid overwhelming the system
  const BATCH_SIZE = 3
  const results: OCRResult[] = []

  for (let i = 0; i < imagePaths.length; i += BATCH_SIZE) {
    const batch = imagePaths.slice(i, i + BATCH_SIZE)

    // Process batch in parallel, but handle individual failures gracefully
    const batchPromises = batch.map(async path => {
      try {
        return await extractTextFromImage(path, options)
      } catch (e) {
        console.warn(`Batch OCR failed for image: ${path}`, e)
        return {
          frameId: extractFrameId(path),
          text: '',
          confidence: 0,
          regions: [],
        } as OCRResult
      }
    })

    const batchResults = await Promise.all(batchPromises)
    results.push(...batchResults)
  }

  return results
}

/**
 * Group word regions into paragraphs based on proximity
 *
 * @param regions - Individual word regions
 * @returns Grouped paragraph regions
 */
function groupIntoParagraphs(regions: OCRRegion[]): OCRRegion[] {
  if (regions.length === 0) return []

  const paragraphs: OCRRegion[] = []
  const sortedRegions = [...regions].sort((a, b) => {
    // Sort by Y first, then X
    if (Math.abs(a.boundingBox.y - b.boundingBox.y) < 20) {
      return a.boundingBox.x - b.boundingBox.x
    }
    return a.boundingBox.y - b.boundingBox.y
  })

  let currentParagraph: OCRRegion | null = null

  for (const region of sortedRegions) {
    if (!currentParagraph) {
      currentParagraph = { ...region }
    } else {
      const lastY = currentParagraph.boundingBox.y + currentParagraph.boundingBox.height
      const currentY = region.boundingBox.y

      // If close enough vertically, merge into paragraph
      if (Math.abs(currentY - lastY) < 30) {
        currentParagraph.text += ' ' + region.text
        currentParagraph.boundingBox.width =
          region.boundingBox.x + region.boundingBox.width - currentParagraph.boundingBox.x
        currentParagraph.boundingBox.height =
          Math.max(
            currentParagraph.boundingBox.y + currentParagraph.boundingBox.height,
            region.boundingBox.y + region.boundingBox.height
          ) - currentParagraph.boundingBox.y
        currentParagraph.confidence = (currentParagraph.confidence + region.confidence) / 2
      } else {
        paragraphs.push(currentParagraph)
        currentParagraph = { ...region }
      }
    }
  }

  if (currentParagraph) {
    paragraphs.push(currentParagraph)
  }

  return paragraphs
}

/**
 * Extract frame ID from image path
 *
 * @param imagePath - Path to image
 * @returns Frame identifier
 */
function extractFrameId(imagePath: string): string {
  const match = imagePath.match(/frame-([\w-]+)\./)
  return match ? match[1] : `frame-${Date.now()}`
}

/**
 * Compare two OCR results to detect significant text changes
 * Useful for detecting state changes in UI
 *
 * @param previous - Previous OCR result
 * @param current - Current OCR result
 * @returns Change detection result
 */
export function detectTextChanges(
  previous: OCRResult,
  current: OCRResult
): {
  hasChanged: boolean
  addedText: string[]
  removedText: string[]
  similarity: number
} {
  const prevWords = new Set(previous.text.toLowerCase().split(/\s+/))
  const currWords = new Set(current.text.toLowerCase().split(/\s+/))

  const addedText: string[] = []
  const removedText: string[] = []

  for (const word of currWords) {
    if (!prevWords.has(word) && word.length > 2) {
      addedText.push(word)
    }
  }

  for (const word of prevWords) {
    if (!currWords.has(word) && word.length > 2) {
      removedText.push(word)
    }
  }

  // Calculate Jaccard similarity
  const intersection = new Set([...prevWords].filter(x => currWords.has(x)))
  const union = new Set([...prevWords, ...currWords])
  const similarity = intersection.size / union.size

  return {
    hasChanged: addedText.length > 0 || removedText.length > 0,
    addedText,
    removedText,
    similarity,
  }
}

/**
 * Find text in OCR results
 *
 * @param results - Array of OCR results
 * @param searchText - Text to search for
 * @returns Matching results with confidence scores
 */
export function findTextInResults(
  results: OCRResult[],
  searchText: string
): Array<{ result: OCRResult; matchConfidence: number; regions: OCRRegion[] }> {
  const searchLower = searchText.toLowerCase()
  const matches = []

  for (const result of results) {
    const textLower = result.text.toLowerCase()

    if (textLower.includes(searchLower)) {
      // Find specific regions containing the text
      const matchingRegions = result.regions.filter(region =>
        region.text.toLowerCase().includes(searchLower)
      )

      matches.push({
        result,
        matchConfidence: result.confidence,
        regions: matchingRegions,
      })
    }
  }

  return matches.sort((a, b) => b.matchConfidence - a.matchConfidence)
}
