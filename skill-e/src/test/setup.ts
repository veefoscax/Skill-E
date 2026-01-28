/**
 * Vitest setup file
 * 
 * This file runs before all tests to set up the test environment.
 */

import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});
