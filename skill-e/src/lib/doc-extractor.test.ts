/**
 * Documentation Extractor Tests
 * 
 * Tests for GitHub README fetching and documentation extraction.
 * 
 * @module lib/doc-extractor.test
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { DocExtractor, createDocExtractor } from './doc-extractor';
import type { DetectedLibrary } from '../types/context-search';

describe('DocExtractor', () => {
  let extractor: DocExtractor;

  beforeEach(() => {
    extractor = new DocExtractor();
    // Clear any mocks
    vi.clearAllMocks();
  });

  describe('createDocExtractor', () => {
    test('creates extractor instance', () => {
      const instance = createDocExtractor();
      expect(instance).toBeInstanceOf(DocExtractor);
    });

    test('accepts configuration', () => {
      const instance = createDocExtractor({
        githubToken: 'test-token',
        maxReadmeLength: 5000,
        timeout: 5000,
      });
      expect(instance).toBeInstanceOf(DocExtractor);
    });
  });

  describe('searchGitHub', () => {
    test('returns empty array for unknown library without GitHub repo', async () => {
      const library: DetectedLibrary = {
        name: 'unknown-library-xyz',
        type: 'javascript',
        confidence: 0.8,
        context: 'import unknown from "unknown-library-xyz"',
      };

      // Mock fetch to return 404
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      const results = await extractor.searchGitHub(library);
      expect(results).toEqual([]);
    });

    test('handles fetch errors gracefully', async () => {
      const library: DetectedLibrary = {
        name: 'react',
        type: 'javascript',
        confidence: 0.9,
        context: 'import React from "react"',
      };

      // Mock fetch to throw error
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const results = await extractor.searchGitHub(library);
      expect(results).toEqual([]);
    });
  });

  describe('extractRelevantSections', () => {
    test('extracts sections with relevant headers', () => {
      const content = `# My Library

## Installation

Run \`npm install my-library\`

## Usage

Here's how to use it:

\`\`\`javascript
import lib from 'my-library';
lib.doSomething();
\`\`\`

## Advanced Topics

This is not relevant for quick start.

## API Reference

- \`doSomething()\` - Does something
`;

      // Access private method through any cast for testing
      const sections = (extractor as any).extractRelevantSections(content);
      
      expect(sections.length).toBeGreaterThan(0);
      expect(sections.some((s: string) => s.includes('Installation'))).toBe(true);
      expect(sections.some((s: string) => s.includes('Usage'))).toBe(true);
    });

    test('returns first 2000 chars if no relevant sections found', () => {
      const content = 'A'.repeat(5000);
      
      const sections = (extractor as any).extractRelevantSections(content);
      
      expect(sections.length).toBe(1);
      expect(sections[0].length).toBe(2000);
    });
  });

  describe('extractFirstCodeExample', () => {
    test('extracts fenced code block', () => {
      const content = `# Example

Here's some code:

\`\`\`javascript
const x = 42;
console.log(x);
\`\`\`

More text here.
`;

      const code = (extractor as any).extractFirstCodeExample(content);
      
      expect(code).toBeDefined();
      expect(code).toContain('const x = 42');
      expect(code).toContain('console.log(x)');
    });

    test('returns undefined if no code blocks found', () => {
      const content = 'Just plain text, no code here.';
      
      const code = (extractor as any).extractFirstCodeExample(content);
      
      expect(code).toBeUndefined();
    });

    test('truncates long code examples', () => {
      const longCode = 'x'.repeat(1000);
      const content = `\`\`\`\n${longCode}\n\`\`\``;
      
      const code = (extractor as any).extractFirstCodeExample(content);
      
      expect(code).toBeDefined();
      expect(code!.length).toBeLessThanOrEqual(504); // 500 + '...'
      expect(code).toContain('...');
    });
  });

  describe('truncateContent', () => {
    test('returns content as-is if under max length', () => {
      const content = 'Short content';
      
      const truncated = (extractor as any).truncateContent(content);
      
      expect(truncated).toBe(content);
    });

    test('truncates long content at paragraph boundary', () => {
      const content = 'A'.repeat(5000) + '\n\n' + 'B'.repeat(6000);
      
      const truncated = (extractor as any).truncateContent(content);
      
      expect(truncated.length).toBeLessThan(content.length);
      expect(truncated).toContain('...');
    });

    test('truncates at sentence boundary if no paragraph break', () => {
      const content = 'A'.repeat(5000) + '. ' + 'B'.repeat(6000);
      
      const truncated = (extractor as any).truncateContent(content);
      
      expect(truncated.length).toBeLessThan(content.length);
      expect(truncated).toContain('...');
    });
  });

  describe('decodeBase64', () => {
    test('decodes base64 content using atob', () => {
      const base64 = btoa('Hello, World!');
      
      const decoded = (extractor as any).decodeBase64(base64);
      
      expect(decoded).toBe('Hello, World!');
    });

    test('handles base64 with whitespace', () => {
      const base64 = btoa('Test content');
      const withWhitespace = base64.slice(0, 4) + '\n' + base64.slice(4);
      
      const decoded = (extractor as any).decodeBase64(withWhitespace);
      
      expect(decoded).toBe('Test content');
    });

    test('returns empty string on decode error', () => {
      const invalid = 'not-valid-base64!!!';
      
      const decoded = (extractor as any).decodeBase64(invalid);
      
      expect(decoded).toBe('');
    });
  });

  describe('extractTextFromHtml', () => {
    test('removes HTML tags', () => {
      const html = '<div><p>Hello <strong>World</strong></p></div>';
      
      const text = (extractor as any).extractTextFromHtml(html);
      
      expect(text).toBe('Hello World');
      expect(text).not.toContain('<');
      expect(text).not.toContain('>');
    });

    test('removes script tags', () => {
      const html = '<div>Content</div><script>alert("bad")</script>';
      
      const text = (extractor as any).extractTextFromHtml(html);
      
      expect(text).toBe('Content');
      expect(text).not.toContain('alert');
    });

    test('removes style tags', () => {
      const html = '<div>Content</div><style>.class { color: red; }</style>';
      
      const text = (extractor as any).extractTextFromHtml(html);
      
      expect(text).toBe('Content');
      expect(text).not.toContain('color');
    });

    test('decodes HTML entities', () => {
      const html = 'Hello&nbsp;&lt;World&gt;&amp;&quot;';
      
      const text = (extractor as any).extractTextFromHtml(html);
      
      expect(text).toBe('Hello <World>&"');
    });

    test('cleans up whitespace', () => {
      const html = '<div>  Multiple   spaces  </div>';
      
      const text = (extractor as any).extractTextFromHtml(html);
      
      expect(text).toBe('Multiple spaces');
    });
  });

  describe('fetchOfficialDocs', () => {
    test('returns null for library without official docs', async () => {
      const library: DetectedLibrary = {
        name: 'unknown-library',
        type: 'javascript',
        confidence: 0.8,
        context: 'test',
      };

      const result = await extractor.fetchOfficialDocs(library);
      
      expect(result).toBeNull();
    });

    test('handles fetch errors gracefully', async () => {
      const library: DetectedLibrary = {
        name: 'react',
        type: 'javascript',
        confidence: 0.9,
        context: 'import React from "react"',
      };

      // Mock fetch to throw error
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const result = await extractor.fetchOfficialDocs(library);
      
      expect(result).toBeNull();
    });
  });

  describe('searchAll', () => {
    test('returns empty array when all sources fail', async () => {
      const library: DetectedLibrary = {
        name: 'unknown-library',
        type: 'javascript',
        confidence: 0.8,
        context: 'test',
      };

      // Mock fetch to fail
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const results = await extractor.searchAll(library);
      
      expect(results).toEqual([]);
    });
  });

  describe('searchMultiple', () => {
    test('processes multiple libraries', async () => {
      const libraries: DetectedLibrary[] = [
        {
          name: 'lib1',
          type: 'javascript',
          confidence: 0.8,
          context: 'test1',
        },
        {
          name: 'lib2',
          type: 'python',
          confidence: 0.9,
          context: 'test2',
        },
      ];

      // Mock fetch to fail (so we get empty results)
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const results = await extractor.searchMultiple(libraries);
      
      expect(results.size).toBe(2);
      expect(results.get('lib1')).toEqual([]);
      expect(results.get('lib2')).toEqual([]);
    });

    test('returns results for each library', async () => {
      const libraries: DetectedLibrary[] = [
        {
          name: 'test-lib',
          type: 'javascript',
          confidence: 0.8,
          context: 'test',
        },
      ];

      // Mock fetch to fail
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const results = await extractor.searchMultiple(libraries);
      
      expect(results.has('test-lib')).toBe(true);
    });
  });

  describe('integration scenarios', () => {
    test('handles library with known GitHub repo', async () => {
      const library: DetectedLibrary = {
        name: 'react',
        type: 'javascript',
        confidence: 0.9,
        context: 'import React from "react"',
      };

      // Mock successful README fetch
      const mockReadme = {
        name: 'README.md',
        path: 'README.md',
        html_url: 'https://github.com/facebook/react/blob/main/README.md',
        content: btoa('# React\n\n## Installation\n\n```bash\nnpm install react\n```'),
        encoding: 'base64',
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockReadme,
      });

      const results = await extractor.searchGitHub(library);
      
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].library).toBe('react');
      expect(results[0].source).toBe('github');
      expect(results[0].snippet).toContain('Installation');
    });

    test('handles rate limiting gracefully', async () => {
      const library: DetectedLibrary = {
        name: 'test-lib',
        type: 'javascript',
        confidence: 0.8,
        context: 'test',
      };

      // Mock rate limit response
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
      });

      const results = await extractor.searchGitHub(library);
      
      // Should handle gracefully and return empty array
      expect(results).toEqual([]);
    });
  });
});
