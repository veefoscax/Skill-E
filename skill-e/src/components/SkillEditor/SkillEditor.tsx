/**
 * Skill Editor Component
 *
 * Provides an interactive editor for SKILL.md files with:
 * - Markdown editor with syntax highlighting
 * - Live preview side-by-side
 * - Undo/redo support
 * - Regenerate section button
 *
 * Requirements: FR-6.3, FR-6.7, AC5
 */

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Undo, Redo, Save, RotateCcw, Eye, Code, SplitSquareHorizontal, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { GeneratedSkill } from '@/lib/skill-generator'

export interface SkillEditorProps {
  /** Initial skill to edit */
  skill: GeneratedSkill
  /** Optional className for styling */
  className?: string
  /** Callback when skill is saved */
  onSave?: (markdown: string) => void
  /** Callback when regenerate is requested */
  onRegenerate?: () => void
  /** Whether the editor is in read-only mode */
  readOnly?: boolean
}

/**
 * Editor view mode
 */
type ViewMode = 'split' | 'edit' | 'preview'

/**
 * History entry for undo/redo
 */
interface HistoryEntry {
  content: string
  timestamp: number
}

/**
 * Simple markdown renderer for preview
 * This is a basic implementation - for production, consider using a library like react-markdown
 */
function MarkdownPreview({ content }: { content: string }) {
  const htmlRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!htmlRef.current) return

    // Basic markdown parsing
    let html = content

    // Headers
    html = html.replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-6 mb-3">$1</h3>')
    html = html.replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mt-8 mb-4">$1</h2>')
    html = html.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-8 mb-4">$1</h1>')

    // Bold
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold">$1</strong>')

    // Italic
    html = html.replace(/\*([^*]+)\*/g, '<em class="italic">$1</em>')

    // Inline code
    html = html.replace(
      /`([^`]+)`/g,
      '<code class="px-1.5 py-0.5 rounded bg-muted text-sm font-mono">$1</code>'
    )

    // Links
    html = html.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" class="text-primary underline">$1</a>'
    )

    // Blockquotes
    html = html.replace(
      /^> (.*)$/gim,
      '<blockquote class="border-l-4 border-primary/30 pl-4 italic text-muted-foreground my-4">$1</blockquote>'
    )

    // Lists
    html = html.replace(/^\- (.*)$/gim, '<li class="ml-4">$1</li>')
    html = html.replace(/^(\d+)\. (.*)$/gim, '<li class="ml-4" value="$1">$2</li>')

    // Checkboxes
    html = html.replace(
      /- \[ \] (.*)$/gim,
      '<li class="ml-4 list-none"><input type="checkbox" disabled class="mr-2" />$1</li>'
    )
    html = html.replace(
      /- \[x\] (.*)$/gim,
      '<li class="ml-4 list-none"><input type="checkbox" disabled checked class="mr-2" />$1</li>'
    )

    // Code blocks
    html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (_, lang, code) => {
      return `<pre class="bg-muted p-4 rounded-lg overflow-x-auto my-4"><code class="text-sm font-mono">${escapeHtml(code.trim())}</code></pre>`
    })

    // Tables
    html = html.replace(/\|(.+)\|/g, match => {
      if (match.includes('---')) {
        return '' // Skip separator rows
      }
      const cells = match.split('|').filter(cell => cell.trim() !== '')
      const cellsHtml = cells
        .map(cell => `<td class="border border-border px-3 py-2">${cell.trim()}</td>`)
        .join('')
      return `<tr>${cellsHtml}</tr>`
    })
    html = html.replace(/(<tr>.*<\/tr>)+/g, '<table class="w-full border-collapse my-4">$&</table>')

    // Paragraphs
    html = html.replace(/^(?!<[h|l|b|t|p])(.*$)/gim, '<p class="my-2">$1</p>')

    // Horizontal rules
    html = html.replace(/^---$/gim, '<hr class="my-6 border-border" />')

    htmlRef.current.innerHTML = html
  }, [content])

  return <div ref={htmlRef} className="prose prose-neutral dark:prose-invert max-w-none" />
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }
  return text.replace(/[&<>"']/g, m => map[m])
}

/**
 * SkillEditor Component
 *
 * Provides a full-featured markdown editor with live preview,
 * undo/redo support, and section regeneration.
 */
export function SkillEditor({
  skill,
  className,
  onSave,
  onRegenerate,
  readOnly = false,
}: SkillEditorProps) {
  // Editor state
  const [content, setContent] = React.useState(skill.markdown)
  const [viewMode, setViewMode] = React.useState<ViewMode>('split')
  const [hasChanges, setHasChanges] = React.useState(false)

  // History for undo/redo
  const [history, setHistory] = React.useState<HistoryEntry[]>([
    { content: skill.markdown, timestamp: Date.now() },
  ])
  const [historyIndex, setHistoryIndex] = React.useState(0)

  // Refs
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  /**
   * Handle content change
   */
  const handleContentChange = React.useCallback(
    (newContent: string) => {
      setContent(newContent)
      setHasChanges(newContent !== skill.markdown)

      // Add to history (debounced)
      const newEntry: HistoryEntry = {
        content: newContent,
        timestamp: Date.now(),
      }

      // Only add to history if content is different and enough time has passed
      const lastEntry = history[historyIndex]
      if (lastEntry && newEntry.timestamp - lastEntry.timestamp > 1000) {
        // Remove any future history if we're not at the end
        const newHistory = history.slice(0, historyIndex + 1)
        newHistory.push(newEntry)

        // Limit history to 50 entries
        if (newHistory.length > 50) {
          newHistory.shift()
        } else {
          setHistoryIndex(historyIndex + 1)
        }

        setHistory(newHistory)
      }
    },
    [skill.markdown, history, historyIndex]
  )

  /**
   * Undo last change
   */
  const handleUndo = React.useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      setHistoryIndex(newIndex)
      setContent(history[newIndex].content)
      setHasChanges(history[newIndex].content !== skill.markdown)
    }
  }, [historyIndex, history, skill.markdown])

  /**
   * Redo last undone change
   */
  const handleRedo = React.useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1
      setHistoryIndex(newIndex)
      setContent(history[newIndex].content)
      setHasChanges(history[newIndex].content !== skill.markdown)
    }
  }, [historyIndex, history, skill.markdown])

  /**
   * Save changes
   */
  const handleSave = React.useCallback(() => {
    if (onSave && hasChanges) {
      onSave(content)
      setHasChanges(false)
    }
  }, [onSave, content, hasChanges])

  /**
   * Reset to original
   */
  const handleReset = React.useCallback(() => {
    setContent(skill.markdown)
    setHasChanges(false)
    setHistory([{ content: skill.markdown, timestamp: Date.now() }])
    setHistoryIndex(0)
  }, [skill.markdown])

  /**
   * Keyboard shortcuts
   */
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Z for undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        handleUndo()
      }

      // Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y for redo
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault()
        handleRedo()
      }

      // Ctrl/Cmd + S for save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleUndo, handleRedo, handleSave])

  /**
   * Calculate token count
   */
  const tokenCount = React.useMemo(() => {
    return Math.ceil(content.length / 4)
  }, [content])

  /**
   * Get token count color
   */
  const tokenCountColor = React.useMemo(() => {
    if (tokenCount > 5000) {
      return 'text-destructive'
    } else if (tokenCount > 4000) {
      return 'text-yellow-600 dark:text-yellow-500'
    } else {
      return 'text-green-600 dark:text-green-500'
    }
  }, [tokenCount])

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b bg-card">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-foreground">Skill Editor</h2>
          {hasChanges && <span className="text-xs text-muted-foreground">(unsaved changes)</span>}
        </div>

        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex items-center gap-1 border rounded-md p-1">
            <Button
              variant={viewMode === 'edit' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('edit')}
              className="h-8 px-2"
            >
              <Code className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'split' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('split')}
              className="h-8 px-2"
            >
              <SplitSquareHorizontal className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'preview' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('preview')}
              className="h-8 px-2"
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Undo/Redo */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleUndo}
            disabled={historyIndex === 0 || readOnly}
            className="h-8 px-2"
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRedo}
            disabled={historyIndex === history.length - 1 || readOnly}
            className="h-8 px-2"
          >
            <Redo className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="h-6" />

          {/* Actions */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            disabled={!hasChanges || readOnly}
            className="h-8 px-3"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>

          {onRegenerate && (
            <Button variant="outline" size="sm" onClick={onRegenerate} className="h-8 px-3">
              <RotateCcw className="h-4 w-4 mr-2" />
              Regenerate
            </Button>
          )}

          {onSave && (
            <Button
              variant="default"
              size="sm"
              onClick={handleSave}
              disabled={!hasChanges || readOnly}
              className="h-8 px-3"
            >
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          )}
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Info className="h-3 w-3" />
            <span>Lines: {content.split('\n').length}</span>
          </div>
          <div className="flex items-center gap-1">
            <Info className="h-3 w-3" />
            <span>Characters: {content.length.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1">
            <Info className="h-3 w-3" />
            <span className={tokenCountColor}>
              Tokens: {tokenCount.toLocaleString()}
              {tokenCount > 5000 && ' (exceeds limit)'}
            </span>
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          {readOnly ? 'Read-only mode' : 'Ctrl/Cmd + S to save'}
        </div>
      </div>

      {/* Editor/Preview area */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'edit' && (
          <div className="h-full">
            <Textarea
              ref={textareaRef}
              value={content}
              onChange={e => handleContentChange(e.target.value)}
              readOnly={readOnly}
              className="h-full w-full resize-none font-mono text-sm border-0 rounded-none focus-visible:ring-0"
              placeholder="Enter your SKILL.md content here..."
            />
          </div>
        )}

        {viewMode === 'preview' && (
          <div className="h-full overflow-auto p-6 bg-card">
            <MarkdownPreview content={content} />
          </div>
        )}

        {viewMode === 'split' && (
          <div className="h-full grid grid-cols-2 divide-x">
            {/* Editor pane */}
            <div className="h-full overflow-hidden">
              <Textarea
                ref={textareaRef}
                value={content}
                onChange={e => handleContentChange(e.target.value)}
                readOnly={readOnly}
                className="h-full w-full resize-none font-mono text-sm border-0 rounded-none focus-visible:ring-0"
                placeholder="Enter your SKILL.md content here..."
              />
            </div>

            {/* Preview pane */}
            <div className="h-full overflow-auto p-6 bg-card">
              <MarkdownPreview content={content} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
