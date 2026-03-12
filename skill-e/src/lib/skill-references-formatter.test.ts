/**
 * Tests for Skill References Formatter
 *
 * @module lib/skill-references-formatter.test
 */

import { describe, it, expect } from 'vitest'
import {
  formatReferencesSection,
  formatReferencesCompact,
  formatSingleReference,
  extractLibraryNames,
  groupByLibrary,
  generateReferencesSummary,
  shouldIncludeReferences,
  filterByRelevance,
  sortByRelevance,
} from './skill-references-formatter'
import type { DocReference } from '../types/context-search'

describe('SkillReferencesFormatter', () => {
  // Mock references for testing
  const mockReferences: DocReference[] = [
    {
      id: 'ref-1',
      library: 'react',
      title: 'React Hooks Documentation',
      url: 'https://react.dev/reference/react',
      snippet:
        'Hooks are functions that let you use state and other React features without writing a class.',
      codeExample: 'const [count, setCount] = useState(0);',
      source: 'official',
      relevance: 0.95,
    },
    {
      id: 'ref-2',
      library: 'react',
      title: 'React GitHub README',
      url: 'https://github.com/facebook/react',
      snippet: 'React is a JavaScript library for building user interfaces.',
      source: 'github',
      relevance: 0.85,
    },
    {
      id: 'ref-3',
      library: 'pandas',
      title: 'pandas DataFrame Documentation',
      url: 'https://pandas.pydata.org/docs/reference/frame.html',
      snippet:
        'DataFrame is a 2-dimensional labeled data structure with columns of potentially different types.',
      codeExample: 'df = pd.DataFrame(data)',
      source: 'official',
      relevance: 0.9,
    },
  ]

  describe('formatReferencesSection', () => {
    it('should format references as markdown section', () => {
      const markdown = formatReferencesSection(mockReferences)

      expect(markdown).toContain('## Technical References')
      expect(markdown).toContain('### React')
      expect(markdown).toContain('### pandas')
      expect(markdown).toContain('React Hooks Documentation')
      expect(markdown).toContain('pandas DataFrame Documentation')
    })

    it('should include code examples by default', () => {
      const markdown = formatReferencesSection(mockReferences)

      expect(markdown).toContain('```')
      expect(markdown).toContain('const [count, setCount] = useState(0);')
      expect(markdown).toContain('df = pd.DataFrame(data)')
    })

    it('should exclude code examples when disabled', () => {
      const markdown = formatReferencesSection(mockReferences, {
        includeCodeExamples: false,
      })

      expect(markdown).not.toContain('```')
      expect(markdown).not.toContain('const [count, setCount] = useState(0);')
    })

    it('should include source attribution by default', () => {
      const markdown = formatReferencesSection(mockReferences)

      expect(markdown).toContain('*Source: Official Documentation*')
      expect(markdown).toContain('*Source: GitHub*')
    })

    it('should exclude source when disabled', () => {
      const markdown = formatReferencesSection(mockReferences, {
        includeSource: false,
      })

      expect(markdown).not.toContain('*Source:')
    })

    it('should return empty string for empty references', () => {
      const markdown = formatReferencesSection([])

      expect(markdown).toBe('')
    })

    it('should respect custom heading level', () => {
      const markdown = formatReferencesSection(mockReferences, {
        headingLevel: 3,
      })

      expect(markdown).toContain('### Technical References')
      expect(markdown).toContain('#### React')
    })

    it('should truncate long snippets', () => {
      const longRef: DocReference = {
        ...mockReferences[0],
        snippet: 'A'.repeat(1000),
      }

      const markdown = formatReferencesSection([longRef], {
        maxSnippetLength: 100,
      })

      expect(markdown).toContain('...')
      expect(markdown.length).toBeLessThan(2000)
    })
  })

  describe('formatReferencesCompact', () => {
    it('should format references as compact list', () => {
      const markdown = formatReferencesCompact(mockReferences)

      expect(markdown).toContain('**References:**')
      expect(markdown).toContain('- [React Hooks Documentation](https://react.dev/reference/react)')
      expect(markdown).toContain('- [pandas DataFrame Documentation]')
    })

    it('should return empty string for empty references', () => {
      const markdown = formatReferencesCompact([])

      expect(markdown).toBe('')
    })
  })

  describe('formatSingleReference', () => {
    it('should format a single reference', () => {
      const markdown = formatSingleReference(mockReferences[0])

      expect(markdown).toContain('### React Hooks Documentation')
      expect(markdown).toContain('[View Documentation](https://react.dev/reference/react)')
      expect(markdown).toContain('Hooks are functions')
      expect(markdown).toContain('const [count, setCount] = useState(0);')
    })

    it('should handle reference without code example', () => {
      const markdown = formatSingleReference(mockReferences[1])

      expect(markdown).toContain('React GitHub README')
      expect(markdown).not.toContain('```')
    })
  })

  describe('extractLibraryNames', () => {
    it('should extract unique library names', () => {
      const libraries = extractLibraryNames(mockReferences)

      expect(libraries).toEqual(['pandas', 'react'])
    })

    it('should return empty array for empty references', () => {
      const libraries = extractLibraryNames([])

      expect(libraries).toEqual([])
    })

    it('should handle duplicate libraries', () => {
      const refs = [mockReferences[0], mockReferences[1], mockReferences[0]]

      const libraries = extractLibraryNames(refs)

      expect(libraries).toEqual(['react'])
    })
  })

  describe('groupByLibrary', () => {
    it('should group references by library', () => {
      const grouped = groupByLibrary(mockReferences)

      expect(grouped.size).toBe(2)
      expect(grouped.get('react')).toHaveLength(2)
      expect(grouped.get('pandas')).toHaveLength(1)
    })

    it('should sort references by relevance within groups', () => {
      const grouped = groupByLibrary(mockReferences)
      const reactRefs = grouped.get('react')!

      expect(reactRefs[0].relevance).toBeGreaterThan(reactRefs[1].relevance)
    })

    it('should return empty map for empty references', () => {
      const grouped = groupByLibrary([])

      expect(grouped.size).toBe(0)
    })
  })

  describe('generateReferencesSummary', () => {
    it('should generate summary for single library', () => {
      const summary = generateReferencesSummary([mockReferences[0]])

      expect(summary).toBe('1 reference for React')
    })

    it('should generate summary for multiple references of same library', () => {
      const summary = generateReferencesSummary([mockReferences[0], mockReferences[1]])

      expect(summary).toBe('2 references for React')
    })

    it('should generate summary for two libraries', () => {
      const summary = generateReferencesSummary(mockReferences)

      expect(summary).toContain('3 references')
      expect(summary).toContain('React')
      expect(summary).toContain('pandas')
    })

    it('should generate summary for many libraries', () => {
      const manyRefs = [
        ...mockReferences,
        { ...mockReferences[0], id: 'ref-4', library: 'vue' },
        { ...mockReferences[0], id: 'ref-5', library: 'angular' },
      ]

      const summary = generateReferencesSummary(manyRefs)

      expect(summary).toContain('5 references')
      expect(summary).toContain('4 libraries')
      expect(summary).toContain('and more')
    })

    it('should return message for empty references', () => {
      const summary = generateReferencesSummary([])

      expect(summary).toBe('No technical references')
    })
  })

  describe('shouldIncludeReferences', () => {
    it('should return true for relevant references', () => {
      const result = shouldIncludeReferences(mockReferences)

      expect(result).toBe(true)
    })

    it('should return false for empty references', () => {
      const result = shouldIncludeReferences([])

      expect(result).toBe(false)
    })

    it('should filter by relevance threshold', () => {
      const lowRelevanceRef: DocReference = {
        ...mockReferences[0],
        relevance: 0.3,
      }

      const result = shouldIncludeReferences([lowRelevanceRef], 0.5)

      expect(result).toBe(false)
    })

    it('should include if at least one reference meets threshold', () => {
      const mixedRefs = [
        { ...mockReferences[0], relevance: 0.9 },
        { ...mockReferences[1], relevance: 0.3 },
      ]

      const result = shouldIncludeReferences(mixedRefs, 0.5)

      expect(result).toBe(true)
    })
  })

  describe('filterByRelevance', () => {
    it('should filter references by minimum relevance', () => {
      const filtered = filterByRelevance(mockReferences, 0.9)

      expect(filtered).toHaveLength(2)
      expect(filtered.every(ref => ref.relevance >= 0.9)).toBe(true)
    })

    it('should return empty array if no references meet threshold', () => {
      const filtered = filterByRelevance(mockReferences, 0.99)

      expect(filtered).toEqual([])
    })

    it('should return all references if threshold is 0', () => {
      const filtered = filterByRelevance(mockReferences, 0)

      expect(filtered).toHaveLength(3)
    })
  })

  describe('sortByRelevance', () => {
    it('should sort references by relevance (highest first)', () => {
      const unsorted = [mockReferences[1], mockReferences[2], mockReferences[0]]
      const sorted = sortByRelevance(unsorted)

      expect(sorted[0].relevance).toBe(0.95)
      expect(sorted[1].relevance).toBe(0.9)
      expect(sorted[2].relevance).toBe(0.85)
    })

    it('should not modify original array', () => {
      const original = [...mockReferences]
      sortByRelevance(original)

      expect(original).toEqual(mockReferences)
    })

    it('should handle empty array', () => {
      const sorted = sortByRelevance([])

      expect(sorted).toEqual([])
    })
  })
})
