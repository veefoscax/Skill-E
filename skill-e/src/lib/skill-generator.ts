import { OPENCLAW_PROVIDERS, LLM_DEFAULTS } from './models-config.providers';
import { useSettingsStore } from '../stores/settings';
import { ProcessingProgress, LLMContext } from '../types/processing';
import { createProgress } from './processing';
import { fetch } from '@tauri-apps/plugin-http'; // UPDATED: Use Tauri HTTP client

// Export types for skill validation
export interface ToolDefinition {
  name: string;
  description: string;
  parameters?: Record<string, unknown>;
  input_schema?: {
    properties?: Record<string, unknown>;
    required?: string[];
    [key: string]: unknown;
  };
}

export interface SkillFrontmatter {
  name: string;
  description: string;
  version?: string;
  author?: string;
  tools?: ToolDefinition[];
  [key: string]: unknown;
}

export interface GeneratedSkill {
  frontmatter: SkillFrontmatter;
  content: string;
  rawMarkdown: string;
  markdown: string;
  toolDefinition: unknown;
  tokenCount: number;
  metadata: {
    generatedAt: number;
    provider: string;
    model: string;
    generationTimeMs: number;
  };
}

interface GenerateSkillOptions {
  onProgress?: (progress: ProcessingProgress) => void;
  signal?: AbortSignal;
}

/**
 * Generate a skill from processed session context
 * 
 * @param context - LLM context from processed session
 * @param options - Generation options
 * @returns Generated SKILL.md content
 */
export async function generateSkill(
  context: LLMContext,
  options?: GenerateSkillOptions & { provider?: string; apiKey?: string; model?: string; baseUrl?: string }
): Promise<string> {
  const { onProgress, signal, provider: optProvider, apiKey: optApiKey, model: optModel, baseUrl: optBaseUrl } = options || {};

  try {
    // 1. Prepare prompt
    onProgress?.(createProgress('context_generation', 10, 'Preparing prompt...'));
    const prompt = buildSkillGenerationPrompt(context);

    // 2. Get LLM configuration
    // Use options first, fallback to settings store
    const settings = useSettingsStore.getState();
    const provider = optProvider || settings.llmProvider;
    const model = optModel || settings.llmModel;
    const apiKey = optApiKey !== undefined ? optApiKey : settings.llmApiKey;
    const baseUrl = optBaseUrl || settings.llmBaseUrl || LLM_DEFAULTS[provider]?.baseUrl;

    // Validate API key (unless Ollama which can work without one)
    if (!apiKey && provider !== 'ollama') {
      throw new Error('LLM API key is required. Please check your settings.');
    }

    // 3. Call LLM API
    onProgress?.(createProgress('context_generation', 30, `Generating skill with ${provider}/${model}...`));

    // Get custom headers from provider config
    const providerConfig = LLM_DEFAULTS[provider];
    const customHeaders = providerConfig?.headers || {};

    // We'll use a simple fetch wrapper for now
    // In production, use a more robust client or the official SDKs if compatible
    console.log('📝 Skill Generator: Prompt preview (first 500 chars):', prompt.substring(0, 500));
    console.log('📝 Skill Generator: Total prompt length:', prompt.length);
    console.log('📝 Skill Generator: Task description:', context.taskDescription);
    console.log('📝 Skill Generator: Steps count:', context.steps?.length || 0);

    const skillContent = await generateWithoutStreaming(
      prompt,
      model,
      apiKey,
      baseUrl,
      customHeaders
    );

    // 4. Validate output (basic check) - accept various header formats
    const hasValidHeader = skillContent.includes('# Skill:') ||
      skillContent.includes('name:') ||
      skillContent.includes('---\nname:');
    if (!hasValidHeader) {
      console.warn('Generated content might not be a valid skill (missing recognizable header)');
    }

    onProgress?.(createProgress('complete', 100, 'Skill generation complete'));
    return skillContent;

  } catch (error) {
    console.error('Skill generation failed:', error);
    onProgress?.(createProgress('error', 0, 'Generation failed: ' + (error instanceof Error ? error.message : String(error))));
    throw error;
  }
}

/**
 * Generate text without streaming
 */
async function generateWithoutStreaming(
  prompt: string,
  model: string,
  apiKey: string,
  baseUrl: string = 'https://api.openai.com/v1',
  customHeaders: Record<string, string> = {}
): Promise<string> {
  // Use callOpenAIAPI which now uses Tauri's fetch
  // We determine max_tokens based on model (simplified)
  const maxTokens = 4000;

  return callOpenAIAPI(
    prompt,
    model,
    apiKey,
    maxTokens,
    0.2, // Low temperature for consistent code generation
    baseUrl,
    customHeaders
  );
}

/**
 * Call OpenAI API using Tauri's HTTP plugin to bypass CORS
 * 
 * @param prompt - Generation prompt
 * @param model - Model name
 * @param apiKey - API key
 * @param maxTokens - Maximum tokens
 * @param temperature - Temperature
 * @param baseUrl - Base URL for the API
 * @param customHeaders - Custom headers for provider-specific requirements (e.g., Kimi)
 * @returns Generated text
 */
async function callOpenAIAPI(
  prompt: string,
  model: string,
  apiKey: string,
  maxTokens: number,
  temperature: number,
  baseUrl: string = 'https://api.openai.com/v1',
  customHeaders: Record<string, string> = {}
): Promise<string> {

  let url = baseUrl;

  // ---------------------------------------------------------------------------
  // CRITICAL FIX FOR OLLAMA 404 ERRORS
  // ---------------------------------------------------------------------------
  // If the user provided "http://localhost:11434" (no path), we MUST append "/v1"
  // because we are using the `chat/completions` endpoint which lives at `/v1/chat/completions`.
  // 
  // We check specifically for port 11434 (Standard Ollama).
  // ---------------------------------------------------------------------------

  const isOllamaPort = url.includes(':11434');
  const hasV1 = url.includes('/v1');
  const hasApi = url.includes('/api/'); // Some setups might use /api/chat

  if (isOllamaPort && !hasV1 && !hasApi) {
    // Remove trailing slash if present
    if (url.endsWith('/')) url = url.slice(0, -1);

    // Force append /v1
    url = url + '/v1';
    console.log('Skill Generator: Force-appended /v1 to Ollama URL for compatibility:', url);
  }

  // Ensure trailing slash for endpoint appending
  if (!url.endsWith('/')) url += '/';

  const endpoint = 'chat/completions';
  const fullUrl = url.endsWith(endpoint) ? url : `${url}${endpoint}`;

  console.log('Calling LLM API:', fullUrl, 'Model:', model);

  try {
    // Build headers - only add Authorization if apiKey is provided
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'Roo Code',
      'X-Client-Name': 'Roo Code',
    };

    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    // Merge custom headers (e.g., for Kimi/Moonshot compatibility)
    // Custom headers take precedence over defaults
    Object.assign(headers, customHeaders);

    const response = await fetch(fullUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        temperature,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();

    // DEBUG: Log raw LLM response
    console.log('LLM Raw Response:', JSON.stringify(data));

    // Validate response structure
    if (!data.choices || !data.choices[0] || !data.choices[0].message?.content) {
      console.error('Invalid API response structure:', data);
      throw new Error('Invalid response from LLM API (missing choices/content)');
    }

    const content = data.choices[0].message.content;

    // CORREÇÃO: Validação de conteúdo vazio
    if (!content || content.trim() === '') {
      console.warn('LLM returned empty content. Using fallback.');
      return '# Skill Generated (Empty)\n\nThe model returned no content. Check logs for details.';
    }

    return content;
  } catch (error) {
    if (String(error).includes('Failed to fetch')) {
      throw new Error('Network error: Failed to connect to LLM provider. Please check your internet connection and Base URL.');
    }
    throw error;
  }
}

/**
 * Build a prompt for skill generation
 * 
 * Based on research from Anthropic, OpenAI, MCP, and best practices for agent skills.
 * Uses XML tags for structure, few-shot examples, and focuses on atomic actions.
 */
function buildSkillGenerationPrompt(context: LLMContext): string {
  // Extract key info - USE FULL NARRATION, not truncated
  const task = context.taskDescription || 'Automated task based on screen recording';
  const fullNarration = context.fullNarration || task;

  // DEFENSIVE CHECKS added for steps, variables, and conditionals
  const steps = (context.steps || []).map(s =>
    `${s.number}. ${s.description} (Actions: ${s.actions?.clicks || 0} clicks, ${s.actions?.textInputs || 0} types)`
  ).join('\n') || 'No specific steps recorded';

  const variables = (context.variables || []).map(v => `- ${v.name}: ${v.description}`).join('\n') || 'None detected';
  const conditionals = (context.conditionals || []).map(c => `- If ${c.condition} -> ${c.thenAction}`).join('\n') || 'None detected';

  // Extract OCR text from steps if available
  const ocrTexts = (context.steps || [])
    .filter(s => s.notes?.some(n => n.includes('Screen shows:')))
    .map(s => {
      const ocrNote = s.notes?.find(n => n.includes('Screen shows:'));
      return ocrNote ? ocrNote.replace('Screen shows: ', '') : '';
    })
    .filter(Boolean)
    .slice(0, 3); // Limit to 3 OCR samples

  // Calculate recording stats
  const totalSteps = context.steps?.length || 0;
  const totalClicks = context.steps?.reduce((acc, s) => acc + (s.actions?.clicks || 0), 0) || 0;
  const totalInputs = context.steps?.reduce((acc, s) => acc + (s.actions?.textInputs || 0), 0) || 0;

  // Get unique applications
  const apps = [...new Set((context.steps || []).map(s => s.applicationName).filter(Boolean))];

  return `<role>
You are an expert Agent Skill creator specializing in documenting software workflows for AI agents.
Your task is to analyze the recorded demonstration and create a precise, actionable SKILL.md file.
</role>

<critical_requirements>
1. This skill MUST be SPECIFIC to what was actually demonstrated - use exact app names, button labels, sequences
2. Do NOT create generic templates - document EXACTLY what was shown in the recording
3. The skill should read like a recipe: clear, atomic steps that an AI agent can follow
4. Use the FULL narration provided - every detail matters
5. If the user mentioned "batatas", the skill MUST reference batatas
</critical_requirements>

<recording_data>
<full_narration>
${fullNarration}
</full_narration>

<task_summary>
${task}
</task_summary>

<recording_stats>
- Total Steps: ${totalSteps}
- Total Clicks: ${totalClicks}
- Text Inputs: ${totalInputs}
- Applications Used: ${apps.join(', ') || 'Not detected'}
</recording_stats>

<recorded_steps>
${steps}
</recorded_steps>

<detected_variables>
${variables}
</detected_variables>

<detected_conditionals>
${conditionals}
</detected_conditionals>

${ocrTexts.length > 0 ? `<ocr_texts_from_screen>
${ocrTexts.join('\n')}
</ocr_texts_from_screen>` : ''}
</recording_data>

<skill_format>
Create a SKILL.md file following this exact structure:

\`\`\`markdown
---
name: [action-oriented-name-kebab-case]
description: [One clear sentence about what this skill does AND when to use it. Example: "Export a document from Notepad to PDF format. Use when user needs to save text content as a portable document."]
version: 1.0.0
license: MIT
---

# [Human-readable Skill Name]

## Overview
[2-3 sentences explaining what this workflow accomplishes, referencing specific applications]

## When to Use
- [Specific use case 1]
- [Specific use case 2]

## Prerequisites
- [Application name] must be open
- [Any required setup]

## Steps

### Step 1: [Action Name]
[Detailed description using exact UI element names from the recording]

**Actions:**
1. [Specific action with coordinates/UI element if known]
2. [Next specific action]

**Expected Result:** [What happens after this step]

[Continue for each major step...]

## Notes & Context

### Platform Compatibility
- Windows: [specific notes if applicable]
- macOS: [specific notes if applicable]

### Timing Considerations
- [Any wait times or async operations]

### Known Limitations
- [Any constraints observed during recording]
\`\`\`
</skill_format>

<best_practices>
1. **Name**: Use kebab-case, action-oriented (e.g., "export-notepad-to-pdf", "create-jira-ticket")
2. **Descriptions**: Lead with what it does, then when to use it. Include trigger phrases.
3. **Steps**: Each step should be atomic and actionable by an AI agent
4. **Specificity**: Instead of "Click the button", say "Click the 'Export' button in the File menu"
5. **Context**: Document exact application names, window titles, UI text observed
6. **Variables**: If user mentioned changing values (filenames, usernames), document as variables
</best_practices>

<example_skills>

EXAMPLE 1 - Simple Navigation:
\`\`\`markdown
---
name: navigate-chrome-settings
description: Navigate to Chrome Settings page. Use when user asks to change browser settings, privacy options, or advanced configuration.
version: 1.0.0
license: MIT
---

# Navigate Chrome to Settings

## Overview
Open Chrome's Settings page from any starting point using the menu navigation.

## When to Use
- User wants to change Chrome settings
- Need to access privacy or security options
- Modifying browser configuration

## Prerequisites
- Google Chrome browser must be running
- Browser window must be active/focused

## Steps

### Step 1: Open Chrome Menu
Click the three-dot menu button (⋮) in the top-right corner of Chrome window.

**Expected Result:** Dropdown menu appears with options including "Settings"

### Step 2: Select Settings
Click the "Settings" option from the dropdown menu.

**Expected Result:** Chrome navigates to chrome://settings/ page
\`\`\`

EXAMPLE 2 - Form Interaction:
\`\`\`markdown
---
name: fill-login-form-generic
description: Fill username and password in a web login form. Use when user needs to authenticate to a website.
version: 1.0.0
license: MIT
---

# Fill Web Login Form

## Overview
Complete a standard web login form by entering credentials and submitting.

## When to Use
- User needs to log into a web application
- Authentication form is displayed

## Prerequisites
- Login page must be loaded in browser
- Username and password are known

## Steps

### Step 1: Focus Username Field
Click on the username/email input field.

**Actions:**
1. Click the input field labeled "Username" or "Email"
2. Wait for cursor to appear

### Step 2: Enter Username
Type the username into the focused field.

**Actions:**
1. Type the username value

### Step 3: Focus Password Field
Click on the password input field.

**Actions:**
1. Click the input field labeled "Password"

### Step 4: Enter Password
Type the password into the focused field.

**Actions:**
1. Type the password value

### Step 5: Submit Form
Click the login/submit button.

**Actions:**
1. Click the button labeled "Login", "Sign In", or "Submit"

**Expected Result:** Form submits and user is authenticated
\`\`\`
</example_skills>

<output_requirements>
1. Output ONLY the markdown content (no "Here is the skill..." intro)
2. Use proper markdown formatting (headers, code blocks, lists)
3. Be SPECIFIC to the recorded workflow, not generic
4. Reference the FULL narration provided - include all mentioned topics
5. If the user said "I want to do X with batatas", the skill must document the batata workflow
6. Maximum 500 lines (follow "Regra das 500 Linhas" from best practices)
</output_requirements>

Now create the SKILL.md based on the recording data provided above.`;
}
