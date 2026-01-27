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

import type { OCRResult, OCRRegion } from '../types/processing';

/**
 * OCR Engine configuration
 */
interface OCROptions {
  /** Language for OCR (default: 'eng') */
  language?: string;
  /** Confidence threshold (0-1, default: 0.6) */
  confidenceThreshold?: number;
  /** Enable paragraph detection */
  detectParagraphs?: boolean;
}

/**
 * Default OCR options
 */
const DEFAULT_OPTIONS: Required<OCROptions> = {
  language: 'eng',
  confidenceThreshold: 0.6,
  detectParagraphs: true,
};

/**
 * Tesseract.js dynamic import
 * Lazy-loaded to avoid bundling when not needed
 */
async function loadTesseract() {
  const { createWorker } = await import('tesseract.js');
  return createWorker;
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
  const config = { ...DEFAULT_OPTIONS, ...options };
  
  try {
    // Use worker client for better performance
    const { OCRWorkerClient } = await import('./ocr-worker-client');
    const client = new OCRWorkerClient({
      language: config.language,
      confidenceThreshold: config.confidenceThreshold,
    });
    
    const result = await client.extractText(imagePath);
    await client.terminate();
    
    if (!result.success) {
      throw new Error(result.error || 'OCR failed');
    }
    
    // Group into paragraphs if enabled
    const processedRegions = config.detectParagraphs 
      ? groupIntoParagraphs(result.regions ?? [])
      : (result.regions ?? []);
    
    return {
      frameId: extractFrameId(imagePath),
      text: result.text ?? '',
      confidence: result.confidence ?? 0,
      regions: processedRegions,
    };
  } catch (error) {
    console.error('OCR extraction failed:', error);
    return {
      frameId: extractFrameId(imagePath),
      text: '',
      confidence: 0,
      regions: [],
    };
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
  const BATCH_SIZE = 3;
  const results: OCRResult[] = [];
  
  for (let i = 0; i < imagePaths.length; i += BATCH_SIZE) {
    const batch = imagePaths.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(
      batch.map(path => extractTextFromImage(path, options))
    );
    results.push(...batchResults);
  }
  
  return results;
}

/**
 * Group word regions into paragraphs based on proximity
 * 
 * @param regions - Individual word regions
 * @returns Grouped paragraph regions
 */
function groupIntoParagraphs(regions: OCRRegion[]): OCRRegion[] {
  if (regions.length === 0) return [];
  
  const paragraphs: OCRRegion[] = [];
  const sortedRegions = [...regions].sort((a, b) => {
    // Sort by Y first, then X
    if (Math.abs(a.boundingBox.y - b.boundingBox.y) < 20) {
      return a.boundingBox.x - b.boundingBox.x;
    }
    return a.boundingBox.y - b.boundingBox.y;
  });
  
  let currentParagraph: OCRRegion | null = null;
  
  for (const region of sortedRegions) {
    if (!currentParagraph) {
      currentParagraph = { ...region };
    } else {
      const lastY = currentParagraph.boundingBox.y + currentParagraph.boundingBox.height;
      const currentY = region.boundingBox.y;
      
      // If close enough vertically, merge into paragraph
      if (Math.abs(currentY - lastY) < 30) {
        currentParagraph.text += ' ' + region.text;
        currentParagraph.boundingBox.width = 
          region.boundingBox.x + region.boundingBox.width - currentParagraph.boundingBox.x;
        currentParagraph.boundingBox.height = 
          Math.max(
            currentParagraph.boundingBox.y + currentParagraph.boundingBox.height,
            region.boundingBox.y + region.boundingBox.height
          ) - currentParagraph.boundingBox.y;
        currentParagraph.confidence = 
          (currentParagraph.confidence + region.confidence) / 2;
      } else {
        paragraphs.push(currentParagraph);
        currentParagraph = { ...region };
      }
    }
  }
  
  if (currentParagraph) {
    paragraphs.push(currentParagraph);
  }
  
  return paragraphs;
}

/**
 * Extract frame ID from image path
 * 
 * @param imagePath - Path to image
 * @returns Frame identifier
 */
function extractFrameId(imagePath: string): string {
  const match = imagePath.match(/frame-([\w-]+)\./);
  return match ? match[1] : `frame-${Date.now()}`;
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
  hasChanged: boolean;
  addedText: string[];
  removedText: string[];
  similarity: number;
} {
  const prevWords = new Set(previous.text.toLowerCase().split(/\s+/));
  const currWords = new Set(current.text.toLowerCase().split(/\s+/));
  
  const addedText: string[] = [];
  const removedText: string[] = [];
  
  for (const word of currWords) {
    if (!prevWords.has(word) && word.length > 2) {
      addedText.push(word);
    }
  }
  
  for (const word of prevWords) {
    if (!currWords.has(word) && word.length > 2) {
      removedText.push(word);
    }
  }
  
  // Calculate Jaccard similarity
  const intersection = new Set([...prevWords].filter(x => currWords.has(x)));
  const union = new Set([...prevWords, ...currWords]);
  const similarity = intersection.size / union.size;
  
  return {
    hasChanged: addedText.length > 0 || removedText.length > 0,
    addedText,
    removedText,
    similarity,
  };
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
  const searchLower = searchText.toLowerCase();
  const matches = [];
  
  for (const result of results) {
    const textLower = result.text.toLowerCase();
    
    if (textLower.includes(searchLower)) {
      // Find specific regions containing the text
      const matchingRegions = result.regions.filter(region =>
        region.text.toLowerCase().includes(searchLower)
      );
      
      matches.push({
        result,
        matchConfidence: result.confidence,
        regions: matchingRegions,
      });
    }
  }
  
  return matches.sort((a, b) => b.matchConfidence - a.matchConfidence);
}

/**
 * OCR Batch processor for session frames
 * Processes screenshots with progress callback
 * 
 * @param framePaths - Paths to frame images
 * @param onProgress - Progress callback (processed, total)
 * @returns Map of frameId to OCR result
 */
/**
 * OCR result with frame reference
 */
export interface OCRResultWithFrame extends OCRResult {
  /** Frame index in session */
  frameIndex: number;
  /** Timestamp of frame */
  timestamp: number;
}

/**
 * Batch processor with frame metadata
 */
export async function processSessionOCR(
  framePaths: string[],
  onProgress?: (processed: number, total: number) => void
): Promise<Map<string, OCRResult>> {
  const results = new Map<string, OCRResult>();
  
  for (let i = 0; i < framePaths.length; i++) {
    const path = framePaths[i];
    const result = await extractTextFromImage(path);
    results.set(result.frameId, result);
    
    onProgress?.(i + 1, framePaths.length);
  }
  
  return results;
}
