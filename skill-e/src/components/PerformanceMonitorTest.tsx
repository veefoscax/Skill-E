/**
 * Performance Monitor Test Component
 * 
 * Tests and displays performance metrics for overlay UI.
 * Verifies that drawing operations maintain 60fps (< 16ms per frame).
 * 
 * Requirements: NFR-4.2
 */

import { useEffect, useState } from 'react';
import { performanceMonitor, PERFORMANCE_THRESHOLDS, type PerformanceMetrics } from '../lib/overlay/performance';
import { useOverlayStore } from '../stores/overlay';

export function PerformanceMonitorTest() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [averageMetrics, setAverageMetrics] = useState({
    avgFrameTime: 0,
    avgFPS: 0,
    status: 'good' as 'good' | 'warning' | 'critical',
  });
  const [isMonitoring, setIsMonitoring] = useState(false);

  const { clicks, drawings, addClick, addDrawing, clearClicks, clearDrawings, currentColor } = useOverlayStore();

  // Subscribe to performance updates
  useEffect(() => {
    if (!isMonitoring) return;

    const unsubscribe = performanceMonitor.subscribe((newMetrics) => {
      setMetrics(newMetrics);
    });

    // Update average metrics every second
    const interval = setInterval(() => {
      setAverageMetrics({
        avgFrameTime: performanceMonitor.getAverageFrameTime(),
        avgFPS: performanceMonitor.getAverageFPS(),
        status: performanceMonitor.getStatus(),
      });
    }, 1000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [isMonitoring]);

  const startMonitoring = () => {
    performanceMonitor.reset();
    setIsMonitoring(true);
  };

  const stopMonitoring = () => {
    setIsMonitoring(false);
  };

  const generateRandomClicks = (count: number) => {
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        addClick({
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
        });
      }, i * 100);
    }
  };

  const generateRandomDrawings = (count: number) => {
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        const startX = Math.random() * window.innerWidth;
        const startY = Math.random() * window.innerHeight;
        const endX = startX + (Math.random() * 200 - 100);
        const endY = startY + (Math.random() * 200 - 100);

        addDrawing({
          type: ['dot', 'arrow', 'rectangle'][Math.floor(Math.random() * 3)] as any,
          color: currentColor,
          startPoint: { x: startX, y: startY },
          endPoint: { x: endX, y: endY },
          isPinned: false,
        });
      }, i * 100);
    }
  };

  const stressTest = () => {
    // Generate many elements quickly to test performance
    generateRandomClicks(50);
    generateRandomDrawings(50);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'text-green-500';
      case 'warning':
        return 'text-yellow-500';
      case 'critical':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getFrameTimeColor = (frameTime: number) => {
    if (frameTime < PERFORMANCE_THRESHOLDS.TARGET_FRAME_TIME) {
      return 'text-green-500';
    } else if (frameTime < PERFORMANCE_THRESHOLDS.WARNING_FRAME_TIME) {
      return 'text-yellow-500';
    } else {
      return 'text-red-500';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700 p-6">
          <h1 className="text-3xl font-bold text-white mb-2">
            Performance Monitor Test
          </h1>
          <p className="text-slate-400">
            Tests overlay UI performance to ensure 60fps (≤ 16.67ms per frame)
          </p>
        </div>

        {/* Controls */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700 p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Controls</h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={startMonitoring}
              disabled={isMonitoring}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
            >
              Start Monitoring
            </button>
            <button
              onClick={stopMonitoring}
              disabled={!isMonitoring}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
            >
              Stop Monitoring
            </button>
            <button
              onClick={() => generateRandomClicks(10)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Add 10 Clicks
            </button>
            <button
              onClick={() => generateRandomDrawings(10)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
            >
              Add 10 Drawings
            </button>
            <button
              onClick={stressTest}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors"
            >
              Stress Test (100 elements)
            </button>
            <button
              onClick={() => {
                clearClicks();
                clearDrawings();
              }}
              className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors"
            >
              Clear All
            </button>
          </div>
        </div>

        {/* Current Metrics */}
        {isMonitoring && metrics && (
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Current Frame</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-900/50 rounded-lg p-4">
                <div className="text-sm text-slate-400 mb-1">Frame Time</div>
                <div className={`text-2xl font-bold ${getFrameTimeColor(metrics.frameTime)}`}>
                  {metrics.frameTime.toFixed(2)}ms
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Target: ≤ {PERFORMANCE_THRESHOLDS.TARGET_FRAME_TIME}ms
                </div>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-4">
                <div className="text-sm text-slate-400 mb-1">FPS</div>
                <div className="text-2xl font-bold text-white">
                  {metrics.fps.toFixed(1)}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Target: ≥ 60 FPS
                </div>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-4">
                <div className="text-sm text-slate-400 mb-1">Elements</div>
                <div className="text-2xl font-bold text-white">
                  {metrics.elementCount}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Max: {PERFORMANCE_THRESHOLDS.MAX_ELEMENTS}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Average Metrics */}
        {isMonitoring && (
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Average Performance</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-900/50 rounded-lg p-4">
                <div className="text-sm text-slate-400 mb-1">Avg Frame Time</div>
                <div className={`text-2xl font-bold ${getFrameTimeColor(averageMetrics.avgFrameTime)}`}>
                  {averageMetrics.avgFrameTime.toFixed(2)}ms
                </div>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-4">
                <div className="text-sm text-slate-400 mb-1">Avg FPS</div>
                <div className="text-2xl font-bold text-white">
                  {averageMetrics.avgFPS.toFixed(1)}
                </div>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-4">
                <div className="text-sm text-slate-400 mb-1">Status</div>
                <div className={`text-2xl font-bold uppercase ${getStatusColor(averageMetrics.status)}`}>
                  {averageMetrics.status}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Element Count */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700 p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Current Elements</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-900/50 rounded-lg p-4">
              <div className="text-sm text-slate-400 mb-1">Clicks</div>
              <div className="text-2xl font-bold text-white">{clicks.length}</div>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-4">
              <div className="text-sm text-slate-400 mb-1">Drawings</div>
              <div className="text-2xl font-bold text-white">{drawings.length}</div>
            </div>
          </div>
        </div>

        {/* Performance Thresholds */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700 p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Performance Thresholds</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Target Frame Time (60fps):</span>
              <span className="text-green-500 font-mono">
                ≤ {PERFORMANCE_THRESHOLDS.TARGET_FRAME_TIME}ms
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Warning Threshold:</span>
              <span className="text-yellow-500 font-mono">
                ≤ {PERFORMANCE_THRESHOLDS.WARNING_FRAME_TIME}ms
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Critical Threshold (30fps):</span>
              <span className="text-red-500 font-mono">
                ≤ {PERFORMANCE_THRESHOLDS.CRITICAL_FRAME_TIME}ms
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Max Elements:</span>
              <span className="text-white font-mono">
                {PERFORMANCE_THRESHOLDS.MAX_ELEMENTS}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Cleanup Interval:</span>
              <span className="text-white font-mono">
                {PERFORMANCE_THRESHOLDS.CLEANUP_INTERVAL}ms
              </span>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700 p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Test Instructions</h2>
          <ol className="list-decimal list-inside space-y-2 text-slate-300">
            <li>Click "Start Monitoring" to begin tracking performance</li>
            <li>Use the buttons to add clicks and drawings to the overlay</li>
            <li>Watch the frame time - it should stay below 16.67ms for 60fps</li>
            <li>Run the stress test to verify performance with many elements</li>
            <li>Verify that elements fade out after 3 seconds (unless pinned)</li>
            <li>Check that hidden elements are cleaned up automatically</li>
            <li>Status should remain "GOOD" (green) under normal load</li>
          </ol>
        </div>

        {/* Success Criteria */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700 p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Success Criteria</h2>
          <ul className="space-y-2 text-slate-300">
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-1">✓</span>
              <span>Average frame time ≤ 16.67ms (60fps) with up to 50 elements</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-1">✓</span>
              <span>Ripple animations are smooth and don't cause frame drops</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-1">✓</span>
              <span>Faded elements are removed from DOM after 3 seconds</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-1">✓</span>
              <span>Automatic cleanup prevents memory leaks</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-1">✓</span>
              <span>Performance status remains "GOOD" under stress test</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
