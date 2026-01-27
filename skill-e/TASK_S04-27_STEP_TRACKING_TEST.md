# Task S04-27: Step Store Setup - Testing Instructions

## Overview
This task implements step tracking functionality in the recording store to track different types of capture events (Screenshot, Click, Keystroke, Network) for the live timeline UI.

**Requirements**: FR-4.29

## What Was Implemented

### 1. Recording Store Updates (`src/stores/recording.ts`)

#### New Types
- `StepType`: Union type for step categories ('screenshot' | 'click' | 'keystroke' | 'network')
- `CaptureStep`: Interface for tracking individual capture events with:
  - `id`: Unique identifier (auto-generated)
  - `type`: Type of capture event
  - `timestamp`: Unix timestamp in milliseconds (auto-generated)
  - `label`: Human-readable display label
  - `data`: Optional type-specific data (selector, position, text, method, url, frameIndex)
  - `note`: Optional user annotation

#### New State
- `steps: CaptureStep[]`: Array to track all captured steps during recording

#### New Actions
- `addStep(step)`: Add a new step to the recording (auto-generates id and timestamp)
- `updateStepNote(stepId, note)`: Add or update a note for a specific step
- `deleteStep(stepId)`: Remove a step from the recording
- `clearSteps()`: Clear all steps

#### Integration
- Steps are cleared when starting a new recording
- Steps are cleared when canceling a recording
- Steps persist during pause/resume

### 2. Test Component (`src/components/StepTrackingTest.tsx`)

A comprehensive test UI that allows:
- Adding different types of steps (Screenshot, Click, Keystroke, Network)
- Viewing all captured steps with their data
- Adding notes to steps
- Deleting individual steps
- Clearing all steps
- Visual checklist to verify all functionality

### 3. App Routing (`src/App.tsx`)

Added route `#/step-tracking-test` to access the test component.

## Testing Instructions

### Step 1: Start the Development Server

```bash
cd skill-e
npm run dev
```

### Step 2: Navigate to Test Page

Once the app loads, navigate to:
```
http://localhost:1420/#/step-tracking-test
```

Or manually change the URL hash to `#/step-tracking-test`.

### Step 3: Test Step Addition

1. **Add Screenshot Step**
   - Click the "📷 Add Screenshot" button
   - Verify a new step appears with:
     - Type: screenshot
     - Label: "Screen captured"
     - Frame index in data

2. **Add Click Step**
   - Click the "🖱️ Add Click" button
   - Verify a new step appears with:
     - Type: click
     - Label: "Clicked #submit-btn"
     - Selector and position in data

3. **Add Keystroke Step**
   - Click the "⌨️ Add Keystroke" button
   - Verify a new step appears with:
     - Type: keystroke
     - Label: "Typed 'hello world'"
     - Text in data

4. **Add Network Step**
   - Click the "🌐 Add Network" button
   - Verify a new step appears with:
     - Type: network
     - Label: "POST /api/login"
     - Method and URL in data

### Step 4: Test Step Management

1. **Add Note to Step**
   - Click "Add Note" button on any step
   - Enter a note in the prompt
   - Verify the note appears below the step data in blue italic text

2. **Delete Step**
   - Click "Delete" button on any step
   - Verify the step is removed from the list
   - Verify step count decreases

3. **Clear All Steps**
   - Add multiple steps
   - Click "Clear All" button
   - Verify all steps are removed
   - Verify step count shows 0

### Step 5: Verify Data Persistence

1. Add several steps of different types
2. Add notes to some steps
3. Check that each step has:
   - Unique ID (auto-generated)
   - Timestamp (auto-generated, shown in local time)
   - Correct type badge
   - Correct label
   - Type-specific data displayed

### Step 6: Check Test Checklist

At the bottom of the test page, verify all items in the checklist turn green:
- ✓ Can add steps to the store
- ✓ Can track screenshot steps
- ✓ Can track click steps
- ✓ Can track keystroke steps
- ✓ Can track network steps
- ✓ Can add notes to steps
- ✓ Can clear all steps

## Expected Behavior

### Step Addition
- Each step should have a unique ID
- Timestamp should be automatically set to current time
- Steps should appear in chronological order
- Step count should increment correctly

### Step Data
- Screenshot: Should show frame index
- Click: Should show selector and position coordinates
- Keystroke: Should show the typed text
- Network: Should show HTTP method and URL

### Step Management
- Notes should persist after being added
- Deleting a step should not affect other steps
- Clearing all should reset to empty state
- Step IDs should remain unique across operations

## Integration Points

This step tracking functionality will be used by:

1. **Live Timeline UI (Tasks 28-31)**: Display steps as bubbles in the overlay
2. **Processing Pipeline (S05)**: Convert steps to timeline events for analysis
3. **Recording Integration**: Automatically add steps when:
   - Screenshots are captured
   - Clicks are detected
   - Keystrokes are recorded
   - Network requests are intercepted

## Success Criteria

- [x] Step types defined (Screenshot, Click, Keystroke, Network)
- [x] CaptureStep interface created with all required fields
- [x] Recording store updated with steps array
- [x] addStep action implemented with auto-generation of id and timestamp
- [x] updateStepNote action implemented
- [x] deleteStep action implemented
- [x] clearSteps action implemented
- [x] Steps cleared on recording start/cancel
- [x] Test component created and functional
- [x] All test checklist items can be verified

## Notes

- The step tracking is currently manual (via test buttons)
- Future tasks will integrate automatic step detection from actual recording events
- The data structure is designed to be compatible with the processing pipeline's TimelineEvent types
- Step IDs use crypto.randomUUID() for guaranteed uniqueness

## Next Steps

After verifying this task:
1. Task 28: Create StepBubble component for visual display
2. Task 29: Create Timeline container component
3. Task 30: Implement auto-fade logic for older steps
4. Task 31: Add step counter badge and expand/collapse functionality
