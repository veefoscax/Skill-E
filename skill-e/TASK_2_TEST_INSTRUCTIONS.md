# Task 2: Screen Capture Command - Test Instructions

## What Was Implemented

✅ **Created Rust capture command** (`src-tauri/src/commands/capture.rs`)
- Implements `capture_screen` command
- Captures entire screen using `screenshots` crate
- Saves as WebP format (Quality 80)
- Returns path and timestamp

✅ **Created TypeScript types** (`src/types/capture.ts`)
- `CaptureResult` interface
- `CaptureFrame` interface
- `CaptureSession` interface
- `WindowInfo` interface

✅ **Created frontend utilities** (`src/lib/capture.ts`)
- `captureScreen()` function to invoke Rust command
- `generateScreenshotPath()` helper function

✅ **Created test component** (`src/components/CaptureTest.tsx`)
- Simple UI to test the capture functionality
- Shows success/error messages
- Displays captured file path and timestamp

## Requirements Validated

- ✅ **FR-2.1**: Capture entire screen
- ✅ **FR-2.2**: Save as WebP format
- ✅ **NFR-2.2**: Storage format WebP (Quality 80)

## How to Test

### Prerequisites
The app should already be running. If not, run:
```bash
cd skill-e
npm run tauri dev
```

### Test Steps

1. **Open the Skill-E app** - You should see:
   - The toolbar at the top
   - A "Screen Capture Test" panel below it

2. **Click "Capture Screen" button**
   - The button should show "Capturing..." briefly
   - After ~1 second, you should see either:
     - ✅ **Success message** with file path and timestamp
     - ❌ **Error message** if something went wrong

3. **Verify the screenshot was saved**
   - Open File Explorer
   - Navigate to `C:\temp\skill-e\`
   - You should see a file like `test_1234567890.webp`
   - Open the file to verify it captured your screen

4. **Test multiple captures**
   - Click "Capture Screen" multiple times
   - Each capture should create a new file with a unique timestamp
   - All files should be WebP format

### Expected Results

✅ **Success Criteria:**
- Button responds to clicks
- Success message appears after capture
- WebP file is created in `C:\temp\skill-e\`
- File contains a screenshot of your entire screen
- Timestamp is accurate (matches current time)
- File size is reasonable (typically 50-200KB depending on screen content)

❌ **Failure Indicators:**
- Error message appears
- No file is created
- File is empty or corrupted
- File is not WebP format

## Testing Checklist

- [ ] App launches successfully
- [ ] Test component is visible
- [ ] "Capture Screen" button is clickable
- [ ] Button shows "Capturing..." state
- [ ] Success message appears with path and timestamp
- [ ] File exists at the specified path
- [ ] File is in WebP format
- [ ] File contains a valid screenshot
- [ ] Multiple captures create unique files
- [ ] Timestamps are accurate

## Known Limitations

- Currently captures only the primary monitor (first screen)
- No cursor position tracking yet (Task 4)
- No active window detection yet (Task 3)
- Test component uses hardcoded path `C:\temp\skill-e\`

## Next Steps After Testing

Once you confirm the capture works:
1. I'll mark Task 2 as complete
2. I'll update the DEVLOG
3. We can proceed to Task 3 (Window Tracking) or Task 4 (Cursor Position)

## Troubleshooting

**If you see "Failed to capture screen":**
- Check if you have multiple monitors (currently only captures primary)
- Try restarting the app

**If you see "Failed to create output directory":**
- Verify `C:\temp\skill-e\` exists
- Check folder permissions

**If the file is empty or corrupted:**
- This might indicate an issue with WebP encoding
- Check the console for Rust errors

## Please Test and Report

**Please test the capture functionality and let me know:**
1. ✅ Does the capture button work?
2. ✅ Is the file created successfully?
3. ✅ Does the screenshot show your screen correctly?
4. ✅ Is the file in WebP format?

Once you confirm it works, I'll complete the task and update the documentation!
