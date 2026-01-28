/**
 * Quality Badge Example
 * 
 * Demonstrates the QualityBadge component with different scores and configurations.
 */

import { QualityBadge } from './QualityBadge';
import type { SemanticValidationResult } from '@/lib/semantic-judge';

/**
 * Example validation results
 */
const excellentResult: SemanticValidationResult = {
  score: 95,
  dimensions: {
    safety: 98,
    clarity: 94,
    completeness: 92,
  },
  strengths: [
    'Comprehensive PAUSE markers before all destructive actions',
    'Clear parameter documentation with types and examples',
    'Excellent error handling with rollback instructions',
    'Step-by-step verification checks throughout',
    'Professional language and consistent formatting',
  ],
  weaknesses: [
    'Could add more troubleshooting tips for edge cases',
  ],
  recommendations: [
    'Consider adding a "Common Issues" section',
    'Add estimated time for each major step',
  ],
  isVerified: true,
};

const goodResult: SemanticValidationResult = {
  score: 82,
  dimensions: {
    safety: 85,
    clarity: 88,
    completeness: 75,
  },
  strengths: [
    'Clear step-by-step instructions',
    'Good parameter documentation',
    'Includes verification steps',
  ],
  weaknesses: [
    'Missing PAUSE markers for some destructive actions',
    'Some edge cases not covered',
    'Limited error handling guidance',
  ],
  recommendations: [
    'Add PAUSE markers before deleting or modifying data',
    'Include more edge case handling',
    'Add rollback instructions for critical steps',
  ],
  isVerified: false,
};

const fairResult: SemanticValidationResult = {
  score: 68,
  dimensions: {
    safety: 60,
    clarity: 72,
    completeness: 70,
  },
  strengths: [
    'Basic instructions are present',
    'Parameters are documented',
  ],
  weaknesses: [
    'No PAUSE markers for destructive actions',
    'Unclear instructions in several steps',
    'Missing error handling',
    'No verification steps',
  ],
  recommendations: [
    'Add safety confirmations for all destructive actions',
    'Clarify ambiguous instructions',
    'Add error handling and rollback procedures',
    'Include verification steps to confirm success',
  ],
  isVerified: false,
};

const poorResult: SemanticValidationResult = {
  score: 42,
  dimensions: {
    safety: 30,
    clarity: 45,
    completeness: 50,
  },
  strengths: [
    'Attempts to document the process',
  ],
  weaknesses: [
    'No safety measures or confirmations',
    'Very unclear and ambiguous instructions',
    'Missing critical steps',
    'No error handling whatsoever',
    'Poor documentation quality',
  ],
  recommendations: [
    'Complete rewrite recommended',
    'Add comprehensive safety measures',
    'Clarify all instructions with specific details',
    'Fill in missing steps',
    'Add proper error handling and verification',
  ],
  isVerified: false,
};

/**
 * Example component showing different QualityBadge configurations
 */
export function QualityBadgeExample() {
  return (
    <div className="p-8 space-y-8 bg-background">
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Quality Badge Examples</h1>
        <p className="text-muted-foreground">
          Hover over each badge to see the detailed breakdown tooltip.
        </p>
      </div>
      
      {/* Excellent Score (Verified) */}
      <div className="space-y-3 p-6 rounded-lg border bg-card">
        <h2 className="text-lg font-semibold">Excellent Score (95/100) - Verified</h2>
        <p className="text-sm text-muted-foreground">
          High-quality skill with comprehensive safety measures and clear documentation.
        </p>
        
        <div className="space-y-4">
          <div>
            <p className="text-xs text-muted-foreground mb-2">Default Size (md)</p>
            <QualityBadge result={excellentResult} />
          </div>
          
          <div>
            <p className="text-xs text-muted-foreground mb-2">Small Size</p>
            <QualityBadge result={excellentResult} size="sm" />
          </div>
          
          <div>
            <p className="text-xs text-muted-foreground mb-2">Large Size</p>
            <QualityBadge result={excellentResult} size="lg" />
          </div>
          
          <div>
            <p className="text-xs text-muted-foreground mb-2">With Details</p>
            <QualityBadge result={excellentResult} showDetails />
          </div>
        </div>
      </div>
      
      {/* Good Score */}
      <div className="space-y-3 p-6 rounded-lg border bg-card">
        <h2 className="text-lg font-semibold">Good Score (82/100)</h2>
        <p className="text-sm text-muted-foreground">
          Solid skill with room for improvement in safety and completeness.
        </p>
        
        <QualityBadge result={goodResult} />
        <QualityBadge result={goodResult} showDetails />
      </div>
      
      {/* Fair Score */}
      <div className="space-y-3 p-6 rounded-lg border bg-card">
        <h2 className="text-lg font-semibold">Fair Score (68/100)</h2>
        <p className="text-sm text-muted-foreground">
          Needs improvement in safety measures and clarity.
        </p>
        
        <QualityBadge result={fairResult} />
        <QualityBadge result={fairResult} showDetails />
      </div>
      
      {/* Poor Score */}
      <div className="space-y-3 p-6 rounded-lg border bg-card">
        <h2 className="text-lg font-semibold">Poor Score (42/100)</h2>
        <p className="text-sm text-muted-foreground">
          Requires significant improvements before production use.
        </p>
        
        <QualityBadge result={poorResult} />
        <QualityBadge result={poorResult} showDetails />
      </div>
      
      {/* Size Comparison */}
      <div className="space-y-3 p-6 rounded-lg border bg-card">
        <h2 className="text-lg font-semibold">Size Comparison</h2>
        <div className="flex items-center gap-4 flex-wrap">
          <QualityBadge result={excellentResult} size="sm" />
          <QualityBadge result={excellentResult} size="md" />
          <QualityBadge result={excellentResult} size="lg" />
        </div>
      </div>
      
      {/* In Context */}
      <div className="space-y-3 p-6 rounded-lg border bg-card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Create GitHub Repository</h2>
            <p className="text-sm text-muted-foreground">
              Skill for creating a new repository on GitHub
            </p>
          </div>
          <QualityBadge result={excellentResult} />
        </div>
      </div>
    </div>
  );
}
