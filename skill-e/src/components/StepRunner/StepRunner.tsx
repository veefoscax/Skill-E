/**
 * Step Runner Component
 * 
 * Displays individual step execution details with:
 * - Step instruction and status indicator
 * - Before/after screenshot comparison
 * - Action buttons (Retry, Skip, Edit)
 * - Error details and feedback
 * 
 * Requirements: FR-10.1, FR-10.7
 */

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Play, 
  SkipForward, 
  Edit3,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  AlertCircle,
  FastForward,
  Hand,
  Info,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SkillStep } from '@/lib/skill-parser';
import type { ExecutionScreenshot } from '@/lib/skill-executor';

/**
 * Props for StepRunner component
 */
export interface StepRunnerProps {
  /** The step to display */
  step: SkillStep;
  
  /** Screenshots for this step (before/after/error) */
  screenshots?: ExecutionScreenshot[];
  
  /** Whether the step is currently executing */
  isExecuting?: boolean;
  
  /** Whether actions are disabled (e.g., during processing) */
  actionsDisabled?: boolean;
  
  /** Callback when retry is requested */
  onRetry?: (step: SkillStep) => void;
  
  /** Callback when skip is requested */
  onSkip?: (step: SkillStep) => void;
  
  /** Callback when edit is requested */
  onEdit?: (step: SkillStep) => void;
  
  /** Optional className for styling */
  className?: string;
  
  /** Whether to show action buttons */
  showActions?: boolean;
  
  /** Whether to show screenshots */
  showScreenshots?: boolean;
}

/**
 * Status badge component
 */
function StatusBadge({ status }: { status: SkillStep['status'] }) {
  const config = React.useMemo(() => {
    switch (status) {
      case 'pending':
        return {
          icon: <Clock className="h-4 w-4" />,
          label: 'Pending',
          className: 'bg-muted text-muted-foreground',
        };
      case 'running':
        return {
          icon: <Loader2 className="h-4 w-4 animate-spin" />,
          label: 'Running',
          className: 'bg-primary/10 text-primary',
        };
      case 'success':
        return {
          icon: <CheckCircle2 className="h-4 w-4" />,
          label: 'Success',
          className: 'bg-green-500/10 text-green-600 dark:text-green-500',
        };
      case 'failed':
        return {
          icon: <XCircle className="h-4 w-4" />,
          label: 'Failed',
          className: 'bg-destructive/10 text-destructive',
        };
      case 'skipped':
        return {
          icon: <FastForward className="h-4 w-4" />,
          label: 'Skipped',
          className: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-500',
        };
      default:
        return {
          icon: <AlertCircle className="h-4 w-4" />,
          label: 'Unknown',
          className: 'bg-muted text-muted-foreground',
        };
    }
  }, [status]);
  
  return (
    <div className={cn(
      'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium',
      config.className
    )}>
      {config.icon}
      <span>{config.label}</span>
    </div>
  );
}

/**
 * Screenshot viewer component
 */
function ScreenshotViewer({ 
  screenshots,
  className,
}: { 
  screenshots: ExecutionScreenshot[];
  className?: string;
}) {
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [isZoomed, setIsZoomed] = React.useState(false);
  
  if (screenshots.length === 0) {
    return (
      <div className={cn(
        'flex items-center justify-center h-48 rounded-md border bg-muted/50',
        className
      )}>
        <div className="text-center space-y-2">
          <Info className="h-8 w-8 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">No screenshots available</p>
        </div>
      </div>
    );
  }
  
  const currentScreenshot = screenshots[selectedIndex];
  
  // Group screenshots by timing
  const beforeScreenshots = screenshots.filter(s => s.timing === 'before');
  const afterScreenshots = screenshots.filter(s => s.timing === 'after');
  const errorScreenshots = screenshots.filter(s => s.timing === 'error');
  
  return (
    <div className={cn('space-y-3', className)}>
      {/* Screenshot display */}
      <div className="relative rounded-md border overflow-hidden bg-muted/50">
        {currentScreenshot.data ? (
          <div className="relative">
            <img
              src={currentScreenshot.data}
              alt={`Screenshot ${currentScreenshot.timing}`}
              className={cn(
                'w-full h-auto transition-transform',
                isZoomed && 'scale-150 cursor-zoom-out',
                !isZoomed && 'cursor-zoom-in'
              )}
              onClick={() => setIsZoomed(!isZoomed)}
            />
            
            {/* Timing badge */}
            <div className="absolute top-2 left-2">
              <span className={cn(
                'inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium',
                currentScreenshot.timing === 'before' && 'bg-blue-500/90 text-white',
                currentScreenshot.timing === 'after' && 'bg-green-500/90 text-white',
                currentScreenshot.timing === 'error' && 'bg-destructive/90 text-white'
              )}>
                {currentScreenshot.timing.toUpperCase()}
              </span>
            </div>
            
            {/* Zoom button */}
            <button
              onClick={() => setIsZoomed(!isZoomed)}
              className="absolute top-2 right-2 p-2 rounded-md bg-background/90 hover:bg-background transition-colors"
              title={isZoomed ? 'Zoom out' : 'Zoom in'}
            >
              <ZoomIn className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center h-48">
            <p className="text-sm text-muted-foreground">Screenshot not available</p>
          </div>
        )}
      </div>
      
      {/* Navigation and info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Navigation buttons */}
          {screenshots.length > 1 && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedIndex(Math.max(0, selectedIndex - 1))}
                disabled={selectedIndex === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <span className="text-sm text-muted-foreground">
                {selectedIndex + 1} / {screenshots.length}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedIndex(Math.min(screenshots.length - 1, selectedIndex + 1))}
                disabled={selectedIndex === screenshots.length - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
        
        {/* Quick filters */}
        <div className="flex items-center gap-2">
          {beforeScreenshots.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedIndex(screenshots.indexOf(beforeScreenshots[0]))}
              className="text-xs"
            >
              Before ({beforeScreenshots.length})
            </Button>
          )}
          {afterScreenshots.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedIndex(screenshots.indexOf(afterScreenshots[0]))}
              className="text-xs"
            >
              After ({afterScreenshots.length})
            </Button>
          )}
          {errorScreenshots.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedIndex(screenshots.indexOf(errorScreenshots[0]))}
              className="text-xs"
            >
              Error ({errorScreenshots.length})
            </Button>
          )}
        </div>
      </div>
      
      {/* Description */}
      {currentScreenshot.description && (
        <p className="text-xs text-muted-foreground">
          {currentScreenshot.description}
        </p>
      )}
    </div>
  );
}

/**
 * StepRunner Component
 * 
 * Displays individual step execution details with status, screenshots,
 * and action buttons for retry, skip, and edit operations.
 */
export function StepRunner({
  step,
  screenshots = [],
  isExecuting = false,
  actionsDisabled = false,
  onRetry,
  onSkip,
  onEdit,
  className,
  showActions = true,
  showScreenshots = true,
}: StepRunnerProps) {
  // Filter screenshots for this step
  const stepScreenshots = React.useMemo(() => {
    return screenshots.filter(s => s.stepId === step.id);
  }, [screenshots, step.id]);
  
  // Determine if actions should be shown based on step status
  const canRetry = step.status === 'failed' && !isExecuting;
  const canSkip = (step.status === 'failed' || step.status === 'pending') && !isExecuting;
  const canEdit = step.status === 'failed' && !isExecuting;
  
  return (
    <div className={cn('flex flex-col gap-6 p-6 bg-card rounded-lg border', className)}>
      {/* Header: Step info and status */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold">
              Step {step.stepNumber || step.index + 1}
            </h3>
            {step.section && (
              <span className="text-sm text-muted-foreground">
                {step.section}
              </span>
            )}
            {step.requiresConfirmation && (
              <div className="flex items-center gap-1 text-yellow-600 dark:text-yellow-500">
                <Hand className="h-4 w-4" />
                <span className="text-xs font-medium">Requires Confirmation</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Action:</span>
            <code className="px-2 py-0.5 rounded bg-muted font-mono text-xs">
              {step.actionType}
            </code>
          </div>
        </div>
        
        <StatusBadge status={step.status} />
      </div>
      
      <Separator />
      
      {/* Instruction */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-foreground">Instruction</h4>
        <div className="p-4 rounded-md border bg-muted/50">
          <p className="text-sm leading-relaxed">{step.instruction}</p>
        </div>
      </div>
      
      {/* Target information */}
      {step.target && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-foreground">Target</h4>
          <div className="p-4 rounded-md border bg-card space-y-3">
            {step.target.selector && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Selector</p>
                <code className="block text-sm font-mono bg-muted px-3 py-2 rounded break-all">
                  {step.target.selector}
                </code>
              </div>
            )}
            
            {step.target.coordinates && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Coordinates</p>
                <code className="block text-sm font-mono bg-muted px-3 py-2 rounded">
                  x: {step.target.coordinates.x}, y: {step.target.coordinates.y}
                </code>
              </div>
            )}
            
            {step.target.description && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Description</p>
                <p className="text-sm">{step.target.description}</p>
              </div>
            )}
            
            {step.target.text && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Text</p>
                <code className="block text-sm font-mono bg-muted px-3 py-2 rounded break-all">
                  {step.target.text}
                </code>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Error details */}
      {step.error && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-destructive flex items-center gap-2">
            <XCircle className="h-4 w-4" />
            Error
          </h4>
          <div className="p-4 rounded-md border border-destructive/50 bg-destructive/10">
            <p className="text-sm text-destructive">{step.error}</p>
          </div>
        </div>
      )}
      
      {/* Feedback */}
      {step.feedback && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-foreground">Feedback</h4>
          <div className="p-4 rounded-md border bg-card">
            <p className="text-sm text-muted-foreground">{step.feedback}</p>
          </div>
        </div>
      )}
      
      {/* Screenshots */}
      {showScreenshots && stepScreenshots.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-foreground">Screenshots</h4>
          <ScreenshotViewer screenshots={stepScreenshots} />
        </div>
      )}
      
      {/* Action buttons */}
      {showActions && (canRetry || canSkip || canEdit) && (
        <>
          <Separator />
          
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Choose an action to continue
            </p>
            
            <div className="flex items-center gap-2">
              {canEdit && onEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(step)}
                  disabled={actionsDisabled}
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
              
              {canSkip && onSkip && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onSkip(step)}
                  disabled={actionsDisabled}
                >
                  <SkipForward className="h-4 w-4 mr-2" />
                  Skip
                </Button>
              )}
              
              {canRetry && onRetry && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => onRetry(step)}
                  disabled={actionsDisabled}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              )}
            </div>
          </div>
        </>
      )}
      
      {/* Executing indicator */}
      {isExecuting && (
        <div className="flex items-center justify-center gap-2 p-4 rounded-md bg-primary/10 text-primary">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm font-medium">Executing step...</span>
        </div>
      )}
    </div>
  );
}
