/**
 * Click Indicator Test Component
 * 
 * Tests the ClickIndicator component functionality:
 * - Click tracking and numbering
 * - Color cycling (Red → Blue → Green)
 * - Ripple animation
 * - Fade-out behavior
 * - Pin mode
 * 
 * Usage: Click anywhere on the screen to create click indicators
 */

import { useState } from 'react';
import { ClickIndicator } from './Overlay/ClickIndicator';
import { ClickIndicator as ClickIndicatorType, getColorForClick, COLORS } from '../lib/overlay/click-tracker';

export function ClickIndicatorTest() {
  const [clicks, setClicks] = useState<ClickIndicatorType[]>([]);
  const [isPinned, setIsPinned] = useState(false);
  const [clickCount, setClickCount] = useState(0);

  const handleClick = (e: React.MouseEvent) => {
    const newClickCount = clickCount + 1;
    setClickCount(newClickCount);

    const newClick: ClickIndicatorType = {
      id: crypto.randomUUID(),
      number: newClickCount,
      position: {
        x: e.clientX,
        y: e.clientY,
      },
      color: getColorForClick(newClickCount),
      timestamp: Date.now(),
      fadeState: 'visible',
    };

    setClicks([...clicks, newClick]);
  };

  const handleFadeComplete = (clickId: string) => {
    setClicks(clicks.filter(c => c.id !== clickId));
  };

  const handleClear = () => {
    setClicks([]);
    setClickCount(0);
  };

  const togglePin = () => {
    setIsPinned(!isPinned);
  };

  return (
    <div className="w-screen h-screen bg-zinc-900 relative overflow-hidden">
      {/* Instructions Panel */}
      <div className="absolute top-4 left-4 bg-zinc-800 border border-zinc-700 rounded-lg p-4 max-w-md z-50">
        <h2 className="text-lg font-semibold text-white mb-3">
          Click Indicator Test
        </h2>
        
        <div className="space-y-2 text-sm text-zinc-300 mb-4">
          <p>✓ Click anywhere to create numbered indicators</p>
          <p>✓ Colors cycle: Red → Blue → Green</p>
          <p>✓ Ripple animation on each click</p>
          <p>✓ Indicators fade after 3 seconds (unless pinned)</p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">Total Clicks:</span>
            <span className="text-lg font-bold text-white">{clickCount}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">Active Indicators:</span>
            <span className="text-lg font-bold text-white">{clicks.length}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">Pin Mode:</span>
            <span className={`text-sm font-semibold ${isPinned ? 'text-green-400' : 'text-zinc-500'}`}>
              {isPinned ? 'ON' : 'OFF'}
            </span>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <button
            onClick={togglePin}
            className={`w-full px-4 py-2 rounded-md font-medium transition-colors ${
              isPinned
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-zinc-700 hover:bg-zinc-600 text-zinc-300'
            }`}
          >
            {isPinned ? '📌 Pinned (No Fade)' : '⏱️ Fade Mode (3s)'}
          </button>

          <button
            onClick={handleClear}
            className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium transition-colors"
          >
            Clear All Clicks
          </button>
        </div>

        {/* Color Legend */}
        <div className="mt-4 pt-4 border-t border-zinc-700">
          <p className="text-xs text-zinc-400 mb-2">Color Cycle:</p>
          <div className="flex gap-2">
            <div className="flex items-center gap-1">
              <div 
                className="w-4 h-4 rounded-full" 
                style={{ backgroundColor: COLORS.COLOR_1 }}
              />
              <span className="text-xs text-zinc-400">1, 4, 7...</span>
            </div>
            <div className="flex items-center gap-1">
              <div 
                className="w-4 h-4 rounded-full" 
                style={{ backgroundColor: COLORS.COLOR_2 }}
              />
              <span className="text-xs text-zinc-400">2, 5, 8...</span>
            </div>
            <div className="flex items-center gap-1">
              <div 
                className="w-4 h-4 rounded-full" 
                style={{ backgroundColor: COLORS.COLOR_3 }}
              />
              <span className="text-xs text-zinc-400">3, 6, 9...</span>
            </div>
          </div>
        </div>
      </div>

      {/* Click Area */}
      <div
        className="w-full h-full cursor-crosshair"
        onClick={handleClick}
      >
        {/* Render click indicators */}
        {clicks.map((click) => (
          <ClickIndicator
            key={click.id}
            click={click}
            isPinned={isPinned}
            onFadeComplete={handleFadeComplete}
          />
        ))}
      </div>

      {/* Background Grid (for visual reference) */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />
    </div>
  );
}
