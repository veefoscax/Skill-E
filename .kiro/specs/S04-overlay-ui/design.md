# S04: Overlay UI - Design

## Architecture

```
┌───────────────────────────────────────────────────────────────────┐
│                       Overlay Window (Tauri)                       │
│                   Transparent, Always-on-Top, Click-Through        │
├───────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │                    Drawing Canvas Layer                      │  │
│  │  - Arrows, Rectangles, Markers                              │  │
│  │  - Fade animation or persistent                             │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │                    Click Indicators Layer                   │  │
│  │  - Numbered circles (1, 2, 3...)                           │  │
│  │  - Ripple animations                                        │  │
│  │  - 3-color rotation                                         │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │               Keyboard Display (Bottom Corner)              │  │
│  │  [Ctrl] + [Shift] + [S]                                     │  │
│  │  Typing: "Hello world..."                                   │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │              Element Highlighter (When enabled)             │  │
│  │  - Outline around hovered elements                          │  │
│  │  - Selector tooltip                                         │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                    │
└───────────────────────────────────────────────────────────────────┘
```

## Data Structures

```typescript
// Color Palette (Fixed 3 colors)
const COLORS = {
  COLOR_1: '#FF4444', // Red
  COLOR_2: '#4488FF', // Blue
  COLOR_3: '#44CC44', // Green
} as const;

type ColorKey = keyof typeof COLORS;

// Click Indicator
interface ClickIndicator {
  id: string;
  number: number;           // 1, 2, 3...
  position: { x: number; y: number };
  color: ColorKey;          // Cycles through COLOR_1 → COLOR_2 → COLOR_3
  timestamp: number;
  fadeState: 'visible' | 'fading' | 'hidden';
}

// Drawing Element
interface DrawingElement {
  id: string;
  type: 'dot' | 'arrow' | 'rectangle';
  color: ColorKey;
  startPoint: { x: number; y: number };
  endPoint?: { x: number; y: number };  // For arrow/rectangle
  timestamp: number;
  isPinned: boolean;
  fadeState: 'visible' | 'fading' | 'hidden';
}

// Keyboard Input
interface KeyboardState {
  modifiers: {
    shift: boolean;
    ctrl: boolean;
    alt: boolean;
    meta: boolean;  // Cmd on Mac
  };
  currentText: string;
  isPasswordField: boolean;
  displayPosition: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
}

// Element Selection
interface SelectedElement {
  cssSelector: string;
  xpath: string;
  tagName: string;
  textContent: string;
  boundingBox: { x: number; y: number; width: number; height: number };
  screenshot?: string;  // Base64 of element only
}

// Overlay State
interface OverlayState {
  isActive: boolean;
  isPinMode: boolean;
  currentColor: ColorKey;
  clicks: ClickIndicator[];
  drawings: DrawingElement[];
  keyboard: KeyboardState;
  elementPickerEnabled: boolean;
  hoveredElement?: SelectedElement;
  selectedElements: SelectedElement[];
}
```

## Click Visualization

### Color Cycling Logic
```typescript
function getColorForClick(clickNumber: number): ColorKey {
  const colors: ColorKey[] = ['COLOR_1', 'COLOR_2', 'COLOR_3'];
  return colors[(clickNumber - 1) % 3];
}

// Click 1 = Red, Click 2 = Blue, Click 3 = Green
// Click 4 = Red, Click 5 = Blue, Click 6 = Green...
```

### Ripple Animation
```css
@keyframes click-ripple {
  0% {
    transform: scale(0);
    opacity: 1;
  }
  50% {
    transform: scale(1.5);
    opacity: 0.6;
  }
  100% {
    transform: scale(2);
    opacity: 0;
  }
}

.click-indicator {
  animation: click-ripple 0.5s ease-out;
}
```

### Fade Animation
```css
@keyframes fade-out {
  0% { opacity: 1; }
  70% { opacity: 1; }
  100% { opacity: 0; }
}

.click-indicator:not(.pinned) {
  animation: fade-out 3s ease-out forwards;
}
```

## Drawing Tools

### Gesture Detection
```typescript
interface DrawingGesture {
  startPoint: { x: number; y: number };
  endPoint: { x: number; y: number };
  duration: number;  // ms
}

function detectDrawingType(gesture: DrawingGesture): 'dot' | 'arrow' | 'rectangle' {
  const dx = Math.abs(gesture.endPoint.x - gesture.startPoint.x);
  const dy = Math.abs(gesture.endPoint.y - gesture.startPoint.y);
  const distance = Math.sqrt(dx * dx + dy * dy);

  // Tap = dot (very short drag)
  if (distance < 10 && gesture.duration < 200) {
    return 'dot';
  }

  // Diagonal drag = rectangle
  if (dx > 20 && dy > 20) {
    return 'rectangle';
  }

  // Any other drag = arrow
  return 'arrow';
}
```

### Drawing Rendering
```typescript
// Dot: Circle at position
<circle cx={x} cy={y} r={8} fill={color} />

// Arrow: Line with arrowhead
<line x1={startX} y1={startY} x2={endX} y2={endY} stroke={color} strokeWidth={3} />
<polygon points={arrowhead} fill={color} />

// Rectangle: Outline rectangle
<rect x={minX} y={minY} width={width} height={height} 
      stroke={color} strokeWidth={3} fill="none" />
```

## Keyboard Display

### Layout
```
┌─────────────────────────────────────┐
│  [Ctrl] + [Shift] + [S]             │  ← Modifier keys
│  ─────────────────────────────────  │
│  Typing: Hello world...             │  ← Current input
│  Password: ●●●●●●●●                 │  ← Redacted
└─────────────────────────────────────┘
```

### Password Detection
```typescript
function isPasswordField(element: HTMLElement): boolean {
  return (
    element.getAttribute('type') === 'password' ||
    element.getAttribute('autocomplete')?.includes('password') ||
    element.id.toLowerCase().includes('password') ||
    element.name?.toLowerCase().includes('password')
  );
}

function redactPassword(text: string): string {
  return '●'.repeat(text.length);
}

// For skill generation, offer variable reference
function getPasswordPlaceholder(fieldName: string): string {
  return `\${env:${fieldName.toUpperCase()}_PASSWORD}`;
}
```

## Browser Element Selector

### Element Highlighting
```typescript
// Inject CSS into page for highlighting
const HIGHLIGHT_STYLE = `
  .skill-e-highlight {
    outline: 2px solid #FF4444 !important;
    outline-offset: 2px !important;
    background: rgba(255, 68, 68, 0.1) !important;
  }
`;

function highlightElement(element: Element) {
  element.classList.add('skill-e-highlight');
}

function getSelector(element: Element): string {
  // Generate unique CSS selector
  // Prefer: ID > data-testid > class + nth-child
}
```

### Selector Generation Strategy
1. If element has `id` → use `#id`
2. If element has `data-testid` → use `[data-testid="value"]`
3. If element has unique class → use `.class`
4. Otherwise → generate path with `nth-child`

## UI Components

### ClickIndicator.tsx
```tsx
function ClickIndicator({ click }: { click: ClickIndicator }) {
  return (
    <div 
      className={`click-indicator ${click.isPinned ? 'pinned' : ''}`}
      style={{
        left: click.position.x,
        top: click.position.y,
        backgroundColor: COLORS[click.color],
      }}
    >
      <span className="click-number">{click.number}</span>
      <div className="ripple" />
    </div>
  );
}
```

### DrawingCanvas.tsx
```tsx
function DrawingCanvas({ drawings, onDraw }: Props) {
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<DrawingGesture | null>(null);

  return (
    <svg className="drawing-canvas" onMouseDown={handleStart} onMouseUp={handleEnd}>
      {drawings.map(drawing => (
        <DrawingElement key={drawing.id} drawing={drawing} />
      ))}
      {isDrawing && currentPath && (
        <DrawingPreview path={currentPath} />
      )}
    </svg>
  );
}
```

### KeyboardDisplay.tsx
```tsx
function KeyboardDisplay({ keyboard }: { keyboard: KeyboardState }) {
  return (
    <div className={`keyboard-display ${keyboard.displayPosition}`}>
      <div className="modifiers">
        {keyboard.modifiers.ctrl && <span className="key">Ctrl</span>}
        {keyboard.modifiers.shift && <span className="key">Shift</span>}
        {keyboard.modifiers.alt && <span className="key">Alt</span>}
        {keyboard.modifiers.meta && <span className="key">Cmd</span>}
      </div>
      <div className="typed-text">
        {keyboard.isPasswordField 
          ? redactPassword(keyboard.currentText)
          : keyboard.currentText
        }
      </div>
    </div>
  );
}
```

## Overlay Store

```typescript
// src/stores/overlay.ts
import { create } from 'zustand';

interface OverlayStore extends OverlayState {
  // Click actions
  addClick: (position: { x: number; y: number }) => void;
  clearClicks: () => void;
  
  // Drawing actions
  addDrawing: (drawing: Omit<DrawingElement, 'id' | 'timestamp'>) => void;
  clearDrawings: () => void;
  togglePinMode: () => void;
  setColor: (color: ColorKey) => void;
  
  // Keyboard actions
  updateKeyboard: (state: Partial<KeyboardState>) => void;
  
  // Element picker actions
  toggleElementPicker: () => void;
  setHoveredElement: (element: SelectedElement | undefined) => void;
  selectElement: (element: SelectedElement) => void;
}

export const useOverlayStore = create<OverlayStore>((set, get) => ({
  isActive: false,
  isPinMode: false,
  currentColor: 'COLOR_1',
  clicks: [],
  drawings: [],
  keyboard: {
    modifiers: { shift: false, ctrl: false, alt: false, meta: false },
    currentText: '',
    isPasswordField: false,
    displayPosition: 'bottom-left',
  },
  elementPickerEnabled: false,
  selectedElements: [],

  addClick: (position) => {
    const clicks = get().clicks;
    const number = clicks.length + 1;
    const color = getColorForClick(number);
    
    set({
      clicks: [...clicks, {
        id: crypto.randomUUID(),
        number,
        position,
        color,
        timestamp: Date.now(),
        fadeState: 'visible',
      }],
    });
  },
  
  // ... other actions
}));
```

## Hotkey Integration

```typescript
// Global hotkeys for overlay
const OVERLAY_HOTKEYS = {
  '1': () => store.setColor('COLOR_1'),
  '2': () => store.setColor('COLOR_2'),
  '3': () => store.setColor('COLOR_3'),
  'p': () => store.togglePinMode(),
  'c': () => store.clearDrawings(),
  'e': () => store.toggleElementPicker(),
  'k': () => store.toggleKeyboardDisplay(),
};
```
