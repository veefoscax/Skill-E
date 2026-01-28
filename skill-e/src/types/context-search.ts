/**
 * Context Search Type Definitions
 * 
 * Defines types for automatic documentation lookup and library detection.
 * Integrates with Context7 MCP and web search to fetch relevant documentation
 * for libraries, APIs, and tools mentioned during demonstration.
 * 
 * @module types/context-search
 */

/**
 * Library/API type classification
 */
export type LibraryType = 'python' | 'javascript' | 'tool' | 'database' | 'api';

/**
 * Documentation source classification
 */
export type DocSource = 'context7' | 'github' | 'official' | 'manual';

/**
 * A detected library, API, or tool from transcription or OCR
 * Represents a technology that may need documentation reference
 */
export interface DetectedLibrary {
  /** Library/API name (e.g., 'pandas', 'react', 'docker') */
  name: string;
  
  /** Type classification of the detected library */
  type: LibraryType;
  
  /** Confidence score (0-1) indicating detection certainty */
  confidence: number;
  
  /** Surrounding text where the library was detected */
  context: string;
  
  /** Optional hint about what the user was trying to do with this library */
  usageHint?: string;
}

/**
 * A documentation reference for a library or API
 * Contains relevant excerpts and code examples
 */
export interface DocReference {
  /** Unique identifier for this reference */
  id: string;
  
  /** Library/API name this reference is for */
  library: string;
  
  /** Title of the documentation section */
  title: string;
  
  /** URL to the full documentation */
  url: string;
  
  /** Relevant excerpt from the documentation (max 500 tokens) */
  snippet: string;
  
  /** Optional code example from the documentation */
  codeExample?: string;
  
  /** Source where this documentation was fetched from */
  source: DocSource;
  
  /** Relevance score (0-1) indicating how relevant this is to the usage context */
  relevance: number;
}

/**
 * Result of a documentation search for a specific library
 * Contains all fetched references and metadata
 */
export interface DocSearchResult {
  /** Library name that was searched */
  library: string;
  
  /** Array of documentation references found */
  references: DocReference[];
  
  /** The search query that was used */
  searchQuery: string;
  
  /** Timestamp when this search was performed (milliseconds since epoch) */
  timestamp: number;
}
