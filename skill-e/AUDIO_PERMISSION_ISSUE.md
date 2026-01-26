# Audio Permission Issue - Investigation Report

## Problem
When clicking "Start Recording" or "Request Permission", the browser permission prompt for microphone access does NOT appear. The getUserMedia() call fails silently or with a NotAllowedError.

## Root Cause
**WebView2 (Microsoft Edge WebView) has a known bug where getUserMedia() permission prompts don't work reliably.**

### Evidence from Research:
1. **GitHub Issue**: https://github.com/tauri-apps/tauri/issues/4434
   - Multiple users report getUserMedia() not working in Tauri apps on Windows
   - The issue is blocked by WebView2 limitations

2. **WebView2 Feedback**: https://github.com/MicrosoftEdge/WebView2Feedback/issues/2427
   - Microsoft acknowledges the permission prompt issue
   - No native API to reset or request permissions programmatically

3. **Stack Overflow**: https://stackoverflow.com/questions/73501432
   - Confirms there's currently no API to handle this properly
   - Solutions are blocked by WebView2 limitations

## Why This Happens
- In a normal browser (Chrome, Edge), getUserMedia() triggers a permission prompt automatically
- In WebView2 (embedded browser), the permission system works differently
- WebView2 requires the **host application** to handle permission requests via the `PermissionRequested` event
- Tauri/WRY doesn't currently expose this event to developers

## Current Status
- ✅ Code is correct - getUserMedia() is called properly
- ✅ Audio constraints are correct (16kHz mono for Whisper)
- ❌ Permission prompt doesn't appear (WebView2 limitation)
- ❌ No way to handle PermissionRequested event in Tauri v2

## Possible Solutions

### Option 1: Wait for Tauri/WRY to Add Permission Handler API
**Status**: Not available yet
**Timeline**: Unknown
**Effort**: None (wait for upstream fix)

### Option 2: Use Native OS Permissions (Windows)
**Status**: Requires Windows API calls
**Timeline**: Can implement now
**Effort**: Medium
**Approach**:
- Check Windows microphone permission status via WinRT API
- Guide user to Windows Settings if permission denied
- Still won't show in-app prompt, but can detect and guide

### Option 3: Use Tauri Plugin for Permissions
**Status**: Check if plugin exists
**Timeline**: Can implement now if available
**Effort**: Low
**Approach**:
- Search for tauri-plugin-permissions or similar
- May provide OS-level permission checking

### Option 4: Document Manual Permission Grant
**Status**: Can implement immediately
**Timeline**: Now
**Effort**: Very Low
**Approach**:
- Add instructions for users to manually grant microphone permission
- Windows: Settings > Privacy > Microphone > Allow apps to access microphone
- Detect permission state and show helpful error messages

### Option 5: Test on macOS
**Status**: Can test now
**Timeline**: Now
**Effort**: Low
**Approach**:
- macOS WebView (WKWebView) may handle permissions differently
- Test if permission prompt works on macOS
- If yes, document Windows limitation

## Recommended Next Steps

1. **Immediate**: Implement Option 4 (Document manual permission grant)
   - Update error messages to guide users
   - Add instructions in the test component
   - Check Windows microphone privacy settings

2. **Short-term**: Implement Option 2 (Check OS permissions)
   - Use Windows API to check microphone permission status
   - Show clear instructions if permission denied
   - Provide link to Windows Settings

3. **Long-term**: Monitor Tauri/WRY for permission handler API
   - Watch https://github.com/tauri-apps/tauri/issues/4434
   - Watch https://github.com/tauri-apps/wry for updates
   - Implement proper permission handling when available

## Testing on macOS
The user has a Mac. We should test if the permission prompt works correctly on macOS, as WKWebView may handle this differently than WebView2.

## References
- [Tauri Issue #4434](https://github.com/tauri-apps/tauri/issues/4434)
- [WebView2 Feedback #2427](https://github.com/MicrosoftEdge/WebView2Feedback/issues/2427)
- [Stack Overflow Discussion](https://stackoverflow.com/questions/73501432)
- [Tauri Discussion #5572](https://github.com/tauri-apps/tauri/discussions/5572)
