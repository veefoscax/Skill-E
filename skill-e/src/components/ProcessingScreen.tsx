/**
 * ProcessingScreen - Shows AI processing progress
 * 
 * Connects recording data to processing pipeline and generates SKILL.md
 */

import { useEffect, useState } from 'react';
import { Loader2, Mic, Brain, FileText, CheckCircle, X, AlertCircle, Clock, Settings, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { processRecordingAndGenerateSkill, processRecordingMock, ProcessingResult } from '@/lib/processing-bridge';
import type { ProcessingProgress } from '@/types/processing';
import { useRecordingStore } from '@/stores/recording';
import { useOverlayStore } from '@/stores/overlay';
import { useSettingsStore } from '@/stores/settings';
import { OPENCLAW_PROVIDERS } from '@/lib/models-config.providers';
import { ModelSelector } from './shared/ModelSelector';
import { COLORS } from '@/stores/overlay';

interface ProcessingScreenProps {
  onComplete: (skillMarkdown: string) => void;
  onCancel: () => void;
}

export function ProcessingScreen({ onComplete, onCancel }: ProcessingScreenProps) {
  const [progress, setProgress] = useState<ProcessingProgress>({
    stage: 'loading',
    percentage: 0,
    currentStep: 'Initializing...'
  });
  const [isProcessing, setIsProcessing] = useState(true);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [startTime] = useState(Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);

  // Settings for retry
  const settings = useSettingsStore();

  // Update elapsed time
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  // Start processing
  useEffect(() => {
    if (!isProcessing) return;

    const process = async () => {
      try {
        // Get annotations from stores
        const recordingSteps = useRecordingStore.getState().steps;
        const overlayState = useOverlayStore.getState();

        // Convert recording steps to click indicators
        const clicks = recordingSteps
          .filter(s => s.type === 'click' && s.data?.position)
          .map((s, i) => ({
            id: s.id,
            number: i + 1,
            position: s.data!.position!,
            color: COLORS.COLOR_1, // Default color
            timestamp: s.timestamp,
            fadeState: 'visible' as const
          }));

        const annotations = {
          clicks: clicks,
          drawings: overlayState.drawings || [],
          selectedElements: overlayState.selectedElements || [],
          keyboardInputs: []
        };

        // Try real processing first
        let processingResult: ProcessingResult;

        try {
          processingResult = await processRecordingAndGenerateSkill(
            { annotations },
            setProgress
          );
        } catch (error) {
          console.warn('Real processing failed, falling back to mock:', error);
          processingResult = await processRecordingMock(setProgress);
        }

        setResult(processingResult);
        setIsProcessing(false);

        if (processingResult.success && processingResult.skillMarkdown) {
          setTimeout(() => {
            onComplete(processingResult.skillMarkdown!);
          }, 800);
        }

      } catch (error) {
        console.error('Processing error:', error);
        setProgress({
          stage: 'error',
          percentage: 0,
          currentStep: 'Processing failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        setIsProcessing(false);
      }
    };

    process();
  }, [isProcessing, onComplete]);

  const handleCancel = () => {
    setIsProcessing(false);
    onCancel();
  };

  const handleRetry = () => {
    setProgress({
      stage: 'loading',
      percentage: 0,
      currentStep: 'Initializing...'
    });
    setResult(null);
    setIsProcessing(true);
  };

  const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newProvider = e.target.value;
    const config = OPENCLAW_PROVIDERS[newProvider];

    // Update settings in store
    settings.setLlmProvider(newProvider as any);
    settings.setLlmBaseUrl(config.baseUrl);
    // Let ModelSelector handle model selection default logic implicitly or we set default here
    settings.setLlmModel(config.defaultModel);

    // Ensure API key logic
    if (newProvider === 'ollama') {
      if (!settings.llmApiKey) settings.setLlmApiKey('ollama');
    }
  };

  const getStageIcon = () => {
    switch (progress.stage) {
      case 'timeline': return <Mic className="w-8 h-8 text-blue-500" />;
      case 'step_detection': return <Brain className="w-8 h-8 text-purple-500" />;
      case 'classification':
      case 'ocr':
      case 'context_generation': return <FileText className="w-8 h-8 text-green-500" />;
      case 'complete': return <CheckCircle className="w-8 h-8 text-green-500" />;
      case 'error': return <AlertCircle className="w-8 h-8 text-red-500" />;
      default: return <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />;
    }
  };

  const getStageTitle = () => {
    switch (progress.stage) {
      case 'loading': return 'Loading Recording...';
      case 'classification': return 'Classifying Speech';
      case 'timeline': return 'Building Timeline...';
      case 'step_detection': return 'Detecting Steps';
      case 'ocr': return 'Extracting Text';
      case 'context_generation': return 'Generating SKILL.md';
      case 'complete': return 'Complete!';
      case 'error': return 'Processing Error';
      default: return 'Processing...';
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-gray-900 flex items-center justify-center p-8">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            {getStageIcon()}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {getStageTitle()}
              </h1>
              <p className="text-gray-500">{progress.currentStep}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-gray-500">
            <Clock className="w-4 h-4" />
            <span className="font-mono">{formatTime(elapsedTime)}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <Progress value={progress.percentage} className="h-3" />
          <div className="flex justify-between text-sm text-gray-500 mt-2">
            <span>{Math.round(progress.percentage)}%</span>
            {result && result.processingTime > 0 && (
              <span>Processed in {(result.processingTime / 1000).toFixed(1)}s</span>
            )}
          </div>
        </div>

        {/* Status Details */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Stage:</span>
              <span className="ml-2 font-medium capitalize">{progress.stage.replace('_', ' ')}</span>
            </div>
            <div>
              <span className="text-gray-500">Status:</span>
              <span className={`ml-2 font-medium ${progress.stage === 'error' ? 'text-red-600' : progress.stage === 'complete' ? 'text-green-600' : 'text-blue-600'}`}>
                {progress.stage === 'error' ? 'Failed' : progress.stage === 'complete' ? 'Done' : 'In Progress'}
              </span>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {progress.error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800 text-sm font-semibold mb-2">Error Details:</p>
            <p className="text-red-800 text-sm">{progress.error}</p>

            <div className='mt-4 pt-4 border-t border-red-200'>
              <div className="flex items-center gap-2 mb-2 text-red-900 font-medium">
                <Settings className='w-4 h-4' />
                <span>Change LLM Provider & Retry</span>
              </div>

              {/* Provider Selector */}
              <select
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm p-2 mb-2"
                value={settings.llmProvider}
                onChange={handleProviderChange}
              >
                {Object.entries(OPENCLAW_PROVIDERS).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.label}
                  </option>
                ))}
              </select>

              {/* Shared Model Selector */}
              <div className="mt-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Model / Endpoint</label>
                <ModelSelector
                  provider={settings.llmProvider}
                  baseUrl={settings.llmBaseUrl}
                  apiKey={settings.llmApiKey}
                  value={settings.llmModel}
                  onChange={settings.setLlmModel}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Selected: {settings.llmProvider} ({settings.llmBaseUrl})
              </p>
            </div>
          </div>
        )}

        {/* Processing Indicator */}
        {progress.stage !== 'complete' && progress.stage !== 'error' && (
          <div className="flex items-center gap-2 text-sm text-gray-500 justify-center">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>AI is analyzing your recording...</span>
          </div>
        )}

        {/* Actions */}
        {progress.stage === 'error' && (
          <div className="flex gap-3 justify-end mt-6">
            <Button variant="outline" onClick={handleCancel}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleRetry} className="bg-blue-600 hover:bg-blue-700">
              <Loader2 className="w-4 h-4 mr-2" />
              Retry Generation
            </Button>
          </div>
        )}

        {/* Cancel button during processing */}
        {progress.stage !== 'complete' && progress.stage !== 'error' && (
          <div className="flex justify-center mt-6">
            <Button variant="outline" onClick={handleCancel}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
