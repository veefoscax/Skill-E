/**
 * Vitest setup file
 *
 * This file runs before all tests to set up the test environment.
 */

import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

// Mock Tauri Core APIs
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(() => Promise.resolve()),
}))

// Mock Tauri Event APIs
vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn(() => Promise.resolve(() => {})),
  emit: vi.fn(() => Promise.resolve()),
}))

// Mock Tauri Plugin APIs
vi.mock('@tauri-apps/plugin-global-shortcut', () => ({
  register: vi.fn(() => Promise.resolve()),
  unregisterAll: vi.fn(() => Promise.resolve()),
}))

vi.mock('@tauri-apps/plugin-fs', () => ({
  writeTextFile: vi.fn(() => Promise.resolve()),
  readTextFile: vi.fn(() => Promise.resolve('')),
  readFile: vi.fn(() => Promise.resolve(new Uint8Array())),
  writeFile: vi.fn(() => Promise.resolve()),
  mkdir: vi.fn(() => Promise.resolve()),
  BaseDirectory: {
    AppData: 0,
    Document: 1,
  }
}))

// Cleanup after each test
afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})
