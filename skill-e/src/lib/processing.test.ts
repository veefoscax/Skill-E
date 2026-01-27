/**
 * Processing Pipeline Tests
 * 
 * Tests for session loading and timeline building functionality.
 */

import { describe, it, expect } from 'vitest';
import {
  loadSession,
  buildTimeline,
  detectVoicePauses,
  detectWindowChanges,
  createProgress,
  detectSteps,
} from './processing';
import type { CaptureSession } from '../types/capture';
import type { TranscriptionResult } from './whisper';
import type { SessionData } from './processing';
import type { TimelineEvent } from '../types/processing';

describe('Processing Pipeline', () => {
  describe('loadSession', () => {
    it('should load session data successfully', async () => {
      const mockCaptureSession: CaptureSession = {
        id: 'test-session',
        directory: '/test/path',
        startTime: Date.now(),
        endTime: Date.now() + 10000,
        frames: [
          {
            id: 'frame-1',
            timestamp: Date.now(),
            imagePath: '/test/frame1.png',
          },
        ],
        intervalMs: 1000,
      };

      const mockTranscription: TranscriptionResult = {
        text: 'Test transcription',
        segments: [
          {
            id: 0,
            start: 0,
            end: 2,
            text: 'Test transcription',
          },
        ],
        language: 'en',
        duration: 2,
      };

      const mockAnnotations = {
        clicks: [],
        drawings: [],
        selectedElements: [],
        keyboardInputs: [],
      };

      const sessionData = await loadSession(
        'test-session',
        mockCaptureSession,
        mockTranscription,
        mockAnnotations
      );

      expect(sessionData).toBeDefined();
      expect(sessionData.captureSession).toBe(mockCaptureSession);
      expect(sessionData.transcription).toBe(mockTranscription);
      expect(sessionData.clicks).toEqual([]);
      expect(sessionData.drawings).toEqual([]);
    });

    it('should throw error if session ID is empty', async () => {
      const mockCaptureSession: CaptureSession = {
        id: 'test-session',
        directory: '/test/path',
        startTime: Date.now(),
        frames: [
          {
            id: 'frame-1',
            timestamp: Date.now(),
            imagePath: '/test/frame1.png',
          },
        ],
        intervalMs: 1000,
      };

      await expect(
        loadSession('', mockCaptureSession, null, {
          clicks: [],
          drawings: [],
          selectedElements: [],
          keyboardInputs: [],
        })
      ).rejects.toThrow('Session ID is required');
    });

    it('should throw error if capture session has no frames', async () => {
      const mockCaptureSession: CaptureSession = {
        id: 'test-session',
        directory: '/test/path',
        startTime: Date.now(),
        frames: [],
        intervalMs: 1000,
      };

      await expect(
        loadSession('test-session', mockCaptureSession, null, {
          clicks: [],
          drawings: [],
          selectedElements: [],
          keyboardInputs: [],
        })
      ).rejects.toThrow('Capture session must contain at least one frame');
    });

    it('should handle missing transcription', async () => {
      const mockCaptureSession: CaptureSession = {
        id: 'test-session',
        directory: '/test/path',
        startTime: Date.now(),
        frames: [
          {
            id: 'frame-1',
            timestamp: Date.now(),
            imagePath: '/test/frame1.png',
          },
        ],
        intervalMs: 1000,
      };

      const sessionData = await loadSession('test-session', mockCaptureSession, null, {
        clicks: [],
        drawings: [],
        selectedElements: [],
        keyboardInputs: [],
      });

      expect(sessionData.transcription).toBeNull();
    });
  });

  describe('buildTimeline', () => {
    it('should build timeline from session data', () => {
      const now = Date.now();
      const sessionData = {
        captureSession: {
          id: 'test-session',
          directory: '/test/path',
          startTime: now,
          frames: [
            {
              id: 'frame-1',
              timestamp: now,
              imagePath: '/test/frame1.png',
            },
            {
              id: 'frame-2',
              timestamp: now + 1000,
              imagePath: '/test/frame2.png',
            },
          ],
          intervalMs: 1000,
        },
        transcription: {
          text: 'Hello world',
          segments: [
            {
              id: 0,
              start: 0,
              end: 1,
              text: 'Hello',
            },
            {
              id: 1,
              start: 1,
              end: 2,
              text: 'world',
            },
          ],
          language: 'en',
          duration: 2,
        },
        clicks: [
          {
            id: 'click-1',
            number: 1,
            position: { x: 100, y: 100 },
            color: 'COLOR_1' as const,
            timestamp: now + 500,
            fadeState: 'visible' as const,
          },
        ],
        drawings: [],
        selectedElements: [],
        keyboardInputs: [],
      };

      const timeline = buildTimeline(sessionData);

      expect(timeline).toHaveLength(5); // 2 frames + 2 voice segments + 1 click
      expect(timeline[0].type).toBe('screenshot');
      expect(timeline[timeline.length - 1].timestamp).toBeGreaterThanOrEqual(now);
    });

    it('should sort timeline chronologically', () => {
      const now = Date.now();
      const sessionData = {
        captureSession: {
          id: 'test-session',
          directory: '/test/path',
          startTime: now,
          frames: [
            {
              id: 'frame-1',
              timestamp: now + 2000,
              imagePath: '/test/frame1.png',
            },
            {
              id: 'frame-2',
              timestamp: now + 1000,
              imagePath: '/test/frame2.png',
            },
          ],
          intervalMs: 1000,
        },
        transcription: null,
        clicks: [],
        drawings: [],
        selectedElements: [],
        keyboardInputs: [],
      };

      const timeline = buildTimeline(sessionData);

      expect(timeline).toHaveLength(2);
      expect(timeline[0].timestamp).toBeLessThan(timeline[1].timestamp);
    });
  });

  describe('detectVoicePauses', () => {
    it('should detect pauses longer than threshold', () => {
      const now = Date.now();
      const segments = [
        { id: 0, start: 0, end: 2, text: 'First segment' },
        { id: 1, start: 5, end: 7, text: 'Second segment' }, // 3 second pause
        { id: 2, start: 8, end: 10, text: 'Third segment' }, // 1 second pause
      ];

      const pauses = detectVoicePauses(segments, now, 2000);

      expect(pauses).toHaveLength(1);
      expect(pauses[0].duration).toBe(3000);
    });

    it('should not detect short pauses', () => {
      const now = Date.now();
      const segments = [
        { id: 0, start: 0, end: 2, text: 'First segment' },
        { id: 1, start: 2.5, end: 4.5, text: 'Second segment' }, // 0.5 second pause
      ];

      const pauses = detectVoicePauses(segments, now, 2000);

      expect(pauses).toHaveLength(0);
    });
  });

  describe('detectWindowChanges', () => {
    it('should detect window changes', () => {
      const now = Date.now();
      const frames = [
        {
          id: 'frame-1',
          timestamp: now,
          imagePath: '/test/frame1.png',
          activeWindow: {
            title: 'Window 1',
            processName: 'app1',
            bounds: { x: 0, y: 0, width: 800, height: 600 },
          },
        },
        {
          id: 'frame-2',
          timestamp: now + 1000,
          imagePath: '/test/frame2.png',
          activeWindow: {
            title: 'Window 2',
            processName: 'app2',
            bounds: { x: 0, y: 0, width: 800, height: 600 },
          },
        },
        {
          id: 'frame-3',
          timestamp: now + 2000,
          imagePath: '/test/frame3.png',
          activeWindow: {
            title: 'Window 2',
            processName: 'app2',
            bounds: { x: 0, y: 0, width: 800, height: 600 },
          },
        },
      ];

      const windowChanges = detectWindowChanges(frames);

      expect(windowChanges).toHaveLength(1);
      expect(windowChanges[0].window.title).toBe('Window 2');
    });

    it('should handle frames without window info', () => {
      const now = Date.now();
      const frames = [
        {
          id: 'frame-1',
          timestamp: now,
          imagePath: '/test/frame1.png',
        },
        {
          id: 'frame-2',
          timestamp: now + 1000,
          imagePath: '/test/frame2.png',
        },
      ];

      const windowChanges = detectWindowChanges(frames);

      expect(windowChanges).toHaveLength(0);
    });
  });

  describe('createProgress', () => {
    it('should create progress state', () => {
      const progress = createProgress('loading', 50, 'Loading data...', 10);

      expect(progress.stage).toBe('loading');
      expect(progress.percentage).toBe(50);
      expect(progress.currentStep).toBe('Loading data...');
      expect(progress.estimatedTimeRemaining).toBe(10);
    });

    it('should clamp percentage to 0-100 range', () => {
      const progress1 = createProgress('loading', -10, 'Loading...');
      expect(progress1.percentage).toBe(0);

      const progress2 = createProgress('loading', 150, 'Loading...');
      expect(progress2.percentage).toBe(100);
    });
  });

  describe('detectSteps', () => {
    it('should detect steps based on voice pauses', () => {
      const now = Date.now();
      
      // Create timeline with voice pauses
      const timeline: TimelineEvent[] = [
        {
          id: 'screenshot-1',
          type: 'screenshot',
          timestamp: now,
          frame: {
            id: 'frame-1',
            timestamp: now,
            imagePath: '/test/frame1.png',
          },
        },
        {
          id: 'voice-1',
          type: 'voice',
          timestamp: now + 500,
          segment: { id: 0, start: 0, end: 1, text: 'First step' },
        },
        {
          id: 'pause-1',
          type: 'pause',
          timestamp: now + 1000,
          duration: 3000, // 3 second pause
        },
        {
          id: 'screenshot-2',
          type: 'screenshot',
          timestamp: now + 4000,
          frame: {
            id: 'frame-2',
            timestamp: now + 4000,
            imagePath: '/test/frame2.png',
          },
        },
        {
          id: 'voice-2',
          type: 'voice',
          timestamp: now + 4500,
          segment: { id: 1, start: 4, end: 5, text: 'Second step' },
        },
      ];

      const sessionData: SessionData = {
        captureSession: {
          id: 'test-session',
          directory: '/test',
          startTime: now,
          frames: [
            { id: 'frame-1', timestamp: now, imagePath: '/test/frame1.png' },
            { id: 'frame-2', timestamp: now + 4000, imagePath: '/test/frame2.png' },
          ],
          intervalMs: 1000,
        },
        transcription: null,
        clicks: [],
        drawings: [],
        selectedElements: [],
        keyboardInputs: [],
      };

      const steps = detectSteps(timeline, sessionData);

      expect(steps).toHaveLength(2);
      expect(steps[0].stepNumber).toBe(1);
      expect(steps[0].transcript).toContain('First step');
      expect(steps[1].stepNumber).toBe(2);
      expect(steps[1].transcript).toContain('Second step');
    });

    it('should detect steps based on window changes', () => {
      const now = Date.now();
      
      const timeline: TimelineEvent[] = [
        {
          id: 'screenshot-1',
          type: 'screenshot',
          timestamp: now,
          frame: {
            id: 'frame-1',
            timestamp: now,
            imagePath: '/test/frame1.png',
            activeWindow: {
              title: 'Window 1',
              processName: 'app1',
              bounds: { x: 0, y: 0, width: 800, height: 600 },
            },
          },
        },
        {
          id: 'window-change-1',
          type: 'window_change',
          timestamp: now + 1000,
          window: {
            title: 'Window 2',
            processName: 'app2',
            bounds: { x: 0, y: 0, width: 800, height: 600 },
          },
        },
        {
          id: 'screenshot-2',
          type: 'screenshot',
          timestamp: now + 2000,
          frame: {
            id: 'frame-2',
            timestamp: now + 2000,
            imagePath: '/test/frame2.png',
            activeWindow: {
              title: 'Window 2',
              processName: 'app2',
              bounds: { x: 0, y: 0, width: 800, height: 600 },
            },
          },
        },
      ];

      const sessionData: SessionData = {
        captureSession: {
          id: 'test-session',
          directory: '/test',
          startTime: now,
          frames: [
            {
              id: 'frame-1',
              timestamp: now,
              imagePath: '/test/frame1.png',
              activeWindow: {
                title: 'Window 1',
                processName: 'app1',
                bounds: { x: 0, y: 0, width: 800, height: 600 },
              },
            },
            {
              id: 'frame-2',
              timestamp: now + 2000,
              imagePath: '/test/frame2.png',
              activeWindow: {
                title: 'Window 2',
                processName: 'app2',
                bounds: { x: 0, y: 0, width: 800, height: 600 },
              },
            },
          ],
          intervalMs: 1000,
        },
        transcription: null,
        clicks: [],
        drawings: [],
        selectedElements: [],
        keyboardInputs: [],
      };

      const steps = detectSteps(timeline, sessionData);

      expect(steps).toHaveLength(2);
      expect(steps[0].windowTitle).toBe('Window 1');
      expect(steps[1].windowTitle).toBe('Window 2');
    });

    it('should detect steps based on pinned annotations', () => {
      const now = Date.now();
      
      const timeline: TimelineEvent[] = [
        {
          id: 'screenshot-1',
          type: 'screenshot',
          timestamp: now,
          frame: {
            id: 'frame-1',
            timestamp: now,
            imagePath: '/test/frame1.png',
          },
        },
        {
          id: 'drawing-1',
          type: 'drawing',
          timestamp: now + 1000,
          drawing: {
            id: 'draw-1',
            type: 'arrow',
            startPoint: { x: 0, y: 0 },
            endPoint: { x: 100, y: 100 },
            color: 'COLOR_1',
            timestamp: now + 1000,
            isPinned: true,
            fadeState: 'visible',
          },
        },
        {
          id: 'screenshot-2',
          type: 'screenshot',
          timestamp: now + 2000,
          frame: {
            id: 'frame-2',
            timestamp: now + 2000,
            imagePath: '/test/frame2.png',
          },
        },
      ];

      const sessionData: SessionData = {
        captureSession: {
          id: 'test-session',
          directory: '/test',
          startTime: now,
          frames: [
            { id: 'frame-1', timestamp: now, imagePath: '/test/frame1.png' },
            { id: 'frame-2', timestamp: now + 2000, imagePath: '/test/frame2.png' },
          ],
          intervalMs: 1000,
        },
        transcription: null,
        clicks: [],
        drawings: [],
        selectedElements: [],
        keyboardInputs: [],
      };

      const steps = detectSteps(timeline, sessionData);

      expect(steps).toHaveLength(2);
      expect(steps[0].annotations.drawings).toHaveLength(1);
      expect(steps[0].annotations.drawings[0].isPinned).toBe(true);
    });

    it('should detect steps based on element selections', () => {
      const now = Date.now();
      
      const timeline: TimelineEvent[] = [
        {
          id: 'screenshot-1',
          type: 'screenshot',
          timestamp: now,
          frame: {
            id: 'frame-1',
            timestamp: now,
            imagePath: '/test/frame1.png',
          },
        },
        {
          id: 'element-1',
          type: 'element_selection',
          timestamp: now + 1000,
          element: {
            cssSelector: '#button',
            xpath: '//*[@id="button"]',
            tagName: 'button',
            textContent: 'Click me',
            boundingBox: { x: 0, y: 0, width: 100, height: 50 },
            timestamp: now + 1000,
          },
        },
        {
          id: 'screenshot-2',
          type: 'screenshot',
          timestamp: now + 2000,
          frame: {
            id: 'frame-2',
            timestamp: now + 2000,
            imagePath: '/test/frame2.png',
          },
        },
      ];

      const sessionData: SessionData = {
        captureSession: {
          id: 'test-session',
          directory: '/test',
          startTime: now,
          frames: [
            { id: 'frame-1', timestamp: now, imagePath: '/test/frame1.png' },
            { id: 'frame-2', timestamp: now + 2000, imagePath: '/test/frame2.png' },
          ],
          intervalMs: 1000,
        },
        transcription: null,
        clicks: [],
        drawings: [],
        selectedElements: [],
        keyboardInputs: [],
      };

      const steps = detectSteps(timeline, sessionData);

      expect(steps).toHaveLength(2);
      expect(steps[0].annotations.selectedElements).toHaveLength(1);
      expect(steps[0].annotations.selectedElements[0].tagName).toBe('button');
    });

    it('should handle empty timeline', () => {
      const sessionData: SessionData = {
        captureSession: {
          id: 'test-session',
          directory: '/test',
          startTime: Date.now(),
          frames: [],
          intervalMs: 1000,
        },
        transcription: null,
        clicks: [],
        drawings: [],
        selectedElements: [],
        keyboardInputs: [],
      };

      const steps = detectSteps([], sessionData);

      expect(steps).toHaveLength(0);
    });

    it('should group consecutive frames into single step', () => {
      const now = Date.now();
      
      const timeline: TimelineEvent[] = [
        {
          id: 'screenshot-1',
          type: 'screenshot',
          timestamp: now,
          frame: {
            id: 'frame-1',
            timestamp: now,
            imagePath: '/test/frame1.png',
          },
        },
        {
          id: 'screenshot-2',
          type: 'screenshot',
          timestamp: now + 1000,
          frame: {
            id: 'frame-2',
            timestamp: now + 1000,
            imagePath: '/test/frame2.png',
          },
        },
        {
          id: 'screenshot-3',
          type: 'screenshot',
          timestamp: now + 2000,
          frame: {
            id: 'frame-3',
            timestamp: now + 2000,
            imagePath: '/test/frame3.png',
          },
        },
      ];

      const sessionData: SessionData = {
        captureSession: {
          id: 'test-session',
          directory: '/test',
          startTime: now,
          frames: [
            { id: 'frame-1', timestamp: now, imagePath: '/test/frame1.png' },
            { id: 'frame-2', timestamp: now + 1000, imagePath: '/test/frame2.png' },
            { id: 'frame-3', timestamp: now + 2000, imagePath: '/test/frame3.png' },
          ],
          intervalMs: 1000,
        },
        transcription: null,
        clicks: [],
        drawings: [],
        selectedElements: [],
        keyboardInputs: [],
      };

      const steps = detectSteps(timeline, sessionData);

      // Should be grouped into a single step since there are no boundaries
      expect(steps).toHaveLength(1);
      expect(steps[0].events).toHaveLength(3);
    });

    it('should select middle screenshot as representative', () => {
      const now = Date.now();
      
      const timeline: TimelineEvent[] = [
        {
          id: 'screenshot-1',
          type: 'screenshot',
          timestamp: now,
          frame: {
            id: 'frame-1',
            timestamp: now,
            imagePath: '/test/frame1.png',
          },
        },
        {
          id: 'screenshot-2',
          type: 'screenshot',
          timestamp: now + 1000,
          frame: {
            id: 'frame-2',
            timestamp: now + 1000,
            imagePath: '/test/frame2.png',
          },
        },
        {
          id: 'screenshot-3',
          type: 'screenshot',
          timestamp: now + 2000,
          frame: {
            id: 'frame-3',
            timestamp: now + 2000,
            imagePath: '/test/frame3.png',
          },
        },
      ];

      const sessionData: SessionData = {
        captureSession: {
          id: 'test-session',
          directory: '/test',
          startTime: now,
          frames: [
            { id: 'frame-1', timestamp: now, imagePath: '/test/frame1.png' },
            { id: 'frame-2', timestamp: now + 1000, imagePath: '/test/frame2.png' },
            { id: 'frame-3', timestamp: now + 2000, imagePath: '/test/frame3.png' },
          ],
          intervalMs: 1000,
        },
        transcription: null,
        clicks: [],
        drawings: [],
        selectedElements: [],
        keyboardInputs: [],
      };

      const steps = detectSteps(timeline, sessionData);

      expect(steps).toHaveLength(1);
      // Middle frame should be selected (frame-2)
      expect(steps[0].screenshotPath).toBe('/test/frame2.png');
    });

    it('should combine transcript from multiple voice events', () => {
      const now = Date.now();
      
      const timeline: TimelineEvent[] = [
        {
          id: 'voice-1',
          type: 'voice',
          timestamp: now,
          segment: { id: 0, start: 0, end: 1, text: 'First part' },
        },
        {
          id: 'voice-2',
          type: 'voice',
          timestamp: now + 1000,
          segment: { id: 1, start: 1, end: 2, text: 'Second part' },
        },
        {
          id: 'screenshot-1',
          type: 'screenshot',
          timestamp: now + 2000,
          frame: {
            id: 'frame-1',
            timestamp: now + 2000,
            imagePath: '/test/frame1.png',
          },
        },
      ];

      const sessionData: SessionData = {
        captureSession: {
          id: 'test-session',
          directory: '/test',
          startTime: now,
          frames: [
            { id: 'frame-1', timestamp: now + 2000, imagePath: '/test/frame1.png' },
          ],
          intervalMs: 1000,
        },
        transcription: null,
        clicks: [],
        drawings: [],
        selectedElements: [],
        keyboardInputs: [],
      };

      const steps = detectSteps(timeline, sessionData);

      expect(steps).toHaveLength(1);
      expect(steps[0].transcript).toBe('First part Second part');
    });

    it('should include clicks in step annotations', () => {
      const now = Date.now();
      
      const timeline: TimelineEvent[] = [
        {
          id: 'screenshot-1',
          type: 'screenshot',
          timestamp: now,
          frame: {
            id: 'frame-1',
            timestamp: now,
            imagePath: '/test/frame1.png',
          },
        },
        {
          id: 'click-1',
          type: 'click',
          timestamp: now + 500,
          click: {
            id: 'click-1',
            number: 1,
            position: { x: 100, y: 100 },
            color: 'COLOR_1',
            timestamp: now + 500,
            fadeState: 'visible',
          },
        },
      ];

      const sessionData: SessionData = {
        captureSession: {
          id: 'test-session',
          directory: '/test',
          startTime: now,
          frames: [
            { id: 'frame-1', timestamp: now, imagePath: '/test/frame1.png' },
          ],
          intervalMs: 1000,
        },
        transcription: null,
        clicks: [],
        drawings: [],
        selectedElements: [],
        keyboardInputs: [],
      };

      const steps = detectSteps(timeline, sessionData);

      expect(steps).toHaveLength(1);
      expect(steps[0].annotations.clicks).toHaveLength(1);
      expect(steps[0].annotations.clicks[0].position).toEqual({ x: 100, y: 100 });
    });
  });
});
