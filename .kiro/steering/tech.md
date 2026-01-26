# Technology Stack: Skill-E

## Core Technologies

| Category | Technology | Version |
|----------|------------|---------|
| Desktop Framework | Tauri | 2.x |
| UI Framework | React | 18.x |
| Language (Frontend) | TypeScript | 5.x |
| Language (Backend) | Rust | 1.75+ |
| Styling | CSS Modules or Tailwind | - |
| State Management | Zustand | 4.x |
| Build | Vite | 5.x |

## Cross-Platform Support

### Target Platforms
| Platform | Priority | Status |
|----------|----------|--------|
| **Windows** | Primary | Must work perfectly |
| **macOS** | Secondary | Must work, tested on user's Mac |

### Platform-Specific Features

#### System Tray
| Platform | Location | Behavior |
|----------|----------|----------|
| Windows | Taskbar notification area (near clock) | Right-click menu, left-click toggle |
| macOS | Menu bar (top right, near clock) | Click for dropdown menu |

#### Installers
| Platform | Format | Tool |
|----------|--------|------|
| Windows | MSI / EXE | Tauri bundler (WiX) |
| macOS | DMG / .app | Tauri bundler |

#### Hotkeys
| Action | Windows | macOS |
|--------|---------|-------|
| Toggle Recording | Ctrl+Shift+R | Cmd+Shift+R |
| Toggle Annotation | Ctrl+Shift+A | Cmd+Shift+A |
| Cancel Recording | Esc | Esc |

### Build Commands
```bash
# Development (current platform)
pnpm tauri dev

# Build for current platform
pnpm tauri build

# Build specific platform (CI/CD)
pnpm tauri build --target x86_64-pc-windows-msvc  # Windows
pnpm tauri build --target aarch64-apple-darwin    # macOS ARM
pnpm tauri build --target x86_64-apple-darwin     # macOS Intel
```

## Tauri 2.0 Configuration

### Key Plugins
- `tauri-plugin-fs` - File system access
- `tauri-plugin-shell` - Command execution
- `tauri-plugin-dialog` - File/folder dialogs
- `tauri-plugin-global-shortcut` - Hotkeys (F5, F6)
- `tauri-plugin-screenshot` or custom - Screen capture

### Window Types
```rust
// Main toolbar (always on top, small)
WindowBuilder::new("toolbar", "Skill-E")
    .always_on_top(true)
    .decorations(false)
    .resizable(false)
    .inner_size(300.0, 60.0)

// Overlay (full screen, transparent, click-through)
WindowBuilder::new("overlay", "Overlay")
    .transparent(true)
    .always_on_top(true)
    .fullscreen(true)
    .skip_taskbar(true)

// Main window (for preview/export)
WindowBuilder::new("main", "Skill Preview")
    .inner_size(1024.0, 768.0)
```

## LLM Providers (5 Essential Only)

| Provider | Use Case | API |
|----------|----------|-----|
| **OpenRouter** | Default, free tier | OpenAI-compatible |
| **Anthropic** | Claude API | Native |
| **OpenAI** | GPT-4 | Native |
| **Google** | Gemini | Native |
| **Ollama** | Local, free | OpenAI-compatible |

### Provider Pattern
```typescript
interface LLMProvider {
  chat(messages: Message[], options?: ChatOptions): AsyncIterable<string>;
  testConnection(): Promise<{ success: boolean; error?: string }>;
}

function createProvider(type: ProviderType, config: ProviderConfig): LLMProvider;
```

## Audio/Transcription

### Local Options
- Web Audio API for recording
- Whisper.cpp (local transcription)
- Whisper API (cloud, OpenAI)

### Recording Format
```typescript
interface AudioRecording {
  blob: Blob;             // WebM or WAV
  duration: number;       // seconds
  sampleRate: number;     // 16000 for Whisper
}
```

## Screen Capture

### Options
- Tauri screenshot plugin
- Native Windows API via Rust
- XCap library for cross-platform

### Capture Format
```typescript
interface Screenshot {
  timestamp: number;
  data: string;           // base64 PNG
  width: number;
  height: number;
  cursorPosition?: { x: number; y: number };
  activeWindow?: string;
}
```

## Architecture Patterns

### State Management with Zustand
```typescript
const useRecordingStore = create<RecordingState>()(...);
const useProviderStore = create<ProviderState>()(...);
const useSkillStore = create<SkillState>()(...);
```

### Tauri Commands
```rust
// Expose Rust functions to frontend
#[tauri::command]
async fn capture_screenshot(window: Window) -> Result<String, String> {
    // Capture and return base64
}

#[tauri::command]
async fn start_recording(app: AppHandle) -> Result<(), String> {
    // Start screen/audio recording
}
```

### IPC Pattern
```typescript
// Frontend → Backend
import { invoke } from '@tauri-apps/api/core';
const screenshot = await invoke<string>('capture_screenshot');

// Backend → Frontend
import { listen } from '@tauri-apps/api/event';
await listen('recording-frame', (event) => {
  handleFrame(event.payload);
});
```

## Development Guidelines

### Documentation Rules
- **DEVLOG.md is the single source of truth** - All development progress, fixes, and debugging sessions are documented in DEVLOG.md
- **Do not create separate documentation files** - No standalone fix summaries, debugging guides, or status reports outside DEVLOG.md
- **Document only after verification** - Do not add entries to DEVLOG.md until the fix is confirmed working through testing
- **Exception**: Specs in `.kiro/specs/` are the only other documentation allowed (requirements, design, tasks)

### File Organization
- `/src/components/` - React components
- `/src/lib/` - Business logic and utilities
- `/src/stores/` - Zustand stores
- `/src-tauri/src/` - Rust backend

### Naming Conventions
- Components: PascalCase (`RecordingToolbar.tsx`)
- Hooks: camelCase with `use` prefix (`useRecording.ts`)
- Types: PascalCase (`RecordingSession.ts`)
- Utils: camelCase (`transcription.ts`)
- Rust: snake_case (`screen_capture.rs`)

### Testing
- Unit tests for lib functions
- Integration tests for Tauri commands
- E2E tests for full recording flow
