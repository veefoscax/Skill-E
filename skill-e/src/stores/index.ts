/**
 * Store exports
 * Central export point for all Zustand stores
 */

export { useRecordingStore } from './recording';
export type { RecordingState, CaptureFrame } from './recording';

export { useSettingsStore } from './settings';
export type { SettingsState, WindowPosition } from './settings';
