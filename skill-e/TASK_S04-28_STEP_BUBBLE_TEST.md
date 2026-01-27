# Task S04-28: Step Bubble Component - Testing Guide

## Overview
Testing the StepBubble component that displays individual capture steps with icons, labels, and slide-in animations.

## Requirements Tested
- **FR-4.29**: Step Bubbles show capture steps (click, screenshot, keystroke, network)
- **FR-4.30**: New steps slide in from right with fade-in animation

## Test Component Location
`src/components/StepBubbleTest.tsx`

## Manual Testing Steps

### 1. Basic Step Display
- [ ] Open the test component
- [ ] Verify all 4 step types display with correct icons:
  - Screenshot: 📷
  - Click: 🖱️
  - Keystroke: ⌨️
  - Network: 🌐
- [ ] Verify each step has appropriate color coding
- [ ] Verify labels are readable and truncate properly

### 2. Slide-in Animation
- [ ] Click "Add Random Step" button
- [ ] Verify new step slides in from the right
- [ ] Animation should be smooth (400ms duration)
- [ ] Verify fade-in effect during slide

### 3. Auto-Fade Behavior
- [ ] Wait 5 seconds after adding a step
- [ ] Verify step fades to 50% opacity
- [ ] Newer steps should remain at full opacity

### 4. Hover Restore
- [ ] Hover over a faded step
- [ ] Verify opacity restores to 100%
- [ ] Move mouse away, verify it fades back to 50%

### 5. Click Interaction
- [ ] Click on a step bubble
- [ ] Verify click handler is called (check console)
- [ ] Verify hover scale effect works

### 6. Expanded View
- [ ] Click "Toggle Expanded" on a step
- [ ] Verify expanded view shows:
  - Full timestamp
  - Additional data (selector, position, etc.)
  - Note editing capability
  - Delete button
- [ ] Test adding/editing notes
- [ ] Test delete functionality

### 7. Multiple Steps
- [ ] Add 10+ steps rapidly
- [ ] Verify all steps display correctly
- [ ] Verify animations don't overlap or glitch
- [ ] Verify performance remains smooth

### 8. Timestamp Display
- [ ] Verify relative timestamps ("just now", "5s ago", etc.)
- [ ] Wait and verify timestamps update appropriately

## Expected Results

### Visual Appearance
- Clean, modern bubble design
- Appropriate color coding per step type
- Smooth animations without jank
- Proper spacing and alignment
- Icons clearly visible

### Animation Quality
- Slide-in: Smooth 400ms from right
- Fade: Gradual transition to 50% opacity
- Hover: Responsive scale and opacity changes
- No animation stuttering or lag

### Interaction
- Clickable with visual feedback
- Hover effects work correctly
- Expanded view toggles smoothly
- Note editing is intuitive

## Performance Criteria
- Animation runs at 60fps
- No lag when adding multiple steps
- Memory usage remains stable
- CPU usage minimal during animations

## Browser Compatibility
- Test in Chrome/Edge (primary)
- Verify animations work in Firefox
- Check Safari if on macOS

## Known Limitations
- Timestamps are relative (not absolute)
- Long labels truncate with ellipsis
- Maximum practical steps: ~50 before scrolling needed

## Success Criteria
- ✅ All step types display with correct icons
- ✅ Slide-in animation is smooth and consistent
- ✅ Auto-fade works after 5 seconds
- ✅ Hover restores opacity correctly
- ✅ Click interactions work as expected
- ✅ Expanded view shows all details
- ✅ Performance remains smooth with multiple steps

## Next Steps
After verification:
1. Mark task as complete
2. Update DEVLOG.md
3. Proceed to Task 29: Timeline Container
