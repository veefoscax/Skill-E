# Task S04-31: Step Counter Badge Test

## Overview
Testing the step counter badge functionality in the Timeline component.

## Requirements Tested
- **FR-4.33**: Step Counter - Badge showing total captured steps
- **FR-4.34**: Minimize/Expand - Toggle timeline visibility

## Test Component
`src/components/StepCounterBadgeTest.tsx`

## How to Run Tests

1. **Start the development server:**
   ```bash
   cd skill-e
   npm run dev
   ```

2. **Add the test route to App.tsx:**
   ```tsx
   import { StepCounterBadgeTest } from './components/StepCounterBadgeTest';
   
   // In your routes or main component:
   <StepCounterBadgeTest />
   ```

3. **Navigate to the test page in your browser**

## Test Cases

### Test 1: Badge Displays Correct Step Count
- **Purpose**: Verify badge shows accurate count
- **Steps**:
  1. Clear all steps
  2. Add 5 steps
  3. Verify badge shows "5"
- **Expected**: Badge displays correct number

### Test 2: Badge Updates When Steps Are Added
- **Purpose**: Verify real-time updates
- **Steps**:
  1. Clear steps
  2. Add steps one by one with delay
  3. Observe badge updating
- **Expected**: Badge increments with each step

### Test 3: Badge Toggles Timeline Expand/Collapse
- **Purpose**: Verify toggle functionality
- **Steps**:
  1. Click badge to expand timeline
  2. Click again to collapse
  3. Verify timeline shows/hides steps
- **Expected**: Timeline expands and collapses smoothly

### Test 4: Badge Is Visible When Collapsed
- **Purpose**: Verify visibility in collapsed state
- **Steps**:
  1. Ensure timeline is collapsed
  2. Verify badge is visible
  3. Check positioning
- **Expected**: Badge is prominent and visible

### Test 5: Badge Styling and Positioning
- **Purpose**: Verify visual design
- **Steps**:
  1. Inspect badge appearance
  2. Test hover effect
  3. Verify clickability
- **Expected**: Badge has proper styling and effects

### Test 6: Multiple Step Types
- **Purpose**: Verify count includes all types
- **Steps**:
  1. Add screenshot, click, keystroke, network steps
  2. Verify total count
- **Expected**: Badge shows total regardless of type

### Test 7: Large Step Count
- **Purpose**: Verify handling of large numbers
- **Steps**:
  1. Add 50 steps
  2. Verify badge displays clearly
  3. Check for overflow
- **Expected**: Badge handles large numbers without issues

## Manual Verification Checklist

After running automated tests, verify:

- [ ] **FR-4.33**: Badge shows total step count accurately
- [ ] **FR-4.34**: Clicking badge toggles timeline expand/collapse
- [ ] Badge is visible and prominent when timeline is collapsed
- [ ] Badge updates in real-time as steps are added
- [ ] Badge has proper styling (circular, blue, white text, shadow)
- [ ] Badge scales on hover for visual feedback
- [ ] Badge handles large numbers (50+) without overflow
- [ ] Timeline expands smoothly when badge is clicked
- [ ] Timeline collapses smoothly when badge is clicked again
- [ ] Badge position is consistent (top-right of timeline area)

## Implementation Details

### Component Structure
The step counter badge is implemented in `Timeline.tsx`:

```tsx
<div className="step-counter-badge">
  {stepCount}
</div>
```

### Key Features
1. **Count Display**: Shows `steps.length` from recording store
2. **Toggle Handler**: `onClick={toggleExpanded}` switches state
3. **Styling**: Circular badge with blue background
4. **Animation**: Scales on hover, smooth transitions
5. **Responsive**: Size changes between collapsed/expanded states

### Store Integration
- Uses `useRecordingStore` to access steps array
- Reactive to step additions/deletions
- Real-time count updates

## Expected Behavior

### Collapsed State
- Badge shows step count (e.g., "5")
- Badge is 48px × 48px (w-12 h-12)
- Badge is clickable
- Hover effect scales badge to 110%

### Expanded State
- Badge shows step count (e.g., "5")
- Badge is 40px × 40px (w-10 h-10)
- Additional text shows "Timeline" and "X steps"
- Collapse icon appears

### Transitions
- Smooth 300ms ease-out transitions
- Badge size changes smoothly
- Timeline width changes from 64px to 320px

## Common Issues

### Issue 1: Badge Not Updating
- **Cause**: Store not connected properly
- **Fix**: Verify `useRecordingStore` is imported and used correctly

### Issue 2: Badge Not Clickable
- **Cause**: Pointer events disabled
- **Fix**: Ensure `pointer-events-auto` on timeline content

### Issue 3: Badge Overflow
- **Cause**: Large numbers don't fit
- **Fix**: Adjust font size or badge size for large counts

## Success Criteria

✅ All automated tests pass
✅ Manual verification checklist complete
✅ Badge displays accurate count
✅ Toggle functionality works smoothly
✅ Visual design matches requirements
✅ No console errors
✅ Performance is smooth (60fps)

## Notes

- The badge is part of the Timeline component, not a separate component
- Badge uses Zustand store for reactive updates
- Badge is always visible when timeline is active
- Badge provides visual feedback for user interactions
- Badge is positioned in the timeline header area

## Related Files

- `src/components/Overlay/Timeline/Timeline.tsx` - Main implementation
- `src/stores/recording.ts` - Step tracking store
- `src/components/Overlay/Timeline/StepBubble.tsx` - Individual step display
- `.kiro/specs/S04-overlay-ui/requirements.md` - Requirements
- `.kiro/specs/S04-overlay-ui/design.md` - Design specifications
