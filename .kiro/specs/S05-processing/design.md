# S05: Processing - Design

## Processing Pipeline

```
┌──────────────────────────────────────────────────────────┐
│                   Processing Pipeline                     │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Inputs:                                                 │
│  ├── Screenshots[] (with timestamps)                     │
│  ├── Transcription (with segments)                       │
│  └── Annotations[]                                       │
│                                                          │
│  Step 1: Timeline Building                               │
│  ┌────────────────────────────────────────────────┐     │
│  │  Merge all events by timestamp                  │     │
│  │  [t=0] Screenshot, [t=2] Voice, [t=5] Click... │     │
│  └────────────────────────────────────────────────┘     │
│                                                          │
│  Step 2: Step Detection                                  │
│  ┌────────────────────────────────────────────────┐     │
│  │  Group into steps based on:                    │     │
│  │  - Voice pauses > 2 seconds                    │     │
│  │  - Window focus changes                        │     │
│  │  - Explicit annotations                        │     │
│  └────────────────────────────────────────────────┘     │
│                                                          │
│  Step 3: Context Generation                              │
│  ┌────────────────────────────────────────────────┐     │
│  │  For each step:                                │     │
│  │  - Select representative screenshot            │     │
│  │  - Extract relevant transcript                 │     │
│  │  - Include annotations                         │     │
│  └────────────────────────────────────────────────┘     │
│                                                          │
│  Output: ProcessedSession                                │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

## Data Structures

```typescript
interface ProcessedStep {
  stepNumber: number;
  timeRange: { start: number; end: number };
  screenshotPath: string;
  transcript: string;
  annotations: Annotation[];
  windowTitle?: string;
}

interface ProcessedSession {
  sessionId: string;
  duration: number;
  steps: ProcessedStep[];
  fullTranscript: string;
  allAnnotations: Annotation[];
}

interface LLMContext {
  taskDescription: string;
  steps: Array<{
    number: number;
    description: string;
    screenshot?: string; // base64
    notes: string[];
  }>;
  fullNarration: string;
}
```

## Step Detection Algorithm

```typescript
function detectSteps(timeline: TimelineEvent[]): Step[] {
  const steps: Step[] = [];
  let currentStep: Partial<Step> = { events: [] };
  
  for (const event of timeline) {
    // New step on long pause or window change
    if (shouldStartNewStep(event, currentStep)) {
      if (currentStep.events?.length) {
        steps.push(finalizeStep(currentStep));
      }
      currentStep = { startTime: event.timestamp, events: [] };
    }
    currentStep.events!.push(event);
  }
  
  return steps;
}
```
