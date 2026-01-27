# Task S04-32: Timeline Testing - Comprehensive Test Plan

## Overview
Comprehensive testing of all timeline functionality including step addition animation, fade logic, expand/collapse behavior, and all related requirements (FR-4.29-FR-4.42).

## Requirements Coverage
- **FR-4.29**: Step Bubbles - Show capture steps as they happen
- **FR-4.30**: Animation - New steps slide in from right with fade-in
- **FR-4.31**: Auto-Fade - Older steps reduce to 50% opacity after 5 seconds
- **FR-4.32**: Hover Expand - Hovering timeline shows all steps at full opacity
- **FR-4.33**: Step Counter - Badge showing total captured steps
- **FR-4.34**: Minimize/Expand - Toggle timeline visibility
- **FR-4.35**: Step Details - Click step to expand details
- **FR-4.36**: Delete Step - Remove step from recording
- **FR-4.37**: Edit Step Note - Add/edit annotation for a step
- **FR-4.38**: Reorder Steps - Drag to reorder (optional, not implemented)
- **FR-4.39**: Timeline Position - Anchored to right edge
- **FR-4.40**: Collapsed Default - Shows step count badge
- **FR-4.41**: Expand Trigger - Expands on hover or click
- **FR-4.42**: Scrollable - Scrollable if many steps

## Test Environment Setup

### Prerequisites
1. Development server running (`npm run dev`)
2. Browser with DevTools open (for console logs)
3. Timer/stopwatch for timing tests (5-second fade)

### Test Component
The `TimelineTest` component provides:
- Full Timeline mode
- Badge Only mode
- Buttons to add different step types
- Visibility toggle
- Clear all functionality
- Debug step list

## Test Execution Plan

### Phase 1: Basic Display and Positioning

#### Test 1.1: Initial State (FR-4.40)
**Objective:** Verify timeline starts in collapsed state

**Steps:**
1. Load the test page
2. Observe the timeline on the right edge

**Expected Results:**
- ✅ Timeline visible on right edge
- ✅ Shows circular badge with "0"
- ✅ Collapsed state (narrow width ~64px)
- ✅ No steps visible initially

**Verification:**
- [ ] Badge displays "0"
- [ ] Timeline is collapsed
- [ ] Positioned on right edge

---

#### Test 1.2: Right-Edge Positioning (FR-4.39)
**Objective:** Verify timeline is properly anchored to right edge

**Steps:**
1. Observe timeline position
2. Resize browser window
3. Scroll page content

**Expected Results:**
- ✅ Fixed to right edge of viewport
- ✅ Full height coverage
- ✅ Stays in position when scrolling
- ✅ Adapts to window resize

**Verification:**
- [ ] Right-edge alignment maintained
- [ ] Full height (top to bottom)
- [ ] Fixed positioning works

---

### Phase 2: Step Addition and Animation

#### Test 2.1: Add Single Step (FR-4.29, FR-4.30)
**Objective:** Verify step addition and slide-in animation

**Steps:**
1. Click "📷 Add Screenshot" button
2. Observe the animation
3. Check the badge count

**Expected Results:**
- ✅ Badge count increases to "1"
- ✅ Step slides in from right (if expanded)
- ✅ Smooth fade-in animation
- ✅ Step appears in timeline

**Verification:**
- [ ] Badge shows "1"
- [ ] Animation is smooth
- [ ] Step is visible

---

#### Test 2.2: Add Multiple Step Types (FR-4.29)
**Objective:** Verify all step types display correctly

**Steps:**
1. Click "📷 Add Screenshot" - should show blue
2. Click "🖱️ Add Click" - should show purple
3. Click "⌨️ Add Keystroke" - should show green
4. Click "🌐 Add Network" - should show orange
5. Expand timeline to view all steps

**Expected Results:**
- ✅ Each step has correct icon
- ✅ Each step has correct color scheme:
  - Screenshot: Blue (#3B82F6)
  - Click: Purple (#A855F7)
  - Keystroke: Green (#22C55E)
  - Network: Orange (#FB923C)
- ✅ Labels are descriptive
- ✅ Badge shows "4"

**Verification:**
- [ ] Screenshot: 📷 Blue
- [ ] Click: 🖱️ Purple
- [ ] Keystroke: ⌨️ Green
- [ ] Network: 🌐 Orange
- [ ] Badge count correct

---

#### Test 2.3: Rapid Step Addition (FR-4.30)
**Objective:** Verify animation performance with rapid additions

**Steps:**
1. Expand timeline
2. Click "⚡ Add 10 Random Steps"
3. Observe animations

**Expected Results:**
- ✅ Each step slides in smoothly
- ✅ No animation stuttering
- ✅ Auto-scrolls to show newest steps
- ✅ Badge updates in real-time

**Verification:**
- [ ] Smooth animations
- [ ] Auto-scroll works
- [ ] Badge updates correctly

---

### Phase 3: Expand/Collapse Behavior

#### Test 3.1: Expand Timeline (FR-4.41)
**Objective:** Verify timeline expands on click

**Steps:**
1. Add a few steps
2. Click the badge to expand
3. Observe the transition

**Expected Results:**
- ✅ Timeline expands smoothly
- ✅ Width increases to ~320px
- ✅ All steps become visible
- ✅ Header shows step count and collapse button
- ✅ Transition duration ~300ms

**Verification:**
- [ ] Smooth expand animation
- [ ] Full width achieved
- [ ] All steps visible
- [ ] Header displays correctly

---

#### Test 3.2: Collapse Timeline (FR-4.34)
**Objective:** Verify timeline collapses properly

**Steps:**
1. With timeline expanded, click the collapse button (or badge)
2. Observe the transition

**Expected Results:**
- ✅ Timeline collapses smoothly
- ✅ Width reduces to ~64px
- ✅ Only badge visible
- ✅ Last 3 steps shown as small dots
- ✅ Transition duration ~300ms

**Verification:**
- [ ] Smooth collapse animation
- [ ] Badge-only view
- [ ] Dots show recent steps

---

#### Test 3.3: Hover Hint (FR-4.41)
**Objective:** Verify hover tooltip appears

**Steps:**
1. Collapse timeline
2. Hover over the badge (don't click)
3. Observe tooltip

**Expected Results:**
- ✅ Tooltip appears: "Click to expand timeline"
- ✅ Positioned near badge
- ✅ Readable text
- ✅ Disappears when hover ends

**Verification:**
- [ ] Tooltip appears on hover
- [ ] Text is clear
- [ ] Disappears correctly

---

### Phase 4: Auto-Fade Logic

#### Test 4.1: Auto-Fade After 5 Seconds (FR-4.31)
**Objective:** Verify steps fade to 50% opacity after 5 seconds

**Steps:**
1. Expand timeline
2. Add a screenshot step
3. Start a timer
4. Wait 5+ seconds
5. Observe the step opacity

**Expected Results:**
- ✅ Step remains at 100% opacity for first 5 seconds
- ✅ After 5 seconds, step fades to 50% opacity
- ✅ Smooth transition (~500ms)
- ✅ Newer steps remain at 100%

**Verification:**
- [ ] Step visible at 100% initially
- [ ] Fades to 50% after 5s
- [ ] Smooth transition
- [ ] Recent steps unaffected

**Timing Test:**
- Add step at: ___________
- Fade observed at: ___________
- Time difference: ___________

---

#### Test 4.2: Multiple Steps Fade Independently (FR-4.31)
**Objective:** Verify each step fades based on its own timestamp

**Steps:**
1. Expand timeline
2. Add step 1, wait 2 seconds
3. Add step 2, wait 2 seconds
4. Add step 3
5. Wait and observe fade sequence

**Expected Results:**
- ✅ Step 1 fades first (after 5s from its creation)
- ✅ Step 2 fades second (after 5s from its creation)
- ✅ Step 3 remains at 100%
- ✅ Each step fades independently

**Verification:**
- [ ] Step 1 fades first
- [ ] Step 2 fades second
- [ ] Step 3 stays bright
- [ ] Independent timing

---

#### Test 4.3: Hover Restores Opacity (FR-4.32)
**Objective:** Verify hovering timeline restores all steps to full opacity

**Steps:**
1. Add several steps
2. Wait for them to fade (5+ seconds)
3. Hover over the timeline
4. Move mouse away

**Expected Results:**
- ✅ Hovering restores all steps to 100% opacity
- ✅ Smooth transition (~300ms)
- ✅ Applies to all faded steps
- ✅ Opacity returns to 50% when hover ends

**Verification:**
- [ ] Hover restores opacity
- [ ] All faded steps affected
- [ ] Smooth transition
- [ ] Returns to 50% after hover

---

### Phase 5: Step Counter Badge

#### Test 5.1: Badge Count Updates (FR-4.33)
**Objective:** Verify badge shows accurate step count

**Steps:**
1. Start with 0 steps
2. Add steps one at a time
3. Observe badge after each addition

**Expected Results:**
- ✅ Badge shows "0" initially
- ✅ Increments to "1", "2", "3", etc.
- ✅ Updates immediately
- ✅ Clear, readable number

**Verification:**
- [ ] Starts at 0
- [ ] Increments correctly
- [ ] Immediate updates
- [ ] Readable display

---

#### Test 5.2: Badge with Many Steps (FR-4.33)
**Objective:** Verify badge handles large numbers

**Steps:**
1. Click "⚡ Add 10 Random Steps" multiple times
2. Observe badge with 50+ steps

**Expected Results:**
- ✅ Badge displays large numbers correctly
- ✅ Number remains readable
- ✅ Badge size adjusts if needed
- ✅ No overflow issues

**Verification:**
- [ ] Large numbers display
- [ ] Readable at all counts
- [ ] No visual issues

---

### Phase 6: Scrolling Behavior

#### Test 6.1: Scrollable Container (FR-4.42)
**Objective:** Verify timeline scrolls with many steps

**Steps:**
1. Add 20+ steps
2. Expand timeline
3. Try scrolling the step list

**Expected Results:**
- ✅ Scrollbar appears when needed
- ✅ Smooth scrolling
- ✅ Custom thin scrollbar style
- ✅ All steps accessible

**Verification:**
- [ ] Scrollbar visible
- [ ] Smooth scrolling
- [ ] All steps reachable

---

#### Test 6.2: Auto-Scroll to Newest (FR-4.42)
**Objective:** Verify timeline auto-scrolls to show new steps

**Steps:**
1. Add 20+ steps (timeline should be scrollable)
2. Scroll to top of timeline
3. Add a new step
4. Observe scroll position

**Expected Results:**
- ✅ Timeline auto-scrolls to bottom
- ✅ Newest step is visible
- ✅ Smooth scroll animation
- ✅ User can scroll back up

**Verification:**
- [ ] Auto-scrolls to new step
- [ ] Smooth animation
- [ ] Manual scroll still works

---

### Phase 7: Step Interactions

#### Test 7.1: Click to Expand Step (FR-4.35)
**Objective:** Verify clicking step shows details

**Steps:**
1. Add a few steps
2. Expand timeline
3. Click on a step
4. Observe the expanded view

**Expected Results:**
- ✅ Step expands to show details
- ✅ Shows timestamp
- ✅ Shows step data (selector, position, text, etc.)
- ✅ Shows note field
- ✅ Shows delete button

**Verification:**
- [ ] Step expands
- [ ] Details visible
- [ ] Timestamp shown
- [ ] Note field present
- [ ] Delete button present

---

#### Test 7.2: Collapse Expanded Step (FR-4.35)
**Objective:** Verify clicking expanded step collapses it

**Steps:**
1. Expand a step (from Test 7.1)
2. Click the step again (or the X button)
3. Observe the collapse

**Expected Results:**
- ✅ Step collapses to normal size
- ✅ Smooth transition
- ✅ Details hidden
- ✅ Can expand again

**Verification:**
- [ ] Step collapses
- [ ] Smooth transition
- [ ] Can re-expand

---

#### Test 7.3: Edit Step Note (FR-4.37)
**Objective:** Verify adding/editing step notes

**Steps:**
1. Expand a step
2. Click "+ Add note" button
3. Type "Test note"
4. Press Enter or click Save
5. Observe the note

**Expected Results:**
- ✅ Note input field appears
- ✅ Can type text
- ✅ Save button works
- ✅ Note displays in step
- ✅ Can edit existing note

**Verification:**
- [ ] Input field appears
- [ ] Can type text
- [ ] Save works
- [ ] Note displays
- [ ] Can edit again

---

#### Test 7.4: Delete Step (FR-4.36)
**Objective:** Verify deleting steps

**Steps:**
1. Add several steps
2. Expand a step
3. Click "Delete step" button
4. Confirm deletion
5. Observe the result

**Expected Results:**
- ✅ Confirmation dialog appears
- ✅ Clicking OK deletes the step
- ✅ Step removed from timeline
- ✅ Badge count decrements
- ✅ Other steps unaffected

**Verification:**
- [ ] Confirmation shown
- [ ] Step deleted
- [ ] Badge updates
- [ ] Other steps intact

---

### Phase 8: Visibility Toggle

#### Test 8.1: Hide Timeline (FR-4.34)
**Objective:** Verify timeline can be hidden

**Steps:**
1. Uncheck "Timeline Visible" checkbox
2. Observe the timeline

**Expected Results:**
- ✅ Timeline disappears completely
- ✅ No badge visible
- ✅ No steps visible
- ✅ Clean removal

**Verification:**
- [ ] Timeline hidden
- [ ] No visual artifacts

---

#### Test 8.2: Show Timeline (FR-4.34)
**Objective:** Verify timeline can be shown again

**Steps:**
1. With timeline hidden, check "Timeline Visible"
2. Observe the timeline

**Expected Results:**
- ✅ Timeline reappears
- ✅ Badge shows correct count
- ✅ Steps preserved
- ✅ State maintained

**Verification:**
- [ ] Timeline visible
- [ ] Badge correct
- [ ] Steps preserved

---

### Phase 9: Badge-Only Mode

#### Test 9.1: Switch to Badge Only
**Objective:** Verify badge-only mode works

**Steps:**
1. Click "Badge Only" button
2. Add some steps
3. Observe the display

**Expected Results:**
- ✅ Only badge visible (no expand/collapse)
- ✅ Badge updates with step count
- ✅ Minimal, non-intrusive
- ✅ No timeline functionality

**Verification:**
- [ ] Badge only visible
- [ ] Count updates
- [ ] No expand option

---

### Phase 10: Empty State

#### Test 10.1: Empty Timeline
**Objective:** Verify empty state display

**Steps:**
1. Clear all steps
2. Expand timeline
3. Observe the empty state

**Expected Results:**
- ✅ Shows "No steps yet" message
- ✅ Helpful hint text
- ✅ Centered in timeline
- ✅ Badge shows "0"

**Verification:**
- [ ] Empty message shown
- [ ] Hint text present
- [ ] Badge shows 0

---

### Phase 11: Performance Testing

#### Test 11.1: Many Steps Performance (FR-4.42)
**Objective:** Verify performance with 50+ steps

**Steps:**
1. Click "⚡ Add 10 Random Steps" 5 times (50 steps)
2. Expand timeline
3. Scroll through steps
4. Observe performance

**Expected Results:**
- ✅ Smooth scrolling
- ✅ No lag or stuttering
- ✅ Animations remain smooth
- ✅ Badge updates quickly

**Verification:**
- [ ] Smooth scrolling
- [ ] No performance issues
- [ ] Animations smooth

---

#### Test 11.2: Rapid Expand/Collapse
**Objective:** Verify transition performance

**Steps:**
1. Add 20+ steps
2. Rapidly click badge to expand/collapse multiple times
3. Observe transitions

**Expected Results:**
- ✅ Smooth transitions every time
- ✅ No visual glitches
- ✅ State remains consistent
- ✅ No memory leaks

**Verification:**
- [ ] Smooth transitions
- [ ] No glitches
- [ ] Consistent state

---

### Phase 12: Visual Polish

#### Test 12.1: Color Scheme Verification
**Objective:** Verify all colors match design system

**Steps:**
1. Add one of each step type
2. Expand timeline
3. Compare colors to specification

**Expected Colors:**
- Screenshot: Blue (#3B82F6 / bg-blue-500)
- Click: Purple (#A855F7 / bg-purple-500)
- Keystroke: Green (#22C55E / bg-green-500)
- Network: Orange (#FB923C / bg-orange-500)

**Verification:**
- [ ] Screenshot: Blue ✓
- [ ] Click: Purple ✓
- [ ] Keystroke: Green ✓
- [ ] Network: Orange ✓

---

#### Test 12.2: Typography and Spacing
**Objective:** Verify text is readable and spacing is consistent

**Steps:**
1. Add various steps
2. Expand timeline
3. Observe text and spacing

**Expected Results:**
- ✅ Step labels readable
- ✅ Timestamps formatted correctly
- ✅ Consistent padding
- ✅ No text overflow
- ✅ Proper truncation with ellipsis

**Verification:**
- [ ] Labels readable
- [ ] Timestamps clear
- [ ] Spacing consistent
- [ ] No overflow

---

#### Test 12.3: Hover Effects
**Objective:** Verify hover interactions are smooth

**Steps:**
1. Add steps
2. Expand timeline
3. Hover over various elements

**Expected Results:**
- ✅ Badge scales on hover
- ✅ Steps scale slightly on hover
- ✅ Smooth transitions
- ✅ Cursor changes appropriately

**Verification:**
- [ ] Badge hover effect
- [ ] Step hover effect
- [ ] Smooth transitions
- [ ] Cursor feedback

---

## Integration Testing

### Integration Test 1: Timeline with Recording Store
**Objective:** Verify timeline integrates with recording store

**Steps:**
1. Open browser DevTools console
2. Add steps using test buttons
3. Check console for store updates

**Expected Results:**
- ✅ Steps added to store
- ✅ Store state updates correctly
- ✅ Timeline reflects store state
- ✅ No console errors

**Verification:**
- [ ] Store updates
- [ ] Timeline syncs
- [ ] No errors

---

### Integration Test 2: Step Callbacks
**Objective:** Verify callback functions work

**Steps:**
1. Open browser DevTools console
2. Click a step (should log "Step clicked")
3. Delete a step (should log "Step deleted")
4. Edit a note (should log "Step note edited")

**Expected Results:**
- ✅ Click callback fires
- ✅ Delete callback fires
- ✅ Edit callback fires
- ✅ Correct data passed to callbacks

**Verification:**
- [ ] Click logged
- [ ] Delete logged
- [ ] Edit logged
- [ ] Data correct

---

## Known Issues / Limitations

1. **FR-4.38 Not Implemented**: Drag-to-reorder functionality is optional and not implemented
2. **No Keyboard Navigation**: Timeline doesn't support keyboard-only navigation
3. **No Step Filtering**: Cannot filter steps by type
4. **No Export/Import**: Cannot save/load timeline state

## Test Summary

### Requirements Coverage
- [x] FR-4.29: Step Bubbles display
- [x] FR-4.30: Slide-in animation
- [x] FR-4.31: Auto-fade after 5s
- [x] FR-4.32: Hover restore opacity
- [x] FR-4.33: Step counter badge
- [x] FR-4.34: Toggle visibility
- [x] FR-4.35: Expand step details
- [x] FR-4.36: Delete step
- [x] FR-4.37: Edit step note
- [ ] FR-4.38: Reorder steps (optional, not implemented)
- [x] FR-4.39: Right-edge positioning
- [x] FR-4.40: Collapsed default
- [x] FR-4.41: Expand on hover/click
- [x] FR-4.42: Scrollable container

### Test Results Summary
Total Tests: 35
- Passed: ___
- Failed: ___
- Skipped: ___

### Critical Issues Found
(List any critical issues discovered during testing)

### Minor Issues Found
(List any minor issues or improvements needed)

### Recommendations
(List any recommendations for improvements or next steps)

---

## Next Steps After Testing

1. **If all tests pass:**
   - Mark Task 32 as complete
   - Update DEVLOG with test results
   - Proceed to next task or integration

2. **If issues found:**
   - Document issues in detail
   - Create bug fix tasks
   - Prioritize fixes
   - Retest after fixes

3. **Integration:**
   - Connect timeline to actual recording events
   - Test with real screen capture
   - Test with real click tracking
   - Test with real keyboard input

---

## Test Execution Log

**Tester:** _______________
**Date:** _______________
**Environment:** _______________
**Browser:** _______________

**Start Time:** _______________
**End Time:** _______________
**Duration:** _______________

**Notes:**
(Add any additional notes or observations during testing)
