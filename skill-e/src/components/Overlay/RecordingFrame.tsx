import { useRecordingStore } from '../../stores/recording';

/**
 * RecordingFrame - A pulsing border around the entire screen
 * indicating that recording is currently active.
 */
export function RecordingFrame() {
  const isRecording = useRecordingStore(state => state.isRecording);
  const isPaused = useRecordingStore(state => state.isPaused);

  if (!isRecording) return null;

  const borderColor = isPaused ? 'rgba(234, 179, 8, 0.5)' : 'rgba(239, 68, 68, 0.5)';
  const animationClass = isPaused ? '' : 'animate-pulse';

  return (
    <div
      className={`fixed inset-0 pointer-events-none z-[100] border-[6px] transition-colors duration-300 ${animationClass}`}
      style={{
        borderColor,
        boxShadow: `inset 0 0 20px ${borderColor}`,
      }}
    />
  );
}
