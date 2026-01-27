# Task S04-14: Element Picker Toggle - Test Instructions

## Overview
Implementation of element picker toggle functionality with visual indicator.

**Requirements**: FR-4.20
- E key toggles element picker
- Visual indicator when active
- Disabled by default

## Implementation Summary

### Files Created
1. `src/components/Overlay/ElementSelector.tsx` - Main component with three variants:
   - `ElementSelector` - Full visual indicator at top center
   - `ElementSelectorStatus` - Compact status badge at top right
   - `ElementSelectorToggleButton` - Toggle button for toolbars

2. `src/components/ElementSelectorTest.tsx` - Comprehensive test component

### Files Modified
1. `src/components/Overlay/Overlay.tsx` - Integrated ElementSelector into layer 4
2. `src/App.tsx` - Added test route `#/element-selector-test`

### Store Integration
- Uses existing `elementPickerEnabled` state from `overlay.ts`
- Uses existing `toggleElementPicker` action
- Hotkey integration already implemented in `useOverlayHotkeys.ts`

## Testing Instructions

### 1. Start Development Server
```bash
cd skill-e
pnpm run dev
```

### 2. Open Test Page
Navigate to: `http://localhost:1420/#/element-selector-test`

### 3. Manual Tests

#### Test 1: Default State ✓
**Expected**: Element picker should be disabled by default
- Check "Current State" section shows "DISABLED"
- No visual indicators should be visible

#### Test 2: E Key Toggle ✓
**Expected**: E key toggles element picker on/off
1. Press `E` key
2. Visual indicator should appear at top center
3. Status badge should appear at top right
4. Current State should show "ENABLED"
5. Press `E` again
6. All indicators should disappear
7. Current State should show "DISABLED"

#### Test 3: Visual Indicator ✓
**Expected**: Visual indicator appears when active
1. Enable element picker (press `E` or click button)
2. Check for blue badge at top center with text "Element Picker Active"
3. Check for pulsing animation
4. Check for "Press E to exit" hint text
5. Verify status badge at top right

#### Test 4: Toggle Button ✓
**Expected**: Button toggles element picker
1. Click "Toggle Button" in the test interface
2. State should change from disabled to enabled (or vice versa)
3. Visual indicators should appear/disappear accordingly
4. Button color should change (gray when disabled, blue when enabled)

### 4. Automated Tests

Click the test buttons in the "Test Controls" section:
- **Test 2: E Key Toggle** - Logs current state and prompts for manual E key press
- **Test 3: Visual Indicator** - Checks if indicator is visible when enabled
- **Test 4: Button Toggle** - Programmatically toggles and verifies state change

### 5. Integration Test with Overlay

#### Test in Overlay Window
1. Navigate to: `http://localhost:1420/#/overlay`
2. Press `E` key
3. Visual indicator should appear at top center
4. Press `E` again to disable

#### Test with Other Hotkeys
1. In overlay window, test that E key doesn't interfere with other hotkeys:
   - Press `1`, `2`, `3` - Should still change colors
   - Press `P` - Should still toggle pin mode
   - Press `C` - Should still clear drawings
   - Press `K` - Should still toggle keyboard display

## Acceptance Criteria

### FR-4.20: Element Picker Toggle
- [x] E key toggles element picker on/off
- [x] Visual indicator appears when active
- [x] Visual indicator shows "Element Picker Active" text
- [x] Visual indicator shows "Press E to exit" hint
- [x] Element picker is disabled by default
- [x] Toggle button works correctly
- [x] State persists in overlay store
- [x] Hotkey integration works without conflicts

## Visual Design

### Main Indicator (Top Center)
- Blue background with 90% opacity
- Backdrop blur effect
- White text
- Target/checkmark icon
- Pulsing animation
- "Press E to exit" hint

### Status Badge (Top Right)
- Compact blue badge
- Pulsing white dot
- "Element Picker" text
- Small and non-intrusive

### Toggle Button
- Gray when disabled, blue when enabled
- Target icon
- "Element Picker" label
- Keyboard hint "(E)" when enabled

## Known Limitations

1. **Element Highlighting Not Implemented**: Tasks 15-16 will implement:
   - Hover highlighting of browser elements
   - Click to capture element selectors
   - Element screenshot capture

2. **Browser-Only Feature**: Element picker is designed for browser automation
   - Will only work when hovering over browser windows
   - Desktop app elements won't be selectable

3. **Crosshair Cursor**: Currently only applied to indicator div
   - Future: Apply globally when element picker is active

## Next Steps

### Task 15: Element Highlighting
- Inject CSS into browser pages
- Highlight elements on hover
- Show selector tooltip

### Task 16: Element Selection
- Click to capture element info
- Generate CSS selector and XPath
- Capture element screenshot
- Store with recording

## Troubleshooting

### Issue: E key not working
**Solution**: 
- Check browser console for errors
- Verify `useOverlayHotkeys` is called in Overlay component
- Make sure you're not typing in an input field

### Issue: Visual indicator not appearing
**Solution**:
- Check "Current State" shows "ENABLED"
- Verify Tailwind CSS is loaded
- Check browser console for React errors

### Issue: Toggle button not working
**Solution**:
- Check overlay store is properly initialized
- Verify `toggleElementPicker` action exists
- Check React DevTools for state updates

## Success Criteria

✅ **Task Complete When**:
1. Element picker is disabled by default
2. E key toggles element picker on/off
3. Visual indicator appears/disappears correctly
4. Toggle button works
5. No TypeScript errors
6. No console errors
7. All manual tests pass
8. Integration with overlay works

## Files Reference

```
skill-e/
├── src/
│   ├── components/
│   │   ├── Overlay/
│   │   │   ├── ElementSelector.tsx          ← NEW (Main component)
│   │   │   └── Overlay.tsx                  ← MODIFIED (Integration)
│   │   └── ElementSelectorTest.tsx          ← NEW (Test component)
│   ├── stores/
│   │   └── overlay.ts                       ← EXISTING (State management)
│   └── hooks/
│       └── useOverlayHotkeys.ts             ← EXISTING (Hotkey handling)
└── TASK_S04-14_ELEMENT_SELECTOR_TEST.md     ← THIS FILE
```
