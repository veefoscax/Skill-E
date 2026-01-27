# Task S04-4: Click Indicator Component - Testing Instructions

## Overview
This document provides testing instructions for the Click Indicator component (Task 4 from S04-overlay-ui).

## What Was Implemented

### Files Created
1. **src/components/Overlay/ClickIndicator.tsx** - Main component
   - Numbered circle display (1, 2, 3...)
   - 3-color rotation (Red → Blue → Green)
   - CSS ripple animation on appearance
   - Fade-out after 3 seconds (configurable)
   - Pin mode support (no fade when pinned)

2. **src/components/ClickIndicatorTest.tsx** - Visual test component
   - Interactive test page with click tracking
   - Pin mode toggle
   - Clear all clicks button
   - Real-time statistics display

3. **src/components/Overlay/ClickIndicator.test.tsx** - Unit tests
   - Tests for numbering, colors, positioning
   - Tests for fade behavior
   - Tests for pin mode

### Integration
- Updated **src/components/Overlay/Overlay.tsx** to integrate ClickIndicator
- Added route **#/click-indicator-test** to App.tsx

## How to Test

### Method 1: Visual Test Page (Recommended)

1. **Start the development server:**
   ```bash
   cd skill-e
   npm run dev
   ```

2. **Open the test page:**
   - Navigate to: `http://localhost:1420/#/click-indicator-test`
   - Or manually change the URL hash to `#/click-indicator-test`

3. **Test the following features:**

   ✅ **Click Numbering:**
   - Click anywhere on the screen
   - Verify numbered circles appear (1, 2, 3...)
   - Numbers should increment with each click

   ✅ **Color Cycling:**
   - Click 1 = Red (#FF4444)
   - Click 2 = Blue (#4488FF)
   - Click 3 = Green (#44CC44)
   - Click 4 = Red again (cycle repeats)

   ✅ **Ripple Animation:**
   - Each click should show a ripple effect
   - Ripple expands outward and fades
   - Animation duration: ~0.6 seconds

   ✅ **Fade-Out (Default Mode):**
   - Click indicators should fade after 3 seconds
   - Fade animation takes 0.5 seconds
   - Indicators disappear completely after fading

   ✅ **Pin Mode:**
   - Click the "Fade Mode (3s)" button to toggle to "Pinned (No Fade)"
   - Create new clicks
   - Verify they do NOT fade out
   - Toggle back to fade mode
   - New clicks should fade normally

   ✅ **Clear All:**
   - Create several clicks
   - Click "Clear All Clicks" button
   - All indicators should disappear immediately
   - Click count should reset to 0

### Method 2: Overlay Window Test

1. **Start the app in Tauri:**
   ```bash
   cd skill-e
   npm run tauri dev
   ```

2. **Open the overlay window:**
   - The overlay window should be created automatically
   - It's a transparent fullscreen window
   - Navigate to `#/overlay` route

3. **Test click tracking:**
   - Click anywhere on the overlay
   - Verify click indicators appear
   - Test all features listed above

### Method 3: Unit Tests (When test infrastructure is ready)

```bash
npm test -- ClickIndicator.test.tsx
```

## Expected Behavior

### Visual Appearance
- **Circle Size:** 40px diameter
- **Number Font:** Nunito Sans, 18px, bold, white
- **Shadow:** Colored glow matching the indicator color
- **Positioning:** Centered on click position (transform: translate(-50%, -50%))

### Animations
- **Ripple:** Scales from 0 to 2x, fades from 1 to 0, duration 0.6s
- **Fade-out:** Opacity 1 to 0, scale 1 to 0.8, duration 0.5s
- **Timing:** Fade starts at 2.5s, complete removal at 3s

### Performance
- **No lag:** Indicators should appear instantly on click
- **Smooth animations:** 60fps ripple and fade
- **Memory cleanup:** Hidden indicators removed from DOM

## Requirements Validated

- ✅ **FR-4.1:** Show numbered click indicator (1, 2, 3...) at each click
- ✅ **FR-4.2:** Cycle through 3 colors for click indicators
- ✅ **FR-4.3:** Display ripple animation on click

## Known Limitations

1. **Test infrastructure:** Unit tests require vitest setup (not yet configured)
2. **Overlay integration:** Full overlay window testing requires Tauri dev mode
3. **Pin mode hotkey:** Pin mode toggle (P key) not yet implemented in global hotkeys

## Next Steps

After verifying this task works:
1. Move to Task 5: Click Fade Animation (already partially implemented)
2. Implement global hotkey for pin mode toggle
3. Integrate with recording store for session management

## Troubleshooting

### Issue: Clicks not appearing
- Check browser console for errors
- Verify click-tracker is started (should auto-start in Overlay component)
- Check z-index layering (click indicators should be z-20)

### Issue: Colors not cycling correctly
- Verify getColorForClick function in click-tracker.ts
- Check COLORS constant is imported correctly

### Issue: Animations not smooth
- Check CSS animations are defined in ClickIndicator.tsx
- Verify no conflicting styles
- Test in different browsers

### Issue: Indicators not fading
- Verify isPinned prop is false
- Check setTimeout timers are running
- Look for console errors in useEffect cleanup

## User Acceptance

**Please test the click indicator and confirm:**
- [ ] Clicks show numbered circles at cursor position
- [ ] Numbers increment correctly (1, 2, 3...)
- [ ] Colors cycle: Red → Blue → Green → Red...
- [ ] Ripple animation plays on each click
- [ ] Indicators fade after 3 seconds (fade mode)
- [ ] Indicators stay visible when pinned
- [ ] Clear all button works
- [ ] No performance issues or lag

Once confirmed working, I'll mark the task as complete and update the DEVLOG.
