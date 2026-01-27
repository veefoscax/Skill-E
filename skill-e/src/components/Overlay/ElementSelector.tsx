/**
 * Element Selector Component
 * 
 * Visual indicator for element picker mode.
 * Shows when element picker is enabled (E key toggle).
 * Provides visual feedback that the user can select browser elements.
 * 
 * Requirements: FR-4.20
 * - E key toggles element picker
 * - Visual indicator when active
 * - Disabled by default
 */

import { useOverlayStore } from '../../stores/overlay';

/**
 * ElementSelector component
 * 
 * Displays a visual indicator when element picker mode is active.
 * The actual element highlighting and selection will be implemented in tasks 15-16.
 */
export function ElementSelector() {
  const elementPickerEnabled = useOverlayStore((state) => state.elementPickerEnabled);

  // Don't render anything if element picker is disabled
  if (!elementPickerEnabled) {
    return null;
  }

  return (
    <div className="element-selector-indicator">
      {/* Visual indicator - positioned at top center */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
        <div className="bg-blue-500/90 backdrop-blur-sm text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-pulse">
          {/* Target icon */}
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          
          {/* Text */}
          <span className="font-medium text-sm">
            Element Picker Active
          </span>
          
          {/* Hint */}
          <span className="text-xs opacity-75 ml-2">
            Press E to exit
          </span>
        </div>
      </div>

      {/* Crosshair cursor indicator (optional visual enhancement) */}
      <style>{`
        .element-selector-indicator {
          cursor: crosshair;
        }
      `}</style>
    </div>
  );
}

/**
 * ElementSelectorStatus component
 * 
 * Compact status indicator that can be placed in a toolbar or corner.
 * Shows a small badge when element picker is active.
 */
export function ElementSelectorStatus() {
  const elementPickerEnabled = useOverlayStore((state) => state.elementPickerEnabled);

  if (!elementPickerEnabled) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 pointer-events-none">
      <div className="bg-blue-500 text-white px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 text-xs font-medium">
        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
        <span>Element Picker</span>
      </div>
    </div>
  );
}

/**
 * ElementSelectorToggleButton component
 * 
 * Button to toggle element picker mode.
 * Can be used in toolbars or control panels.
 */
export function ElementSelectorToggleButton() {
  const { elementPickerEnabled, toggleElementPicker } = useOverlayStore();

  return (
    <button
      onClick={toggleElementPicker}
      className={`
        px-3 py-2 rounded-md text-sm font-medium transition-colors
        ${
          elementPickerEnabled
            ? 'bg-blue-500 text-white hover:bg-blue-600'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }
      `}
      title="Toggle Element Picker (E)"
      aria-label="Toggle Element Picker"
      aria-pressed={elementPickerEnabled}
    >
      <div className="flex items-center gap-2">
        {/* Target icon */}
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span>Element Picker</span>
        {elementPickerEnabled && (
          <span className="text-xs opacity-75">(E)</span>
        )}
      </div>
    </button>
  );
}
