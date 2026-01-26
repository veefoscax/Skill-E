# S02: Screen Capture - Design

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Screen Capture System                   │
├─────────────────────────────────────────────────────────┤
│  Frontend (TypeScript)                                   │
│  ┌─────────────────────────────────────────────────┐    │
│  │  useCapture() hook                               │    │
│  │  - startCapture()                                │    │
│  │  - stopCapture()                                 │    │
│  │  - getFrames()                                   │    │
│  └─────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────┤
│  Tauri Commands                                          │
│  - capture_screen                                        │
│  - get_active_window                                     │
│  - get_cursor_position                                   │
├─────────────────────────────────────────────────────────┤
│  Rust Backend                                            │
│  ┌─────────────────────────────────────────────────┐    │
│  │  tauri-plugin-screenshots                        │    │
│  │  + Windows API for window/cursor info            │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

## Data Structures

```typescript
interface CaptureFrame {
  id: string;
  timestamp: number;
  imagePath: string;
  activeWindow: WindowInfo;
  cursorPosition: { x: number; y: number };
}

interface WindowInfo {
  title: string;
  processName: string;
  bounds: { x: number; y: number; width: number; height: number };
}

interface CaptureSession {
  id: string;
  startTime: number;
  endTime?: number;
  frames: CaptureFrame[];
  intervalMs: number;
}
```

## Rust Commands

```rust
#[tauri::command]
fn capture_screen(output_path: &str) -> Result<(), String>

#[tauri::command]
fn get_active_window() -> Result<WindowInfo, String>

#[tauri::command]
fn get_cursor_position() -> Result<(i32, i32), String>
```

## Capture Loop

```typescript
// Pseudo-code for capture loop
async function captureLoop(session: CaptureSession) {
  while (isRecording) {
    const frame = await captureFrame();
    session.frames.push(frame);
    await sleep(session.intervalMs);
  }
}
```
