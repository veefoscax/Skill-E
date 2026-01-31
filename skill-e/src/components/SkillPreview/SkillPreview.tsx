/**
 * Skill Preview Component
 * 
 * Displays a preview of the generated SKILL.md with:
 * - Rendered markdown with syntax highlighting
 * - Parsed YAML frontmatter display
 * - Copy to clipboard functionality
 * - File size estimate
 * 
 * Requirements: FR-6.2, FR-6.6
 */

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Copy, Check, FileText, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GeneratedSkill } from '@/lib/skill-generator';

export interface SkillPreviewProps {
  /** Generated skill to preview */
  skill: GeneratedSkill;
  /** Optional className for styling */
  className?: string;
  /** Callback when regenerate is requested */
  onRegenerate?: () => void;
}

/**
 * Format file size in human-readable format
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  } else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  } else {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}

/**
 * Format token count with color coding
 */
function getTokenCountColor(tokenCount: number): string {
  if (tokenCount > 5000) {
    return 'text-destructive';
  } else if (tokenCount > 4000) {
    return 'text-yellow-600 dark:text-yellow-500';
  } else {
    return 'text-green-600 dark:text-green-500';
  }
}

/**
 * Simple markdown renderer for preview
 * This is a basic implementation - for production, consider using a library like react-markdown
 */
function MarkdownPreview({ content }: { content: string }) {
  const htmlRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!htmlRef.current) return;

    // Basic markdown parsing
    let html = content;

    // Headers
    html = html.replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-6 mb-3">$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mt-8 mb-4">$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-8 mb-4">$1</h1>');

    // Bold
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold">$1</strong>');

    // Italic
    html = html.replace(/\*([^*]+)\*/g, '<em class="italic">$1</em>');

    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-muted text-sm font-mono">$1</code>');

    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary underline">$1</a>');

    // Blockquotes
    html = html.replace(/^> (.*)$/gim, '<blockquote class="border-l-4 border-primary/30 pl-4 italic text-muted-foreground my-4">$1</blockquote>');

    // Lists
    html = html.replace(/^\- (.*)$/gim, '<li class="ml-4">$1</li>');
    html = html.replace(/^(\d+)\. (.*)$/gim, '<li class="ml-4" value="$1">$2</li>');

    // Checkboxes
    html = html.replace(/- \[ \] (.*)$/gim, '<li class="ml-4 list-none"><input type="checkbox" disabled class="mr-2" />$1</li>');
    html = html.replace(/- \[x\] (.*)$/gim, '<li class="ml-4 list-none"><input type="checkbox" disabled checked class="mr-2" />$1</li>');

    // Code blocks
    html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (_, _lang, code) => {
      return `<pre class="bg-muted p-4 rounded-lg overflow-x-auto my-4"><code class="text-sm font-mono">${escapeHtml(code.trim())}</code></pre>`;
    });

    // Tables
    html = html.replace(/\|(.+)\|/g, (match) => {
      if (match.includes('---')) {
        return ''; // Skip separator rows
      }
      const cells = match.split('|').filter(cell => cell.trim() !== '');
      const cellsHtml = cells.map(cell => `<td class="border border-border px-3 py-2">${cell.trim()}</td>`).join('');
      return `<tr>${cellsHtml}</tr>`;
    });
    html = html.replace(/(<tr>.*<\/tr>)+/g, '<table class="w-full border-collapse my-4">$&</table>');

    // Paragraphs
    html = html.replace(/^(?!<[h|l|b|t|p])(.*$)/gim, '<p class="my-2">$1</p>');

    // Horizontal rules
    html = html.replace(/^---$/gim, '<hr class="my-6 border-border" />');

    htmlRef.current.innerHTML = html;
  }, [content]);

  return <div ref={htmlRef} className="prose prose-neutral dark:prose-invert max-w-none" />;
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
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * SkillPreview Component
 * 
 * Displays a comprehensive preview of the generated skill with metadata,
 * frontmatter, and rendered markdown content.
 */
export function SkillPreview({
  skill,
  className,
  onRegenerate,
}: SkillPreviewProps) {
  const [copied, setCopied] = React.useState(false);

  // Calculate file size estimate
  const fileSizeBytes = new Blob([skill.markdown]).size;

  /**
   * Copy markdown to clipboard
   */
  const handleCopy = React.useCallback(async () => {
    try {
      await navigator.clipboard.writeText(skill.markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  }, [skill.markdown]);

  return (
    <div className={cn('flex flex-col space-y-6', className)}>
      {/* Header with metadata */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-foreground">Skill Preview</h2>
          <p className="text-sm text-muted-foreground">
            Review your generated skill before exporting
          </p>
        </div>

        <Button
          onClick={handleCopy}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              Copy to Clipboard
            </>
          )}
        </Button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <FileText className="h-4 w-4" />
            <span className="text-xs font-medium">File Size</span>
          </div>
          <div className="text-2xl font-bold text-foreground">
            {formatFileSize(fileSizeBytes)}
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Info className="h-4 w-4" />
            <span className="text-xs font-medium">Token Count</span>
          </div>
          <div className={cn('text-2xl font-bold', getTokenCountColor(skill.tokenCount))}>
            {skill.tokenCount.toLocaleString()}
          </div>
          {skill.tokenCount > 5000 && (
            <p className="text-xs text-destructive mt-1">
              Exceeds recommended limit (5000)
            </p>
          )}
        </div>

        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Info className="h-4 w-4" />
            <span className="text-xs font-medium">Generated</span>
          </div>
          <div className="text-sm font-medium text-foreground">
            {new Date(skill.metadata.generatedAt).toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {skill.metadata.provider} • {skill.metadata.model}
          </p>
        </div>
      </div>

      <Separator />

      {/* Frontmatter display */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-foreground">Frontmatter</h3>
        <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
          <div className="grid grid-cols-[120px_1fr] gap-2">
            <span className="text-sm font-medium text-muted-foreground">Name:</span>
            <code className="text-sm font-mono text-foreground">{skill.frontmatter.name}</code>
          </div>
          <div className="grid grid-cols-[120px_1fr] gap-2">
            <span className="text-sm font-medium text-muted-foreground">Description:</span>
            <span className="text-sm text-foreground">{skill.frontmatter.description}</span>
          </div>
          {skill.frontmatter.compatibility ? (
            <div className="grid grid-cols-[120px_1fr] gap-2">
              <span className="text-sm font-medium text-muted-foreground">Compatibility:</span>
              <span className="text-sm text-foreground">{String(skill.frontmatter.compatibility)}</span>
            </div>
          ) : null}
          {skill.frontmatter.license ? (
            <div className="grid grid-cols-[120px_1fr] gap-2">
              <span className="text-sm font-medium text-muted-foreground">License:</span>
              <span className="text-sm text-foreground">{String(skill.frontmatter.license)}</span>
            </div>
          ) : null}
        </div>
      </div>

      <Separator />

      {/* Tool Definition Preview */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-foreground">Tool Definition</h3>
        <div className="rounded-lg border bg-muted/50 p-4">
          <pre className="text-xs font-mono overflow-x-auto">
            {JSON.stringify(skill.toolDefinition, null, 2)}
          </pre>
        </div>
      </div>

      <Separator />

      {/* Markdown preview */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Skill Content</h3>
          {onRegenerate && (
            <Button
              onClick={onRegenerate}
              variant="outline"
              size="sm"
            >
              Regenerate
            </Button>
          )}
        </div>
        <div className="rounded-lg border bg-card p-6 overflow-auto max-h-[600px]">
          <MarkdownPreview content={skill.markdown} />
        </div>
      </div>
    </div>
  );
}
