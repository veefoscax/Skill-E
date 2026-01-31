/**
 * Processing Pipeline Integration Tests
 * 
 * Comprehensive tests for the complete processing pipeline including:
 * - Timeline building with sample data
 * - Step detection accuracy
 * - Context generation output format
 * - Processing time performance
 * 
 * Requirements: All ACs (AC1-AC5), NFR-5.1
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  processSession,
  loadSession,
  buildTimeline,
  detectSteps,
  generateLLMContext,
  detectVoicePauses,
  detectWindowChanges,
} from './processing';
import type { CaptureSession } from '../types/capture';
import type { TranscriptionResult } from './whisper';
import type {
  ProcessedSession,
  TimelineEvent,
  LLMContext,
} from '../types/processing';

describe('Processing Pipeline Integration Tests', () => {
  let mockCaptureSession: CaptureSession;
  let mockTranscription: TranscriptionResult;
  let mockAnnotations: any;

  beforeEach(() => {
    const now = Date.now();

    // Create realistic mock capture session
    mockCaptureSession = {
      id: 'integration-test-session',
      directory: '/test/captures',
      startTime: now,
      endTime: now + 120000, // 2 minutes
      intervalMs: 1000,
      frames: [
        {
          id: 'frame-1',
          timestamp: now,
          imagePath: '/test/captures/frame-1.png',
          activeWindow: {
            title: 'Google Chrome - Login Page',
            processName: 'chrome.exe',
            bounds: { x: 0, y: 0, width: 1920, height: 1080 },
          },
        },
        {
          id: 'frame-2',
          timestamp: now + 5000,
          imagePath: '/test/captures/frame-2.png',
          activeWindow: {
            title: 'Google Chrome - Login Page',
            processName: 'chrome.exe',
            bounds: { x: 0, y: 0, width: 1920, height: 1080 },
          },
        },
        {
          id: 'frame-3',
          timestamp: now + 15000,
          imagePath: '/test/captures/frame-3.png',
          activeWindow: {
            title: 'Google Chrome - Dashboard',
            processName: 'chrome.exe',
            bounds: { x: 0, y: 0, width: 1920, height: 1080 },
          },
        },
        {
          id: 'frame-4',
          timestamp: now + 25000,
          imagePath: '/test/captures/frame-4.png',
          activeWindow: {
            title: 'Google Chrome - Dashboard',
            processName: 'chrome.exe',
            bounds: { x: 0, y: 0, width: 1920, height: 1080 },
          },
        },
      ],
    };

    // Create realistic mock transcription
    mockTranscription = {
      text: 'First, I will open the login page and enter my credentials. Then I will click the login button. After logging in, I can see the dashboard.',
      segments: [
        {
          id: 0,
          start: 0,
          end: 3,
          text: 'First, I will open the login page and enter my credentials.',
        },
        {
          id: 1,
          start: 6, // 3 second pause
          end: 8,
          text: 'Then I will click the login button.',
        },
        {
          id: 2,
          start: 14, // 6 second pause
          end: 17,
          text: 'After logging in, I can see the dashboard.',
        },
      ],
      language: 'en',
      duration: 17,
    };

    // Create realistic mock annotations
    mockAnnotations = {
      clicks: [
        {
          id: 'click-1',
          number: 1,
          position: { x: 500, y: 300 },
          color: 'COLOR_1' as const,
          timestamp: now + 4000,
          fadeState: 'visible' as const,
        },
        {
          id: 'click-2',
          number: 2,
          position: { x: 600, y: 400 },
          color: 'COLOR_2' as const,
          timestamp: now + 7000,
          fadeState: 'visible' as const,
        },
      ],
      drawings: [
        {
          id: 'drawing-1',
          type: 'arrow' as const,
          startPoint: { x: 100, y: 100 },
          endPoint: { x: 200, y: 200 },
          color: 'COLOR_1',
          timestamp: now + 3000,
          isPinned: true,
          fadeState: 'visible' as const,
        },
      ],
      selectedElements: [
        {
          cssSelector: '#email-input',
          xpath: '//*[@id="email-input"]',
          tagName: 'input',
          textContent: '',
          boundingBox: { x: 500, y: 300, width: 200, height: 40 },
          timestamp: now + 2000,
        },
      ],
      keyboardInputs: [
        {
          modifiers: { shift: false, ctrl: false, alt: false, meta: false },
          currentText: 'user@example.com',
          isPasswordField: false,
          displayPosition: 'bottom-left' as const,
          isVisible: true,
        },
      ],
    };
  });

  describe('AC1: Data Aggregation', () => {
    it('should load all frames from session', async () => {
      const sessionData = await loadSession(
        'test-session',
        mockCaptureSession,
        mockTranscription,
        mockAnnotations
      );

      expect(sessionData.captureSession.frames).toHaveLength(4);
      expect(sessionData.captureSession.frames[0].id).toBe('frame-1');
    });

    it('should load transcription with timestamps', async () => {
      const sessionData = await loadSession(
        'test-session',
        mockCaptureSession,
        mockTranscription,
        mockAnnotations
      );

      expect(sessionData.transcription).toBeDefined();
      expect(sessionData.transcription?.segments).toHaveLength(3);
      expect(sessionData.transcription?.segments[0].start).toBe(0);
    });

    it('should load all annotations', async () => {
      const sessionData = await loadSession(
        'test-session',
        mockCaptureSession,
        mockTranscription,
        mockAnnotations
      );

      expect(sessionData.clicks).toHaveLength(2);
      expect(sessionData.drawings).toHaveLength(1);
      expect(sessionData.selectedElements).toHaveLength(1);
      expect(sessionData.keyboardInputs).toHaveLength(1);
    });

    it('should handle missing transcription gracefully', async () => {
      const sessionData = await loadSession(
        'test-session',
        mockCaptureSession,
        null,
        mockAnnotations
      );

      expect(sessionData.transcription).toBeNull();
      expect(sessionData.captureSession.frames).toHaveLength(4);
    });
  });

  describe('AC2: Timeline Correlation', () => {
    it('should match transcript segments to frames', async () => {
      const sessionData = await loadSession(
        'test-session',
        mockCaptureSession,
        mockTranscription,
        mockAnnotations
      );

      const timeline = buildTimeline(sessionData);

      const voiceEvents = timeline.filter(e => e.type === 'voice');
      const screenshotEvents = timeline.filter(e => e.type === 'screenshot');

      expect(voiceEvents).toHaveLength(3);
      expect(screenshotEvents).toHaveLength(4);

      // Voice events should be correlated with frames by timestamp
      const firstVoice = voiceEvents[0];
      const firstFrame = screenshotEvents[0];
      expect(firstVoice.timestamp).toBeGreaterThanOrEqual(firstFrame.timestamp);
    });

    it('should match annotations to frames', async () => {
      const sessionData = await loadSession(
        'test-session',
        mockCaptureSession,
        mockTranscription,
        mockAnnotations
      );

      const timeline = buildTimeline(sessionData);

      const clickEvents = timeline.filter(e => e.type === 'click');
      const drawingEvents = timeline.filter(e => e.type === 'drawing');
      const elementEvents = timeline.filter(e => e.type === 'element_selection');

      expect(clickEvents).toHaveLength(2);
      expect(drawingEvents).toHaveLength(1);
      expect(elementEvents).toHaveLength(1);
    });

    it('should create unified timeline sorted chronologically', async () => {
      const sessionData = await loadSession(
        'test-session',
        mockCaptureSession,
        mockTranscription,
        mockAnnotations
      );

      const timeline = buildTimeline(sessionData);

      // Verify timeline is sorted
      for (let i = 0; i < timeline.length - 1; i++) {
        expect(timeline[i].timestamp).toBeLessThanOrEqual(timeline[i + 1].timestamp);
      }

      // Verify all event types are present
      const eventTypes = new Set(timeline.map(e => e.type));
      expect(eventTypes.has('screenshot')).toBe(true);
      expect(eventTypes.has('voice')).toBe(true);
      expect(eventTypes.has('click')).toBe(true);
    });
  });

  describe('AC3: Step Detection', () => {
    it('should group frames into logical steps', async () => {
      const sessionData = await loadSession(
        'test-session',
        mockCaptureSession,
        mockTranscription,
        mockAnnotations
      );

      const timeline = buildTimeline(sessionData);

      // Add pause events
      const pauses = detectVoicePauses(
        mockTranscription.segments,
        mockCaptureSession.startTime
      );
      timeline.push(...pauses);
      timeline.sort((a, b) => a.timestamp - b.timestamp);

      // Add window changes
      const windowChanges = detectWindowChanges(mockCaptureSession.frames);
      timeline.push(...windowChanges);
      timeline.sort((a, b) => a.timestamp - b.timestamp);

      const steps = detectSteps(timeline, { ...sessionData, allVariables: [], allConditionals: [] });

      // Should detect multiple steps based on pauses and window changes
      expect(steps.length).toBeGreaterThan(1);
      expect(steps[0].stepNumber).toBe(1);
    });

    it('should use voice pauses > 2s as step boundaries', async () => {
      const sessionData = await loadSession(
        'test-session',
        mockCaptureSession,
        mockTranscription,
        mockAnnotations
      );

      const pauses = detectVoicePauses(
        mockTranscription.segments,
        mockCaptureSession.startTime,
        2000
      );

      // Should detect 2 pauses (3s and 6s)
      expect(pauses.length).toBeGreaterThanOrEqual(2);
      expect(pauses[0].duration).toBeGreaterThanOrEqual(2000);
    });

    it('should use window focus changes as step boundaries', async () => {
      const windowChanges = detectWindowChanges(mockCaptureSession.frames);

      // Should detect 1 window change (Login Page -> Dashboard)
      expect(windowChanges).toHaveLength(1);
      expect(windowChanges[0].window.title).toContain('Dashboard');
    });

    it('should assign representative screenshot to each step', async () => {
      const sessionData = await loadSession(
        'test-session',
        mockCaptureSession,
        mockTranscription,
        mockAnnotations
      );

      const timeline = buildTimeline(sessionData);
      const pauses = detectVoicePauses(
        mockTranscription.segments,
        mockCaptureSession.startTime
      );
      timeline.push(...pauses);
      timeline.sort((a, b) => a.timestamp - b.timestamp);

      const steps = detectSteps(timeline, { ...sessionData, allVariables: [], allConditionals: [] });

      // Each step should have a screenshot
      for (const step of steps) {
        expect(step.screenshotPath).toBeTruthy();
        expect(step.screenshotPath).toMatch(/\.png$/);
      }
    });

    it('should include transcript description for each step', async () => {
      const sessionData = await loadSession(
        'test-session',
        mockCaptureSession,
        mockTranscription,
        mockAnnotations
      );

      const timeline = buildTimeline(sessionData);
      const pauses = detectVoicePauses(
        mockTranscription.segments,
        mockCaptureSession.startTime
      );
      timeline.push(...pauses);
      timeline.sort((a, b) => a.timestamp - b.timestamp);

      const steps = detectSteps(timeline, { ...sessionData, allVariables: [], allConditionals: [] });

      // Steps should have transcript content
      const stepsWithTranscript = steps.filter(s => s.transcript.length > 0);
      expect(stepsWithTranscript.length).toBeGreaterThan(0);
    });
  });

  describe('AC4: Speech Classification', () => {
    it('should classify speech segments (placeholder)', async () => {
      // Note: Speech classification is marked as TODO in the implementation
      // This test verifies the structure is in place for future implementation
      const sessionData = await loadSession(
        'test-session',
        mockCaptureSession,
        mockTranscription,
        mockAnnotations
      );

      const timeline = buildTimeline(sessionData);
      const steps = detectSteps(timeline, { ...sessionData, allVariables: [], allConditionals: [] });

      // Verify structure exists for variables and conditionals
      for (const step of steps) {
        expect(step.variables).toBeDefined();
        expect(Array.isArray(step.variables)).toBe(true);
        expect(step.conditionals).toBeDefined();
        expect(Array.isArray(step.conditionals)).toBe(true);
      }
    });

    it('should detect variable mentions (structure ready)', async () => {
      const sessionData = await loadSession(
        'test-session',
        mockCaptureSession,
        mockTranscription,
        mockAnnotations
      );

      const timeline = buildTimeline(sessionData);
      const steps = detectSteps(timeline, { ...sessionData, allVariables: [], allConditionals: [] });

      // Verify the data structure supports variable detection
      expect(steps[0]).toHaveProperty('variables');
      expect(steps[0]).toHaveProperty('conditionals');
    });
  });

  describe('AC5: LLM Context Generation', () => {
    it('should generate structured JSON for LLM', async () => {
      const processedSession = await processSession(
        'test-session',
        mockCaptureSession,
        mockTranscription,
        mockAnnotations
      );

      const llmContext = await generateLLMContext(processedSession);

      expect(llmContext).toBeDefined();
      expect(typeof llmContext).toBe('object');
      expect(llmContext.taskDescription).toBeDefined();
      expect(llmContext.steps).toBeDefined();
      expect(Array.isArray(llmContext.steps)).toBe(true);
    });

    it('should include step summaries', async () => {
      const processedSession = await processSession(
        'test-session',
        mockCaptureSession,
        mockTranscription,
        mockAnnotations
      );

      const llmContext = await generateLLMContext(processedSession);

      expect(llmContext.steps.length).toBeGreaterThan(0);

      for (const step of llmContext.steps) {
        expect(step.number).toBeDefined();
        expect(step.description).toBeDefined();
        expect(step.notes).toBeDefined();
        expect(Array.isArray(step.notes)).toBe(true);
      }
    });

    it('should include full transcript', async () => {
      const processedSession = await processSession(
        'test-session',
        mockCaptureSession,
        mockTranscription,
        mockAnnotations
      );

      const llmContext = await generateLLMContext(processedSession);

      expect(llmContext.fullNarration).toBeDefined();
      expect(llmContext.fullNarration).toBe(mockTranscription.text);
    });

    it('should include annotation notes', async () => {
      const processedSession = await processSession(
        'test-session',
        mockCaptureSession,
        mockTranscription,
        mockAnnotations
      );

      const llmContext = await generateLLMContext(processedSession);

      // At least one step should have notes from annotations
      const stepsWithNotes = llmContext.steps.filter(s => s.notes.length > 0);
      expect(stepsWithNotes.length).toBeGreaterThan(0);
    });

    it('should include summary statistics', async () => {
      const processedSession = await processSession(
        'test-session',
        mockCaptureSession,
        mockTranscription,
        mockAnnotations
      );

      const llmContext = await generateLLMContext(processedSession);

      expect(llmContext.summary).toBeDefined();
      expect(llmContext.summary.totalClicks).toBe(2);
      expect(llmContext.summary.totalTextInputs).toBe(1);
      expect(llmContext.summary.totalAnnotations).toBe(2); // 1 drawing + 1 element
      expect(llmContext.summary.durationSeconds).toBeGreaterThan(0);
    });

    it('should limit to max key frames', async () => {
      const processedSession = await processSession(
        'test-session',
        mockCaptureSession,
        mockTranscription,
        mockAnnotations
      );

      const llmContext = await generateLLMContext(processedSession, 2);

      // Should limit to 2 key frames
      expect(llmContext.steps.length).toBeLessThanOrEqual(2);
    });
  });

  describe('NFR-5.1: Processing Time Performance', () => {
    it('should process 2-minute recording in under 30 seconds', async () => {
      const startTime = Date.now();

      await processSession(
        'test-session',
        mockCaptureSession,
        mockTranscription,
        mockAnnotations
      );

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      // Should complete in under 30 seconds (30000ms)
      expect(processingTime).toBeLessThan(30000);

      console.log(`Processing time: ${processingTime}ms`);
    });

    it('should report progress during processing', async () => {
      const progressUpdates: any[] = [];

      await processSession(
        'test-session',
        mockCaptureSession,
        mockTranscription,
        mockAnnotations,
        (progress) => {
          progressUpdates.push(progress);
        }
      );

      // Should have multiple progress updates
      expect(progressUpdates.length).toBeGreaterThan(0);

      // Should have loading stage
      expect(progressUpdates.some(p => p.stage === 'loading')).toBe(true);

      // Should have complete stage
      expect(progressUpdates.some(p => p.stage === 'complete')).toBe(true);

      // Progress should increase
      const percentages = progressUpdates.map(p => p.percentage);
      expect(percentages[percentages.length - 1]).toBe(100);
    });
  });

  describe('Complete Pipeline Integration', () => {
    it('should process complete session end-to-end', async () => {
      const processedSession = await processSession(
        'test-session',
        mockCaptureSession,
        mockTranscription,
        mockAnnotations
      );

      // Verify processed session structure
      expect(processedSession.sessionId).toBe('test-session');
      expect(processedSession.steps.length).toBeGreaterThan(0);
      expect(processedSession.fullTranscript).toBe(mockTranscription.text);
      expect(processedSession.timeline.length).toBeGreaterThan(0);

      // Verify timeline includes all event types
      const eventTypes = new Set(processedSession.timeline.map(e => e.type));
      expect(eventTypes.has('screenshot')).toBe(true);
      expect(eventTypes.has('voice')).toBe(true);
      expect(eventTypes.has('click')).toBe(true);

      // Verify steps have required properties
      for (const step of processedSession.steps) {
        expect(step.stepNumber).toBeGreaterThan(0);
        expect(step.timeRange).toBeDefined();
        expect(step.timeRange.start).toBeLessThan(step.timeRange.end);
        expect(step.annotations).toBeDefined();
      }
    });

    it('should generate LLM context from processed session', async () => {
      const processedSession = await processSession(
        'test-session',
        mockCaptureSession,
        mockTranscription,
        mockAnnotations
      );

      const llmContext = await generateLLMContext(processedSession);

      // Verify LLM context is complete and ready for skill generation
      expect(llmContext.taskDescription).toBeTruthy();
      expect(llmContext.steps.length).toBeGreaterThan(0);
      expect(llmContext.fullNarration).toBeTruthy();
      expect(llmContext.summary).toBeDefined();
      expect(llmContext.references).toBeDefined();

      // Verify each step has required fields
      for (const step of llmContext.steps) {
        expect(step.number).toBeGreaterThan(0);
        expect(step.description).toBeTruthy();
        expect(step.timeRange).toBeDefined();
        expect(step.actions).toBeDefined();
        expect(step.notes).toBeDefined();
      }
    });

    it('should handle session without transcription', async () => {
      const processedSession = await processSession(
        'test-session',
        mockCaptureSession,
        null, // No transcription
        mockAnnotations
      );

      expect(processedSession.fullTranscript).toBe('');
      expect(processedSession.steps.length).toBeGreaterThan(0);

      const llmContext = await generateLLMContext(processedSession);
      expect(llmContext.taskDescription).toBe('Demonstration recording');
    });

    it('should handle session without annotations', async () => {
      const emptyAnnotations = {
        clicks: [],
        drawings: [],
        selectedElements: [],
        keyboardInputs: [],
      };

      const processedSession = await processSession(
        'test-session',
        mockCaptureSession,
        mockTranscription,
        emptyAnnotations
      );

      expect(processedSession.allAnnotations.clicks).toHaveLength(0);
      expect(processedSession.allAnnotations.drawings).toHaveLength(0);
      expect(processedSession.steps.length).toBeGreaterThan(0);
    });

    it('should maintain chronological order throughout pipeline', async () => {
      const processedSession = await processSession(
        'test-session',
        mockCaptureSession,
        mockTranscription,
        mockAnnotations
      );

      // Verify timeline is sorted
      for (let i = 0; i < processedSession.timeline.length - 1; i++) {
        expect(processedSession.timeline[i].timestamp).toBeLessThanOrEqual(
          processedSession.timeline[i + 1].timestamp
        );
      }

      // Verify steps are in order
      for (let i = 0; i < processedSession.steps.length - 1; i++) {
        expect(processedSession.steps[i].stepNumber).toBeLessThan(
          processedSession.steps[i + 1].stepNumber
        );
        expect(processedSession.steps[i].timeRange.start).toBeLessThanOrEqual(
          processedSession.steps[i + 1].timeRange.start
        );
      }
    });
  });

  describe('Error Handling', () => {
    it('should throw error for invalid session ID', async () => {
      await expect(
        processSession(
          '', // Empty session ID
          mockCaptureSession,
          mockTranscription,
          mockAnnotations
        )
      ).rejects.toThrow();
    });

    it('should throw error for session without frames', async () => {
      const invalidSession = {
        ...mockCaptureSession,
        frames: [],
      };

      await expect(
        processSession(
          'test-session',
          invalidSession,
          mockTranscription,
          mockAnnotations
        )
      ).rejects.toThrow();
    });

    it('should report error in progress callback', async () => {
      const progressUpdates: any[] = [];
      const invalidSession = {
        ...mockCaptureSession,
        frames: [],
      };

      try {
        await processSession(
          'test-session',
          invalidSession,
          mockTranscription,
          mockAnnotations,
          (progress) => {
            progressUpdates.push(progress);
          }
        );
      } catch (error) {
        // Expected to throw
      }

      // Should have reported error in progress
      const errorProgress = progressUpdates.find(p => p.stage === 'error');
      expect(errorProgress).toBeDefined();
    });
  });
});
