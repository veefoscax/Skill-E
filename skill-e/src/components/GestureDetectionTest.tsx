/**
 * Gesture Detection Test Component
 * 
 * Manual testing interface for drawing-tools library.
 * Tests the three gesture types: dot, arrow, and rectangle.
 * 
 * Requirements: FR-4.6, FR-4.7, FR-4.8
 */

import { useState } from 'react';
import {
  detectDrawingType,
  calculateDistance,
  calculateDelta,
  createGesture,
  GESTURE_THRESHOLDS,
  type DrawingGesture,
  type Point,
} from '../lib/overlay/drawing-tools';

interface TestResult {
  gesture: DrawingGesture;
  detectedType: 'dot' | 'arrow' | 'rectangle';
  distance: number;
  delta: { dx: number; dy: number };
  timestamp: string;
}

export function GestureDetectionTest() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [startTime, setStartTime] = useState<number>(0);

  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    const point: Point = {
      x: event.clientX,
      y: event.clientY,
    };
    setStartPoint(point);
    setStartTime(Date.now());
    setIsDrawing(true);
  };

  const handleMouseUp = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawing || !startPoint) return;

    const endPoint: Point = {
      x: event.clientX,
      y: event.clientY,
    };
    const endTime = Date.now();

    // Create gesture using library function
    const gesture = createGesture(startPoint, endPoint, startTime, endTime);

    // Detect type using library function
    const detectedType = detectDrawingType(gesture);

    // Calculate metrics using library functions
    const distance = calculateDistance(startPoint, endPoint);
    const delta = calculateDelta(startPoint, endPoint);

    // Add test result
    const result: TestResult = {
      gesture,
      detectedType,
      distance,
      delta,
      timestamp: new Date().toLocaleTimeString(),
    };

    setTestResults(prev => [result, ...prev]);
    setIsDrawing(false);
    setStartPoint(null);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const runAutomatedTests = () => {
    const tests: Array<{ name: string; gesture: DrawingGesture; expected: string }> = [
      {
        name: 'Tap (short click)',
        gesture: {
          startPoint: { x: 100, y: 100 },
          endPoint: { x: 105, y: 102 },
          duration: 150,
        },
        expected: 'dot',
      },
      {
        name: 'Horizontal drag',
        gesture: {
          startPoint: { x: 100, y: 100 },
          endPoint: { x: 200, y: 100 },
          duration: 300,
        },
        expected: 'arrow',
      },
      {
        name: 'Vertical drag',
        gesture: {
          startPoint: { x: 100, y: 100 },
          endPoint: { x: 100, y: 200 },
          duration: 300,
        },
        expected: 'arrow',
      },
      {
        name: 'Diagonal drag (rectangle)',
        gesture: {
          startPoint: { x: 100, y: 100 },
          endPoint: { x: 150, y: 150 },
          duration: 300,
        },
        expected: 'rectangle',
      },
      {
        name: 'Large rectangle',
        gesture: {
          startPoint: { x: 100, y: 100 },
          endPoint: { x: 300, y: 250 },
          duration: 500,
        },
        expected: 'rectangle',
      },
    ];

    const results = tests.map(test => {
      const detectedType = detectDrawingType(test.gesture);
      const distance = calculateDistance(test.gesture.startPoint, test.gesture.endPoint);
      const delta = calculateDelta(test.gesture.startPoint, test.gesture.endPoint);

      return {
        gesture: test.gesture,
        detectedType,
        distance,
        delta,
        timestamp: `${test.name} (${detectedType === test.expected ? '✅ PASS' : '❌ FAIL'})`,
      };
    });

    setTestResults(results);
  };

  return (
    <div className="p-8 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Gesture Detection Test</h1>
        <p className="text-sm text-muted-foreground">
          Test the drawing-tools library gesture detection
        </p>
      </div>

      {/* Thresholds Info */}
      <div className="p-4 bg-muted rounded-lg space-y-2">
        <h2 className="font-semibold">Detection Thresholds</h2>
        <ul className="text-sm space-y-1">
          <li>
            <strong>Dot:</strong> Distance &lt; {GESTURE_THRESHOLDS.TAP_MAX_DISTANCE}px AND
            Duration &lt; {GESTURE_THRESHOLDS.TAP_MAX_DURATION}ms
          </li>
          <li>
            <strong>Rectangle:</strong> dx &gt; {GESTURE_THRESHOLDS.RECTANGLE_MIN_DISTANCE}px AND
            dy &gt; {GESTURE_THRESHOLDS.RECTANGLE_MIN_DISTANCE}px
          </li>
          <li>
            <strong>Arrow:</strong> Any other drag gesture
          </li>
        </ul>
      </div>

      {/* Drawing Area */}
      <div
        className="border-2 border-dashed border-primary rounded-lg p-8 bg-background cursor-crosshair"
        style={{ minHeight: '300px' }}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
      >
        <div className="text-center text-muted-foreground">
          {isDrawing ? (
            <p className="text-lg font-semibold">Drawing... Release to detect gesture</p>
          ) : (
            <div className="space-y-2">
              <p className="text-lg font-semibold">Click and drag to test gestures</p>
              <ul className="text-sm space-y-1">
                <li>Quick tap → Dot</li>
                <li>Horizontal/vertical drag → Arrow</li>
                <li>Diagonal drag (both directions) → Rectangle</li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-4">
        <button
          onClick={runAutomatedTests}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Run Automated Tests
        </button>
        <button
          onClick={clearResults}
          className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90"
        >
          Clear Results
        </button>
      </div>

      {/* Test Results */}
      {testResults.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Test Results ({testResults.length})</h2>
          <div className="space-y-2">
            {testResults.map((result, index) => (
              <div
                key={index}
                className="p-4 border rounded-lg bg-card space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-lg">
                    Detected: {result.detectedType.toUpperCase()}
                  </span>
                  <span className="text-sm text-muted-foreground">{result.timestamp}</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Start:</strong> ({result.gesture.startPoint.x.toFixed(0)},{' '}
                    {result.gesture.startPoint.y.toFixed(0)})
                  </div>
                  <div>
                    <strong>End:</strong> ({result.gesture.endPoint.x.toFixed(0)},{' '}
                    {result.gesture.endPoint.y.toFixed(0)})
                  </div>
                  <div>
                    <strong>Distance:</strong> {result.distance.toFixed(2)}px
                  </div>
                  <div>
                    <strong>Duration:</strong> {result.gesture.duration}ms
                  </div>
                  <div>
                    <strong>Delta X:</strong> {result.delta.dx.toFixed(0)}px
                  </div>
                  <div>
                    <strong>Delta Y:</strong> {result.delta.dy.toFixed(0)}px
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
