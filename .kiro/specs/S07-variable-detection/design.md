# S07: Variable Detection - Design

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│              Variable Detection System                   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Inputs:                                                 │
│  ├── Transcription segments with timestamps              │
│  ├── Action events (clicks, inputs, selections)         │
│  └── OCR text from screenshots                          │
│                                                          │
│  Processing:                                             │
│  ┌────────────────────────────────────────────────┐     │
│  │  1. Speech Pattern Matching                     │     │
│  │     - Regex patterns for variable mentions      │     │
│  │     - Conditional pattern detection             │     │
│  └────────────────────────────────────────────────┘     │
│                        ↓                                 │
│  ┌────────────────────────────────────────────────┐     │
│  │  2. Action Analysis                             │     │
│  │     - Form field detection                      │     │
│  │     - Input type classification                 │     │
│  └────────────────────────────────────────────────┘     │
│                        ↓                                 │
│  ┌────────────────────────────────────────────────┐     │
│  │  3. Correlation Engine                          │     │
│  │     - Match speech to actions by timestamp      │     │
│  │     - Calculate confidence scores               │     │
│  └────────────────────────────────────────────────┘     │
│                        ↓                                 │
│  ┌────────────────────────────────────────────────┐     │
│  │  4. LLM Enhancement (optional)                  │     │
│  │     - Semantic analysis for edge cases          │     │
│  │     - Context understanding                     │     │
│  └────────────────────────────────────────────────┘     │
│                                                          │
│  Output: VariableHint[]                                 │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## Data Structures

```typescript
interface VariableHint {
  id: string;
  name: string;
  type: 'text' | 'number' | 'selection' | 'file' | 'date';
  defaultValue?: string;
  options?: string[];  // for selection type
  description: string;
  confidence: number;  // 0-1
  origin: VariableOrigin;
  status: 'detected' | 'confirmed' | 'rejected' | 'manual';
}

interface VariableOrigin {
  source: 'speech' | 'action' | 'correlation' | 'llm' | 'manual';
  speechSnippet?: string;
  speechTimestamp?: number;
  actionType?: string;
  actionValue?: string;
  actionTimestamp?: number;
}

interface ConditionalHint {
  id: string;
  condition: string;
  thenAction: string;
  elseAction?: string;
  confidence: number;
  sourceTimestamp: number;
}
```

## Speech Patterns (Portuguese + English)

```typescript
const VARIABLE_PATTERNS_PT = [
  // Direct mentions
  { pattern: /o nome (do|da|de) (\w+)/i, extract: 2, type: 'text' },
  { pattern: /o (email|telefone|cpf|código|id) (do|da|de)?/i, extract: 1, type: 'text' },
  { pattern: /qualquer (\w+)/i, extract: 1, type: 'text' },
  
  // Dynamic content hints
  { pattern: /isso (aqui )?(vai|pode) mudar/i, context: true },
  { pattern: /depende (do|da|de) (\w+)/i, extract: 2, type: 'dynamic' },
  
  // Input instructions
  { pattern: /digita (aqui )?(o|a) (\w+)/i, extract: 3, type: 'text' },
  { pattern: /coloca (aqui )?(o|a) (\w+)/i, extract: 3, type: 'text' },
  { pattern: /seleciona (o|a) (\w+)/i, extract: 2, type: 'selection' },
];

const CONDITIONAL_PATTERNS_PT = [
  { pattern: /se (for|tiver|houver|o) (.+?), (então|aí|daí)/i, condition: 2, then: 3 },
  { pattern: /quando (o|a) (.+?) (for|estiver|tiver)/i, condition: 2 },
  { pattern: /dependendo (do|da|de) (.+)/i, condition: 2 },
  { pattern: /caso (o|a) (.+?) (seja|esteja)/i, condition: 2 },
];

const CONTEXT_PATTERNS_PT = [
  /isso é importante porque/i,
  /presta atenção (aqui|nisso)/i,
  /geralmente/i,
  /na maioria das vezes/i,
  /o motivo (é|disso)/i,
];
```

## Correlation Algorithm

```typescript
function correlateVariables(
  speechSegments: TranscriptSegment[],
  actions: Action[]
): VariableHint[] {
  const hints: VariableHint[] = [];
  const CORRELATION_WINDOW_MS = 5000; // 5 seconds
  
  for (const segment of speechSegments) {
    // Find actions within window after speech
    const nearbyActions = actions.filter(a => 
      a.timestamp >= segment.start &&
      a.timestamp <= segment.end + CORRELATION_WINDOW_MS
    );
    
    // Check for variable patterns in speech
    const speechVariables = extractSpeechVariables(segment.text);
    
    // Check for variable-like actions
    const actionVariables = extractActionVariables(nearbyActions);
    
    // Correlate
    for (const sv of speechVariables) {
      for (const av of actionVariables) {
        if (isLikelyCorrelated(sv, av)) {
          hints.push({
            id: generateId(),
            name: sv.suggestedName || av.fieldName,
            type: av.type,
            defaultValue: av.value,
            description: `From: "${segment.text}"`,
            confidence: calculateConfidence(sv, av, segment),
            origin: {
              source: 'correlation',
              speechSnippet: segment.text,
              speechTimestamp: segment.start,
              actionType: av.type,
              actionValue: av.value,
              actionTimestamp: av.timestamp,
            },
            status: 'detected',
          });
        }
      }
    }
  }
  
  return deduplicateHints(hints);
}
```

## UI Component

```tsx
// VariableConfirmation.tsx
interface Props {
  detectedVariables: VariableHint[];
  onConfirm: (variables: VariableHint[]) => void;
  onAddManual: (variable: VariableHint) => void;
}

// Shows:
// - List of detected variables with confidence indicators
// - Origin information (speech snippet / action)
// - Edit controls (rename, change type, delete)
// - Add manual variable option
// - Confirm button
```
