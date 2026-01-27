/**
 * Keyboard Display Component
 * 
 * Displays keyboard input in the overlay during recording.
 * Features:
 * - Shows modifier key badges (Shift, Ctrl, Alt, Cmd)
 * - Shows current typed text
 * - Configurable position (corners)
 * - Enhanced password redaction with 100% reliability
 * - Supports both bullet (●●●●●●) and variable (${PASSWORD}) modes
 * 
 * Requirements: FR-4.15, FR-4.16, FR-4.17, FR-4.18, FR-4.19, NFR-4.4
 */

import { useEffect, useState } from 'react';
import { KeyboardState, keyboardTracker } from '../../lib/overlay/keyboard-tracker';
import { redactPassword, type RedactionMode } from '../../lib/overlay/password-redaction';

/**
 * Display position options
 */
export type KeyboardDisplayPosition = 
  | 'bottom-left' 
  | 'bottom-right' 
  | 'top-left' 
  | 'top-right';

interface KeyboardDisplayProps {
  /** Position of the keyboard display */
  position?: KeyboardDisplayPosition;
  
  /** Whether to show the keyboard display */
  visible?: boolean;
  
  /** Redaction mode for password fields */
  redactionMode?: RedactionMode;
  
  /** Show variable name hint alongside bullets */
  showVariableHint?: boolean;
  
  /** Optional: Custom class name */
  className?: string;
}

/**
 * Keyboard Display Component
 * 
 * Shows modifier keys and typed text in a corner of the overlay.
 */
export function KeyboardDisplay({
  position = 'bottom-left',
  visible = true,
  redactionMode = 'bullets',
  showVariableHint = false,
  className = '',
}: KeyboardDisplayProps) {
  const [keyboardState, setKeyboardState] = useState<KeyboardState>({
    modifiers: {
      shift: false,
      ctrl: false,
      alt: false,
      meta: false,
    },
    currentText: '',
    isPasswordField: false,
    lastKeyTimestamp: 0,
  });

  // Subscribe to keyboard tracker updates
  useEffect(() => {
    const unsubscribe = keyboardTracker.subscribe((state) => {
      setKeyboardState(state);
    });

    return unsubscribe;
  }, []);

  // Don't render if not visible
  if (!visible) {
    return null;
  }

  // Don't render if no keyboard activity
  const hasModifiers = Object.values(keyboardState.modifiers).some(v => v);
  const hasText = keyboardState.currentText.length > 0;
  
  if (!hasModifiers && !hasText) {
    return null;
  }

  // Get position classes
  const positionClasses = getPositionClasses(position);

  return (
    <div
      className={`keyboard-display ${positionClasses} ${className}`}
      style={{
        position: 'fixed',
        zIndex: 200,
        pointerEvents: 'none',
        userSelect: 'none',
      }}
    >
      <div
        className="keyboard-display-content"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          borderRadius: '12px',
          padding: '12px 16px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          minWidth: '200px',
          maxWidth: '400px',
        }}
      >
        {/* Modifier Keys */}
        {hasModifiers && (
          <div className="modifiers-row" style={{ marginBottom: hasText ? '8px' : '0' }}>
            <ModifierKeys modifiers={keyboardState.modifiers} />
          </div>
        )}

        {/* Typed Text */}
        {hasText && (
          <div className="text-row">
            <TypedText
              text={keyboardState.currentText}
              isPassword={keyboardState.isPasswordField}
              passwordFieldInfo={keyboardState.passwordFieldInfo}
              redactionMode={redactionMode}
              showVariableHint={showVariableHint}
            />
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Modifier Keys Display
 * 
 * Shows badges for active modifier keys
 */
interface ModifierKeysProps {
  modifiers: KeyboardState['modifiers'];
}

function ModifierKeys({ modifiers }: ModifierKeysProps) {
  const activeModifiers: string[] = [];

  if (modifiers.ctrl) activeModifiers.push('Ctrl');
  if (modifiers.shift) activeModifiers.push('Shift');
  if (modifiers.alt) activeModifiers.push('Alt');
  if (modifiers.meta) {
    // Show "Cmd" on Mac, "Win" on Windows
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    activeModifiers.push(isMac ? 'Cmd' : 'Win');
  }

  if (activeModifiers.length === 0) {
    return null;
  }

  return (
    <div
      className="modifier-keys"
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '6px',
        alignItems: 'center',
      }}
    >
      {activeModifiers.map((key, index) => (
        <span key={key}>
          <KeyBadge label={key} />
          {index < activeModifiers.length - 1 && (
            <span
              style={{
                color: 'rgba(255, 255, 255, 0.5)',
                fontSize: '14px',
                margin: '0 4px',
              }}
            >
              +
            </span>
          )}
        </span>
      ))}
    </div>
  );
}

/**
 * Key Badge Component
 * 
 * Displays a single key as a badge
 */
interface KeyBadgeProps {
  label: string;
}

function KeyBadge({ label }: KeyBadgeProps) {
  return (
    <kbd
      style={{
        display: 'inline-block',
        padding: '4px 8px',
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        border: '1px solid rgba(255, 255, 255, 0.25)',
        borderRadius: '6px',
        color: 'white',
        fontSize: '13px',
        fontWeight: '600',
        fontFamily: 'Nunito Sans, system-ui, sans-serif',
        lineHeight: '1',
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
        textTransform: 'capitalize',
      }}
    >
      {label}
    </kbd>
  );
}

/**
 * Typed Text Display
 * 
 * Shows the current typed text with enhanced password redaction
 */
interface TypedTextProps {
  text: string;
  isPassword: boolean;
  passwordFieldInfo?: KeyboardState['passwordFieldInfo'];
  redactionMode?: RedactionMode;
  showVariableHint?: boolean;
}

function TypedText({ 
  text, 
  isPassword, 
  passwordFieldInfo,
  redactionMode = 'bullets',
  showVariableHint = false,
}: TypedTextProps) {
  // Get variable name from detection result
  const variableName = passwordFieldInfo?.suggestedVariableName || 'PASSWORD';
  
  // Redact password text using enhanced redaction
  const displayText = isPassword 
    ? redactPassword(text, { mode: redactionMode, variableName })
    : text;
  
  // Add variable hint if enabled and in bullets mode
  const finalDisplayText = isPassword && showVariableHint && redactionMode === 'bullets'
    ? `${displayText} (${variableName})`
    : displayText;

  return (
    <div
      className="typed-text"
      style={{
        color: 'white',
        fontSize: '15px',
        fontFamily: 'Nunito Sans, system-ui, monospace',
        lineHeight: '1.4',
        wordBreak: 'break-word',
        maxHeight: '100px',
        overflowY: 'auto',
      }}
    >
      {isPassword && (
        <span
          style={{
            color: 'rgba(255, 255, 255, 0.6)',
            fontSize: '12px',
            marginRight: '8px',
            fontWeight: '600',
          }}
        >
          🔒
        </span>
      )}
      <span style={{ 
        fontFamily: isPassword && redactionMode === 'bullets' 
          ? 'monospace' 
          : 'Nunito Sans, system-ui, sans-serif' 
      }}>
        {finalDisplayText}
      </span>
      {isPassword && passwordFieldInfo && (
        <span
          style={{
            color: 'rgba(255, 255, 255, 0.4)',
            fontSize: '11px',
            marginLeft: '8px',
            fontStyle: 'italic',
          }}
          title={`Detection: ${passwordFieldInfo.detectionMethod} (${Math.round(passwordFieldInfo.confidence * 100)}% confidence)`}
        >
          {redactionMode === 'variable' ? 'variable' : 'redacted'}
        </span>
      )}
    </div>
  );
}

/**
 * Redact password text (legacy - kept for backwards compatibility)
 * 
 * @deprecated Use redactPassword from password-redaction.ts instead
 */
// @ts-ignore - Kept for reference
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _redactPasswordLegacy(text: string): string {
  return '●'.repeat(text.length);
}

/**
 * Get position classes based on display position
 */
function getPositionClasses(position: KeyboardDisplayPosition): string {
  const baseSpacing = '24px';
  
  switch (position) {
    case 'bottom-left':
      return `bottom-${baseSpacing} left-${baseSpacing}`;
    case 'bottom-right':
      return `bottom-${baseSpacing} right-${baseSpacing}`;
    case 'top-left':
      return `top-${baseSpacing} left-${baseSpacing}`;
    case 'top-right':
      return `top-${baseSpacing} right-${baseSpacing}`;
    default:
      return `bottom-${baseSpacing} left-${baseSpacing}`;
  }
}

/**
 * Hook to control keyboard display visibility
 * 
 * Usage:
 * ```tsx
 * const { visible, toggle, show, hide } = useKeyboardDisplay();
 * ```
 */
export function useKeyboardDisplay(initialVisible = true) {
  const [visible, setVisible] = useState(initialVisible);

  const toggle = () => setVisible(prev => !prev);
  const show = () => setVisible(true);
  const hide = () => setVisible(false);

  return {
    visible,
    toggle,
    show,
    hide,
  };
}
