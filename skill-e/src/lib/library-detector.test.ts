/**
 * Library Detector Tests
 * 
 * Tests library detection from code and transcription text.
 * Validates pattern matching, confidence scoring, and deduplication.
 */

import { describe, it, expect } from 'vitest';
import { LibraryDetector } from './library-detector';
import type { DetectedLibrary } from '../types/context-search';

describe('LibraryDetector', () => {
  const detector = new LibraryDetector();
  
  describe('detectFromCode', () => {
    it('should detect Python imports', () => {
      const code = `
import pandas as pd
import numpy as np
from sklearn import datasets
      `;
      
      const detected = detector.detectFromCode(code);
      
      expect(detected.length).toBeGreaterThan(0);
      expect(detected.some(d => d.name === 'pandas')).toBe(true);
      expect(detected.some(d => d.name === 'numpy')).toBe(true);
      expect(detected.some(d => d.name === 'sklearn')).toBe(true);
    });
    
    it('should detect JavaScript imports', () => {
      const code = `
import React from 'react';
import axios from 'axios';
const express = require('express');
      `;
      
      const detected = detector.detectFromCode(code);
      
      expect(detected.some(d => d.name === 'react')).toBe(true);
      expect(detected.some(d => d.name === 'axios')).toBe(true);
      expect(detected.some(d => d.name === 'express')).toBe(true);
    });
    
    it('should detect libraries from usage patterns', () => {
      const code = `
df = pd.DataFrame({'col': [1, 2, 3]})
df.to_csv('output.csv')
arr = np.array([1, 2, 3])
      `;
      
      const detected = detector.detectFromCode(code);
      
      expect(detected.some(d => d.name === 'pandas')).toBe(true);
      expect(detected.some(d => d.name === 'numpy')).toBe(true);
      
      const pandas = detected.find(d => d.name === 'pandas');
      expect(pandas?.confidence).toBeGreaterThan(0.5);
    });
    
    it('should detect React hooks usage', () => {
      const code = `
function MyComponent() {
  const [state, setState] = useState(0);
  useEffect(() => {
    console.log('mounted');
  }, []);
}
      `;
      
      const detected = detector.detectFromCode(code);
      
      expect(detected.some(d => d.name === 'react')).toBe(true);
    });
    
    it('should detect database commands', () => {
      const code = `
SELECT * FROM users WHERE id = 1;
db.collection.find({ status: 'active' });
      `;
      
      const detected = detector.detectFromCode(code);
      
      expect(detected.some(d => d.type === 'database')).toBe(true);
    });
    
    it('should detect tool commands', () => {
      const code = `
git clone https://github.com/user/repo
docker build -t myapp .
npm install express
      `;
      
      const detected = detector.detectFromCode(code);
      
      expect(detected.some(d => d.name === 'git')).toBe(true);
      expect(detected.some(d => d.name === 'docker')).toBe(true);
      expect(detected.some(d => d.name === 'npm')).toBe(true);
    });
    
    it('should assign higher confidence to known libraries', () => {
      const code = `
import pandas as pd
import unknownlib
      `;
      
      const detected = detector.detectFromCode(code);
      
      const pandas = detected.find(d => d.name === 'pandas');
      const unknown = detected.find(d => d.name === 'unknownlib');
      
      expect(pandas?.confidence).toBeGreaterThan(unknown?.confidence || 0);
    });
    
    it('should capture context around detection', () => {
      const code = `
import pandas as pd
df = pd.DataFrame({'col': [1, 2, 3]})
      `;
      
      const detected = detector.detectFromCode(code);
      const pandas = detected.find(d => d.name === 'pandas');
      
      expect(pandas?.context).toBeTruthy();
      expect(pandas?.context.length).toBeGreaterThan(0);
    });
  });
  
  describe('detectFromTranscription', () => {
    it('should detect libraries from English speech patterns', () => {
      const text = "I'm using the pandas library to read CSV files";
      
      const detected = detector.detectFromTranscription(text);
      
      expect(detected.some(d => d.name === 'pandas')).toBe(true);
    });
    
    it('should detect libraries from Portuguese speech patterns', () => {
      const text = "Vou usar o react para criar a interface";
      
      const detected = detector.detectFromTranscription(text);
      
      // Should detect 'react' (lowercase in known libraries)
      expect(detected.some(d => d.name === 'react')).toBe(true);
    });
    
    it('should detect API mentions', () => {
      const text = "We'll use the axios API to make HTTP requests";
      
      const detected = detector.detectFromTranscription(text);
      
      // Should detect 'axios' which is a known library
      expect(detected.some(d => d.name === 'axios')).toBe(true);
    });
    
    it('should detect direct library mentions', () => {
      const text = "First, install numpy and matplotlib for data visualization";
      
      const detected = detector.detectFromTranscription(text);
      
      expect(detected.some(d => d.name === 'numpy')).toBe(true);
      expect(detected.some(d => d.name === 'matplotlib')).toBe(true);
    });
    
    it('should assign appropriate confidence scores', () => {
      const text = "Using pandas to analyze data";
      
      const detected = detector.detectFromTranscription(text);
      const pandas = detected.find(d => d.name === 'pandas');
      
      expect(pandas?.confidence).toBeGreaterThan(0.5);
      expect(pandas?.confidence).toBeLessThanOrEqual(1.0);
    });
    
    it('should capture speech context', () => {
      const text = "I'm using the pandas library to read CSV files and process data";
      
      const detected = detector.detectFromTranscription(text);
      const pandas = detected.find(d => d.name === 'pandas');
      
      expect(pandas?.context).toContain('pandas');
    });
    
    it('should handle case-insensitive matching', () => {
      const text = "Using PANDAS and NumPy for data analysis";
      
      const detected = detector.detectFromTranscription(text);
      
      expect(detected.some(d => d.name.toLowerCase() === 'pandas')).toBe(true);
      expect(detected.some(d => d.name.toLowerCase() === 'numpy')).toBe(true);
    });
  });
  
  describe('detectAll', () => {
    it('should combine code and transcription detections', () => {
      const code = `
import pandas as pd
df = pd.read_csv('data.csv')
      `;
      const transcription = "I'm using react to build the frontend";
      
      const detected = detector.detectAll(code, transcription);
      
      expect(detected.some(d => d.name === 'pandas')).toBe(true);
      expect(detected.some(d => d.name === 'react')).toBe(true);
    });
    
    it('should merge duplicate detections', () => {
      const code = `
import pandas as pd
df = pd.DataFrame()
      `;
      const transcription = "Using pandas to analyze the data";
      
      const detected = detector.detectAll(code, transcription);
      
      // Should only have one pandas detection (merged)
      const pandasDetections = detected.filter(d => d.name === 'pandas');
      expect(pandasDetections.length).toBe(1);
    });
    
    it('should keep highest confidence when merging', () => {
      const code = `
import pandas as pd
df.to_csv('output.csv')
      `;
      const transcription = "maybe using pandas";
      
      const detected = detector.detectAll(code, transcription);
      const pandas = detected.find(d => d.name === 'pandas');
      
      // Should keep the higher confidence from code detection
      expect(pandas?.confidence).toBeGreaterThan(0.7);
    });
  });
  
  describe('filterByConfidence', () => {
    it('should filter out low confidence detections', () => {
      const detections: DetectedLibrary[] = [
        { name: 'pandas', type: 'python', confidence: 0.9, context: 'import pandas' },
        { name: 'unknown', type: 'python', confidence: 0.3, context: 'import unknown' },
        { name: 'react', type: 'javascript', confidence: 0.8, context: 'import react' },
      ];
      
      const filtered = detector.filterByConfidence(detections, 0.5);
      
      expect(filtered.length).toBe(2);
      expect(filtered.some(d => d.name === 'pandas')).toBe(true);
      expect(filtered.some(d => d.name === 'react')).toBe(true);
      expect(filtered.some(d => d.name === 'unknown')).toBe(false);
    });
    
    it('should use default threshold of 0.5', () => {
      const detections: DetectedLibrary[] = [
        { name: 'high', type: 'python', confidence: 0.6, context: 'test' },
        { name: 'low', type: 'python', confidence: 0.4, context: 'test' },
      ];
      
      const filtered = detector.filterByConfidence(detections);
      
      expect(filtered.length).toBe(1);
      expect(filtered[0].name).toBe('high');
    });
  });
  
  describe('sortByConfidence', () => {
    it('should sort detections by confidence descending', () => {
      const detections: DetectedLibrary[] = [
        { name: 'low', type: 'python', confidence: 0.5, context: 'test' },
        { name: 'high', type: 'python', confidence: 0.9, context: 'test' },
        { name: 'medium', type: 'python', confidence: 0.7, context: 'test' },
      ];
      
      const sorted = detector.sortByConfidence(detections);
      
      expect(sorted[0].name).toBe('high');
      expect(sorted[1].name).toBe('medium');
      expect(sorted[2].name).toBe('low');
    });
    
    it('should not mutate original array', () => {
      const detections: DetectedLibrary[] = [
        { name: 'a', type: 'python', confidence: 0.5, context: 'test' },
        { name: 'b', type: 'python', confidence: 0.9, context: 'test' },
      ];
      
      const sorted = detector.sortByConfidence(detections);
      
      expect(detections[0].name).toBe('a');
      expect(sorted[0].name).toBe('b');
    });
  });
  
  describe('edge cases', () => {
    it('should handle empty code', () => {
      const detected = detector.detectFromCode('');
      expect(detected).toEqual([]);
    });
    
    it('should handle empty transcription', () => {
      const detected = detector.detectFromTranscription('');
      expect(detected).toEqual([]);
    });
    
    it('should handle code with no libraries', () => {
      const code = `
function add(a, b) {
  return a + b;
}
      `;
      
      const detected = detector.detectFromCode(code);
      expect(detected.length).toBe(0);
    });
    
    it('should handle transcription with no library mentions', () => {
      const text = "This is just a regular sentence with no technical terms";
      
      const detected = detector.detectFromTranscription(text);
      expect(detected.length).toBe(0);
    });
    
    it('should avoid false positives from common words', () => {
      const text = "I need to make a request to the server";
      
      const detected = detector.detectFromTranscription(text);
      
      // "request" shouldn't trigger "requests" library detection
      // unless it's in a clear library context
      const requests = detected.find(d => d.name === 'requests');
      if (requests) {
        expect(requests.confidence).toBeLessThan(0.7);
      }
    });
    
    it('should handle multiple occurrences of same library', () => {
      const code = `
import pandas as pd
df = pd.DataFrame()
df.to_csv('out.csv')
pd.read_csv('in.csv')
      `;
      
      const detected = detector.detectFromCode(code);
      const pandasDetections = detected.filter(d => d.name === 'pandas');
      
      // Should merge into single detection
      expect(pandasDetections.length).toBe(1);
      // Should have high confidence due to multiple patterns
      expect(pandasDetections[0].confidence).toBeGreaterThan(0.7);
    });
  });
  
  describe('library type classification', () => {
    it('should correctly classify Python libraries', () => {
      const code = 'import pandas as pd';
      const detected = detector.detectFromCode(code);
      const pandas = detected.find(d => d.name === 'pandas');
      
      expect(pandas?.type).toBe('python');
    });
    
    it('should correctly classify JavaScript libraries', () => {
      const code = "import React from 'react'";
      const detected = detector.detectFromCode(code);
      const react = detected.find(d => d.name === 'react');
      
      expect(react?.type).toBe('javascript');
    });
    
    it('should correctly classify tools', () => {
      const code = 'git clone https://github.com/user/repo';
      const detected = detector.detectFromCode(code);
      const git = detected.find(d => d.name === 'git');
      
      expect(git?.type).toBe('tool');
    });
    
    it('should correctly classify databases', () => {
      const code = 'SELECT * FROM users';
      const detected = detector.detectFromCode(code);
      
      expect(detected.some(d => d.type === 'database')).toBe(true);
    });
  });
});
