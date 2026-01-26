# S08: LLM Providers - Design

## Architecture (Simplified)

```
┌─────────────────────────────────────────────────────────┐
│                 Provider System (Simplified)             │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Provider Factory                                        │
│  ┌─────────────────────────────────────────────────┐    │
│  │  createProvider(type: ProviderType): Provider   │    │
│  └─────────────────────────────────────────────────┘    │
│                     ↓                                    │
│  5 Core Providers                                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                │
│  │OpenRouter│ │Anthropic │ │  OpenAI  │                │
│  │  (free)  │ │ (Claude) │ │  (GPT)   │                │
│  └──────────┘ └──────────┘ └──────────┘                │
│  ┌──────────┐ ┌──────────┐                              │
│  │  Google  │ │  Ollama  │                              │
│  │ (Gemini) │ │ (local)  │                              │
│  └──────────┘ └──────────┘                              │
│                     ↓                                    │
│  Integrations (Use Existing Subscriptions)               │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Antigravity (Google) | Claude Code (Anthropic)   │   │
│  │  → Auto-detect and use if available               │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## Data Structures

```typescript
// Simplified provider types
type ProviderType = 
  | 'openrouter'   // Free tier, default
  | 'anthropic'    // Claude API
  | 'openai'       // GPT API
  | 'google'       // Gemini API
  | 'ollama';      // Local, free

interface Provider {
  type: ProviderType;
  name: string;
  requiresApiKey: boolean;
  supportsStreaming: boolean;
  
  chat(messages: Message[], options: ChatOptions): AsyncIterable<string>;
  testConnection(): Promise<{ success: boolean; error?: string }>;
  listModels(): Promise<Model[]>;
}

interface ProviderConfig {
  type: ProviderType;
  apiKey?: string;
  baseUrl?: string;
  model: string;
}

interface Model {
  id: string;
  name: string;
  isFree: boolean;
  contextWindow: number;
}
```

## OpenRouter Implementation

```typescript
class OpenRouterProvider implements Provider {
  type = 'openrouter' as const;
  name = 'OpenRouter';
  requiresApiKey = false; // Works with free models!
  supportsStreaming = true;
  
  private baseUrl = 'https://openrouter.ai/api/v1';
  
  static FREE_MODELS = [
    { id: 'google/gemma-2-9b-it:free', name: 'Gemma 2 9B', isFree: true },
    { id: 'meta-llama/llama-3.1-8b-instruct:free', name: 'Llama 3.1 8B', isFree: true },
    { id: 'mistralai/mistral-7b-instruct:free', name: 'Mistral 7B', isFree: true },
  ];
  
  async *chat(messages: Message[], options: ChatOptions): AsyncIterable<string> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://skill-e.app',
        'X-Title': 'Skill-E',
        ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` }),
      },
      body: JSON.stringify({
        model: options.model || OpenRouterProvider.FREE_MODELS[0].id,
        messages,
        stream: true,
      }),
    });
    
    // Stream handling...
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    
    while (true) {
      const { done, value } = await reader!.read();
      if (done) break;
      
      const text = decoder.decode(value);
      const lines = text.split('\n').filter(l => l.startsWith('data:'));
      
      for (const line of lines) {
        const data = line.slice(6);
        if (data === '[DONE]') return;
        
        const json = JSON.parse(data);
        const content = json.choices?.[0]?.delta?.content;
        if (content) yield content;
      }
    }
  }
}
```

## Provider Store

```typescript
// src/stores/provider.ts
interface ProviderState {
  config: ProviderConfig;
  availableIntegrations: {
    antigravity: boolean;
    claudeCode: boolean;
  };
  
  setProvider: (type: ProviderType) => void;
  setApiKey: (key: string) => void;
  setModel: (model: string) => void;
  detectIntegrations: () => Promise<void>;
}

const DEFAULT_CONFIG: ProviderConfig = {
  type: 'openrouter',
  model: 'google/gemma-2-9b-it:free',
};
```

## Integration Detection

```typescript
// Detect Antigravity (Gemini inside Kiro/Google tools)
async function detectAntigravity(): Promise<boolean> {
  // Check if running inside environment with Antigravity
  // This could be detected via MCP, env vars, or API probing
  try {
    // Option 1: Check for MCP server
    const mcpServers = await listMCPServers();
    return mcpServers.includes('antigravity');
  } catch {
    return false;
  }
}

// Detect Claude Code (VS Code extension)
async function detectClaudeCode(): Promise<boolean> {
  // Check if running inside VS Code with Claude Code
  // Could be detected via VS Code API or specific env vars
  try {
    return typeof (window as any).__CLAUDE_CODE__ !== 'undefined';
  } catch {
    return false;
  }
}
```

## UI Components

### ProviderSettings
```tsx
// Settings panel for provider configuration
<ProviderSettings>
  // Provider selector (5 options only)
  <Select options={['OpenRouter', 'Claude', 'OpenAI', 'Gemini', 'Ollama']} />
  
  // API Key (hidden for OpenRouter free)
  {!isFreeProvider && <APIKeyInput />}
  
  // Model selector
  <ModelSelector models={availableModels} />
  
  // Test connection
  <TestConnectionButton />
  
  // Integration status
  <IntegrationStatus 
    antigravity={detected} 
    claudeCode={detected} 
  />
</ProviderSettings>
```

## Files to Copy from SidePilot (Simplified)

Only copy these essential files:
```
SidePilot/src/providers/
├── types.ts           → Simplify to 5 providers
├── base-provider.ts   → Keep core logic
├── factory.ts         → Simplify factory
├── openai.ts          → Use for OpenRouter too
├── anthropic.ts       → For Claude
├── google.ts          → For Gemini
└── ollama.ts          → For local
```

Remove all other providers (40+ → 5).
