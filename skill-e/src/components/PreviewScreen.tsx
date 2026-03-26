/**
 * PreviewScreen - Preview and export generated SKILL.md
 *
 * Simplified version for demonstration
 */

import { useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { ArrowLeft, Download, Copy, Check, FileText, RotateCcw } from 'lucide-react'
import { ExecutionPanel } from './ExecutionPanel'
import { Button } from './ui/button'
import type { OperationsBrief } from '@/types/operations'

interface PreviewScreenProps {
  skillMarkdown: string
  operationsBrief: OperationsBrief | null
  onBack: () => void
  onNewRecording: () => void
}

export function PreviewScreen({
  skillMarkdown,
  operationsBrief,
  onBack,
  onNewRecording,
}: PreviewScreenProps) {
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState<'preview' | 'raw'>('preview')

  const handleCopy = async () => {
    try {
      // Ensure window has focus
      window.focus()
      await navigator.clipboard.writeText(skillMarkdown)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Clipboard write failed:', error)
      // Fallback for some environments
      try {
        const textarea = document.createElement('textarea')
        textarea.value = skillMarkdown
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (e) {
        alert('Failed to copy: ' + String(error))
      }
    }
  }

  const handleDownload = async () => {
    try {
      // Try to save via Tauri
      try {
        await invoke('save_skill_md', { content: skillMarkdown })
        alert('Saved to SKILL.md')
      } catch (e) {
        // Fallback: download via browser
        const blob = new Blob([skillMarkdown], { type: 'text/markdown' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'SKILL.md'
        a.click()
        URL.revokeObjectURL(url)
        alert('Downloaded SKILL.md')
      }
    } catch (error) {
      alert('Failed to download: ' + String(error))
    }
  }

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
            className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'preview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Preview
          </button>
          <button
            onClick={() => setActiveTab('raw')}
            className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'raw'
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
                    return (
                      <h1 key={i} className="text-3xl font-bold mb-4">
                        {line.slice(2)}
                      </h1>
                    )
                  }
                  if (line.startsWith('## ')) {
                    return (
                      <h2 key={i} className="text-2xl font-bold mt-8 mb-4">
                        {line.slice(3)}
                      </h2>
                    )
                  }
                  if (line.startsWith('### ')) {
                    return (
                      <h3 key={i} className="text-xl font-bold mt-6 mb-3">
                        {line.slice(4)}
                      </h3>
                    )
                  }
                  // Code blocks
                  if (line.startsWith('```')) {
                    return null // Skip code fences for now
                  }
                  // Tables
                  if (line.startsWith('|')) {
                    return (
                      <div key={i} className="font-mono text-sm bg-gray-50 p-2 my-1 rounded">
                        {line}
                      </div>
                    )
                  }
                  // Empty lines
                  if (line.trim() === '') {
                    return <div key={i} className="h-4" />
                  }
                  // Regular text
                  return (
                    <p key={i} className="mb-2">
                      {line}
                    </p>
                  )
                })}
              </div>
            </div>
          ) : (
            <pre className="p-6 bg-gray-900 text-gray-100 font-mono text-sm overflow-auto">
              {skillMarkdown}
            </pre>
          )}
        </div>

        {operationsBrief && (
          <div className="max-w-4xl mx-auto mt-6 bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Work Diary Brief</h2>
                <p className="text-sm text-gray-500">
                  A daily-style review of pain points, automation ideas, and what should improve next.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  await navigator.clipboard.writeText(operationsBrief.markdown)
                }}
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy Brief
              </Button>
            </div>

            <div className="space-y-5 text-sm text-gray-700">
              <section>
                <h3 className="font-semibold text-gray-900 mb-1">Workflow Goal</h3>
                <p>{operationsBrief.workflowGoal}</p>
              </section>

              <section>
                <h3 className="font-semibold text-gray-900 mb-1">Problem Framing</h3>
                <p>{operationsBrief.problemFraming}</p>
              </section>

              <section>
                <h3 className="font-semibold text-gray-900 mb-1">Work Diary Summary</h3>
                <p>{operationsBrief.sessionSummary}</p>
              </section>

              <section>
                <h3 className="font-semibold text-gray-900 mb-2">Observed Applications</h3>
                <div className="flex flex-wrap gap-2">
                  {operationsBrief.observedApplications.map(app => (
                    <span key={app} className="px-2 py-1 rounded bg-gray-100 text-gray-700">
                      {app}
                    </span>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="font-semibold text-gray-900 mb-2">Pain Points</h3>
                <ul className="space-y-1">
                  {operationsBrief.painPoints.map(point => (
                    <li key={point}>- {point}</li>
                  ))}
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-gray-900 mb-2">Suggested Automations</h3>
                <ul className="space-y-1">
                  {operationsBrief.suggestedAutomations.map(item => (
                    <li key={item}>- {item}</li>
                  ))}
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-gray-900 mb-2">Research Questions</h3>
                <ul className="space-y-1">
                  {operationsBrief.researchQuestions.map(item => (
                    <li key={item}>- {item}</li>
                  ))}
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-gray-900 mb-2">Automation Opportunities</h3>
                <div className="space-y-3">
                  {operationsBrief.automationOpportunities.length === 0 && (
                    <p className="text-gray-500">No automation opportunities were generated.</p>
                  )}
                  {operationsBrief.automationOpportunities.map(item => (
                    <div key={item.title} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h4 className="font-semibold text-gray-900">{item.title}</h4>
                        <span className="px-2 py-1 rounded bg-white border text-xs font-medium capitalize">
                          {item.agentFeasibility}
                        </span>
                      </div>
                      <p className="mb-2">
                        <span className="font-medium text-gray-900">Current Pain:</span>{' '}
                        {item.currentPain}
                      </p>
                      <p className="mb-2">
                        <span className="font-medium text-gray-900">Proposed Automation:</span>{' '}
                        {item.proposedAutomation}
                      </p>
                      <p className="mb-2">
                        <span className="font-medium text-gray-900">Human Input Required:</span>{' '}
                        {item.humanInputRequired}
                      </p>
                      <p className="mb-2">
                        <span className="font-medium text-gray-900">Research Needed:</span>{' '}
                        {item.researchNeeded.join(' | ') || 'None'}
                      </p>
                      <p>
                        <span className="font-medium text-gray-900">Success Criteria:</span>{' '}
                        {item.successCriteria.join(' | ') || 'None'}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="font-semibold text-gray-900 mb-2">Human In The Loop</h3>
                <div className="space-y-3">
                  {operationsBrief.humanInLoopPoints.length === 0 && (
                    <p className="text-gray-500">No human-in-the-loop points were generated.</p>
                  )}
                  {operationsBrief.humanInLoopPoints.map(item => (
                    <div key={item.step} className="border rounded-lg p-4 bg-gray-50">
                      <h4 className="font-semibold text-gray-900 mb-2">{item.step}</h4>
                      <p className="mb-2">
                        <span className="font-medium text-gray-900">Why Human Matters:</span>{' '}
                        {item.whyHumanMatters}
                      </p>
                      <p className="mb-2">
                        <span className="font-medium text-gray-900">Required Input:</span>{' '}
                        {item.requiredInput}
                      </p>
                      <p>
                        <span className="font-medium text-gray-900">
                          Risk If Automated Blindly:
                        </span>{' '}
                        {item.riskIfAutomatedBlindly}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="font-semibold text-gray-900 mb-2">Improvement Candidates</h3>
                <div className="space-y-3">
                  {operationsBrief.candidateIssues.length === 0 && (
                    <p className="text-gray-500">No improvement candidates were generated for this session.</p>
                  )}
                  {operationsBrief.candidateIssues.map(issue => (
                    <div key={issue.title} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h4 className="font-semibold text-gray-900">{issue.title}</h4>
                        <span className="px-2 py-1 rounded bg-white border text-xs font-medium">
                          {issue.priority}
                        </span>
                      </div>
                      <p className="mb-2">
                        <span className="font-medium text-gray-900">Problem:</span> {issue.problem}
                      </p>
                      <p className="mb-2">
                        <span className="font-medium text-gray-900">Impact:</span> {issue.impact}
                      </p>
                      <p className="mb-2">
                        <span className="font-medium text-gray-900">Proposed Change:</span>{' '}
                        {issue.proposedChange}
                      </p>
                      <p className="mb-2">
                        <span className="font-medium text-gray-900">Evidence:</span>{' '}
                        {issue.evidence.join(' | ') || 'None'}
                      </p>
                      <p className="mb-2">
                        <span className="font-medium text-gray-900">Acceptance Criteria:</span>{' '}
                        {issue.acceptanceCriteria.join(' | ') || 'None'}
                      </p>
                      <p>
                        <span className="font-medium text-gray-900">Tags:</span>{' '}
                        {issue.tags.join(', ') || 'None'}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        )}

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
  )
}
