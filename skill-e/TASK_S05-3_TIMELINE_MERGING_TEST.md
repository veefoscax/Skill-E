# Task S05-3: Timeline Merging - Manual Verification

## Task Overview
Verify that the `buildTimeline()` function correctly merges all events by timestamp and sorts them chronologically.

## Requirements
- **FR-5.2**: Correlate voice segments with visual frames by timestamp
- **FR-5.10**: Generate timeline with all events correlated

## Implementation Summary

The `buildTimeline()` function in `src/lib/processing.ts`:

1. ✅ **Merges screenshot events** from capture frames
2. ✅ **Merges voice events** from transcription segments (with timestamp conversion from seconds to milliseconds)
3. ✅ **Merges click events** from overlay annotations
4. ✅ **Merges drawing events** from overlay annotations
5. ✅ **Merges element selection events** from overlay annotations
6. ✅ **Sorts chronologically** by timestamp
7. ⚠️ **Keyboard events** are not included (KeyboardState lacks timestamp field - noted for future enhancement)

## Code Review Checklist

### ✅ Timestamp Correlation (FR-5.2)
- [x] Voice segments converted from relative seconds to absolute milliseconds
- [x] Conversion formula: `sessionStartTime + (segment.start * 1000)`
- [x] All events use consistent timestamp format (Unix milliseconds)

### ✅ Event Merging (FR-5.10)
- [x] Screenshot events added with frame reference
- [x] Voice events added with segment reference
- [x] Click events added with click indicator data
- [x] Drawing events added with drawing element data
- [x] Element selection events added with element data
- [x] All events have unique IDs

### ✅ Chronological Sorting
- [x] Timeline sorted by timestamp using `Array.sort()`
- [x] Sort comparator: `(a, b) => a.timestamp - b.timestamp`

### ✅ Code Quality
- [x] No TypeScript errors
- [x] No unused imports
- [x] Clear comments explaining keyboard event limitation
- [x] Proper type safety with TimelineEvent union type

## Test Data Structure

The function expects `SessionData` with:
```typescript
{
  captureSession: {
    frames: CaptureFrame[],  // Each has timestamp
    startTime: number         // Session start time for voice conversion
  },
  transcription: {
    segments: TranscriptionSegment[]  // Each has start/end in seconds
  } | null,
  clicks: ClickIndicator[],           // Each has timestamp
  drawings: DrawingElement[],         // Each has timestamp
  selectedElements: SelectedElement[], // Each has timestamp
  keyboardInputs: KeyboardState[]     // No timestamp (not included)
}
```

## Output Verification

The function returns `TimelineEvent[]` where each event:
- Has a unique `id`
- Has a `type` (screenshot, voice, click, drawing, element_selection)
- Has a `timestamp` in Unix milliseconds
- Contains the original data reference (frame, segment, click, etc.)
- Is sorted chronologically

## Integration with Processing Pipeline

The `buildTimeline()` function is called by `processSession()`:
1. Session data is loaded via `loadSession()`
2. Timeline is built via `buildTimeline()`
3. Pause events are detected and added to timeline
4. Window change events are detected and added to timeline
5. Timeline is re-sorted after additions
6. Timeline is stored in `ProcessedSession.timeline`

## Known Limitations

1. **Keyboard Events Not Included**: The `KeyboardState` interface in `src/stores/overlay.ts` doesn't have a timestamp field. This would need to be added to include keyboard events in the timeline.

2. **Future Enhancement**: When keyboard tracking is updated to include timestamps, add keyboard events to the timeline:
   ```typescript
   for (const keyboard of sessionData.keyboardInputs) {
     const event: KeyboardEvent = {
       id: `keyboard-${keyboard.timestamp}`,
       type: 'keyboard',
       timestamp: keyboard.timestamp,
       keyboard,
     };
     timeline.push(event);
   }
   ```

## Acceptance Criteria

- [x] Merges all events by timestamp
- [x] Sorts chronologically
- [x] Creates unified timeline array
- [x] Correlates voice segments with visual frames
- [x] No TypeScript errors
- [x] Clean code without unused variables

## Status: ✅ COMPLETE

The `buildTimeline()` function meets all requirements for Task S05-3:
- All event types (except keyboard) are merged into a unified timeline
- Voice segments are properly correlated with frames using timestamp conversion
- Timeline is sorted chronologically
- Code is clean and type-safe

The keyboard event limitation is documented and can be addressed in a future task when the KeyboardState interface is updated to include timestamps.
