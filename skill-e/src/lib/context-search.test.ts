/**
 * S09: Context Search - Context7 MCP Client Tests
 *
 * Unit tests for Context7 integration including:
 * - Library search
 * - Documentation context retrieval
 * - Error handling
 * - Rate limiting
 * - Batch operations
 *
 * Requirements: FR-9.2
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Context7Client, createContext7Client, isValidContext7ApiKey } from './context-search'
import type { DetectedLibrary } from '../types/context-search'

// Mock fetch globally
global.fetch = vi.fn()

describe('Context7Client', () => {
  let client: Context7Client
  const mockApiKey = 'ctx7sk_test_key_12345'

  beforeEach(() => {
    vi.clearAllMocks()
    client = new Context7Client({ apiKey: mockApiKey })
  })

  describe('searchLibrary', () => {
    it('should search for a library successfully', async () => {
      const mockResponse = [
        {
          id: '/facebook/react',
          name: 'react',
          description: 'A JavaScript library for building user interfaces',
          version: '18.2.0',
        },
      ]

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const results = await client.searchLibrary('react', 'hooks usage')

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/libs/search'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${mockApiKey}`,
          }),
        })
      )

      expect(results).toEqual(mockResponse)
      expect(results[0].id).toBe('/facebook/react')
    })

    it('should use default query if not provided', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      })

      await client.searchLibrary('pandas')

      const callUrl = (global.fetch as any).mock.calls[0][0]
      expect(callUrl).toContain('query=documentation+for+pandas')
    })

    it('should handle empty results', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      })

      const results = await client.searchLibrary('nonexistent')
      expect(results).toEqual([])
    })

    it('should throw error on 401 unauthorized', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Unauthorized' }),
      })

      await expect(client.searchLibrary('react')).rejects.toThrow('Invalid Context7 API key')
    })

    it('should throw error on 404 not found', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Not found' }),
      })

      await expect(client.searchLibrary('unknown')).rejects.toThrow('Library not found')
    })
  })

  describe('getContext', () => {
    it('should fetch documentation context in JSON format', async () => {
      const mockContext = [
        {
          content: 'React hooks allow you to use state...',
          title: 'Hooks API Reference',
          url: 'https://react.dev/reference/react',
          relevance: 0.95,
        },
      ]

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockContext,
      })

      const results = await client.getContext('/facebook/react', 'how to use useState hook')

      expect(results).toEqual(mockContext)
      expect(results[0].title).toBe('Hooks API Reference')
    })

    it('should fetch documentation context in text format', async () => {
      const mockText = 'React hooks documentation...'

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        text: async () => mockText,
      })

      const results = await client.getContext('/facebook/react', 'hooks', 'txt')

      expect(results).toHaveLength(1)
      expect(results[0].content).toBe(mockText)
    })

    it('should handle 422 unprocessable entity', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 422,
        json: async () => ({ error: 'Library too large' }),
      })

      await expect(client.getContext('/huge/library', 'query')).rejects.toThrow('Library too large')
    })
  })

  describe('searchDocumentation', () => {
    it('should search and fetch documentation for a library', async () => {
      const library: DetectedLibrary = {
        name: 'pandas',
        type: 'python',
        confidence: 0.9,
        context: 'import pandas as pd',
        usageHint: 'dataframe filtering',
      }

      // Mock library search
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: '/pandas-dev/pandas', name: 'pandas', version: '2.0.0' }],
      })

      // Mock context retrieval
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            content: 'Use df.query() for filtering:\n```python\ndf.query("age > 30")\n```',
            title: 'DataFrame Filtering',
            url: 'https://pandas.pydata.org/docs/filtering',
            relevance: 0.92,
          },
        ],
      })

      const results = await client.searchDocumentation(library)

      expect(results).toHaveLength(1)
      expect(results[0].library).toBe('pandas')
      expect(results[0].source).toBe('context7')
      expect(results[0].codeExample).toContain('df.query')
    })

    it('should return empty array if library not found', async () => {
      const library: DetectedLibrary = {
        name: 'unknown-lib',
        type: 'javascript',
        confidence: 0.5,
        context: 'import unknown from "unknown-lib"',
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      })

      const results = await client.searchDocumentation(library)
      expect(results).toEqual([])
    })

    it('should extract code examples from documentation', async () => {
      const library: DetectedLibrary = {
        name: 'react',
        type: 'javascript',
        confidence: 0.95,
        context: 'useState hook',
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: '/facebook/react', name: 'react' }],
      })

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            content: 'Example:\n```javascript\nconst [count, setCount] = useState(0);\n```',
            title: 'useState Hook',
          },
        ],
      })

      const results = await client.searchDocumentation(library)
      expect(results[0].codeExample).toContain('useState(0)')
    })

    it('should truncate long snippets', async () => {
      const library: DetectedLibrary = {
        name: 'test',
        type: 'javascript',
        confidence: 0.8,
        context: 'test',
      }

      const longContent = 'A'.repeat(3000)

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: '/test/test', name: 'test' }],
      })

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [{ content: longContent }],
      })

      const results = await client.searchDocumentation(library)
      expect(results[0].snippet.length).toBeLessThan(2100)
      expect(results[0].snippet).toContain('...')
    })
  })

  describe('searchMultiple', () => {
    it('should search documentation for multiple libraries', async () => {
      const libraries: DetectedLibrary[] = [
        {
          name: 'react',
          type: 'javascript',
          confidence: 0.9,
          context: 'import React',
        },
        {
          name: 'pandas',
          type: 'python',
          confidence: 0.85,
          context: 'import pandas',
        },
      ]

      // Mock responses for both libraries
      ;(global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [{ id: '/facebook/react', name: 'react' }],
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [{ content: 'React docs' }],
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [{ id: '/pandas-dev/pandas', name: 'pandas' }],
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [{ content: 'Pandas docs' }],
        })

      const results = await client.searchMultiple(libraries)

      expect(results.size).toBe(2)
      expect(results.has('react')).toBe(true)
      expect(results.has('pandas')).toBe(true)
      expect(results.get('react')).toHaveLength(1)
      expect(results.get('pandas')).toHaveLength(1)
    })
  })

  describe('testConnection', () => {
    it('should return true for valid connection', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      })

      const result = await client.testConnection()
      expect(result).toBe(true)
    })
  })

  describe('rate limiting', () => {
    it('should retry on 429 rate limit', async () => {
      vi.useFakeTimers()

      ;(global.fetch as any)
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          headers: new Map([['Retry-After', '1']]),
          json: async () => ({ error: 'Rate limit exceeded' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [],
        })

      const promise = client.searchLibrary('react')

      // Fast-forward time
      await vi.advanceTimersByTimeAsync(1000)

      const result = await promise
      expect(result).toEqual([])
      expect(global.fetch).toHaveBeenCalledTimes(2)

      vi.useRealTimers()
    })
  })

  describe('timeout handling', () => {
    it('should have configurable timeout', () => {
      const timeoutClient = new Context7Client({
        apiKey: mockApiKey,
        timeout: 5000,
      })

      // Verify client was created with custom timeout
      expect(timeoutClient).toBeInstanceOf(Context7Client)
    })
  })
})

describe('createContext7Client', () => {
  it('should create a client with valid API key', () => {
    const client = createContext7Client('ctx7sk_valid_key')
    expect(client).toBeInstanceOf(Context7Client)
  })

  it('should throw error for invalid API key format', () => {
    expect(() => createContext7Client('invalid_key')).toThrow('Invalid Context7 API key format')
  })

  it('should throw error for empty API key', () => {
    expect(() => createContext7Client('')).toThrow('Invalid Context7 API key format')
  })
})

describe('isValidContext7ApiKey', () => {
  it('should validate correct API key format', () => {
    expect(isValidContext7ApiKey('ctx7sk_test_key_12345')).toBe(true)
  })

  it('should reject keys without correct prefix', () => {
    expect(isValidContext7ApiKey('sk_test_key')).toBe(false)
  })

  it('should reject empty keys', () => {
    expect(isValidContext7ApiKey('')).toBe(false)
  })

  it('should reject keys that are too short', () => {
    expect(isValidContext7ApiKey('ctx7sk_')).toBe(false)
  })

  it('should reject non-string values', () => {
    expect(isValidContext7ApiKey(null as any)).toBe(false)
    expect(isValidContext7ApiKey(undefined as any)).toBe(false)
    expect(isValidContext7ApiKey(123 as any)).toBe(false)
  })
})
