# Task S04-29: Timeline Container - Test Instructions

## Overview
Testing the Timeline container component that displays multiple StepBubble components on the right edge of the overlay with scrolling support.

## Requirements
- **FR-4.39**: Timeline anchored to right edge of overlay (vertical strip)
- **FR-4.40**: Collapsed by default (just shows step count badge)
- **FR-4.41**: Expands on hover or click
- **FR-4.42**: Scrollable if many steps
- **FR-4.30**: New steps slide in from right with fade-in animation
- **FR-4.31**: Older steps reduce to 50% opacity after 5 seconds
- **FR-4.32**: Hovering timeline shows all steps at full opacity
- **FR-4.33**: Step counter badge showing total captured steps
- **FR-4.34**: Minimize/Expand toggle timeline visibility

## Files Created
- ✅ `src/components/Overlay/Timeline/Timeline.tsx` - Main Timeline container component
- ✅ `src/components/TimelineTest.tsx` - Test interface
- ✅ Updated `src/styles/overlay-animations.css` - Added timeline animations

## Component Features

### Timeline Component
1. **Right-Edge Positioning**
   - Fixed to right edge of screen
   - Vertical strip layout
   - Non-intrusive z-index

2. **Collapsed State (Default)**
   - Shows only step count badge (circular)
   - Badge displays total number of steps
   - Shows last 3 steps as small colored dots
   - Minimal width (w-16)

3. **Expanded State**
   - Full width (w-80)
   - Shows all steps with labels
   - Scrollable container
   - Header with step count and collapse button

4. **Step Display**
   - Each step rendered as StepBubble
   - Slide-in animation from right
   - Auto-fade after 5 seconds (50% opacity)
   - Restore full opacity on timeline hover
   - Click to expand step details

5. **Scrolling**
   - Auto-scroll to newest step
   - Custom thin scrollbar
   - Smooth scrolling behavior
   - Max height calculation

6. **Interactions**
   - Click badge to expand/collapse
   - Hover for tooltip hint
   - Click step to expand details
   - Delete step with confirmation
   - Edit step notes

### TimelineBadge Component
- Minimal version showing only step count
- Used when full timeline is not needed
- Auto-hides when no steps

## How to Test

### Setup
1. Start the development server:
   ```bash
   npm run dev
   ```

2. Add the TimelineTest component to your App.tsx temporarily:
   ```tsx
   import { TimelineTest } from './components/TimelineTest';
   
   function App() {
     return <TimelineTest />;
   }
   ```

3. Open the application in your browser

### Test Cases

#### TC1: Right-Edge Positioning (FR-4.39)
**Steps:**
1. Load the test page
2. Observe the timeline position

**Expected:**
- Timeline is anchored to the right edge of the screen
- Positioned from top to bottom (full height)
- Does not overlap with main content
- Fixed positioning (stays in place on scroll)

**Status:** ⏳ Awaiting User Verification

---

#### TC2: Collapsed State (FR-4.40)
**Steps:**
1. Load the test page
2. Observe the initial timeline state

**Expected:**
- Timeline is collapsed by default
- Shows circular badge with step count
- Badge displays "0" initially
- Minimal width (approximately 64px)
- Last 3 steps shown as small colored dots

**Status:** ⏳ Awaiting User Verification

---

#### TC3: Expand on Hover/Click (FR-4.41)
**Steps:**
1. Add some steps using the test buttons
2. Hover over the timeline badge
3. Click the badge

**Expected:**
- Hovering shows a tooltip hint
- Clicking expands the timeline
- Smooth width transition (300ms)
- Full timeline shows all steps
- Header shows step count and collapse button

**Status:** ⏳ Awaiting User Verification

---

#### TC4: Scrollable Container (FR-4.42)
**Steps:**
1. Click "Add 10 Random Steps" button multiple times
2. Expand the timeline
3. Try scrolling the step list

**Expected:**
- Timeline has scrollable container
- Custom thin scrollbar appears
- Smooth scrolling behavior
- Auto-scrolls to newest step when added
- Max height respects viewport

**Status:** ⏳ Awaiting User Verification

---

#### TC5: Step Slide-In Animation (FR-4.30)
**Steps:**
1. Expand the timeline
2. Add individual steps one at a time
3. Observe the animation

**Expected:**
- New steps slide in from the right
- Fade-in animation (400ms)
- Smooth easing curve
- No layout shift
- Auto-scroll to show new step

**Status:** ⏳ Awaiting User Verification

---

#### TC6: Auto-Fade Older Steps (FR-4.31)
**Steps:**
1. Add several steps
2. Wait 5+ seconds
3. Observe the opacity changes

**Expected:**
- Steps older than 5 seconds fade to 50% opacity
- Smooth transition (500ms)
- Recent steps remain at full opacity
- Fade applies to all step elements

**Status:** ⏳ Awaiting User Verification

---

#### TC7: Hover Restore Opacity (FR-4.32)
**Steps:**
1. Add steps and wait for them to fade
2. Hover over the timeline
3. Move mouse away

**Expected:**
- Hovering timeline restores all steps to full opacity
- Smooth transition (300ms)
- Applies to all faded steps
- Opacity returns to 50% when hover ends

**Status:** ⏳ Awaiting User Verification

---

#### TC8: Step Counter Badge (FR-4.33)
**Steps:**
1. Start with 0 steps
2. Add steps one at a time
3. Observe the badge count

**Expected:**
- Badge shows "0" initially
- Count increments with each step
- Updates immediately
- Clear, readable number
- Badge scales slightly on hover

**Status:** ⏳ Awaiting User Verification

---

#### TC9: Toggle Visibility (FR-4.34)
**Steps:**
1. Add some steps
2. Toggle "Timeline Visible" checkbox
3. Expand/collapse the timeline

**Expected:**
- Unchecking hides the timeline completely
- Checking shows the timeline
- State persists during toggle
- Smooth transition
- Collapse button works when expanded

**Status:** ⏳ Awaiting User Verification

---

#### TC10: Step Interactions
**Steps:**
1. Add various step types
2. Click on a step
3. Try editing a note
4. Try deleting a step

**Expected:**
- Clicking step expands details
- Expanded view shows timestamp, data, note field
- Can add/edit notes
- Delete requires confirmation
- Console logs show callbacks

**Status:** ⏳ Awaiting User Verification

---

#### TC11: Multiple Step Types
**Steps:**
1. Add one of each step type:
   - Screenshot (📷 blue)
   - Click (🖱️ purple)
   - Keystroke (⌨️ green)
   - Network (🌐 orange)
2. Observe the visual differences

**Expected:**
- Each type has correct icon
- Each type has correct color scheme
- Labels are descriptive
- Colors match design system

**Status:** ⏳ Awaiting User Verification

---

#### TC12: Empty State
**Steps:**
1. Clear all steps
2. Expand the timeline

**Expected:**
- Shows "No steps yet" message
- Helpful hint text
- Centered in timeline
- Badge shows "0"

**Status:** ⏳ Awaiting User Verification

---

#### TC13: Badge-Only Mode
**Steps:**
1. Switch to "Badge Only" mode
2. Add steps
3. Observe the display

**Expected:**
- Only shows step count badge
- No expand/collapse functionality
- Badge updates with step count
- Minimal, non-intrusive

**Status:** ⏳ Awaiting User Verification

---

#### TC14: Performance with Many Steps
**Steps:**
1. Click "Add 10 Random Steps" 5 times (50 steps)
2. Expand the timeline
3. Scroll through steps
4. Observe performance

**Expected:**
- Smooth scrolling with many steps
- No lag or stuttering
- Animations remain smooth
- Memory usage reasonable

**Status:** ⏳ Awaiting User Verification

---

## Visual Verification

### Layout
- [ ] Timeline positioned on right edge
- [ ] Full height coverage
- [ ] Proper z-index (above content, below modals)
- [ ] No overlap with main content

### Collapsed State
- [ ] Circular badge visible
- [ ] Step count readable
- [ ] Last 3 steps shown as dots
- [ ] Minimal width (64px)

### Expanded State
- [ ] Full width (320px)
- [ ] Header with count and collapse button
- [ ] Scrollable step list
- [ ] Proper spacing and padding

### Animations
- [ ] Smooth expand/collapse transition
- [ ] Step slide-in from right
- [ ] Fade to 50% after 5 seconds
- [ ] Restore opacity on hover
- [ ] Badge hover scale effect

### Colors
- [ ] Screenshot: Blue (#3B82F6)
- [ ] Click: Purple (#A855F7)
- [ ] Keystroke: Green (#22C55E)
- [ ] Network: Orange (#FB923C)

### Typography
- [ ] Step labels readable
- [ ] Timestamps formatted correctly
- [ ] Notes display properly
- [ ] Badge number clear

## Integration Points

### Recording Store
- Uses `useRecordingStore` for step data
- Calls `addStep`, `updateStepNote`, `deleteStep`
- Subscribes to `steps` array

### StepBubble Component
- Renders individual steps
- Handles expand/collapse
- Manages note editing
- Supports delete action

### Animations
- Uses `overlay-animations.css`
- Custom scrollbar styles
- Smooth transitions

## Known Limitations
1. No drag-to-reorder functionality (FR-4.38 - optional)
2. No step filtering or search
3. No export/import of timeline
4. No keyboard navigation

## Next Steps
After verification:
1. Integrate with actual recording session
2. Add step capture logic for real events
3. Connect to overlay window
4. Test with live recording

## Notes
- Timeline is designed to be non-intrusive
- Collapsed state minimizes screen space usage
- Smooth animations enhance user experience
- Auto-scroll keeps newest steps visible
- Hover interactions provide additional context
