/**
 * Draggable StepBubble Component
 * 
 * StepBubble with drag and drop support for reordering.
 * Uses HTML5 native drag and drop API.
 * 
 * Requirements: FR-4.38
 */

import React, { useState, useCallback } from 'react';
import { CaptureStep } from '@/stores/recording';
import { StepBubble, StepBubbleExpanded } from './StepBubble';

/**
 * Props for DraggableStepBubble component
 */
interface DraggableStepBubbleProps {
  /** The capture step to display */
  step: CaptureStep;
  /** Index of this step in the list */
  index: number;
  /** Whether this step should be faded */
  isFaded?: boolean;
  /** Whether the timeline is being hovered */
  isTimelineHovered?: boolean;
  /** Whether this step is expanded */
  isExpanded?: boolean;
  /** Whether reordering is enabled */
  reorderEnabled?: boolean;
  /** Callback when step is clicked */
  onClick?: (step: CaptureStep) => void;
  /** Callback when step is deleted */
  onDelete?: (stepId: string) => void;
  /** Callback when step note is edited */
  onEditNote?: (stepId: string, note: string) => void;
  /** Callback when step is moved (drag & drop) */
  onMove?: (dragIndex: number, dropIndex: number) => void;
  /** Callback for keyboard reordering */
  onReorder?: (stepId: string, direction: 'up' | 'down') => void;
}

/**
 * Draggable StepBubble Component
 * 
 * Wraps StepBubble with drag and drop functionality.
 * Shows drag handle when reordering is enabled.
 * 
 * Requirements: FR-4.38
 */
export function DraggableStepBubble({
  step,
  index,
  isFaded = false,
  isTimelineHovered = false,
  isExpanded = false,
  reorderEnabled = false,
  onClick,
  onDelete,
  onEditNote,
  onMove,
  onReorder,
}: DraggableStepBubbleProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isDragOver, setIsDragOver] = useState<'top' | 'bottom' | null>(null);

  // Drag start handler
  const handleDragStart = useCallback((e: React.DragEvent) => {
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', JSON.stringify({ index, stepId: step.id }));
    
    // Set drag image (optional - uses default if not set)
    const target = e.currentTarget as HTMLElement;
    if (target) {
      e.dataTransfer.setDragImage(target, 20, 20);
    }
  }, [index, step.id]);

  // Drag end handler
  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    setIsDragOver(null);
  }, []);

  // Drag over handler
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    // Determine if dropping above or below
    const rect = e.currentTarget.getBoundingClientRect();
    const midpoint = rect.top + rect.height / 2;
    const dropPosition = e.clientY < midpoint ? 'top' : 'bottom';
    
    setIsDragOver(dropPosition);
  }, []);

  // Drag leave handler
  const handleDragLeave = useCallback(() => {
    setIsDragOver(null);
  }, []);

  // Drop handler
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(null);
    setIsDragging(false);
    
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      const dragIndex = data.index;
      
      if (dragIndex === index) return; // Dropped on itself
      
      // Calculate drop index based on position
      const rect = e.currentTarget.getBoundingClientRect();
      const midpoint = rect.top + rect.height / 2;
      const dropIndex = e.clientY < midpoint ? index : index + 1;
      
      onMove?.(dragIndex, dropIndex);
    } catch {
      // Ignore invalid drop data
    }
  }, [index, onMove]);

  // Keyboard reordering
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!reorderEnabled) return;
    
    if (e.key === 'ArrowUp' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      onReorder?.(step.id, 'up');
    } else if (e.key === 'ArrowDown' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      onReorder?.(step.id, 'down');
    }
  }, [reorderEnabled, step.id, onReorder]);

  // Drag handle component
  const DragHandle = () => (
    <div
      className="drag-handle flex items-center justify-center px-1 cursor-grab active:cursor-grabbing"
      draggable={reorderEnabled}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      title={reorderEnabled ? "Drag to reorder (or Cmd+↑/↓)" : undefined}
    >
      <svg
        className="w-4 h-4 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 8h16M4 16h16"
        />
      </svg>
    </div>
  );

  // Keyboard controls component
  const KeyboardControls = () => (
    <div className="flex flex-col gap-0.5 ml-1">
      <button
        onClick={() => onReorder?.(step.id, 'up')}
        className="p-0.5 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
        title="Move up (Cmd+↑)"
        disabled={index === 0}
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      </button>
      <button
        onClick={() => onReorder?.(step.id, 'down')}
        className="p-0.5 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
        title="Move down (Cmd+↓)"
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    </div>
  );

  // Wrapper class for drag states
  const wrapperClass = `
    timeline-step-wrapper relative
    ${isDragging ? 'opacity-50' : ''}
    ${isDragOver === 'top' ? 'border-t-2 border-blue-500' : ''}
    ${isDragOver === 'bottom' ? 'border-b-2 border-blue-500' : ''}
    transition-all duration-150
  `;

  return (
    <div
      className={wrapperClass}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Drop indicator line */}
      {isDragOver === 'top' && (
        <div className="absolute -top-1 left-0 right-0 h-0.5 bg-blue-500 rounded-full z-10" />
      )}
      {isDragOver === 'bottom' && (
        <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-blue-500 rounded-full z-10" />
      )}
      
      <div className="flex items-center gap-1">
        {/* Drag handle - only when reordering enabled */}
        {reorderEnabled && <DragHandle />}
        
        {/* Step bubble content */}
        <div className="flex-1 min-w-0">
          {isExpanded ? (
            <StepBubbleExpanded
              step={step}
              isFaded={isFaded}
              isTimelineHovered={isTimelineHovered}
              isExpanded={true}
              onClick={onClick}
              onDelete={onDelete}
              onEditNote={onEditNote}
            />
          ) : (
            <StepBubble
              step={step}
              isFaded={isFaded}
              isTimelineHovered={isTimelineHovered}
              onClick={onClick}
            />
          )}
        </div>
        
        {/* Keyboard reorder controls - only when expanded and reordering enabled */}
        {reorderEnabled && isExpanded && <KeyboardControls />}
      </div>
    </div>
  );
}

/**
 * Draggable StepBubble List
 * 
 * Container that manages drag and drop state for multiple steps.
 */
interface DraggableStepListProps {
  /** Array of steps to display */
  steps: CaptureStep[];
  /** Whether steps should be faded */
  getIsFaded: (step: CaptureStep) => boolean;
  /** Whether the timeline is hovered */
  isTimelineHovered: boolean;
  /** Currently expanded step ID */
  expandedStepId: string | null;
  /** Whether reordering is enabled */
  reorderEnabled: boolean;
  /** Callback when a step is clicked */
  onStepClick: (step: CaptureStep) => void;
  /** Callback when a step is deleted */
  onStepDelete: (stepId: string) => void;
  /** Callback when a step note is edited */
  onStepEditNote: (stepId: string, note: string) => void;
  /** Callback when steps are reordered */
  onStepsReorder: (newSteps: CaptureStep[]) => void;
  /** Callback for individual step move */
  onStepMove: (stepId: string, direction: 'up' | 'down') => void;
}

export function DraggableStepList({
  steps,
  getIsFaded,
  isTimelineHovered,
  expandedStepId,
  reorderEnabled,
  onStepClick,
  onStepDelete,
  onStepEditNote,
  onStepsReorder,
  onStepMove,
}: DraggableStepListProps) {
  // Handle move from drag and drop
  const handleMove = useCallback((dragIndex: number, dropIndex: number) => {
    if (dragIndex === dropIndex) return;
    
    const newSteps = [...steps];
    const [movedStep] = newSteps.splice(dragIndex, 1);
    
    // Adjust drop index if removing from before
    const adjustedDropIndex = dragIndex < dropIndex ? dropIndex - 1 : dropIndex;
    newSteps.splice(adjustedDropIndex, 0, movedStep);
    
    onStepsReorder(newSteps);
  }, [steps, onStepsReorder]);

  return (
    <div className="space-y-2">
      {steps.map((step, index) => (
        <DraggableStepBubble
          key={step.id}
          step={step}
          index={index}
          isFaded={getIsFaded(step)}
          isTimelineHovered={isTimelineHovered}
          isExpanded={expandedStepId === step.id}
          reorderEnabled={reorderEnabled}
          onClick={onStepClick}
          onDelete={onStepDelete}
          onEditNote={onStepEditNote}
          onMove={handleMove}
          onReorder={onStepMove}
        />
      ))}
    </div>
  );
}
