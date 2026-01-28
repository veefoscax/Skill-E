/**
 * Known Libraries Database
 * 
 * Maps library names to their official documentation URLs and provides
 * metadata for documentation fetching and context search.
 * 
 * This database is used by the documentation fetcher to know where to find
 * official documentation for detected libraries.
 * 
 * @module lib/library-database
 */

import type { LibraryType } from '../types/context-search';

/**
 * Library metadata including documentation URLs and search hints
 */
export interface LibraryMetadata {
  /** Library name (lowercase, canonical) */
  name: string;
  
  /** Display name (proper capitalization) */
  displayName: string;
  
  /** Library type classification */
  type: LibraryType;
  
  /** Official documentation URL */
  officialDocs: string;
  
  /** GitHub repository URL (if available) */
  githubRepo?: string;
  
  /** Alternative documentation sources */
  altDocs?: string[];
  
  /** Common usage patterns for detection (used by library-detector) */
  usagePatterns: string[];
  
  /** Keywords for search query building */
  searchKeywords: string[];
  
  /** Package manager name (if different from library name) */
  packageName?: string;
}

/**
 * Database of known libraries with their documentation URLs
 */
export const LIBRARY_DATABASE: Record<string, LibraryMetadata> = {
  // ============================================================================
  // PYTHON LIBRARIES
  // ============================================================================
  
  'pandas': {
    name: 'pandas',
    displayName: 'pandas',
    type: 'python',
    officialDocs: 'https://pandas.pydata.org/docs/',
    githubRepo: 'https://github.com/pandas-dev/pandas',
    altDocs: [
      'https://pandas.pydata.org/pandas-docs/stable/',
    ],
    usagePatterns: ['pd.', 'DataFrame', 'read_csv', 'to_csv', 'read_excel', 'groupby'],
    searchKeywords: ['dataframe', 'data analysis', 'csv', 'excel', 'data manipulation'],
    packageName: 'pandas',
  },
  
  'numpy': {
    name: 'numpy',
    displayName: 'NumPy',
    type: 'python',
    officialDocs: 'https://numpy.org/doc/stable/',
    githubRepo: 'https://github.com/numpy/numpy',
    usagePatterns: ['np.', 'array', 'ndarray', 'zeros', 'ones', 'arange'],
    searchKeywords: ['array', 'numerical computing', 'matrix', 'linear algebra'],
    packageName: 'numpy',
  },
  
  'matplotlib': {
    name: 'matplotlib',
    displayName: 'Matplotlib',
    type: 'python',
    officialDocs: 'https://matplotlib.org/stable/contents.html',
    githubRepo: 'https://github.com/matplotlib/matplotlib',
    usagePatterns: ['plt.', 'pyplot', 'plot', 'figure', 'subplot'],
    searchKeywords: ['plotting', 'visualization', 'charts', 'graphs'],
    packageName: 'matplotlib',
  },
  
  'requests': {
    name: 'requests',
    displayName: 'Requests',
    type: 'python',
    officialDocs: 'https://requests.readthedocs.io/en/latest/',
    githubRepo: 'https://github.com/psf/requests',
    usagePatterns: ['requests.get', 'requests.post', 'response.json', 'requests.put'],
    searchKeywords: ['http', 'api', 'rest', 'web requests'],
    packageName: 'requests',
  },
  
  'flask': {
    name: 'flask',
    displayName: 'Flask',
    type: 'python',
    officialDocs: 'https://flask.palletsprojects.com/',
    githubRepo: 'https://github.com/pallets/flask',
    usagePatterns: ['Flask', 'app.route', '@app.route', 'render_template'],
    searchKeywords: ['web framework', 'api', 'routing', 'templates'],
    packageName: 'Flask',
  },
  
  'django': {
    name: 'django',
    displayName: 'Django',
    type: 'python',
    officialDocs: 'https://docs.djangoproject.com/',
    githubRepo: 'https://github.com/django/django',
    usagePatterns: ['django', 'models.Model', 'views.', 'urls.py'],
    searchKeywords: ['web framework', 'orm', 'models', 'views', 'templates'],
    packageName: 'Django',
  },
  
  'fastapi': {
    name: 'fastapi',
    displayName: 'FastAPI',
    type: 'python',
    officialDocs: 'https://fastapi.tiangolo.com/',
    githubRepo: 'https://github.com/tiangolo/fastapi',
    usagePatterns: ['FastAPI', '@app.get', '@app.post', 'APIRouter'],
    searchKeywords: ['api', 'async', 'rest', 'openapi', 'swagger'],
    packageName: 'fastapi',
  },
  
  'sqlalchemy': {
    name: 'sqlalchemy',
    displayName: 'SQLAlchemy',
    type: 'python',
    officialDocs: 'https://docs.sqlalchemy.org/',
    githubRepo: 'https://github.com/sqlalchemy/sqlalchemy',
    usagePatterns: ['SQLAlchemy', 'db.session', 'db.Model', 'Column'],
    searchKeywords: ['orm', 'database', 'sql', 'models'],
    packageName: 'SQLAlchemy',
  },
  
  'pytest': {
    name: 'pytest',
    displayName: 'pytest',
    type: 'python',
    officialDocs: 'https://docs.pytest.org/',
    githubRepo: 'https://github.com/pytest-dev/pytest',
    usagePatterns: ['pytest', 'def test_', '@pytest.fixture'],
    searchKeywords: ['testing', 'unit tests', 'fixtures', 'assertions'],
    packageName: 'pytest',
  },
  
  'selenium': {
    name: 'selenium',
    displayName: 'Selenium',
    type: 'python',
    officialDocs: 'https://www.selenium.dev/documentation/',
    githubRepo: 'https://github.com/SeleniumHQ/selenium',
    usagePatterns: ['webdriver', 'find_element', 'click()', 'send_keys'],
    searchKeywords: ['browser automation', 'web testing', 'webdriver'],
    packageName: 'selenium',
  },
  
  'beautifulsoup': {
    name: 'beautifulsoup',
    displayName: 'Beautiful Soup',
    type: 'python',
    officialDocs: 'https://www.crummy.com/software/BeautifulSoup/bs4/doc/',
    usagePatterns: ['BeautifulSoup', 'soup.find', 'soup.select'],
    searchKeywords: ['web scraping', 'html parsing', 'xml'],
    packageName: 'beautifulsoup4',
  },
  
  'scikit-learn': {
    name: 'scikit-learn',
    displayName: 'scikit-learn',
    type: 'python',
    officialDocs: 'https://scikit-learn.org/stable/documentation.html',
    githubRepo: 'https://github.com/scikit-learn/scikit-learn',
    usagePatterns: ['sklearn', 'fit()', 'predict()', 'train_test_split'],
    searchKeywords: ['machine learning', 'classification', 'regression', 'clustering'],
    packageName: 'scikit-learn',
  },
  
  'tensorflow': {
    name: 'tensorflow',
    displayName: 'TensorFlow',
    type: 'python',
    officialDocs: 'https://www.tensorflow.org/api_docs',
    githubRepo: 'https://github.com/tensorflow/tensorflow',
    usagePatterns: ['tensorflow', 'tf.', 'keras', 'model.fit'],
    searchKeywords: ['deep learning', 'neural networks', 'machine learning'],
    packageName: 'tensorflow',
  },
  
  'pytorch': {
    name: 'pytorch',
    displayName: 'PyTorch',
    type: 'python',
    officialDocs: 'https://pytorch.org/docs/stable/index.html',
    githubRepo: 'https://github.com/pytorch/pytorch',
    usagePatterns: ['torch', 'nn.Module', 'torch.tensor'],
    searchKeywords: ['deep learning', 'neural networks', 'machine learning'],
    packageName: 'torch',
  },
  
  // ============================================================================
  // JAVASCRIPT/TYPESCRIPT LIBRARIES
  // ============================================================================
  
  'react': {
    name: 'react',
    displayName: 'React',
    type: 'javascript',
    officialDocs: 'https://react.dev/',
    githubRepo: 'https://github.com/facebook/react',
    altDocs: [
      'https://legacy.reactjs.org/docs/getting-started.html',
    ],
    usagePatterns: ['useState', 'useEffect', 'Component', 'jsx', 'React.', 'createContext'],
    searchKeywords: ['ui', 'components', 'hooks', 'jsx', 'frontend'],
    packageName: 'react',
  },
  
  'vue': {
    name: 'vue',
    displayName: 'Vue.js',
    type: 'javascript',
    officialDocs: 'https://vuejs.org/guide/introduction.html',
    githubRepo: 'https://github.com/vuejs/core',
    usagePatterns: ['Vue', 'v-if', 'v-for', 'computed', 'ref()', 'reactive'],
    searchKeywords: ['ui', 'components', 'reactive', 'frontend'],
    packageName: 'vue',
  },
  
  'angular': {
    name: 'angular',
    displayName: 'Angular',
    type: 'javascript',
    officialDocs: 'https://angular.io/docs',
    githubRepo: 'https://github.com/angular/angular',
    usagePatterns: ['@Component', '@Injectable', 'ngOnInit', 'ngFor'],
    searchKeywords: ['ui', 'components', 'typescript', 'frontend'],
    packageName: '@angular/core',
  },
  
  'express': {
    name: 'express',
    displayName: 'Express',
    type: 'javascript',
    officialDocs: 'https://expressjs.com/',
    githubRepo: 'https://github.com/expressjs/express',
    usagePatterns: ['express()', 'app.get', 'app.post', 'req.', 'res.'],
    searchKeywords: ['web framework', 'api', 'routing', 'middleware', 'node'],
    packageName: 'express',
  },
  
  'axios': {
    name: 'axios',
    displayName: 'Axios',
    type: 'javascript',
    officialDocs: 'https://axios-http.com/docs/intro',
    githubRepo: 'https://github.com/axios/axios',
    usagePatterns: ['axios.get', 'axios.post', 'axios.put', 'axios.delete'],
    searchKeywords: ['http', 'api', 'rest', 'requests'],
    packageName: 'axios',
  },
  
  'lodash': {
    name: 'lodash',
    displayName: 'Lodash',
    type: 'javascript',
    officialDocs: 'https://lodash.com/docs/',
    githubRepo: 'https://github.com/lodash/lodash',
    usagePatterns: ['_.map', '_.filter', '_.reduce', 'lodash'],
    searchKeywords: ['utility', 'functional', 'array', 'object'],
    packageName: 'lodash',
  },
  
  'moment': {
    name: 'moment',
    displayName: 'Moment.js',
    type: 'javascript',
    officialDocs: 'https://momentjs.com/docs/',
    githubRepo: 'https://github.com/moment/moment',
    usagePatterns: ['moment()', 'moment.format', 'moment.add'],
    searchKeywords: ['date', 'time', 'formatting', 'parsing'],
    packageName: 'moment',
  },
  
  'tailwind': {
    name: 'tailwind',
    displayName: 'Tailwind CSS',
    type: 'javascript',
    officialDocs: 'https://tailwindcss.com/docs',
    githubRepo: 'https://github.com/tailwindlabs/tailwindcss',
    usagePatterns: ['className=', 'tw-', 'tailwind'],
    searchKeywords: ['css', 'styling', 'utility classes', 'design'],
    packageName: 'tailwindcss',
  },
  
  'vite': {
    name: 'vite',
    displayName: 'Vite',
    type: 'javascript',
    officialDocs: 'https://vitejs.dev/guide/',
    githubRepo: 'https://github.com/vitejs/vite',
    usagePatterns: ['vite', 'import.meta', 'vite.config'],
    searchKeywords: ['build tool', 'bundler', 'dev server', 'hmr'],
    packageName: 'vite',
  },
  
  'next': {
    name: 'next',
    displayName: 'Next.js',
    type: 'javascript',
    officialDocs: 'https://nextjs.org/docs',
    githubRepo: 'https://github.com/vercel/next.js',
    usagePatterns: ['Next', 'getServerSideProps', 'getStaticProps', 'useRouter'],
    searchKeywords: ['react', 'ssr', 'routing', 'framework'],
    packageName: 'next',
  },
  
  'jest': {
    name: 'jest',
    displayName: 'Jest',
    type: 'javascript',
    officialDocs: 'https://jestjs.io/docs/getting-started',
    githubRepo: 'https://github.com/jestjs/jest',
    usagePatterns: ['describe(', 'test(', 'expect(', 'jest.fn'],
    searchKeywords: ['testing', 'unit tests', 'mocking', 'assertions'],
    packageName: 'jest',
  },
  
  'cypress': {
    name: 'cypress',
    displayName: 'Cypress',
    type: 'javascript',
    officialDocs: 'https://docs.cypress.io/',
    githubRepo: 'https://github.com/cypress-io/cypress',
    usagePatterns: ['cy.', 'cy.visit', 'cy.get', 'cy.click'],
    searchKeywords: ['e2e testing', 'integration testing', 'browser testing'],
    packageName: 'cypress',
  },
  
  // ============================================================================
  // DEVELOPMENT TOOLS
  // ============================================================================
  
  'git': {
    name: 'git',
    displayName: 'Git',
    type: 'tool',
    officialDocs: 'https://git-scm.com/doc',
    githubRepo: 'https://github.com/git/git',
    usagePatterns: ['git clone', 'git commit', 'git push', 'git pull', 'git branch'],
    searchKeywords: ['version control', 'repository', 'commit', 'branch'],
  },
  
  'docker': {
    name: 'docker',
    displayName: 'Docker',
    type: 'tool',
    officialDocs: 'https://docs.docker.com/',
    githubRepo: 'https://github.com/docker/docker-ce',
    usagePatterns: ['docker run', 'docker build', 'Dockerfile', 'docker-compose'],
    searchKeywords: ['containers', 'containerization', 'images', 'deployment'],
  },
  
  'kubernetes': {
    name: 'kubernetes',
    displayName: 'Kubernetes',
    type: 'tool',
    officialDocs: 'https://kubernetes.io/docs/',
    githubRepo: 'https://github.com/kubernetes/kubernetes',
    usagePatterns: ['kubectl', 'k8s', 'deployment.yaml', 'pod', 'service'],
    searchKeywords: ['orchestration', 'containers', 'deployment', 'cluster'],
  },
  
  'terraform': {
    name: 'terraform',
    displayName: 'Terraform',
    type: 'tool',
    officialDocs: 'https://developer.hashicorp.com/terraform/docs',
    githubRepo: 'https://github.com/hashicorp/terraform',
    usagePatterns: ['terraform', 'resource', 'provider', 'terraform apply'],
    searchKeywords: ['infrastructure as code', 'iac', 'provisioning', 'cloud'],
  },
  
  'aws': {
    name: 'aws',
    displayName: 'AWS CLI',
    type: 'tool',
    officialDocs: 'https://docs.aws.amazon.com/cli/',
    githubRepo: 'https://github.com/aws/aws-cli',
    usagePatterns: ['aws cli', 's3', 'ec2', 'lambda', 'cloudformation'],
    searchKeywords: ['cloud', 'amazon', 'infrastructure', 'services'],
  },
  
  'gcloud': {
    name: 'gcloud',
    displayName: 'Google Cloud CLI',
    type: 'tool',
    officialDocs: 'https://cloud.google.com/sdk/docs',
    usagePatterns: ['gcloud', 'gcp', 'compute', 'storage'],
    searchKeywords: ['cloud', 'google', 'infrastructure', 'services'],
  },
  
  'npm': {
    name: 'npm',
    displayName: 'npm',
    type: 'tool',
    officialDocs: 'https://docs.npmjs.com/',
    githubRepo: 'https://github.com/npm/cli',
    usagePatterns: ['npm install', 'npm run', 'package.json', 'npm start'],
    searchKeywords: ['package manager', 'node', 'dependencies', 'javascript'],
  },
  
  'pip': {
    name: 'pip',
    displayName: 'pip',
    type: 'tool',
    officialDocs: 'https://pip.pypa.io/en/stable/',
    githubRepo: 'https://github.com/pypa/pip',
    usagePatterns: ['pip install', 'requirements.txt', 'pip freeze'],
    searchKeywords: ['package manager', 'python', 'dependencies'],
  },
  
  'cargo': {
    name: 'cargo',
    displayName: 'Cargo',
    type: 'tool',
    officialDocs: 'https://doc.rust-lang.org/cargo/',
    githubRepo: 'https://github.com/rust-lang/cargo',
    usagePatterns: ['cargo build', 'cargo run', 'Cargo.toml'],
    searchKeywords: ['package manager', 'rust', 'dependencies', 'build tool'],
  },
  
  'make': {
    name: 'make',
    displayName: 'Make',
    type: 'tool',
    officialDocs: 'https://www.gnu.org/software/make/manual/',
    usagePatterns: ['Makefile', 'make build', 'make test'],
    searchKeywords: ['build tool', 'automation', 'compilation'],
  },
  
  // ============================================================================
  // DATABASES
  // ============================================================================
  
  'postgresql': {
    name: 'postgresql',
    displayName: 'PostgreSQL',
    type: 'database',
    officialDocs: 'https://www.postgresql.org/docs/',
    githubRepo: 'https://github.com/postgres/postgres',
    usagePatterns: ['postgres', 'psql', 'pg_', 'SELECT', 'INSERT INTO'],
    searchKeywords: ['sql', 'relational database', 'queries', 'transactions'],
  },
  
  'mysql': {
    name: 'mysql',
    displayName: 'MySQL',
    type: 'database',
    officialDocs: 'https://dev.mysql.com/doc/',
    githubRepo: 'https://github.com/mysql/mysql-server',
    usagePatterns: ['mysql', 'SELECT', 'INSERT', 'UPDATE', 'DELETE'],
    searchKeywords: ['sql', 'relational database', 'queries'],
  },
  
  'mongodb': {
    name: 'mongodb',
    displayName: 'MongoDB',
    type: 'database',
    officialDocs: 'https://www.mongodb.com/docs/',
    githubRepo: 'https://github.com/mongodb/mongo',
    usagePatterns: ['mongo', 'db.collection', 'find()', 'insertOne', 'aggregate'],
    searchKeywords: ['nosql', 'document database', 'queries', 'collections'],
  },
  
  'redis': {
    name: 'redis',
    displayName: 'Redis',
    type: 'database',
    officialDocs: 'https://redis.io/docs/',
    githubRepo: 'https://github.com/redis/redis',
    usagePatterns: ['redis', 'SET', 'GET', 'HSET', 'LPUSH'],
    searchKeywords: ['cache', 'key-value store', 'in-memory database'],
  },
  
  'sqlite': {
    name: 'sqlite',
    displayName: 'SQLite',
    type: 'database',
    officialDocs: 'https://www.sqlite.org/docs.html',
    usagePatterns: ['sqlite', 'sqlite3', '.db file'],
    searchKeywords: ['sql', 'embedded database', 'file-based'],
  },
  
  'elasticsearch': {
    name: 'elasticsearch',
    displayName: 'Elasticsearch',
    type: 'database',
    officialDocs: 'https://www.elastic.co/guide/en/elasticsearch/reference/current/index.html',
    githubRepo: 'https://github.com/elastic/elasticsearch',
    usagePatterns: ['elasticsearch', 'index', 'search', 'query'],
    searchKeywords: ['search engine', 'full-text search', 'analytics'],
  },
};

/**
 * Helper functions for library database access
 */

/**
 * Get library metadata by name (case-insensitive)
 */
export function getLibraryMetadata(libraryName: string): LibraryMetadata | undefined {
  return LIBRARY_DATABASE[libraryName.toLowerCase()];
}

/**
 * Get all libraries of a specific type
 */
export function getLibrariesByType(type: LibraryType): LibraryMetadata[] {
  return Object.values(LIBRARY_DATABASE).filter(lib => lib.type === type);
}

/**
 * Search libraries by keyword
 */
export function searchLibraries(keyword: string): LibraryMetadata[] {
  const lowerKeyword = keyword.toLowerCase();
  return Object.values(LIBRARY_DATABASE).filter(lib => 
    lib.name.includes(lowerKeyword) ||
    lib.displayName.toLowerCase().includes(lowerKeyword) ||
    lib.searchKeywords.some(k => k.includes(lowerKeyword))
  );
}

/**
 * Get all library names (for quick lookup)
 */
export function getAllLibraryNames(): string[] {
  return Object.keys(LIBRARY_DATABASE);
}

/**
 * Check if a library is in the database
 */
export function isKnownLibrary(libraryName: string): boolean {
  return libraryName.toLowerCase() in LIBRARY_DATABASE;
}

/**
 * Get documentation URL for a library
 */
export function getDocumentationUrl(libraryName: string): string | undefined {
  const metadata = getLibraryMetadata(libraryName);
  return metadata?.officialDocs;
}

/**
 * Get GitHub repository URL for a library
 */
export function getGitHubUrl(libraryName: string): string | undefined {
  const metadata = getLibraryMetadata(libraryName);
  return metadata?.githubRepo;
}

/**
 * Build a search query for a library with context
 */
export function buildSearchQuery(libraryName: string, context?: string): string {
  const metadata = getLibraryMetadata(libraryName);
  if (!metadata) {
    return libraryName;
  }
  
  // Start with library name
  let query = metadata.displayName;
  
  // Add relevant keywords if no context provided
  if (!context && metadata.searchKeywords.length > 0) {
    query += ' ' + metadata.searchKeywords.slice(0, 2).join(' ');
  }
  
  // Add context if provided
  if (context) {
    query += ' ' + context;
  }
  
  return query;
}
