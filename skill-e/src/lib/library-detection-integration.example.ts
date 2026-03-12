/**
 * Library Detection Integration Example
 *
 * Demonstrates how to use the library detector with the library database
 * to detect libraries and fetch their documentation URLs.
 *
 * This is an example file showing the integration between:
 * - library-detector.ts (detects libraries from code/speech)
 * - library-database.ts (provides metadata and documentation URLs)
 */

import { libraryDetector } from './library-detector'
import {
  getLibraryMetadata,
  getDocumentationUrl,
  buildSearchQuery,
  isKnownLibrary,
} from './library-database'

/**
 * Example 1: Detect libraries from code and get documentation URLs
 */
export function detectAndGetDocs(code: string) {
  // Step 1: Detect libraries from code
  const detectedLibraries = libraryDetector.detectFromCode(code)

  // Step 2: Filter by confidence (only keep high-confidence detections)
  const highConfidence = libraryDetector.filterByConfidence(detectedLibraries, 0.7)

  // Step 3: Get documentation URLs for detected libraries
  const librariesWithDocs = highConfidence.map(detected => {
    const metadata = getLibraryMetadata(detected.name)
    const docUrl = getDocumentationUrl(detected.name)

    return {
      name: detected.name,
      displayName: metadata?.displayName || detected.name,
      type: detected.type,
      confidence: detected.confidence,
      context: detected.context,
      documentationUrl: docUrl,
      isKnown: isKnownLibrary(detected.name),
      searchQuery: buildSearchQuery(detected.name, detected.usageHint),
    }
  })

  return librariesWithDocs
}

/**
 * Example 2: Detect from both code and transcription
 */
export function detectFromDemonstration(code: string, transcription: string) {
  // Detect from both sources
  const allDetections = libraryDetector.detectAll(code, transcription)

  // Sort by confidence
  const sorted = libraryDetector.sortByConfidence(allDetections)

  // Enrich with metadata from database
  return sorted.map(detected => {
    const metadata = getLibraryMetadata(detected.name)

    return {
      ...detected,
      metadata: metadata
        ? {
            displayName: metadata.displayName,
            officialDocs: metadata.officialDocs,
            githubRepo: metadata.githubRepo,
            searchKeywords: metadata.searchKeywords,
          }
        : null,
    }
  })
}

/**
 * Example 3: Get documentation references for skill generation
 */
export function getDocumentationReferences(code: string, transcription: string) {
  const detections = libraryDetector.detectAll(code, transcription)
  const filtered = libraryDetector.filterByConfidence(detections, 0.6)

  // Build documentation references
  const references = filtered
    .filter(d => isKnownLibrary(d.name))
    .map(detected => {
      const metadata = getLibraryMetadata(detected.name)
      if (!metadata) return null

      return {
        library: metadata.displayName,
        url: metadata.officialDocs,
        githubUrl: metadata.githubRepo,
        searchQuery: buildSearchQuery(detected.name, detected.context),
        relevance: detected.confidence,
        usageContext: detected.context,
      }
    })
    .filter(Boolean)

  return references
}

/**
 * Example usage in a real scenario
 */
export function exampleUsage() {
  const sampleCode = `
import pandas as pd
import numpy as np
from flask import Flask, render_template

app = Flask(__name__)

@app.route('/')
def index():
    df = pd.read_csv('data.csv')
    data = df.to_dict()
    return render_template('index.html', data=data)
  `

  const sampleTranscription = "I'm using pandas to read the CSV file and Flask to create a web API"

  // Detect and enrich with documentation
  const results = detectFromDemonstration(sampleCode, sampleTranscription)

  console.log('Detected Libraries:')
  results.forEach(result => {
    console.log(`- ${result.name} (${result.type})`)
    console.log(`  Confidence: ${(result.confidence * 100).toFixed(0)}%`)
    console.log(`  Context: ${result.context}`)
    if (result.metadata) {
      console.log(`  Docs: ${result.metadata.officialDocs}`)
      if (result.metadata.githubRepo) {
        console.log(`  GitHub: ${result.metadata.githubRepo}`)
      }
    }
    console.log('')
  })

  // Get documentation references for skill generation
  const docRefs = getDocumentationReferences(sampleCode, sampleTranscription)

  console.log('\nDocumentation References for SKILL.md:')
  docRefs.forEach(ref => {
    if (ref) {
      console.log(`### ${ref.library}`)
      console.log(`[Official Documentation](${ref.url})`)
      if (ref.githubUrl) {
        console.log(`[GitHub Repository](${ref.githubUrl})`)
      }
      console.log(`Search Query: "${ref.searchQuery}"`)
      console.log('')
    }
  })
}

// Uncomment to run the example:
// exampleUsage();
