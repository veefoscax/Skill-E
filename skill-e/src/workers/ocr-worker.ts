/**
 * OCR Web Worker
 * 
 * Runs Tesseract.js in a separate thread to avoid blocking the UI.
 * This worker handles text extraction from images without affecting
 * the main application's responsiveness.
 * 
 * Requirements: FR-5.6, Performance Optimization
 */

import { createWorker, Worker } from 'tesseract.js';

/**
 * Message types for worker communication
 */
interface OCRMessage {
  id: string;
  type: 'extract' | 'terminate';
  payload?: {
    imagePath: string;
    language?: string;
    confidenceThreshold?: number;
  };
}

interface OCRResultMessage {
  id: string;
  type: 'result' | 'error';
  payload: {
    text: string;
    confidence: number;
    regions: Array<{
      text: string;
      bbox: { x0: number; y0: number; x1: number; y1: number };
      confidence: number;
    }>;
  } | {
    error: string;
  };
}

let worker: Worker | null = null;
let workerPromise: Promise<Worker> | null = null;
let currentLanguage = 'eng';

/**
 * Initialize the Tesseract worker (lazy singleton)
 */
async function getWorker(language: string = 'eng'): Promise<Worker> {
  console.log('🔍 OCR Worker: Getting worker for language:', language);
  
  if (worker && language === currentLanguage) {
    console.log('🔍 OCR Worker: Reusing existing worker');
    return worker;
  }
  
  // Terminate existing worker if language changed
  if (worker) {
    console.log('🔍 OCR Worker: Terminating existing worker for language change');
    await worker.terminate();
    worker = null;
    workerPromise = null;
  }
  
  console.log('🔍 OCR Worker: Creating new Tesseract worker...');
  try {
    workerPromise = createWorker(language);
    worker = await workerPromise;
    currentLanguage = language;
    console.log('✅ OCR Worker: Tesseract worker created successfully');
    return worker;
  } catch (err) {
    console.error('❌ OCR Worker: Failed to create worker:', err);
    throw err;
  }
}

/**
 * Extract text from image using Tesseract
 */
async function extractText(
  imagePath: string,
  language: string = 'eng',
  confidenceThreshold: number = 0.6
): Promise<OCRResultMessage['payload']> {
  try {
    console.log('🔍 OCR Worker: Starting extraction for:', imagePath.substring(0, 100) + '...');
    const tesseractWorker = await getWorker(language);
    console.log('🔍 OCR Worker: Tesseract worker ready');
    
    const result = await tesseractWorker.recognize(imagePath);
    console.log('🔍 OCR Worker: Recognition complete, confidence:', result.data.confidence);
    
    // Filter regions by confidence
    const regions = result.data.words
      .filter((word) => word.confidence >= confidenceThreshold * 100)
      .map((word) => ({
        text: word.text,
        bbox: word.bbox,
        confidence: word.confidence / 100,
      }));
    
    console.log('🔍 OCR Worker: Found', regions.length, 'words');
    
    return {
      text: result.data.text.trim(),
      confidence: result.data.confidence / 100,
      regions,
    };
  } catch (error) {
    console.error('❌ OCR Worker: Extraction failed:', error);
    return {
      error: error instanceof Error ? error.message : 'OCR extraction failed',
    };
  }
}

/**
 * Terminate the worker and cleanup resources
 */
async function terminate(): Promise<void> {
  if (worker) {
    await worker.terminate();
    worker = null;
    workerPromise = null;
    currentLanguage = 'eng';
  }
}

// Handle messages from main thread
self.onmessage = async (event: MessageEvent<OCRMessage>) => {
  const { id, type, payload } = event.data;
  
  if (type === 'extract' && payload) {
    const result = await extractText(
      payload.imagePath,
      payload.language,
      payload.confidenceThreshold
    );
    
    // Check if result has error property to determine response type
    const hasError = 'error' in result;
    console.log('🔍 OCR Worker: Result has error?', hasError, result);
    
    const response: OCRResultMessage = {
      id,
      type: hasError ? 'error' : 'result',
      payload: result,
    };
    
    self.postMessage(response);
  } else if (type === 'terminate') {
    await terminate();
    self.postMessage({ id, type: 'terminated' });
  }
};

export {};
