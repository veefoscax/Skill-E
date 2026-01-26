# Task 3: Window Tracking - Test Instructions

## Overview
This document provides instructions for testing the window tracking functionality implemented in Task 3.

## What Was Implemented

### Rust Backend (Windows API Integration)
- ✅ Added Windows API dependencies (`windows` crate v0.58)
- ✅ Implemented `get_active_window()` command using Windows API
- ✅ Returns window title, process name, and bounds (x, y, width, height)
- ✅ Handles permission errors gracefully
- ✅ Registered command in Tauri

### TypeScript Frontend
- ✅ Added `getActiveWindow()` function to `src/lib/capture.ts`
- ✅ Updated `CaptureTest` component with window tracking test button
- ✅ Types already existed in `src/types/capture.ts` (WindowInfo interface)

## Requirements Tested
- **FR-2.3**: Detect active window and track focus changes
- **AC2**: Window Tracking
  - Active window title captured
  - Window focus changes detected
  - Window bounds recorded

## How to Test

### Prerequisites
1. Ensure the app is running in development mode
2. The CaptureTest component should be visible in the app

### Test Steps

#### Test 1: Get Active Window Info
1. **Open a different application** (e.g., Notepad, Chrome, VS Code)
2. Make sure that application is the **active/focused window**
3. **Switch back to Skill-E** and click the **"Get Active Window"** button
4. **Expected Result**: 
   - A blue info box should appear showing:
     - Window title (e.g., "Untitled - Notepad")
     - Process name (e.g., "notepad.exe")
     - Position (x, y coordinates)
     - Size (width × height in pixels)

#### Test 2: Track Focus Changes
1. Open **Notepad** and click "Get Active Window"
   - Note the window info displayed
2. Open **Chrome** and click "Get Active Window"
   - The info should change to show Chrome's details
3. Open **VS Code** and click "Get Active Window"
   - The info should change to show VS Code's details

**Expected Result**: Each time you click the button, it should show the currently active window's information.

#### Test 3: Window Bounds Accuracy
1. Open **Notepad**
2. Move it to a specific position on your screen (e.g., top-left corner)
3. Resize it to a specific size
4. Click "Get Active Window" in Skill-E
5. **Verify**:
   - The x, y coordinates match the window's position
   - The width and height match the window's size

#### Test 4: Error Handling
1. Click "Get Active Window" when Skill-E itself is the active window
2. **Expected Result**: Should still work and show Skill-E's window info

### Success Criteria
✅ Window title is captured correctly  
✅ Process name is captured correctly (e.g., "chrome.exe", "notepad.exe")  
✅ Window bounds (x, y, width, height) are accurate  
✅ Focus changes are detected (different windows show different info)  
✅ No errors or crashes occur  

### Known Limitations
- **Windows Only**: This feature only works on Windows (uses Windows API)
- **Permission Errors**: Some system windows may not be accessible
- **Timing**: The window info is captured at the moment you click the button

## Testing the Implementation

Since Rust/Cargo is not in your PATH, you'll need to test this by running the app:

```bash
npm run tauri dev
```

If the app builds successfully and you can click the "Get Active Window" button without errors, the implementation is working correctly.

## What to Report

Please test the functionality and report:

1. ✅ **Does the "Get Active Window" button work?**
2. ✅ **Does it show the correct window title?**
3. ✅ **Does it show the correct process name?**
4. ✅ **Are the window bounds (position and size) accurate?**
5. ✅ **Does it detect focus changes when you switch between different applications?**
6. ❌ **Any errors or issues encountered?**

## Next Steps

After you confirm the window tracking works:
- I'll mark Task 3 as complete
- I'll update the DEVLOG with the completion
- We can proceed to Task 4: Cursor Position tracking

---

**Note**: According to the testing guidelines, I will NOT claim this is "fixed" or "working" until you verify it works on your machine. Please test and let me know the results!
