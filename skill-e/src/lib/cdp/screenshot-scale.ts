/**
 * Screenshot Scaling Utility
 * 
 * Scales screenshots for token efficiency (similar to Claude extension)
 * - Reduces image size to minimize LLM token usage
 * - Maintains readability for element identification
 * - Provides coordinate mapping for accurate clicking
 */

/**
 * Screenshot scaling options
 */
export interface ScreenshotScaleOptions {
  /** Target width (default: 1024) */
  targetWidth?: number;
  
  /** Target height (default: 768) */
  targetHeight?: number;
  
  /** Maintain aspect ratio (default: true) */
  maintainAspectRatio?: boolean;
  
  /** JPEG quality (0-100, default: 85) */
  quality?: number;
  
  /** Format (default: jpeg for smaller size) */
  format?: 'jpeg' | 'png' | 'webp';
}

/**
 * Scaled screenshot result
 */
export interface ScaledScreenshot {
  /** Base64 encoded image data */
  data: string;
  
  /** Original dimensions */
  originalWidth: number;
  
  /** Original height */
  originalHeight: number;
  
  /** Scaled width */
  scaledWidth: number;
  
  /** Scaled height */
  scaledHeight: number;
  
  /** Scale factor (original / scaled) */
  scaleFactor: number;
  
  /** Format used */
  format: string;
  
  /** Size in bytes */
  sizeBytes: number;
}

/**
 * Coordinate mapping result
 */
export interface CoordinateMapping {
  /** Original coordinates */
  original: { x: number; y: number };
  
  /** Scaled coordinates */
  scaled: { x: number; y: number };
}

/**
 * Calculate scale factor to fit within target dimensions
 */
export function calculateScaleFactor(
  originalWidth: number,
  originalHeight: number,
  targetWidth: number,
  targetHeight: number,
  maintainAspectRatio = true
): number {
  if (!maintainAspectRatio) {
    // Scale independently for width and height
    const scaleX = targetWidth / originalWidth;
    const scaleY = targetHeight / originalHeight;
    return Math.min(scaleX, scaleY);
  }

  // Scale to fit within target while maintaining aspect ratio
  const scaleX = targetWidth / originalWidth;
  const scaleY = targetHeight / originalHeight;
  return Math.min(scaleX, scaleY, 1); // Never upscale
}

/**
 * Scale coordinates from original to scaled image
 */
export function scaleCoordinates(
  x: number,
  y: number,
  scaleFactor: number
): { x: number; y: number } {
  return {
    x: Math.round(x * scaleFactor),
    y: Math.round(y * scaleFactor),
  };
}

/**
 * Unscale coordinates from scaled image to original
 */
export function unscaleCoordinates(
  x: number,
  y: number,
  scaleFactor: number
): { x: number; y: number } {
  return {
    x: Math.round(x / scaleFactor),
    y: Math.round(y / scaleFactor),
  };
}

/**
 * Scale screenshot using canvas
 */
export async function scaleScreenshot(
  imageData: string,
  options: ScreenshotScaleOptions = {}
): Promise<ScaledScreenshot> {
  const {
    targetWidth = 1024,
    targetHeight = 768,
    maintainAspectRatio = true,
    quality = 85,
    format = 'jpeg',
  } = options;

  // Create image element
  const img = new Image();
  
  return new Promise((resolve, reject) => {
    img.onload = () => {
      const originalWidth = img.naturalWidth;
      const originalHeight = img.naturalHeight;

      // Calculate scale factor
      const scaleFactor = calculateScaleFactor(
        originalWidth,
        originalHeight,
        targetWidth,
        targetHeight,
        maintainAspectRatio
      );

      // Calculate scaled dimensions
      const scaledWidth = Math.round(originalWidth * scaleFactor);
      const scaledHeight = Math.round(originalHeight * scaleFactor);

      // Create canvas
      const canvas = document.createElement('canvas');
      canvas.width = scaledWidth;
      canvas.height = scaledHeight;

      // Draw scaled image
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      // Use better quality scaling
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      ctx.drawImage(img, 0, 0, scaledWidth, scaledHeight);

      // Convert to base64
      const mimeType = format === 'jpeg' ? 'image/jpeg' : 
                       format === 'webp' ? 'image/webp' : 'image/png';
      
      const scaledData = canvas.toDataURL(mimeType, quality / 100);
      
      // Extract base64 data
      const base64Data = scaledData.split(',')[1];
      const sizeBytes = Math.ceil((base64Data.length * 3) / 4);

      resolve({
        data: base64Data,
        originalWidth,
        originalHeight,
        scaledWidth,
        scaledHeight,
        scaleFactor,
        format,
        sizeBytes,
      });
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    // Set source
    img.src = imageData.startsWith('data:') ? imageData : `data:image/png;base64,${imageData}`;
  });
}

/**
 * Scale screenshot for LLM token efficiency
 * 
 * Default: 1024x768 JPEG at 85% quality
 * This reduces token usage while maintaining readability
 */
export async function scaleForLLM(imageData: string): Promise<ScaledScreenshot> {
  return scaleScreenshot(imageData, {
    targetWidth: 1024,
    targetHeight: 768,
    maintainAspectRatio: true,
    quality: 85,
    format: 'jpeg',
  });
}

/**
 * Scale screenshot for storage
 * 
 * Smaller size for storage, lower quality acceptable
 */
export async function scaleForStorage(imageData: string): Promise<ScaledScreenshot> {
  return scaleScreenshot(imageData, {
    targetWidth: 800,
    targetHeight: 600,
    maintainAspectRatio: true,
    quality: 70,
    format: 'jpeg',
  });
}

/**
 * Scale screenshot for thumbnail
 * 
 * Very small for previews
 */
export async function scaleForThumbnail(imageData: string): Promise<ScaledScreenshot> {
  return scaleScreenshot(imageData, {
    targetWidth: 320,
    targetHeight: 240,
    maintainAspectRatio: true,
    quality: 60,
    format: 'jpeg',
  });
}

/**
 * Coordinate mapper for scaled screenshots
 * 
 * Maps coordinates between original and scaled images
 */
export class CoordinateMapper {
  private scaleFactor: number;
  private originalWidth: number;
  private originalHeight: number;
  private scaledWidth: number;
  private scaledHeight: number;

  constructor(scaledScreenshot: ScaledScreenshot) {
    this.scaleFactor = scaledScreenshot.scaleFactor;
    this.originalWidth = scaledScreenshot.originalWidth;
    this.originalHeight = scaledScreenshot.originalHeight;
    this.scaledWidth = scaledScreenshot.scaledWidth;
    this.scaledHeight = scaledScreenshot.scaledHeight;
  }

  /**
   * Create mapper from raw values
   */
  static fromDimensions(
    originalWidth: number,
    originalHeight: number,
    scaledWidth: number,
    scaledHeight: number
  ): CoordinateMapper {
    const scaleFactor = originalWidth / scaledWidth;
    
    return new CoordinateMapper({
      data: '',
      originalWidth,
      originalHeight,
      scaledWidth,
      scaledHeight,
      scaleFactor,
      format: 'png',
      sizeBytes: 0,
    });
  }

  /**
   * Scale coordinates from original to scaled
   */
  toScaled(x: number, y: number): { x: number; y: number } {
    return scaleCoordinates(x, y, this.scaleFactor);
  }

  /**
   * Unscale coordinates from scaled to original
   */
  toOriginal(x: number, y: number): { x: number; y: number } {
    return unscaleCoordinates(x, y, this.scaleFactor);
  }

  /**
   * Scale a rectangle
   */
  scaleRect(rect: { x: number; y: number; width: number; height: number }): {
    x: number;
    y: number;
    width: number;
    height: number;
  } {
    const scaled = this.toScaled(rect.x, rect.y);
    return {
      x: scaled.x,
      y: scaled.y,
      width: Math.round(rect.width * this.scaleFactor),
      height: Math.round(rect.height * this.scaleFactor),
    };
  }

  /**
   * Unscale a rectangle
   */
  unscaleRect(rect: { x: number; y: number; width: number; height: number }): {
    x: number;
    y: number;
    width: number;
    height: number;
  } {
    const original = this.toOriginal(rect.x, rect.y);
    return {
      x: original.x,
      y: original.y,
      width: Math.round(rect.width / this.scaleFactor),
      height: Math.round(rect.height / this.scaleFactor),
    };
  }

  /**
   * Get scale factor
   */
  getScaleFactor(): number {
    return this.scaleFactor;
  }

  /**
   * Get dimensions
   */
  getDimensions(): {
    original: { width: number; height: number };
    scaled: { width: number; height: number };
  } {
    return {
      original: { width: this.originalWidth, height: this.originalHeight },
      scaled: { width: this.scaledWidth, height: this.scaledHeight },
    };
  }
}

/**
 * Estimate token count for image
 * 
 * Rough estimate: 1 token per ~3-4 pixels for GPT-4 Vision
 */
export function estimateImageTokens(width: number, height: number): number {
  const pixels = width * height;
  // GPT-4 Vision uses ~3-4 pixels per token
  return Math.ceil(pixels / 3.5);
}

/**
 * Get token savings from scaling
 */
export function getTokenSavings(
  originalWidth: number,
  originalHeight: number,
  scaledWidth: number,
  scaledHeight: number
): {
  originalTokens: number;
  scaledTokens: number;
  savings: number;
  percentReduction: number;
} {
  const originalTokens = estimateImageTokens(originalWidth, originalHeight);
  const scaledTokens = estimateImageTokens(scaledWidth, scaledHeight);
  const savings = originalTokens - scaledTokens;
  const percentReduction = (savings / originalTokens) * 100;

  return {
    originalTokens,
    scaledTokens,
    savings,
    percentReduction,
  };
}

// Export types

