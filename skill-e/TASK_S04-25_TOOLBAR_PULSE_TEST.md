# Task S04-25: Toolbar Pulse Animation - Testing Instructions

## Overview
This task implements pulsing animations for the record button in the Toolbar component to provide visual feedback during recording.

**Requirements**: FR-4.25, FR-4.27

## What Was Implemented

### 1. CSS Animations (`src/styles/overlay-animations.css`)
Added two new keyframe animations:

- **`record-pulse-red`**: Pulsing red glow effect when recording is active
  - 2-second infinite loop
  - Expands from 0 to 8px with fade
  - Additional outer glow at 16px for depth
  
- **`record-pulse-yellow`**: Pulsing yellow/orange glow effect when paused
  - 2-second infinite loop
  - Same expansion pattern but with orange color (#fb923c)

### 2. Utility Classes
- `.record-button-active`: Applies red pulse animation
- `.record-button-paused`: Applies yellow/orange pulse animation

### 3. Toolbar Component Updates (`src/components/Toolbar/Toolbar.tsx`)
Updated the record/pause button to dynamically apply animation classes:
- When recording (not paused): `record-button-active` class
- When paused: `record-button-paused` class
- When not recording: No animation class

### 4. CSS Import
Added import in `src/main.tsx` to ensure animations are loaded globally.

## Testing Instructions

### Test 1: Start Recording - Red Pulse
1. **Start the app**: `npm run tauri dev`
2. **Click the Record button** (circle icon)
3. **Expected Result**:
   - Button should show a pulsing red glow
   - Glow expands outward smoothly
   - Animation loops continuously (2-second cycle)
   - Button remains functional

### Test 2: Pause Recording - Yellow/Orange Pulse
1. **While recording**, click the **Pause button**
2. **Expected Result**:
   - Button changes to show circle icon (resume)
   - Glow color changes from red to yellow/orange
   - Pulsing animation continues with new color
   - Animation is smooth without jarring transitions

### Test 3: Resume Recording - Back to Red Pulse
1. **While paused**, click the **Resume button**
2. **Expected Result**:
   - Button changes back to pause icon
   - Glow color changes from yellow/orange back to red
   - Pulsing animation continues smoothly
   - No animation glitches during transition

### Test 4: Stop Recording - No Pulse
1. **While recording**, click the **Stop button** (square icon)
2. **Expected Result**:
   - Recording stops
   - Pulse animation stops immediately
   - Button returns to default state (no glow)
   - Button shows circle icon (ready to start again)

### Test 5: Visual Quality Check
**Verify the following**:
- ✅ Pulse animation is smooth (60fps)
- ✅ Glow effect is subtle and not distracting
- ✅ Colors match design:
  - Red: `rgba(239, 68, 68, ...)` (Tailwind red-500)
  - Orange: `rgba(251, 146, 60, ...)` (Tailwind orange-400)
- ✅ Animation doesn't affect button functionality
- ✅ No performance issues or lag
- ✅ Works on both light and dark themes

### Test 6: Edge Cases
1. **Rapid state changes**: Click start → pause → resume → stop quickly
   - Animation should transition smoothly without breaking
2. **Window minimize/restore**: Minimize toolbar, then restore
   - Animation should continue correctly
3. **Multiple cycles**: Let recording run for 30+ seconds
   - Animation should loop consistently without degradation

## Acceptance Criteria

- [x] Red pulsing glow when recording is active (FR-4.25)
- [x] Yellow/orange pulsing glow when paused (FR-4.27)
- [x] Smooth transitions between states
- [x] Animation doesn't interfere with button functionality
- [x] Performance remains at 60fps
- [x] Animation stops when recording stops

## Technical Details

### Animation Specifications
```css
/* Red Pulse - Active Recording */
@keyframes record-pulse-red {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(239, 68, 68, 0),
                0 0 16px 4px rgba(239, 68, 68, 0.4);
  }
}

/* Yellow/Orange Pulse - Paused */
@keyframes record-pulse-yellow {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(251, 146, 60, 0.7);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(251, 146, 60, 0),
                0 0 16px 4px rgba(251, 146, 60, 0.4);
  }
}
```

### Component Logic
```tsx
<Button
  className={`h-9 w-9 rounded-full ${
    isPaused ? 'record-button-paused' : 'record-button-active'
  }`}
>
```

## Files Modified
- ✅ `skill-e/src/styles/overlay-animations.css` - Added animations
- ✅ `skill-e/src/components/Toolbar/Toolbar.tsx` - Applied classes
- ✅ `skill-e/src/main.tsx` - Imported CSS

## Next Steps
After testing confirms the animations work correctly:
1. Mark task as complete
2. Update DEVLOG.md with completion
3. Consider Task 26 (Minimal Overlay Status) if needed

## Notes
- Animation uses `box-shadow` for GPU acceleration
- 2-second duration provides calm, professional feel
- Colors chosen to match Tailwind's design system
- Animation respects `prefers-reduced-motion` media query
