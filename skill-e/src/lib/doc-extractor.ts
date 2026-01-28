/**
 * Documentation Extractor
 * 
 * Fetches and extracts documentation from various sources including GitHub READMEs,
 * official documentation sites, and other web sources. Used as a fallback when
 * Context7 MCP is unavailable.
 * 
 * Requirements: FR-9.3, FR-9.4
 * 
 * @module lib/doc-extractor
 */

import type { DocReference, DetectedLibrary } from '../types/context-search';
import { getLibraryMetadata } from './library-database';

/**
 * GitHub API base URL
 */
const GITHUB_API_BASE = 'https://api.github.com';

/**
 * DevDocs API base URL
 */
const DEVDOCS_API_BASE = 'https://devdocs.io';

/**
 * GitHub README response
 */
interface GitHubReadmeResponse {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  git_url: string;
  download_url: string;
  type: string;
  content: string;
  encoding: string;
}

/**
 * GitHub repository search result
 */
interface GitHubRepoSearchResult {
  total_count: number;
  incomplete_results: boolean;
  items: Array<{
    id: number;
    name: string;
    full_name: string;
    description: string;
    html_url: string;
    stargazers_count: number;
    language: string;
  }>;
}

/**
 * Configuration for documentation extractor
 */
export interface DocExtractorConfig {
  /** GitHub personal access token (optional, increases rate limits) */
  githubToken?: string;
  
  /** Maximum number of characters to extract from README */
  maxReadmeLength?: number;
  
  /** Request timeout in milliseconds */
  timeout?: number;
}

/**
 * Documentation Extractor
 * 
 * Fetches documentation from GitHub and other web sources.
 * Provides fallback when Context7 is unavailable.
 */
export class DocExtractor {
  private githubToken?: string;
  private maxReadmeLength: number;
  private timeout: number;

  constructor(config: DocExtractorConfig = {}) {
    this.githubToken = config.githubToken;
    this.maxReadmeLength = config.maxReadmeLength || 10000; // ~2500 tokens
    this.timeout = config.timeout || 10000; // 10 seconds
  }

  /**
   * Search GitHub for a library's README
   * 
   * @param library - Detected library information
   * @returns Array of documentation references from GitHub
   */
  async searchGitHub(library: DetectedLibrary): Promise<DocReference[]> {
    try {
      // First, try to get README from known GitHub URL
      const metadata = getLibraryMetadata(library.name);
      if (metadata?.githubRepo) {
        const readme = await this.fetchReadmeFromRepo(metadata.githubRepo);
        if (readme) {
          return [readme];
        }
      }

      // Fallback: Search GitHub for the library
      const searchResults = await this.searchGitHubRepos(library.name);
      if (searchResults.length === 0) {
        console.warn(`No GitHub repositories found for: ${library.name}`);
        return [];
      }

      // Get README from the most popular repository
      const topRepo = searchResults[0];
      const readme = await this.fetchReadmeFromRepo(topRepo.html_url);
      
      return readme ? [readme] : [];
    } catch (error) {
      console.error(`Failed to search GitHub for ${library.name}:`, error);
      return [];
    }
  }

  /**
   * Search GitHub repositories by name
   * 
   * @param libraryName - Name of the library to search for
   * @returns Array of repository information, sorted by stars
   */
  private async searchGitHubRepos(libraryName: string): Promise<Array<{
    name: string;
    full_name: string;
    description: string;
    html_url: string;
    stars: number;
  }>> {
    const url = new URL(`${GITHUB_API_BASE}/search/repositories`);
    url.searchParams.set('q', `${libraryName} in:name`);
    url.searchParams.set('sort', 'stars');
    url.searchParams.set('order', 'desc');
    url.searchParams.set('per_page', '5');

    const response = await this.makeRequest(url.toString());
    
    if (!response.ok) {
      throw new Error(`GitHub search failed: ${response.status} ${response.statusText}`);
    }

    const data: GitHubRepoSearchResult = await response.json();
    
    return data.items.map(item => ({
      name: item.name,
      full_name: item.full_name,
      description: item.description,
      html_url: item.html_url,
      stars: item.stargazers_count,
    }));
  }

  /**
   * Fetch README from a GitHub repository
   * 
   * @param repoUrl - GitHub repository URL (e.g., "https://github.com/pandas-dev/pandas")
   * @returns Documentation reference with README content, or null if not found
   */
  private async fetchReadmeFromRepo(repoUrl: string): Promise<DocReference | null> {
    try {
      // Extract owner and repo from URL
      const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
      if (!match) {
        console.error(`Invalid GitHub URL: ${repoUrl}`);
        return null;
      }

      const [, owner, repo] = match;
      const cleanRepo = repo.replace(/\.git$/, ''); // Remove .git suffix if present

      // Fetch README using GitHub API
      const apiUrl = `${GITHUB_API_BASE}/repos/${owner}/${cleanRepo}/readme`;
      const response = await this.makeRequest(apiUrl);

      if (!response.ok) {
        if (response.status === 404) {
          console.warn(`README not found for ${owner}/${cleanRepo}`);
          return null;
        }
        throw new Error(`Failed to fetch README: ${response.status} ${response.statusText}`);
      }

      const data: GitHubReadmeResponse = await response.json();

      // Decode base64 content
      const content = this.decodeBase64(data.content);

      // Extract relevant sections
      const sections = this.extractRelevantSections(content);

      // Create DocReference
      return {
        id: `github-${owner}-${cleanRepo}`,
        library: cleanRepo,
        title: `${cleanRepo} - GitHub README`,
        url: data.html_url,
        snippet: this.truncateContent(sections.join('\n\n')),
        codeExample: this.extractFirstCodeExample(content),
        source: 'github',
        relevance: 0.8,
      };
    } catch (error) {
      console.error(`Failed to fetch README from ${repoUrl}:`, error);
      return null;
    }
  }

  /**
   * Extract relevant sections from README content
   * Focuses on getting started, usage, examples, and API sections
   * 
   * @param content - Full README content
   * @returns Array of relevant section texts
   */
  private extractRelevantSections(content: string): string[] {
    const sections: string[] = [];

    // Section headers to look for (case-insensitive)
    const relevantHeaders = [
      'getting started',
      'quick start',
      'quickstart',
      'installation',
      'usage',
      'examples',
      'basic usage',
      'api',
      'documentation',
      'introduction',
    ];

    // Split content into lines
    const lines = content.split('\n');
    let inRelevantSection = false;
    let sectionContent: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check if this is a header line (markdown)
      const headerMatch = line.match(/^(#{1,3})\s+(.+)$/);
      
      if (headerMatch) {
        // Save previous section if it was relevant
        if (inRelevantSection && sectionContent.length > 0) {
          sections.push(sectionContent.join('\n'));
        }

        // Check if new section is relevant
        const headerText = headerMatch[2].toLowerCase();
        inRelevantSection = relevantHeaders.some(h => headerText.includes(h));
        
        if (inRelevantSection) {
          sectionContent = [line]; // Start with header
        } else {
          sectionContent = [];
        }
      } else if (inRelevantSection) {
        // Add line to current section
        sectionContent.push(line);

        // Stop if we've collected enough content (prevent huge sections)
        if (sectionContent.join('\n').length > 3000) {
          sections.push(sectionContent.join('\n'));
          inRelevantSection = false;
          sectionContent = [];
        }
      }
    }

    // Add last section if relevant
    if (inRelevantSection && sectionContent.length > 0) {
      sections.push(sectionContent.join('\n'));
    }

    // If no relevant sections found, return the first ~2000 characters
    if (sections.length === 0) {
      sections.push(content.slice(0, 2000));
    }

    return sections;
  }

  /**
   * Extract the first code example from markdown content
   * 
   * @param content - Markdown content
   * @returns First code block found, or undefined
   */
  private extractFirstCodeExample(content: string): string | undefined {
    // Look for fenced code blocks
    const codeBlockRegex = /```[\w]*\n([\s\S]*?)```/;
    const match = content.match(codeBlockRegex);

    if (match && match[1]) {
      const code = match[1].trim();
      // Limit code example length
      return code.length > 500 ? code.slice(0, 500) + '\n...' : code;
    }

    return undefined;
  }

  /**
   * Truncate content to maximum length
   * Tries to cut at paragraph or sentence boundaries
   * 
   * @param content - Content to truncate
   * @returns Truncated content
   */
  private truncateContent(content: string): string {
    if (content.length <= this.maxReadmeLength) {
      return content;
    }

    // Try to cut at paragraph boundary
    const truncated = content.slice(0, this.maxReadmeLength);
    const lastParagraph = truncated.lastIndexOf('\n\n');
    const lastSentence = truncated.lastIndexOf('. ');
    const lastNewline = truncated.lastIndexOf('\n');

    // Use the best cut point
    const cutPoint = Math.max(lastParagraph, lastSentence, lastNewline);

    if (cutPoint > this.maxReadmeLength * 0.7) {
      return truncated.slice(0, cutPoint) + '\n\n...';
    }

    return truncated + '...';
  }

  /**
   * Decode base64 content from GitHub API
   * 
   * @param base64Content - Base64 encoded string
   * @returns Decoded string
   */
  private decodeBase64(base64Content: string): string {
    try {
      // Remove whitespace and newlines
      const cleaned = base64Content.replace(/\s/g, '');
      
      // Decode using atob (browser)
      if (typeof atob !== 'undefined') {
        return atob(cleaned);
      }
      
      throw new Error('No base64 decoder available');
    } catch (error) {
      console.error('Failed to decode base64 content:', error);
      return '';
    }
  }

  /**
   * Make HTTP request with timeout and authentication
   * 
   * @param url - URL to fetch
   * @returns Response object
   */
  private async makeRequest(url: string): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const headers: HeadersInit = {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Skill-E-Documentation-Fetcher',
      };

      // Add authentication if token is available
      if (this.githubToken) {
        headers['Authorization'] = `Bearer ${this.githubToken}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Fetch documentation from official docs URL
   * 
   * @param library - Detected library information
   * @returns Documentation reference, or null if fetch fails
   */
  async fetchOfficialDocs(library: DetectedLibrary): Promise<DocReference | null> {
    const metadata = getLibraryMetadata(library.name);
    if (!metadata?.officialDocs) {
      return null;
    }

    try {
      const response = await this.makeRequest(metadata.officialDocs);
      
      if (!response.ok) {
        console.warn(`Failed to fetch official docs for ${library.name}: ${response.status}`);
        return null;
      }

      const html = await response.text();
      
      // Extract text content from HTML (basic extraction)
      const textContent = this.extractTextFromHtml(html);
      
      return {
        id: `official-${library.name}`,
        library: library.name,
        title: `${metadata.displayName} - Official Documentation`,
        url: metadata.officialDocs,
        snippet: this.truncateContent(textContent),
        codeExample: this.extractFirstCodeExample(textContent),
        source: 'official',
        relevance: 0.9,
      };
    } catch (error) {
      console.error(`Failed to fetch official docs for ${library.name}:`, error);
      return null;
    }
  }

  /**
   * Extract text content from HTML
   * Basic implementation - removes tags and scripts
   * 
   * @param html - HTML content
   * @returns Plain text content
   */
  private extractTextFromHtml(html: string): string {
    // Remove script and style tags
    let text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
    
    // Remove HTML tags
    text = text.replace(/<[^>]+>/g, ' ');
    
    // Decode HTML entities
    text = text.replace(/&nbsp;/g, ' ');
    text = text.replace(/&lt;/g, '<');
    text = text.replace(/&gt;/g, '>');
    text = text.replace(/&amp;/g, '&');
    text = text.replace(/&quot;/g, '"');
    
    // Clean up whitespace
    text = text.replace(/\s+/g, ' ').trim();
    
    return text;
  }

  /**
   * Map library names to DevDocs slugs
   * DevDocs uses specific slugs for documentation
   */
  private getDevDocsSlug(libraryName: string): string | null {
    const slugMap: Record<string, string> = {
      // Python
      'pandas': 'pandas~2',
      'numpy': 'numpy~1.24',
      'matplotlib': 'matplotlib~3.7',
      'django': 'django~4.2',
      'flask': 'flask~2.3',
      'pytest': 'pytest',
      'requests': 'python~3.12', // Part of Python docs
      
      // JavaScript/TypeScript
      'react': 'react',
      'vue': 'vue~3',
      'angular': 'angular',
      'express': 'express',
      'lodash': 'lodash~4',
      'moment': 'moment',
      'jest': 'jest',
      'cypress': 'cypress',
      
      // Tools & Databases
      'git': 'git',
      'docker': 'docker',
      'postgresql': 'postgresql~15',
      'redis': 'redis',
      'nginx': 'nginx',
      'webpack': 'webpack~5',
      
      // Add more as needed
    };

    return slugMap[libraryName.toLowerCase()] || null;
  }

  /**
   * Search DevDocs for library documentation
   * 
   * @param library - Detected library information
   * @returns Documentation reference from DevDocs, or null if not found
   */
  async searchDevDocs(library: DetectedLibrary): Promise<DocReference | null> {
    try {
      const slug = this.getDevDocsSlug(library.name);
      if (!slug) {
        console.log(`No DevDocs slug found for: ${library.name}`);
        return null;
      }

      // DevDocs search endpoint
      const searchUrl = `${DEVDOCS_API_BASE}/docs/${slug}/index.json`;
      const response = await this.makeRequest(searchUrl);

      if (!response.ok) {
        console.warn(`DevDocs search failed for ${library.name}: ${response.status}`);
        return null;
      }

      const index = await response.json();
      
      // DevDocs index contains entries with paths
      // Find the most relevant entry (usually the first one or "getting started")
      const entries = index.entries || [];
      if (entries.length === 0) {
        return null;
      }

      // Look for getting started or introduction entries
      let targetEntry = entries.find((e: any) => 
        e.name.toLowerCase().includes('getting started') ||
        e.name.toLowerCase().includes('introduction') ||
        e.name.toLowerCase().includes('quickstart')
      );

      // Fallback to first entry
      if (!targetEntry) {
        targetEntry = entries[0];
      }

      // Fetch the actual documentation content
      const docUrl = `${DEVDOCS_API_BASE}/docs/${slug}/${targetEntry.path}.html`;
      const docResponse = await this.makeRequest(docUrl);

      if (!docResponse.ok) {
        return null;
      }

      const html = await docResponse.text();
      const textContent = this.extractTextFromHtml(html);

      return {
        id: `devdocs-${library.name}`,
        library: library.name,
        title: `${library.name} - ${targetEntry.name}`,
        url: `https://devdocs.io/${slug}/${targetEntry.path}`,
        snippet: this.truncateContent(textContent),
        codeExample: this.extractFirstCodeExample(textContent),
        source: 'official',
        relevance: 0.85,
      };
    } catch (error) {
      console.error(`Failed to search DevDocs for ${library.name}:`, error);
      return null;
    }
  }

  /**
   * Search for documentation from multiple sources
   * Tries GitHub first, then official docs
   * 
   * @param library - Detected library information
   * @returns Array of documentation references
   */
  async searchAll(library: DetectedLibrary): Promise<DocReference[]> {
    const results: DocReference[] = [];

    // Try DevDocs first (fast and reliable)
    const devDocs = await this.searchDevDocs(library);
    if (devDocs) {
      results.push(devDocs);
    }

    // Try GitHub (usually has better examples)
    const githubDocs = await this.searchGitHub(library);
    results.push(...githubDocs);

    // Try official docs if we don't have enough results
    if (results.length === 0) {
      const officialDoc = await this.fetchOfficialDocs(library);
      if (officialDoc) {
        results.push(officialDoc);
      }
    }

    return results;
  }

  /**
   * Batch search documentation for multiple libraries
   * 
   * @param libraries - Array of detected libraries
   * @returns Map of library name to documentation references
   */
  async searchMultiple(libraries: DetectedLibrary[]): Promise<Map<string, DocReference[]>> {
    const results = new Map<string, DocReference[]>();

    // Process libraries sequentially to avoid rate limits
    for (const library of libraries) {
      try {
        const docs = await this.searchAll(library);
        results.set(library.name, docs);

        // Small delay to respect rate limits
        await this.delay(500);
      } catch (error) {
        console.error(`Failed to fetch docs for ${library.name}:`, error);
        results.set(library.name, []);
      }
    }

    return results;
  }

  /**
   * Delay helper for rate limiting
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Create a documentation extractor instance
 * 
 * @param config - Optional configuration
 * @returns DocExtractor instance
 */
export function createDocExtractor(config?: DocExtractorConfig): DocExtractor {
  return new DocExtractor(config);
}
