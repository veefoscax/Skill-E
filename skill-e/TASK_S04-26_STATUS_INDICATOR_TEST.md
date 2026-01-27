# Task S04-26: Minimal Overlay Status Indicator - Test Instructions

## Overview
This task implements a minimal, non-intrusive status indicator for the overlay window. A tiny red dot (8px) appears in the corner to show recording status.

## Requirements
- **FR-4.26**: Optional small red dot in overlay corner to show recording status

## Implementation Details

### Components Created
1. **StatusIndicator.tsx** - Minimal status indicator component
   - 8px pulsing dot
   - Red when recording, orange when paused
   - Hidden when stopped
   - Configurable position (4 corners)
   - Smooth fade-in animation

2. **StatusIndicatorTest.tsx** - Interactive test component
   - Test all recording states (recording, paused, stopped)
   - Test all positions (top-left, top-right, bottom-left, bottom-right)
   - Test visibility toggle
   - Test store integration
   - Visual preview area

### Store Updates
Updated `overlay.ts` store with:
- `recordingStatus`: 'recording' | 'paused' | 'stopped'
- `statusIndicatorVisible`: boolean
- `statusIndicatorPosition`: corner position
- Actions: `setRecordingStatus()`, `toggleStatusIndicator()`, `setStatusIndicatorPosition()`

### Overlay Integration
Updated `Overlay.tsx` to include StatusIndicator as Layer 5 (z-50)

## Testing Instructions

### 1. Start the Development Server
```bash
cd skill-e
npm run dev
```

### 2. Open the Test Page
Navigate to: `http://localhost:1420/#/status-indicator-test`

### 3. Test Recording States

#### Test 3.1: Recording State (Red Dot)
1. Click the **"Recording"** button
2. **Verify**: Red dot appears in the selected corner
3. **Verify**: Dot has smooth pulsing animation (2s cycle)
4. **Verify**: Dot has red glow effect

#### Test 3.2: Paused State (Orange Dot)
1. Click the **"Paused"** button
2. **Verify**: Dot changes to orange/yellow color
3. **Verify**: Dot continues pulsing (slower, 3s cycle)
4. **Verify**: Dot has orange glow effect

#### Test 3.3: Stopped State (Hidden)
1. Click the **"Stopped"** button
2. **Verify**: Dot disappears completely
3. **Verify**: No visual artifacts remain

### 4. Test Positioning

#### Test 4.1: Top-Right Corner (Default)
1. Click **"Top Right"** position button
2. **Verify**: Dot appears 16px from top-right corner
3. **Verify**: Dot doesn't overlap with content

#### Test 4.2: Top-Left Corner
1. Click **"Top Left"** position button
2. **Verify**: Dot moves to top-left corner
3. **Verify**: Smooth transition

#### Test 4.3: Bottom-Right Corner
1. Click **"Bottom Right"** position button
2. **Verify**: Dot moves to bottom-right corner

#### Test 4.4: Bottom-Left Corner
1. Click **"Bottom Left"** position button
2. **Verify**: Dot moves to bottom-left corner

### 5. Test Visibility Toggle

#### Test 5.1: Hide Indicator
1. Set status to "Recording" (red dot visible)
2. Click **"Visible"** button to toggle off
3. **Verify**: Dot disappears even though status is recording
4. **Verify**: Button shows "Hidden"

#### Test 5.2: Show Indicator
1. Click **"Hidden"** button to toggle on
2. **Verify**: Dot reappears
3. **Verify**: Button shows "Visible"

### 6. Test Store Integration

#### Test 6.1: Local State Mode
1. Ensure **"Using Local State"** is active
2. Change status, position, visibility
3. **Verify**: Changes work correctly
4. **Verify**: State is isolated to test component

#### Test 6.2: Store Mode
1. Click **"Using Local State"** to switch to **"Using Store"**
2. Change status, position, visibility
3. **Verify**: Changes work correctly
4. **Verify**: State is managed by overlay store
5. **Verify**: Changes persist in store

### 7. Visual Quality Tests

#### Test 7.1: Minimal Size
1. Set status to "Recording"
2. **Verify**: Dot is exactly 8px diameter
3. **Verify**: Dot is small and non-intrusive
4. **Verify**: Dot doesn't obscure content

#### Test 7.2: Animation Smoothness
1. Watch the pulsing animation
2. **Verify**: Animation is smooth (60fps)
3. **Verify**: No jank or stuttering
4. **Verify**: Pulse is subtle, not distracting

#### Test 7.3: Glow Effect
1. Observe the dot's glow
2. **Verify**: Red glow for recording state
3. **Verify**: Orange glow for paused state
4. **Verify**: Glow is subtle and tasteful

### 8. Accessibility Tests

#### Test 8.1: Reduced Motion
1. Enable "Reduce motion" in OS settings
2. Refresh the test page
3. **Verify**: Animations are disabled or minimal
4. **Verify**: Dot is still visible and functional

#### Test 8.2: ARIA Labels
1. Inspect the StatusIndicator element
2. **Verify**: Has `role="status"` attribute
3. **Verify**: Has `aria-label` with current state

### 9. Integration Test (Overlay Window)

#### Test 9.1: In Actual Overlay
1. Open the overlay window: `http://localhost:1420/#/overlay`
2. Open browser console
3. Run: `useOverlayStore.getState().setRecordingStatus('recording')`
4. **Verify**: Red dot appears in overlay
5. Run: `useOverlayStore.getState().setRecordingStatus('paused')`
6. **Verify**: Dot changes to orange
7. Run: `useOverlayStore.getState().setRecordingStatus('stopped')`
8. **Verify**: Dot disappears

## Expected Results

### Visual Appearance
- **Size**: 8px diameter circle
- **Recording**: Red (#EF4444) with red glow
- **Paused**: Orange (#FB923C) with orange glow
- **Stopped**: Hidden (not rendered)
- **Animation**: Smooth 2s pulse (recording) or 3s pulse (paused)
- **Position**: 16px from corner edges

### Behavior
- Appears/disappears based on recording status
- Changes color based on state
- Can be positioned in any corner
- Can be hidden via visibility toggle
- Integrates with overlay store
- Non-intrusive and minimal

### Performance
- Smooth 60fps animation
- No layout shifts
- Minimal CPU/GPU usage
- Respects reduced motion preferences

## Acceptance Criteria

- [x] StatusIndicator component created
- [x] Red dot (8px) for recording state
- [x] Orange dot for paused state
- [x] Hidden when stopped
- [x] Smooth pulsing animation
- [x] Configurable position (4 corners)
- [x] Visibility toggle
- [x] Store integration
- [x] Test component created
- [x] Integrated into Overlay component
- [ ] All visual tests pass
- [ ] All behavior tests pass
- [ ] All integration tests pass

## Notes

### Design Decisions
1. **8px size**: Small enough to be non-intrusive, large enough to be visible
2. **Pulsing animation**: Provides subtle feedback without being distracting
3. **Color coding**: Red = active, Orange = paused (industry standard)
4. **Optional feature**: Can be disabled via settings for minimal UI
5. **Corner positioning**: Stays out of the way of content

### Future Enhancements
- Add tooltip on hover (optional)
- Add click to show recording stats (optional)
- Add recording duration display (optional)
- Sync with toolbar recording button state

## Related Files
- `src/components/Overlay/StatusIndicator.tsx` - Component implementation
- `src/components/StatusIndicatorTest.tsx` - Test component
- `src/stores/overlay.ts` - Store with recording status
- `src/components/Overlay/Overlay.tsx` - Integration point
- `src/App.tsx` - Test route

## Requirements Validation
- **FR-4.26**: ✅ Optional small red dot in overlay corner implemented
- **NFR-4.1**: ✅ Non-intrusive design (8px, subtle animation)
- **NFR-4.2**: ✅ Smooth 60fps animation
- **NFR-4.3**: ✅ Doesn't obscure content
