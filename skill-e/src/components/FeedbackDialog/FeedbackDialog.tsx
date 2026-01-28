import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertCircle,
  RefreshCw,
  SkipForward,
  Edit3,
  Hand,
  XCircle,
  Lightbulb,
  CheckCircle2,
} from 'lucide-react';
import type { SkillStep } from '@/lib/skill-parser';
import type { CategorizedError, RecoverySuggestion } from '@/lib/error-handler';
import { categorizeError, getErrorIcon, getErrorColor } from '@/lib/error-handler';

/**
 * Feedback Dialog Component
 * 
 * Shows error details and collects user feedback when a skill step fails.
 * Provides options to fix, skip, edit manually, or abort execution.
 * 
 * Requirements: FR-10.7
 */

export interface FeedbackDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  
  /** Callback when dialog should close */
  onOpenChange: (open: boolean) => void;
  
  /** The step that failed */
  step: SkillStep | null;
  
  /** Error information (optional, will be categorized if provided) */
  error?: string | Error;
  
  /** Pre-categorized error (optional, takes precedence over error) */
  categorizedError?: CategorizedError;
  
  /** Screenshot of the error state (optional) */
  errorScreenshot?: string;
  
  /** Callback when user chooses to retry with fix */
  onRetry: (feedback: string) => void;
  
  /** Callback when user chooses to skip step */
  onSkip: (feedback: string) => void;
  
  /** Callback when user chooses to edit step manually */
  onEdit: (feedback: string) => void;
  
  /** Callback when user chooses to complete step manually */
  onManual: (feedback: string) => void;
  
  /** Callback when user chooses to abort execution */
  onAbort: (feedback: string) => void;
  
  /** Whether an action is in progress */
  isProcessing?: boolean;
}

/**
 * Action button configuration
 */
interface ActionButton {
  label: string;
  icon: React.ReactNode;
  variant: 'default' | 'outline' | 'destructive' | 'secondary';
  action: 'retry' | 'skip' | 'edit' | 'manual' | 'abort';
  description: string;
}

/**
 * Get action buttons based on error category and suggestions
 */
function getActionButtons(
  categorizedError: CategorizedError,
  suggestions: RecoverySuggestion[]
): ActionButton[] {
  const buttons: ActionButton[] = [];
  
  // Map suggestions to buttons
  const suggestionActions = new Set(suggestions.map(s => s.action));
  
  // Retry button (if suggested and can retry)
  if (suggestionActions.has('retry') && categorizedError.canRetry) {
    const retrySuggestion = suggestions.find(s => s.action === 'retry');
    buttons.push({
      label: 'Retry',
      icon: <RefreshCw className="h-4 w-4" />,
      variant: 'default',
      action: 'retry',
      description: retrySuggestion?.text || 'Try executing the step again',
    });
  }
  
  // Edit button (if suggested)
  if (suggestionActions.has('edit')) {
    const editSuggestion = suggestions.find(s => s.action === 'edit');
    buttons.push({
      label: 'Edit Step',
      icon: <Edit3 className="h-4 w-4" />,
      variant: 'outline',
      action: 'edit',
      description: editSuggestion?.text || 'Modify the step instruction',
    });
  }
  
  // Manual button (if suggested)
  if (suggestionActions.has('manual')) {
    const manualSuggestion = suggestions.find(s => s.action === 'manual');
    buttons.push({
      label: 'Complete Manually',
      icon: <Hand className="h-4 w-4" />,
      variant: 'outline',
      action: 'manual',
      description: manualSuggestion?.text || 'Complete this step manually',
    });
  }
  
  // Skip button (if suggested)
  if (suggestionActions.has('skip')) {
    const skipSuggestion = suggestions.find(s => s.action === 'skip');
    buttons.push({
      label: 'Skip',
      icon: <SkipForward className="h-4 w-4" />,
      variant: 'secondary',
      action: 'skip',
      description: skipSuggestion?.text || 'Skip this step and continue',
    });
  }
  
  // Abort button (always available, but lower priority)
  if (suggestionActions.has('abort') || categorizedError.severity === 'critical') {
    buttons.push({
      label: 'Abort',
      icon: <XCircle className="h-4 w-4" />,
      variant: 'destructive',
      action: 'abort',
      description: 'Stop execution completely',
    });
  }
  
  return buttons;
}

export function FeedbackDialog({
  open,
  onOpenChange,
  step,
  error,
  categorizedError: providedCategorizedError,
  errorScreenshot,
  onRetry,
  onSkip,
  onEdit,
  onManual,
  onAbort,
  isProcessing = false,
}: FeedbackDialogProps) {
  const [feedback, setFeedback] = useState('');
  const [selectedSuggestion, setSelectedSuggestion] = useState<number | null>(null);
  
  // Categorize error if not provided
  const categorizedError = providedCategorizedError || 
    (step && error ? categorizeError(step, undefined, error) : null);
  
  // Reset state when dialog opens/closes or step changes
  useEffect(() => {
    if (open && step) {
      setFeedback('');
      setSelectedSuggestion(null);
    }
  }, [open, step?.id]);
  
  // Handle action button click
  const handleAction = (action: 'retry' | 'skip' | 'edit' | 'manual' | 'abort') => {
    const feedbackText = feedback.trim() || 
      (selectedSuggestion !== null && categorizedError?.suggestions[selectedSuggestion]?.text) || 
      'No feedback provided';
    
    switch (action) {
      case 'retry':
        onRetry(feedbackText);
        break;
      case 'skip':
        onSkip(feedbackText);
        break;
      case 'edit':
        onEdit(feedbackText);
        break;
      case 'manual':
        onManual(feedbackText);
        break;
      case 'abort':
        onAbort(feedbackText);
        break;
    }
  };
  
  // Handle suggestion selection
  const handleSuggestionClick = (index: number) => {
    setSelectedSuggestion(selectedSuggestion === index ? null : index);
    
    // Optionally pre-fill feedback with suggestion details
    if (selectedSuggestion !== index && categorizedError?.suggestions[index]?.details) {
      setFeedback(categorizedError.suggestions[index].details || '');
    }
  };
  
  if (!step || !categorizedError) {
    return null;
  }
  
  const actionButtons = getActionButtons(categorizedError, categorizedError.suggestions);
  const errorIcon = getErrorIcon(categorizedError.severity);
  const errorColor = getErrorColor(categorizedError.severity);
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span style={{ color: errorColor }}>{errorIcon}</span>
            Step Failed
          </DialogTitle>
          <DialogDescription>
            Step {step.index + 1} encountered an error. Review the details and choose how to proceed.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Step Information */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Failed Step</Label>
            <div className="p-3 rounded-md border bg-muted/50">
              <p className="text-sm font-mono">{step.instruction}</p>
              {step.section && (
                <p className="text-xs text-muted-foreground mt-1">
                  Section: {step.section}
                </p>
              )}
            </div>
          </div>

          {/* Error Details */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold flex items-center gap-2">
              <AlertCircle className="h-4 w-4" style={{ color: errorColor }} />
              What Went Wrong
            </Label>
            <div className="p-3 rounded-md border bg-card space-y-2">
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {categorizedError.category.replace(/_/g, ' ').toUpperCase()}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {categorizedError.userMessage}
                  </p>
                </div>
                <span 
                  className="text-xs px-2 py-1 rounded-full font-medium"
                  style={{ 
                    backgroundColor: `${errorColor}20`,
                    color: errorColor,
                  }}
                >
                  {categorizedError.severity}
                </span>
              </div>
              
              {/* Technical details (collapsible) */}
              <details className="text-xs">
                <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                  Technical Details
                </summary>
                <pre className="mt-2 p-2 rounded bg-muted text-xs overflow-x-auto">
                  {categorizedError.technicalDetails}
                </pre>
              </details>
            </div>
          </div>

          {/* Error Screenshot */}
          {errorScreenshot && (
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Error Screenshot</Label>
              <div className="rounded-md border overflow-hidden">
                <img 
                  src={errorScreenshot} 
                  alt="Error state" 
                  className="w-full h-auto"
                />
              </div>
            </div>
          )}

          {/* Recovery Suggestions */}
          {categorizedError.suggestions.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-yellow-500" />
                Suggestions
              </Label>
              <div className="space-y-2">
                {categorizedError.suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(index)}
                    className={`w-full p-3 rounded-md border text-left transition-colors ${
                      selectedSuggestion === index
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-card hover:bg-muted/50'
                    }`}
                    disabled={isProcessing}
                  >
                    <div className="flex items-start gap-2">
                      <CheckCircle2 
                        className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                          selectedSuggestion === index
                            ? 'text-primary'
                            : 'text-muted-foreground'
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{suggestion.text}</p>
                        {suggestion.details && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {suggestion.details}
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Priority: {suggestion.priority}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* User Feedback Input */}
          <div className="space-y-2">
            <Label htmlFor="feedback" className="text-sm font-semibold">
              Additional Feedback (Optional)
            </Label>
            <Textarea
              id="feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Describe what you observed or what should be changed..."
              className="min-h-[100px] resize-none"
              disabled={isProcessing}
            />
            <p className="text-xs text-muted-foreground">
              Your feedback will help improve the skill and may be used to automatically fix the step.
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {actionButtons.map((button) => (
            <Button
              key={button.action}
              variant={button.variant}
              onClick={() => handleAction(button.action)}
              disabled={isProcessing}
              className="w-full sm:w-auto"
              title={button.description}
            >
              {button.icon}
              <span className="ml-2">{button.label}</span>
            </Button>
          ))}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
