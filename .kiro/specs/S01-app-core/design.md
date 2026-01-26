# S01: App Core - Design

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Skill-E App                          │
├─────────────────────────────────────────────────────────────┤
│  Frontend (React + TypeScript)                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  Toolbar    │  │  Overlay    │  │  Settings   │         │
│  │  Component  │  │  Canvas     │  │  Panel      │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
├─────────────────────────────────────────────────────────────┤
│  State Management (Zustand)                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  Recording  │  │  Annotation │  │  Settings   │         │
│  │  Store      │  │  Store      │  │  Store      │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
├─────────────────────────────────────────────────────────────┤
│  Tauri Bridge (IPC)                                         │
├─────────────────────────────────────────────────────────────┤
│  Backend (Rust)                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  Screen     │  │  Window     │  │  File       │         │
│  │  Capture    │  │  Manager    │  │  System     │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

## Window Configuration

```json
// tauri.conf.json
{
  "windows": [
    {
      "label": "main",
      "title": "Skill-E",
      "width": 300,
      "height": 60,
      "resizable": false,
      "decorations": false,
      "transparent": true,
      "alwaysOnTop": true,
      "skipTaskbar": true
    }
  ]
}
```

## Key Components

### FloatingToolbar
- Draggable window
- Recording controls
- State indicators

### OverlayWindow
- Full-screen transparent
- Canvas for annotations
- Click-through when not annotating

## State Management

```typescript
// stores/recording.ts
interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  startTime: number | null;
  duration: number;
  frames: CaptureFrame[];
}

// stores/settings.ts
interface SettingsState {
  whisperApiKey: string;
  claudeApiKey: string;
  outputDir: string;
  captureInterval: number;
}
```

## File Structure

```
src/
├── components/
│   ├── Toolbar/
│   ├── Overlay/
│   └── Settings/
├── stores/
│   ├── recording.ts
│   ├── annotations.ts
│   └── settings.ts
├── hooks/
│   ├── useRecording.ts
│   └── useAnnotations.ts
├── lib/
│   └── tauri-api.ts
└── App.tsx

src-tauri/
├── src/
│   ├── main.rs
│   ├── commands/
│   │   ├── capture.rs
│   │   └── window.rs
│   └── lib.rs
└── Cargo.toml
```
