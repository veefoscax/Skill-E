/**
 * Library Database Tests
 * 
 * Tests for the known libraries database and helper functions.
 */

import { describe, test, expect } from 'vitest';
import {
  LIBRARY_DATABASE,
  getLibraryMetadata,
  getLibrariesByType,
  searchLibraries,
  getAllLibraryNames,
  isKnownLibrary,
  getDocumentationUrl,
  getGitHubUrl,
  buildSearchQuery,
} from './library-database';

describe('Library Database', () => {
  describe('Database Structure', () => {
    test('should contain Python libraries', () => {
      expect(LIBRARY_DATABASE['pandas']).toBeDefined();
      expect(LIBRARY_DATABASE['numpy']).toBeDefined();
      expect(LIBRARY_DATABASE['requests']).toBeDefined();
      expect(LIBRARY_DATABASE['flask']).toBeDefined();
      expect(LIBRARY_DATABASE['django']).toBeDefined();
    });

    test('should contain JavaScript libraries', () => {
      expect(LIBRARY_DATABASE['react']).toBeDefined();
      expect(LIBRARY_DATABASE['vue']).toBeDefined();
      expect(LIBRARY_DATABASE['express']).toBeDefined();
      expect(LIBRARY_DATABASE['axios']).toBeDefined();
    });

    test('should contain development tools', () => {
      expect(LIBRARY_DATABASE['git']).toBeDefined();
      expect(LIBRARY_DATABASE['docker']).toBeDefined();
      expect(LIBRARY_DATABASE['kubernetes']).toBeDefined();
      expect(LIBRARY_DATABASE['npm']).toBeDefined();
    });

    test('should contain databases', () => {
      expect(LIBRARY_DATABASE['postgresql']).toBeDefined();
      expect(LIBRARY_DATABASE['mongodb']).toBeDefined();
      expect(LIBRARY_DATABASE['redis']).toBeDefined();
    });

    test('all entries should have required fields', () => {
      Object.entries(LIBRARY_DATABASE).forEach(([key, metadata]) => {
        expect(metadata.name).toBe(key);
        expect(metadata.displayName).toBeTruthy();
        expect(metadata.type).toBeTruthy();
        expect(metadata.officialDocs).toBeTruthy();
        expect(metadata.usagePatterns).toBeInstanceOf(Array);
        expect(metadata.usagePatterns.length).toBeGreaterThan(0);
        expect(metadata.searchKeywords).toBeInstanceOf(Array);
        expect(metadata.searchKeywords.length).toBeGreaterThan(0);
      });
    });

    test('all documentation URLs should be valid HTTPS URLs', () => {
      Object.values(LIBRARY_DATABASE).forEach(metadata => {
        expect(metadata.officialDocs).toMatch(/^https:\/\//);
        
        if (metadata.githubRepo) {
          expect(metadata.githubRepo).toMatch(/^https:\/\/github\.com\//);
        }
        
        if (metadata.altDocs) {
          metadata.altDocs.forEach(url => {
            expect(url).toMatch(/^https:\/\//);
          });
        }
      });
    });
  });

  describe('getLibraryMetadata', () => {
    test('should return metadata for known library', () => {
      const pandas = getLibraryMetadata('pandas');
      expect(pandas).toBeDefined();
      expect(pandas?.name).toBe('pandas');
      expect(pandas?.type).toBe('python');
    });

    test('should be case-insensitive', () => {
      expect(getLibraryMetadata('PANDAS')).toBeDefined();
      expect(getLibraryMetadata('React')).toBeDefined();
      expect(getLibraryMetadata('DOCKER')).toBeDefined();
    });

    test('should return undefined for unknown library', () => {
      expect(getLibraryMetadata('unknown-library')).toBeUndefined();
    });

    test('should return correct metadata structure', () => {
      const react = getLibraryMetadata('react');
      expect(react).toMatchObject({
        name: 'react',
        displayName: 'React',
        type: 'javascript',
        officialDocs: expect.stringContaining('https://'),
        usagePatterns: expect.arrayContaining(['useState', 'useEffect']),
        searchKeywords: expect.any(Array),
      });
    });
  });

  describe('getLibrariesByType', () => {
    test('should return all Python libraries', () => {
      const pythonLibs = getLibrariesByType('python');
      expect(pythonLibs.length).toBeGreaterThan(0);
      expect(pythonLibs.every(lib => lib.type === 'python')).toBe(true);
      expect(pythonLibs.some(lib => lib.name === 'pandas')).toBe(true);
      expect(pythonLibs.some(lib => lib.name === 'numpy')).toBe(true);
    });

    test('should return all JavaScript libraries', () => {
      const jsLibs = getLibrariesByType('javascript');
      expect(jsLibs.length).toBeGreaterThan(0);
      expect(jsLibs.every(lib => lib.type === 'javascript')).toBe(true);
      expect(jsLibs.some(lib => lib.name === 'react')).toBe(true);
    });

    test('should return all tools', () => {
      const tools = getLibrariesByType('tool');
      expect(tools.length).toBeGreaterThan(0);
      expect(tools.every(lib => lib.type === 'tool')).toBe(true);
      expect(tools.some(lib => lib.name === 'git')).toBe(true);
      expect(tools.some(lib => lib.name === 'docker')).toBe(true);
    });

    test('should return all databases', () => {
      const databases = getLibrariesByType('database');
      expect(databases.length).toBeGreaterThan(0);
      expect(databases.every(lib => lib.type === 'database')).toBe(true);
      expect(databases.some(lib => lib.name === 'postgresql')).toBe(true);
    });

    test('should return empty array for unknown type', () => {
      const result = getLibrariesByType('unknown' as any);
      expect(result).toEqual([]);
    });
  });

  describe('searchLibraries', () => {
    test('should find libraries by exact name', () => {
      const results = searchLibraries('pandas');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(lib => lib.name === 'pandas')).toBe(true);
    });

    test('should find libraries by partial name', () => {
      const results = searchLibraries('react');
      expect(results.some(lib => lib.name === 'react')).toBe(true);
    });

    test('should find libraries by keyword', () => {
      const results = searchLibraries('testing');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(lib => lib.name === 'pytest' || lib.name === 'jest')).toBe(true);
    });

    test('should be case-insensitive', () => {
      const lower = searchLibraries('database');
      const upper = searchLibraries('DATABASE');
      expect(lower.length).toBe(upper.length);
    });

    test('should return empty array for no matches', () => {
      const results = searchLibraries('xyzabc123notfound');
      expect(results).toEqual([]);
    });

    test('should find multiple libraries with common keywords', () => {
      const results = searchLibraries('web framework');
      expect(results.length).toBeGreaterThan(1);
    });
  });

  describe('getAllLibraryNames', () => {
    test('should return array of all library names', () => {
      const names = getAllLibraryNames();
      expect(names).toBeInstanceOf(Array);
      expect(names.length).toBeGreaterThan(0);
    });

    test('should include common libraries', () => {
      const names = getAllLibraryNames();
      expect(names).toContain('pandas');
      expect(names).toContain('react');
      expect(names).toContain('docker');
      expect(names).toContain('postgresql');
    });

    test('all names should be lowercase', () => {
      const names = getAllLibraryNames();
      names.forEach(name => {
        expect(name).toBe(name.toLowerCase());
      });
    });
  });

  describe('isKnownLibrary', () => {
    test('should return true for known libraries', () => {
      expect(isKnownLibrary('pandas')).toBe(true);
      expect(isKnownLibrary('react')).toBe(true);
      expect(isKnownLibrary('docker')).toBe(true);
    });

    test('should be case-insensitive', () => {
      expect(isKnownLibrary('PANDAS')).toBe(true);
      expect(isKnownLibrary('React')).toBe(true);
      expect(isKnownLibrary('DOCKER')).toBe(true);
    });

    test('should return false for unknown libraries', () => {
      expect(isKnownLibrary('unknown-lib')).toBe(false);
      expect(isKnownLibrary('notfound')).toBe(false);
    });
  });

  describe('getDocumentationUrl', () => {
    test('should return documentation URL for known library', () => {
      const url = getDocumentationUrl('pandas');
      expect(url).toBe('https://pandas.pydata.org/docs/');
    });

    test('should be case-insensitive', () => {
      const url = getDocumentationUrl('REACT');
      expect(url).toBeDefined();
      expect(url).toMatch(/^https:\/\//);
    });

    test('should return undefined for unknown library', () => {
      const url = getDocumentationUrl('unknown-lib');
      expect(url).toBeUndefined();
    });

    test('all returned URLs should be valid HTTPS', () => {
      const names = getAllLibraryNames();
      names.forEach(name => {
        const url = getDocumentationUrl(name);
        expect(url).toMatch(/^https:\/\//);
      });
    });
  });

  describe('getGitHubUrl', () => {
    test('should return GitHub URL when available', () => {
      const url = getGitHubUrl('pandas');
      expect(url).toBe('https://github.com/pandas-dev/pandas');
    });

    test('should return undefined when not available', () => {
      // Some libraries might not have GitHub repos in the database
      const url = getGitHubUrl('make');
      expect(url).toBeUndefined();
    });

    test('should be case-insensitive', () => {
      const url = getGitHubUrl('REACT');
      expect(url).toBeDefined();
    });

    test('all returned URLs should be GitHub URLs', () => {
      const names = getAllLibraryNames();
      names.forEach(name => {
        const url = getGitHubUrl(name);
        if (url) {
          expect(url).toMatch(/^https:\/\/github\.com\//);
        }
      });
    });
  });

  describe('buildSearchQuery', () => {
    test('should return library name for unknown library', () => {
      const query = buildSearchQuery('unknown-lib');
      expect(query).toBe('unknown-lib');
    });

    test('should use display name for known library', () => {
      const query = buildSearchQuery('pandas');
      expect(query).toContain('pandas');
    });

    test('should include keywords when no context provided', () => {
      const query = buildSearchQuery('pandas');
      expect(query.length).toBeGreaterThan('pandas'.length);
    });

    test('should include context when provided', () => {
      const query = buildSearchQuery('pandas', 'dataframe filtering');
      expect(query).toContain('pandas');
      expect(query).toContain('dataframe filtering');
    });

    test('should work with case-insensitive library names', () => {
      const query1 = buildSearchQuery('pandas');
      const query2 = buildSearchQuery('PANDAS');
      expect(query1).toBe(query2);
    });

    test('should build meaningful queries for different libraries', () => {
      const pandasQuery = buildSearchQuery('pandas', 'read csv');
      expect(pandasQuery).toContain('pandas');
      expect(pandasQuery).toContain('read csv');

      const reactQuery = buildSearchQuery('react', 'hooks');
      expect(reactQuery).toContain('React');
      expect(reactQuery).toContain('hooks');
    });
  });

  describe('Coverage Tests', () => {
    test('should have comprehensive Python library coverage', () => {
      const pythonLibs = getLibrariesByType('python');
      const expectedLibs = ['pandas', 'numpy', 'matplotlib', 'requests', 'flask', 'django', 'fastapi'];
      
      expectedLibs.forEach(lib => {
        expect(pythonLibs.some(l => l.name === lib)).toBe(true);
      });
    });

    test('should have comprehensive JavaScript library coverage', () => {
      const jsLibs = getLibrariesByType('javascript');
      const expectedLibs = ['react', 'vue', 'angular', 'express', 'axios'];
      
      expectedLibs.forEach(lib => {
        expect(jsLibs.some(l => l.name === lib)).toBe(true);
      });
    });

    test('should have essential development tools', () => {
      const tools = getLibrariesByType('tool');
      const expectedTools = ['git', 'docker', 'npm', 'pip'];
      
      expectedTools.forEach(tool => {
        expect(tools.some(t => t.name === tool)).toBe(true);
      });
    });

    test('should have common databases', () => {
      const databases = getLibrariesByType('database');
      const expectedDbs = ['postgresql', 'mysql', 'mongodb', 'redis'];
      
      expectedDbs.forEach(db => {
        expect(databases.some(d => d.name === db)).toBe(true);
      });
    });
  });

  describe('Usage Patterns', () => {
    test('pandas should have dataframe-related patterns', () => {
      const pandas = getLibraryMetadata('pandas');
      expect(pandas?.usagePatterns).toContain('DataFrame');
      expect(pandas?.usagePatterns).toContain('read_csv');
    });

    test('react should have hooks patterns', () => {
      const react = getLibraryMetadata('react');
      expect(react?.usagePatterns).toContain('useState');
      expect(react?.usagePatterns).toContain('useEffect');
    });

    test('docker should have container patterns', () => {
      const docker = getLibraryMetadata('docker');
      expect(docker?.usagePatterns).toContain('docker run');
      expect(docker?.usagePatterns).toContain('Dockerfile');
    });

    test('all libraries should have at least 3 usage patterns', () => {
      Object.values(LIBRARY_DATABASE).forEach(metadata => {
        expect(metadata.usagePatterns.length).toBeGreaterThanOrEqual(3);
      });
    });
  });

  describe('Search Keywords', () => {
    test('pandas should have data-related keywords', () => {
      const pandas = getLibraryMetadata('pandas');
      expect(pandas?.searchKeywords.some(k => k.includes('data'))).toBe(true);
    });

    test('react should have UI-related keywords', () => {
      const react = getLibraryMetadata('react');
      expect(react?.searchKeywords).toContain('ui');
    });

    test('all libraries should have meaningful keywords', () => {
      Object.values(LIBRARY_DATABASE).forEach(metadata => {
        expect(metadata.searchKeywords.length).toBeGreaterThanOrEqual(2);
        metadata.searchKeywords.forEach(keyword => {
          expect(keyword.length).toBeGreaterThan(0);
        });
      });
    });
  });
});
