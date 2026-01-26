# S01: App Core - Requirements

## Feature Description
Core Tauri 2.0 application with floating toolbar UI, system tray integration, and cross-platform support (Windows + macOS).

## User Stories

### US1: Floating Toolbar
**As a** user
**I want** a small floating toolbar that appears when needed
**So that** I can access recording controls without cluttering my screen

### US2: Quick Access
**As a** user
**I want** global hotkeys to control recording
**So that** I don't need to click the toolbar

### US3: Position Memory
**As a** user
**I want** the toolbar to remember its position
**So that** it's always where I left it

### US4: System Tray
**As a** user
**I want** the app to live in the system tray
**So that** it's always available but not in the way

## Functional Requirements

- **FR-1.1**: App must launch with a floating toolbar overlay
- **FR-1.2**: Toolbar must remain always-on-top of other windows
- **FR-1.3**: Toolbar must be draggable to any screen position
- **FR-1.4**: App must minimize to system tray when closed (near the clock)
- **FR-1.5**: App must support global hotkeys for recording control
- **FR-1.6**: App must persist window position across sessions
- **FR-1.7**: System tray icon with context menu
- **FR-1.8**: Click tray icon to show/hide toolbar
- **FR-1.9**: Cross-platform: Windows (primary) + macOS (secondary)

## Non-Functional Requirements

- **NFR-1.1**: App bundle size < 20MB
- **NFR-1.2**: Startup time < 1 second
- **NFR-1.3**: Memory usage < 100MB idle
- **NFR-1.4**: Cross-platform support (Windows AND macOS)
- **NFR-1.5**: Easy installation (single file installer)
- **NFR-1.6**: **Premium UI**: Use shadcn/ui (Stable) + platform-native glass effects (Mica/Vibrancy)
- **NFR-1.7**: **Clean Aesthetic**: "Mira" style - Neutral colors, Nunito Sans font, subtle accents.

## Design System (Mira Configuration)

### Visual Language
- **Typography**: **Nunito Sans** (Primary for all UI)
- **Colors**: **Neutral** palette (Zinc/Slate based)
- **Radius**: `0.5rem` (medium rounded)
- **Icons**: Lucide React
- **Theme**: Dark Mode default, heavily relying on platform transparency

### Component Stack
- **Framework**: Tailwind CSS v3.4+ (Stable)
- **Library**: shadcn/ui (customized via components.json)
- **Base**: `base` style, `neutral` base color
- **Menu Accent**: `subtle`

### Platform Integration
- **Windows**: Use `tauri-plugin-window-vibrancy` for Mica/Acrylic background
- **macOS**: Use `tauri-plugin-window-vibrancy` for NSVisualEffectMaterial (HUD or Popover)

## System Permissions

### macOS Permissions Required

| Permission | Purpose | How to Request |
|------------|---------|----------------|
| **Screen Recording** | Capture screenshots | System Preferences → Security → Screen Recording |
| **Accessibility** | Global hotkeys, click tracking | System Preferences → Security → Accessibility |
| **Microphone** | Audio recording | System Preferences → Security → Microphone |

**Implementation:**
```rust
// Check permissions on macOS
#[cfg(target_os = "macos")]
fn check_permissions() -> PermissionStatus {
    // Use macos-accessibility-client crate
    // Show dialog if not granted
}
```

**First Launch Flow:**
1. App detects missing permissions
2. Shows explanation dialog with "Open System Preferences" button
3. User grants permission
4. App confirms permission granted

### Windows Permissions

| Permission | Purpose | How to Handle |
|------------|---------|---------------|
| **Screen Capture** | Usually allowed by default | No special permission needed |
| **Microphone** | Audio recording | Windows Settings → Privacy → Microphone |
| **Run as Admin** | NOT required | App works without admin rights |

**Note:** Windows is more permissive than macOS. Most features work without special permissions.

### Linux Permissions

| Permission | Purpose | How to Handle |
|------------|---------|---------------|
| **Screen Capture (Wayland)** | Portal-based access | Use xdg-desktop-portal |
| **Screen Capture (X11)** | Usually allowed | No special permission |
| **Microphone** | Audio recording | PipeWire/PulseAudio access |

### Functional Requirements for Permissions
- **FR-1.10**: App must check for required permissions on startup
- **FR-1.11**: App must show friendly permission request dialog
- **FR-1.12**: App must guide user to System Preferences (macOS)
- **FR-1.13**: App must handle permission denial gracefully

## Platform-Specific Behavior

### Windows
- System tray icon appears in taskbar notification area
- Right-click for context menu
- Left-click to show/hide toolbar
- Installer: MSI or EXE

### macOS
- Menu bar icon (top right, near clock)
- Click for dropdown menu
- Option to keep in Dock or remove
- Installer: DMG with drag to Applications

## Acceptance Criteria

### AC1: Window Behavior
- [ ] Window appears as small toolbar (300x60px)
- [ ] Window has no native decorations
- [ ] Window is transparent
- [ ] Window stays on top of all windows
- [ ] Works identically on Windows and macOS
- _Requirements: FR-1.1, FR-1.2, FR-1.9_

### AC2: Drag Behavior
- [ ] Window can be dragged anywhere on screen
- [ ] Drag is smooth with no lag
- [ ] Window snaps to screen edges (optional)
- _Requirements: FR-1.3_

### AC3: System Tray
- [ ] App shows tray icon when running
- [ ] Clicking X minimizes to tray (not closes)
- [ ] Right-click tray shows context menu
- [ ] Context menu has: Show/Hide, Start Recording, Settings, Quit
- [ ] Left-click/single-click toggles toolbar visibility
- [ ] Icon appears near clock on both Windows and macOS
- _Requirements: FR-1.4, FR-1.7, FR-1.8_

### AC4: Hotkeys
- [ ] Ctrl+Shift+R (Cmd+Shift+R on Mac) toggles recording
- [ ] Ctrl+Shift+A (Cmd+Shift+A on Mac) toggles annotation mode
- [ ] Esc cancels current recording
- [ ] Hotkeys work even when app is not focused
- _Requirements: FR-1.5_

### AC5: Persistence
- [ ] Window position saved to local storage
- [ ] Position restored on app launch
- [ ] Invalid positions (off-screen) are corrected
- _Requirements: FR-1.6_

### AC6: Cross-Platform
- [ ] Builds successfully on Windows
- [ ] Builds successfully on macOS
- [ ] UI looks consistent on both platforms
- [ ] System tray works on both platforms
- _Requirements: FR-1.9, NFR-1.4_

## Dependencies
- None (base spec)

## Files to Create
- src/App.tsx
- src/components/Toolbar/Toolbar.tsx
- src/stores/recording.ts
- src/stores/settings.ts
- src-tauri/src/main.rs
- src-tauri/src/lib.rs
- src-tauri/src/commands/window.rs
- src-tauri/src/commands/tray.rs

## Tauri Plugins Required
- `tauri-plugin-global-shortcut` - Hotkeys
- `tauri-plugin-fs` - File access
- `tauri-plugin-persisted-scope` - Permission persistence
- `tray-icon` - System tray (built into Tauri 2.0)
