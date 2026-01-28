/**
 * Password Redaction Test Component
 * 
 * Interactive test suite for password field detection and redaction.
 * Tests all detection methods and redaction modes.
 * 
 * Requirements: FR-4.17, FR-4.18, NFR-4.4
 */

import { useState } from 'react';
import { 
  detectPasswordField, 
  redactPassword,
  type RedactionMode,
  type PasswordFieldInfo,
} from '../lib/overlay/password-redaction';
import { KeyboardDisplay } from './Overlay/KeyboardDisplay';
import { keyboardTracker } from '../lib/overlay/keyboard-tracker';

export function PasswordRedactionTest() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [redactionMode, setRedactionMode] = useState<RedactionMode>('bullets');
  const [showVariableHint, setShowVariableHint] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(true);
  const [isTracking, setIsTracking] = useState(false);

  // Start/stop keyboard tracking
  const toggleTracking = () => {
    if (isTracking) {
      keyboardTracker.stop();
      setIsTracking(false);
    } else {
      keyboardTracker.start();
      setIsTracking(true);
    }
  };

  // Run all tests
  const runAllTests = () => {
    const results: TestResult[] = [];

    // Test 1: type="password"
    results.push(testPasswordField(
      'type-password',
      'Input with type="password"',
      createPasswordInput({ type: 'password', name: 'user_password' })
    ));

    // Test 2: autocomplete="current-password"
    results.push(testPasswordField(
      'autocomplete',
      'Input with autocomplete="current-password"',
      createPasswordInput({ autocomplete: 'current-password' })
    ));

    // Test 3: id="password"
    results.push(testPasswordField(
      'id-password',
      'Input with id="password"',
      createPasswordInput({ id: 'password' })
    ));

    // Test 4: name="password"
    results.push(testPasswordField(
      'name-password',
      'Input with name="password"',
      createPasswordInput({ name: 'password' })
    ));

    // Test 5: aria-label
    results.push(testPasswordField(
      'aria-label',
      'Input with aria-label="Enter password"',
      createPasswordInput({ 'aria-label': 'Enter password' })
    ));

    // Test 6: placeholder
    results.push(testPasswordField(
      'placeholder',
      'Input with placeholder="Password"',
      createPasswordInput({ placeholder: 'Password' })
    ));

    // Test 7: Regular text input (should NOT detect)
    results.push(testPasswordField(
      'regular-input',
      'Regular text input (should NOT detect)',
      createPasswordInput({ type: 'text', name: 'username' }),
      false
    ));

    // Test 8: Multiple detection methods
    results.push(testPasswordField(
      'multiple-methods',
      'Input with multiple password indicators',
      createPasswordInput({ 
        type: 'password', 
        id: 'user-pwd',
        name: 'password',
        autocomplete: 'current-password',
      })
    ));

    setTestResults(results);
  };

  // Test redaction modes
  const testRedactionModes = () => {
    const testPassword = 'MySecretP@ssw0rd!';
    
    console.group('Password Redaction Tests');
    
    // Bullets mode
    const bullets = redactPassword(testPassword, { mode: 'bullets' });
    console.log('Bullets mode:', bullets);
    console.assert(bullets === '●'.repeat(testPassword.length), 'Bullets mode failed');
    
    // Variable mode
    const variable = redactPassword(testPassword, { 
      mode: 'variable', 
      variableName: 'USER_PASSWORD' 
    });
    console.log('Variable mode:', variable);
    console.assert(variable === '${USER_PASSWORD}', 'Variable mode failed');
    
    // Custom bullet character
    const customBullet = redactPassword(testPassword, { 
      mode: 'bullets', 
      bulletChar: '*' 
    });
    console.log('Custom bullet:', customBullet);
    console.assert(customBullet === '*'.repeat(testPassword.length), 'Custom bullet failed');
    
    console.groupEnd();
    
    alert('Redaction mode tests completed. Check console for results.');
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Nunito Sans, system-ui, sans-serif' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>
        Password Redaction Test Suite
      </h1>

      {/* Control Panel */}
      <div style={{ 
        marginBottom: '30px', 
        padding: '20px', 
        backgroundColor: '#f5f5f5', 
        borderRadius: '8px' 
      }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '15px' }}>
          Controls
        </h2>
        
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '15px' }}>
          <button
            onClick={runAllTests}
            style={{
              padding: '10px 20px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600',
            }}
          >
            Run All Detection Tests
          </button>
          
          <button
            onClick={testRedactionModes}
            style={{
              padding: '10px 20px',
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600',
            }}
          >
            Test Redaction Modes
          </button>
          
          <button
            onClick={toggleTracking}
            style={{
              padding: '10px 20px',
              backgroundColor: isTracking ? '#f44336' : '#FF9800',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600',
            }}
          >
            {isTracking ? 'Stop' : 'Start'} Keyboard Tracking
          </button>
        </div>

        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="radio"
              checked={redactionMode === 'bullets'}
              onChange={() => setRedactionMode('bullets')}
            />
            <span>Bullets Mode (●●●●●●)</span>
          </label>
          
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="radio"
              checked={redactionMode === 'variable'}
              onChange={() => setRedactionMode('variable')}
            />
            <span>Variable Mode ($&#123;PASSWORD&#125;)</span>
          </label>
          
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              checked={showVariableHint}
              onChange={(e) => setShowVariableHint(e.target.checked)}
            />
            <span>Show Variable Hint</span>
          </label>
          
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              checked={keyboardVisible}
              onChange={(e) => setKeyboardVisible(e.target.checked)}
            />
            <span>Show Keyboard Display</span>
          </label>
        </div>
      </div>

      {/* Test Results */}
      {testResults.length > 0 && (
        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '15px' }}>
            Detection Test Results
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {testResults.map((result) => (
              <TestResultCard key={result.id} result={result} />
            ))}
          </div>
          
          <div style={{ marginTop: '15px', padding: '15px', backgroundColor: '#e3f2fd', borderRadius: '6px' }}>
            <strong>Summary:</strong> {testResults.filter(r => r.passed).length} / {testResults.length} tests passed
          </div>
        </div>
      )}

      {/* Interactive Test Fields */}
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '15px' }}>
          Interactive Test Fields
        </h2>
        <p style={{ marginBottom: '15px', color: '#666' }}>
          {isTracking 
            ? 'Keyboard tracking is active. Type in the fields below to see redaction in action.'
            : 'Click "Start Keyboard Tracking" to test live redaction.'}
        </p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
              Password Field (type="password"):
            </label>
            <input
              type="password"
              name="test_password"
              placeholder="Type a password..."
              style={{
                padding: '10px',
                width: '300px',
                border: '2px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
              }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
              Password Field (autocomplete="current-password"):
            </label>
            <input
              type="text"
              autoComplete="current-password"
              placeholder="Type a password..."
              style={{
                padding: '10px',
                width: '300px',
                border: '2px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
              }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
              Password Field (id="password"):
            </label>
            <input
              type="text"
              id="password"
              placeholder="Type a password..."
              style={{
                padding: '10px',
                width: '300px',
                border: '2px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
              }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
              Regular Text Field (should NOT redact):
            </label>
            <input
              type="text"
              name="username"
              placeholder="Type anything..."
              style={{
                padding: '10px',
                width: '300px',
                border: '2px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
              }}
            />
          </div>
        </div>
      </div>

      {/* Keyboard Display Overlay */}
      {keyboardVisible && (
        <KeyboardDisplay
          position="bottom-right"
          visible={true}
          redactionMode={redactionMode}
          showVariableHint={showVariableHint}
        />
      )}
    </div>
  );
}

// Helper types and functions

interface TestResult {
  id: string;
  name: string;
  passed: boolean;
  detectionInfo?: PasswordFieldInfo;
  error?: string;
}

function createPasswordInput(attrs: Record<string, string>): HTMLInputElement {
  const input = document.createElement('input');
  Object.entries(attrs).forEach(([key, value]) => {
    if (key === 'type') {
      input.type = value;
    } else {
      input.setAttribute(key, value);
    }
  });
  return input;
}

function testPasswordField(
  id: string,
  name: string,
  element: HTMLInputElement,
  shouldDetect: boolean = true
): TestResult {
  try {
    const detectionInfo = detectPasswordField(element);
    const passed = detectionInfo.isPasswordField === shouldDetect;
    
    return {
      id,
      name,
      passed,
      detectionInfo,
    };
  } catch (error) {
    return {
      id,
      name,
      passed: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

function TestResultCard({ result }: { result: TestResult }) {
  return (
    <div
      style={{
        padding: '15px',
        backgroundColor: result.passed ? '#e8f5e9' : '#ffebee',
        border: `2px solid ${result.passed ? '#4CAF50' : '#f44336'}`,
        borderRadius: '8px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
        <span style={{ fontSize: '20px' }}>
          {result.passed ? '✅' : '❌'}
        </span>
        <strong>{result.name}</strong>
      </div>
      
      {result.detectionInfo && (
        <div style={{ fontSize: '13px', color: '#666', marginLeft: '30px' }}>
          <div>Detected: {result.detectionInfo.isPasswordField ? 'Yes' : 'No'}</div>
          <div>Confidence: {Math.round(result.detectionInfo.confidence * 100)}%</div>
          <div>Method: {result.detectionInfo.detectionMethod || 'none'}</div>
          {result.detectionInfo.suggestedVariableName && (
            <div>Variable: {result.detectionInfo.suggestedVariableName}</div>
          )}
        </div>
      )}
      
      {result.error && (
        <div style={{ fontSize: '13px', color: '#d32f2f', marginLeft: '30px' }}>
          Error: {result.error}
        </div>
      )}
    </div>
  );
}
