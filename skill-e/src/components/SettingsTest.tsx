import { Settings } from '@/components/settings';
import { useSettingsStore } from '@/stores/settings';

/**
 * Settings Test Component
 * 
 * Tests the Settings Integration (Task S03-5):
 * - Whisper API key input
 * - API key validation
 * - Secure storage in settings store
 * 
 * Requirements: FR-3.4
 */
export function SettingsTest() {
  const { whisperApiKey } = useSettingsStore();

  return (
    <div className="border rounded-lg p-4 space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Task S03-5: Settings Integration Test</h2>
        <p className="text-sm text-muted-foreground">
          Test Whisper API key configuration and validation
        </p>
      </div>

      {/* Current API Key Status */}
      <div className="bg-muted/50 rounded p-3 space-y-2">
        <h3 className="text-sm font-medium">Current Configuration</h3>
        <div className="text-xs space-y-1">
          <div>
            <span className="text-muted-foreground">Whisper API Key: </span>
            <span className="font-mono">
              {whisperApiKey ? `${whisperApiKey.substring(0, 7)}...${whisperApiKey.substring(whisperApiKey.length - 4)}` : 'Not configured'}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Status: </span>
            <span className={whisperApiKey ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}>
              {whisperApiKey ? '✓ Configured' : '⚠ Not configured'}
            </span>
          </div>
        </div>
      </div>

      {/* Settings Component */}
      <Settings />

      {/* Test Instructions */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded p-3 space-y-2">
        <h3 className="text-sm font-semibold text-blue-600 dark:text-blue-400">Test Instructions</h3>
        <ol className="text-xs space-y-1 list-decimal list-inside text-muted-foreground">
          <li>Enter a Whisper API key in the input field above</li>
          <li>Click "Save" to validate the key</li>
          <li>Verify validation status appears (valid/invalid)</li>
          <li>Check that the key is stored (shown in "Current Configuration")</li>
          <li>Refresh the page and verify the key persists</li>
          <li>Test with an invalid key to verify error handling</li>
        </ol>
      </div>
    </div>
  );
}
