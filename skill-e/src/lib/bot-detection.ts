/**
 * Bot Detection - Anti-Bot Measure Detection
 *
 * Detects common anti-bot measures like Cloudflare challenges, CAPTCHAs,
 * and other bot detection systems. Provides warnings and suggestions for
 * handling these scenarios.
 *
 * Requirements: FR-10.6
 */

/**
 * Types of anti-bot measures
 */
export type AntiBotType =
  | 'cloudflare'
  | 'recaptcha'
  | 'hcaptcha'
  | 'turnstile'
  | 'funcaptcha'
  | 'generic-challenge'
  | 'rate-limit'
  | 'unknown'

/**
 * Bot detection result
 */
export interface BotDetectionResult {
  /** Whether anti-bot measures were detected */
  detected: boolean

  /** Type of anti-bot measure detected */
  type?: AntiBotType

  /** Confidence level (0-1) */
  confidence: number

  /** Detected indicators */
  indicators: string[]

  /** Warning message for the user */
  warning?: string

  /** Suggestions for handling the anti-bot measure */
  suggestions: string[]
}

/**
 * Bot detection options
 */
export interface BotDetectionOptions {
  /** Whether to check page content (default: true) */
  checkContent?: boolean

  /** Whether to check URL (default: true) */
  checkUrl?: boolean

  /** Whether to check page title (default: true) */
  checkTitle?: boolean

  /** Whether to check meta tags (default: true) */
  checkMetaTags?: boolean

  /** Whether to check scripts (default: true) */
  checkScripts?: boolean

  /** Minimum confidence threshold (default: 0.5) */
  minConfidence?: number
}

/**
 * Anti-bot indicators database
 */
const ANTI_BOT_INDICATORS = {
  cloudflare: {
    keywords: [
      'cloudflare',
      'cf-ray',
      'cf-challenge',
      'checking your browser',
      'just a moment',
      'enable javascript and cookies',
      'ddos protection',
      'security check',
    ],
    urls: ['cloudflare.com', 'cf-challenge', 'cdn-cgi/challenge'],
    scripts: ['cloudflare', 'cf-challenge', 'challenge-platform'],
    confidence: 0.9,
  },

  recaptcha: {
    keywords: ['recaptcha', "i'm not a robot", 'verify you are human', 'google.com/recaptcha'],
    urls: ['google.com/recaptcha', 'recaptcha'],
    scripts: ['recaptcha', 'google.com/recaptcha', 'gstatic.com/recaptcha'],
    confidence: 0.95,
  },

  hcaptcha: {
    keywords: ['hcaptcha', 'verify you are human', 'hcaptcha.com'],
    urls: ['hcaptcha.com', 'hcaptcha'],
    scripts: ['hcaptcha', 'hcaptcha.com'],
    confidence: 0.95,
  },

  turnstile: {
    keywords: ['turnstile', 'cloudflare turnstile', 'cf-turnstile'],
    urls: ['turnstile', 'cf-turnstile'],
    scripts: ['turnstile', 'cf-turnstile', 'challenges.cloudflare.com'],
    confidence: 0.9,
  },

  funcaptcha: {
    keywords: ['funcaptcha', 'arkose', 'verify you are human'],
    urls: ['funcaptcha', 'arkose'],
    scripts: ['funcaptcha', 'arkose', 'arkoselabs.com'],
    confidence: 0.9,
  },

  'generic-challenge': {
    keywords: [
      'bot detection',
      'automated access',
      'suspicious activity',
      'verify you are human',
      'prove you are human',
      'security verification',
      'access denied',
      'blocked',
    ],
    urls: [],
    scripts: [],
    confidence: 0.6,
  },

  'rate-limit': {
    keywords: [
      'rate limit',
      'too many requests',
      'slow down',
      'try again later',
      '429',
      'quota exceeded',
    ],
    urls: [],
    scripts: [],
    confidence: 0.7,
  },
}

/**
 * Bot Detector
 *
 * Analyzes web pages to detect anti-bot measures and provides
 * recommendations for handling them.
 */
export class BotDetector {
  private defaultOptions: BotDetectionOptions = {
    checkContent: true,
    checkUrl: true,
    checkTitle: true,
    checkMetaTags: true,
    checkScripts: true,
    minConfidence: 0.5,
  }

  /**
   * Detect anti-bot measures on a page
   *
   * @param url - Page URL
   * @param content - Page HTML content (optional)
   * @param options - Detection options
   * @returns Bot detection result
   */
  async detect(
    url: string,
    content?: string,
    options?: BotDetectionOptions
  ): Promise<BotDetectionResult> {
    const opts = { ...this.defaultOptions, ...options }
    const indicators: string[] = []
    const detections: Array<{ type: AntiBotType; confidence: number }> = []

    // Check URL
    if (opts.checkUrl) {
      const urlDetections = this.checkUrl(url)
      detections.push(...urlDetections)
      indicators.push(...urlDetections.map(d => `URL contains ${d.type} indicators`))
    }

    // Check content if provided
    if (content && opts.checkContent) {
      const contentDetections = this.checkContent(content, opts)
      detections.push(...contentDetections)
      indicators.push(...contentDetections.map(d => `Content contains ${d.type} indicators`))
    }

    // Find the detection with highest confidence
    if (detections.length === 0) {
      return {
        detected: false,
        confidence: 0,
        indicators: [],
        suggestions: [],
      }
    }

    // Sort by confidence and get the best match
    detections.sort((a, b) => b.confidence - a.confidence)
    const bestMatch = detections[0]

    // Only report if confidence meets threshold
    if (bestMatch.confidence < (opts.minConfidence ?? 0.5)) {
      return {
        detected: false,
        confidence: bestMatch.confidence,
        indicators,
        suggestions: [],
      }
    }

    // Generate warning and suggestions
    const warning = this.generateWarning(bestMatch.type)
    const suggestions = this.generateSuggestions(bestMatch.type)

    return {
      detected: true,
      type: bestMatch.type,
      confidence: bestMatch.confidence,
      indicators,
      warning,
      suggestions,
    }
  }

  /**
   * Detect anti-bot measures from current page (browser context)
   *
   * @param options - Detection options
   * @returns Bot detection result
   */
  async detectFromCurrentPage(options?: BotDetectionOptions): Promise<BotDetectionResult> {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return {
        detected: false,
        confidence: 0,
        indicators: ['Not in browser context'],
        suggestions: [],
      }
    }

    const url = window.location.href
    const content = document.documentElement.outerHTML

    return this.detect(url, content, options)
  }

  /**
   * Check URL for anti-bot indicators
   *
   * @param url - URL to check
   * @returns Array of detections
   */
  private checkUrl(url: string): Array<{ type: AntiBotType; confidence: number }> {
    const detections: Array<{ type: AntiBotType; confidence: number }> = []
    const urlLower = url.toLowerCase()

    for (const [type, config] of Object.entries(ANTI_BOT_INDICATORS)) {
      for (const urlPattern of config.urls) {
        if (urlLower.includes(urlPattern.toLowerCase())) {
          detections.push({
            type: type as AntiBotType,
            confidence: config.confidence,
          })
          break
        }
      }
    }

    return detections
  }

  /**
   * Check page content for anti-bot indicators
   *
   * @param content - HTML content
   * @param options - Detection options
   * @returns Array of detections
   */
  private checkContent(
    content: string,
    options: BotDetectionOptions
  ): Array<{ type: AntiBotType; confidence: number }> {
    const detections: Array<{ type: AntiBotType; confidence: number }> = []
    const contentLower = content.toLowerCase()

    // Parse HTML to check specific elements
    const parser = new DOMParser()
    const doc = parser.parseFromString(content, 'text/html')

    for (const [type, config] of Object.entries(ANTI_BOT_INDICATORS)) {
      let matchCount = 0
      let totalChecks = 0

      // Check keywords in content
      if (options.checkContent) {
        for (const keyword of config.keywords) {
          totalChecks++
          if (contentLower.includes(keyword.toLowerCase())) {
            matchCount++
          }
        }
      }

      // Check title
      if (options.checkTitle) {
        const title = doc.querySelector('title')?.textContent?.toLowerCase() || ''
        for (const keyword of config.keywords) {
          totalChecks++
          if (title.includes(keyword.toLowerCase())) {
            matchCount++
          }
        }
      }

      // Check meta tags
      if (options.checkMetaTags) {
        const metaTags = doc.querySelectorAll('meta')
        metaTags.forEach(meta => {
          const name = meta.getAttribute('name')?.toLowerCase() || ''
          const content = meta.getAttribute('content')?.toLowerCase() || ''

          for (const keyword of config.keywords) {
            totalChecks++
            if (name.includes(keyword.toLowerCase()) || content.includes(keyword.toLowerCase())) {
              matchCount++
            }
          }
        })
      }

      // Check scripts
      if (options.checkScripts) {
        const scripts = doc.querySelectorAll('script')
        scripts.forEach(script => {
          const src = script.getAttribute('src')?.toLowerCase() || ''
          const scriptContent = script.textContent?.toLowerCase() || ''

          for (const scriptPattern of config.scripts) {
            totalChecks++
            if (
              src.includes(scriptPattern.toLowerCase()) ||
              scriptContent.includes(scriptPattern.toLowerCase())
            ) {
              matchCount++
            }
          }
        })
      }

      // Calculate confidence based on match ratio
      if (matchCount > 0 && totalChecks > 0) {
        const matchRatio = matchCount / totalChecks
        const adjustedConfidence = config.confidence * Math.min(matchRatio * 2, 1)

        detections.push({
          type: type as AntiBotType,
          confidence: adjustedConfidence,
        })
      }
    }

    return detections
  }

  /**
   * Generate warning message for detected anti-bot measure
   *
   * @param type - Anti-bot type
   * @returns Warning message
   */
  private generateWarning(type: AntiBotType): string {
    const warnings: Record<AntiBotType, string> = {
      cloudflare: '⚠️ Cloudflare challenge detected. DOM automation may fail.',
      recaptcha: '⚠️ Google reCAPTCHA detected. Manual verification required.',
      hcaptcha: '⚠️ hCaptcha detected. Manual verification required.',
      turnstile: '⚠️ Cloudflare Turnstile detected. Automated access may be blocked.',
      funcaptcha: '⚠️ FunCaptcha detected. Manual verification required.',
      'generic-challenge': '⚠️ Bot detection challenge detected. Automated access may fail.',
      'rate-limit': '⚠️ Rate limiting detected. Too many requests.',
      unknown: '⚠️ Possible anti-bot measures detected.',
    }

    return warnings[type] || warnings.unknown
  }

  /**
   * Generate suggestions for handling detected anti-bot measure
   *
   * @param type - Anti-bot type
   * @returns Array of suggestions
   */
  private generateSuggestions(type: AntiBotType): string[] {
    const suggestions: Record<AntiBotType, string[]> = {
      cloudflare: [
        'Use image-based automation instead of DOM selectors',
        'Wait for the challenge to complete before proceeding',
        'Consider using a browser with valid cookies/session',
        'Add a longer wait time before interacting with the page',
      ],

      recaptcha: [
        'Pause execution and solve the CAPTCHA manually',
        'Use image-based automation to click after manual verification',
        'Consider using a CAPTCHA solving service (if allowed)',
        'Wait for user to complete verification before continuing',
      ],

      hcaptcha: [
        'Pause execution and solve the CAPTCHA manually',
        'Use image-based automation to click after manual verification',
        'Wait for user to complete verification before continuing',
      ],

      turnstile: [
        'Wait for the Turnstile challenge to complete automatically',
        'Use image-based automation if DOM access is blocked',
        'Add a 5-10 second wait before proceeding',
      ],

      funcaptcha: [
        'Pause execution and solve the challenge manually',
        'Wait for user to complete verification before continuing',
        'Use image-based automation after manual verification',
      ],

      'generic-challenge': [
        'Use image-based automation instead of DOM selectors',
        'Add longer wait times between actions',
        'Consider manual intervention at this step',
        'Review the page to identify the specific challenge',
      ],

      'rate-limit': [
        'Add delays between requests',
        'Wait before retrying the action',
        'Consider reducing the frequency of automation',
        'Check if authentication or API keys are needed',
      ],

      unknown: [
        'Use image-based automation as a fallback',
        'Add longer wait times between actions',
        'Consider manual intervention',
        'Review the page for specific anti-bot measures',
      ],
    }

    return suggestions[type] || suggestions.unknown
  }

  /**
   * Check if a specific anti-bot type is present
   *
   * @param url - Page URL
   * @param content - Page content
   * @param type - Anti-bot type to check for
   * @returns True if detected
   */
  async isPresent(url: string, content: string, type: AntiBotType): Promise<boolean> {
    const result = await this.detect(url, content)
    return result.detected && result.type === type
  }

  /**
   * Get recommended automation mode based on detection
   *
   * @param detectionResult - Bot detection result
   * @returns Recommended automation mode
   */
  getRecommendedMode(detectionResult: BotDetectionResult): 'dom' | 'image' | 'hybrid' {
    if (!detectionResult.detected) {
      return 'hybrid' // Default to hybrid
    }

    // For CAPTCHAs and challenges, recommend image-based
    const imageOnlyTypes: AntiBotType[] = [
      'cloudflare',
      'recaptcha',
      'hcaptcha',
      'turnstile',
      'funcaptcha',
      'generic-challenge',
    ]

    if (detectionResult.type && imageOnlyTypes.includes(detectionResult.type)) {
      return 'image'
    }

    return 'hybrid'
  }
}

/**
 * Create a new bot detector instance
 *
 * @returns Bot detector instance
 */
export function createBotDetector(): BotDetector {
  return new BotDetector()
}

/**
 * Quick detection from current page
 *
 * @param options - Detection options
 * @returns Bot detection result
 */
export async function detectBotMeasures(
  options?: BotDetectionOptions
): Promise<BotDetectionResult> {
  const detector = createBotDetector()
  return detector.detectFromCurrentPage(options)
}

/**
 * Check if URL contains anti-bot indicators
 *
 * @param url - URL to check
 * @returns True if anti-bot indicators found
 */
export function hasAntiBotIndicators(url: string): boolean {
  const urlLower = url.toLowerCase()

  const indicators = ['cloudflare', 'challenge', 'captcha', 'verify', 'bot-detection']

  return indicators.some(indicator => urlLower.includes(indicator))
}

/**
 * Get anti-bot type from URL
 *
 * @param url - URL to check
 * @returns Anti-bot type or undefined
 */
export function getAntiBotTypeFromUrl(url: string): AntiBotType | undefined {
  const urlLower = url.toLowerCase()

  // Check more specific patterns first
  if (urlLower.includes('turnstile')) {
    return 'turnstile'
  }
  if (urlLower.includes('recaptcha')) {
    return 'recaptcha'
  }
  if (urlLower.includes('hcaptcha')) {
    return 'hcaptcha'
  }
  if (urlLower.includes('funcaptcha') || urlLower.includes('arkose')) {
    return 'funcaptcha'
  }
  // Check cloudflare last since it's more generic
  if (
    urlLower.includes('cloudflare') ||
    urlLower.includes('cf-challenge') ||
    urlLower.includes('cdn-cgi')
  ) {
    return 'cloudflare'
  }

  return undefined
}
