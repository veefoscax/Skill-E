/**
 * Variable Confirmation Component
 *
 * Provides UI for reviewing and confirming detected variables with:
 * - List of detected variables with confidence indicators
 * - Origin information (speech snippet / action)
 * - Edit controls (rename, change type, delete)
 * - Highlight low-confidence detections
 * - Manual variable addition
 *
 * Requirements: FR-7.6, FR-7.7
 */

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Check,
  X,
  Edit2,
  Trash2,
  Plus,
  AlertCircle,
  CheckCircle2,
  MessageSquare,
  MousePointer,
  MoreVertical,
  Save,
  XCircle,
  Sparkles,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { VariableHint, VariableType } from '@/types/variables'
import { VariableType as VarType } from '@/types/variables'
import type { ILLMProvider } from '@/lib/llm/types'
import { needsLLMEnhancement, enhanceWithLLM } from '@/lib/variable-detection-llm'
import type { TranscriptSegment } from '@/lib/variable-detection'
import type { ActionEvent } from '@/lib/variable-detection-llm'

export interface VariableConfirmationProps {
  /** Detected variables to review */
  detectedVariables: VariableHint[]
  /** Callback when variables are confirmed */
  onConfirm: (variables: VariableHint[]) => void
  /** Callback when a variable is added manually */
  onAddManual?: (variable: VariableHint) => void
  /** Optional className for styling */
  className?: string
  /** Optional LLM provider for enhancement */
  llmProvider?: ILLMProvider
  /** Speech segments for LLM enhancement context */
  speechSegments?: TranscriptSegment[]
  /** Action events for LLM enhancement context */
  actions?: ActionEvent[]
  /** Callback when variables are enhanced by LLM */
  onEnhanced?: (variables: VariableHint[]) => void
}

/**
 * Get confidence level category
 */
function getConfidenceLevel(confidence: number): 'high' | 'medium' | 'low' {
  if (confidence >= 0.8) return 'high'
  if (confidence >= 0.6) return 'medium'
  return 'low'
}

/**
 * Get confidence color classes
 */
function getConfidenceColor(confidence: number): string {
  const level = getConfidenceLevel(confidence)
  switch (level) {
    case 'high':
      return 'text-green-600 dark:text-green-500 bg-green-50 dark:bg-green-950/30'
    case 'medium':
      return 'text-yellow-600 dark:text-yellow-500 bg-yellow-50 dark:bg-yellow-950/30'
    case 'low':
      return 'text-orange-600 dark:text-orange-500 bg-orange-50 dark:bg-orange-950/30'
  }
}

/**
 * Get variable type icon and label
 */
function getVariableTypeInfo(type: VariableType): { icon: string; label: string } {
  switch (type) {
    case VarType.TEXT:
      return { icon: '📝', label: 'Text' }
    case VarType.NUMBER:
      return { icon: '🔢', label: 'Number' }
    case VarType.SELECTION:
      return { icon: '📋', label: 'Selection' }
    case VarType.FILE:
      return { icon: '📁', label: 'File' }
    case VarType.DATE:
      return { icon: '📅', label: 'Date' }
    default:
      return { icon: '❓', label: 'Unknown' }
  }
}

/**
 * Format timestamp to readable time
 */
function formatTimestamp(timestamp: number): string {
  const seconds = Math.floor(timestamp / 1000)
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

/**
 * Variable Card Component
 * Displays a single variable with edit controls
 */
interface VariableCardProps {
  variable: VariableHint
  onUpdate: (updated: VariableHint) => void
  onDelete: () => void
  onConfirm: () => void
  onReject: () => void
}

function VariableCard({ variable, onUpdate, onDelete, onConfirm, onReject }: VariableCardProps) {
  const [isEditing, setIsEditing] = React.useState(false)
  const [editedName, setEditedName] = React.useState(variable.name)
  const [editedType, setEditedType] = React.useState(variable.type)
  const [editedDefaultValue, setEditedDefaultValue] = React.useState(variable.defaultValue || '')

  const confidenceLevel = getConfidenceLevel(variable.confidence)
  const confidenceColor = getConfidenceColor(variable.confidence)
  const typeInfo = getVariableTypeInfo(variable.type)

  const handleSave = () => {
    onUpdate({
      ...variable,
      name: editedName,
      type: editedType,
      defaultValue: editedDefaultValue || undefined,
    })
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditedName(variable.name)
    setEditedType(variable.type)
    setEditedDefaultValue(variable.defaultValue || '')
    setIsEditing(false)
  }

  return (
    <div
      className={cn(
        'rounded-lg border bg-card p-4 space-y-3 transition-all',
        variable.status === 'confirmed' &&
          'border-green-500/50 bg-green-50/50 dark:bg-green-950/20',
        variable.status === 'rejected' && 'opacity-50 border-destructive/50',
        confidenceLevel === 'low' && variable.status === 'detected' && 'border-orange-500/50'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          {/* Variable Name */}
          {isEditing ? (
            <Input
              value={editedName}
              onChange={e => setEditedName(e.target.value)}
              className="h-8 font-mono text-sm"
              placeholder="variableName"
            />
          ) : (
            <div className="flex items-center gap-2">
              <code className="text-sm font-semibold font-mono">{variable.name}</code>
              {variable.status === 'confirmed' && (
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-500" />
              )}
              {variable.status === 'rejected' && <XCircle className="h-4 w-4 text-destructive" />}
            </div>
          )}

          {/* Type and Confidence */}
          <div className="flex items-center gap-2 flex-wrap">
            {isEditing ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-6 text-xs">
                    {typeInfo.icon} {typeInfo.label}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {Object.values(VarType).map(type => {
                    const info = getVariableTypeInfo(type)
                    return (
                      <DropdownMenuItem key={type} onClick={() => setEditedType(type)}>
                        {info.icon} {info.label}
                      </DropdownMenuItem>
                    )
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted text-xs font-medium">
                {typeInfo.icon} {typeInfo.label}
              </span>
            )}

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium',
                      confidenceColor
                    )}
                  >
                    {confidenceLevel === 'low' && <AlertCircle className="h-3 w-3" />}
                    {Math.round(variable.confidence * 100)}%
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">
                    {confidenceLevel === 'high' && 'High confidence - likely correct'}
                    {confidenceLevel === 'medium' && 'Medium confidence - review recommended'}
                    {confidenceLevel === 'low' && 'Low confidence - needs review'}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {isEditing ? (
            <>
              <Button variant="ghost" size="sm" onClick={handleSave} className="h-7 w-7 p-0">
                <Save className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleCancel} className="h-7 w-7 p-0">
                <X className="h-3.5 w-3.5" />
              </Button>
            </>
          ) : (
            <>
              {variable.status === 'detected' && (
                <>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={onConfirm}
                          className="h-7 w-7 p-0 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950/30"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Confirm variable</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={onReject}
                          className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Reject variable</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                    <MoreVertical className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setIsEditing(true)}>
                    <Edit2 className="h-3.5 w-3.5 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onDelete} className="text-destructive">
                    <Trash2 className="h-3.5 w-3.5 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>

      {/* Default Value */}
      {(isEditing || variable.defaultValue) && (
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Default Value</Label>
          {isEditing ? (
            <Input
              value={editedDefaultValue}
              onChange={e => setEditedDefaultValue(e.target.value)}
              className="h-7 text-xs"
              placeholder="Optional default value"
            />
          ) : (
            <code className="block text-xs bg-muted px-2 py-1 rounded">
              {variable.defaultValue}
            </code>
          )}
        </div>
      )}

      {/* Description */}
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Description</Label>
        <p className="text-xs text-foreground">{variable.description}</p>
      </div>

      {/* Origin Information */}
      <div className="space-y-2 pt-2 border-t">
        <Label className="text-xs text-muted-foreground">Origin</Label>
        <div className="space-y-1.5">
          {variable.origin.speechSnippet && (
            <div className="flex items-start gap-2 text-xs">
              <MessageSquare className="h-3.5 w-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-muted-foreground italic">"{variable.origin.speechSnippet}"</p>
                {variable.origin.speechTimestamp !== undefined && (
                  <p className="text-muted-foreground/70 text-[10px] mt-0.5">
                    at {formatTimestamp(variable.origin.speechTimestamp)}
                  </p>
                )}
              </div>
            </div>
          )}

          {variable.origin.actionType && (
            <div className="flex items-start gap-2 text-xs">
              <MousePointer className="h-3.5 w-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-muted-foreground">
                  Action: <span className="font-medium">{variable.origin.actionType}</span>
                  {variable.origin.actionValue && <span> = "{variable.origin.actionValue}"</span>}
                </p>
                {variable.origin.actionTimestamp !== undefined && (
                  <p className="text-muted-foreground/70 text-[10px] mt-0.5">
                    at {formatTimestamp(variable.origin.actionTimestamp)}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Manual Variable Addition Form
 */
interface ManualAddFormProps {
  onAdd: (variable: Omit<VariableHint, 'id' | 'status'>) => void
  onCancel: () => void
}

function ManualAddForm({ onAdd, onCancel }: ManualAddFormProps) {
  const [name, setName] = React.useState('')
  const [type, setType] = React.useState<VariableType>(VarType.TEXT)
  const [defaultValue, setDefaultValue] = React.useState('')
  const [description, setDescription] = React.useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) return

    onAdd({
      name: name.trim(),
      type,
      defaultValue: defaultValue.trim() || undefined,
      description: description.trim() || `Manually added ${type} variable`,
      confidence: 1.0, // Manual additions have full confidence
      origin: {
        source: 'manual',
      },
    })

    // Reset form
    setName('')
    setType(VarType.TEXT)
    setDefaultValue('')
    setDescription('')
  }

  const typeInfo = getVariableTypeInfo(type)

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Add Variable Manually</h3>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} className="h-7 w-7 p-0">
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="space-y-3">
        {/* Variable Name */}
        <div className="space-y-1.5">
          <Label htmlFor="var-name" className="text-xs">
            Variable Name *
          </Label>
          <Input
            id="var-name"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="customerName"
            className="h-8 font-mono text-sm"
            required
          />
        </div>

        {/* Variable Type */}
        <div className="space-y-1.5">
          <Label className="text-xs">Type</Label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="w-full justify-start h-8 text-xs">
                {typeInfo.icon} {typeInfo.label}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-full">
              {Object.values(VarType).map(varType => {
                const info = getVariableTypeInfo(varType)
                return (
                  <DropdownMenuItem key={varType} onClick={() => setType(varType)}>
                    {info.icon} {info.label}
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Default Value */}
        <div className="space-y-1.5">
          <Label htmlFor="var-default" className="text-xs">
            Default Value
          </Label>
          <Input
            id="var-default"
            value={defaultValue}
            onChange={e => setDefaultValue(e.target.value)}
            placeholder="Optional"
            className="h-8 text-sm"
          />
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <Label htmlFor="var-description" className="text-xs">
            Description
          </Label>
          <Input
            id="var-description"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="What is this variable for?"
            className="h-8 text-sm"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 pt-2">
        <Button type="submit" size="sm" className="flex-1" disabled={!name.trim()}>
          <Plus className="h-3.5 w-3.5 mr-2" />
          Add Variable
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

/**
 * Main VariableConfirmation Component
 */
export function VariableConfirmation({
  detectedVariables,
  onConfirm,
  onAddManual,
  className,
  llmProvider,
  speechSegments = [],
  actions = [],
  onEnhanced,
}: VariableConfirmationProps) {
  const [variables, setVariables] = React.useState<VariableHint[]>(detectedVariables)
  const [showManualAdd, setShowManualAdd] = React.useState(false)
  const [filter, setFilter] = React.useState<'all' | 'detected' | 'confirmed' | 'rejected'>('all')
  const [isEnhancing, setIsEnhancing] = React.useState(false)
  const [enhancementError, setEnhancementError] = React.useState<string | null>(null)

  // Update variables when detectedVariables prop changes
  React.useEffect(() => {
    setVariables(detectedVariables)
  }, [detectedVariables])

  // Filter variables based on selected filter
  const filteredVariables = React.useMemo(() => {
    if (filter === 'all') return variables
    return variables.filter(v => v.status === filter)
  }, [variables, filter])

  // Group variables by confidence level
  const groupedVariables = React.useMemo(() => {
    const high: VariableHint[] = []
    const medium: VariableHint[] = []
    const low: VariableHint[] = []

    filteredVariables.forEach(v => {
      const level = getConfidenceLevel(v.confidence)
      if (level === 'high') high.push(v)
      else if (level === 'medium') medium.push(v)
      else low.push(v)
    })

    return { high, medium, low }
  }, [filteredVariables])

  // Statistics
  const stats = React.useMemo(() => {
    const total = variables.length
    const confirmed = variables.filter(v => v.status === 'confirmed').length
    const rejected = variables.filter(v => v.status === 'rejected').length
    const pending = variables.filter(v => v.status === 'detected').length
    const lowConfidence = variables.filter(
      v => getConfidenceLevel(v.confidence) === 'low' && v.status === 'detected'
    ).length

    return { total, confirmed, rejected, pending, lowConfidence }
  }, [variables])

  const handleUpdate = (id: string, updated: VariableHint) => {
    setVariables(prev => prev.map(v => (v.id === id ? updated : v)))
  }

  const handleDelete = (id: string) => {
    setVariables(prev => prev.filter(v => v.id !== id))
  }

  const handleConfirm = (id: string) => {
    setVariables(prev => prev.map(v => (v.id === id ? { ...v, status: 'confirmed' as const } : v)))
  }

  const handleReject = (id: string) => {
    setVariables(prev => prev.map(v => (v.id === id ? { ...v, status: 'rejected' as const } : v)))
  }

  const handleConfirmAll = () => {
    setVariables(prev =>
      prev.map(v => (v.status === 'detected' ? { ...v, status: 'confirmed' as const } : v))
    )
  }

  const handleManualAdd = (newVar: Omit<VariableHint, 'id' | 'status'>) => {
    const variable: VariableHint = {
      ...newVar,
      id: crypto.randomUUID(),
      status: 'confirmed', // Manual additions are auto-confirmed
    }

    setVariables(prev => [...prev, variable])
    setShowManualAdd(false)

    if (onAddManual) {
      onAddManual(variable)
    }
  }

  const handleFinalConfirm = () => {
    // Only pass confirmed variables
    const confirmedVars = variables.filter(v => v.status === 'confirmed')
    onConfirm(confirmedVars)
  }

  const handleEnhanceWithLLM = async () => {
    if (!llmProvider) return

    setIsEnhancing(true)
    setEnhancementError(null)

    try {
      const preliminaryResult = {
        variables,
        conditionals: [],
        processingTime: 0,
      }

      const enhancedResult = await enhanceWithLLM(
        preliminaryResult,
        speechSegments,
        actions,
        llmProvider,
        { enabled: true, edgeCaseOnly: true, minConfidenceThreshold: 0.6 }
      )

      // Merge enhanced variables with existing confirmed/rejected status
      const mergedVariables = enhancedResult.variables.map(enhanced => {
        const existing = variables.find(v => v.id === enhanced.id)
        if (existing) {
          return { ...enhanced, status: existing.status }
        }
        return enhanced
      })

      setVariables(mergedVariables)
      onEnhanced?.(mergedVariables)
    } catch (error) {
      console.error('LLM enhancement failed:', error)
      setEnhancementError(error instanceof Error ? error.message : 'Enhancement failed')
    } finally {
      setIsEnhancing(false)
    }
  }

  // Check if enhancement is available and needed
  const canEnhance =
    llmProvider && needsLLMEnhancement({ variables, conditionals: [], processingTime: 0 })
  const lowConfidenceCount = variables.filter(
    v => getConfidenceLevel(v.confidence) === 'low'
  ).length

  return (
    <div className={cn('flex flex-col space-y-6', className)}>
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-foreground">Variable Confirmation</h2>
            <p className="text-sm text-muted-foreground">
              Review and confirm detected variables before generating the skill
            </p>
          </div>

          <Button
            onClick={() => setShowManualAdd(!showManualAdd)}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Variable
          </Button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-5 gap-3">
          <div className="rounded-lg border bg-card p-3">
            <div className="text-xs text-muted-foreground mb-1">Total</div>
            <div className="text-2xl font-bold text-foreground">{stats.total}</div>
          </div>
          <div className="rounded-lg border bg-card p-3">
            <div className="text-xs text-muted-foreground mb-1">Confirmed</div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-500">
              {stats.confirmed}
            </div>
          </div>
          <div className="rounded-lg border bg-card p-3">
            <div className="text-xs text-muted-foreground mb-1">Pending</div>
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-500">
              {stats.pending}
            </div>
          </div>
          <div className="rounded-lg border bg-card p-3">
            <div className="text-xs text-muted-foreground mb-1">Low Conf.</div>
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-500">
              {stats.lowConfidence}
            </div>
          </div>
          <div className="rounded-lg border bg-card p-3">
            <div className="text-xs text-muted-foreground mb-1">Rejected</div>
            <div className="text-2xl font-bold text-destructive">{stats.rejected}</div>
          </div>
        </div>

        {/* LLM Enhancement Button */}
        {llmProvider && (
          <div className="flex items-center justify-between rounded-lg border bg-card p-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium">AI Enhancement Available</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {lowConfidenceCount > 0
                  ? `${lowConfidenceCount} low confidence variable${lowConfidenceCount !== 1 ? 's' : ''} can be analyzed with AI`
                  : 'AI can help validate and improve variable detection'}
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleEnhanceWithLLM}
              disabled={isEnhancing}
              className="gap-2"
            >
              {isEnhancing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Enhance with AI
                </>
              )}
            </Button>
          </div>
        )}

        {/* Enhancement Error */}
        {enhancementError && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span>Enhancement failed: {enhancementError}</span>
            </div>
          </div>
        )}
      </div>

      <Separator />

      {/* Filter and Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant={filter === 'all' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All ({variables.length})
          </Button>
          <Button
            variant={filter === 'detected' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setFilter('detected')}
          >
            Pending ({stats.pending})
          </Button>
          <Button
            variant={filter === 'confirmed' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setFilter('confirmed')}
          >
            Confirmed ({stats.confirmed})
          </Button>
          <Button
            variant={filter === 'rejected' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setFilter('rejected')}
          >
            Rejected ({stats.rejected})
          </Button>
        </div>

        {stats.pending > 0 && (
          <Button variant="outline" size="sm" onClick={handleConfirmAll}>
            <Check className="h-4 w-4 mr-2" />
            Confirm All Pending
          </Button>
        )}
      </div>

      {/* Manual Add Form */}
      {showManualAdd && (
        <ManualAddForm onAdd={handleManualAdd} onCancel={() => setShowManualAdd(false)} />
      )}

      {/* Variables List */}
      <div className="space-y-6">
        {/* Low Confidence Variables (needs attention) */}
        {groupedVariables.low.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-500" />
              <h3 className="text-sm font-semibold text-foreground">
                Low Confidence - Needs Review ({groupedVariables.low.length})
              </h3>
            </div>
            <div className="space-y-3">
              {groupedVariables.low.map(variable => (
                <VariableCard
                  key={variable.id}
                  variable={variable}
                  onUpdate={updated => handleUpdate(variable.id, updated)}
                  onDelete={() => handleDelete(variable.id)}
                  onConfirm={() => handleConfirm(variable.id)}
                  onReject={() => handleReject(variable.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Medium Confidence Variables */}
        {groupedVariables.medium.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">
              Medium Confidence ({groupedVariables.medium.length})
            </h3>
            <div className="space-y-3">
              {groupedVariables.medium.map(variable => (
                <VariableCard
                  key={variable.id}
                  variable={variable}
                  onUpdate={updated => handleUpdate(variable.id, updated)}
                  onDelete={() => handleDelete(variable.id)}
                  onConfirm={() => handleConfirm(variable.id)}
                  onReject={() => handleReject(variable.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* High Confidence Variables */}
        {groupedVariables.high.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">
              High Confidence ({groupedVariables.high.length})
            </h3>
            <div className="space-y-3">
              {groupedVariables.high.map(variable => (
                <VariableCard
                  key={variable.id}
                  variable={variable}
                  onUpdate={updated => handleUpdate(variable.id, updated)}
                  onDelete={() => handleDelete(variable.id)}
                  onConfirm={() => handleConfirm(variable.id)}
                  onReject={() => handleReject(variable.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredVariables.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">
              {filter === 'all'
                ? 'No variables detected. Add one manually to get started.'
                : `No ${filter} variables.`}
            </p>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      {stats.confirmed > 0 && (
        <>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {stats.confirmed} variable{stats.confirmed !== 1 ? 's' : ''} confirmed
              {stats.pending > 0 && `, ${stats.pending} pending review`}
            </div>
            <Button onClick={handleFinalConfirm} size="lg" className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Continue with {stats.confirmed} Variable{stats.confirmed !== 1 ? 's' : ''}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
