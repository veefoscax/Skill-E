import { useCapture } from '../hooks/useCapture';
import { useRecordingStore } from '../stores/recording';

/**
 * Test component for the useCapture hook
 * 
 * This component provides a simple UI to test the capture functionality:
 * - Start/stop capture with configurable interval
 * - Display captured frame count
 * - Show capture session ID
 * 
 * Requirements tested:
 * - FR-2.2: Take periodic screenshots during recording (1/sec)
 * - FR-2.3: Detect active window and track focus changes
 * - FR-2.4: Capture mouse cursor position for each frame
 */
export function CaptureHookTest() {
  const { startCapture, stopCapture, getSessionId, getFrameCount } = useCapture();
  const frames = useRecordingStore((state) => state.frames);
  const sessionId = getSessionId();
  const frameCount = getFrameCount();

  const handleStartCapture = () => {
    const interval = 1000; // 1 second
    const id = startCapture(interval);
    console.log('Started capture session:', id);
  };

  const handleStopCapture = () => {
    stopCapture();
    console.log('Stopped capture session');
  };

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-bold">Capture Hook Test</h2>
      
      <div className="space-y-2">
        <div className="flex gap-2">
          <button
            onClick={handleStartCapture}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            disabled={sessionId !== null}
          >
            Start Capture (1fps)
          </button>
          
          <button
            onClick={handleStopCapture}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            disabled={sessionId === null}
          >
            Stop Capture
          </button>
        </div>

        <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded">
          <p className="font-semibold">Status:</p>
          <p>Session ID: {sessionId || 'Not capturing'}</p>
          <p>Frames captured (hook): {frameCount}</p>
          <p>Frames in store: {frames.length}</p>
        </div>

        {frames.length > 0 && (
          <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded">
            <p className="font-semibold mb-2">Recent Frames:</p>
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {frames.slice(-10).reverse().map((frame, idx) => (
                <div key={idx} className="text-sm">
                  <span className="font-mono">
                    {new Date(frame.timestamp).toLocaleTimeString()}
                  </span>
                  {frame.cursorPosition && (
                    <span className="ml-2 text-gray-600 dark:text-gray-400">
                      Cursor: ({frame.cursorPosition.x}, {frame.cursorPosition.y})
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="text-sm text-gray-600 dark:text-gray-400">
        <p>Expected behavior:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Click "Start Capture" to begin capturing at 1 frame per second</li>
          <li>Frame count should increment every second</li>
          <li>Cursor position should be logged for each frame</li>
          <li>Click "Stop Capture" to end the session</li>
          <li>Check console for detailed logs</li>
        </ul>
      </div>
    </div>
  );
}
