/**
 * Skill References Formatter
 *
 * Formats documentation references for inclusion in SKILL.md files.
 * Creates a "Technical References" section with relevant documentation snippets,
 * code examples, and links to full documentation.
 *
 * Requirements: FR-9.5, FR-9.8
 *
 * @module lib/skill-references-formatter
 */

import type { DocReference } from '../types/context-search'

/**
 * Options for formatting references
 */
export interface FormatOptions {
  /** Maximum snippet length in characters (default: 500) */
  maxSnippetLength?: number

  /** Whether to include code examples (default: true) */
  includeCodeExamples?: boolean

  /** Whether to include source attribution (default: true) */
  includeSource?: boolean

  /** Heading level for the section (default: 2 for ##) */
  headingLevel?: number
}

/**
 * Format documentation references as markdown for SKILL.md
 *
 * @param references - Array of documentation references
 * @param options - Formatting options
 * @returns Formatted markdown string
 */
export function formatReferencesSection(
  references: DocReference[],
  options: FormatOptions = {}
): string {
  const {
    maxSnippetLength = 500,
    includeCodeExamples = true,
    includeSource = true,
    headingLevel = 2,
  } = options

  if (references.length === 0) {
    return ''
  }

  const heading = '#'.repeat(headingLevel)
  const subheading = '#'.repeat(headingLevel + 1)

  let markdown = `${heading} Technical References\n\n`
  markdown += 'The following documentation was referenced during the creation of this skill:\n\n'

  // Group references by library
  const byLibrary = groupByLibrary(references)

  for (const [library, refs] of byLibrary.entries()) {
    // Library subheading
    markdown += `${subheading} ${capitalizeLibraryName(library)}\n\n`

    for (const ref of refs) {
      // Reference title and link
      markdown += `**${ref.title}**\n`
      markdown += `[View Documentation](${ref.url})\n\n`

      // Snippet (truncated if needed)
      const snippet = truncateSnippet(ref.snippet, maxSnippetLength)
      if (snippet) {
        markdown += `> ${snippet.split('\n').join('\n> ')}\n\n`
      }

      // Code example
      if (includeCodeExamples && ref.codeExample) {
        markdown += '**Example:**\n'
        markdown += '```\n'
        markdown += ref.codeExample
        markdown += '\n```\n\n'
      }

      // Source attribution
      if (includeSource) {
        markdown += `*Source: ${formatSource(ref.source)}*\n\n`
      }

      markdown += '---\n\n'
    }
  }

  return markdown
}

/**
 * Format references as a compact list (for inline use)
 *
 * @param references - Array of documentation references
 * @returns Formatted markdown list
 */
export function formatReferencesCompact(references: DocReference[]): string {
  if (references.length === 0) {
    return ''
  }

  let markdown = '**References:**\n\n'

  for (const ref of references) {
    markdown += `- [${ref.title}](${ref.url})\n`
  }

  return markdown
}

/**
 * Format a single reference as markdown
 *
 * @param reference - Documentation reference
 * @param options - Formatting options
 * @returns Formatted markdown string
 */
export function formatSingleReference(
  reference: DocReference,
  options: FormatOptions = {}
): string {
  const { maxSnippetLength = 500, includeCodeExamples = true, includeSource = true } = options

  let markdown = `### ${reference.title}\n\n`
  markdown += `[View Documentation](${reference.url})\n\n`

  // Snippet
  const snippet = truncateSnippet(reference.snippet, maxSnippetLength)
  if (snippet) {
    markdown += `> ${snippet.split('\n').join('\n> ')}\n\n`
  }

  // Code example
  if (includeCodeExamples && reference.codeExample) {
    markdown += '**Example:**\n'
    markdown += '```\n'
    markdown += reference.codeExample
    markdown += '\n```\n\n'
  }

  // Source
  if (includeSource) {
    markdown += `*Source: ${formatSource(reference.source)}*\n\n`
  }

  return markdown
}

/**
 * Extract library names from references
 *
 * @param references - Array of documentation references
 * @returns Array of unique library names
 */
export function extractLibraryNames(references: DocReference[]): string[] {
  const libraries = new Set<string>()
  for (const ref of references) {
    libraries.add(ref.library)
  }
  return Array.from(libraries).sort()
}

/**
 * Group references by library
 *
 * @param references - Array of documentation references
 * @returns Map of library name to references
 */
export function groupByLibrary(references: DocReference[]): Map<string, DocReference[]> {
  const grouped = new Map<string, DocReference[]>()

  for (const ref of references) {
    const existing = grouped.get(ref.library) || []
    existing.push(ref)
    grouped.set(ref.library, existing)
  }

  // Sort references within each library by relevance
  for (const [library, refs] of grouped.entries()) {
    refs.sort((a, b) => b.relevance - a.relevance)
    grouped.set(library, refs)
  }

  return grouped
}

/**
 * Truncate snippet to maximum length
 * Tries to cut at sentence boundaries
 *
 * @param snippet - Original snippet
 * @param maxLength - Maximum length in characters
 * @returns Truncated snippet
 */
function truncateSnippet(snippet: string, maxLength: number): string {
  if (!snippet || snippet.length <= maxLength) {
    return snippet
  }

  // Try to cut at sentence boundary
  const truncated = snippet.slice(0, maxLength)
  const lastPeriod = truncated.lastIndexOf('.')
  const lastNewline = truncated.lastIndexOf('\n')
  const cutPoint = Math.max(lastPeriod, lastNewline)

  if (cutPoint > maxLength * 0.7) {
    return truncated.slice(0, cutPoint + 1) + '...'
  }

  return truncated + '...'
}

/**
 * Format source name for display
 *
 * @param source - Source identifier
 * @returns Formatted source name
 */
function formatSource(source: string): string {
  const sourceNames: Record<string, string> = {
    context7: 'Context7',
    github: 'GitHub',
    official: 'Official Documentation',
    manual: 'Manual Entry',
  }

  return sourceNames[source] || source
}

/**
 * Capitalize library name for display
 * Handles special cases like 'react' -> 'React', 'pandas' -> 'pandas'
 *
 * @param library - Library name
 * @returns Capitalized library name
 */
function capitalizeLibraryName(library: string): string {
  // Special cases
  const specialCases: Record<string, string> = {
    react: 'React',
    vue: 'Vue.js',
    angular: 'Angular',
    pandas: 'pandas',
    numpy: 'NumPy',
    matplotlib: 'Matplotlib',
    tensorflow: 'TensorFlow',
    pytorch: 'PyTorch',
    fastapi: 'FastAPI',
    flask: 'Flask',
    django: 'Django',
    express: 'Express',
    nextjs: 'Next.js',
    nodejs: 'Node.js',
    typescript: 'TypeScript',
    javascript: 'JavaScript',
    postgresql: 'PostgreSQL',
    mysql: 'MySQL',
    mongodb: 'MongoDB',
    redis: 'Redis',
    elasticsearch: 'Elasticsearch',
  }

  const normalized = library.toLowerCase()
  if (specialCases[normalized]) {
    return specialCases[normalized]
  }

  // Default: capitalize first letter
  return library.charAt(0).toUpperCase() + library.slice(1)
}

/**
 * Generate a summary of references for skill metadata
 *
 * @param references - Array of documentation references
 * @returns Summary string
 */
export function generateReferencesSummary(references: DocReference[]): string {
  if (references.length === 0) {
    return 'No technical references'
  }

  const libraries = extractLibraryNames(references)
  const count = references.length

  if (libraries.length === 1) {
    return `${count} reference${count > 1 ? 's' : ''} for ${capitalizeLibraryName(libraries[0])}`
  }

  if (libraries.length === 2) {
    return `${count} references for ${capitalizeLibraryName(libraries[0])} and ${capitalizeLibraryName(libraries[1])}`
  }

  return `${count} references for ${libraries.length} libraries (${libraries.slice(0, 2).map(capitalizeLibraryName).join(', ')}, and more)`
}

/**
 * Check if references section should be included
 * Based on number and quality of references
 *
 * @param references - Array of documentation references
 * @param minRelevance - Minimum relevance threshold (default: 0.5)
 * @returns true if section should be included
 */
export function shouldIncludeReferences(
  references: DocReference[],
  minRelevance: number = 0.5
): boolean {
  if (references.length === 0) {
    return false
  }

  // Filter by relevance
  const relevant = references.filter(ref => ref.relevance >= minRelevance)

  // Include if we have at least one relevant reference
  return relevant.length > 0
}

/**
 * Filter references by minimum relevance
 *
 * @param references - Array of documentation references
 * @param minRelevance - Minimum relevance threshold
 * @returns Filtered references
 */
export function filterByRelevance(
  references: DocReference[],
  minRelevance: number
): DocReference[] {
  return references.filter(ref => ref.relevance >= minRelevance)
}

/**
 * Sort references by relevance (highest first)
 *
 * @param references - Array of documentation references
 * @returns Sorted references
 */
export function sortByRelevance(references: DocReference[]): DocReference[] {
  return [...references].sort((a, b) => b.relevance - a.relevance)
}
