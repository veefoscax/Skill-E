# Task 7: Capture Hook - Test Instructions

## Overview
This document provides instructions for testing the `useCapture` hook implementation.

## What Was Implemented

### Files Created
1. **`src/hooks/useCapture.ts`** - Main capture hook
   - `startCapture(intervalMs)` - Starts periodic screen capture
   - `stopCapture()` - Stops the capture session
   - `getSessionId()` - Returns current session ID
   - `getFrameCount()` - Returns number of frames captured

2. **`src/components/CaptureHookTest.tsx`** - Test component for the hook

### Features Implemented
- ✅ Periodic screenshot capture (configurable interval, default 1000ms)
- ✅ Window tracking (active window info for each frame)
- ✅ Cursor position logging (X/Y coordinates for each frame)
- ✅ Frame storage in recording store
- ✅ Session management with unique IDs
- ✅ Parallel capture of screen, window, and cursor data

## Requirements Validated
- **FR-2.2**: Take periodic screenshots during recording (1/sec)
- **FR-2.3**: Detect active window and track focus changes
- **FR-2.4**: Capture mouse cursor position for each frame
- **FR-2.5**: Store captures with timestamps for timeline sync

## How to Test

### Prerequisites
- Ensure the dev server is running: `npm run tauri dev`
- The app window should be visible with the test components

### Test Steps

#### 1. Basic Capture Test
1. Scroll down to the "Capture Hook Test" section
2. Click **"Start Capture (1fps)"** button
3. **Expected behavior**:
   - Button should become disabled
   - Session ID should appear (e.g., `session-1234567890`)
   - "Frames captured (hook)" should start incrementing every second
   - "Frames in store" should match the hook count
   - Console should log: `"Starting capture session session-XXXXX with interval 1000ms"`
   - Console should log: `"Captured frame session-XXXXX-N at [timestamp]"` every second

#### 2. Cursor Position Tracking
1. While capture is running, **move your mouse around the screen**
2. **Expected behavior**:
   - The "Recent Frames" section should show cursor positions
   - Each frame should display: `Cursor: (X, Y)` with different coordinates
   - Coordinates should reflect your mouse movements

#### 3. Window Tracking
1. While capture is running, **switch between different windows**:
   - Click on different applications
   - Switch to browser, file explorer, etc.
2. **Expected behavior**:
   - Each frame should capture the active window at that moment
   - Window info is logged in the console (check for window title and process name)

#### 4. Stop Capture
1. Click **"Stop Capture"** button
2. **Expected behavior**:
   - Session ID should change to "Not capturing"
   - Frame count should stop incrementing
   - Console should log: `"Stopping capture session session-XXXXX"`
   - Start button should become enabled again

#### 5. Multiple Sessions
1. Start a new capture session
2. Let it run for a few seconds
3. Stop it
4. Start another session
5. **Expected behavior**:
   - Each session should have a unique ID
   - Frame count should reset to 0 for each new session
   - Previous session data should be preserved in the store

### What to Look For

#### ✅ Success Indicators
- Frame count increments every second (1fps)
- Cursor positions are captured and displayed
- Session ID is unique for each capture session
- No errors in the console
- Frames are stored in the recording store

#### ❌ Failure Indicators
- Frame count doesn't increment
- Cursor positions are always undefined
- Console shows errors like "Failed to capture frame"
- Session ID doesn't appear
- App crashes or freezes

### Performance Checks
- **Capture latency**: Should feel responsive, no noticeable lag
- **Memory usage**: Should not grow excessively during capture
- **CPU usage**: Should remain reasonable (check Task Manager)

## Known Limitations
1. **File paths**: Screenshots are saved to `{sessionId}/frame-{N}.webp` but the directory creation is handled by the Rust command
2. **Window tracking**: Only works on Windows (returns error on other platforms)
3. **Cursor tracking**: Only works on Windows (returns error on other platforms)
4. **Error handling**: Individual frame failures don't stop the capture session

## Troubleshooting

### Issue: Frame count doesn't increment
- Check console for error messages
- Verify Rust commands are registered (check Task 5 test)
- Ensure screenshot plugin is properly installed

### Issue: Cursor position is always undefined
- This is expected on non-Windows platforms
- On Windows, check if the `get_cursor_position` command works (use Task 5 test)

### Issue: "Failed to capture frame" errors
- Check if the output directory exists and is writable
- Verify the screenshot plugin has necessary permissions
- Check available disk space

## Next Steps After Testing

Once you've verified the hook works correctly:
1. **Report results**: Let me know if all tests pass or if you encounter issues
2. **Integration**: This hook will be integrated with the Toolbar component for actual recording
3. **Storage**: Task 8 will implement proper session storage and cleanup

## Questions to Answer

Please test and let me know:
1. ✅ Does the capture start and stop correctly?
2. ✅ Are frames captured at ~1 per second?
3. ✅ Are cursor positions logged correctly?
4. ✅ Does switching windows work as expected?
5. ✅ Are there any errors in the console?
6. ✅ Does the frame count match between hook and store?

---

**Remember**: According to the testing guidelines, I should NOT claim this is "fixed" or "working" until you confirm it works on your machine! 🎯
