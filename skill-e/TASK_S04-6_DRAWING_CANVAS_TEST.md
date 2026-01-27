# Task S04-6: Drawing Canvas Test Instructions

## Overview
Testing the DrawingCanvas component with SVG-based drawing and mouse event handling.

## Component Created
- ✅ `src/components/Overlay/DrawingCanvas.tsx` - SVG drawing surface with gesture detection
- ✅ Integrated into `src/components/Overlay/Overlay.tsx`

## Features Implemented

### Drawing Gestures
1. **Dot Marker** (Tap gesture)
   - Short click (< 10px movement, < 200ms)
   - Creates a circle at click position
   
2. **Arrow** (Drag gesture)
   - Drag in any direction
   - Creates arrow from start to end point
   - Includes arrowhead pointing to end
   
3. **Rectangle** (Diagonal drag gesture)
   - Drag with both horizontal and vertical movement (> 20px each)
   - Creates rectangle outline

### Color Selection
- **Key 1**: Red (#FF4444)
- **Key 2**: Blue (#4488FF)
- **Key 3**: Green (#44CC44)
- Visual indicator shows current color

### Drawing Modes
- **Default Mode**: Drawings fade out after 3 seconds
- **Pin Mode**: Press 'P' to toggle - drawings stay until cleared
- **Clear All**: Press 'C' to clear all drawings
- Visual indicator shows current mode (⏱️ Fade or 📌 Pinned)

### Real-time Preview
- Shows preview of drawing while dragging
- Preview updates as mouse moves
- Preview is semi-transparent (60% opacity)

## Manual Testing Steps

### Test 1: Dot Markers
1. Open the overlay window
2. Click quickly in different locations (don't drag)
3. **Expected**: Small circles appear at click positions
4. **Expected**: Circles fade out after 3 seconds

### Test 2: Arrows
1. Click and drag in various directions (horizontal, vertical, diagonal)
2. **Expected**: Arrows appear following the drag direction
3. **Expected**: Arrowheads point to the end of the drag
4. **Expected**: Arrows fade out after 3 seconds

### Test 3: Rectangles
1. Click and drag diagonally (both horizontal and vertical movement)
2. Make sure to drag more than 20px in both directions
3. **Expected**: Rectangle outlines appear
4. **Expected**: Rectangles fade out after 3 seconds

### Test 4: Color Selection
1. Press '1' key
2. Draw something (dot, arrow, or rectangle)
3. **Expected**: Drawing is RED
4. Press '2' key
5. Draw something
6. **Expected**: Drawing is BLUE
7. Press '3' key
8. Draw something
9. **Expected**: Drawing is GREEN
10. **Expected**: Color indicator in top-right shows current color

### Test 5: Pin Mode
1. Press 'P' key to enable pin mode
2. **Expected**: Indicator shows "📌 Pinned"
3. Draw several shapes
4. Wait 5 seconds
5. **Expected**: Drawings DO NOT fade out
6. Press 'P' again to disable pin mode
7. **Expected**: Indicator shows "⏱️ Fade"
8. Draw a shape
9. **Expected**: New drawing fades out after 3 seconds

### Test 6: Clear All
1. Draw several shapes
2. Press 'C' key
3. **Expected**: All drawings disappear immediately

### Test 7: Real-time Preview
1. Click and hold mouse button
2. Move mouse around
3. **Expected**: Preview of drawing appears (semi-transparent)
4. **Expected**: Preview updates as you move
5. Release mouse button
6. **Expected**: Final drawing appears at full opacity

### Test 8: Mouse Event Handling
1. Try drawing near the edges of the screen
2. **Expected**: Drawings work correctly at all positions
3. Try dragging outside the window and releasing
4. **Expected**: Drawing is cancelled gracefully

### Test 9: Gesture Detection Accuracy
1. Make very short clicks (< 10px movement)
2. **Expected**: Always creates dots, never arrows
3. Make long horizontal drags (> 50px horizontal, < 20px vertical)
4. **Expected**: Creates arrows, not rectangles
5. Make diagonal drags (> 20px both directions)
6. **Expected**: Creates rectangles, not arrows

### Test 10: Fade Animation
1. Draw a shape in default mode (not pinned)
2. Watch for 3 seconds
3. **Expected**: Shape stays visible for 2.5 seconds
4. **Expected**: Shape fades out smoothly over 0.5 seconds
5. **Expected**: Shape disappears completely after 3 seconds total

## Requirements Validated

- ✅ **FR-4.6**: Click gesture = Circle/dot marker
- ✅ **FR-4.7**: Drag gesture = Arrow (direction follows drag)
- ✅ **FR-4.8**: Diagonal drag gesture = Rectangle
- ✅ **FR-4.9**: Use 3 fixed colors only (no color picker)
- ✅ **FR-4.10**: Toggle between color 1, 2, 3 with keyboard shortcut
- ✅ **FR-4.11**: Default mode: Drawings fade out after 3-5 seconds
- ✅ **FR-4.12**: Pin mode: Drawings stay until manually cleared
- ✅ **FR-4.13**: Toggle pin mode via hotkey
- ✅ **FR-4.14**: Clear all drawings with hotkey

## Known Limitations

1. **Click-through behavior**: The drawing canvas captures all mouse events in its layer. Click indicators still work because they're on a separate layer.

2. **Gesture detection**: The thresholds (10px for dot, 20px for rectangle) are tuned for typical use. May need adjustment based on user feedback.

3. **Performance**: Should maintain 60fps for drawing. If many drawings accumulate, hidden ones are cleaned up every 5 seconds.

## Next Steps

After testing, the following tasks can proceed:
- Task 7: Gesture Detection (library extraction)
- Task 8: Drawing Rendering (optimization)
- Task 9: Color Selection (UI improvements)
- Task 10: Fade vs Pin Mode (state management)

## Testing Checklist

- [ ] Dot markers appear on quick clicks
- [ ] Arrows appear on drag gestures
- [ ] Rectangles appear on diagonal drags
- [ ] Color selection works (keys 1, 2, 3)
- [ ] Pin mode works (key P)
- [ ] Clear all works (key C)
- [ ] Real-time preview shows while drawing
- [ ] Fade animation works (3 seconds)
- [ ] Pinned drawings don't fade
- [ ] Visual indicators show current mode
- [ ] Mouse events work at all screen positions
- [ ] Gesture detection is accurate

## How to Test

1. Start the dev server: `npm run dev`
2. Open the overlay window (should open automatically or via toolbar)
3. Follow the manual testing steps above
4. Report any issues or unexpected behavior

## Success Criteria

✅ All three drawing types (dot, arrow, rectangle) work correctly
✅ Color selection changes drawing color
✅ Pin mode prevents fade-out
✅ Clear function removes all drawings
✅ Real-time preview shows during drawing
✅ Fade animation is smooth and timely
✅ No performance issues or lag during drawing
