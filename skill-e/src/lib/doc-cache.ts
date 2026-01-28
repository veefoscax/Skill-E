/**
 * Documentation Cache
 * 
 * Caches fetched documentation locally to reduce redundant API calls.
 * Uses localStorage with 24-hour expiration.
 * 
 * Requirements: FR-9.7, NFR-9.2
 * 
 * @module lib/doc-cache
 */

import type { DocReference, DocSearchResult } from '../types/context-search';

/**
 * Cache entry with metadata
 */
interface CacheEntry {
  /** Cached search result */
  result: DocSearchResult;
  
  /** Timestamp when cached (milliseconds since epoch) */
  cachedAt: number;
  
  /** Expiration timestamp (milliseconds since epoch) */
  expiresAt: number;
}

/**
 * Cache statistics
 */
export interface CacheStats {
  /** Total number of cached entries */
  totalEntries: number;
  
  /** Number of cache hits */
  hits: number;
  
  /** Number of cache misses */
  misses: number;
  
  /** Cache hit rate (0-1) */
  hitRate: number;
  
  /** Total size in bytes (approximate) */
  sizeBytes: number;
}

/**
 * Documentation Cache
 * 
 * Provides caching for documentation search results with automatic expiration.
 */
export class DocCache {
  private static readonly CACHE_PREFIX = 'skill-e:doc-cache:';
  private static readonly STATS_KEY = 'skill-e:doc-cache:stats';
  private static readonly DEFAULT_TTL = 24 * 60 * 60 * 1000; // 24 hours

  private ttl: number;
  private hits: number = 0;
  private misses: number = 0;

  constructor(ttlMs: number = DocCache.DEFAULT_TTL) {
    this.ttl = ttlMs;
    this.loadStats();
  }

  /**
   * Get cached documentation for a library
   * 
   * @param libraryName - Name of the library
   * @param query - Search query (optional, for more specific caching)
   * @returns Cached references, or null if not found or expired
   */
  get(libraryName: string, query?: string): DocReference[] | null {
    const key = this.getCacheKey(libraryName, query);
    
    try {
      const cached = localStorage.getItem(key);
      if (!cached) {
        this.misses++;
        this.saveStats();
        return null;
      }

      const entry: CacheEntry = JSON.parse(cached);

      // Check if expired
      if (Date.now() > entry.expiresAt) {
        console.log(`Cache expired for ${libraryName}`);
        this.remove(libraryName, query);
        this.misses++;
        this.saveStats();
        return null;
      }

      console.log(`Cache hit for ${libraryName}`);
      this.hits++;
      this.saveStats();
      return entry.result.references;
    } catch (error) {
      console.error(`Failed to read cache for ${libraryName}:`, error);
      this.misses++;
      this.saveStats();
      return null;
    }
  }

  /**
   * Cache documentation for a library
   * 
   * @param libraryName - Name of the library
   * @param references - Documentation references to cache
   * @param query - Search query (optional)
   */
  set(libraryName: string, references: DocReference[], query?: string): void {
    const key = this.getCacheKey(libraryName, query);
    
    const result: DocSearchResult = {
      library: libraryName,
      references,
      searchQuery: query || libraryName,
      timestamp: Date.now(),
    };

    const entry: CacheEntry = {
      result,
      cachedAt: Date.now(),
      expiresAt: Date.now() + this.ttl,
    };

    try {
      localStorage.setItem(key, JSON.stringify(entry));
      console.log(`Cached ${references.length} references for ${libraryName}`);
    } catch (error) {
      console.error(`Failed to cache docs for ${libraryName}:`, error);
      
      // If storage is full, try to evict old entries
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        this.evictOldest();
        // Try again
        try {
          localStorage.setItem(key, JSON.stringify(entry));
        } catch (retryError) {
          console.error('Failed to cache even after eviction:', retryError);
        }
      }
    }
  }

  /**
   * Remove cached documentation for a library
   * 
   * @param libraryName - Name of the library
   * @param query - Search query (optional)
   */
  remove(libraryName: string, query?: string): void {
    const key = this.getCacheKey(libraryName, query);
    localStorage.removeItem(key);
  }

  /**
   * Clear all cached documentation
   */
  clear(): void {
    const keys = this.getAllCacheKeys();
    for (const key of keys) {
      localStorage.removeItem(key);
    }
    
    // Reset stats
    this.hits = 0;
    this.misses = 0;
    this.saveStats();
    
    console.log(`Cleared ${keys.length} cached entries`);
  }

  /**
   * Evict expired entries
   * 
   * @returns Number of entries evicted
   */
  evictExpired(): number {
    const keys = this.getAllCacheKeys();
    let evicted = 0;
    const now = Date.now();

    for (const key of keys) {
      try {
        const cached = localStorage.getItem(key);
        if (!cached) continue;

        const entry: CacheEntry = JSON.parse(cached);
        if (now > entry.expiresAt) {
          localStorage.removeItem(key);
          evicted++;
        }
      } catch (error) {
        // If we can't parse it, remove it
        localStorage.removeItem(key);
        evicted++;
      }
    }

    if (evicted > 0) {
      console.log(`Evicted ${evicted} expired cache entries`);
    }

    return evicted;
  }

  /**
   * Evict oldest entries to free up space
   * 
   * @param count - Number of entries to evict (default: 5)
   */
  evictOldest(count: number = 5): void {
    const keys = this.getAllCacheKeys();
    const entries: Array<{ key: string; cachedAt: number }> = [];

    // Collect all entries with timestamps
    for (const key of keys) {
      try {
        const cached = localStorage.getItem(key);
        if (!cached) continue;

        const entry: CacheEntry = JSON.parse(cached);
        entries.push({ key, cachedAt: entry.cachedAt });
      } catch (error) {
        // If we can't parse it, remove it
        localStorage.removeItem(key);
      }
    }

    // Sort by age (oldest first)
    entries.sort((a, b) => a.cachedAt - b.cachedAt);

    // Remove oldest entries
    const toRemove = entries.slice(0, count);
    for (const { key } of toRemove) {
      localStorage.removeItem(key);
    }

    console.log(`Evicted ${toRemove.length} oldest cache entries`);
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const keys = this.getAllCacheKeys();
    let totalSize = 0;

    for (const key of keys) {
      const value = localStorage.getItem(key);
      if (value) {
        // Approximate size (2 bytes per character in UTF-16)
        totalSize += (key.length + value.length) * 2;
      }
    }

    const total = this.hits + this.misses;
    const hitRate = total > 0 ? this.hits / total : 0;

    return {
      totalEntries: keys.length,
      hits: this.hits,
      misses: this.misses,
      hitRate,
      sizeBytes: totalSize,
    };
  }

  /**
   * Get all cached library names
   */
  getCachedLibraries(): string[] {
    const keys = this.getAllCacheKeys();
    const libraries = new Set<string>();

    for (const key of keys) {
      try {
        const cached = localStorage.getItem(key);
        if (!cached) continue;

        const entry: CacheEntry = JSON.parse(cached);
        libraries.add(entry.result.library);
      } catch (error) {
        // Skip invalid entries
      }
    }

    return Array.from(libraries);
  }

  /**
   * Check if a library is cached
   * 
   * @param libraryName - Name of the library
   * @param query - Search query (optional)
   * @returns true if cached and not expired
   */
  has(libraryName: string, query?: string): boolean {
    return this.get(libraryName, query) !== null;
  }

  /**
   * Get cache key for a library
   */
  private getCacheKey(libraryName: string, query?: string): string {
    const normalized = libraryName.toLowerCase();
    if (query) {
      const queryHash = this.hashString(query);
      return `${DocCache.CACHE_PREFIX}${normalized}:${queryHash}`;
    }
    return `${DocCache.CACHE_PREFIX}${normalized}`;
  }

  /**
   * Get all cache keys
   */
  private getAllCacheKeys(): string[] {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(DocCache.CACHE_PREFIX)) {
        keys.push(key);
      }
    }
    return keys;
  }

  /**
   * Simple string hash function
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Load statistics from localStorage
   */
  private loadStats(): void {
    try {
      const stats = localStorage.getItem(DocCache.STATS_KEY);
      if (stats) {
        const parsed = JSON.parse(stats);
        this.hits = parsed.hits || 0;
        this.misses = parsed.misses || 0;
      }
    } catch (error) {
      console.error('Failed to load cache stats:', error);
    }
  }

  /**
   * Save statistics to localStorage
   */
  private saveStats(): void {
    try {
      const stats = {
        hits: this.hits,
        misses: this.misses,
      };
      localStorage.setItem(DocCache.STATS_KEY, JSON.stringify(stats));
    } catch (error) {
      // Ignore errors when saving stats
    }
  }
}

/**
 * Create a documentation cache instance
 * 
 * @param ttlMs - Time to live in milliseconds (default: 24 hours)
 * @returns DocCache instance
 */
export function createDocCache(ttlMs?: number): DocCache {
  return new DocCache(ttlMs);
}

/**
 * Global cache instance
 */
let globalCache: DocCache | null = null;

/**
 * Get or create the global cache instance
 * 
 * @param ttlMs - Time to live in milliseconds (only used on first call)
 * @returns Global DocCache instance
 */
export function getGlobalCache(ttlMs?: number): DocCache {
  if (!globalCache) {
    globalCache = new DocCache(ttlMs);
  }
  return globalCache;
}

/**
 * Reset the global cache (useful for testing)
 */
export function resetGlobalCache(): void {
  if (globalCache) {
    globalCache.clear();
  }
  globalCache = null;
}
