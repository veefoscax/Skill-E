# S10: Skill Validation - Design

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Skill Validation System                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Input: SKILL.md                                             │
│              ↓                                               │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Skill Parser                                       │     │
│  │  - Parse steps from markdown                        │     │
│  │  - Extract action types                             │     │
│  │  - Identify confirmation points                     │     │
│  └────────────────────────────────────────────────────┘     │
│              ↓                                               │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Step Executor                                      │     │
│  │  ┌──────────────┐ ┌──────────────┐                 │     │
│  │  │ DOM Actions  │ │ Image Actions│                 │     │
│  │  │ (Playwright) │ │ (Screenshot) │                 │     │
│  │  └──────────────┘ └──────────────┘                 │     │
│  │         ↓                ↓                          │     │
│  │     [Hybrid Selection Logic]                        │     │
│  └────────────────────────────────────────────────────┘     │
│              ↓                                               │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Execution Monitor                                  │     │
│  │  - Track success/failure                            │     │
│  │  - Capture screenshots                              │     │
│  │  - Detect anti-bot measures                         │     │
│  │  - Pause on CONFIRM points                          │     │
│  └────────────────────────────────────────────────────┘     │
│              ↓                                               │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Feedback Loop                                      │     │
│  │  - Display error to user                            │     │
│  │  - Collect feedback                                 │     │
│  │  - Update skill with fix                            │     │
│  │  - Retry step                                       │     │
│  └────────────────────────────────────────────────────┘     │
│              ↓                                               │
│  Output: Validated SKILL.md + Execution Report              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Data Structures

```typescript
interface SkillStep {
  id: string;
  index: number;
  instruction: string;
  actionType: 'click' | 'type' | 'navigate' | 'wait' | 'verify' | 'confirm';
  target?: {
    selector?: string;      // CSS/XPath for DOM
    coordinates?: { x: number; y: number };  // For image-based
    imageRef?: string;      // Reference screenshot
    text?: string;          // Text to type or verify
  };
  requiresConfirmation: boolean;
  status: 'pending' | 'running' | 'success' | 'failed' | 'skipped';
  error?: string;
  feedback?: string;
}

interface ExecutionSession {
  skillId: string;
  startTime: Date;
  steps: SkillStep[];
  currentStepIndex: number;
  mode: 'auto' | 'step-by-step' | 'paused';
  automationType: 'dom' | 'image' | 'hybrid';
  screenshots: Screenshot[];
  feedbackLog: FeedbackEntry[];
}

interface FeedbackEntry {
  stepId: string;
  timestamp: Date;
  issue: string;
  userFeedback: string;
  resolution: 'fixed' | 'skipped' | 'manual';
  skillUpdate?: string;  // New instruction text
}
```

## Automation Modes

### DOM-based (Preferred)
```typescript
class DOMExecutor {
  async click(selector: string): Promise<boolean> {
    // Use Playwright or Tauri webview API
    const element = await this.page.$(selector);
    if (!element) return false;
    await element.click();
    return true;
  }
  
  async type(selector: string, text: string): Promise<boolean> {
    const element = await this.page.$(selector);
    if (!element) return false;
    await element.fill(text);
    return true;
  }
}
```

### Image-based (Fallback)
```typescript
class ImageExecutor {
  async clickByImage(referenceImage: string): Promise<boolean> {
    // Take screenshot
    const currentScreen = await this.captureScreen();
    
    // Find template match
    const match = await this.findTemplate(currentScreen, referenceImage);
    if (!match || match.confidence < 0.8) return false;
    
    // Click at match location
    await this.clickAt(match.x, match.y);
    return true;
  }
}
```

### Hybrid (Recommended)
```typescript
class HybridExecutor {
  async executeAction(step: SkillStep): Promise<ExecutionResult> {
    // 1. Try DOM first (faster, more reliable)
    if (step.target?.selector) {
      const domResult = await this.domExecutor.execute(step);
      if (domResult.success) return domResult;
    }
    
    // 2. Fall back to image (works with anti-bot)
    if (step.target?.imageRef) {
      const imageResult = await this.imageExecutor.execute(step);
      if (imageResult.success) return imageResult;
    }
    
    // 3. Pause for human intervention
    return {
      success: false,
      needsHuman: true,
      error: 'Could not execute step automatically',
    };
  }
}
```

## Anti-Bot Detection

```typescript
const ANTI_BOT_INDICATORS = [
  'cloudflare',
  'captcha',
  'recaptcha',
  'hcaptcha',
  'challenge',
  'bot-detection',
  'verify you are human',
];

function detectAntiBot(pageContent: string, url: string): boolean {
  const content = pageContent.toLowerCase();
  return ANTI_BOT_INDICATORS.some(indicator => 
    content.includes(indicator) || url.includes(indicator)
  );
}
```

## UI Components

### SkillValidator
```tsx
// Main validation interface
- Shows skill steps in left panel
- Shows execution view in right panel
- Progress bar at top
- Controls: Run All, Step, Pause, Stop
```

### StepRunner
```tsx
// Individual step execution UI
- Step instruction text
- Status indicator (pending/running/success/failed)
- Screenshot preview (before/after)
- Retry/Skip/Edit buttons
```

### FeedbackDialog
```tsx
// When step fails
- Shows what went wrong
- Input for user feedback
- Options: Fix and retry, Skip, Edit manually
- LLM suggestion for fix
```

## Integration with External Agents

### Antigravity (Google)
```typescript
// If Antigravity is available via MCP or API
async function delegateToAntigravity(skill: Skill): Promise<ExecutionResult> {
  // Send skill to Antigravity for execution
  // Monitor progress through callback
  // Collect results
}
```

### Claude Code
```typescript
// If running inside VS Code with Claude Code
async function delegateToClaudeCode(skill: Skill): Promise<ExecutionResult> {
  // Use Claude Code's computer use capability
  // Benefit: Uses existing subscription
}
```
