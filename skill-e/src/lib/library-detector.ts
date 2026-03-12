/**
 * Library Detector
 *
 * Detects libraries, APIs, and tools mentioned in transcription text and OCR code.
 * Uses pattern matching for imports, known library patterns, and speech patterns.
 *
 * @module lib/library-detector
 */

import type { DetectedLibrary, LibraryType } from '../types/context-search'

/**
 * Pattern definitions for detecting libraries in code
 */
interface LibraryPatterns {
  /** Regex patterns for import statements */
  import: RegExp[]
  /** Known libraries with their usage indicators */
  libraries: Record<string, string[]>
}

/**
 * Configuration for library detection patterns
 */
const LIBRARY_PATTERNS: Record<string, LibraryPatterns> = {
  python: {
    import: [/import\s+(\w+)/g, /from\s+(\w+)\s+import/g, /import\s+(\w+)\s+as\s+\w+/g],
    libraries: {
      pandas: ['pd.', 'DataFrame', 'read_csv', 'to_csv', 'read_excel', 'groupby'],
      numpy: ['np.', 'array', 'ndarray', 'zeros', 'ones', 'arange'],
      matplotlib: ['plt.', 'pyplot', 'plot', 'figure', 'subplot'],
      requests: ['requests.get', 'requests.post', 'response.json', 'requests.put'],
      flask: ['Flask', 'app.route', '@app.route', 'render_template'],
      django: ['django', 'models.Model', 'views.', 'urls.py'],
      fastapi: ['FastAPI', '@app.get', '@app.post', 'APIRouter'],
      sqlalchemy: ['SQLAlchemy', 'db.session', 'db.Model', 'Column'],
      pytest: ['pytest', 'def test_', '@pytest.fixture'],
      selenium: ['webdriver', 'find_element', 'click()', 'send_keys'],
      beautifulsoup: ['BeautifulSoup', 'soup.find', 'soup.select'],
      'scikit-learn': ['sklearn', 'fit()', 'predict()', 'train_test_split'],
      tensorflow: ['tensorflow', 'tf.', 'keras', 'model.fit'],
      pytorch: ['torch', 'nn.Module', 'torch.tensor'],
    },
  },
  javascript: {
    import: [
      /import\s+.*from\s+['"]([^'"]+)['"]/g,
      /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
      /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    ],
    libraries: {
      react: ['useState', 'useEffect', 'Component', 'jsx', 'React.', 'createContext'],
      vue: ['Vue', 'v-if', 'v-for', 'computed', 'ref()', 'reactive'],
      angular: ['@Component', '@Injectable', 'ngOnInit', 'ngFor'],
      express: ['express()', 'app.get', 'app.post', 'req.', 'res.'],
      axios: ['axios.get', 'axios.post', 'axios.put', 'axios.delete'],
      lodash: ['_.map', '_.filter', '_.reduce', 'lodash'],
      moment: ['moment()', 'moment.format', 'moment.add'],
      tailwind: ['className=', 'tw-', 'tailwind'],
      vite: ['vite', 'import.meta', 'vite.config'],
      next: ['Next', 'getServerSideProps', 'getStaticProps', 'useRouter'],
      jest: ['describe(', 'test(', 'expect(', 'jest.fn'],
      cypress: ['cy.', 'cy.visit', 'cy.get', 'cy.click'],
    },
  },
  tool: {
    import: [],
    libraries: {
      git: ['git clone', 'git commit', 'git push', 'git pull', 'git branch'],
      docker: ['docker run', 'docker build', 'Dockerfile', 'docker-compose'],
      kubernetes: ['kubectl', 'k8s', 'deployment.yaml', 'pod', 'service'],
      terraform: ['terraform', 'resource', 'provider', 'terraform apply'],
      aws: ['aws cli', 's3', 'ec2', 'lambda', 'cloudformation'],
      gcloud: ['gcloud', 'gcp', 'compute', 'storage'],
      npm: ['npm install', 'npm run', 'package.json', 'npm start'],
      pip: ['pip install', 'requirements.txt', 'pip freeze'],
      cargo: ['cargo build', 'cargo run', 'Cargo.toml'],
      make: ['Makefile', 'make build', 'make test'],
    },
  },
  database: {
    import: [],
    libraries: {
      postgresql: ['postgres', 'psql', 'pg_', 'SELECT', 'INSERT INTO'],
      mysql: ['mysql', 'SELECT', 'INSERT', 'UPDATE', 'DELETE'],
      mongodb: ['mongo', 'db.collection', 'find()', 'insertOne', 'aggregate'],
      redis: ['redis', 'SET', 'GET', 'HSET', 'LPUSH'],
      sqlite: ['sqlite', 'sqlite3', '.db file'],
      elasticsearch: ['elasticsearch', 'index', 'search', 'query'],
    },
  },
}

/**
 * Speech patterns that indicate library/API usage
 * Captures natural language mentions of libraries
 */
const SPEECH_PATTERNS = [
  // English patterns
  /(?:using|use|with)\s+(?:the\s+)?(\w+)\s+(?:library|package|module|api|tool)/gi,
  /(?:library|package|module)\s+(?:called\s+)?(\w+)/gi,
  /(?:api|endpoint)\s+(?:of|from)?\s*(\w+)/gi,
  /(?:install|import|require)\s+(\w+)/gi,

  // Portuguese patterns
  /(?:usando|use|com)\s+(?:o\s+)?(\w+)/gi,
  /(?:biblioteca|pacote|módulo)\s+(\w+)/gi,
  /(?:api|endpoint)\s+(?:do|de|da)?\s*(\w+)/gi,
]

/**
 * Detects libraries from Python/JavaScript import statements
 */
function detectFromImports(code: string, language: 'python' | 'javascript'): DetectedLibrary[] {
  const detected: DetectedLibrary[] = []
  const patterns = LIBRARY_PATTERNS[language]

  if (!patterns) return detected

  for (const importPattern of patterns.import) {
    let match
    while ((match = importPattern.exec(code)) !== null) {
      const libraryName = match[1]
      if (libraryName && libraryName.length > 1) {
        // Check if it's a known library
        const isKnown = Object.keys(patterns.libraries).includes(libraryName)

        detected.push({
          name: libraryName,
          type: language,
          confidence: isKnown ? 0.9 : 0.6,
          context: match[0],
        })
      }
    }
  }

  return detected
}

/**
 * Detects libraries from usage patterns in code
 */
function detectFromUsagePatterns(code: string, type: LibraryType): DetectedLibrary[] {
  const detected: DetectedLibrary[] = []
  const patterns = LIBRARY_PATTERNS[type]

  if (!patterns) return detected

  for (const [libraryName, usagePatterns] of Object.entries(patterns.libraries)) {
    let matchCount = 0
    let contextSnippet = ''

    for (const pattern of usagePatterns) {
      if (code.includes(pattern)) {
        matchCount++
        if (!contextSnippet) {
          // Extract context around the match
          const index = code.indexOf(pattern)
          const start = Math.max(0, index - 30)
          const end = Math.min(code.length, index + pattern.length + 30)
          contextSnippet = code.substring(start, end).trim()
        }
      }
    }

    if (matchCount > 0) {
      detected.push({
        name: libraryName,
        type,
        confidence: Math.min(0.5 + matchCount * 0.15, 0.95),
        context: contextSnippet,
        usageHint: `Found ${matchCount} usage pattern(s)`,
      })
    }
  }

  return detected
}

/**
 * Detects libraries from speech/transcription text
 */
function detectFromSpeech(text: string): DetectedLibrary[] {
  const detected: DetectedLibrary[] = []
  const lowerText = text.toLowerCase()

  // Check for direct mentions of known libraries first
  for (const [libType, patterns] of Object.entries(LIBRARY_PATTERNS)) {
    for (const libraryName of Object.keys(patterns.libraries)) {
      // Use word boundaries to avoid partial matches
      const regex = new RegExp(`\\b${libraryName}\\b`, 'gi')
      const match = regex.exec(text)

      if (match) {
        // Extract context
        const contextStart = Math.max(0, match.index - 40)
        const contextEnd = Math.min(text.length, match.index + libraryName.length + 40)
        const context = text.substring(contextStart, contextEnd).trim()

        detected.push({
          name: libraryName,
          type: libType as LibraryType,
          confidence: 0.85,
          context,
        })
      }
    }
  }

  // Check speech patterns for any library mentions
  for (const pattern of SPEECH_PATTERNS) {
    // Reset regex lastIndex
    pattern.lastIndex = 0
    let match
    while ((match = pattern.exec(text)) !== null) {
      const libraryName = match[1]
      if (libraryName && libraryName.length > 2) {
        // Determine type by checking known libraries
        let type: LibraryType = 'api'
        let confidence = 0.5

        for (const [libType, patterns] of Object.entries(LIBRARY_PATTERNS)) {
          if (Object.keys(patterns.libraries).includes(libraryName.toLowerCase())) {
            type = libType as LibraryType
            confidence = 0.8
            break
          }
        }

        detected.push({
          name: libraryName,
          type,
          confidence,
          context: match[0],
        })
      }
    }
  }

  return detected
}

/**
 * Merges duplicate detections and keeps the highest confidence
 */
function mergeDuplicates(detections: DetectedLibrary[]): DetectedLibrary[] {
  const merged = new Map<string, DetectedLibrary>()

  for (const detection of detections) {
    const key = `${detection.name.toLowerCase()}-${detection.type}`
    const existing = merged.get(key)

    if (!existing || detection.confidence > existing.confidence) {
      merged.set(key, detection)
    } else if (existing && detection.context.length > existing.context.length) {
      // Keep the detection with more context if confidence is the same
      existing.context = detection.context
      if (detection.usageHint) {
        existing.usageHint = detection.usageHint
      }
    }
  }

  return Array.from(merged.values())
}

/**
 * Main library detector class
 */
export class LibraryDetector {
  /**
   * Detects libraries from OCR code text
   * Analyzes code for import statements and usage patterns
   */
  detectFromCode(code: string): DetectedLibrary[] {
    const detections: DetectedLibrary[] = []

    // Detect from Python imports and patterns
    detections.push(...detectFromImports(code, 'python'))
    detections.push(...detectFromUsagePatterns(code, 'python'))

    // Detect from JavaScript imports and patterns
    detections.push(...detectFromImports(code, 'javascript'))
    detections.push(...detectFromUsagePatterns(code, 'javascript'))

    // Detect tools and databases
    detections.push(...detectFromUsagePatterns(code, 'tool'))
    detections.push(...detectFromUsagePatterns(code, 'database'))

    return mergeDuplicates(detections)
  }

  /**
   * Detects libraries from transcription text
   * Analyzes speech patterns and direct mentions
   */
  detectFromTranscription(text: string): DetectedLibrary[] {
    const detections = detectFromSpeech(text)
    return mergeDuplicates(detections)
  }

  /**
   * Detects libraries from both code and transcription
   * Combines results from all detection methods
   */
  detectAll(code: string, transcription: string): DetectedLibrary[] {
    const codeDetections = this.detectFromCode(code)
    const speechDetections = this.detectFromTranscription(transcription)

    return mergeDuplicates([...codeDetections, ...speechDetections])
  }

  /**
   * Filters detections by minimum confidence threshold
   */
  filterByConfidence(
    detections: DetectedLibrary[],
    minConfidence: number = 0.5
  ): DetectedLibrary[] {
    return detections.filter(d => d.confidence >= minConfidence)
  }

  /**
   * Sorts detections by confidence (highest first)
   */
  sortByConfidence(detections: DetectedLibrary[]): DetectedLibrary[] {
    return [...detections].sort((a, b) => b.confidence - a.confidence)
  }
}

/**
 * Default export - singleton instance
 */
export const libraryDetector = new LibraryDetector()
