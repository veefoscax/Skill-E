/**
 * S09: Context Search - Context7 MCP Client
 * 
 * Handles integration with Context7 MCP for automatic documentation lookup.
 * Fetches relevant documentation for libraries, APIs, and tools mentioned
 * during demonstration recording.
 * 
 * Requirements: FR-9.2
 * 
 * @module lib/context-search
 */

import type { DocReference, DetectedLibrary } from '../types/context-search';

/**
 * Context7 API base URL
 */
const CONTEXT7_API_BASE = 'https://context7.com/api/v2';

/**
 * Library search result from Context7
 */
interface LibrarySearchResult {
  id: string;
  name: string;
  description?: string;
  version?: string;
  redirectUrl?: string;
}

/**
 * Documentation context result from Context7
 */
interface ContextResult {
  content: string;
  title?: string;
  url?: string;
  relevance?: number;
}

/**
 * Context7 API error response
 */
interface Context7Error {
  error: string;
  message?: string;
  redirectUrl?: string;
}

/**
 * Configuration for Context7 client
 */
export interface Context7Config {
  apiKey: string;
  timeout?: number;
  maxRetries?: number;
}

/**
 * Context7 MCP Client
 * 
 * Provides methods to search for libraries and fetch relevant documentation
 * using the Context7 API.
 */
export class Context7Client {
  private apiKey: string;
  private timeout: number;
  private maxRetries: number;

  constructor(config: Context7Config) {
    this.apiKey = config.apiKey;
    this.timeout = config.timeout || 10000; // 10 seconds default
    this.maxRetries = config.maxRetries || 3;
  }

  /**
   * Search for a library by name
   * 
   * @param libraryName - Name of the library to search for (e.g., "react", "pandas")
   * @param query - Context query to help with relevance ranking
   * @returns Array of matching libraries
   * @throws Error if API request fails
   */
  async searchLibrary(
    libraryName: string,
    query: string = ''
  ): Promise<LibrarySearchResult[]> {
    const url = new URL(`${CONTEXT7_API_BASE}/libs/search`);
    url.searchParams.set('libraryName', libraryName);
    url.searchParams.set('query', query || `documentation for ${libraryName}`);

    const response = await this.makeRequest(url.toString());

    if (!response.ok) {
      await this.handleError(response);
    }

    const results = await response.json();
    return Array.isArray(results) ? results : [];
  }

  /**
   * Get documentation context for a specific library
   * 
   * @param libraryId - Library identifier from search (e.g., "/facebook/react")
   * @param query - Your question or task for relevance ranking
   * @param format - Response format: 'json' or 'txt'
   * @returns Documentation context
   * @throws Error if API request fails
   */
  async getContext(
    libraryId: string,
    query: string,
    format: 'json' | 'txt' = 'json'
  ): Promise<ContextResult[]> {
    const url = new URL(`${CONTEXT7_API_BASE}/context`);
    url.searchParams.set('libraryId', libraryId);
    url.searchParams.set('query', query);
    url.searchParams.set('type', format);

    const response = await this.makeRequest(url.toString());

    if (!response.ok) {
      await this.handleError(response);
    }

    if (format === 'txt') {
      const text = await response.text();
      return [{ content: text }];
    }

    const results = await response.json();
    return Array.isArray(results) ? results : [];
  }

  /**
   * Search for documentation for a detected library
   * 
   * High-level method that combines library search and context retrieval.
   * 
   * @param library - Detected library information
   * @returns Array of documentation references
   */
  async searchDocumentation(library: DetectedLibrary): Promise<DocReference[]> {
    try {
      // Step 1: Search for the library
      const searchResults = await this.searchLibrary(
        library.name,
        library.usageHint || library.context
      );

      if (searchResults.length === 0) {
        console.warn(`No libraries found for: ${library.name}`);
        return [];
      }

      // Use the first (most relevant) result
      const targetLibrary = searchResults[0];

      // Step 2: Get documentation context
      const query = this.buildQuery(library);
      const contexts = await this.getContext(targetLibrary.id, query);

      // Step 3: Convert to DocReference format
      return contexts.map((ctx, index) => ({
        id: `${library.name}-${index}`,
        library: library.name,
        title: ctx.title || `${library.name} Documentation`,
        url: ctx.url || `https://context7.com/docs/${targetLibrary.id}`,
        snippet: this.truncateSnippet(ctx.content),
        codeExample: this.extractCodeExample(ctx.content),
        source: 'context7' as const,
        relevance: ctx.relevance || 0.8,
      }));
    } catch (error) {
      console.error(`Failed to fetch docs for ${library.name}:`, error);
      throw error;
    }
  }

  /**
   * Batch search documentation for multiple libraries
   * 
   * @param libraries - Array of detected libraries
   * @returns Map of library name to documentation references
   */
  async searchMultiple(
    libraries: DetectedLibrary[]
  ): Promise<Map<string, DocReference[]>> {
    const results = new Map<string, DocReference[]>();

    // Process libraries sequentially to avoid rate limits
    for (const library of libraries) {
      try {
        const docs = await this.searchDocumentation(library);
        results.set(library.name, docs);

        // Small delay to respect rate limits
        await this.delay(200);
      } catch (error) {
        console.error(`Failed to fetch docs for ${library.name}:`, error);
        results.set(library.name, []);
      }
    }

    return results;
  }

  /**
   * Test connection to Context7 API
   * 
   * @returns true if connection is successful, false otherwise
   */
  async testConnection(): Promise<boolean> {
    try {
      // Try a simple search to verify API key
      await this.searchLibrary('react', 'test connection');
      return true;
    } catch (error) {
      console.error('Context7 connection test failed:', error);
      return false;
    }
  }

  /**
   * Build a contextual query from detected library information
   */
  private buildQuery(library: DetectedLibrary): string {
    const parts: string[] = [library.name];

    if (library.usageHint) {
      parts.push(library.usageHint);
    } else if (library.context) {
      // Extract meaningful context (limit to ~50 chars)
      const contextSnippet = library.context.slice(0, 50).trim();
      parts.push(contextSnippet);
    }

    return parts.join(' ');
  }

  /**
   * Truncate snippet to ~500 tokens (roughly 2000 characters)
   */
  private truncateSnippet(content: string, maxChars: number = 2000): string {
    if (content.length <= maxChars) {
      return content;
    }

    // Try to truncate at a sentence boundary
    const truncated = content.slice(0, maxChars);
    const lastPeriod = truncated.lastIndexOf('.');
    const lastNewline = truncated.lastIndexOf('\n');
    const cutPoint = Math.max(lastPeriod, lastNewline);

    if (cutPoint > maxChars * 0.8) {
      return truncated.slice(0, cutPoint + 1) + '...';
    }

    return truncated + '...';
  }

  /**
   * Extract code example from documentation content
   */
  private extractCodeExample(content: string): string | undefined {
    // Look for code blocks (markdown format)
    const codeBlockRegex = /```[\w]*\n([\s\S]*?)```/;
    const match = content.match(codeBlockRegex);

    if (match && match[1]) {
      return match[1].trim();
    }

    // Look for indented code (4 spaces)
    const indentedCodeRegex = /\n((?:    .+\n)+)/;
    const indentedMatch = content.match(indentedCodeRegex);

    if (indentedMatch && indentedMatch[1]) {
      return indentedMatch[1].replace(/^    /gm, '').trim();
    }

    return undefined;
  }

  /**
   * Make HTTP request with timeout and retry logic
   */
  private async makeRequest(
    url: string,
    retryCount: number = 0
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle rate limiting with retry
      if (response.status === 429 && retryCount < this.maxRetries) {
        const retryAfter = response.headers.get('Retry-After');
        const delay = retryAfter ? parseInt(retryAfter) * 1000 : 1000 * Math.pow(2, retryCount);
        
        console.warn(`Rate limited, retrying after ${delay}ms...`);
        await this.delay(delay);
        
        return this.makeRequest(url, retryCount + 1);
      }

      return response;
    } catch (error) {
      clearTimeout(timeoutId);

      // Retry on network errors
      if (retryCount < this.maxRetries && error instanceof Error) {
        const delay = 1000 * Math.pow(2, retryCount);
        console.warn(`Request failed, retrying after ${delay}ms...`);
        await this.delay(delay);
        return this.makeRequest(url, retryCount + 1);
      }

      throw error;
    }
  }

  /**
   * Handle API error responses
   */
  private async handleError(response: Response): Promise<never> {
    let errorMessage = `Context7 API error (${response.status})`;

    try {
      const errorData: Context7Error = await response.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch {
      // If JSON parsing fails, use default message
    }

    // Handle specific error codes
    switch (response.status) {
      case 401:
        throw new Error('Invalid Context7 API key. Please check your configuration.');
      case 403:
        throw new Error('Access denied. Please check your API key permissions.');
      case 404:
        throw new Error('Library not found. Please verify the library name.');
      case 422:
        throw new Error('Library too large or contains no code.');
      case 429:
        throw new Error('Rate limit exceeded. Please try again later.');
      case 503:
        throw new Error('Context7 service unavailable. Please try again later.');
      default:
        throw new Error(errorMessage);
    }
  }

  /**
   * Delay helper for rate limiting and retries
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Create a Context7 client instance
 * 
 * @param apiKey - Context7 API key
 * @returns Context7Client instance
 * @throws Error if API key is invalid
 */
export function createContext7Client(apiKey: string): Context7Client {
  if (!apiKey || !apiKey.startsWith('ctx7sk')) {
    throw new Error('Invalid Context7 API key format. Key should start with "ctx7sk".');
  }

  return new Context7Client({ apiKey });
}

/**
 * Validate Context7 API key format
 * 
 * @param apiKey - API key to validate
 * @returns true if format is valid
 */
export function isValidContext7ApiKey(apiKey: string): boolean {
  return typeof apiKey === 'string' && apiKey.startsWith('ctx7sk') && apiKey.length > 10;
}
