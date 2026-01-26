import { useEffect, useRef, useState } from 'react';

/**
 * AudioLevelMeter Component
 * 
 * Displays real-time audio level visualization using Web Audio API AnalyserNode.
 * Shows a visual meter that responds to microphone input levels and indicates
 * when the microphone is active.
 * 
 * Requirements:
 * - FR-3.2: Show visual feedback (waveform/level meter) during recording
 * 
 * @param audioStream - MediaStream from getUserMedia (microphone)
 * @param isActive - Whether recording is currently active
 */

interface AudioLevelMeterProps {
  /** The audio stream to analyze (from getUserMedia) */
  audioStream: MediaStream | null;
  /** Whether the microphone is currently active/recording */
  isActive: boolean;
  /** Optional className for styling */
  className?: string;
}

export function AudioLevelMeter({ 
  audioStream, 
  isActive,
  className = '' 
}: AudioLevelMeterProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const [currentLevel, setCurrentLevel] = useState(0);

  useEffect(() => {
    if (!audioStream || !isActive) {
      // Cleanup when stream is removed or inactive
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      analyserRef.current = null;
      setCurrentLevel(0);
      return;
    }

    // Create Web Audio API context and analyser
    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(audioStream);

    // Configure analyser
    analyser.fftSize = 256; // Small FFT for faster updates
    analyser.smoothingTimeConstant = 0.8; // Smooth out rapid changes

    // Connect audio graph
    source.connect(analyser);

    // Store references
    audioContextRef.current = audioContext;
    analyserRef.current = analyser;

    // Start visualization
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    
    const updateLevel = () => {
      if (!analyserRef.current || !isActive) {
        return;
      }

      // Get frequency data
      analyserRef.current.getByteFrequencyData(dataArray);

      // Calculate average level (0-255 range)
      const sum = dataArray.reduce((acc, val) => acc + val, 0);
      const average = sum / dataArray.length;
      
      // Normalize to 0-100 range
      const normalizedLevel = (average / 255) * 100;
      
      setCurrentLevel(normalizedLevel);
      drawMeter(normalizedLevel);

      // Continue animation loop
      animationFrameRef.current = requestAnimationFrame(updateLevel);
    };

    updateLevel();

    // Cleanup function
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [audioStream, isActive]);

  /**
   * Draws the audio level meter on the canvas
   * 
   * @param level - Audio level from 0-100
   */
  const drawMeter = (level: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw background
    ctx.fillStyle = 'rgba(39, 39, 42, 0.5)'; // zinc-800 with opacity
    ctx.fillRect(0, 0, width, height);

    // Calculate fill width based on level
    const fillWidth = (level / 100) * width;

    // Create gradient for level bar
    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    
    if (level < 30) {
      // Low level - green
      gradient.addColorStop(0, '#22c55e'); // green-500
      gradient.addColorStop(1, '#16a34a'); // green-600
    } else if (level < 70) {
      // Medium level - yellow/orange
      gradient.addColorStop(0, '#eab308'); // yellow-500
      gradient.addColorStop(1, '#f59e0b'); // amber-500
    } else {
      // High level - red (potential clipping)
      gradient.addColorStop(0, '#f59e0b'); // amber-500
      gradient.addColorStop(1, '#ef4444'); // red-500
    }

    // Draw level bar
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, fillWidth, height);

    // Draw level markers (every 25%)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 4; i++) {
      const x = (width / 4) * i;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Draw border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, width, height);
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {/* Status Indicator */}
      <div className="flex items-center gap-2">
        <div 
          className={`w-2 h-2 rounded-full transition-colors ${
            isActive ? 'bg-red-500 animate-pulse' : 'bg-zinc-600'
          }`}
          aria-label={isActive ? 'Microphone active' : 'Microphone inactive'}
        />
        <span className="text-sm text-zinc-400">
          {isActive ? 'Recording' : 'Inactive'}
        </span>
        {isActive && (
          <span className="text-xs text-zinc-500 ml-auto">
            {currentLevel.toFixed(0)}%
          </span>
        )}
      </div>

      {/* Audio Level Meter Canvas */}
      <canvas
        ref={canvasRef}
        width={300}
        height={24}
        className="w-full h-6 rounded"
        aria-label="Audio level meter"
      />

      {/* Level Description */}
      {isActive && (
        <div className="text-xs text-zinc-500">
          {currentLevel < 10 && 'Speak louder or move closer to microphone'}
          {currentLevel >= 10 && currentLevel < 30 && 'Good level'}
          {currentLevel >= 30 && currentLevel < 70 && 'Optimal level'}
          {currentLevel >= 70 && 'Very loud - may clip'}
        </div>
      )}
    </div>
  );
}
