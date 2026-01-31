# Building Skill-E

Complete guide for building Skill-E from source for Windows, macOS, and Linux.

## Prerequisites

### All Platforms

- [Node.js](https://nodejs.org/) 20+ (LTS recommended)
- [pnpm](https://pnpm.io/) 8+ (`npm install -g pnpm`)
- [Rust](https://rustup.rs/) stable toolchain
- Git

### Platform-Specific

#### Windows
- [Microsoft Visual Studio C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)
- Windows 10 SDK or later

#### macOS
- Xcode Command Line Tools (`xcode-select --install`)
- For universal binaries: macOS 11+ (Big Sur)

#### Linux (Ubuntu/Debian)
```bash
sudo apt-get update
sudo apt-get install -y libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf
```

#### Linux (Fedora)
```bash
sudo dnf install webkit2gtk4.1-devel libappindicator-gtk3-devel librsvg2-devel patchelf
```

## Quick Start

### 1. Clone Repository

```bash
git clone https://github.com/veefoscax/Skill-E.git
cd Skill-E/skill-e
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Build

#### Development (with hot reload)
```bash
pnpm tauri dev
```

#### Production Build
```bash
# Windows
.\scripts\build-all.ps1

# macOS/Linux
./scripts/build-all.sh
```

## Build Scripts

### Windows (`scripts/build-all.ps1`)

```powershell
# Standard release build
.\scripts\build-all.ps1

# Debug build
.\scripts\build-all.ps1 -Debug

# Skip frontend (if already built)
.\scripts\build-all.ps1 -SkipFrontend
```

**Output:** `src-tauri/target/release/bundle/msi/*.msi`

### macOS/Linux (`scripts/build-all.sh`)

```bash
# Standard release build
./scripts/build-all.sh

# Debug build
./scripts/build-all.sh --debug

# Build universal binary (macOS)
./scripts/build-all.sh --target universal-apple-darwin

# Skip frontend build
./scripts/build-all.sh --skip-frontend
```

**Output:**
- macOS: `src-tauri/target/release/bundle/dmg/*.dmg`
- Linux: `src-tauri/target/release/bundle/appimage/*.AppImage`

## Manual Build

If you prefer to build step-by-step:

```bash
# 1. Build frontend
pnpm build

# 2. Build Tauri application
pnpm tauri build

# 3. Debug build
pnpm tauri build --debug

# 4. Specific target (macOS universal)
pnpm tauri build --target universal-apple-darwin
```

## Build Outputs

### Windows
| File | Description | Location |
|------|-------------|----------|
| `*.msi` | Windows Installer | `src-tauri/target/release/bundle/msi/` |
| `*.exe` | NSIS Installer (if enabled) | `src-tauri/target/release/bundle/nsis/` |

### macOS
| File | Description | Location |
|------|-------------|----------|
| `*.dmg` | Disk Image | `src-tauri/target/release/bundle/dmg/` |
| `*.app` | App Bundle | `src-tauri/target/release/bundle/macos/` |

### Linux
| File | Description | Location |
|------|-------------|----------|
| `*.AppImage` | Universal AppImage | `src-tauri/target/release/bundle/appimage/` |
| `*.deb` | Debian Package | `src-tauri/target/release/bundle/deb/` |

## Troubleshooting

### Windows

**Error: "WiX Toolset not found"**
- Tauri downloads WiX automatically on first build
- Ensure internet connection during first build

**Error: "Microsoft Visual Studio is not installed"**
- Install Visual Studio Build Tools with "Desktop development with C++" workload

### macOS

**Error: "xcode-select: error: tool 'xcodebuild' requires Xcode"**
```bash
xcode-select --install
```

**Error: "couldn't recognize the current folder as a Tauri project"**
- Ensure you're in the `skill-e` directory (not project root)

### Linux

**Error: "libwebkit2gtk-4.1-dev not found"**
```bash
# Ubuntu 22.04+
sudo apt-get install libwebkit2gtk-4.1-dev

# Ubuntu 20.04
sudo apt-get install libwebkit2gtk-4.0-dev
```

**Error: "patchelf not found"**
```bash
sudo apt-get install patchelf  # Debian/Ubuntu
sudo dnf install patchelf      # Fedora
```

## Platform-Specific Notes

### Windows Code Signing

To sign the MSI installer:

1. Obtain a code signing certificate
2. Update `src-tauri/tauri.conf.json`:
```json
{
  "bundle": {
    "windows": {
      "certificateThumbprint": "YOUR_CERT_THUMBPRINT"
    }
  }
}
```

### macOS Code Signing & Notarization

For distribution outside App Store:

1. Enroll in Apple Developer Program
2. Update `src-tauri/tauri.conf.json`:
```json
{
  "bundle": {
    "macOS": {
      "signingIdentity": "Developer ID Application: YOUR_NAME"
    }
  }
}
```

3. Set environment variables for notarization:
```bash
export APPLE_ID="your@email.com"
export APPLE_PASSWORD="app-specific-password"
export APPLE_TEAM_ID="TEAM_ID"
```

### Linux AppImage

AppImage requires `fuse` to run:
```bash
# Ubuntu/Debian
sudo apt-get install fuse libfuse2

# Fedora
sudo dnf install fuse
```

## CI/CD (GitHub Actions)

Builds are automated via GitHub Actions:

1. Push a tag: `git tag v1.0.0 && git push origin v1.0.0`
2. GitHub Actions builds for all 3 platforms
3. Draft release is created with all artifacts
4. Review and publish the release

See `.github/workflows/release.yml` for configuration.

## Release Checklist

- [ ] Update version in `package.json`
- [ ] Update version in `src-tauri/Cargo.toml`
- [ ] Update `CHANGELOG.md`
- [ ] Commit changes
- [ ] Create and push git tag
- [ ] Wait for CI to complete
- [ ] Review draft release
- [ ] Publish release

## Development vs Production

| Aspect | Development | Production |
|--------|-------------|------------|
| Command | `pnpm tauri dev` | `pnpm tauri build` |
| Hot Reload | ✓ | ✗ |
| Debug Info | ✓ | ✗ |
| Optimized | ✗ | ✓ |
| Installer | ✗ | ✓ |
| Bundle Size | ~50MB | ~15-20MB |

## Support

For build issues:
1. Check [Tauri documentation](https://tauri.app/v1/guides/building/)
2. Review GitHub Issues
3. Check Rust/Node.js versions match prerequisites
