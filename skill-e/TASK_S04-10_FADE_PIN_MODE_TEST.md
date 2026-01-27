# Task S04-10: Fade vs Pin Mode - Testing Instructions

## Overview
Testing the fade vs pin mode functionality for drawing annotations in the overlay UI.

## Requirements Being Tested
- **FR-4.11**: Default mode: Drawings fade out after 3 seconds
- **FR-4.12**: Pin mode: Drawings stay until manually cleared
- **FR-4.13**: Toggle pin mode via keyboard shortcut (P key)
- **FR-4.14**: Clear all drawings with hotkey (C key)

## Test Component
A test component has been created at `src/components/FadePinModeTest.tsx` that demonstrates:
1. Drawing canvas with fade/pin functionality
2. Visual indicator showing current mode
3. Keyboard shortcuts (P for pin, C for clear, 1/2/3 for colors)
4. Real-time mode status display

## Manual Testing Steps

### Test 1: Default Fade Mode
1. Open the test component
2. Draw several annotations (dots, arrows, rectangles)
3. **Expected**: Drawings should fade out after 3 seconds
4. **Verify**: Drawings disappear completely after fade animation

### Test 2: Pin Mode Toggle
1. Press the **P** key to enable pin mode
2. **Expected**: Indicator shows "Pinned" with pin icon
3. Draw several annotations
4. **Expected**: Drawings stay visible (no fade)
5. Wait 5+ seconds
6. **Verify**: Drawings remain visible

### Test 3: Pin Mode Off
1. With pin mode enabled and drawings visible
2. Press **P** key again to disable pin mode
3. **Expected**: Indicator shows "Fade 3s" with clock icon
4. Draw new annotations
5. **Expected**: New drawings fade after 3 seconds
6. **Verify**: Old pinned drawings remain, new ones fade

### Test 4: Clear All
1. Draw multiple annotations (mix of pinned and fading)
2. Press **C** key
3. **Expected**: All drawings clear immediately
4. **Verify**: Canvas is empty

### Test 5: Color Selection
1. Press **1** key
2. **Expected**: Color indicator shows red
3. Draw annotation
4. **Verify**: Drawing is red
5. Repeat for **2** (blue) and **3** (green)

### Test 6: Visual Indicator
1. Check top-right corner of canvas
2. **Expected**: Indicator shows:
   - Current color (colored circle)
   - Pin mode status (Pinned or Fade 3s)
   - Keyboard hints (P pin · C clear)
3. Toggle pin mode
4. **Verify**: Indicator updates immediately

## Running the Test

```bash
# Start the dev server (if not already running)
npm run dev

# Navigate to the test component in your browser
# The test component should be accessible from the main app
```

## Success Criteria

✅ **Pass Conditions:**
- [ ] Drawings fade after 3 seconds in default mode
- [ ] P key toggles pin mode
- [ ] Pinned drawings stay visible indefinitely
- [ ] C key clears all drawings
- [ ] Visual indicator shows current mode accurately
- [ ] Color selection (1, 2, 3) works correctly
- [ ] Indicator updates in real-time

❌ **Fail Conditions:**
- Drawings don't fade in default mode
- Pin mode doesn't prevent fading
- Keyboard shortcuts don't work
- Indicator doesn't update
- Drawings persist after clear command

## Implementation Details

### Components Created/Modified
1. **src/stores/overlay.ts** - Global state for pin mode and color
2. **src/components/Overlay/DrawingCanvas.tsx** - Updated to use store and show indicator
3. **src/components/FadePinModeTest.tsx** - Test component

### Key Features
- Zustand store for global overlay state
- Visual indicator with pin/fade status
- Keyboard event listeners for shortcuts
- Fade animation with 3-second timer
- Pin mode flag on each drawing element

## Notes
- The fade animation is CSS-based for smooth performance
- Pin mode is stored globally but applied per-drawing
- Keyboard shortcuts are case-insensitive (P or p works)
- The indicator is non-interactive (pointer-events-none)
- Old pinned drawings remain when switching modes

## Next Steps
After testing, if all criteria pass:
1. Mark task as complete
2. Update DEVLOG.md with completion
3. Proceed to Phase 4: Keyboard Display (Task 11)
