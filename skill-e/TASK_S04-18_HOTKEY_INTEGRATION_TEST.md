# Task S04-18: Hotkey Integration Test

## Overview
Testing the centralized hotkey system for overlay UI controls.

## Requirements Tested
- **FR-4.10**: Toggle between color 1, 2, 3 with keyboard shortcut
- **FR-4.13**: Toggle pin mode via hotkey
- **FR-4.14**: Clear all drawings with hotkey
- **FR-4.20**: Toggle element picker with hotkey (E key)
- Keyboard display toggle with K key

## Hotkey Mappings

| Key | Action | Store Method |
|-----|--------|--------------|
| 1 | Select Color 1 (Red) | `setColor('COLOR_1')` |
| 2 | Select Color 2 (Blue) | `setColor('COLOR_2')` |
| 3 | Select Color 3 (Green) | `setColor('COLOR_3')` |
| P | Toggle Pin Mode | `togglePinMode()` |
| C | Clear All Drawings | `clearDrawings()` |
| E | Toggle Element Picker | `toggleElementPicker()` |
| K | Toggle Keyboard Display | `toggleKeyboardDisplay()` |

## Implementation Details

### Created Files
1. **`src/hooks/useOverlayHotkeys.ts`**
   - Centralized hotkey management hook
   - Configurable enable/disable for each hotkey
   - Callback support for logging/debugging
   - Ignores input fields to prevent conflicts
   - Ignores modifier key combinations

2. **Updated `src/components/Overlay/Overlay.tsx`**
   - Integrated `useOverlayHotkeys` hook
   - Connected to overlay store state
   - Added KeyboardDisplay component
   - Removed duplicate state management

3. **Updated `src/components/Overlay/DrawingCanvas.tsx`**
   - Removed duplicate hotkey handlers
   - Now relies on centralized hook
   - Syncs with store for clear action

## Test Instructions

### Manual Testing

1. **Start the overlay test component:**
   ```bash
   npm run dev
   ```

2. **Navigate to the overlay test page** (or create one if needed)

3. **Test Color Selection (1, 2, 3):**
   - Press `1` → Should select Red color
   - Press `2` → Should select Blue color
   - Press `3` → Should select Green color
   - Verify color indicator updates in UI
   - Draw something to confirm color is applied

4. **Test Pin Mode (P):**
   - Draw an arrow or rectangle
   - Wait 3 seconds → Should fade out
   - Press `P` to enable pin mode
   - Draw another shape
   - Wait 3 seconds → Should NOT fade (pinned)
   - Press `P` again to disable pin mode

5. **Test Clear Drawings (C):**
   - Draw multiple shapes (arrows, rectangles, dots)
   - Press `C` → All drawings should disappear immediately
   - Verify both pinned and unpinned drawings are cleared

6. **Test Keyboard Display Toggle (K):**
   - Press `K` → Keyboard display should hide
   - Type some text → Should not appear
   - Press `K` again → Keyboard display should show
   - Type some text → Should appear in overlay

7. **Test Element Picker Toggle (E):**
   - Press `E` → Element picker should toggle on
   - Press `E` again → Element picker should toggle off
   - Check console for state changes

### Edge Cases

1. **Hotkeys in Input Fields:**
   - Click in an input field
   - Press `1`, `2`, `3`, `P`, `C`, `E`, `K`
   - Should type normally, NOT trigger overlay actions

2. **Hotkeys with Modifiers:**
   - Press `Ctrl+1`, `Ctrl+P`, etc.
   - Should NOT trigger overlay actions
   - Prevents conflicts with browser shortcuts

3. **Rapid Key Presses:**
   - Rapidly press `1`, `2`, `3` in sequence
   - Color should update smoothly
   - No lag or missed inputs

4. **Multiple Hotkeys:**
   - Press `P` to pin
   - Press `1` to change color
   - Draw something
   - Press `C` to clear
   - All actions should work in sequence

## Expected Behavior

### Success Criteria
- ✅ All 7 hotkeys respond correctly
- ✅ Color changes are reflected in drawings
- ✅ Pin mode prevents fade-out
- ✅ Clear removes all drawings instantly
- ✅ Keyboard display toggles visibility
- ✅ Element picker state toggles
- ✅ Hotkeys ignored in input fields
- ✅ Hotkeys ignored with modifier keys
- ✅ Console logs show hotkey actions

### Visual Feedback
- Color indicator shows current color
- Pin mode indicator shows pin status
- Keyboard display appears/disappears
- Drawings clear immediately on C press

## Troubleshooting

### Issue: Hotkeys not working
- Check console for errors
- Verify `useOverlayHotkeys` is called in Overlay component
- Check if focus is on an input field

### Issue: Duplicate hotkey handling
- Verify old hotkey handlers removed from DrawingCanvas
- Check for multiple event listeners

### Issue: Clear not working
- Verify store's `clearDrawings` is called
- Check if DrawingCanvas syncs with store

## Next Steps

After verifying hotkeys work:
1. Test in actual overlay window (Tauri)
2. Verify hotkeys work across all windows
3. Add hotkey hints UI (optional)
4. Document hotkeys in user guide

## Notes

- Hotkeys use `keydown` event with capture phase
- Case-insensitive (P and p both work)
- Prevents default to avoid browser conflicts
- Centralized in one hook for maintainability
