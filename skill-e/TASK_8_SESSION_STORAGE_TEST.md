# Task 8: Session Storage - Test Instructions

## Overview
This task implements session storage functionality for screen capture, including:
- Creating temporary directories for capture sessions
- Saving screenshots to temp folders
- Creating and updating manifest.json for frame metadata
- Implementing cleanup on session end

## Requirements Tested
- **FR-2.5**: Store captures with timestamps for timeline sync
- **NFR-2.3**: Memory-efficient streaming (don't load all to RAM)

## Test Component
A test component has been created at `src/components/SessionStorageTest.tsx`

## How to Test

### Step 1: Add Test Component to App
Add the test component to your App.tsx temporarily:

```tsx
import { SessionStorageTest } from './components/SessionStorageTest';

function App() {
  return (
    <div>
      <SessionStorageTest />
    </div>
  );
}
```

### Step 2: Run the Application
```bash
npm run tauri dev
```

### Step 3: Test Session Creation
1. Click **"Start Capture"** button
2. Observe the log showing:
   - "Starting capture session..."
   - "Session started: session-[timestamp]"
   - "Directory: [path to temp directory]"
3. Verify the "Current Session" panel shows session details
4. Wait 3-5 seconds to capture multiple frames

### Step 4: Test Session Stop
1. Click **"Stop Capture"** button
2. Observe the log showing:
   - "Stopping capture session..."
   - "Session stopped: [session-id]"
   - "Total frames captured: [number]"

### Step 5: Test Manifest Loading
1. Click **"Load Manifest"** button
2. Verify the "Manifest" panel appears with:
   - Session ID
   - Start and end times
   - Interval (1000ms)
   - Frame count
3. Expand "Frame Details" to see individual frame metadata:
   - Frame ID
   - Image path
   - Active window title
   - Cursor position

### Step 6: Test Session Listing
1. Click **"List Sessions"** button
2. Verify the "Available Sessions" panel shows session directories
3. Check the log for session paths

### Step 7: Verify Files on Disk
1. Open the session directory shown in the log (typically in system temp folder)
2. Verify the following files exist:
   - `manifest.json` - Contains session metadata
   - `frame-1.webp`, `frame-2.webp`, etc. - Screenshot files
3. Open `manifest.json` and verify it contains:
   ```json
   {
     "session_id": "session-...",
     "start_time": 1234567890,
     "end_time": 1234567900,
     "interval_ms": 1000,
     "frames": [
       {
         "id": "session-...-frame-1",
         "timestamp": 1234567890,
         "image_path": "frame-1.webp",
         "active_window": { ... },
         "cursor_position": { "x": 100, "y": 200 }
       }
     ]
   }
   ```

### Step 8: Test Cleanup
1. Click **"Cleanup Session"** button
2. Verify the log shows "Session cleaned up: [path]"
3. Navigate to the session directory location
4. Verify the directory has been deleted

### Step 9: Test Multiple Sessions
1. Click "Start Capture" again
2. Wait a few seconds
3. Click "Stop Capture"
4. Click "List Sessions" to see multiple sessions
5. Verify each session has its own directory

## Expected Results

### ✅ Success Criteria
- [ ] Session directory is created in system temp folder
- [ ] Screenshots are saved as WebP files in session directory
- [ ] manifest.json is created and updated with frame metadata
- [ ] Manifest contains all frame information (timestamp, path, window, cursor)
- [ ] Cleanup successfully removes session directory and all files
- [ ] Multiple sessions can coexist without conflicts
- [ ] No memory leaks (frames are streamed to disk, not kept in RAM)

### ❌ Common Issues
- **"Failed to create session directory"**: Check file system permissions
- **"Failed to save manifest"**: Verify temp directory is writable
- **"Failed to capture frame"**: Check screenshot plugin is working (Task 2)
- **Empty manifest**: Ensure frames are being captured before stopping

## Performance Verification

### Memory Efficiency (NFR-2.3)
1. Start a long capture session (30+ seconds)
2. Monitor memory usage in Task Manager
3. Verify memory doesn't grow significantly with frame count
4. Frames should be written to disk immediately, not accumulated in RAM

### Storage Format (NFR-2.2)
1. Check WebP file sizes in session directory
2. Verify files are < 100KB each (depends on screen content)
3. Confirm quality is acceptable for skill generation

## Cleanup After Testing

1. Remove the test component from App.tsx
2. Clean up any remaining test sessions:
   - Navigate to temp directory (shown in logs)
   - Delete `skill-e-sessions` folder
3. Or use the "List Sessions" + "Cleanup Session" buttons to clean up programmatically

## Integration Notes

This session storage system integrates with:
- **Task 2**: Uses `capture_screen` command
- **Task 3**: Uses `get_active_window` command  
- **Task 4**: Uses `get_cursor_position` command
- **Task 7**: Used by `useCapture` hook

The manifest.json format is designed for:
- **S05 Processing**: Timeline reconstruction
- **S06 Skill Export**: Screenshot embedding in SKILL.md
- **S07 Variable Detection**: Correlating actions with screen state

## Next Steps

After verifying this task works:
- **Task 9**: Comprehensive capture testing
- **Task 10**: Phase checkpoint and integration verification
