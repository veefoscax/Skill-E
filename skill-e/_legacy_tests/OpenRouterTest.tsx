/**
 * S08: LLM Providers - OpenRouter Integration Test
 * 
 * Manual test component to verify OpenRouter provider works with real API.
 * Tests the free tier (no API key required).
 * 
 * Requirements: FR-8.5
 */

import { useState } from 'react';
import { OpenRouterProvider, OPENROUTER_FREE_MODELS, DEFAULT_OPENROUTER_MODEL } from '../lib/providers/openrouter';
import type { Message } from '../lib/providers/types';

export function OpenRouterTest() {
  const [provider] = useState(() => new OpenRouterProvider());
  const [selectedModel, setSelectedModel] = useState(DEFAULT_OPENROUTER_MODEL);
  const [userMessage, setUserMessage] = useState('Tell me a short joke about programming');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [latency, setLatency] = useState<number | null>(null);

  const testConnection = async () => {
    setConnectionStatus('testing');
    setError('');
    setLatency(null);

    try {
      const result = await provider.testConnection();
      
      if (result.success) {
        setConnectionStatus('success');
        setLatency(result.latency || null);
      } else {
        setConnectionStatus('error');
        setError(result.error || 'Connection test failed');
      }
    } catch (err) {
      setConnectionStatus('error');
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const sendMessage = async () => {
    if (!userMessage.trim()) return;

    setIsLoading(true);
    setResponse('');
    setError('');

    try {
      const messages: Message[] = [
        { role: 'user', content: userMessage },
      ];

      const iterator = provider.chat(messages, {
        model: selectedModel,
        maxTokens: 200,
      });

      let fullResponse = '';
      for await (const chunk of iterator) {
        fullResponse += chunk;
        setResponse(fullResponse);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">OpenRouter Provider Test</h1>
        <p className="text-sm text-muted-foreground">
          Test OpenRouter free tier (no API key required)
        </p>
      </div>

      {/* Provider Info */}
      <div className="border rounded-lg p-4 space-y-2">
        <h2 className="font-semibold">Provider Information</h2>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-muted-foreground">Type:</span> {provider.type}
          </div>
          <div>
            <span className="text-muted-foreground">Name:</span> {provider.name}
          </div>
          <div>
            <span className="text-muted-foreground">Requires API Key:</span>{' '}
            {provider.requiresApiKey ? 'Yes' : 'No'}
          </div>
          <div>
            <span className="text-muted-foreground">Supports Streaming:</span>{' '}
            {provider.supportsStreaming ? 'Yes' : 'No'}
          </div>
        </div>
      </div>

      {/* Connection Test */}
      <div className="border rounded-lg p-4 space-y-3">
        <h2 className="font-semibold">Connection Test</h2>
        <button
          onClick={testConnection}
          disabled={connectionStatus === 'testing'}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {connectionStatus === 'testing' ? 'Testing...' : 'Test Connection'}
        </button>

        {connectionStatus === 'success' && (
          <div className="p-3 bg-green-50 border border-green-200 rounded text-sm">
            ✅ Connection successful! {latency && `(${latency}ms)`}
          </div>
        )}

        {connectionStatus === 'error' && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-sm">
            ❌ Connection failed: {error}
          </div>
        )}
      </div>

      {/* Model Selection */}
      <div className="border rounded-lg p-4 space-y-3">
        <h2 className="font-semibold">Free Models</h2>
        <div className="space-y-2">
          {OPENROUTER_FREE_MODELS.map((model) => (
            <label
              key={model.id}
              className="flex items-start gap-3 p-3 border rounded hover:bg-accent cursor-pointer"
            >
              <input
                type="radio"
                name="model"
                value={model.id}
                checked={selectedModel === model.id}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="font-medium">{model.name}</div>
                <div className="text-sm text-muted-foreground">
                  {model.description}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Context: {model.contextWindow.toLocaleString()} tokens
                </div>
              </div>
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                FREE
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Chat Test */}
      <div className="border rounded-lg p-4 space-y-3">
        <h2 className="font-semibold">Chat Test</h2>
        
        <div className="space-y-2">
          <label className="block text-sm font-medium">Your Message</label>
          <textarea
            value={userMessage}
            onChange={(e) => setUserMessage(e.target.value)}
            className="w-full p-2 border rounded min-h-[80px]"
            placeholder="Enter your message..."
          />
        </div>

        <button
          onClick={sendMessage}
          disabled={isLoading || !userMessage.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Sending...' : 'Send Message'}
        </button>

        {response && (
          <div className="space-y-2">
            <label className="block text-sm font-medium">Response</label>
            <div className="p-3 bg-accent rounded whitespace-pre-wrap">
              {response}
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-sm">
            ❌ Error: {error}
          </div>
        )}
      </div>

      {/* Usage Instructions */}
      <div className="border rounded-lg p-4 space-y-2 bg-blue-50">
        <h2 className="font-semibold">Test Instructions</h2>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Click "Test Connection" to verify OpenRouter is accessible</li>
          <li>Select a free model (default: Gemma 2 9B)</li>
          <li>Enter a message or use the default prompt</li>
          <li>Click "Send Message" to test streaming response</li>
          <li>Verify the response streams in real-time</li>
        </ol>
        <p className="text-xs text-muted-foreground mt-2">
          ℹ️ No API key required - using OpenRouter free tier
        </p>
      </div>
    </div>
  );
}
