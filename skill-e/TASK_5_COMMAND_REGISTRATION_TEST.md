# Task 5: Command Registration - Test Instructions

## Overview
This test verifies that all three screen capture commands are properly registered in Tauri and can be invoked from the frontend.

## Commands Being Tested
1. `capture_screen` - Captures the entire screen and saves as WebP
2. `get_active_window` - Gets information about the currently active window
3. `get_cursor_position` - Gets the current mouse cursor position

## Test Setup

### Prerequisites
- The app should be running in dev mode: `npm run tauri dev`
- Make sure you have write permissions to `C:\temp\` (or the command will create it)

## Test Procedure

### Step 1: Launch the App
```bash
cd skill-e
npm run tauri dev
```

Wait for the app to fully load. You should see the Toolbar and two test components.

### Step 2: Test capture_screen Command

1. **Scroll down** to find the "Capture Commands Test" section
2. **Click** the "Test Capture Screen" button
3. **Expected Result:**
   - Button shows "Capturing..." briefly
   - A green success box appears with:
     - Path: `C:\temp\skill-e-test-[timestamp].webp`
     - Timestamp: Unix timestamp and human-readable date
   - Check the console (F12) for log: `Capture result: {...}`
   - **Verify the file exists** at the path shown

**Success Criteria:**
- ✅ No error message appears
- ✅ Green box shows valid path and timestamp
- ✅ File exists at `C:\temp\skill-e-test-*.webp`
- ✅ File is a valid WebP image (can open in browser/image viewer)
- ✅ File size is reasonable (< 500KB for typical screen)

### Step 3: Test get_active_window Command

1. **Click** the "Test Get Active Window" button
2. **Expected Result:**
   - Button shows "Getting..." briefly
   - A green success box appears with:
     - Title: Should show "Skill-E" or similar (the app window title)
     - Process: Should show "skill-e.exe" or similar
     - Bounds: Should show x, y, width, height values
   - Check the console for log: `Window info: {...}`

**Success Criteria:**
- ✅ No error message appears
- ✅ Title matches the app window title
- ✅ Process name is reasonable (contains "skill-e" or "tauri")
- ✅ Bounds values are positive numbers
- ✅ Width and height match approximate window size

### Step 4: Test get_cursor_position Command

1. **Move your mouse** to a known position (e.g., top-left corner of screen)
2. **Click** the "Test Get Cursor Position" button
3. **Expected Result:**
   - Button shows "Getting..." briefly
   - A green success box appears with:
     - Position: X and Y coordinates
   - Check the console for log: `Cursor position: [x, y]`

**Success Criteria:**
- ✅ No error message appears
- ✅ X and Y values are positive numbers
- ✅ Values are within your screen resolution (e.g., X < 1920, Y < 1080 for 1080p)
- ✅ Moving mouse and clicking again shows different values

### Step 5: Verify Command Registration in Code

Open `skill-e/src-tauri/src/lib.rs` and verify:

```rust
// Commands are imported
use commands::capture::{capture_screen, get_active_window, get_cursor_position};

// Commands are registered in invoke_handler
.invoke_handler(tauri::generate_handler![
    // ... other commands ...
    capture_screen,
    get_active_window,
    get_cursor_position
])
```

**Success Criteria:**
- ✅ All three commands are imported from `commands::capture`
- ✅ All three commands are listed in `generate_handler!` macro
- ✅ No compilation errors

## Troubleshooting

### Error: "Failed to create output directory"
- **Solution:** Run the app as administrator, or change the output path in the test component to a directory you have write access to.

### Error: "No screens found"
- **Solution:** This is rare. Restart the app or check if your display drivers are working correctly.

### Error: "Window tracking is only supported on Windows"
- **Solution:** This is expected on macOS/Linux. The commands are Windows-only for now.

### Error: "Failed to get cursor position"
- **Solution:** This is rare. Try moving your mouse and clicking again.

## Expected Console Output

When all tests pass, you should see in the console (F12):

```
Capture result: { path: "C:\\temp\\skill-e-test-1234567890.webp", timestamp: 1234567890 }
Window info: { title: "Skill-E", process_name: "skill-e.exe", bounds: { x: 100, y: 100, width: 800, height: 600 } }
Cursor position: [500, 300]
```

## Requirements Validated

This test validates the following requirements from S02-screen-capture:

- **FR-2.1**: Capture entire screen ✅
- **FR-2.3**: Detect active window and track focus changes ✅
- **FR-2.4**: Capture mouse cursor position for each frame ✅
- **NFR-2.2**: Storage format: WebP (Quality 80) ✅

## Next Steps

After all tests pass:
1. ✅ Mark Task 5 as complete
2. ✅ Update DEVLOG.md with completion status
3. ✅ Proceed to Task 6: Type Definitions (if not already complete)

## Notes

- The test component is temporary and will be removed once the full capture system is integrated
- The commands are registered and working, ready to be used by the capture hook in Task 7
- All three commands are async and return Results, following Rust best practices
