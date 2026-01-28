/**
 * Store exports
 * Central export point for all Zustand stores
 */

export { useRecordingStore } from './recording';
export type { RecordingState, CaptureFrame, CaptureStep, StepType } from './recording';

export { useSettingsStore } from './settings';
export type { SettingsState, WindowPosition, TranscriptionMode, WhisperModel } from './settings';

export { useOverlayStore, COLORS, getColorHex, redactPassword, getPasswordPlaceholder } from './overlay';
export type { 
  OverlayState, 
  OverlayActions, 
  OverlayStore,
  ColorKey,
  FadeState,
  ClickIndicator,
  DrawingElement,
  DrawingType,
  KeyboardState,
  KeyboardModifiers,
  KeyboardPosition,
  SelectedElement,
  RecordingStatus,
  StatusIndicatorPosition,
  CursorHighlightConfig
} from './overlay';

export { useProviderStore } from './provider';
export type { ProviderState } from './provider';
export { 
  getProviderDisplayName, 
  requiresApiKey, 
  isFreeProvider, 
  getProviderDescription,
  validateApiKey 
} from './provider';
