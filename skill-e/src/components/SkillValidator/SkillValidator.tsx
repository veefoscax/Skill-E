/**
 * SkillValidator Component
 * 
 * Main component for validating and testing skills step-by-step.
 * Provides a split-panel UI with step list, execution view, and
 * semantic quality scoring.
 * 
 * Requirements: FR-10.1, FR-10.14
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Clock,
  Shield,
  ChevronRight,
  Settings,
  Bug,
  Eye,
  Terminal,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { parseSkill, type ParsedSkill, type SkillStep } from '@/lib/skill-parser';
import { validateSkill, type ValidationResult } from '@/lib/skill-validator';
import { ExecutionSession, type ExecutionStats } from '@/lib/skill-executor';
import type { ExecutionConfig } from '@/lib/skill-executor';
import type { SemanticValidationResult } from '@/lib/semantic-judge';
import { StepRunner } from '@/components/StepRunner';
import { FeedbackDialog } from '@/components/FeedbackDialog';

export interface SkillValidatorProps {
  /** SKILL.md content to validate */
  skillMarkdown: string;
  
  /** Semantic validation result (optional, will skip if not provided) */
  semanticValidation?: SemanticValidationResult;
  
  /** Execution configuration */
  config?: Partial<ExecutionConfig>;
  
  /** Called when validation completes */
  onComplete?: (stats: ExecutionStats) => void;
  
  /** Called when user cancels */
  onCancel?: () => void;
  
  /** Called when a step fails with error */
  onStepError?: (step: SkillStep, error: string) => void;
  
  /** Called when skill is updated with fixes */
  onSkillUpdate?: (updatedMarkdown: string) => void;
  
  /** Optional className */
  className?: string;
}

/**
 * SkillValidator Component
 * 
 * Validates and executes skills step-by-step with a rich UI.
 */
export function SkillValidator({
  skillMarkdown,
  semanticValidation,
  config = {},
  onComplete,
  onCancel,
  onStepError,
  onSkillUpdate,
  className,
}: SkillValidatorProps) {
  // Parse skill on mount
  const [parsedSkill, setParsedSkill] = useState<ParsedSkill | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  
  // Execution state
  const [session, setSession] = useState<ExecutionSession | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [stepStatuses, setStepStatuses] = useState<Record<number, 'pending' | 'running' | 'success' | 'error' | 'skipped'>>({});
  const [isExecuting, setIsExecuting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [executionStats, setExecutionStats] = useState<ExecutionStats | null>(null);
  
  // Error handling
  const [currentError, setCurrentError] = useState<{ step: SkillStep; error: string } | null>(null);
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  
  // Settings
  const [showSettings, setShowSettings] = useState(false);
  const [executionConfig, setExecutionConfig] = useState<ExecutionConfig>({
    mode: 'hybrid',
    captureScreenshots: true,
    pauseOnError: true,
    pauseOnConfirmation: true,
    stepTimeout: 30000,
    continueOnFailure: false,
    maxRetries: 2,
    ...config,
  });
  
  // Timeline log
  const [timeline, setTimeline] = useState<Array<{ time: string; message: string; type: 'info' | 'success' | 'error' | 'warning' }>>([]);
  const timelineEndRef = useRef<HTMLDivElement>(null);
  
  // Parse skill on mount
  useEffect(() => {
    try {
      const parsed = parseSkill(skillMarkdown);
      setParsedSkill(parsed);
      
      const validation = validateSkill(skillMarkdown);
      setValidationResult(validation);
      
      // Initialize step statuses
      const statuses: Record<number, 'pending' | 'running' | 'success' | 'error' | 'skipped'> = {};
      parsed.steps.forEach((_, i) => {
        statuses[i] = 'pending';
      });
      setStepStatuses(statuses);
      
      addToTimeline('Skill parsed successfully', 'success');
    } catch (error) {
      setParseError(error instanceof Error ? error.message : 'Failed to parse skill');
      addToTimeline('Failed to parse skill', 'error');
    }
  }, [skillMarkdown]);
  
  // Auto-scroll timeline
  useEffect(() => {
    timelineEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [timeline]);
  
  const addToTimeline = useCallback((message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setTimeline(prev => [...prev, { time, message, type }]);
  }, []);
  
  // Start execution
  const handleStart = useCallback(async () => {
    if (!parsedSkill) return;
    
    addToTimeline('Starting execution session...', 'info');
    
    const newSession = new ExecutionSession(parsedSkill, executionConfig);
    setSession(newSession);
    setIsExecuting(true);
    setIsPaused(false);
    setCurrentStepIndex(0);
    
    // Set first step to running
    setStepStatuses((prev: Record<number, 'pending' | 'running' | 'success' | 'error' | 'skipped'>) => ({ ...prev, 0: 'running' }));
    
    // Execute steps
    try {
      for (let i = 0; i < parsedSkill.steps.length; i++) {
        setCurrentStepIndex(i);
        setStepStatuses((prev: Record<number, 'pending' | 'running' | 'success' | 'error' | 'skipped'>) => ({ ...prev, [i]: 'running' }));
        
        addToTimeline(`Executing step ${i + 1}: ${parsedSkill.steps[i].instruction}`, 'info');
        
        const result = await newSession.executeStep(parsedSkill.steps[i]);
        
        if (result.success) {
          setStepStatuses((prev: Record<number, 'pending' | 'running' | 'success' | 'error' | 'skipped'>) => ({ ...prev, [i]: 'success' }));
          addToTimeline(`Step ${i + 1} completed successfully`, 'success');
        } else if (result.needsHuman) {
          setStepStatuses((prev: Record<number, 'pending' | 'running' | 'success' | 'error' | 'skipped'>) => ({ ...prev, [i]: 'error' }));
          setCurrentError({ step: parsedSkill.steps[i], error: result.error || 'Step requires human intervention' });
          setShowFeedbackDialog(true);
          setIsPaused(true);
          
          if (onStepError) {
            onStepError(parsedSkill.steps[i], result.error || 'Human intervention required');
          }
          
          // Wait for user to handle
          return;
        } else {
          setStepStatuses((prev: Record<number, 'pending' | 'running' | 'success' | 'error' | 'skipped'>) => ({ ...prev, [i]: 'error' }));
          setCurrentError({ step: parsedSkill.steps[i], error: result.error || 'Step failed' });
          
          if (executionConfig.pauseOnError) {
            setShowFeedbackDialog(true);
            setIsPaused(true);
          }
          
          if (onStepError) {
            onStepError(parsedSkill.steps[i], result.error || 'Step failed');
          }
          
          if (!executionConfig.continueOnFailure) {
            return;
          }
        }
        
        // Check if paused
        if (newSession.isPaused()) {
          setIsPaused(true);
          return;
        }
      }
      
      // Complete
      const stats = newSession.getStats();
      setExecutionStats(stats);
      setIsExecuting(false);
      addToTimeline('Execution completed', 'success');
      
      if (onComplete) {
        onComplete(stats);
      }
    } catch (error) {
      addToTimeline(`Execution error: ${error instanceof Error ? error.message : String(error)}`, 'error');
      setIsExecuting(false);
    }
  }, [parsedSkill, executionConfig, onComplete, onStepError]);
  
  // Pause/Resume
  const handlePauseResume = useCallback(() => {
    if (!session) return;
    
    if (isPaused) {
      session.resume();
      setIsPaused(false);
      addToTimeline('Execution resumed', 'info');
    } else {
      session.pause();
      setIsPaused(true);
      addToTimeline('Execution paused', 'warning');
    }
  }, [session, isPaused]);
  
  // Cancel
  const handleCancel = useCallback(() => {
    if (session) {
      session.cancel();
    }
    setIsExecuting(false);
    setIsPaused(false);
    addToTimeline('Execution cancelled', 'warning');
    
    if (onCancel) {
      onCancel();
    }
  }, [session, onCancel]);
  
  // Reset
  const handleReset = useCallback(() => {
    setSession(null);
    setCurrentStepIndex(-1);
    setIsExecuting(false);
    setIsPaused(false);
    setExecutionStats(null);
    setCurrentError(null);
    setShowFeedbackDialog(false);
    
    // Reset step statuses
    if (parsedSkill) {
      const statuses: Record<number, 'pending' | 'running' | 'success' | 'error' | 'skipped'> = {};
      parsedSkill.steps.forEach((_, i) => {
        statuses[i] = 'pending';
      });
      setStepStatuses(statuses);
    }
    
    setTimeline([]);
    addToTimeline('Session reset', 'info');
  }, [parsedSkill]);
  
  // Handle feedback dialog close
  const handleFeedbackClose = useCallback(() => {
    setShowFeedbackDialog(false);
  }, []);
  
  // Handle step fix
  const handleStepFix = useCallback((fixedStep: SkillStep) => {
    if (!parsedSkill || currentStepIndex < 0) return;
    
    // Update the step in the skill
    const updatedSteps = [...parsedSkill.steps];
    updatedSteps[currentStepIndex] = fixedStep;
    
    const updatedSkill = {
      ...parsedSkill,
      steps: updatedSteps,
    };
    
    setParsedSkill(updatedSkill);
    
    // Generate updated markdown
    const updatedMarkdown = generateSkillMarkdown(updatedSkill);
    
    if (onSkillUpdate) {
      onSkillUpdate(updatedMarkdown);
    }
    
    addToTimeline(`Step ${currentStepIndex + 1} updated with fix`, 'success');
    
    // Retry the step
    setShowFeedbackDialog(false);
    setIsPaused(false);
    
    // Continue execution
    if (session) {
      session.resume();
    }
  }, [parsedSkill, currentStepIndex, session, onSkillUpdate]);
  
  // Generate markdown from parsed skill
  const generateSkillMarkdown = (skill: ParsedSkill): string => {
    const lines: string[] = [];
    
    // Frontmatter
    lines.push('---');
    lines.push(`name: ${skill.name}`);
    lines.push(`description: ${skill.description}`);
    if (skill.version) lines.push(`version: ${skill.version}`);
    if (skill.author) lines.push(`author: ${skill.author}`);
    if (skill.created) lines.push(`created: ${skill.created}`);
    lines.push('---');
    lines.push('');
    
    // Title
    lines.push(`# ${skill.title || skill.name}`);
    lines.push('');
    
    // Parameters
    if (skill.parameters && skill.parameters.length > 0) {
      lines.push('## Parameters');
      lines.push('');
      lines.push('| Parameter | Type | Required | Description |');
      lines.push('|-----------|------|----------|-------------|');
      skill.parameters.forEach(param => {
        lines.push(`| \`${param.name}\` | ${param.type} | ${param.required ? 'Yes' : 'No'} | ${param.description} |`);
      });
      lines.push('');
    }
    
    // Instructions
    lines.push('## Instructions');
    lines.push('');
    
    skill.steps.forEach((step, i) => {
      lines.push(`### Step ${i + 1}: ${step.instruction.slice(0, 50)}${step.instruction.length > 50 ? '...' : ''}`);
      lines.push('');
      lines.push(`1. ${step.instruction}`);
      if (step.target) {
        lines.push(`   - Target: ${step.target}`);
      }
      lines.push('');
    });
    
    return lines.join('\n');
  };
  
  // Get progress percentage
  const getProgress = () => {
    if (!parsedSkill) return 0;
    const completed = Object.values(stepStatuses).filter(s => s === 'success' || s === 'error' || s === 'skipped').length;
    return (completed / parsedSkill.steps.length) * 100;
  };
  
  // Get status counts
  const getStatusCounts = () => {
    const statuses = Object.values(stepStatuses);
    return {
      pending: statuses.filter(s => s === 'pending').length,
      running: statuses.filter(s => s === 'running').length,
      success: statuses.filter(s => s === 'success').length,
      error: statuses.filter(s => s === 'error').length,
      skipped: statuses.filter(s => s === 'skipped').length,
    };
  };
  
  if (parseError) {
    return (
      <div className={cn("flex flex-col items-center justify-center h-full p-8", className)}>
        <AlertCircle className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-xl font-semibold mb-2">Failed to Parse Skill</h2>
        <p className="text-muted-foreground text-center max-w-md">{parseError}</p>
        <Button variant="outline" className="mt-4" onClick={onCancel}>
          <X className="h-4 w-4 mr-2" />
          Close
        </Button>
      </div>
    );
  }
  
  if (!parsedSkill) {
    return (
      <div className={cn("flex items-center justify-center h-full", className)}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }
  
  const counts = getStatusCounts();
  const progress = getProgress();
  
  return (
    <TooltipProvider>
      <div className={cn("flex flex-col h-full bg-background", className)}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-lg font-semibold">{parsedSkill.name}</h1>
              <p className="text-sm text-muted-foreground">{parsedSkill.description}</p>
            </div>
            
            {/* Quality Badge */}
            {semanticValidation && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge 
                    variant={semanticValidation.isVerified ? "default" : "secondary"}
                    className={cn(
                      "gap-1 cursor-help",
                      semanticValidation.isVerified && "bg-green-600 hover:bg-green-700"
                    )}
                  >
                    <Shield className="h-3 w-3" />
                    {semanticValidation.isVerified ? 'Verified' : `${semanticValidation.score}/100`}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="w-64">
                  <div className="space-y-2">
                    <div className="font-semibold">Quality Score: {semanticValidation.score}/100</div>
                    <div className="text-xs space-y-1">
                      <div className="flex justify-between">
                        <span>Safety:</span>
                        <span>{semanticValidation.dimensions.safety}/100</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Clarity:</span>
                        <span>{semanticValidation.dimensions.clarity}/100</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Completeness:</span>
                        <span>{semanticValidation.dimensions.completeness}/100</span>
                      </div>
                    </div>
                    {semanticValidation.strengths.length > 0 && (
                      <div className="text-xs">
                        <div className="font-medium text-green-500">Strengths:</div>
                        <ul className="mt-1 space-y-0.5">
                          {semanticValidation.strengths.slice(0, 2).map((s, i) => (
                            <li key={i}>• {s}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            )}
            
            {/* Validation Errors */}
            {validationResult && !validationResult.valid && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="destructive" className="gap-1 cursor-help">
                    <AlertCircle className="h-3 w-3" />
                    {validationResult.errors.length} Errors
                  </Badge>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <ul className="text-xs space-y-1">
                    {validationResult.errors.map((err, i) => (
                      <li key={i}>• {typeof err === 'string' ? err : err.message}</li>
                    ))}
                  </ul>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {/* Settings */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(true)}
            >
              <Settings className="h-4 w-4" />
            </Button>
            
            {/* Cancel */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="px-4 py-2 border-b bg-muted/30">
          <div className="flex items-center gap-4">
            <Progress value={progress} className="flex-1" />
            <span className="text-sm text-muted-foreground min-w-[100px] text-right">
              {counts.success}/{parsedSkill.steps.length} steps
            </span>
          </div>
          
          {/* Status Counts */}
          <div className="flex items-center gap-4 mt-2 text-xs">
            <span className="text-muted-foreground">Status:</span>
            {counts.pending > 0 && <Badge variant="outline" className="text-xs">{counts.pending} Pending</Badge>}
            {counts.running > 0 && <Badge variant="secondary" className="text-xs">{counts.running} Running</Badge>}
            {counts.success > 0 && <Badge variant="default" className="bg-green-600 text-xs">{counts.success} Success</Badge>}
            {counts.error > 0 && <Badge variant="destructive" className="text-xs">{counts.error} Error</Badge>}
            {counts.skipped > 0 && <Badge variant="outline" className="text-xs">{counts.skipped} Skipped</Badge>}
          </div>
        </div>
        
        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Step List */}
          <div className="w-80 border-r bg-muted/20 overflow-y-auto">
            <div className="p-3">
              <h3 className="text-sm font-medium mb-3">Steps</h3>
              <div className="space-y-2">
                {parsedSkill.steps.map((step, index) => {
                  const status = stepStatuses[index] || 'pending';
                  const isActive = index === currentStepIndex;
                  
                  return (
                    <Card
                      key={index}
                      className={cn(
                        "p-3 cursor-pointer transition-colors",
                        isActive && "border-primary ring-1 ring-primary",
                        status === 'success' && "border-green-500/50 bg-green-50/50",
                        status === 'error' && "border-destructive/50 bg-destructive/5",
                        status === 'running' && "border-yellow-500/50 bg-yellow-50/50",
                        !isActive && status === 'pending' && "hover:bg-muted"
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <div className="mt-0.5">
                          {status === 'pending' && <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />}
                          {status === 'running' && <div className="h-4 w-4 rounded-full border-2 border-yellow-500 border-t-transparent animate-spin" />}
                          {status === 'success' && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                          {status === 'error' && <AlertCircle className="h-4 w-4 text-destructive" />}
                          {status === 'skipped' && <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/50 border-dashed" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">
                            Step {index + 1}
                          </div>
                          <div className="text-xs text-muted-foreground line-clamp-2">
                            {step.instruction}
                          </div>
                          {step.actionType !== 'unknown' && (
                            <Badge variant="outline" className="mt-1 text-[10px] h-4">
                              {step.actionType}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
          
          {/* Right Panel - Execution View */}
          <div className="flex-1 flex flex-col min-w-0">
            {currentStepIndex >= 0 && parsedSkill.steps[currentStepIndex] ? (
              <StepRunner
                step={parsedSkill.steps[currentStepIndex]}
                isExecuting={stepStatuses[currentStepIndex] === 'running'}
                onRetry={(step) => {
                  handleStart();
                }}
                onSkip={(step) => {
                  setStepStatuses((prev: Record<number, 'pending' | 'running' | 'success' | 'error' | 'skipped'>) => ({ ...prev, [currentStepIndex]: 'skipped' }));
                  // Continue to next step
                }}
                onEdit={(step) => {
                  // TODO: Open step editor
                  console.log('Edit step:', step);
                }}
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8">
                {!isExecuting && !executionStats && (
                  <>
                    <Sparkles className="h-16 w-16 text-muted-foreground/50 mb-4" />
                    <h2 className="text-xl font-semibold mb-2">Ready to Validate</h2>
                    <p className="text-muted-foreground text-center max-w-md mb-6">
                      This skill has {parsedSkill.steps.length} steps. 
                      Click Start to begin execution.
                    </p>
                    <div className="flex gap-2">
                      <Button onClick={handleStart}>
                        <Play className="h-4 w-4 mr-2" />
                        Start Validation
                      </Button>
                    </div>
                    
                    {/* Semantic Validation Preview */}
                    {semanticValidation && (
                      <Card className="mt-8 p-4 max-w-md w-full">
                        <div className="flex items-center gap-2 mb-3">
                          <Shield className={cn(
                            "h-5 w-5",
                            semanticValidation.isVerified ? "text-green-600" : "text-muted-foreground"
                          )} />
                          <span className="font-medium">Quality Assessment</span>
                        </div>
                        <div className="text-2xl font-bold mb-1">
                          {semanticValidation.score}/100
                        </div>
                        <div className="text-sm text-muted-foreground mb-3">
                          {semanticValidation.isVerified 
                            ? 'This skill is production-ready' 
                            : 'This skill needs improvement before production use'}
                        </div>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span>Safety</span>
                            <span className={cn(
                              semanticValidation.dimensions.safety >= 90 ? "text-green-600" : "text-muted-foreground"
                            )}>
                              {semanticValidation.dimensions.safety}/100
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Clarity</span>
                            <span className={cn(
                              semanticValidation.dimensions.clarity >= 90 ? "text-green-600" : "text-muted-foreground"
                            )}>
                              {semanticValidation.dimensions.clarity}/100
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Completeness</span>
                            <span className={cn(
                              semanticValidation.dimensions.completeness >= 90 ? "text-green-600" : "text-muted-foreground"
                            )}>
                              {semanticValidation.dimensions.completeness}/100
                            </span>
                          </div>
                        </div>
                      </Card>
                    )}
                  </>
                )}
                
                {executionStats && (
                  <>
                    <CheckCircle2 className="h-16 w-16 text-green-600 mb-4" />
                    <h2 className="text-xl font-semibold mb-2">Validation Complete</h2>
                    <div className="text-center mb-6">
                      <p className="text-muted-foreground">
                        Completed {executionStats.completedSteps} of {executionStats.totalSteps} steps
                      </p>
                      <p className="text-2xl font-bold mt-2">
                        {Math.round(executionStats.successRate * 100)}% Success Rate
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleReset}>
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Run Again
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}
            
            {/* Timeline */}
            <div className="border-t bg-muted/20 p-3 h-48 overflow-y-auto">
              <div className="flex items-center gap-2 mb-2 text-xs font-medium text-muted-foreground">
                <Terminal className="h-3 w-3" />
                Execution Log
              </div>
              <div className="space-y-1 font-mono text-xs">
                {timeline.map((entry, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="text-muted-foreground">[{entry.time}]</span>
                    <span className={cn(
                      entry.type === 'success' && "text-green-600",
                      entry.type === 'error' && "text-destructive",
                      entry.type === 'warning' && "text-yellow-600",
                    )}>
                      {entry.message}
                    </span>
                  </div>
                ))}
                <div ref={timelineEndRef} />
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer Controls */}
        <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/20">
          <div className="flex items-center gap-2">
            {isExecuting && (
              <Button
                variant={isPaused ? "default" : "secondary"}
                size="sm"
                onClick={handlePauseResume}
              >
                {isPaused ? (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Resume
                  </>
                ) : (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    Pause
                  </>
                )}
              </Button>
            )}
            
            {!isExecuting && currentStepIndex >= 0 && !executionStats && (
              <Button variant="outline" size="sm" onClick={handleStart}>
                <Play className="h-4 w-4 mr-2" />
                Resume
              </Button>
            )}
            
            {!isExecuting && executionStats && (
              <Button variant="outline" size="sm" onClick={handleReset}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            )}
          </div>
          
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Mode:</span>
            <Badge variant="outline" className="text-xs capitalize">
              {executionConfig.mode}
            </Badge>
            {executionConfig.pauseOnError && (
              <Badge variant="outline" className="text-xs">
                <Bug className="h-3 w-3 mr-1" />
                Pause on Error
              </Badge>
            )}
            {executionConfig.captureScreenshots && (
              <Badge variant="outline" className="text-xs">
                <Eye className="h-3 w-3 mr-1" />
                Screenshots
              </Badge>
            )}
          </div>
        </div>
        
        {/* Feedback Dialog */}
        {currentError && (
          <FeedbackDialog
            open={showFeedbackDialog}
            onOpenChange={setShowFeedbackDialog}
            step={currentError.step}
            error={currentError.error}
            onRetry={(feedback) => {
              setShowFeedbackDialog(false);
              setIsPaused(false);
              if (session) session.resume();
            }}
            onSkip={(feedback) => {
              setStepStatuses((prev: Record<number, 'pending' | 'running' | 'success' | 'error' | 'skipped'>) => ({ ...prev, [currentStepIndex]: 'skipped' }));
              setShowFeedbackDialog(false);
              setIsPaused(false);
              if (session) session.resume();
            }}
            onEdit={(feedback) => {
              // TODO: Open step editor
              setShowFeedbackDialog(false);
            }}
            onManual={(feedback) => {
              setStepStatuses((prev: Record<number, 'pending' | 'running' | 'success' | 'error' | 'skipped'>) => ({ ...prev, [currentStepIndex]: 'success' }));
              setShowFeedbackDialog(false);
              setIsPaused(false);
              if (session) session.resume();
            }}
            onAbort={(feedback) => {
              handleCancel();
            }}
          />
        )}
        
        {/* Settings Dialog */}
        <Dialog open={showSettings} onOpenChange={setShowSettings}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Execution Settings</DialogTitle>
              <DialogDescription>
                Configure how the skill validation runs
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium">Execution Mode</label>
                <select
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={executionConfig.mode}
                  onChange={(e) => setExecutionConfig((prev: ExecutionConfig) => ({ ...prev, mode: e.target.value as 'dom' | 'image' | 'hybrid' }))}
                >
                  <option value="hybrid">Hybrid (DOM + Image fallback)</option>
                  <option value="dom">DOM Only</option>
                  <option value="image">Image Only</option>
                </select>
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="pauseOnError"
                  checked={executionConfig.pauseOnError}
                  onChange={(e) => setExecutionConfig((prev: ExecutionConfig) => ({ ...prev, pauseOnError: e.target.checked }))}
                />
                <label htmlFor="pauseOnError" className="text-sm">Pause on error</label>
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="pauseOnConfirmation"
                  checked={executionConfig.pauseOnConfirmation}
                  onChange={(e) => setExecutionConfig((prev: ExecutionConfig) => ({ ...prev, pauseOnConfirmation: e.target.checked }))}
                />
                <label htmlFor="pauseOnConfirmation" className="text-sm">Pause at confirmation points</label>
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="captureScreenshots"
                  checked={executionConfig.captureScreenshots}
                  onChange={(e) => setExecutionConfig((prev: ExecutionConfig) => ({ ...prev, captureScreenshots: e.target.checked }))}
                />
                <label htmlFor="captureScreenshots" className="text-sm">Capture screenshots</label>
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowSettings(false)}>
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
