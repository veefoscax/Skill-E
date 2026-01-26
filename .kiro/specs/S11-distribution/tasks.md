# S11: Distribution & Packaging - Implementation Tasks

> **Reference Workflow**: See `.kiro/steering/workflow.md` for execution guidelines.

## Overview

Implements cross-platform build and distribution for Windows, macOS, and Linux. Creates installers, sets up CI/CD, and configures auto-updates.

---

## Phase 1: Icon Assets

- [ ] 1. Create App Icons
  - Create icons/icon.ico (Windows, multi-size)
  - Create icons/icon.icns (macOS, multi-size)
  - Create icons/32x32.png
  - Create icons/128x128.png
  - Create icons/128x128@2x.png
  - Use Skill-E bot logo as base
  - _Requirements: Bundle icons_

## Phase 2: Tauri Bundle Configuration

- [ ] 2. Configure tauri.conf.json
  - Set bundle.active = true
  - Set bundle.identifier = "com.skille.app"
  - Configure bundle.icon paths
  - Set category, description, copyright
  - _Requirements: FR-11.1, FR-11.2, FR-11.3_

- [ ] 3. Windows Bundle Config
  - Configure WiX installer
  - Set language to en-US
  - Optional: Add dialog and banner images
  - _Requirements: FR-11.6_

- [ ] 4. macOS Bundle Config
  - Set minimumSystemVersion = "10.15"
  - Configure for universal binary
  - _Requirements: FR-11.11, FR-11.12_

- [ ] 5. Linux Bundle Config
  - Configure AppImage
  - Configure .deb package
  - Set bundleMediaFramework = true
  - _Requirements: FR-11.16, FR-11.17_

## Phase 3: Local Build Testing

- [ ] 6. Test Windows Build
  - Run `pnpm tauri build` on Windows
  - Verify MSI is created
  - Test installation
  - Test uninstallation
  - _Requirements: FR-11.1, FR-11.6_

- [ ] 7. Test macOS Build
  - Run `pnpm tauri build` on Mac
  - Verify DMG is created
  - Test installation (drag to Applications)
  - Test Gatekeeper compatibility
  - _Requirements: FR-11.2, FR-11.11_

- [ ] 8. Test Linux Build
  - Run `pnpm tauri build` on Linux/WSL
  - Verify AppImage is created
  - Test AppImage execution
  - _Requirements: FR-11.3, FR-11.16_

## Phase 4: CI/CD Pipeline

- [ ] 9. Create GitHub Actions Workflow
  - Create .github/workflows/release.yml
  - Configure matrix for all 3 platforms
  - Install Rust and Node dependencies
  - Run tauri build
  - _Requirements: FR-11.5_

- [ ] 10. Upload Artifacts
  - Use tauri-action for build
  - Upload to GitHub Release
  - Create draft release on tag
  - _Requirements: FR-11.5_

## Phase 5: Auto-Updates (Post-Hackathon)

- [ ] 11. Configure Updater Plugin
  - Add tauri-plugin-updater
  - Set endpoints to GitHub releases
  - Generate keypair for signing
  - _Requirements: FR-11.21_

- [ ] 12. Implement Update Check
  - Check for updates on app start
  - Show notification when available
  - Download in background
  - Install on restart
  - _Requirements: FR-11.21, FR-11.22, FR-11.23_

## Phase 6: Build Scripts

- [ ] 13. Create Build Scripts
  - Create scripts/build-all.ps1 (Windows)
  - Create scripts/build-all.sh (Unix)
  - Build frontend first, then Tauri
  - _Requirements: FR-11.4_

## Phase 7: Testing

- [ ] 14. Cross-Platform Verification
  - Install on clean Windows machine
  - Install on clean macOS machine
  - Verify all features work
  - Test system tray on both
  - _Requirements: All_

- [ ] 15. Checkpoint - Verify Phase Complete
  - Ensure all tests pass, ask the user if questions arise.

---

## Build Commands Reference

```bash
# Development
pnpm tauri dev

# Build for current platform
pnpm tauri build

# Build for specific target (on Mac)
pnpm tauri build --target universal-apple-darwin

# Windows targets (from Windows)
pnpm tauri build --target x86_64-pc-windows-msvc

# Debug build
pnpm tauri build --debug
```

## Release Checklist

- [ ] Update version in package.json
- [ ] Update version in src-tauri/Cargo.toml
- [ ] Update CHANGELOG.md
- [ ] Commit all changes
- [ ] Create git tag: `git tag v1.0.0`
- [ ] Push tag: `git push origin v1.0.0`
- [ ] Wait for CI to complete
- [ ] Review draft release
- [ ] Publish release

## Success Criteria

- Windows MSI installs and runs correctly
- macOS DMG installs and runs correctly
- Linux AppImage runs correctly
- All platforms have working system tray
- GitHub Actions builds all platforms on tag

## Notes

- Focus on Windows + macOS for hackathon
- Linux is nice-to-have
- Auto-updates can be added post-hackathon
- Code signing requires purchased certificates
