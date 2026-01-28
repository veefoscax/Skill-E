/**
 * Integration Detection
 * 
 * Detects availability of external execution platforms like Antigravity and Claude Code.
 * These integrations allow users to leverage existing subscriptions for skill execution.
 */

/**
 * Detects if Antigravity IDE is available for skill execution delegation.
 * 
 * NOTE: As of January 2025, Antigravity does not provide a public API
 * for external applications to delegate skill execution. This function
 * is a placeholder for future integration if Google releases such capabilities.
 * 
 * Antigravity is an IDE (development environment), not a service with external API.
 * It consumes MCP servers but doesn't expose itself as one. There is no documented
 * way to programmatically send tasks from external applications like Skill-E.
 * 
 * @returns Always false - integration not available
 */
export async function detectAntigravity(): Promise<boolean> {
  // Antigravity is an IDE, not a service with external API
  // No way to programmatically delegate execution from external apps
  // Keep this stub for future implementation if Google adds API support
  return false;
}

/**
 * Detects if Claude Code (Anthropic) is available for skill execution.
 * 
 * Claude Code is available in VS Code as an extension. This function checks
 * if the current environment has access to Claude Code capabilities.
 * 
 * NOTE: Similar to Antigravity, there's currently no public API for external
 * delegation. This is a placeholder for future integration.
 * 
 * @returns Always false - integration not available
 */
export async function detectClaudeCode(): Promise<boolean> {
  // Claude Code is a VS Code extension
  // No public API for external delegation from Tauri apps
  // Keep this stub for future implementation
  return false;
}

/**
 * Checks if the current environment is running inside Antigravity IDE.
 * This is different from delegation - it detects if Skill-E itself
 * is running within Antigravity's environment.
 * 
 * @returns True if running inside Antigravity IDE
 */
export function isRunningInAntigravity(): boolean {
  // Check for Antigravity-specific environment variables or APIs
  // This would be useful if Skill-E could be used as a tool within Antigravity
  
  // Not applicable for Tauri desktop app - we're a standalone application
  return false;
}

/**
 * Checks if the current environment is running inside VS Code with Claude Code.
 * 
 * @returns True if running inside VS Code with Claude Code extension
 */
export function isRunningInClaudeCode(): boolean {
  // Check for VS Code environment
  // Not applicable for Tauri desktop app - we're a standalone application
  return false;
}

/**
 * Detects all available integrations and returns their status.
 * 
 * @returns Object with integration availability status
 */
export async function detectAllIntegrations(): Promise<{
  antigravity: boolean;
  claudeCode: boolean;
}> {
  const [antigravity, claudeCode] = await Promise.all([
    detectAntigravity(),
    detectClaudeCode(),
  ]);

  return {
    antigravity,
    claudeCode,
  };
}

/**
 * Gets a user-friendly message explaining why an integration is not available.
 * 
 * @param integration - The integration name
 * @returns Explanation message
 */
export function getIntegrationUnavailableMessage(
  integration: 'antigravity' | 'claudeCode'
): string {
  switch (integration) {
    case 'antigravity':
      return 'Antigravity integration is not available. Antigravity is an IDE without a public API for external delegation. You can manually copy the generated SKILL.md and use it within Antigravity IDE.';
    
    case 'claudeCode':
      return 'Claude Code integration is not available. Claude Code is a VS Code extension without a public API for external delegation. You can manually copy the generated SKILL.md and use it with Claude Code in VS Code.';
    
    default:
      return 'Integration not available.';
  }
}

/**
 * Gets instructions for manual workflow when integration is not available.
 * 
 * @param integration - The integration name
 * @returns Manual workflow instructions
 */
export function getManualWorkflowInstructions(
  integration: 'antigravity' | 'claudeCode'
): string[] {
  switch (integration) {
    case 'antigravity':
      return [
        'Generate your SKILL.md in Skill-E',
        'Click "Export" to save the skill file',
        'Open Antigravity IDE',
        'Import or paste the skill content',
        'Use Antigravity\'s agent capabilities to execute the skill',
      ];
    
    case 'claudeCode':
      return [
        'Generate your SKILL.md in Skill-E',
        'Click "Export" to save the skill file',
        'Open VS Code with Claude Code extension',
        'Add the skill to your project',
        'Use Claude Code to execute the skill',
      ];
    
    default:
      return ['Manual workflow not available.'];
  }
}
