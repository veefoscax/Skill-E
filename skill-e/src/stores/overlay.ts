import { create } from 'zustand';

/**
 * Fixed color palette for overlay annotations
 */
export const COLORS = {
  COLOR_1: '#FF4444', // Red
  COLOR_2: '#4488FF', // Blue
  COLOR_3: '#44CC44', // Green
} as const;

export type ColorKey = keyof typeof COLORS;

/**
 * Fade state for animated elements
 */
export type FadeState = 'visible' | 'fading' | 'hidden';

/**
 * Click indicator with numbered sequence
 */
export interface ClickIndicator {
  id: string;
  number: number; // 1, 2, 3...
  position: { x: number; y: number };
  color: ColorKey; // Cycles through COLOR_1 → COLOR_2 → COLOR_3
  timestamp: number;
  fadeState: FadeState;
}

/**
 * Drawing element types
 */
export type DrawingType = 'dot' | 'arrow' | 'rectangle';

/**
 * Drawing element with fade/pin support
 */
export interface DrawingElement {
  id: string;
  type: DrawingType;
  color: ColorKey;
  startPoint: { x: number; y: number };
  endPoint?: { x: number; y: number }; // For arrow/rectangle
  timestamp: number;
  isPinned: boolean;
  fadeState: FadeState;
}

/**
 * Keyboard modifier keys state
 */
export interface KeyboardModifiers {
  shift: boolean;
  ctrl: boolean;
  alt: boolean;
  meta: boolean; // Cmd on Mac
}

/**
 * Keyboard display position options
 */
export type KeyboardPosition = 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';

/**
 * Keyboard input state
 */
export interface KeyboardState {
  modifiers: KeyboardModifiers;
  currentText: string;
  isPasswordField: boolean;
  displayPosition: KeyboardPosition;
  isVisible: boolean;
}

/**
 * Selected browser element information
 */
export interface SelectedElement {
  cssSelector: string;
  xpath: string;
  tagName: string;
  textContent: string;
  boundingBox: { x: number; y: number; width: number; height: number };
  screenshot?: string; // Base64 of element only
  timestamp: number;
}

/**
 * Recording status for status indicator
 */
export type RecordingStatus = 'recording' | 'paused' | 'stopped';

/**
 * Status indicator position
 */
export type StatusIndicatorPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';

/**
 * Cursor highlight configuration
 */
export interface CursorHighlightConfig {
  enabled: boolean;
  size: number;
  color: string;
  thickness: number;
  showClickEffect: boolean;
}

/**
 * Overlay store state
 */
export interface OverlayState {
  // Overlay visibility for inline overlay
  isVisible: boolean;
  mode: 'select' | 'draw' | 'annotate';
  
  // Overlay status
  isActive: boolean;
  
  // Recording status indicator
  recordingStatus: RecordingStatus;
  statusIndicatorVisible: boolean;
  statusIndicatorPosition: StatusIndicatorPosition;
  
  // Cursor highlight (Requirements: FR-4.5)
  cursorHighlight: CursorHighlightConfig;
  
  // Drawing mode
  isPinMode: boolean;
  currentColor: ColorKey;
  
  // Click tracking
  clicks: ClickIndicator[];
  clickCounter: number; // Total clicks for numbering
  
  // Drawing annotations
  drawings: DrawingElement[];
  
  // Keyboard display
  keyboard: KeyboardState;
  
  // Element picker
  elementPickerEnabled: boolean;
  hoveredElement?: SelectedElement;
  selectedElements: SelectedElement[];
}

/**
 * Overlay store actions
 */
export interface OverlayActions {
  // Overlay control (inline)
  showOverlay: () => void;
  hideOverlay: () => void;
  setMode: (mode: 'select' | 'draw' | 'annotate') => void;
  
  // Overlay control (legacy)
  activate: () => void;
  deactivate: () => void;
  reset: () => void;
  
  // Recording status
  setRecordingStatus: (status: RecordingStatus) => void;
  toggleStatusIndicator: () => void;
  setStatusIndicatorPosition: (position: StatusIndicatorPosition) => void;
  
  // Cursor highlight actions (Requirements: FR-4.5)
  toggleCursorHighlight: () => void;
  setCursorHighlightConfig: (config: Partial<CursorHighlightConfig>) => void;
  
  // Click actions
  addClick: (position: { x: number; y: number }) => void;
  updateClickFadeState: (id: string, fadeState: FadeState) => void;
  removeClick: (id: string) => void;
  clearClicks: () => void;
  
  // Drawing actions
  addDrawing: (drawing: Omit<DrawingElement, 'id' | 'timestamp' | 'fadeState'>) => void;
  updateDrawingFadeState: (id: string, fadeState: FadeState) => void;
  removeDrawing: (id: string) => void;
  clearDrawings: () => void;
  togglePinMode: () => void;
  setColor: (color: ColorKey) => void;
  cycleColor: () => void;
  
  // Keyboard actions
  updateKeyboard: (state: Partial<KeyboardState>) => void;
  setKeyboardModifiers: (modifiers: Partial<KeyboardModifiers>) => void;
  setKeyboardText: (text: string, isPasswordField?: boolean) => void;
  clearKeyboardText: () => void;
  toggleKeyboardDisplay: () => void;
  setKeyboardPosition: (position: KeyboardPosition) => void;
  
  // Element picker actions
  toggleElementPicker: () => void;
  setHoveredElement: (element: SelectedElement | undefined) => void;
  selectElement: (element: SelectedElement) => void;
  removeSelectedElement: (timestamp: number) => void;
  clearSelectedElements: () => void;
}

/**
 * Complete overlay store type
 */
export type OverlayStore = OverlayState & OverlayActions;

/**
 * Initial keyboard state
 */
const initialKeyboardState: KeyboardState = {
  modifiers: {
    shift: false,
    ctrl: false,
    alt: false,
    meta: false,
  },
  currentText: '',
  isPasswordField: false,
  displayPosition: 'bottom-left',
  isVisible: true,
};

/**
 * Initial overlay state
 */
const initialState: OverlayState = {
  isVisible: false,
  mode: 'select',
  isActive: false,
  recordingStatus: 'stopped',
  statusIndicatorVisible: true,
  statusIndicatorPosition: 'top-right',
  cursorHighlight: {
    enabled: true,
    size: 32,
    color: '#EF4444',
    thickness: 2,
    showClickEffect: true,
  },
  isPinMode: false,
  currentColor: 'COLOR_1',
  clicks: [],
  clickCounter: 0,
  drawings: [],
  keyboard: initialKeyboardState,
  elementPickerEnabled: false,
  hoveredElement: undefined,
  selectedElements: [],
};

/**
 * Get color for click based on sequence number
 * Cycles through COLOR_1 → COLOR_2 → COLOR_3
 */
function getColorForClick(clickNumber: number): ColorKey {
  const colors: ColorKey[] = ['COLOR_1', 'COLOR_2', 'COLOR_3'];
  return colors[(clickNumber - 1) % 3];
}

/**
 * Overlay store with Zustand
 * Manages overlay UI state including clicks, drawings, keyboard display, and element picker
 */
export const useOverlayStore = create<OverlayStore>((set, get) => ({
  ...initialState,

  // Inline overlay control
  showOverlay: () =>
    set({
      isVisible: true,
    }),

  hideOverlay: () =>
    set({
      isVisible: false,
    }),

  setMode: (mode) =>
    set({
      mode,
    }),

  // Legacy overlay control
  activate: () =>
    set({
      isActive: true,
    }),

  deactivate: () =>
    set({
      isActive: false,
    }),

  reset: () =>
    set({
      ...initialState,
      keyboard: { ...initialKeyboardState },
    }),

  // Recording status
  setRecordingStatus: (status) =>
    set({
      recordingStatus: status,
    }),

  toggleStatusIndicator: () =>
    set((state) => ({
      statusIndicatorVisible: !state.statusIndicatorVisible,
    })),

  setStatusIndicatorPosition: (position) =>
    set({
      statusIndicatorPosition: position,
    }),

  // Cursor highlight actions (Requirements: FR-4.5)
  toggleCursorHighlight: () =>
    set((state) => ({
      cursorHighlight: {
        ...state.cursorHighlight,
        enabled: !state.cursorHighlight.enabled,
      },
    })),

  setCursorHighlightConfig: (config) =>
    set((state) => ({
      cursorHighlight: {
        ...state.cursorHighlight,
        ...config,
      },
    })),

  // Click actions
  addClick: (position) => {
    const state = get();
    const number = state.clickCounter + 1;
    const color = getColorForClick(number);

    set({
      clicks: [
        ...state.clicks,
        {
          id: crypto.randomUUID(),
          number,
          position,
          color,
          timestamp: Date.now(),
          fadeState: 'visible',
        },
      ],
      clickCounter: number,
    });
  },

  updateClickFadeState: (id, fadeState) =>
    set((state) => ({
      clicks: state.clicks.map((click) =>
        click.id === id ? { ...click, fadeState } : click
      ),
    })),

  removeClick: (id) =>
    set((state) => ({
      clicks: state.clicks.filter((click) => click.id !== id),
    })),

  clearClicks: () =>
    set({
      clicks: [],
      clickCounter: 0,
    }),

  // Drawing actions
  addDrawing: (drawing) => {
    const state = get();
    const newDrawing: DrawingElement = {
      ...drawing,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      fadeState: 'visible',
      isPinned: state.isPinMode, // Use current pin mode
    };

    set({
      drawings: [...state.drawings, newDrawing],
    });
  },

  updateDrawingFadeState: (id, fadeState) =>
    set((state) => ({
      drawings: state.drawings.map((drawing) =>
        drawing.id === id ? { ...drawing, fadeState } : drawing
      ),
    })),

  removeDrawing: (id) =>
    set((state) => ({
      drawings: state.drawings.filter((drawing) => drawing.id !== id),
    })),

  clearDrawings: () =>
    set({
      drawings: [],
    }),

  togglePinMode: () =>
    set((state) => ({
      isPinMode: !state.isPinMode,
    })),

  setColor: (color) =>
    set({
      currentColor: color,
    }),

  cycleColor: () =>
    set((state) => {
      const colors: ColorKey[] = ['COLOR_1', 'COLOR_2', 'COLOR_3'];
      const currentIndex = colors.indexOf(state.currentColor);
      const nextIndex = (currentIndex + 1) % colors.length;
      return {
        currentColor: colors[nextIndex],
      };
    }),

  // Keyboard actions
  updateKeyboard: (updates) =>
    set((state) => ({
      keyboard: {
        ...state.keyboard,
        ...updates,
      },
    })),

  setKeyboardModifiers: (modifiers) =>
    set((state) => ({
      keyboard: {
        ...state.keyboard,
        modifiers: {
          ...state.keyboard.modifiers,
          ...modifiers,
        },
      },
    })),

  setKeyboardText: (text, isPasswordField = false) =>
    set((state) => ({
      keyboard: {
        ...state.keyboard,
        currentText: text,
        isPasswordField,
      },
    })),

  clearKeyboardText: () =>
    set((state) => ({
      keyboard: {
        ...state.keyboard,
        currentText: '',
        isPasswordField: false,
      },
    })),

  toggleKeyboardDisplay: () =>
    set((state) => ({
      keyboard: {
        ...state.keyboard,
        isVisible: !state.keyboard.isVisible,
      },
    })),

  setKeyboardPosition: (position) =>
    set((state) => ({
      keyboard: {
        ...state.keyboard,
        displayPosition: position,
      },
    })),

  // Element picker actions
  toggleElementPicker: () =>
    set((state) => ({
      elementPickerEnabled: !state.elementPickerEnabled,
      hoveredElement: undefined, // Clear hovered element when toggling
    })),

  setHoveredElement: (element) =>
    set({
      hoveredElement: element,
    }),

  selectElement: (element) =>
    set((state) => ({
      selectedElements: [...state.selectedElements, element],
      hoveredElement: undefined, // Clear hover after selection
    })),

  removeSelectedElement: (timestamp) =>
    set((state) => ({
      selectedElements: state.selectedElements.filter(
        (el) => el.timestamp !== timestamp
      ),
    })),

  clearSelectedElements: () =>
    set({
      selectedElements: [],
    }),
}));

/**
 * Helper function to get color hex value
 */
export function getColorHex(colorKey: ColorKey): string {
  return COLORS[colorKey];
}

/**
 * Helper function to redact password text
 */
export function redactPassword(text: string): string {
  return '●'.repeat(text.length);
}

/**
 * Helper function to generate password placeholder for skill generation
 */
export function getPasswordPlaceholder(fieldName: string): string {
  return `\${env:${fieldName.toUpperCase()}_PASSWORD}`;
}
