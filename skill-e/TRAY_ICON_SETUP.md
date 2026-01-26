# Tray Icon Setup - Theme Aware

## Overview
The tray icon should be theme-aware, using:
- **Light icon (white)** for dark mode taskbars
- **Dark icon (black)** for light mode taskbars

## Files Created

### SVG Sources
- `assets/skille_bot_light.svg` - White version for dark mode
- `assets/skille_bot_dark.svg` - Black version for light mode
- `assets/skille_bot.svg` - Original (no fill color specified)

## TODO: Generate PNG Icons

We need to convert the SVGs to PNG format for the tray icon:

### Required PNG Files
1. **For Light Mode (dark icon)**:
   - `skill-e/src-tauri/icons/tray-icon-dark.png` (32x32)
   - `skill-e/src-tauri/icons/tray-icon-dark@2x.png` (64x64)

2. **For Dark Mode (light icon)**:
   - `skill-e/src-tauri/icons/tray-icon-light.png` (32x32)
   - `skill-e/src-tauri/icons/tray-icon-light@2x.png` (64x64)

### Conversion Options

**Option 1: Online Tool**
- Use https://cloudconvert.com/svg-to-png
- Upload `skille_bot_light.svg` and `skille_bot_dark.svg`
- Set dimensions: 32x32 and 64x64
- Download and place in `skill-e/src-tauri/icons/`

**Option 2: ImageMagick (if installed)**
```bash
# Light version (white icon for dark mode)
magick assets/skille_bot_light.svg -resize 32x32 skill-e/src-tauri/icons/tray-icon-light.png
magick assets/skille_bot_light.svg -resize 64x64 skill-e/src-tauri/icons/tray-icon-light@2x.png

# Dark version (black icon for light mode)
magick assets/skille_bot_dark.svg -resize 32x32 skill-e/src-tauri/icons/tray-icon-dark.png
magick assets/skille_bot_dark.svg -resize 64x64 skill-e/src-tauri/icons/tray-icon-dark@2x.png
```

**Option 3: Inkscape (if installed)**
```bash
# Light version
inkscape assets/skille_bot_light.svg --export-type=png --export-width=32 --export-filename=skill-e/src-tauri/icons/tray-icon-light.png
inkscape assets/skille_bot_light.svg --export-type=png --export-width=64 --export-filename=skill-e/src-tauri/icons/tray-icon-light@2x.png

# Dark version
inkscape assets/skille_bot_dark.svg --export-type=png --export-width=32 --export-filename=skill-e/src-tauri/icons/tray-icon-dark.png
inkscape assets/skille_bot_dark.svg --export-type=png --export-width=64 --export-filename=skill-e/src-tauri/icons/tray-icon-dark@2x.png
```

## Implementation Plan

### Phase 1: Basic Icon (Current)
- ✅ Created theme-aware SVG files
- ⏳ Using existing icon.ico as fallback
- ⏳ Need to generate PNG files from SVGs

### Phase 2: Theme Detection (Future)
Once PNGs are generated, update `lib.rs` to detect system theme:

```rust
fn get_system_theme() -> String {
    // Windows: Check registry for dark mode
    // HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Themes\Personalize
    // AppsUseLightTheme: 0 = dark, 1 = light
    
    // For now, default to dark mode (most common)
    "dark".to_string()
}

fn setup_tray(app: &mut tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let theme = get_system_theme();
    
    let icon_bytes = if theme == "dark" {
        // Dark mode: use light (white) icon
        include_bytes!("../icons/tray-icon-light.png")
    } else {
        // Light mode: use dark (black) icon
        include_bytes!("../icons/tray-icon-dark.png")
    };
    
    // ... rest of tray setup
}
```

### Phase 3: Dynamic Theme Switching (Future)
- Listen for Windows theme change events
- Update tray icon when theme changes
- Requires Windows API integration

## Current Status

**Blocking Issue**: Need to generate PNG files from SVG sources.

**Workaround**: Currently using existing `icon.ico` which is a 256x256 icon. This works but is not theme-aware.

**Next Steps**:
1. Generate PNG files using one of the conversion methods above
2. Update `lib.rs` to use the appropriate PNG based on system theme
3. Test on Windows 11 with both light and dark modes
4. Verify icon visibility in system tray

## Testing Checklist

Once PNGs are generated and code is updated:

- [ ] Icon visible in Windows 11 dark mode (should use light/white icon)
- [ ] Icon visible in Windows 11 light mode (should use dark/black icon)
- [ ] Icon visible in overflow area (^ arrow)
- [ ] Icon has correct size (not blurry or pixelated)
- [ ] Left-click toggles window visibility
- [ ] Right-click shows menu
- [ ] Icon updates when theme changes (Phase 3)
