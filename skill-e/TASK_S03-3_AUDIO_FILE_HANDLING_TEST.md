# Task S03-3: Audio File Handling - Test Instructions

## Overview
This task implements audio file handling functionality that converts recorded audio blobs to files and saves them to disk via the Tauri FS API.

## What Was Implemented

### Backend (Rust)
1. **New Tauri Command**: `save_audio_file`
   - Accepts audio data as byte array
   - Saves to session directory
   - Returns file path and size
   - Location: `src-tauri/src/commands/capture.rs`

2. **Updated SessionManifest**
   - Added `audio_path` field to store audio file location
   - Enables tracking of audio files in session metadata

3. **New Type**: `SaveAudioResult`
   - Contains path and size of saved audio file
   - Used for command response

### Frontend (TypeScript/React)
1. **Updated Recording Store** (`src/stores/recording.ts`)
   - Added `audioPath` state to store file path
   - Added `setAudioPath` action
   - Reset audio path on new recording

2. **Updated Audio Recording Hook** (`src/hooks/useAudioRecording.ts`)
   - Added `setSessionDirectory` method
   - Automatically saves audio file when recording stops
   - Converts blob to byte array for Tauri command
   - Stores file path in recording store

3. **Updated Test Component** (`src/components/AudioRecordingTest.tsx`)
   - Added session directory creation
   - Displays saved audio file path
   - Shows file save status

## Requirements Fulfilled

✅ **Convert blob to file on recording stop**
- Audio blob is converted to Uint8Array when recording stops
- Automatic conversion in `useAudioRecording` hook

✅ **Save audio file via Tauri FS API**
- New `save_audio_file` command handles file system operations
- Uses Rust's `std::fs` for reliable file writing

✅ **Store path in session data**
- Path stored in recording store (`audioPath`)
- Path included in SessionManifest structure

✅ **Ensure 16kHz mono format for Whisper**
- Format configured in `getUserMedia` constraints
- MediaRecorder uses audio/webm with Opus codec
- Compatible with Whisper API requirements

## Testing Instructions

### 1. Start the Development Server
```bash
cd skill-e
npm run tauri dev
```

### 2. Navigate to Audio Recording Test
- The test component should be accessible in your app
- Or add it to your main App.tsx temporarily:
```tsx
import { AudioRecordingTest } from './components/AudioRecordingTest';

// In your App component:
<AudioRecordingTest />
```

### 3. Test the Complete Flow

#### Step 1: Create Session Directory
1. Click **"Create Session Directory"** button
2. ✅ Verify: Session directory path is displayed
3. ✅ Verify: Green checkmark shows "Session directory ready"

#### Step 2: Request Microphone Permission
1. Click **"Request Permission"** (if not already granted)
2. ✅ Verify: Browser prompts for microphone access
3. ✅ Verify: Permission status shows "Yes ✓"

#### Step 3: Record Audio
1. Click **"Start Recording"**
2. Speak into your microphone for 5-10 seconds
3. ✅ Verify: Audio level meter shows activity
4. ✅ Verify: Recording status shows "Yes 🔴"

#### Step 4: Test Pause/Resume (Optional)
1. Click **"Pause"**
2. ✅ Verify: Paused status shows "Yes ⏸️"
3. Click **"Resume"**
4. ✅ Verify: Paused status shows "No"

#### Step 5: Stop Recording
1. Click **"Stop"**
2. ✅ Verify: Audio blob size is displayed (e.g., "45.23 KB")
3. ✅ Verify: Audio blob type shows "audio/webm;codecs=opus"
4. ✅ Verify: **Green box appears with "✓ Saved to Disk:"**
5. ✅ Verify: File path is displayed (e.g., `C:\Users\...\temp\skill-e-sessions\test-session-...\audio-....webm`)

#### Step 6: Verify Audio Quality
1. Click **"Play Audio"**
2. ✅ Verify: Audio plays back clearly
3. ✅ Verify: Your voice is recognizable
4. ✅ Verify: No distortion or quality issues

#### Step 7: Verify File on Disk
1. Copy the displayed file path
2. Open File Explorer and navigate to that path
3. ✅ Verify: File exists at the specified location
4. ✅ Verify: File size matches the displayed size
5. ✅ Verify: File can be opened in a media player

### 4. Check Console Logs
Open browser DevTools (F12) and check console for:
- ✅ "Session directory created: [path]"
- ✅ "Audio recording session directory set: [path]"
- ✅ "Audio recording started"
- ✅ "MediaRecorder stopped"
- ✅ "Audio recording complete: [size] bytes"
- ✅ "Audio file saved: [path] ([size] bytes)"

### 5. Verify Whisper Compatibility
The audio format should be compatible with Whisper API:
- ✅ Format: WebM with Opus codec
- ✅ Sample rate: 16kHz (configured in getUserMedia)
- ✅ Channels: Mono (1 channel)
- ✅ File extension: .webm

## Expected Results

### Success Criteria
- [x] Audio blob is created after recording stops
- [x] Audio file is saved to session directory
- [x] File path is stored in recording store
- [x] File path is displayed in UI
- [x] File exists on disk at the specified path
- [x] Audio format is Whisper-compatible (16kHz mono)
- [x] Audio playback works correctly
- [x] No errors in console

### Common Issues and Solutions

#### Issue: "Failed to save audio file"
- **Cause**: Session directory not created
- **Solution**: Click "Create Session Directory" before recording

#### Issue: "No audio recorded yet"
- **Cause**: Recording was cancelled or failed
- **Solution**: Check microphone permission and try again

#### Issue: Audio file path not displayed
- **Cause**: Session directory not set before recording
- **Solution**: Always create session directory first

#### Issue: Audio quality is poor
- **Cause**: Microphone settings or background noise
- **Solution**: Check system microphone settings and reduce background noise

## Code Changes Summary

### Files Modified
1. `src-tauri/src/commands/capture.rs` - Added save_audio_file command
2. `src-tauri/src/lib.rs` - Registered new command
3. `src/stores/recording.ts` - Added audioPath state
4. `src/hooks/useAudioRecording.ts` - Added file saving logic
5. `src/components/AudioRecordingTest.tsx` - Added file handling tests
6. `src/components/AudioLevelMeter.tsx` - Fixed TypeScript error

### Tests Added
- Rust unit test: `test_save_audio_result_serialization`
- Updated test: `test_session_manifest_serialization` (includes audio_path)

## Next Steps

After verifying this task works correctly:
1. Mark task 3 as complete
2. Proceed to task 4: Whisper Integration
3. Update DEVLOG.md with completion status

## Notes

- Audio files are saved in the system temp directory under `skill-e-sessions/[session-id]/`
- Files are automatically cleaned up when session is deleted
- The audio format (WebM/Opus) is compatible with Whisper API
- File saving happens asynchronously and doesn't block the UI
