/**
 * Claude API Utilities
 * 
 * Utilities for validating and interacting with the Claude API.
 * Requirements: FR-6.1
 */

/**
 * Validate a Claude API key by making a test request
 * 
 * @param apiKey - Claude API key to validate
 * @returns True if valid, false otherwise
 */
export async function validateClaudeApiKey(apiKey: string): Promise<boolean> {
  if (!apiKey || !apiKey.startsWith('sk-ant-')) {
    return false;
  }

  try {
    // Make a minimal test request to validate the key
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 10,
        messages: [
          {
            role: 'user',
            content: 'Hi',
          },
        ],
      }),
    });

    // If we get a 200 or 400 (bad request but key is valid), the key works
    // 401 means invalid key
    // 429 means rate limited but key is valid
    if (response.status === 200 || response.status === 400 || response.status === 429) {
      return true;
    }

    if (response.status === 401) {
      return false;
    }

    // For other errors, assume invalid
    console.error('Claude API validation error:', response.status, await response.text());
    return false;
  } catch (error) {
    console.error('Failed to validate Claude API key:', error);
    return false;
  }
}

/**
 * Check if a Claude API key is configured
 * 
 * @param apiKey - Claude API key
 * @returns True if configured
 */
export function isClaudeApiKeyConfigured(apiKey: string): boolean {
  return apiKey.length > 0 && apiKey.startsWith('sk-ant-');
}
