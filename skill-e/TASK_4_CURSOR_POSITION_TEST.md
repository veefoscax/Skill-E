# Task 4: Cursor Position - Test Instructions

## Overview
This document provides instructions for testing the cursor position tracking functionality (Task 4 from S02-screen-capture).

## What Was Implemented

### Rust Backend (src-tauri/src/commands/capture.rs)
- ✅ Added `get_cursor_position()` command
- ✅ Returns X/Y coordinates relative to screen origin (top-left)
- ✅ Uses Windows API `GetCursorPos` for accurate cursor tracking
- ✅ Includes error handling for Windows platform

### TypeScript Frontend (src/lib/capture.ts)
- ✅ Added `getCursorPosition()` function
- ✅ Returns Promise<[number, number]> with [x, y] coordinates
- ✅ Properly typed with TypeScript

### Test Component (src/components/CaptureTest.tsx)
- ✅ Added "Get Cursor Position" button
- ✅ Displays cursor X/Y coordinates in a purple info box
- ✅ Shows coordinates in format: (x, y)

## Requirements Tested
- **FR-2.4**: Capture mouse cursor position for each frame

## How to Test

### Step 1: Start the Development Server
```bash
cd skill-e
pnpm tauri dev
```

Wait for the app to compile and launch. This may take a minute or two.

### Step 2: Test Cursor Position Tracking

1. **Move your cursor to different positions** on the screen
2. **Click the "Get Cursor Position" button** in the test interface
3. **Observe the purple info box** that appears showing:
   - X coordinate
   - Y coordinate
   - Combined coordinates (x, y)

### Step 3: Verify Accuracy

Test the cursor position in different locations:

1. **Top-left corner** of screen
   - Move cursor to top-left
   - Click "Get Cursor Position"
   - Expected: X ≈ 0, Y ≈ 0

2. **Center of screen**
   - Move cursor to center
   - Click "Get Cursor Position"
   - Expected: X ≈ (screen width / 2), Y ≈ (screen height / 2)

3. **Bottom-right corner**
   - Move cursor to bottom-right
   - Click "Get Cursor Position"
   - Expected: X ≈ screen width, Y ≈ screen height

4. **Multiple rapid tests**
   - Move cursor around
   - Click button multiple times
   - Verify coordinates update correctly each time

### Step 4: Test Error Handling

The command should work on Windows. If you test on another platform, it should show an error message.

## Expected Results

### ✅ Success Criteria
- [ ] Button responds when clicked
- [ ] Purple info box appears with cursor coordinates
- [ ] X coordinate matches horizontal position (0 = left edge)
- [ ] Y coordinate matches vertical position (0 = top edge)
- [ ] Coordinates update correctly when cursor moves
- [ ] No console errors
- [ ] Response time < 100ms (feels instant)

### ❌ Failure Indicators
- Button doesn't respond
- No coordinates displayed
- Coordinates are always (0, 0)
- Coordinates don't change when cursor moves
- Console shows errors
- App crashes when clicking button

## Testing Checklist

After testing, please confirm:

- [ ] I can click the "Get Cursor Position" button
- [ ] The cursor coordinates are displayed correctly
- [ ] The X coordinate increases as I move right
- [ ] The Y coordinate increases as I move down
- [ ] The coordinates match my cursor's actual position
- [ ] The feature works reliably (tested 5+ times)
- [ ] No errors appear in the console

## What to Report

Please let me know:

1. **Does the button work?** (Yes/No)
2. **Are coordinates displayed?** (Yes/No)
3. **Do coordinates match cursor position?** (Yes/No)
4. **Any errors or issues?** (Describe if any)

## Next Steps

Once you confirm the cursor position tracking works correctly:
- ✅ Task 4 will be marked as complete
- ✅ DEVLOG will be updated
- 🎯 Ready to move to Task 5: Register Commands (if not already complete)

## Technical Notes

### Implementation Details
- Uses Windows API `GetCursorPos` function
- Returns coordinates relative to primary monitor's top-left corner
- Coordinates are in pixels
- Works on Windows 10/11
- Platform-specific implementation (Windows only for now)

### Integration with Capture Loop
In the future capture loop, this function will be called:
- Every frame during recording (1fps = once per second)
- Coordinates will be stored with each CaptureFrame
- Used for cursor tracking in the final skill output

