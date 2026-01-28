# Build Scripts

This directory contains build automation scripts for Skill-E.

## Scripts

### `build-all.ps1` (Windows)

PowerShell script for building Skill-E on Windows.

**Usage:**
```powershell
# Standard release build
.\scripts\build-all.ps1

# Debug build
.\scripts\build-all.ps1 -Debug

# Skip frontend build (if already built)
.\scripts\build-all.ps1 -SkipFrontend

# Combined options
.\scripts\build-all.ps1 -Debug -SkipFrontend
```

**Requirements:**
- PowerShell 5.1 or later
- pnpm (Node.js package manager)
- Rust toolchain
- Windows SDK (for MSI creation)

**Output:**
- MSI installer: `src-tauri/target/release/bundle/msi/*.msi`
- NSIS installer (if configured): `src-tauri/target/release/bundle/nsis/*.exe`

---

### `build-all.sh` (macOS/Linux)

Bash script for building Skill-E on Unix-based systems.

**Usage:**
```bash
# Standard release build
./scripts/build-all.sh

# Debug build
./scripts/build-all.sh --debug

# Skip frontend build (if already built)
./scripts/build-all.sh --skip-frontend

# Build for specific target (macOS universal binary)
./scripts/build-all.sh --target universal-apple-darwin

# Combined options
./scripts/build-all.sh --debug --skip-frontend
```

**Requirements:**
- Bash 4.0 or later
- pnpm (Node.js package manager)
- Rust toolchain
- Platform-specific dependencies:
  - **macOS**: Xcode Command Line Tools
  - **Linux**: `libwebkit2gtk-4.1-dev`, `libappindicator3-dev`, `librsvg2-dev`, `patchelf`

**Output:**
- **macOS**:
  - DMG: `src-tauri/target/release/bundle/dmg/*.dmg`
  - App bundle: `src-tauri/target/release/bundle/macos/*.app`
- **Linux**:
  - AppImage: `src-tauri/target/release/bundle/appimage/*.AppImage`
  - Debian package: `src-tauri/target/release/bundle/deb/*.deb`

---

## Build Process

Both scripts follow the same two-step process:

1. **Build Frontend** (`pnpm build`)
   - Compiles TypeScript
   - Bundles React application with Vite
   - Outputs to `dist/` directory

2. **Build Tauri** (`pnpm tauri build`)
   - Compiles Rust backend
   - Bundles frontend assets
   - Creates platform-specific installers

---

## Troubleshooting

### Windows

**Error: "pnpm is not installed"**
```powershell
npm install -g pnpm
```

**Error: "Rust is not installed"**
- Install from: https://rustup.rs/
- Restart terminal after installation

**Error: "WiX Toolset not found"**
- Tauri will download WiX automatically on first build
- Ensure you have internet connection

### macOS

**Error: "pnpm: command not found"**
```bash
npm install -g pnpm
```

**Error: "rustc: command not found"**
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
```

**Building universal binary:**
```bash
rustup target add aarch64-apple-darwin
rustup target add x86_64-apple-darwin
./scripts/build-all.sh --target universal-apple-darwin
```

### Linux

**Error: Missing dependencies**
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf

# Fedora
sudo dnf install webkit2gtk4.1-devel libappindicator-gtk3-devel librsvg2-devel patchelf
```

---

## CI/CD

These scripts are also used in GitHub Actions workflows. See `.github/workflows/release.yml` for automated builds.

---

## Development Builds

For development (not distribution), use:
```bash
pnpm tauri dev
```

This starts a development server with hot-reload and doesn't create installers.

---

## Related Files

- `package.json` - Frontend build configuration
- `src-tauri/Cargo.toml` - Rust dependencies
- `src-tauri/tauri.conf.json` - Tauri bundle configuration
- `.github/workflows/release.yml` - CI/CD pipeline
