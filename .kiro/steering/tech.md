# Technology Stack: Skill-E

## Core Technologies

| Category | Technology | Version |
|----------|------------|---------|
| Desktop Framework | Tauri | 2.x |
| UI Framework | React | 18.x |
| Language (Frontend) | TypeScript | 5.x |
| Language (Backend) | Rust | 1.75+ |
| Styling | **Tailwind CSS** | **3.4+ (Stable)** |
| Components | **shadcn/ui** | Latest (Mira Config) |
| Fonts | **Nunito Sans** | @fontsource |
| State Management | Zustand | 4.x |
| Build | Vite | 5.x |

## UI/UX Design System (CRITICAL)

### Core Philosophy
**"Premium Native Feel, No generic AI Slop"**
- ❌ **AVOID**: Generic purple gradients, "AI sparkle" icons everywhere, flat/boring SaaS look.
- ✅ **USE**: Clean typography (**Nunito Sans**), subtle frosted glass, platform-native materials.

### Configuration (Mira / Neutral)
We use a specific **shadcn/ui** configuration to achieve the "Mira" look:
- **Base**: `base`
- **Style**: `new-york` (closest to Mira)
- **Color**: `neutral`
- **Radius**: `0.5`
- **Font**: `Nunito Sans`
- **Icons**: `Lucide`

### Platform-Specific Visuals

| Feature | Windows (11 style) | macOS (Apple style) |
|---------|-------------------|---------------------|
| **Background** | Mica / Acrylic effect | UIBlurEffect / Vibrancy |
| **Borders** | Subtle, 1px solid #E5E5E5 | Smooth, faint transparency |
| **Typography** | Segoe UI variable | SF Pro Display |
| **Corners** | Rounded (8px or 12px) | Squircle / Rounded (10-14px) |
| **Shadows** | Depth-based (Elevation) | Soft, diffused |

### Component Library: shadcn/ui
We use **shadcn/ui** as the base because it offers:
- **Radix UI** primitives (accessible by default)
- **Tailwind** styling (easy to customize)
- **Copy-paste** ownership (we own the code)

**Modifications for Skill-E:**
- **Toolbar**: Custom, reduced density, glass background.
- **Main Window**: Standard shadcn/ui layout but with platform-specific background override.

## Tauri 2.0 Configuration

### Window Vibrancy (Glass Effect)
Use `tauri-plugin-window-vibrancy` to achieve the native premium feel.

```rust
// Windows: Apply Mica or Acrylic
#[cfg(target_os = "windows")]
apply_mica(&window, Some(true));

// macOS: Apply NSVisualEffectMaterial
#[cfg(target_os = "macos")]
apply_vibrancy(&window, NSVisualEffectMaterial::HudWindow, None, None);
```

### Window Types
```rust
// Main toolbar (Glass, always on top)
WindowBuilder::new("toolbar", "Skill-E")
    .always_on_top(true)
    .decorations(false) // Custom titlebar needed
    .transparent(true)  // For glass effect
    .resizable(false)
    .inner_size(300.0, 60.0)

// Overlay (Transparent click-through)
WindowBuilder::new("overlay", "Overlay")
    .transparent(true)
    .always_on_top(true)
    .fullscreen(true)
    .skip_taskbar(true)

// Main window (Editor/Preview)
WindowBuilder::new("main", "Skill Preview")
    .inner_size(1024.0, 768.0)
    .visible(false) // Start hidden, show when needed
```

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

## Development Guidelines

### Documentation Rules
- **DEVLOG.md is the single source of truth**
- **Document only after verification**

### File Organization
- `/src/components/` - React components
- `/src/lib/` - Business logic and utilities
- `/src/stores/` - Zustand stores
- `/src-tauri/src/` - Rust backend
