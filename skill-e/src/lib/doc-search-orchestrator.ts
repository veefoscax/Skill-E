/**
 * Documentation Search Orchestrator
 *
 * Orchestrates documentation search across multiple sources with fallback logic.
 * Tries Context7 MCP first, then falls back to web search (DevDocs, GitHub, official docs).
 * Merges and ranks results by relevance.
 *
 * Requirements: FR-9.3
 *
 * @module lib/doc-search-orchestrator
 */

import type { DocReference, DetectedLibrary } from '../types/context-search'
import { Context7Client, isValidContext7ApiKey } from './context-search'
import { DocExtractor } from './doc-extractor'
import { DocCache } from './doc-cache'

/**
 * Configuration for documentation search
 */
export interface DocSearchConfig {
  /** Context7 API key (optional) */
  context7ApiKey?: string

  /** GitHub personal access token (optional, increases rate limits) */
  githubToken?: string

  /** Maximum number of references to return per library */
  maxReferencesPerLibrary?: number

  /** Timeout for each search attempt in milliseconds */
  timeout?: number

  /** Whether to enable Context7 search */
  enableContext7?: boolean

  /** Whether to enable web search fallback */
  enableWebSearch?: boolean
}

/**
 * Search result with source information
 */
interface SearchAttempt {
  source: 'context7' | 'web'
  success: boolean
  references: DocReference[]
  error?: string
  duration: number
}

/**
 * Documentation Search Orchestrator
 *
 * Coordinates documentation search across multiple sources with intelligent fallback.
 */
export class DocSearchOrchestrator {
  private context7Client?: Context7Client
  private docExtractor: DocExtractor
  private cache: DocCache
  private config: Required<DocSearchConfig>

  constructor(config: DocSearchConfig = {}) {
    this.config = {
      context7ApiKey: config.context7ApiKey || '',
      githubToken: config.githubToken || '',
      maxReferencesPerLibrary: config.maxReferencesPerLibrary || 3,
      timeout: config.timeout || 10000,
      enableContext7: config.enableContext7 ?? true,
      enableWebSearch: config.enableWebSearch ?? true,
    }

    // Initialize Context7 client if API key is valid
    if (this.config.context7ApiKey && isValidContext7ApiKey(this.config.context7ApiKey)) {
      this.context7Client = new Context7Client({
        apiKey: this.config.context7ApiKey,
        timeout: this.config.timeout,
      })
    }

    // Initialize web search extractor
    this.docExtractor = new DocExtractor({
      githubToken: this.config.githubToken,
      timeout: this.config.timeout,
    })

    // Initialize cache with 24-hour TTL
    this.cache = new DocCache(24 * 60 * 60 * 1000)
  }

  /**
   * Search for documentation with automatic fallback
   *
   * @param library - Detected library information
   * @returns Array of documentation references
   */
  async search(library: DetectedLibrary): Promise<DocReference[]> {
    // Check cache first
    const cached = this.cache.get(library.name, library.usageHint)
    if (cached) {
      console.log(`✓ Cache hit for ${library.name}`)
      return this.limitReferences(cached)
    }

    const attempts: SearchAttempt[] = []

    // Attempt 1: Try Context7 if enabled and available
    if (this.config.enableContext7 && this.context7Client) {
      const context7Result = await this.tryContext7(library)
      attempts.push(context7Result)

      // If Context7 succeeded and returned results, cache and return
      if (context7Result.success && context7Result.references.length > 0) {
        console.log(
          `✓ Context7 found ${context7Result.references.length} references for ${library.name}`
        )
        this.cache.set(library.name, context7Result.references, library.usageHint)
        return this.limitReferences(context7Result.references)
      }
    }

    // Attempt 2: Fall back to web search
    if (this.config.enableWebSearch) {
      const webResult = await this.tryWebSearch(library)
      attempts.push(webResult)

      if (webResult.success && webResult.references.length > 0) {
        console.log(
          `✓ Web search found ${webResult.references.length} references for ${library.name}`
        )
        this.cache.set(library.name, webResult.references, library.usageHint)
        return this.limitReferences(webResult.references)
      }
    }

    // No results from any source
    console.warn(`✗ No documentation found for ${library.name} from any source`)
    this.logSearchAttempts(library.name, attempts)
    return []
  }

  /**
   * Search for documentation for multiple libraries
   *
   * @param libraries - Array of detected libraries
   * @returns Map of library name to documentation references
   */
  async searchMultiple(libraries: DetectedLibrary[]): Promise<Map<string, DocReference[]>> {
    const results = new Map<string, DocReference[]>()

    // Process libraries sequentially to avoid overwhelming APIs
    for (const library of libraries) {
      try {
        const docs = await this.search(library)
        results.set(library.name, docs)

        // Small delay between libraries to respect rate limits
        await this.delay(300)
      } catch (error) {
        console.error(`Failed to search docs for ${library.name}:`, error)
        results.set(library.name, [])
      }
    }

    return results
  }

  /**
   * Try searching with Context7
   */
  private async tryContext7(library: DetectedLibrary): Promise<SearchAttempt> {
    const startTime = Date.now()

    try {
      if (!this.context7Client) {
        return {
          source: 'context7',
          success: false,
          references: [],
          error: 'Context7 client not initialized',
          duration: 0,
        }
      }

      const references = await this.context7Client.searchDocumentation(library)
      const duration = Date.now() - startTime

      return {
        source: 'context7',
        success: true,
        references,
        duration,
      }
    } catch (error) {
      const duration = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      return {
        source: 'context7',
        success: false,
        references: [],
        error: errorMessage,
        duration,
      }
    }
  }

  /**
   * Try searching with web sources (DevDocs, GitHub, official docs)
   */
  private async tryWebSearch(library: DetectedLibrary): Promise<SearchAttempt> {
    const startTime = Date.now()

    try {
      const references = await this.docExtractor.searchAll(library)
      const duration = Date.now() - startTime

      return {
        source: 'web',
        success: true,
        references,
        duration,
      }
    } catch (error) {
      const duration = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      return {
        source: 'web',
        success: false,
        references: [],
        error: errorMessage,
        duration,
      }
    }
  }

  /**
   * Merge results from multiple sources and rank by relevance
   *
   * @param results - Array of search attempts
   * @returns Merged and ranked references
   */
  private mergeAndRank(results: SearchAttempt[]): DocReference[] {
    // Collect all references
    const allReferences: DocReference[] = []
    for (const result of results) {
      if (result.success) {
        allReferences.push(...result.references)
      }
    }

    // Remove duplicates based on URL
    const uniqueRefs = new Map<string, DocReference>()
    for (const ref of allReferences) {
      const existing = uniqueRefs.get(ref.url)
      if (!existing || ref.relevance > existing.relevance) {
        uniqueRefs.set(ref.url, ref)
      }
    }

    // Sort by relevance (highest first)
    const sorted = Array.from(uniqueRefs.values()).sort((a, b) => b.relevance - a.relevance)

    return sorted
  }

  /**
   * Limit number of references per library
   */
  private limitReferences(references: DocReference[]): DocReference[] {
    return references.slice(0, this.config.maxReferencesPerLibrary)
  }

  /**
   * Log search attempts for debugging
   */
  private logSearchAttempts(libraryName: string, attempts: SearchAttempt[]): void {
    console.log(`\nSearch attempts for ${libraryName}:`)
    for (const attempt of attempts) {
      const status = attempt.success ? '✓' : '✗'
      const refs = attempt.references.length
      const time = attempt.duration.toFixed(0)
      const error = attempt.error ? ` (${attempt.error})` : ''
      console.log(`  ${status} ${attempt.source}: ${refs} refs in ${time}ms${error}`)
    }
  }

  /**
   * Test connection to all available sources
   *
   * @returns Object with availability status for each source
   */
  async testConnections(): Promise<{
    context7: boolean
    webSearch: boolean
  }> {
    const results = {
      context7: false,
      webSearch: true, // Web search is always available
    }

    // Test Context7 if available
    if (this.context7Client) {
      try {
        results.context7 = await this.context7Client.testConnection()
      } catch (error) {
        console.error('Context7 connection test failed:', error)
        results.context7 = false
      }
    }

    return results
  }

  /**
   * Update Context7 API key
   *
   * @param apiKey - New Context7 API key
   */
  updateContext7ApiKey(apiKey: string): void {
    if (apiKey && isValidContext7ApiKey(apiKey)) {
      this.context7Client = new Context7Client({
        apiKey,
        timeout: this.config.timeout,
      })
      this.config.context7ApiKey = apiKey
      console.log('Context7 API key updated')
    } else {
      this.context7Client = undefined
      this.config.context7ApiKey = ''
      console.warn('Invalid Context7 API key, Context7 disabled')
    }
  }

  /**
   * Update GitHub token
   *
   * @param token - New GitHub personal access token
   */
  updateGitHubToken(token: string): void {
    this.config.githubToken = token
    this.docExtractor = new DocExtractor({
      githubToken: token,
      timeout: this.config.timeout,
    })
    console.log('GitHub token updated')
  }

  /**
   * Get current configuration
   */
  getConfig(): Readonly<Required<DocSearchConfig>> {
    return { ...this.config }
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return this.cache.getStats()
  }

  /**
   * Clear documentation cache
   */
  clearCache(): void {
    this.cache.clear()
  }

  /**
   * Evict expired cache entries
   */
  evictExpiredCache(): number {
    return this.cache.evictExpired()
  }

  /**
   * Delay helper for rate limiting
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

/**
 * Create a documentation search orchestrator
 *
 * @param config - Configuration options
 * @returns DocSearchOrchestrator instance
 */
export function createDocSearchOrchestrator(config?: DocSearchConfig): DocSearchOrchestrator {
  return new DocSearchOrchestrator(config)
}

/**
 * Singleton instance for global use
 */
let globalOrchestrator: DocSearchOrchestrator | null = null

/**
 * Get or create the global orchestrator instance
 *
 * @param config - Configuration options (only used on first call)
 * @returns Global DocSearchOrchestrator instance
 */
export function getGlobalOrchestrator(config?: DocSearchConfig): DocSearchOrchestrator {
  if (!globalOrchestrator) {
    globalOrchestrator = new DocSearchOrchestrator(config)
  }
  return globalOrchestrator
}

/**
 * Reset the global orchestrator (useful for testing)
 */
export function resetGlobalOrchestrator(): void {
  globalOrchestrator = null
}
