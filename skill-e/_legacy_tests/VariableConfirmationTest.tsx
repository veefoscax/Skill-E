/**
 * Variable Confirmation Component Test
 * 
 * Interactive test for the VariableConfirmation component.
 * Tests all features including:
 * - Display of detected variables with confidence indicators
 * - Origin information (speech snippet / action)
 * - Edit controls (rename, change type, delete)
 * - Confirm/reject functionality
 * - Manual variable addition
 * - Filtering and grouping
 */

import { useState } from 'react';
import { VariableConfirmation } from './VariableConfirmation/VariableConfirmation';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import type { VariableHint } from '@/types/variables';
import { VariableType } from '@/types/variables';

// Mock detected variables with different confidence levels and origins
const mockVariables: VariableHint[] = [
  {
    id: '1',
    name: 'customerName',
    type: VariableType.TEXT,
    defaultValue: 'John Doe',
    description: 'From speech: "Digite o nome do cliente" + Action: text_input',
    confidence: 0.92,
    origin: {
      source: 'correlation',
      speechSnippet: 'Digite o nome do cliente aqui',
      speechTimestamp: 2500,
      actionType: 'text_input',
      actionValue: 'John Doe',
      actionTimestamp: 4200,
    },
    status: 'detected',
  },
  {
    id: '2',
    name: 'email',
    type: VariableType.TEXT,
    defaultValue: 'john@example.com',
    description: 'From speech: "o email do cliente"',
    confidence: 0.85,
    origin: {
      source: 'speech',
      speechSnippet: 'Agora coloca o email do cliente',
      speechTimestamp: 8000,
    },
    status: 'detected',
  },
  {
    id: '3',
    name: 'country',
    type: VariableType.SELECTION,
    defaultValue: 'Brazil',
    options: ['Brazil', 'USA', 'Canada', 'UK'],
    description: 'From speech: "seleciona o país" + Action: dropdown',
    confidence: 0.78,
    origin: {
      source: 'correlation',
      speechSnippet: 'Seleciona o país aqui',
      speechTimestamp: 12000,
      actionType: 'dropdown',
      actionValue: 'Brazil',
      actionTimestamp: 13500,
    },
    status: 'detected',
  },
  {
    id: '4',
    name: 'quantity',
    type: VariableType.NUMBER,
    defaultValue: '5',
    description: 'From action: number_input',
    confidence: 0.55,
    origin: {
      source: 'action',
      actionType: 'number_input',
      actionValue: '5',
      actionTimestamp: 18000,
    },
    status: 'detected',
  },
  {
    id: '5',
    name: 'uploadFile',
    type: VariableType.FILE,
    description: 'From speech: "faz upload do arquivo"',
    confidence: 0.68,
    origin: {
      source: 'speech',
      speechSnippet: 'Agora faz upload do arquivo CSV',
      speechTimestamp: 22000,
    },
    status: 'detected',
  },
  {
    id: '6',
    name: 'startDate',
    type: VariableType.DATE,
    defaultValue: '2024-01-15',
    description: 'From speech: "a data de início" + Action: date_picker',
    confidence: 0.88,
    origin: {
      source: 'correlation',
      speechSnippet: 'Seleciona a data de início do projeto',
      speechTimestamp: 26000,
      actionType: 'date_picker',
      actionValue: '2024-01-15',
      actionTimestamp: 27500,
    },
    status: 'detected',
  },
];

export function VariableConfirmationTest() {
  const [confirmedVariables, setConfirmedVariables] = useState<VariableHint[] | null>(null);
  const [showComponent, setShowComponent] = useState(true);

  const handleConfirm = (variables: VariableHint[]) => {
    console.log('Confirmed variables:', variables);
    setConfirmedVariables(variables);
    setShowComponent(false);
  };

  const handleAddManual = (variable: VariableHint) => {
    console.log('Manually added variable:', variable);
  };

  const handleReset = () => {
    setConfirmedVariables(null);
    setShowComponent(true);
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">
            Variable Confirmation Component Test
          </h1>
          <p className="text-muted-foreground">
            Interactive test for reviewing and confirming detected variables
          </p>
        </div>

        <Separator />

        {/* Test Instructions */}
        <div className="rounded-lg border bg-card p-6 space-y-4">
          <h2 className="text-lg font-semibold">Test Instructions</h2>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>✅ <strong>Confidence Indicators:</strong> Variables are grouped by confidence (high/medium/low)</p>
            <p>✅ <strong>Origin Information:</strong> Each variable shows speech snippets and/or action details</p>
            <p>✅ <strong>Confirm/Reject:</strong> Use ✓ and ✗ buttons to confirm or reject variables</p>
            <p>✅ <strong>Edit Controls:</strong> Click the ⋮ menu to edit or delete variables</p>
            <p>✅ <strong>Manual Addition:</strong> Click "Add Variable" to manually add new variables</p>
            <p>✅ <strong>Filtering:</strong> Use filter buttons to view all/pending/confirmed/rejected</p>
            <p>✅ <strong>Bulk Actions:</strong> "Confirm All Pending" button for quick review</p>
          </div>
        </div>

        <Separator />

        {/* Component Test */}
        {showComponent ? (
          <VariableConfirmation
            detectedVariables={mockVariables}
            onConfirm={handleConfirm}
            onAddManual={handleAddManual}
          />
        ) : (
          <div className="space-y-6">
            {/* Results */}
            <div className="rounded-lg border bg-card p-6 space-y-4">
              <h2 className="text-lg font-semibold text-green-600 dark:text-green-500">
                ✅ Variables Confirmed!
              </h2>
              <p className="text-sm text-muted-foreground">
                {confirmedVariables?.length || 0} variable(s) confirmed and ready for skill generation
              </p>

              {confirmedVariables && confirmedVariables.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold">Confirmed Variables:</h3>
                  <div className="space-y-2">
                    {confirmedVariables.map((variable) => (
                      <div
                        key={variable.id}
                        className="flex items-center justify-between p-3 rounded-md border bg-muted/50"
                      >
                        <div className="space-y-1">
                          <code className="text-sm font-semibold font-mono">
                            {variable.name}
                          </code>
                          <p className="text-xs text-muted-foreground">
                            Type: {variable.type}
                            {variable.defaultValue && ` • Default: ${variable.defaultValue}`}
                          </p>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {Math.round(variable.confidence * 100)}% confidence
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4">
                <Button onClick={handleReset} variant="outline">
                  Reset Test
                </Button>
              </div>
            </div>

            {/* JSON Output */}
            <div className="rounded-lg border bg-card p-6 space-y-4">
              <h2 className="text-lg font-semibold">JSON Output</h2>
              <pre className="text-xs bg-muted p-4 rounded-lg overflow-x-auto">
                {JSON.stringify(confirmedVariables, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* Test Data */}
        <div className="rounded-lg border bg-card p-6 space-y-4">
          <h2 className="text-lg font-semibold">Test Data</h2>
          <p className="text-sm text-muted-foreground">
            Mock variables with different confidence levels and origins:
          </p>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li><strong>customerName</strong> (92% confidence) - Correlated speech + action</li>
            <li><strong>email</strong> (85% confidence) - Speech only</li>
            <li><strong>country</strong> (78% confidence) - Correlated speech + dropdown</li>
            <li><strong>quantity</strong> (55% confidence, LOW) - Action only</li>
            <li><strong>uploadFile</strong> (68% confidence) - Speech only</li>
            <li><strong>startDate</strong> (88% confidence) - Correlated speech + date picker</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
