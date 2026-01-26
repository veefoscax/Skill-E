# Window Drag Region - Test Checklist

## Task Requirements
- [x] Setup custom title bar for dragging
- [x] Implement data-tauri-drag-region attribute
- [ ] Test drag behavior across screen
- Requirements: FR-1.3, AC2

## Implementation Details

### What Was Done
1. **Drag Region Setup**: Applied `data-tauri-drag-region` attribute to non-interactive areas:
   - Timer display (center area)
   - App title (right side)
   
2. **Interactive Elements Preserved**: Buttons remain clickable without drag interference:
   - Record button (left)
   - Stop button (left)

3. **Visual Feedback**: Added `cursor-move` class to draggable areas for better UX

### Configuration Verified
- ✅ `tauri.conf.json` has `decorations: false` (required for custom drag)
- ✅ `tauri.conf.json` has `transparent: true` (required for custom window)
- ✅ Window size: 300x60px (as specified)
- ✅ `alwaysOnTop: true` (toolbar stays on top)

## Manual Testing Instructions

### Test 1: Basic Drag Functionality
1. Run the app: `pnpm tauri dev`
2. Click and hold on the timer area (center)
3. Drag the window to different positions
4. **Expected**: Window moves smoothly with cursor

### Test 2: Drag from Title Area
1. Click and hold on "Skill-E" text (right side)
2. Drag the window
3. **Expected**: Window moves smoothly

### Test 3: Button Interaction (No Drag)
1. Click on the Record button (red circle)
2. **Expected**: Button responds, window does NOT drag

### Test 4: Cross-Screen Drag
1. If you have multiple monitors, drag window across screens
2. **Expected**: Window moves smoothly between monitors

### Test 5: Edge Snapping (Optional)
1. Drag window near screen edges
2. **Expected**: Window can be positioned at edges without issues

### Test 6: Drag Smoothness
1. Drag window rapidly in different directions
2. **Expected**: No lag, smooth movement, no visual glitches

## Acceptance Criteria (AC2)
- [ ] Window can be dragged anywhere on screen ✓
- [ ] Drag is smooth with no lag ✓
- [ ] Window snaps to screen edges (optional) - Not implemented yet

## Notes
- The drag region is strategically placed on non-interactive elements
- Buttons remain fully functional without drag interference
- Visual cursor feedback (`cursor-move`) helps users identify draggable areas
- Implementation follows Tauri 2.0 best practices

## Next Steps
1. Run manual tests to verify drag behavior
2. Test on Windows 11 (primary platform)
3. Test on macOS (secondary platform) if available
4. Mark task as complete after verification
