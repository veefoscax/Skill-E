/**
 * Claude API Key Test Component
 * 
 * Test component for verifying Claude API key settings functionality.
 * Requirements: FR-6.1
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { validateClaudeApiKey, isClaudeApiKeyConfigured } from '@/lib/claude-api';
import { useSettingsStore } from '@/stores/settings';
import { Loader2, Check, X, Eye, EyeOff, Sparkles, AlertCircle } from 'lucide-react';

export function ClaudeApiKeyTest() {
  const { claudeApiKey, setClaudeApiKey } = useSettingsStore();
  
  const [apiKeyInput, setApiKeyInput] = useState(claudeApiKey);
  const [isValidating, setIsValidating] = useState(false);
  const [validationStatus, setValidationStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');
  const [showApiKey, setShowApiKey] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');

  const handleValidate = async () => {
    setIsValidating(true);
    setValidationStatus('idle');
    setValidationMessage('Validating...');

    try {
      const isValid = await validateClaudeApiKey(apiKeyInput);
      
      if (isValid) {
        setValidationStatus('valid');
        setValidationMessage('API key is valid and working!');
        setClaudeApiKey(apiKeyInput);
      } else {
        setValidationStatus('invalid');
        setValidationMessage('Invalid API key. Please check and try again.');
      }
    } catch (error) {
      setValidationStatus('invalid');
      setValidationMessage(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsValidating(false);
    }
  };

  const handleClear = () => {
    setApiKeyInput('');
    setClaudeApiKey('');
    setValidationStatus('idle');
    setValidationMessage('');
  };

  const isConfigured = isClaudeApiKeyConfigured(claudeApiKey);

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Claude API Key Test
          </CardTitle>
          <CardDescription>
            Test Claude API key validation and storage for skill generation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Status */}
          <div className="p-4 rounded-lg border bg-muted/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Current Status</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {isConfigured ? 'API key is configured' : 'No API key configured'}
                </p>
              </div>
              {isConfigured ? (
                <Check className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-yellow-600" />
              )}
            </div>
          </div>

          {/* API Key Input */}
          <div className="space-y-2">
            <Label htmlFor="claude-api-key">Claude API Key</Label>
            <div className="relative">
              <Input
                id="claude-api-key"
                type={showApiKey ? 'text' : 'password'}
                placeholder="sk-ant-api03-..."
                value={apiKeyInput}
                onChange={(e) => {
                  setApiKeyInput(e.target.value);
                  setValidationStatus('idle');
                  setValidationMessage('');
                }}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1 h-8 w-8"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Get your API key from{' '}
              <a
                href="https://console.anthropic.com/settings/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                console.anthropic.com
              </a>
            </p>
          </div>

          {/* Validation Status */}
          {validationMessage && (
            <div
              className={`p-3 rounded-lg border flex items-start gap-2 ${
                validationStatus === 'valid'
                  ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800'
                  : validationStatus === 'invalid'
                  ? 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800'
                  : 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800'
              }`}
            >
              {validationStatus === 'valid' && <Check className="h-4 w-4 text-green-600 mt-0.5" />}
              {validationStatus === 'invalid' && <X className="h-4 w-4 text-red-600 mt-0.5" />}
              {validationStatus === 'idle' && isValidating && (
                <Loader2 className="h-4 w-4 text-blue-600 animate-spin mt-0.5" />
              )}
              <p className="text-sm flex-1">{validationMessage}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              onClick={handleValidate}
              disabled={!apiKeyInput || isValidating}
              className="flex-1"
            >
              {isValidating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Validating...
                </>
              ) : (
                'Validate & Save'
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleClear}
              disabled={!apiKeyInput && !claudeApiKey}
            >
              Clear
            </Button>
          </div>

          {/* Info */}
          <div className="p-3 rounded-lg border bg-muted/30">
            <p className="text-xs text-muted-foreground">
              <strong>Note:</strong> Your API key is stored locally in your browser's storage and
              is never sent to any server except Anthropic's API for validation and skill generation.
            </p>
          </div>

          {/* Test Results */}
          {validationStatus === 'valid' && (
            <div className="space-y-2">
              <Label>Test Results</Label>
              <div className="p-3 rounded-lg border bg-card space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">API Key Format</span>
                  <span className="flex items-center gap-1 text-green-600">
                    <Check className="h-3 w-3" />
                    Valid
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">API Connection</span>
                  <span className="flex items-center gap-1 text-green-600">
                    <Check className="h-3 w-3" />
                    Connected
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Stored in Settings</span>
                  <span className="flex items-center gap-1 text-green-600">
                    <Check className="h-3 w-3" />
                    Saved
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usage Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">How to Use</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="space-y-1">
            <p className="font-medium">1. Get Your API Key</p>
            <p className="text-muted-foreground">
              Visit the Anthropic Console and create a new API key.
            </p>
          </div>
          <div className="space-y-1">
            <p className="font-medium">2. Enter and Validate</p>
            <p className="text-muted-foreground">
              Paste your API key above and click "Validate & Save" to test the connection.
            </p>
          </div>
          <div className="space-y-1">
            <p className="font-medium">3. Generate Skills</p>
            <p className="text-muted-foreground">
              Once validated, the API key will be used automatically when generating SKILL.md files
              from your recordings.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
