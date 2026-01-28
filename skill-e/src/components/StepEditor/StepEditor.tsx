/**
 * Step Editor Component
 * 
 * Provides inline editing for individual skill steps with:
 * - Editable instruction text
 * - Target selector/coordinate editing
 * - Save and re-run functionality
 * - Validation feedback
 * 
 * Requirements: FR-10.8
 */

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Save, 
  X, 
  Play, 
  AlertCircle,
  CheckCircle2,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SkillStep } from '@/lib/skill-parser';

export interface StepEditorProps {
  /** The step to edit */
  step: SkillStep;
  /** Optional className for styling */
  className?: string;
  /** Callback when step is saved */
  onSave?: (updatedStep: SkillStep) => void;
  /** Callback when editing is cancelled */
  onCancel?: () => void;
  /** Callback when re-run is requested */
  onRerun?: (step: SkillStep) => void;
  /** Whether the editor is in read-only mode */
  readOnly?: boolean;
  /** Whether to show the re-run button */
  showRerun?: boolean;
}

/**
 * Validation result for step edits
 */
interface ValidationResult {
  valid: boolean;
  warnings: string[];
  errors: string[];
}

/**
 * StepEditor Component
 * 
 * Provides inline editing for skill steps with validation and re-run capability.
 */
export function StepEditor({
  step,
  className,
  onSave,
  onCancel,
  onRerun,
  readOnly = false,
  showRerun = true,
}: StepEditorProps) {
  // Editor state
  const [instruction, setInstruction] = React.useState(step.instruction);
  const [selector, setSelector] = React.useState(step.target?.selector || '');
  const [coordinatesX, setCoordinatesX] = React.useState(
    step.target?.coordinates?.x?.toString() || ''
  );
  const [coordinatesY, setCoordinatesY] = React.useState(
    step.target?.coordinates?.y?.toString() || ''
  );
  const [description, setDescription] = React.useState(step.target?.description || '');
  const [text, setText] = React.useState(step.target?.text || '');
  const [hasChanges, setHasChanges] = React.useState(false);
  const [validation, setValidation] = React.useState<ValidationResult>({
    valid: true,
    warnings: [],
    errors: [],
  });
  
  /**
   * Check if any field has changed
   */
  React.useEffect(() => {
    const changed = 
      instruction !== step.instruction ||
      selector !== (step.target?.selector || '') ||
      coordinatesX !== (step.target?.coordinates?.x?.toString() || '') ||
      coordinatesY !== (step.target?.coordinates?.y?.toString() || '') ||
      description !== (step.target?.description || '') ||
      text !== (step.target?.text || '');
    
    setHasChanges(changed);
    
    // Validate on change
    if (changed) {
      validateStep();
    }
  }, [instruction, selector, coordinatesX, coordinatesY, description, text, step]);
  
  /**
   * Validate the edited step
   */
  const validateStep = React.useCallback(() => {
    const warnings: string[] = [];
    const errors: string[] = [];
    
    // Check instruction
    if (!instruction.trim()) {
      errors.push('Instruction cannot be empty');
    } else if (instruction.length < 10) {
      warnings.push('Instruction is very short');
    } else if (instruction.length > 500) {
      warnings.push('Instruction is very long');
    }
    
    // Check coordinates
    if (coordinatesX || coordinatesY) {
      const x = parseInt(coordinatesX, 10);
      const y = parseInt(coordinatesY, 10);
      
      if (isNaN(x) || isNaN(y)) {
        errors.push('Coordinates must be valid numbers');
      } else if (x < 0 || y < 0) {
        errors.push('Coordinates cannot be negative');
      } else if (x > 10000 || y > 10000) {
        warnings.push('Coordinates seem unusually large');
      }
    }
    
    // Check if both selector and coordinates are provided
    if (selector && (coordinatesX || coordinatesY)) {
      warnings.push('Both selector and coordinates provided - selector will be tried first');
    }
    
    // Check for dangerous patterns
    const dangerousPatterns = [
      /delete|remove|destroy/i,
      /format|wipe|erase/i,
      /sudo|admin|root/i,
    ];
    
    for (const pattern of dangerousPatterns) {
      if (pattern.test(instruction) && !pattern.test(step.instruction)) {
        warnings.push('Instruction contains potentially dangerous operations');
        break;
      }
    }
    
    setValidation({
      valid: errors.length === 0,
      warnings,
      errors,
    });
  }, [instruction, selector, coordinatesX, coordinatesY, step.instruction]);
  
  /**
   * Build updated step from form values
   */
  const buildUpdatedStep = React.useCallback((): SkillStep => {
    const updatedStep: SkillStep = {
      ...step,
      instruction: instruction.trim(),
      status: 'pending', // Reset status for re-run
      error: undefined, // Clear previous error
    };
    
    // Build target object
    const target: SkillStep['target'] = {};
    
    if (selector) {
      target.selector = selector.trim();
    }
    
    if (coordinatesX && coordinatesY) {
      const x = parseInt(coordinatesX, 10);
      const y = parseInt(coordinatesY, 10);
      if (!isNaN(x) && !isNaN(y)) {
        target.coordinates = { x, y };
      }
    }
    
    if (description) {
      target.description = description.trim();
    }
    
    if (text) {
      target.text = text.trim();
    }
    
    // Only set target if it has properties
    if (Object.keys(target).length > 0) {
      updatedStep.target = target;
    }
    
    return updatedStep;
  }, [step, instruction, selector, coordinatesX, coordinatesY, description, text]);
  
  /**
   * Handle save
   */
  const handleSave = React.useCallback(() => {
    if (!validation.valid) {
      return;
    }
    
    const updatedStep = buildUpdatedStep();
    onSave?.(updatedStep);
  }, [validation.valid, buildUpdatedStep, onSave]);
  
  /**
   * Handle save and re-run
   */
  const handleSaveAndRerun = React.useCallback(() => {
    if (!validation.valid) {
      return;
    }
    
    const updatedStep = buildUpdatedStep();
    onSave?.(updatedStep);
    onRerun?.(updatedStep);
  }, [validation.valid, buildUpdatedStep, onSave, onRerun]);
  
  /**
   * Handle cancel
   */
  const handleCancel = React.useCallback(() => {
    // Reset to original values
    setInstruction(step.instruction);
    setSelector(step.target?.selector || '');
    setCoordinatesX(step.target?.coordinates?.x?.toString() || '');
    setCoordinatesY(step.target?.coordinates?.y?.toString() || '');
    setDescription(step.target?.description || '');
    setText(step.target?.text || '');
    setHasChanges(false);
    
    onCancel?.();
  }, [step, onCancel]);
  
  /**
   * Keyboard shortcuts
   */
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + S for save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (hasChanges && validation.valid) {
          handleSave();
        }
      }
      
      // Escape to cancel
      if (e.key === 'Escape') {
        e.preventDefault();
        handleCancel();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasChanges, validation.valid, handleSave, handleCancel]);
  
  return (
    <div className={cn('flex flex-col gap-4 p-4 border rounded-lg bg-card', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-foreground">
            Edit Step {step.stepNumber || step.index + 1}
          </h3>
          {hasChanges && (
            <span className="text-xs text-muted-foreground">(unsaved changes)</span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            className="h-8 px-2"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Validation messages */}
      {(validation.errors.length > 0 || validation.warnings.length > 0) && (
        <div className="space-y-2">
          {validation.errors.map((error, idx) => (
            <div key={`error-${idx}`} className="flex items-start gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          ))}
          {validation.warnings.map((warning, idx) => (
            <div key={`warning-${idx}`} className="flex items-start gap-2 text-sm text-yellow-600 dark:text-yellow-500">
              <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{warning}</span>
            </div>
          ))}
        </div>
      )}
      
      {/* Form fields */}
      <div className="space-y-4">
        {/* Instruction */}
        <div className="space-y-2">
          <Label htmlFor="instruction" className="text-sm font-medium">
            Instruction *
          </Label>
          <Textarea
            id="instruction"
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            readOnly={readOnly}
            placeholder="Enter step instruction..."
            className="min-h-[80px] resize-none"
          />
          <p className="text-xs text-muted-foreground">
            {instruction.length} characters
          </p>
        </div>
        
        {/* Target section */}
        <div className="space-y-3 pt-2 border-t">
          <h4 className="text-sm font-medium text-foreground">Target Information</h4>
          
          {/* Selector */}
          <div className="space-y-2">
            <Label htmlFor="selector" className="text-sm">
              CSS Selector / XPath
            </Label>
            <Input
              id="selector"
              value={selector}
              onChange={(e) => setSelector(e.target.value)}
              readOnly={readOnly}
              placeholder="#submit-btn, .login-form, //button[@id='submit']"
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              CSS selector or XPath for DOM-based automation
            </p>
          </div>
          
          {/* Coordinates */}
          <div className="space-y-2">
            <Label className="text-sm">Coordinates (for image-based automation)</Label>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <Input
                  id="coordinates-x"
                  type="number"
                  value={coordinatesX}
                  onChange={(e) => setCoordinatesX(e.target.value)}
                  readOnly={readOnly}
                  placeholder="X"
                  className="font-mono text-sm"
                />
              </div>
              <span className="text-muted-foreground">,</span>
              <div className="flex-1">
                <Input
                  id="coordinates-y"
                  type="number"
                  value={coordinatesY}
                  onChange={(e) => setCoordinatesY(e.target.value)}
                  readOnly={readOnly}
                  placeholder="Y"
                  className="font-mono text-sm"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Screen coordinates for image-based click
            </p>
          </div>
          
          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm">
              Element Description
            </Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              readOnly={readOnly}
              placeholder="Submit button, Email input field, etc."
            />
            <p className="text-xs text-muted-foreground">
              Human-readable description of the target element
            </p>
          </div>
          
          {/* Text (for type actions) */}
          {step.actionType === 'type' && (
            <div className="space-y-2">
              <Label htmlFor="text" className="text-sm">
                Text to Type
              </Label>
              <Input
                id="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                readOnly={readOnly}
                placeholder="{email}, {password}, or literal text"
              />
              <p className="text-xs text-muted-foreground">
                Text to type into the element (use {'{variable}'} for parameters)
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Action buttons */}
      <div className="flex items-center justify-between pt-2 border-t">
        <div className="flex items-center gap-2">
          {validation.valid && hasChanges && (
            <div className="flex items-center gap-1 text-sm text-green-600 dark:text-green-500">
              <CheckCircle2 className="h-4 w-4" />
              <span>Ready to save</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCancel}
            disabled={!hasChanges}
          >
            Cancel
          </Button>
          
          <Button
            variant="default"
            size="sm"
            onClick={handleSave}
            disabled={!hasChanges || !validation.valid || readOnly}
          >
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
          
          {showRerun && onRerun && (
            <Button
              variant="default"
              size="sm"
              onClick={handleSaveAndRerun}
              disabled={!hasChanges || !validation.valid || readOnly}
              className="bg-primary"
            >
              <Play className="h-4 w-4 mr-2" />
              Save & Re-run
            </Button>
          )}
        </div>
      </div>
      
      {/* Help text */}
      <div className="text-xs text-muted-foreground pt-2 border-t">
        <p>💡 Tip: Press Ctrl/Cmd + S to save, Esc to cancel</p>
      </div>
    </div>
  );
}
