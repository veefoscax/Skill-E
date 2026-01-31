/**
 * Tests for Documentation Search Orchestrator
 * 
 * @module lib/doc-search-orchestrator.test
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { DocSearchOrchestrator, createDocSearchOrchestrator } from './doc-search-orchestrator';
import type { DetectedLibrary } from '../types/context-search';

describe('DocSearchOrchestrator', () => {
  let orchestrator: DocSearchOrchestrator;

  beforeEach(() => {
    orchestrator = createDocSearchOrchestrator({
      enableContext7: false, // Disable Context7 for tests (no API key)
      enableWebSearch: true,
    });
  });

  describe('search', () => {
    it('should search for documentation', async () => {
      const library: DetectedLibrary = {
        name: 'react',
        type: 'javascript',
        confidence: 0.9,
        context: 'import React from "react"',
      };

      const results = await orchestrator.search(library);

      // Should return some results (from web search)
      expect(Array.isArray(results)).toBe(true);
      // Note: Actual results depend on network availability
    });

    it('should handle library not found', async () => {
      const library: DetectedLibrary = {
        name: 'nonexistent-library-xyz-123',
        type: 'javascript',
        confidence: 0.5,
        context: 'import xyz from "xyz"',
      };

      const results = await orchestrator.search(library);

      // Should return empty array when library not found
      expect(results).toEqual([]);
    });

    it('should limit number of references', async () => {
      const orchestratorWithLimit = createDocSearchOrchestrator({
        enableContext7: false,
        enableWebSearch: true,
        maxReferencesPerLibrary: 2,
      });

      const library: DetectedLibrary = {
        name: 'react',
        type: 'javascript',
        confidence: 0.9,
        context: 'import React from "react"',
      };

      const results = await orchestratorWithLimit.search(library);

      // Should not exceed max references
      expect(results.length).toBeLessThanOrEqual(2);
    });
  });

  describe('searchMultiple', () => {
    it('should search for multiple libraries', async () => {
      const libraries: DetectedLibrary[] = [
        {
          name: 'react',
          type: 'javascript',
          confidence: 0.9,
          context: 'import React from "react"',
        },
        {
          name: 'pandas',
          type: 'python',
          confidence: 0.85,
          context: 'import pandas as pd',
        },
      ];

      const results = await orchestrator.searchMultiple(libraries);

      // Should return a map with results for each library
      expect(results instanceof Map).toBe(true);
      expect(results.size).toBe(2);
      expect(results.has('react')).toBe(true);
      expect(results.has('pandas')).toBe(true);
    });

    it('should handle errors gracefully', async () => {
      const libraries: DetectedLibrary[] = [
        {
          name: 'valid-library',
          type: 'javascript',
          confidence: 0.9,
          context: 'test',
        },
        {
          name: 'invalid-library-xyz',
          type: 'javascript',
          confidence: 0.5,
          context: 'test',
        },
      ];

      const results = await orchestrator.searchMultiple(libraries);

      // Should return results for all libraries (even if empty)
      expect(results.size).toBe(2);
      expect(results.has('valid-library')).toBe(true);
      expect(results.has('invalid-library-xyz')).toBe(true);
    });
  });

  describe('configuration', () => {
    it('should create orchestrator with default config', () => {
      const orch = createDocSearchOrchestrator();
      const config = orch.getConfig();

      expect(config.maxReferencesPerLibrary).toBe(3);
      expect(config.timeout).toBe(10000);
      expect(config.enableContext7).toBe(true);
      expect(config.enableWebSearch).toBe(true);
    });

    it('should create orchestrator with custom config', () => {
      const orch = createDocSearchOrchestrator({
        maxReferencesPerLibrary: 5,
        timeout: 5000,
        enableContext7: false,
        enableWebSearch: true,
      });

      const config = orch.getConfig();

      expect(config.maxReferencesPerLibrary).toBe(5);
      expect(config.timeout).toBe(5000);
      expect(config.enableContext7).toBe(false);
      expect(config.enableWebSearch).toBe(true);
    });

    it('should update Context7 API key', () => {
      const orch = createDocSearchOrchestrator();
      
      // Update with valid key format
      orch.updateContext7ApiKey('ctx7sk_test_key_12345');
      
      const config = orch.getConfig();
      expect(config.context7ApiKey).toBe('ctx7sk_test_key_12345');
    });

    it('should update GitHub token', () => {
      const orch = createDocSearchOrchestrator();
      
      orch.updateGitHubToken('ghp_test_token_12345');
      
      const config = orch.getConfig();
      expect(config.githubToken).toBe('ghp_test_token_12345');
    });
  });

  describe('testConnections', () => {
    it('should test connections to all sources', async () => {
      const results = await orchestrator.testConnections();

      expect(results).toHaveProperty('context7');
      expect(results).toHaveProperty('webSearch');
      expect(typeof results.context7).toBe('boolean');
      expect(typeof results.webSearch).toBe('boolean');
      
      // Web search should always be available
      expect(results.webSearch).toBe(true);
    });
  });

  describe('fallback behavior', () => {
    it('should fall back to web search when Context7 is disabled', async () => {
      const orch = createDocSearchOrchestrator({
        enableContext7: false,
        enableWebSearch: true,
      });

      const library: DetectedLibrary = {
        name: 'react',
        type: 'javascript',
        confidence: 0.9,
        context: 'import React from "react"',
      };

      const results = await orch.search(library);

      // Should get results from web search
      expect(Array.isArray(results)).toBe(true);
      
      // Clean up
      orch.clearCache();
    });

    it('should return empty array when all sources are disabled', async () => {
      const orch = createDocSearchOrchestrator({
        enableContext7: false,
        enableWebSearch: false,
      });

      // Clear cache to ensure no cached results
      orch.clearCache();

      const library: DetectedLibrary = {
        name: 'unique-test-library-xyz',
        type: 'javascript',
        confidence: 0.9,
        context: 'import xyz from "xyz"',
      };

      const results = await orch.search(library);

      // Should return empty array
      expect(results).toEqual([]);
      
      // Clean up
      orch.clearCache();
    });
  });
});
