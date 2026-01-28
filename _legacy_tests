/**
 * Documentation Extractor Integration Example
 * 
 * Demonstrates how to use the DocExtractor with LibraryDetector
 * to automatically fetch documentation for detected libraries.
 * 
 * @module lib/doc-extractor-integration.example
 */

import { LibraryDetector } from './library-detector';
import { DocExtractor } from './doc-extractor';
import { Context7Client } from './context-search';
import type { DetectedLibrary, DocReference } from '../types/context-search';

/**
 * Example 1: Basic GitHub README fetching
 * 
 * Detects libraries from code and fetches their GitHub READMEs
 */
async function example1_basicGitHubFetch() {
  console.log('=== Example 1: Basic GitHub README Fetching ===\n');

  // Sample code with library imports
  const code = `
import pandas as pd
import numpy as np
from flask import Flask, render_template

app = Flask(__name__)

@app.route('/')
def index():
    df = pd.read_csv('data.csv')
    return render_template('index.html', data=df.to_dict())
`;

  // Detect libraries
  const detector = new LibraryDetector();
  const libraries = detector.detectFromCode(code);
  
  console.log('Detected libraries:', libraries.map(l => l.name).join(', '));

  // Create doc extractor (optionally with GitHub token for higher rate limits)
  const extractor = new DocExtractor({
    githubToken: process.env.GITHUB_TOKEN, // Optional
    maxReadmeLength: 5000,
  });

  // Fetch documentation for each library
  for (const library of libraries) {
    console.log(`\nFetching docs for ${library.name}...`);
    
    const docs = await extractor.searchGitHub(library);
    
    if (docs.length > 0) {
      const doc = docs[0];
      console.log(`  Title: ${doc.title}`);
      console.log(`  URL: ${doc.url}`);
      console.log(`  Snippet length: ${doc.snippet.length} chars`);
      if (doc.codeExample) {
        console.log(`  Has code example: Yes`);
      }
    } else {
      console.log(`  No documentation found`);
    }
  }
}

/**
 * Example 2: Fallback to multiple sources
 * 
 * Tries GitHub first, then falls back to official docs
 */
async function example2_multiSourceFallback() {
  console.log('\n=== Example 2: Multi-Source Fallback ===\n');

  const library: DetectedLibrary = {
    name: 'react',
    type: 'javascript',
    confidence: 0.9,
    context: 'import React from "react"',
    usageHint: 'component state management',
  };

  const extractor = new DocExtractor();

  // Try all sources (GitHub + official docs)
  console.log(`Searching all sources for ${library.name}...`);
  const docs = await extractor.searchAll(library);

  console.log(`Found ${docs.length} documentation reference(s)`);
  
  for (const doc of docs) {
    console.log(`\n  Source: ${doc.source}`);
    console.log(`  Title: ${doc.title}`);
    console.log(`  URL: ${doc.url}`);
    console.log(`  Relevance: ${doc.relevance}`);
  }
}

/**
 * Example 3: Batch processing multiple libraries
 * 
 * Efficiently fetches documentation for multiple libraries
 */
async function example3_batchProcessing() {
  console.log('\n=== Example 3: Batch Processing ===\n');

  const transcription = `
    I'm going to use pandas to load the CSV file,
    then use matplotlib to create a visualization,
    and finally use requests to send the data to an API.
  `;

  // Detect libraries from speech
  const detector = new LibraryDetector();
  const libraries = detector.detectFromTranscription(transcription);

  console.log(`Detected ${libraries.length} libraries from transcription`);

  // Batch fetch documentation
  const extractor = new DocExtractor();
  const docsMap = await extractor.searchMultiple(libraries);

  // Display results
  for (const [libraryName, docs] of docsMap.entries()) {
    console.log(`\n${libraryName}:`);
    if (docs.length > 0) {
      console.log(`  ✓ Found ${docs.length} reference(s)`);
      console.log(`  URL: ${docs[0].url}`);
    } else {
      console.log(`  ✗ No documentation found`);
    }
  }
}

/**
 * Example 4: Context7 + GitHub fallback
 * 
 * Uses Context7 MCP first, falls back to GitHub if unavailable
 */
async function example4_context7WithFallback() {
  console.log('\n=== Example 4: Context7 + GitHub Fallback ===\n');

  const library: DetectedLibrary = {
    name: 'pandas',
    type: 'python',
    confidence: 0.95,
    context: 'df = pd.read_csv("data.csv")',
    usageHint: 'reading CSV files',
  };

  // Try Context7 first
  const context7ApiKey = process.env.CONTEXT7_API_KEY;
  let docs: DocReference[] = [];

  if (context7ApiKey) {
    console.log('Trying Context7 MCP...');
    try {
      const context7 = new Context7Client({ apiKey: context7ApiKey });
      docs = await context7.searchDocumentation(library);
      console.log(`✓ Context7 returned ${docs.length} reference(s)`);
    } catch (error) {
      console.log(`✗ Context7 failed: ${error}`);
    }
  }

  // Fallback to GitHub if Context7 didn't work
  if (docs.length === 0) {
    console.log('Falling back to GitHub...');
    const extractor = new DocExtractor();
    docs = await extractor.searchGitHub(library);
    console.log(`✓ GitHub returned ${docs.length} reference(s)`);
  }

  // Display results
  if (docs.length > 0) {
    const doc = docs[0];
    console.log(`\nFinal documentation:`);
    console.log(`  Source: ${doc.source}`);
    console.log(`  Title: ${doc.title}`);
    console.log(`  URL: ${doc.url}`);
    console.log(`  Snippet preview: ${doc.snippet.slice(0, 200)}...`);
  }
}

/**
 * Example 5: Extracting specific sections
 * 
 * Shows how the extractor focuses on relevant sections
 */
async function example5_sectionExtraction() {
  console.log('\n=== Example 5: Section Extraction ===\n');

  // Simulate a README with multiple sections
  const mockReadme = `
# My Library

Some introduction text.

## Installation

\`\`\`bash
npm install my-library
\`\`\`

## Usage

Here's how to use it:

\`\`\`javascript
import lib from 'my-library';
lib.doSomething();
\`\`\`

## Advanced Topics

Complex stuff here...

## API Reference

Detailed API docs...
`;

  const extractor = new DocExtractor();
  
  // Access private method for demonstration (in real code, this happens internally)
  const sections = (extractor as any).extractRelevantSections(mockReadme);
  
  console.log(`Extracted ${sections.length} relevant section(s):`);
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    const firstLine = section.split('\n')[0];
    console.log(`\n  Section ${i + 1}: ${firstLine}`);
    console.log(`  Length: ${section.length} chars`);
  }
}

/**
 * Example 6: Complete workflow
 * 
 * Full workflow from code detection to documentation references
 */
async function example6_completeWorkflow() {
  console.log('\n=== Example 6: Complete Workflow ===\n');

  // Simulated recording data
  const ocrText = `
import React, { useState } from 'react';
import axios from 'axios';

function App() {
  const [data, setData] = useState(null);
  
  const fetchData = async () => {
    const response = await axios.get('/api/data');
    setData(response.data);
  };
  
  return <div>...</div>;
}
`;

  const transcription = `
    First, I'm importing React and the useState hook.
    Then I'm using axios to fetch data from the API.
    The component will display the data once it's loaded.
  `;

  console.log('Step 1: Detect libraries from code and speech');
  const detector = new LibraryDetector();
  const libraries = detector.detectAll(ocrText, transcription);
  
  console.log(`  Found ${libraries.length} libraries:`);
  libraries.forEach(lib => {
    console.log(`    - ${lib.name} (${lib.type}, confidence: ${lib.confidence.toFixed(2)})`);
  });

  console.log('\nStep 2: Fetch documentation');
  const extractor = new DocExtractor();
  const docsMap = await extractor.searchMultiple(libraries);

  console.log('\nStep 3: Prepare references for SKILL.md');
  const references: string[] = [];
  
  for (const [libraryName, docs] of docsMap.entries()) {
    if (docs.length > 0) {
      const doc = docs[0];
      references.push(`
### ${doc.title}

${doc.snippet.slice(0, 300)}...

${doc.codeExample ? '```\n' + doc.codeExample + '\n```\n' : ''}

[Full Documentation](${doc.url})
`);
    }
  }

  console.log('\nGenerated references section:');
  console.log('```markdown');
  console.log('## Technical References\n');
  console.log(references.join('\n---\n'));
  console.log('```');
}

/**
 * Run all examples
 */
async function runExamples() {
  try {
    // Note: These examples make real API calls
    // Comment out examples that require API keys you don't have
    
    // await example1_basicGitHubFetch();
    // await example2_multiSourceFallback();
    // await example3_batchProcessing();
    // await example4_context7WithFallback();
    await example5_sectionExtraction();
    // await example6_completeWorkflow();
    
    console.log('\n✓ Examples completed');
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Uncomment to run examples
// runExamples();

export {
  example1_basicGitHubFetch,
  example2_multiSourceFallback,
  example3_batchProcessing,
  example4_context7WithFallback,
  example5_sectionExtraction,
  example6_completeWorkflow,
};
