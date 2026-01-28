/**
 * Skill Export Test Component
 * 
 * Comprehensive test component for the entire skill export workflow:
 * - Skill generation with sample processed session
 * - Preview rendering
 * - Editor functionality
 * - Export saves correctly
 * - Generated skill validation
 * 
 * Requirements: Task 9 - Export Testing
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { generateSkill, type GeneratedSkill } from '@/lib/skill-generator';
import { validateSkill, formatValidationErrors } from '@/lib/skill-validator';
import { SkillPreview } from '@/components/SkillPreview/SkillPreview';
import { SkillEditor } from '@/components/SkillEditor/SkillEditor';
import { ExportDialog } from '@/components/ExportDialog/ExportDialog';
import { useSettingsStore } from '@/stores/settings';
import { invoke } from '@tauri-apps/api/core';
import type { OptimizedContext } from '@/lib/context-optimizer';
import { 
  Loader2, 
  Check, 
  X, 
  FileText, 
  Eye, 
  Edit, 
  Download,
  AlertCircle,
  Sparkles,
  Play
} from 'lucide-react';

/**
 * Sample processed session for testing
 */
const SAMPLE_CONTEXT: OptimizedContext = {
  taskGoal: 'Create a new user account in the admin dashboard',
  keySteps: [
    {
      number: 1,
      timeRange: { start: 0, end: 5000 },
      description: 'Navigate to Users page',
      actions: {
        clicks: 1,
        textInputs: 0,
        annotations: 0,
      },
      notes: ['User clicked on "Users" in the sidebar'],
      context: {
        window: 'Admin Dashboard - Chrome',
        application: 'Google Chrome',
      },
      ocrText: 'Dashboard\nUsers\nSettings\nReports',
    },
    {
      number: 2,
      timeRange: { start: 5000, end: 12000 },
      description: 'Click "Add New User" button',
      actions: {
        clicks: 1,
        textInputs: 0,
        annotations: 1,
      },
      notes: ['User annotated: "This opens the user creation form"'],
      context: {
        window: 'Users - Admin Dashboard',
        application: 'Google Chrome',
      },
      ocrText: 'Users\nAdd New User\nSearch users...',
    },
    {
      number: 3,
      timeRange: { start: 12000, end: 25000 },
      description: 'Fill in user details',
      actions: {
        clicks: 3,
        textInputs: 4,
        annotations: 0,
      },
      notes: [
        'User entered name in "Full Name" field',
        'User entered email in "Email" field',
        'User selected role from dropdown',
      ],
      context: {
        window: 'New User - Admin Dashboard',
        application: 'Google Chrome',
      },
      ocrText: 'Create New User\nFull Name:\nEmail:\nRole:\nAdmin\nEditor\nViewer',
    },
    {
      number: 4,
      timeRange: { start: 25000, end: 30000 },
      description: 'Submit the form',
      actions: {
        clicks: 1,
        textInputs: 0,
        annotations: 1,
      },
      notes: ['User annotated: "Make sure to verify the success message"'],
      context: {
        window: 'New User - Admin Dashboard',
        application: 'Google Chrome',
      },
      ocrText: 'Create User\nCancel',
    },
    {
      number: 5,
      timeRange: { start: 30000, end: 35000 },
      description: 'Verify user was created',
      actions: {
        clicks: 0,
        textInputs: 0,
        annotations: 0,
      },
      notes: ['Success message appeared: "User created successfully"'],
      context: {
        window: 'Users - Admin Dashboard',
        application: 'Google Chrome',
      },
      ocrText: 'Success! User created successfully.\nJohn Doe\njohn@example.com\nAdmin',
    },
  ],
  fullNarration: 'Okay, so to create a new user, first I go to the Users page by clicking on Users in the sidebar. Then I click the Add New User button, which opens the form. I fill in the full name, like John Doe, then the email address, john@example.com. I select the role from the dropdown, let\'s say Admin. Then I click Create User to submit the form. Finally, I verify that the success message appears showing the user was created.',
  variables: [
    {
      name: 'user_name',
      type: 'text',
      description: 'Full name of the user to create',
      exampleValue: 'John Doe',
    },
    {
      name: 'user_email',
      type: 'email',
      description: 'Email address for the new user',
      exampleValue: 'john@example.com',
    },
    {
      name: 'user_role',
      type: 'selection',
      description: 'Role to assign to the user',
      exampleValue: 'Admin',
    },
  ],
  conditionals: [
    {
      condition: 'user_role is Admin',
      thenAction: 'User will have full access to all features',
      elseAction: 'User will have limited access based on role',
    },
  ],
  summary: {
    durationSeconds: 35,
    totalSteps: 5,
    totalClicks: 6,
    totalTextInputs: 4,
    totalAnnotations: 2,
    mainApplication: 'Google Chrome',
  },
};

export function SkillExportTest() {
  const { claudeApiKey } = useSettingsStore();
  
  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generatedSkill, setGeneratedSkill] = useState<GeneratedSkill | null>(null);
  
  // Validation state
  const [validationResult, setValidationResult] = useState<ReturnType<typeof validateSkill> | null>(null);
  
  // Export state
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [exportPath, setExportPath] = useState<string | null>(null);
  
  // Editor state
  const [editedMarkdown, setEditedMarkdown] = useState<string | null>(null);

  /**
   * Test 1: Generate skill from sample context
   */
  const handleGenerate = async () => {
    if (!claudeApiKey) {
      setGenerationError('Claude API key not configured. Please set it in Settings.');
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);
    setGeneratedSkill(null);
    setValidationResult(null);

    try {
      const skill = await generateSkill(SAMPLE_CONTEXT, {
        provider: 'anthropic',
        apiKey: claudeApiKey,
        model: 'claude-3-5-sonnet-20241022',
        maxTokens: 4000,
        temperature: 0.3,
      });

      setGeneratedSkill(skill);
      
      // Automatically validate
      const validation = validateSkill(skill.markdown, skill.toolDefinition);
      setValidationResult(validation);
    } catch (error) {
      setGenerationError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Test 2: Validate generated skill
   */
  const handleValidate = () => {
    if (!generatedSkill) return;

    const markdown = editedMarkdown || generatedSkill.markdown;
    const validation = validateSkill(markdown, generatedSkill.toolDefinition);
    setValidationResult(validation);
  };

  /**
   * Test 3: Save edited skill
   */
  const handleSaveEdit = (markdown: string) => {
    setEditedMarkdown(markdown);
    
    // Re-validate with edited content
    if (generatedSkill) {
      const validation = validateSkill(markdown, generatedSkill.toolDefinition);
      setValidationResult(validation);
    }
  };

  /**
   * Test 4: Export skill to file
   */
  const handleExport = async (options: {
    exportPath: string;
    includeScreenshots: boolean;
    includeAssets: boolean;
    skillName: string;
  }) => {
    if (!generatedSkill) return;

    setIsExporting(true);
    setExportSuccess(false);

    try {
      const markdown = editedMarkdown || generatedSkill.markdown;
      
      // Call Tauri command to save skill
      await invoke('save_skill', {
        skillName: options.skillName,
        markdown,
        toolDefinition: JSON.stringify(generatedSkill.toolDefinition, null, 2),
        exportPath: options.exportPath,
        includeScreenshots: options.includeScreenshots,
        includeAssets: options.includeAssets,
      });

      setExportSuccess(true);
      setExportPath(`${options.exportPath}/${options.skillName}`);
      setShowExportDialog(false);
    } catch (error) {
      setGenerationError(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsExporting(false);
    }
  };

  /**
   * Test 5: Regenerate skill
   */
  const handleRegenerate = async () => {
    setEditedMarkdown(null);
    await handleGenerate();
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Skill Export Test Suite
          </CardTitle>
          <CardDescription>
            Test the complete skill export workflow: generation, preview, editing, validation, and export.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* API Key Status */}
          <div className={`p-3 rounded-lg border flex items-center justify-between ${
            claudeApiKey 
              ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800'
              : 'bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800'
          }`}>
            <div className="flex items-center gap-2">
              {claudeApiKey ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-yellow-600" />
              )}
              <span className="text-sm font-medium">
                {claudeApiKey ? 'Claude API Key Configured' : 'Claude API Key Not Configured'}
              </span>
            </div>
            {!claudeApiKey && (
              <span className="text-xs text-muted-foreground">
                Configure in Settings to test generation
              </span>
            )}
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={!claudeApiKey || isGenerating}
            className="w-full"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating Skill...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Test 1: Generate Skill from Sample Data
              </>
            )}
          </Button>

          {/* Generation Error */}
          {generationError && (
            <div className="p-3 rounded-lg border bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800 flex items-start gap-2">
              <X className="h-4 w-4 text-red-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900 dark:text-red-100">Generation Error</p>
                <p className="text-xs text-red-700 dark:text-red-300 mt-1">{generationError}</p>
              </div>
            </div>
          )}

          {/* Export Success */}
          {exportSuccess && exportPath && (
            <div className="p-3 rounded-lg border bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800 flex items-start gap-2">
              <Check className="h-4 w-4 text-green-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-900 dark:text-green-100">Export Successful!</p>
                <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                  Skill saved to: <code className="font-mono">{exportPath}</code>
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {generatedSkill && (
        <Tabs defaultValue="preview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="preview" className="gap-2">
              <Eye className="h-4 w-4" />
              Test 2: Preview
            </TabsTrigger>
            <TabsTrigger value="editor" className="gap-2">
              <Edit className="h-4 w-4" />
              Test 3: Editor
            </TabsTrigger>
            <TabsTrigger value="validation" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Test 4: Validation
            </TabsTrigger>
            <TabsTrigger value="export" className="gap-2">
              <Download className="h-4 w-4" />
              Test 5: Export
            </TabsTrigger>
          </TabsList>

          {/* Preview Tab */}
          <TabsContent value="preview" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Skill Preview Test</CardTitle>
                <CardDescription>
                  Verify that the generated skill renders correctly with all sections.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SkillPreview
                  skill={generatedSkill}
                  onRegenerate={handleRegenerate}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Editor Tab */}
          <TabsContent value="editor" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Skill Editor Test</CardTitle>
                <CardDescription>
                  Test inline editing, live preview, and undo/redo functionality.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-[600px]">
                  <SkillEditor
                    skill={generatedSkill}
                    onSave={handleSaveEdit}
                    onRegenerate={handleRegenerate}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Validation Tab */}
          <TabsContent value="validation" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Validation Test</CardTitle>
                <CardDescription>
                  Test format validation, linting, and error reporting.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={handleValidate} className="w-full">
                  Run Validation
                </Button>

                {validationResult && (
                  <div className="space-y-4">
                    {/* Overall Status */}
                    <div className={`p-4 rounded-lg border ${
                      validationResult.valid
                        ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800'
                        : 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800'
                    }`}>
                      <div className="flex items-center gap-2">
                        {validationResult.valid ? (
                          <Check className="h-5 w-5 text-green-600" />
                        ) : (
                          <X className="h-5 w-5 text-red-600" />
                        )}
                        <span className="font-medium">
                          {validationResult.valid ? 'Skill is Valid' : 'Skill has Errors'}
                        </span>
                      </div>
                    </div>

                    {/* Validation Errors */}
                    {validationResult.errors.length > 0 && (
                      <div className="p-4 rounded-lg border bg-muted/50">
                        <pre className="text-xs font-mono whitespace-pre-wrap">
                          {formatValidationErrors(validationResult.errors)}
                        </pre>
                      </div>
                    )}

                    {/* Validation Details */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 rounded-lg border bg-card">
                        <p className="text-xs text-muted-foreground mb-1">Token Count</p>
                        <p className="text-2xl font-bold">
                          {validationResult.tokenCount?.toLocaleString()}
                        </p>
                      </div>
                      <div className="p-3 rounded-lg border bg-card">
                        <p className="text-xs text-muted-foreground mb-1">Issues Found</p>
                        <p className="text-2xl font-bold">
                          {validationResult.errors.filter(e => e.severity === 'error').length}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Export Tab */}
          <TabsContent value="export" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Export Test</CardTitle>
                <CardDescription>
                  Test exporting the skill to a file with proper folder structure.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={() => setShowExportDialog(true)}
                  disabled={!validationResult?.valid}
                  className="w-full"
                  size="lg"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Skill
                </Button>

                {!validationResult?.valid && validationResult && (
                  <p className="text-sm text-muted-foreground text-center">
                    Fix validation errors before exporting
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Export Dialog */}
      <ExportDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        onExport={handleExport}
        defaultSkillName={generatedSkill?.frontmatter.name || 'test-skill'}
        isExporting={isExporting}
      />
    </div>
  );
}
