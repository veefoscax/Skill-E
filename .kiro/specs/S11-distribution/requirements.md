# S11: Distribution & Packaging - Requirements

## Feature Description
Build and distribution system for creating installers for Windows, macOS, and Linux. Ensures easy installation, auto-updates, and proper signing for trusted distribution.

## User Stories

### US1: Easy Installation
**As a** user
**I want** a simple installer (one file)
**So that** I can install Skill-E without complexity

### US2: Cross-Platform
**As a** user
**I want** Skill-E on Windows, Mac, and Linux
**So that** I can use it on any computer

### US3: Auto-Updates
**As a** user
**I want** the app to update automatically
**So that** I always have the latest version

### US4: Trusted Distribution
**As a** user
**I want** signed installers
**So that** my OS doesn't warn about untrusted software

## Functional Requirements

### Build System
- **FR-11.1**: Build for Windows (x64)
- **FR-11.2**: Build for macOS (Intel + Apple Silicon)
- **FR-11.3**: Build for Linux (x64, AppImage/deb)
- **FR-11.4**: Single command build for all platforms
- **FR-11.5**: CI/CD pipeline for automated builds

### Windows Distribution
- **FR-11.6**: MSI installer
- **FR-11.7**: Optional: EXE (NSIS) installer
- **FR-11.8**: Code signing (if certificate available)
- **FR-11.9**: Start menu shortcut
- **FR-11.10**: System tray on startup option

### macOS Distribution
- **FR-11.11**: DMG with drag-to-Applications
- **FR-11.12**: Universal binary (Intel + ARM)
- **FR-11.13**: Code signing + notarization (if Apple Developer account)
- **FR-11.14**: Menu bar icon integration
- **FR-11.15**: Gatekeeper compatible

### Linux Distribution
- **FR-11.16**: AppImage (universal, no deps)
- **FR-11.17**: .deb package (Debian/Ubuntu)
- **FR-11.18**: Optional: .rpm (Fedora/RHEL)
- **FR-11.19**: Desktop file for app menu
- **FR-11.20**: System tray integration

### Auto-Updates
- **FR-11.21**: Check for updates on startup
- **FR-11.22**: Download updates in background
- **FR-11.23**: Install update on next launch
- **FR-11.24**: Optional: Manual update check button

## Non-Functional Requirements

- **NFR-11.1**: Bundle size < 30MB per platform
- **NFR-11.2**: Install time < 30 seconds
- **NFR-11.3**: No admin rights required (portable option)
- **NFR-11.4**: Clean uninstall (no leftover files)

## Acceptance Criteria

### AC1: Windows Build
- [ ] `pnpm tauri build` produces MSI
- [ ] MSI installs correctly
- [ ] App appears in Start Menu
- [ ] System tray works
- [ ] Uninstall removes all files
- _Requirements: FR-11.1, FR-11.6, FR-11.9, FR-11.10_

### AC2: macOS Build
- [ ] `pnpm tauri build` produces DMG
- [ ] DMG opens with Applications shortcut
- [ ] Drag to install works
- [ ] App runs without Gatekeeper issues
- [ ] Universal binary runs on Intel + M1/M2
- _Requirements: FR-11.2, FR-11.11, FR-11.12, FR-11.15_

### AC3: Linux Build
- [ ] `pnpm tauri build` produces AppImage
- [ ] AppImage runs on Ubuntu 22.04+
- [ ] .deb installs correctly
- [ ] App appears in application menu
- _Requirements: FR-11.3, FR-11.16, FR-11.17, FR-11.19_

### AC4: Auto-Updates
- [ ] App checks for updates on launch
- [ ] Update notification shown when available
- [ ] Update downloads in background
- [ ] App updates on restart
- _Requirements: FR-11.21, FR-11.22, FR-11.23_

### AC5: CI/CD
- [ ] GitHub Actions builds all 3 platforms
- [ ] Releases created automatically on tag
- [ ] Artifacts uploaded to release
- _Requirements: FR-11.5_

## Dependencies
- S01: App Core (must be complete)
- All other specs (complete app)

## Files to Create
- .github/workflows/build.yml
- .github/workflows/release.yml
- src-tauri/tauri.conf.json (bundle config)
- scripts/build-all.ps1
- scripts/build-all.sh

## Tauri Bundle Configuration

```json
{
  "bundle": {
    "active": true,
    "targets": ["msi", "dmg", "appimage", "deb"],
    "identifier": "com.skille.app",
    "icon": ["icons/icon.ico", "icons/icon.icns", "icons/icon.png"],
    "resources": [],
    "windows": {
      "wix": {
        "language": "en-US"
      }
    },
    "macOS": {
      "minimumSystemVersion": "10.15"
    },
    "linux": {
      "appimage": {
        "bundleMediaFramework": true
      }
    }
  }
}
```

## GitHub Actions Workflow

```yaml
name: Build & Release
on:
  push:
    tags: ['v*']

jobs:
  build:
    strategy:
      matrix:
        platform: [ubuntu-22.04, windows-latest, macos-latest]
    runs-on: ${{ matrix.platform }}
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
      - uses: dtolnay/rust-toolchain@stable
      - run: pnpm install
      - run: pnpm tauri build
      - uses: softprops/action-gh-release@v1
        with:
          files: |
            src-tauri/target/release/bundle/**/*.msi
            src-tauri/target/release/bundle/**/*.dmg
            src-tauri/target/release/bundle/**/*.AppImage
            src-tauri/target/release/bundle/**/*.deb
```

## Priority

| Platform | Priority | Notes |
|----------|----------|-------|
| Windows | P1 | Primary target |
| macOS | P1 | User has Mac for testing |
| Linux | P2 | Nice to have |
| Auto-updates | P2 | After hackathon |
| Code signing | P3 | Requires certificates |
