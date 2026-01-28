/**
 * Tests for Documentation Cache
 * 
 * @module lib/doc-cache.test
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DocCache, createDocCache } from './doc-cache';
import type { DocReference } from '../types/context-search';

describe('DocCache', () => {
  let cache: DocCache;

  // Mock references for testing
  const mockReferences: DocReference[] = [
    {
      id: 'test-1',
      library: 'react',
      title: 'React Documentation',
      url: 'https://react.dev',
      snippet: 'React is a JavaScript library for building user interfaces.',
      source: 'official',
      relevance: 0.9,
    },
    {
      id: 'test-2',
      library: 'react',
      title: 'React GitHub',
      url: 'https://github.com/facebook/react',
      snippet: 'A declarative, efficient, and flexible JavaScript library.',
      source: 'github',
      relevance: 0.85,
    },
  ];

  beforeEach(() => {
    // Create cache with short TTL for testing
    cache = createDocCache(1000); // 1 second TTL
    cache.clear(); // Clear any existing cache
  });

  afterEach(() => {
    cache.clear();
  });

  describe('set and get', () => {
    it('should cache and retrieve documentation', () => {
      cache.set('react', mockReferences);
      
      const cached = cache.get('react');
      
      expect(cached).not.toBeNull();
      expect(cached).toHaveLength(2);
      expect(cached![0].library).toBe('react');
    });

    it('should return null for non-existent cache', () => {
      const cached = cache.get('nonexistent');
      
      expect(cached).toBeNull();
    });

    it('should cache with query parameter', () => {
      cache.set('react', mockReferences, 'hooks tutorial');
      
      const cached = cache.get('react', 'hooks tutorial');
      
      expect(cached).not.toBeNull();
      expect(cached).toHaveLength(2);
    });

    it('should differentiate between queries', () => {
      const refs1 = [mockReferences[0]];
      const refs2 = [mockReferences[1]];
      
      cache.set('react', refs1, 'query1');
      cache.set('react', refs2, 'query2');
      
      const cached1 = cache.get('react', 'query1');
      const cached2 = cache.get('react', 'query2');
      
      expect(cached1).toHaveLength(1);
      expect(cached2).toHaveLength(1);
      expect(cached1![0].id).toBe('test-1');
      expect(cached2![0].id).toBe('test-2');
    });

    it('should handle case-insensitive library names', () => {
      cache.set('React', mockReferences);
      
      const cached = cache.get('react');
      
      expect(cached).not.toBeNull();
      expect(cached).toHaveLength(2);
    });
  });

  describe('expiration', () => {
    it('should return null for expired cache', async () => {
      // Create cache with very short TTL
      const shortCache = createDocCache(100); // 100ms TTL
      shortCache.set('react', mockReferences);
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 150));
      
      const cached = shortCache.get('react');
      
      expect(cached).toBeNull();
      
      shortCache.clear();
    });

    it('should not expire before TTL', async () => {
      cache.set('react', mockReferences);
      
      // Wait less than TTL
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const cached = cache.get('react');
      
      expect(cached).not.toBeNull();
    });
  });

  describe('remove', () => {
    it('should remove cached entry', () => {
      cache.set('react', mockReferences);
      
      expect(cache.get('react')).not.toBeNull();
      
      cache.remove('react');
      
      expect(cache.get('react')).toBeNull();
    });

    it('should remove specific query cache', () => {
      cache.set('react', mockReferences, 'query1');
      cache.set('react', mockReferences, 'query2');
      
      cache.remove('react', 'query1');
      
      expect(cache.get('react', 'query1')).toBeNull();
      expect(cache.get('react', 'query2')).not.toBeNull();
    });
  });

  describe('clear', () => {
    it('should clear all cached entries', () => {
      cache.set('react', mockReferences);
      cache.set('pandas', mockReferences);
      cache.set('vue', mockReferences);
      
      cache.clear();
      
      expect(cache.get('react')).toBeNull();
      expect(cache.get('pandas')).toBeNull();
      expect(cache.get('vue')).toBeNull();
    });

    it('should reset statistics', () => {
      cache.set('react', mockReferences);
      cache.get('react'); // Hit
      cache.get('nonexistent'); // Miss
      
      cache.clear();
      
      const stats = cache.getStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
    });
  });

  describe('evictExpired', () => {
    it('should evict expired entries', async () => {
      const shortCache = createDocCache(100); // 100ms TTL
      
      shortCache.set('react', mockReferences);
      shortCache.set('vue', mockReferences);
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 150));
      
      const evicted = shortCache.evictExpired();
      
      expect(evicted).toBe(2);
      expect(shortCache.get('react')).toBeNull();
      expect(shortCache.get('vue')).toBeNull();
      
      shortCache.clear();
    });

    it('should not evict non-expired entries', async () => {
      cache.set('react', mockReferences);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const evicted = cache.evictExpired();
      
      expect(evicted).toBe(0);
      expect(cache.get('react')).not.toBeNull();
    });
  });

  describe('statistics', () => {
    it('should track cache hits', () => {
      cache.set('react', mockReferences);
      
      cache.get('react'); // Hit
      cache.get('react'); // Hit
      
      const stats = cache.getStats();
      
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(0);
    });

    it('should track cache misses', () => {
      cache.get('nonexistent'); // Miss
      cache.get('another'); // Miss
      
      const stats = cache.getStats();
      
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(2);
    });

    it('should calculate hit rate', () => {
      cache.set('react', mockReferences);
      
      cache.get('react'); // Hit
      cache.get('nonexistent'); // Miss
      cache.get('react'); // Hit
      
      const stats = cache.getStats();
      
      expect(stats.hitRate).toBeCloseTo(0.666, 2);
    });

    it('should count total entries', () => {
      cache.set('react', mockReferences);
      cache.set('vue', mockReferences);
      cache.set('angular', mockReferences);
      
      const stats = cache.getStats();
      
      // Should have 3 library entries (stats key is not counted as it doesn't have the cache prefix)
      expect(stats.totalEntries).toBeGreaterThanOrEqual(3);
    });

    it('should estimate cache size', () => {
      cache.set('react', mockReferences);
      
      const stats = cache.getStats();
      
      expect(stats.sizeBytes).toBeGreaterThan(0);
    });
  });

  describe('getCachedLibraries', () => {
    it('should return list of cached libraries', () => {
      cache.set('react', mockReferences);
      cache.set('vue', mockReferences);
      cache.set('angular', mockReferences);
      
      const libraries = cache.getCachedLibraries();
      
      expect(libraries).toContain('react');
      expect(libraries).toContain('vue');
      expect(libraries).toContain('angular');
      expect(libraries).toHaveLength(3);
    });

    it('should return empty array when cache is empty', () => {
      const libraries = cache.getCachedLibraries();
      
      expect(libraries).toEqual([]);
    });
  });

  describe('has', () => {
    it('should return true for cached library', () => {
      cache.set('react', mockReferences);
      
      expect(cache.has('react')).toBe(true);
    });

    it('should return false for non-cached library', () => {
      expect(cache.has('nonexistent')).toBe(false);
    });

    it('should return false for expired cache', async () => {
      const shortCache = createDocCache(100); // 100ms TTL
      shortCache.set('react', mockReferences);
      
      await new Promise(resolve => setTimeout(resolve, 150));
      
      expect(shortCache.has('react')).toBe(false);
      
      shortCache.clear();
    });
  });

  describe('edge cases', () => {
    it('should handle empty references array', () => {
      cache.set('react', []);
      
      const cached = cache.get('react');
      
      expect(cached).not.toBeNull();
      expect(cached).toEqual([]);
    });

    it('should handle special characters in library names', () => {
      const specialName = '@angular/core';
      cache.set(specialName, mockReferences);
      
      const cached = cache.get(specialName);
      
      expect(cached).not.toBeNull();
    });

    it('should handle very long library names', () => {
      const longName = 'a'.repeat(1000);
      cache.set(longName, mockReferences);
      
      const cached = cache.get(longName);
      
      expect(cached).not.toBeNull();
    });
  });
});
