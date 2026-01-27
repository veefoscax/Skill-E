import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FolderOpen, FileText, Image, CheckCircle2, AlertCircle } from 'lucide-react';
import { open as openDialog } from '@tauri-apps/plugin-dialog';
import { homeDir } from '@tauri-apps/api/path';

/**
 * Export Dialog Component
 * 
 * Provides UI for selecting export location and options for skill export.
 * Requirements: FR-6.4, FR-6.8, FR-6.9
 */

export interface ExportOptions {
  /** Export location path */
  exportPath: string;
  /** Include reference screenshots */
  includeScreenshots: boolean;
  /** Include assets/templates */
  includeAssets: boolean;
  /** Skill name (for folder creation) */
  skillName: string;
}

export interface ExportDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when dialog should close */
  onOpenChange: (open: boolean) => void;
  /** Callback when export is confirmed */
  onExport: (options: ExportOptions) => void;
  /** Default skill name */
  defaultSkillName?: string;
  /** Whether export is in progress */
  isExporting?: boolean;
}

/**
 * Sanitize skill name to be filesystem-safe
 * - Lowercase
 * - Replace spaces with hyphens
 * - Remove special characters
 * - Limit length
 */
function sanitizeSkillName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .substring(0, 64);
}

export function ExportDialog({
  open,
  onOpenChange,
  onExport,
  defaultSkillName = 'my-skill',
  isExporting = false,
}: ExportDialogProps) {
  const [exportPath, setExportPath] = useState<string>('');
  const [skillName, setSkillName] = useState(sanitizeSkillName(defaultSkillName));
  const [includeScreenshots, setIncludeScreenshots] = useState(true);
  const [includeAssets, setIncludeAssets] = useState(false);
  const [isLoadingDefaultPath, setIsLoadingDefaultPath] = useState(true);

  // Load default export path on mount
  useEffect(() => {
    const loadDefaultPath = async () => {
      try {
        const home = await homeDir();
        const defaultPath = `${home}workspace/skills`;
        setExportPath(defaultPath);
      } catch (error) {
        console.error('Failed to get home directory:', error);
        setExportPath('workspace/skills');
      } finally {
        setIsLoadingDefaultPath(false);
      }
    };

    if (open) {
      loadDefaultPath();
    }
  }, [open]);

  // Update skill name when default changes
  useEffect(() => {
    if (defaultSkillName) {
      setSkillName(sanitizeSkillName(defaultSkillName));
    }
  }, [defaultSkillName]);

  const handleBrowse = async () => {
    try {
      const selected = await openDialog({
        directory: true,
        multiple: false,
        defaultPath: exportPath,
      });
      
      if (selected && typeof selected === 'string') {
        setExportPath(selected);
      }
    } catch (error) {
      console.error('Failed to open directory picker:', error);
    }
  };

  const handleExport = () => {
    const sanitized = sanitizeSkillName(skillName);
    
    onExport({
      exportPath,
      includeScreenshots,
      includeAssets,
      skillName: sanitized,
    });
  };

  const sanitizedName = sanitizeSkillName(skillName);
  const isValidName = sanitizedName.length >= 3 && sanitizedName.length <= 64;
  const fullPath = exportPath ? `${exportPath}/${sanitizedName}` : '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Export Skill</DialogTitle>
          <DialogDescription>
            Choose where to save your skill and what to include.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Skill Name */}
          <div className="space-y-2">
            <Label htmlFor="skill-name">Skill Name</Label>
            <Input
              id="skill-name"
              value={skillName}
              onChange={(e) => setSkillName(e.target.value)}
              placeholder="my-skill"
              className={!isValidName ? 'border-destructive' : ''}
            />
            {!isValidName && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Name must be 3-64 characters (lowercase, hyphens only)
              </p>
            )}
            {isValidName && sanitizedName !== skillName && (
              <p className="text-xs text-muted-foreground">
                Will be saved as: <code className="text-xs">{sanitizedName}</code>
              </p>
            )}
          </div>

          {/* Export Location */}
          <div className="space-y-2">
            <Label htmlFor="export-path">Export Location</Label>
            <div className="flex gap-2">
              <Input
                id="export-path"
                value={exportPath}
                onChange={(e) => setExportPath(e.target.value)}
                placeholder="Choose folder..."
                readOnly={isLoadingDefaultPath}
                className="flex-1"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleBrowse}
                disabled={isLoadingDefaultPath || isExporting}
              >
                <FolderOpen className="h-4 w-4" />
              </Button>
            </div>
            {isLoadingDefaultPath && (
              <p className="text-xs text-muted-foreground">Loading default path...</p>
            )}
          </div>

          {/* Export Options */}
          <div className="space-y-3">
            <Label>Include</Label>
            
            {/* Screenshots Option */}
            <div className="flex items-center justify-between p-3 rounded-md border bg-card">
              <div className="flex items-center gap-3">
                <Image className="h-4 w-4 text-muted-foreground" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Reference Screenshots</span>
                  <span className="text-xs text-muted-foreground">
                    Include step screenshots in references/ folder
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIncludeScreenshots(!includeScreenshots)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  includeScreenshots ? 'bg-primary' : 'bg-muted'
                }`}
                disabled={isExporting}
              >
                <span
                  className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                    includeScreenshots ? 'translate-x-5' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Assets Option */}
            <div className="flex items-center justify-between p-3 rounded-md border bg-card">
              <div className="flex items-center gap-3">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Assets & Templates</span>
                  <span className="text-xs text-muted-foreground">
                    Include additional files in assets/ folder
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIncludeAssets(!includeAssets)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  includeAssets ? 'bg-primary' : 'bg-muted'
                }`}
                disabled={isExporting}
              >
                <span
                  className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                    includeAssets ? 'translate-x-5' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Preview of folder structure */}
          {isValidName && fullPath && (
            <div className="space-y-2">
              <Label>Folder Structure Preview</Label>
              <div className="p-3 rounded-md border bg-muted/50 font-mono text-xs space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>{fullPath}/</span>
                </div>
                <div className="ml-6 space-y-1">
                  <div>├── SKILL.md</div>
                  {includeScreenshots && (
                    <>
                      <div>├── references/</div>
                      <div className="ml-4">├── step1.png</div>
                      <div className="ml-4">├── step2.png</div>
                      <div className="ml-4">└── ...</div>
                    </>
                  )}
                  {includeAssets && (
                    <>
                      <div>└── assets/</div>
                      <div className="ml-4">└── ...</div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isExporting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={!isValidName || !exportPath || isExporting}
          >
            {isExporting ? 'Exporting...' : 'Export'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
