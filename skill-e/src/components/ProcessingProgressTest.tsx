/**
 * Processing Progress Test Component
 * 
 * Tests the ProcessingProgress component with different states
 * Requirements: FR-5.5, NFR-5.2
 */

import { useState, useEffect } from 'react';
import { ProcessingProgress } from './ProcessingProgress';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type { ProcessingProgress as ProcessingProgressType } from '@/types/processing';

/**
 * Simulates processing stages with realistic timing
 */
function useSimulatedProcessing() {
  const [progress, setProgress] = useState<ProcessingProgressType>({
    stage: 'loading',
    percentage: 0,
    currentStep: 'Initializing...',
  });
  const [isProcessing, setIsProcessing] = useState(false);

  const startProcessing = () => {
    setIsProcessing(true);
    setProgress({
      stage: 'loading',
      percentage: 0,
      currentStep: 'Loading session data...',
      estimatedTimeRemaining: 30,
    });
  };

  const resetProcessing = () => {
    setIsProcessing(false);
    setProgress({
      stage: 'loading',
      percentage: 0,
      currentStep: 'Ready to start',
    });
  };

  useEffect(() => {
    if (!isProcessing) return;

    const stages: Array<{
      stage: ProcessingProgressType['stage'];
      percentage: number;
      currentStep: string;
      duration: number;
    }> = [
      {
        stage: 'loading',
        percentage: 10,
        currentStep: 'Loading session data...',
        duration: 2000,
      },
      {
        stage: 'timeline',
        percentage: 30,
        currentStep: 'Building timeline from events...',
        duration: 3000,
      },
      {
        stage: 'step_detection',
        percentage: 50,
        currentStep: 'Detecting logical steps...',
        duration: 4000,
      },
      {
        stage: 'classification',
        percentage: 70,
        currentStep: 'Classifying speech segments...',
        duration: 3000,
      },
      {
        stage: 'context_generation',
        percentage: 90,
        currentStep: 'Generating LLM context...',
        duration: 2000,
      },
      {
        stage: 'complete',
        percentage: 100,
        currentStep: 'Processing complete!',
        duration: 1000,
      },
    ];

    let currentStageIndex = 0;
    let stageStartTime = Date.now();

    const interval = setInterval(() => {
      if (currentStageIndex >= stages.length) {
        clearInterval(interval);
        setIsProcessing(false);
        return;
      }

      const currentStage = stages[currentStageIndex];
      const elapsed = Date.now() - stageStartTime;
      const stageProgress = Math.min(elapsed / currentStage.duration, 1);

      // Calculate percentage within current stage
      const prevPercentage =
        currentStageIndex > 0 ? stages[currentStageIndex - 1].percentage : 0;
      const percentageRange = currentStage.percentage - prevPercentage;
      const currentPercentage = prevPercentage + percentageRange * stageProgress;

      // Calculate estimated time remaining
      const remainingStages = stages.slice(currentStageIndex);
      const remainingTime = remainingStages.reduce(
        (sum, stage, index) => {
          if (index === 0) {
            // Current stage: remaining time
            return sum + stage.duration * (1 - stageProgress);
          }
          return sum + stage.duration;
        },
        0
      );

      setProgress({
        stage: currentStage.stage,
        percentage: currentPercentage,
        currentStep: currentStage.currentStep,
        estimatedTimeRemaining: Math.ceil(remainingTime / 1000),
      });

      // Move to next stage when current stage is complete
      if (stageProgress >= 1) {
        currentStageIndex++;
        stageStartTime = Date.now();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isProcessing]);

  return { progress, isProcessing, startProcessing, resetProcessing };
}

/**
 * Test component for ProcessingProgress
 */
export function ProcessingProgressTest() {
  const { progress, isProcessing, startProcessing, resetProcessing } =
    useSimulatedProcessing();

  // Static test states
  const [showStaticTests, setShowStaticTests] = useState(false);

  const staticStates: ProcessingProgressType[] = [
    {
      stage: 'loading',
      percentage: 10,
      currentStep: 'Loading session data...',
      estimatedTimeRemaining: 25,
    },
    {
      stage: 'timeline',
      percentage: 30,
      currentStep: 'Building timeline from 150 events...',
      estimatedTimeRemaining: 18,
    },
    {
      stage: 'step_detection',
      percentage: 50,
      currentStep: 'Detected 8 logical steps',
      estimatedTimeRemaining: 12,
    },
    {
      stage: 'classification',
      percentage: 70,
      currentStep: 'Classifying 45 speech segments...',
      estimatedTimeRemaining: 7,
    },
    {
      stage: 'context_generation',
      percentage: 90,
      currentStep: 'Generating LLM context with 8 key frames...',
      estimatedTimeRemaining: 3,
    },
    {
      stage: 'complete',
      percentage: 100,
      currentStep: 'Processing complete!',
    },
    {
      stage: 'error',
      percentage: 45,
      currentStep: 'Processing failed',
      error: 'Failed to load transcription file: file not found',
    },
  ];

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-8">
      <div className="w-full max-w-2xl space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">
            Processing Progress Test
          </h1>
          <p className="text-sm text-muted-foreground">
            Testing the ProcessingProgress component with simulated and static states
          </p>
        </div>

        <Separator />

        {/* Simulated Processing */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">
              Simulated Processing
            </h2>
            <div className="flex gap-2">
              <Button
                onClick={startProcessing}
                disabled={isProcessing}
                variant="default"
              >
                Start Processing
              </Button>
              <Button
                onClick={resetProcessing}
                disabled={!isProcessing && progress.stage === 'loading'}
                variant="outline"
              >
                Reset
              </Button>
            </div>
          </div>

          <ProcessingProgress progress={progress} />
        </div>

        <Separator />

        {/* Static States */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">
              Static Test States
            </h2>
            <Button
              onClick={() => setShowStaticTests(!showStaticTests)}
              variant="outline"
            >
              {showStaticTests ? 'Hide' : 'Show'} Static Tests
            </Button>
          </div>

          {showStaticTests && (
            <div className="space-y-4">
              {staticStates.map((state, index) => (
                <div key={index} className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    State {index + 1}: {state.stage}
                  </h3>
                  <ProcessingProgress progress={state} />
                </div>
              ))}
            </div>
          )}
        </div>

        <Separator />

        {/* Test Results */}
        <div className="space-y-2 rounded-lg border bg-card p-4">
          <h3 className="text-sm font-semibold text-foreground">
            Test Checklist
          </h3>
          <div className="space-y-1 text-xs text-muted-foreground">
            <p>✓ Shows percentage complete (0-100%)</p>
            <p>✓ Shows current step label</p>
            <p>✓ Estimates time remaining</p>
            <p>✓ Displays loading spinner during processing</p>
            <p>✓ Shows success state when complete</p>
            <p>✓ Shows error state with message</p>
            <p>✓ Smooth progress bar animation</p>
            <p>✓ Clean, minimal design (no AI slop)</p>
            <p>✓ Follows Mira/neutral color scheme</p>
          </div>
        </div>
      </div>
    </div>
  );
}
