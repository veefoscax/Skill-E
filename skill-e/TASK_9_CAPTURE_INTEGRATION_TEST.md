# Task 9: Capture Integration Testing

## Overview
Comprehensive integration test for the screen capture system, testing all acceptance criteria and non-functional requirements.

## Test Component
**File:** `src/components/CaptureIntegrationTest.tsx`

## How to Run the Test

### 1. Add the Test Component to App.tsx

Add the import and component to your App.tsx:

```typescript
import { CaptureIntegrationTest } from './components/CaptureIntegrationTest';

// In your render:
<CaptureIntegrationTest />
```

### 2. Start the Development Server

```bash
cd skill-e
npm run tauri dev
```

### 3. Run the Test Suite

1. Click the **"Run All Tests"** button
2. The test will:
   - Start a capture session
   - Capture frames for 5 seconds at 1 fps
   - Stop the capture
   - Verify all requirements
   - Display results

### 4. Expected Results

All 6 tests should pass:

✓ **AC1: Screenshot Capture**
- Verifies that screenshots are captured successfully
- Checks that session is created with frames

✓ **AC2: Window Tracking**
- Verifies active window information is captured
- Checks window title, process name, and bounds

✓ **AC3: Cursor Tracking**
- Verifies cursor position is captured for each frame
- Checks X/Y coordinates are valid

✓ **AC4: Storage & Manifest**
- Verifies session directory is created
- Checks manifest.json is saved with all frame metadata
- Validates frames are stored on disk

✓ **NFR-2.1: Capture Rate (~1/sec)**
- Verifies capture rate is approximately 1 frame per second
- Allows 20% tolerance (0.8-1.2 fps)

✓ **NFR-2.1: Capture Latency (<100ms)**
- Measures average latency between expected and actual capture times
- Verifies latency is less than 100ms

## What the Test Validates

### Functional Requirements
- **FR-2.1**: Capture entire screen ✓
- **FR-2.2**: Take periodic screenshots during recording (1/sec) ✓
- **FR-2.3**: Detect active window and track focus changes ✓
- **FR-2.4**: Capture mouse cursor position for each frame ✓
- **FR-2.5**: Store captures with timestamps for timeline sync ✓

### Non-Functional Requirements
- **NFR-2.1**: Capture latency < 100ms ✓
- **NFR-2.2**: Storage format: WebP (Quality 80) ✓
- **NFR-2.3**: Memory-efficient streaming (don't load all to RAM) ✓

### Acceptance Criteria
- **AC1**: Screenshot Capture - Screenshots saved as WebP with timestamps ✓
- **AC2**: Window Tracking - Active window title, process, and bounds captured ✓
- **AC3**: Cursor Tracking - Cursor X/Y position captured each frame ✓
- **AC4**: Storage - Frames stored in temp directory with manifest.json ✓

## Test Features

### Automated Testing
- Runs all tests automatically with one click
- Measures performance metrics (latency, capture rate)
- Validates data integrity (manifest, frames)

### Visual Feedback
- Real-time test status updates
- Color-coded results (green = passed, red = failed)
- Detailed error messages for failures

### Session Management
- **List Sessions**: View all capture sessions in temp directory
- **Cleanup Session**: Delete test session and all files
- Session details displayed after test completion

### Statistics Display
- Total frames captured
- Actual capture rate (fps)
- Average latency (ms)

## Manual Verification Steps

After running the automated test, you can manually verify:

### 1. Check Session Directory
The test displays the session directory path. Navigate to it and verify:
- Directory exists in temp folder
- Contains `manifest.json` file
- Contains multiple `.webp` screenshot files (frame-1.webp, frame-2.webp, etc.)

### 2. Verify Screenshot Quality
Open one of the `.webp` files:
- Image should be clear and readable
- Should show your screen at the time of capture
- File size should be reasonable (typically < 100KB)

### 3. Inspect Manifest File
Open `manifest.json` and verify:
```json
{
  "sessionId": "session-1234567890",
  "startTime": 1234567890000,
  "endTime": 1234567895000,
  "intervalMs": 1000,
  "frames": [
    {
      "id": "session-1234567890-frame-1",
      "timestamp": 1234567890000,
      "imagePath": "frame-1.webp",
      "activeWindow": {
        "title": "Window Title",
        "processName": "process.exe",
        "bounds": { "x": 0, "y": 0, "width": 1920, "height": 1080 }
      },
      "cursorPosition": { "x": 500, "y": 300 }
    }
  ]
}
```

### 4. Verify Window Tracking
- Move between different applications during the test
- Check that different window titles are captured in the manifest
- Verify process names match the active applications

### 5. Verify Cursor Tracking
- Move your mouse during the test
- Check that cursor positions change between frames
- Verify coordinates are within screen bounds

## Troubleshooting

### Test Fails: "No window information captured"
- **Cause**: Windows API permissions issue
- **Solution**: Run the app as administrator or check Windows privacy settings

### Test Fails: "Capture rate too low/high"
- **Cause**: System performance or timing issues
- **Solution**: Close other applications and run test again

### Test Fails: "Capture latency exceeds 100ms"
- **Cause**: System under heavy load
- **Solution**: Close background applications and retry

### Session Directory Not Found
- **Cause**: Permissions issue or temp directory not accessible
- **Solution**: Check that app has write permissions to temp directory

## Cleanup

After testing, use the **"Cleanup Session"** button to remove test files, or manually delete the session directory from:
- Windows: `C:\Users\<username>\AppData\Local\Temp\skill-e-sessions\`

## Success Criteria

✅ All 6 tests pass
✅ Capture rate is ~1 fps (0.8-1.2 fps acceptable)
✅ Average latency < 100ms
✅ Screenshots are saved as WebP files
✅ Manifest.json contains all frame metadata
✅ Window and cursor information captured correctly

## Next Steps

Once all tests pass:
1. Mark Task 9 as complete
2. Proceed to Task 10: Checkpoint verification
3. Consider adding this test to CI/CD pipeline for regression testing

## Notes

- This is an integration test that exercises the entire capture pipeline
- Test captures real screenshots, so ensure you're okay with test data being saved temporarily
- Test automatically cleans up after completion (or use manual cleanup button)
- Test results are logged to console for debugging
