# StepRunner Component

The `StepRunner` component displays individual step execution details during skill validation. It provides a comprehensive view of a single step's status, instruction, target information, screenshots, and action buttons.

## Features

- **Status Display**: Visual indicators for pending, running, success, failed, and skipped states
- **Instruction View**: Clear display of the step instruction
- **Target Information**: Shows selectors, coordinates, descriptions, and text for the target element
- **Screenshot Viewer**: Before/after/error screenshot comparison with navigation
- **Action Buttons**: Retry, Skip, and Edit buttons for failed steps
- **Error Display**: Clear error messages with visual emphasis
- **Feedback Display**: Shows user feedback when provided
- **Confirmation Indicator**: Highlights steps that require user confirmation

## Usage

### Basic Usage

```tsx
import { StepRunner } from '@/components/StepRunner';
import type { SkillStep } from '@/lib/skill-parser';

function MyComponent() {
  const step: SkillStep = {
    id: 'step-1',
    index: 0,
    stepNumber: 1,
    instruction: 'Click the submit button',
    actionType: 'click',
    status: 'pending',
    requiresConfirmation: false,
    target: {
      selector: '#submit-btn',
      description: 'Submit button',
    },
  };
  
  return <StepRunner step={step} />;
}
```

### With Action Handlers

```tsx
import { StepRunner } from '@/components/StepRunner';

function MyComponent() {
  const handleRetry = (step: SkillStep) => {
    console.log('Retrying step:', step.id);
    // Retry logic here
  };
  
  const handleSkip = (step: SkillStep) => {
    console.log('Skipping step:', step.id);
    // Skip logic here
  };
  
  const handleEdit = (step: SkillStep) => {
    console.log('Editing step:', step.id);
    // Edit logic here
  };
  
  return (
    <StepRunner
      step={failedStep}
      onRetry={handleRetry}
      onSkip={handleSkip}
      onEdit={handleEdit}
    />
  );
}
```

### With Screenshots

```tsx
import { StepRunner } from '@/components/StepRunner';
import type { ExecutionScreenshot } from '@/lib/skill-executor';

function MyComponent() {
  const screenshots: ExecutionScreenshot[] = [
    {
      id: 'screenshot-1',
      stepId: 'step-1',
      timing: 'before',
      data: 'data:image/png;base64,...',
      timestamp: Date.now() - 2000,
      description: 'Before execution',
    },
    {
      id: 'screenshot-2',
      stepId: 'step-1',
      timing: 'after',
      data: 'data:image/png;base64,...',
      timestamp: Date.now() - 1000,
      description: 'After execution',
    },
  ];
  
  return (
    <StepRunner
      step={step}
      screenshots={screenshots}
    />
  );
}
```

### Integration with SkillValidator

The `StepRunner` component is designed to work seamlessly with the `SkillValidator` component:

```tsx
import { SkillValidator } from '@/components/SkillValidator';
import { StepRunner } from '@/components/StepRunner';

function ValidationView() {
  return (
    <SkillValidator
      skillMarkdown={skillContent}
      onComplete={(stats) => {
        console.log('Validation complete:', stats);
      }}
    />
  );
}
```

The `SkillValidator` internally uses step display logic similar to `StepRunner` for showing step details in the right panel.

## Props

### StepRunnerProps

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `step` | `SkillStep` | Required | The step to display |
| `screenshots` | `ExecutionScreenshot[]` | `[]` | Screenshots for this step |
| `isExecuting` | `boolean` | `false` | Whether the step is currently executing |
| `actionsDisabled` | `boolean` | `false` | Whether actions are disabled |
| `onRetry` | `(step: SkillStep) => void` | - | Callback when retry is requested |
| `onSkip` | `(step: SkillStep) => void` | - | Callback when skip is requested |
| `onEdit` | `(step: SkillStep) => void` | - | Callback when edit is requested |
| `className` | `string` | - | Optional className for styling |
| `showActions` | `boolean` | `true` | Whether to show action buttons |
| `showScreenshots` | `boolean` | `true` | Whether to show screenshots |

## Step Status

The component displays different visual states based on the step status:

- **Pending**: Clock icon, muted colors
- **Running**: Spinning loader, primary colors
- **Success**: Check icon, green colors
- **Failed**: X icon, red/destructive colors
- **Skipped**: Fast-forward icon, yellow colors

## Action Buttons

Action buttons are shown based on the step status:

- **Retry**: Shown for failed steps
- **Skip**: Shown for failed or pending steps
- **Edit**: Shown for failed steps

All buttons are disabled when `actionsDisabled` is true or when `isExecuting` is true.

## Screenshot Viewer

The screenshot viewer provides:

- Navigation between multiple screenshots
- Quick filters for before/after/error screenshots
- Zoom functionality
- Timing badges (BEFORE, AFTER, ERROR)
- Screenshot descriptions

## Requirements

This component implements:
- **FR-10.1**: Step-by-step skill execution with visual feedback
- **FR-10.7**: Feedback capture for failed steps

## Design System

The component follows the Skill-E design system:
- Uses shadcn/ui components (Button, Separator)
- Follows the Mira/Neutral color scheme
- Uses Nunito Sans font (inherited)
- Implements proper spacing and padding
- Supports dark mode

## Examples

See `StepRunner.example.tsx` for comprehensive examples of all component states and configurations.
