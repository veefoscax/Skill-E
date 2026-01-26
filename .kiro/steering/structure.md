# Project Structure: Skill-E

```
Skill-E/
├── .kiro/
│   ├── hooks/                   # Automation hooks
│   │   ├── auto-devlog-updater.json
│   │   ├── complete-task-automation.json
│   │   └── README.md
│   ├── prompts/                 # Prompt templates
│   │   ├── devlog.md
│   │   └── implement-spec.md
│   ├── specs/                   # Feature specifications
│   │   ├── S01-app-core/
│   │   ├── S02-screen-capture/
│   │   ├── S03-audio-recording/
│   │   ├── S04-overlay-ui/
│   │   ├── S05-processing/
│   │   ├── S06-skill-export/
│   │   ├── S07-variable-detection/
│   │   ├── S08-llm-providers/
│   │   ├── S09-context-search/
│   │   └── S10-skill-validation/
│   └── steering/                # Project steering docs
│       ├── product.md
│       ├── structure.md
│       ├── tech.md
│       └── workflow.md
│
├── src/                         # React frontend
│   ├── components/              # React components
│   │   ├── ui/                  # Base UI components
│   │   ├── recording/           # Recording-related
│   │   ├── overlay/             # Overlay and annotations
│   │   ├── processing/          # Processing UI
│   │   ├── skill/               # Skill preview/editor
│   │   └── settings/            # Settings panels
│   ├── lib/                     # Utilities and logic
│   │   ├── providers/           # LLM providers
│   │   ├── recording/           # Recording logic
│   │   ├── processing/          # Processing pipeline
│   │   └── skill/               # Skill generation
│   ├── stores/                  # Zustand stores
│   ├── types/                   # TypeScript types
│   ├── App.tsx                  # Main app
│   └── main.tsx                 # Entry point
│
├── src-tauri/                   # Rust backend
│   ├── src/
│   │   ├── main.rs              # Entry point
│   │   ├── lib.rs               # Module declarations
│   │   ├── recording.rs         # Screen/audio capture
│   │   ├── overlay.rs           # Overlay window
│   │   └── commands.rs          # Tauri commands
│   ├── Cargo.toml               # Rust dependencies
│   └── tauri.conf.json          # Tauri configuration
│
├── assets/                      # Static assets
│   └── skille_bot.PNG           # Logo
│
├── DEVLOG.md                    # Development log
└── README.md                    # Project readme
```

## Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| React Component | PascalCase | `RecordingToolbar.tsx` |
| Hook | camelCase + `use` | `useRecording.ts` |
| Store | camelCase | `recordingStore.ts` |
| Utility | camelCase | `transcription.ts` |
| Type file | .ts extension | `types.ts` |
| Interface | PascalCase + I prefix | `IRecordingSession` or just `RecordingSession` |
| Constant | UPPER_SNAKE_CASE | `MAX_DURATION` |
| Rust module | snake_case | `screen_capture.rs` |

## Import Order

1. React/external libraries
2. Components
3. Hooks/stores
4. Utils
5. Types
6. Styles

## File Organization Guidelines

- `/src/components/` - UI components organized by feature
- `/src/lib/` - Business logic, providers, utilities
- `/src/stores/` - Zustand state stores
- `/src/types/` - TypeScript interfaces and types
- `/src-tauri/` - Rust backend code
