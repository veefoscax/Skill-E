/**
 * StepBubble Component Test
 * 
 * Interactive test for the StepBubble component.
 * Tests step display, animations, fade behavior, and interactions.
 * 
 * Requirements: FR-4.29, FR-4.30
 */

import { useState, useEffect } from 'react';
import { StepBubble, StepBubbleExpanded } from './Overlay/Timeline/StepBubble';
import { CaptureStep, StepType } from '@/stores/recording';

/**
 * Generate a random step for testing
 */
function generateRandomStep(): Omit<CaptureStep, 'id' | 'timestamp'> {
  const types: StepType[] = ['screenshot', 'click', 'keystroke', 'network'];
  const type = types[Math.floor(Math.random() * types.length)];
  
  const labels: Record<StepType, string[]> = {
    screenshot: ['Screen captured', 'Screenshot taken', 'Frame captured'],
    click: ['Clicked #submit-btn', 'Clicked .login-form', 'Clicked button'],
    keystroke: ['Typed "hello world"', 'Typed "password"', 'Pressed Enter'],
    network: ['POST /api/login', 'GET /api/users', 'PUT /api/profile'],
  };
  
  const label = labels[type][Math.floor(Math.random() * labels[type].length)];
  
  // Generate appropriate data based on type
  let data: CaptureStep['data'] = {};
  
  switch (type) {
    case 'click':
      data = {
        selector: `#element-${Math.floor(Math.random() * 100)}`,
        position: {
          x: Math.floor(Math.random() * 1920),
          y: Math.floor(Math.random() * 1080),
        },
      };
      break;
    case 'keystroke':
      data = {
        text: ['hello', 'world', 'test', 'password'][Math.floor(Math.random() * 4)],
      };
      break;
    case 'network':
      data = {
        method: ['GET', 'POST', 'PUT', 'DELETE'][Math.floor(Math.random() * 4)],
        url: `/api/${['users', 'posts', 'login', 'profile'][Math.floor(Math.random() * 4)]}`,
      };
      break;
    case 'screenshot':
      data = {
        frameIndex: Math.floor(Math.random() * 100),
      };
      break;
  }
  
  return { type, label, data };
}

/**
 * StepBubble Test Component
 */
export function StepBubbleTest() {
  const [steps, setSteps] = useState<CaptureStep[]>([]);
  const [expandedStepId, setExpandedStepId] = useState<string | null>(null);
  const [isTimelineHovered, setIsTimelineHovered] = useState(false);
  const [autoAdd, setAutoAdd] = useState(false);
  
  // Add a random step
  const addStep = () => {
    const newStep: CaptureStep = {
      ...generateRandomStep(),
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };
    setSteps((prev) => [...prev, newStep]);
  };
  
  // Auto-add steps for testing
  useEffect(() => {
    if (!autoAdd) return;
    
    const interval = setInterval(() => {
      addStep();
    }, 2000);
    
    return () => clearInterval(interval);
  }, [autoAdd]);
  
  // Handle step click
  const handleStepClick = (step: CaptureStep) => {
    console.log('Step clicked:', step);
    setExpandedStepId(expandedStepId === step.id ? null : step.id);
  };
  
  // Handle step deletion
  const handleDeleteStep = (stepId: string) => {
    setSteps((prev) => prev.filter((s) => s.id !== stepId));
    if (expandedStepId === stepId) {
      setExpandedStepId(null);
    }
  };
  
  // Handle note editing
  const handleEditNote = (stepId: string, note: string) => {
    setSteps((prev) =>
      prev.map((s) => (s.id === stepId ? { ...s, note } : s))
    );
  };
  
  // Clear all steps
  const clearSteps = () => {
    setSteps([]);
    setExpandedStepId(null);
  };
  
  // Check if step should be faded (older than 5 seconds)
  const isStepFaded = (timestamp: number) => {
    return Date.now() - timestamp > 5000;
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">
            StepBubble Component Test
          </h1>
          <p className="text-slate-600">
            Testing step display, animations, and interactions
          </p>
          <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
            <span className="font-semibold">Requirements:</span>
            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
              FR-4.29
            </span>
            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
              FR-4.30
            </span>
          </div>
        </div>
        
        {/* Controls */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Controls</h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={addStep}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Add Random Step
            </button>
            
            <button
              onClick={() => {
                for (let i = 0; i < 5; i++) {
                  setTimeout(addStep, i * 200);
                }
              }}
              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
            >
              Add 5 Steps
            </button>
            
            <button
              onClick={() => setAutoAdd(!autoAdd)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                autoAdd
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-green-500 text-white hover:bg-green-600'
              }`}
            >
              {autoAdd ? 'Stop Auto-Add' : 'Start Auto-Add'}
            </button>
            
            <button
              onClick={clearSteps}
              className="px-4 py-2 bg-slate-500 text-white rounded-lg hover:bg-slate-600 transition-colors"
            >
              Clear All
            </button>
            
            <button
              onClick={() => setIsTimelineHovered(!isTimelineHovered)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                isTimelineHovered
                  ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                  : 'bg-slate-300 text-slate-700 hover:bg-slate-400'
              }`}
            >
              {isTimelineHovered ? 'Timeline Hovered' : 'Timeline Not Hovered'}
            </button>
          </div>
          
          <div className="mt-4 text-sm text-slate-600">
            <p>Total steps: {steps.length}</p>
            <p>Faded steps: {steps.filter((s) => isStepFaded(s.timestamp)).length}</p>
          </div>
        </div>
        
        {/* Test Cases */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">
            Test Cases
          </h2>
          <div className="space-y-3 text-sm text-slate-600">
            <div className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span>Add steps and verify slide-in animation from right</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span>Wait 5 seconds and verify steps fade to 50% opacity</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span>Toggle "Timeline Hovered" to restore opacity</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span>Click steps to expand/collapse details</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span>Test note editing in expanded view</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span>Test delete functionality</span>
            </div>
          </div>
        </div>
        
        {/* Step Display Area */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">
            Step Bubbles ({steps.length})
          </h2>
          
          {steps.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <p className="text-lg">No steps yet</p>
              <p className="text-sm mt-2">Click "Add Random Step" to begin</p>
            </div>
          ) : (
            <div className="space-y-3">
              {steps.map((step) => {
                const isFaded = isStepFaded(step.timestamp);
                const isExpanded = expandedStepId === step.id;
                
                return (
                  <div key={step.id} className="group">
                    <StepBubbleExpanded
                      step={step}
                      isFaded={isFaded}
                      isTimelineHovered={isTimelineHovered}
                      isExpanded={isExpanded}
                      onClick={handleStepClick}
                      onDelete={handleDeleteStep}
                      onEditNote={handleEditNote}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        {/* Step Type Examples */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">
            Step Type Examples
          </h2>
          <div className="space-y-3">
            <StepBubble
              step={{
                id: 'example-1',
                type: 'screenshot',
                timestamp: Date.now(),
                label: 'Screen captured',
                data: { frameIndex: 42 },
              }}
              onClick={(step) => console.log('Example clicked:', step)}
            />
            
            <StepBubble
              step={{
                id: 'example-2',
                type: 'click',
                timestamp: Date.now(),
                label: 'Clicked #submit-btn',
                data: {
                  selector: '#submit-btn',
                  position: { x: 500, y: 300 },
                },
              }}
              onClick={(step) => console.log('Example clicked:', step)}
            />
            
            <StepBubble
              step={{
                id: 'example-3',
                type: 'keystroke',
                timestamp: Date.now(),
                label: 'Typed "hello world"',
                data: { text: 'hello world' },
              }}
              onClick={(step) => console.log('Example clicked:', step)}
            />
            
            <StepBubble
              step={{
                id: 'example-4',
                type: 'network',
                timestamp: Date.now(),
                label: 'POST /api/login',
                data: {
                  method: 'POST',
                  url: '/api/login',
                },
              }}
              onClick={(step) => console.log('Example clicked:', step)}
            />
            
            <StepBubble
              step={{
                id: 'example-5',
                type: 'click',
                timestamp: Date.now() - 6000, // 6 seconds ago
                label: 'Faded step example',
                data: { selector: '#old-element' },
              }}
              isFaded={true}
              isTimelineHovered={isTimelineHovered}
              onClick={(step) => console.log('Example clicked:', step)}
            />
          </div>
        </div>
        
        {/* Animation Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Animation Details</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Slide-in: 400ms from right with ease-out</li>
            <li>• Auto-fade: After 5 seconds to 50% opacity</li>
            <li>• Hover scale: 1.05x on hover</li>
            <li>• Opacity transition: 300ms smooth</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
