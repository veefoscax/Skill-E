# Task S04-30: Auto-Fade Logic Test

## Test Date
[To be filled after user testing]

## Requirements
- **FR-4.31**: Steps fade to 50% opacity after 5 seconds
- **FR-4.32**: Hover timeline to restore opacity

## Implementation Summary

The auto-fade logic has been implemented in the Timeline and StepBubble components:

### Key Components

1. **`shouldFadeStep` function** (Timeline.tsx)
   - Calculates age of step (current time - timestamp)
   - Returns true if age > 5000ms (5 seconds)

2. **Opacity Control** (StepBubble.tsx)
   - `isFaded && !isTimelineHovered` → 50% opacity
   - Otherwise → 100% opacity
   - Smooth transition with `transition-all duration-300`

3. **Hover Detection** (Timeline.tsx)
   - `onMouseEnter` sets `isHovered` to true
   - `onMouseLeave` sets `isHovered` to false
   - Hover state passed to all StepBubble components

### Code Locations

**Timeline.tsx (lines 44-50):**
```typescript
function shouldFadeStep(step: CaptureStep): boolean {
  const now = Date.now();
  const age = now - step.timestamp;
  const FADE_THRESHOLD = 5000; // 5 seconds
  return age > FADE_THRESHOLD;
}
```

**Timeline.tsx (lines 67, 138-141):**
```typescript
onMouseEnter={() => setIsHovered(true)}
onMouseLeave={() => setIsHovered(false)}

// Passed to StepBubble:
isFaded={shouldFadeStep(step)}
isTimelineHovered={isHovered}
```

**StepBubble.tsx (lines 88-90):**
```typescript
const opacityClass = isFaded && !isTimelineHovered 
  ? 'opacity-50' 
  : 'opacity-100';
```

## Test Instructions

### Setup
1. Run the development server: `npm run dev`
2. Navigate to the Timeline test page
3. Add multiple steps using the test controls

### Test Cases

#### TC1: Auto-Fade After 5 Seconds
**Steps:**
1. Add a step (screenshot, click, keystroke, or network)
2. Wait 5 seconds
3. Observe the step opacity

**Expected Result:**
- Step should fade to 50% opacity after 5 seconds
- Transition should be smooth (300ms duration)

**Actual Result:**
- [ ] ✅ Pass
- [ ] ❌ Fail (describe issue):

---

#### TC2: Multiple Steps Fade Independently
**Steps:**
1. Add 5 steps with 2-second intervals between each
2. Wait and observe as each step reaches 5 seconds old

**Expected Result:**
- Each step fades independently when it reaches 5 seconds old
- Newer steps remain at full opacity
- Older steps are at 50% opacity

**Actual Result:**
- [ ] ✅ Pass
- [ ] ❌ Fail (describe issue):

---

#### TC3: Hover Restores Full Opacity
**Steps:**
1. Add several steps
2. Wait for them to fade (>5 seconds)
3. Hover over the timeline container
4. Move mouse away from timeline

**Expected Result:**
- When hovering: All steps restore to 100% opacity
- When not hovering: Faded steps return to 50% opacity
- Transition should be smooth

**Actual Result:**
- [ ] ✅ Pass
- [ ] ❌ Fail (describe issue):

---

#### TC4: Hover Works in Collapsed State
**Steps:**
1. Add steps and let them fade
2. Collapse the timeline (click badge)
3. Hover over the collapsed timeline
4. Observe the small preview dots

**Expected Result:**
- Preview dots should also respond to hover state
- Faded steps' dots should restore opacity on hover

**Actual Result:**
- [ ] ✅ Pass
- [ ] ❌ Fail (describe issue):

---

#### TC5: Expanded Step Details Respect Fade
**Steps:**
1. Add a step
2. Wait for it to fade (>5 seconds)
3. Click to expand the step details
4. Hover and unhover the timeline

**Expected Result:**
- Expanded step should also fade to 50% when old
- Hover should restore opacity even for expanded steps

**Actual Result:**
- [ ] ✅ Pass
- [ ] ❌ Fail (describe issue):

---

#### TC6: Rapid Hover/Unhover
**Steps:**
1. Add steps and let them fade
2. Rapidly move mouse in and out of timeline area
3. Observe opacity transitions

**Expected Result:**
- Opacity transitions should be smooth
- No flickering or jarring visual effects
- Transitions should complete properly

**Actual Result:**
- [ ] ✅ Pass
- [ ] ❌ Fail (describe issue):

---

#### TC7: New Steps Don't Fade Immediately
**Steps:**
1. Add a new step
2. Immediately observe its opacity
3. Wait 4 seconds (before fade threshold)
4. Observe opacity

**Expected Result:**
- New step starts at 100% opacity
- Remains at 100% opacity for first 5 seconds
- Only fades after 5 seconds have passed

**Actual Result:**
- [ ] ✅ Pass
- [ ] ❌ Fail (describe issue):

---

#### TC8: Timeline Visibility Toggle
**Steps:**
1. Add steps and let them fade
2. Toggle timeline visibility off
3. Toggle timeline visibility on
4. Check if fade state is preserved

**Expected Result:**
- When timeline becomes visible again, fade state should be correct
- Steps older than 5 seconds should be faded
- Recent steps should be at full opacity

**Actual Result:**
- [ ] ✅ Pass
- [ ] ❌ Fail (describe issue):

---

## Visual Verification

### Opacity Values
- [ ] Faded steps are clearly at 50% opacity (not too faint, not too bold)
- [ ] Full opacity steps are at 100% (clearly visible)
- [ ] Transition duration (300ms) feels smooth and natural

### Hover Feedback
- [ ] Hover state is immediately responsive
- [ ] All steps restore opacity simultaneously on hover
- [ ] Unhover returns to correct fade state

### Performance
- [ ] No lag or stuttering during opacity transitions
- [ ] Smooth performance with 20+ steps
- [ ] No memory leaks with continuous step addition

## Edge Cases

### EC1: System Time Change
**Test:** Change system time while steps are displayed
**Expected:** Fade logic should still work correctly based on timestamps

**Result:**
- [ ] ✅ Pass
- [ ] ❌ Fail (describe issue):

---

### EC2: Very Old Steps
**Test:** Add steps, wait 60+ seconds
**Expected:** Steps should remain at 50% opacity (not fade further)

**Result:**
- [ ] ✅ Pass
- [ ] ❌ Fail (describe issue):

---

### EC3: Zero Steps
**Test:** Clear all steps, hover timeline
**Expected:** No errors, empty state displays correctly

**Result:**
- [ ] ✅ Pass
- [ ] ❌ Fail (describe issue):

---

## Browser Compatibility

Test in multiple browsers if possible:
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (macOS)

## Accessibility

- [ ] Opacity changes don't affect screen reader functionality
- [ ] Keyboard navigation still works with faded steps
- [ ] Focus indicators remain visible on faded steps

## Requirements Validation

### FR-4.31: Steps fade to 50% opacity after 5 seconds
- [ ] ✅ Implemented correctly
- [ ] ❌ Issues found (describe):

### FR-4.32: Hover timeline to restore opacity
- [ ] ✅ Implemented correctly
- [ ] ❌ Issues found (describe):

## Overall Assessment

**Status:** ⏳ Awaiting User Testing

**Implementation Quality:**
- Code is clean and well-structured
- Logic is simple and maintainable
- Performance should be good (CSS transitions)

**Next Steps:**
1. User runs the test suite above
2. User reports any issues or unexpected behavior
3. If all tests pass, mark task as complete
4. If issues found, fix and retest

## Notes

- The fade threshold is set to 5000ms (5 seconds) as a constant
- Opacity transition uses CSS `transition-all duration-300` for smooth animation
- Hover state is tracked at the Timeline container level and passed down to all steps
- The implementation uses React state and props, no complex timing logic needed

