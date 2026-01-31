/**
 * PreviewScreen - Preview and export generated SKILL.md
 * 
 * Simplified version for demonstration
 */

import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import {
  ArrowLeft,
  Download,
  Copy,
  Check,
  FileText,
  RotateCcw
} from 'lucide-react';
import { ExecutionPanel } from './ExecutionPanel';
import { Button } from './ui/button';


interface PreviewScreenProps {
  skillMarkdown: string;
  onBack: () => void;
  onNewRecording: () => void;
}

export function PreviewScreen({ skillMarkdown, onBack, onNewRecording }: PreviewScreenProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'raw'>('preview');

  const handleCopy = async () => {
    try {
      // Ensure window has focus
      window.focus();
      await navigator.clipboard.writeText(skillMarkdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Clipboard write failed:', error);
      // Fallback for some environments
      try {
        const textarea = document.createElement('textarea');
        textarea.value = skillMarkdown;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (e) {
        alert('Failed to copy: ' + String(error));
      }
    }
  };

  const handleDownload = async () => {
    try {
      // Try to save via Tauri
      try {
        await invoke('save_skill_md', { content: skillMarkdown });
        alert('Saved to SKILL.md');
      } catch (e) {
        // Fallback: download via browser
        const blob = new Blob([skillMarkdown], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'SKILL.md';
        a.click();
        URL.revokeObjectURL(url);
        alert('Downloaded SKILL.md');
      }
    } catch (error) {
      alert('Failed to download: ' + String(error));
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Preview SKILL.md</h1>
            <p className="text-sm text-gray-500">Review and export your skill</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleCopy}>
            {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
            {copied ? 'Copied!' : 'Copy'}
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>

        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b px-6">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('preview')}
            className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'preview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
          >
            Preview
          </button>
          <button
            onClick={() => setActiveTab('raw')}
            className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'raw'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
          >
            Raw Markdown
          </button>
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm">
          {activeTab === 'preview' ? (
            <div className="p-8 prose prose-slate max-w-none">
              {/* Simple markdown rendering */}
              <div className="markdown-preview">
                {skillMarkdown.split('\n').map((line, i) => {
                  // Headers
                  if (line.startsWith('# ')) {
                    return <h1 key={i} className="text-3xl font-bold mb-4">{line.slice(2)}</h1>;
                  }
                  if (line.startsWith('## ')) {
                    return <h2 key={i} className="text-2xl font-bold mt-8 mb-4">{line.slice(3)}</h2>;
                  }
                  if (line.startsWith('### ')) {
                    return <h3 key={i} className="text-xl font-bold mt-6 mb-3">{line.slice(4)}</h3>;
                  }
                  // Code blocks
                  if (line.startsWith('```')) {
                    return null; // Skip code fences for now
                  }
                  // Tables
                  if (line.startsWith('|')) {
                    return (
                      <div key={i} className="font-mono text-sm bg-gray-50 p-2 my-1 rounded">
                        {line}
                      </div>
                    );
                  }
                  // Empty lines
                  if (line.trim() === '') {
                    return <div key={i} className="h-4" />;
                  }
                  // Regular text
                  return <p key={i} className="mb-2">{line}</p>;
                })}
              </div>
            </div>
          ) : (
            <pre className="p-6 bg-gray-900 text-gray-100 font-mono text-sm overflow-auto">
              {skillMarkdown}
            </pre>
          )}
        </div>

        {/* Execution Panel */}
        <div className="max-w-4xl mx-auto mt-6">
          <ExecutionPanel skillMarkdown={skillMarkdown} />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <FileText className="w-4 h-4" />
          <span>SKILL.md ready for export</span>
        </div>
        <Button variant="outline" onClick={onNewRecording}>
          <RotateCcw className="w-4 h-4 mr-2" />
          New Recording
        </Button>
      </footer>
    </div>
  );
}
