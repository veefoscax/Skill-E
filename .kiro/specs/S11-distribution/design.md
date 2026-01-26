# S11: Distribution & Packaging - Design

## Build Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│                    Build & Release Pipeline                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Source Code                                                 │
│       ↓                                                      │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  pnpm install                                        │    │
│  │  pnpm tauri build                                    │    │
│  └─────────────────────────────────────────────────────┘    │
│       ↓                                                      │
│  Platform Detection                                          │
│       ↓                                                      │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐                 │
│  │  Windows  │ │   macOS   │ │   Linux   │                 │
│  │    MSI    │ │    DMG    │ │ AppImage  │                 │
│  │   ~15MB   │ │   ~20MB   │ │   ~20MB   │                 │
│  └───────────┘ └───────────┘ └───────────┘                 │
│       ↓              ↓             ↓                        │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  GitHub Release                                      │    │
│  │  - Skill-E-1.0.0-x64.msi                            │    │
│  │  - Skill-E-1.0.0-universal.dmg                      │    │
│  │  - Skill-E-1.0.0.AppImage                           │    │
│  │  - skill-e_1.0.0_amd64.deb                          │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Tauri Configuration

### tauri.conf.json Bundle Section

```json
{
  "bundle": {
    "active": true,
    "targets": "all",
    "identifier": "com.skille.app",
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/128x128@2x.png",
      "icons/icon.icns",
      "icons/icon.ico"
    ],
    "resources": [],
    "externalBin": [],
    "copyright": "© 2025 Skill-E",
    "category": "DeveloperTool",
    "shortDescription": "Create Agent Skills by demonstration",
    "longDescription": "Skill-E enables creating Agent Skills through recorded demonstrations. Show what you want to do while narrating, and Skill-E generates a complete SKILL.md file.",
    "windows": {
      "certificateThumbprint": null,
      "digestAlgorithm": "sha256",
      "timestampUrl": "",
      "wix": {
        "language": "en-US",
        "dialogImagePath": "icons/wix-dialog.bmp",
        "bannerPath": "icons/wix-banner.bmp"
      }
    },
    "macOS": {
      "frameworks": [],
      "minimumSystemVersion": "10.15",
      "exceptionDomain": null,
      "signingIdentity": null,
      "providerShortName": null,
      "entitlements": null
    },
    "linux": {
      "deb": {
        "depends": []
      },
      "appimage": {
        "bundleMediaFramework": true
      }
    }
  }
}
```

## Icon Requirements

| File | Size | Platform |
|------|------|----------|
| icon.ico | Multi-size | Windows |
| icon.icns | Multi-size | macOS |
| 32x32.png | 32x32 | Linux |
| 128x128.png | 128x128 | Linux |
| 128x128@2x.png | 256x256 | macOS Retina |

## GitHub Actions Workflow

### .github/workflows/release.yml

```yaml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    permissions:
      contents: write
    strategy:
      fail-fast: false
      matrix:
        include:
          - platform: 'macos-latest'
            args: '--target universal-apple-darwin'
          - platform: 'ubuntu-22.04'
            args: ''
          - platform: 'windows-latest'
            args: ''

    runs-on: ${{ matrix.platform }}
    steps:
      - uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Setup node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - name: Install Rust stable
        uses: dtolnay/rust-toolchain@stable
        with:
          targets: ${{ matrix.platform == 'macos-latest' && 'aarch64-apple-darwin,x86_64-apple-darwin' || '' }}

      - name: Install dependencies (Ubuntu)
        if: matrix.platform == 'ubuntu-22.04'
        run: |
          sudo apt-get update
          sudo apt-get install -y libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf

      - name: Install frontend dependencies
        run: pnpm install

      - name: Build Tauri
        uses: tauri-apps/tauri-action@v0
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tagName: ${{ github.ref_name }}
          releaseName: 'Skill-E ${{ github.ref_name }}'
          releaseBody: |
            See CHANGELOG.md for details.
          releaseDraft: true
          prerelease: false
          args: ${{ matrix.args }}
```

## Auto-Update Configuration

### tauri.conf.json updater

```json
{
  "plugins": {
    "updater": {
      "active": true,
      "endpoints": [
        "https://github.com/YOUR_USERNAME/Skill-E/releases/latest/download/latest.json"
      ],
      "dialog": true,
      "pubkey": "YOUR_PUBLIC_KEY"
    }
  }
}
```

### Update Check Flow

```typescript
import { check } from '@tauri-apps/plugin-updater';

async function checkForUpdates() {
  try {
    const update = await check();
    if (update?.available) {
      // Show notification
      const shouldUpdate = await askUser('Update available! Install now?');
      if (shouldUpdate) {
        await update.downloadAndInstall();
        // Restart app
      }
    }
  } catch (error) {
    console.error('Update check failed:', error);
  }
}
```

## Development Workflow

### Local Build
```bash
# Development
pnpm tauri dev

# Build for current platform
pnpm tauri build

# Build with debug symbols
pnpm tauri build --debug
```

### Release Workflow
```bash
# 1. Update version in package.json and Cargo.toml
# 2. Commit changes
git add -A
git commit -m "chore: bump version to 1.0.0"

# 3. Create and push tag
git tag v1.0.0
git push origin v1.0.0

# 4. GitHub Actions builds and creates draft release
# 5. Review and publish release
```

## File Naming Convention

| Platform | File Pattern |
|----------|--------------|
| Windows | `Skill-E-{version}-x64.msi` |
| macOS | `Skill-E-{version}-universal.dmg` |
| Linux AppImage | `Skill-E-{version}.AppImage` |
| Linux deb | `skill-e_{version}_amd64.deb` |
