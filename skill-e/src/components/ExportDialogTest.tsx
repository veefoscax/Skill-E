import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ExportDialog, type ExportOptions } from '@/components/ExportDialog';
import { FileDown, CheckCircle2 } from 'lucide-react';

/**
 * ExportDialog Test Component
 * 
 * Tests the export dialog functionality including:
 * - Default path loading (workspace/skills)
 * - Custom folder selection
 * - Skill name validation and sanitization
 * - Export options (screenshots, assets)
 * - Folder structure preview
 * 
 * Requirements: FR-6.4, FR-6.8, FR-6.9
 */
export function ExportDialogTest() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [lastExport, setLastExport] = useState<ExportOptions | null>(null);
  const [exportSuccess, setExportSuccess] = useState(false);

  const handleExport = async (options: ExportOptions) => {
    console.log('Export requested with options:', options);
    setLastExport(options);
    setIsExporting(true);
    setExportSuccess(false);

    // Simulate export process
    await new Promise(resolve => setTimeout(resolve, 2000));

    setIsExporting(false);
    setExportSuccess(true);
    setIsOpen(false);

    // Clear success message after 3 seconds
    setTimeout(() => setExportSuccess(false), 3000);
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Export Dialog Test</h1>
          <p className="text-muted-foreground">
            Test the skill export dialog with various configurations
          </p>
        </div>

        {/* Test Controls */}
        <div className="space-y-4 p-6 border rounded-lg bg-card">
          <h2 className="text-xl font-semibold">Test Controls</h2>
          
          <div className="space-y-3">
            <Button
              onClick={() => setIsOpen(true)}
              className="w-full"
              size="lg"
            >
              <FileDown className="h-4 w-4 mr-2" />
              Open Export Dialog
            </Button>

            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => {
                  setIsOpen(true);
                }}
                variant="outline"
              >
                Test with Default Name
              </Button>
              <Button
                onClick={() => {
                  setIsOpen(true);
                }}
                variant="outline"
              >
                Test Custom Name
              </Button>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {exportSuccess && (
          <div className="p-4 border border-green-500 bg-green-500/10 rounded-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <div>
              <p className="font-medium text-green-500">Export Successful!</p>
              <p className="text-sm text-muted-foreground">
                Skill exported to: {lastExport?.exportPath}/{lastExport?.skillName}
              </p>
            </div>
          </div>
        )}

        {/* Last Export Info */}
        {lastExport && (
          <div className="space-y-4 p-6 border rounded-lg bg-card">
            <h2 className="text-xl font-semibold">Last Export Configuration</h2>
            
            <div className="space-y-3 font-mono text-sm">
              <div className="grid grid-cols-[140px_1fr] gap-2">
                <span className="text-muted-foreground">Skill Name:</span>
                <span className="font-medium">{lastExport.skillName}</span>
              </div>
              
              <div className="grid grid-cols-[140px_1fr] gap-2">
                <span className="text-muted-foreground">Export Path:</span>
                <span className="font-medium break-all">{lastExport.exportPath}</span>
              </div>
              
              <div className="grid grid-cols-[140px_1fr] gap-2">
                <span className="text-muted-foreground">Full Path:</span>
                <span className="font-medium break-all">
                  {lastExport.exportPath}/{lastExport.skillName}/
                </span>
              </div>
              
              <div className="grid grid-cols-[140px_1fr] gap-2">
                <span className="text-muted-foreground">Screenshots:</span>
                <span className={lastExport.includeScreenshots ? 'text-green-500' : 'text-muted-foreground'}>
                  {lastExport.includeScreenshots ? '✓ Included' : '✗ Not included'}
                </span>
              </div>
              
              <div className="grid grid-cols-[140px_1fr] gap-2">
                <span className="text-muted-foreground">Assets:</span>
                <span className={lastExport.includeAssets ? 'text-green-500' : 'text-muted-foreground'}>
                  {lastExport.includeAssets ? '✓ Included' : '✗ Not included'}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t">
              <h3 className="text-sm font-semibold mb-2">Expected Folder Structure:</h3>
              <div className="p-3 rounded-md bg-muted/50 font-mono text-xs space-y-1">
                <div>{lastExport.exportPath}/{lastExport.skillName}/</div>
                <div className="ml-4">├── SKILL.md</div>
                {lastExport.includeScreenshots && (
                  <>
                    <div className="ml-4">├── references/</div>
                    <div className="ml-8">├── step1.png</div>
                    <div className="ml-8">├── step2.png</div>
                    <div className="ml-8">└── ...</div>
                  </>
                )}
                {lastExport.includeAssets && (
                  <>
                    <div className="ml-4">└── assets/</div>
                    <div className="ml-8">└── ...</div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Test Cases */}
        <div className="space-y-4 p-6 border rounded-lg bg-card">
          <h2 className="text-xl font-semibold">Test Cases</h2>
          
          <div className="space-y-3 text-sm">
            <div className="space-y-2">
              <h3 className="font-semibold">✓ Test Cases to Verify:</h3>
              <ul className="space-y-1 ml-4 list-disc text-muted-foreground">
                <li>Default path loads as workspace/skills (or user's home/workspace/skills)</li>
                <li>Browse button opens folder picker dialog</li>
                <li>Skill name is sanitized (lowercase, hyphens, no special chars)</li>
                <li>Invalid names show error message (less than 3 chars)</li>
                <li>Toggle switches work for screenshots and assets</li>
                <li>Folder structure preview updates based on options</li>
                <li>Export button is disabled when name is invalid</li>
                <li>Export button shows "Exporting..." during export</li>
                <li>Dialog can be closed with Cancel button</li>
                <li>ESC key closes the dialog</li>
              </ul>
            </div>

            <div className="space-y-2 pt-4 border-t">
              <h3 className="font-semibold">🧪 Name Sanitization Tests:</h3>
              <div className="space-y-1 ml-4 font-mono text-xs">
                <div className="grid grid-cols-[200px_1fr] gap-2">
                  <span className="text-muted-foreground">"My Cool Skill"</span>
                  <span>→ "my-cool-skill"</span>
                </div>
                <div className="grid grid-cols-[200px_1fr] gap-2">
                  <span className="text-muted-foreground">"Create User Account!"</span>
                  <span>→ "create-user-account"</span>
                </div>
                <div className="grid grid-cols-[200px_1fr] gap-2">
                  <span className="text-muted-foreground">"Login@Website.com"</span>
                  <span>→ "loginwebsitecom"</span>
                </div>
                <div className="grid grid-cols-[200px_1fr] gap-2">
                  <span className="text-muted-foreground">"ab"</span>
                  <span className="text-destructive">→ Invalid (too short)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Requirements Coverage */}
        <div className="space-y-4 p-6 border rounded-lg bg-card">
          <h2 className="text-xl font-semibold">Requirements Coverage</h2>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
              <div>
                <span className="font-medium">FR-6.4:</span>
                <span className="text-muted-foreground ml-2">
                  Export location picker with default and custom selection
                </span>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
              <div>
                <span className="font-medium">FR-6.8:</span>
                <span className="text-muted-foreground ml-2">
                  Choose export location (custom or workspace/skills)
                </span>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
              <div>
                <span className="font-medium">FR-6.9:</span>
                <span className="text-muted-foreground ml-2">
                  Option to include references/ folder with screenshots
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Export Dialog */}
      <ExportDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        onExport={handleExport}
        defaultSkillName="create-user-account"
        isExporting={isExporting}
      />
    </div>
  );
}
