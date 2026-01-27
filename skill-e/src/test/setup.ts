/**
 * Vitest setup file
 * 
 * This file runs before all tests to set up the test environment.
 */

import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Add custom matchers if needed
