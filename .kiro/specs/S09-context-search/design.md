# S09: Context Search - Design

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                 Context Search System                    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Input: Transcription + OCR Text                        │
│              ↓                                          │
│  ┌────────────────────────────────────────────────┐     │
│  │  Library/API Detector                           │     │
│  │  - Pattern matching for known libraries         │     │
│  │  - NER for API/tool mentions                    │     │
│  │  - Code block analysis from OCR                 │     │
│  └────────────────────────────────────────────────┘     │
│              ↓                                          │
│  Detected: ["pandas", "requests", "PostgreSQL"]          │
│              ↓                                          │
│  ┌────────────────────────────────────────────────┐     │
│  │  Context7 MCP Client                            │     │
│  │  - Query: "pandas dataframe filtering"          │     │
│  │  - Response: Relevant doc chunks                │     │
│  └────────────────────────────────────────────────┘     │
│              ↓                                          │
│       (fallback if unavailable)                          │
│              ↓                                          │
│  ┌────────────────────────────────────────────────┐     │
│  │  Web Search Fallback                            │     │
│  │  - GitHub README search                         │     │
│  │  - Official docs search                         │     │
│  │  - StackOverflow examples                       │     │
│  └────────────────────────────────────────────────┘     │
│              ↓                                          │
│  ┌────────────────────────────────────────────────┐     │
│  │  Doc Extractor                                  │     │
│  │  - Extract relevant snippets                    │     │
│  │  - Find code examples                           │     │
│  │  - Summarize for skill context                  │     │
│  └────────────────────────────────────────────────┘     │
│              ↓                                          │
│  Output: DocReference[]                                  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## Data Structures

```typescript
interface DetectedLibrary {
  name: string;
  type: 'python' | 'javascript' | 'tool' | 'database' | 'api';
  confidence: number;
  context: string;  // surrounding text where detected
  usageHint?: string;  // what the user was trying to do
}

interface DocReference {
  id: string;
  library: string;
  title: string;
  url: string;
  snippet: string;  // relevant excerpt
  codeExample?: string;
  source: 'context7' | 'github' | 'official' | 'manual';
  relevance: number;
}

interface DocSearchResult {
  library: string;
  references: DocReference[];
  searchQuery: string;
  timestamp: number;
}
```

## Library Detection Patterns

```typescript
const LIBRARY_PATTERNS = {
  python: {
    // Import patterns
    import: /import\s+(\w+)|from\s+(\w+)\s+import/g,
    // Common libraries with contexts
    libraries: {
      'pandas': ['pd.', 'DataFrame', 'read_csv', 'to_csv'],
      'numpy': ['np.', 'array', 'ndarray', 'zeros'],
      'requests': ['requests.get', 'requests.post', 'response.json'],
      // ...
    }
  },
  javascript: {
    import: /import\s+.*from\s+['"](.+)['"]/g,
    require: /require\s*\(\s*['"](.+)['"]\s*\)/g,
    libraries: {
      'react': ['useState', 'useEffect', 'Component', 'jsx'],
      'axios': ['axios.get', 'axios.post'],
      // ...
    }
  }
};

// Speech patterns that indicate library/API usage
const SPEECH_PATTERNS = [
  /(?:usando|use|with|com)\s+(?:o\s+)?(\w+)/i,
  /(?:biblioteca|library|package)\s+(\w+)/i,
  /(?:api|endpoint)\s+(?:do|de|of|from)?\s*(\w+)/i,
];
```

## Context7 Integration

```typescript
class Context7Client {
  private mcpEndpoint: string;
  
  async searchDocs(library: string, context: string): Promise<DocReference[]> {
    // Build search query from library + usage context
    const query = this.buildQuery(library, context);
    
    // Send to Context7 MCP
    const response = await this.mcp.query({
      library,
      query,
      maxTokens: 500,
      includeExamples: true,
    });
    
    return this.parseResponse(response);
  }
  
  private buildQuery(library: string, context: string): string {
    // Extract what user is trying to do
    // e.g., "pandas dataframe filtering by column"
    return `${library} ${this.extractIntent(context)}`;
  }
}
```

## Web Search Fallback

```typescript
class WebSearchFallback {
  async search(library: string): Promise<DocReference[]> {
    const sources = [
      this.searchGitHub(library),
      this.searchOfficialDocs(library),
      this.searchDevDocs(library),
    ];
    
    const results = await Promise.allSettled(sources);
    return this.mergeAndRank(results);
  }
  
  private async searchGitHub(library: string): Promise<DocReference[]> {
    // Search for README.md in library repo
    const response = await fetch(
      `https://api.github.com/repos/${library}/${library}/readme`
    );
    // Parse and extract relevant sections
  }
}
```

## Skill Integration

```markdown
## Technical References

### pandas DataFrame Operations
> Use `df.query()` for complex filtering:
> ```python
> df.query('age > 30 and status == "active"')
> ```
> [Full Documentation](https://pandas.pydata.org/docs/...)

### PostgreSQL Queries
> For parameterized queries, use:
> ```python
> cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))
> ```
> [Full Documentation](https://www.postgresql.org/docs/...)
```

## UI Component

```tsx
// DocReferences.tsx
interface Props {
  detectedLibraries: DetectedLibrary[];
  references: DocReference[];
  onAddManual: (url: string) => void;
  onRemove: (id: string) => void;
  onEdit: (id: string, content: string) => void;
}

// Shows:
// - List of detected libraries with confidence
// - Fetched references with snippets
// - Add manual URL input
// - Edit/remove controls
```
