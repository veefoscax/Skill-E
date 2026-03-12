/**
 * Quality Badge Tests
 *
 * Tests for the QualityBadge component.
 *
 * Requirements: FR-10.14
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QualityBadge } from './QualityBadge'
import type { SemanticValidationResult } from '@/lib/semantic-judge'

describe('QualityBadge', () => {
  const mockVerifiedResult: SemanticValidationResult = {
    score: 95,
    dimensions: {
      safety: 98,
      clarity: 94,
      completeness: 92,
    },
    strengths: ['Excellent safety measures', 'Clear documentation'],
    weaknesses: ['Minor improvement possible'],
    recommendations: ['Add more examples'],
    isVerified: true,
  }

  const mockUnverifiedResult: SemanticValidationResult = {
    score: 75,
    dimensions: {
      safety: 70,
      clarity: 80,
      completeness: 75,
    },
    strengths: ['Good structure'],
    weaknesses: ['Missing safety checks', 'Incomplete documentation'],
    recommendations: ['Add PAUSE markers', 'Improve documentation'],
    isVerified: false,
  }

  describe('Score Display', () => {
    it('should display the overall score', () => {
      render(<QualityBadge result={mockVerifiedResult} />)
      expect(screen.getByText('95')).toBeInTheDocument()
      expect(screen.getByText('/100')).toBeInTheDocument()
    })

    it('should display score for unverified result', () => {
      render(<QualityBadge result={mockUnverifiedResult} />)
      expect(screen.getByText('75')).toBeInTheDocument()
    })
  })

  describe('Verified Badge', () => {
    it('should show "Verified" badge for scores >= 90', () => {
      render(<QualityBadge result={mockVerifiedResult} />)
      expect(screen.getByText('Verified')).toBeInTheDocument()
    })

    it('should not show "Verified" badge for scores < 90', () => {
      render(<QualityBadge result={mockUnverifiedResult} />)
      expect(screen.queryByText('Verified')).not.toBeInTheDocument()
    })

    it('should show shield check icon for verified results', () => {
      const { container } = render(<QualityBadge result={mockVerifiedResult} />)
      // ShieldCheck icon should be present
      const icons = container.querySelectorAll('svg')
      expect(icons.length).toBeGreaterThan(0)
    })
  })

  describe('Status Label', () => {
    it('should show "Excellent" label for score >= 90', () => {
      render(<QualityBadge result={mockVerifiedResult} />)
      expect(screen.getByText('Excellent')).toBeInTheDocument()
    })

    it('should show "Good" label for score 70-79', () => {
      render(<QualityBadge result={mockUnverifiedResult} />)
      expect(screen.getByText('Good')).toBeInTheDocument()
    })

    it('should show appropriate label for different score ranges', () => {
      const scores = [
        { score: 95, label: 'Excellent' },
        { score: 85, label: 'Very Good' },
        { score: 75, label: 'Good' },
        { score: 65, label: 'Fair' },
        { score: 55, label: 'Needs Improvement' },
        { score: 45, label: 'Poor' },
      ]

      scores.forEach(({ score, label }) => {
        const result: SemanticValidationResult = {
          score,
          dimensions: { safety: score, clarity: score, completeness: score },
          strengths: [],
          weaknesses: [],
          recommendations: [],
          isVerified: score >= 90,
        }

        const { rerender } = render(<QualityBadge result={result} />)
        expect(screen.getByText(label)).toBeInTheDocument()
        rerender(<div />) // Clean up
      })
    })
  })

  describe('Size Variants', () => {
    it('should render small size', () => {
      const { container } = render(<QualityBadge result={mockVerifiedResult} size="sm" />)
      expect(container.querySelector('.text-xs')).toBeInTheDocument()
    })

    it('should render medium size (default)', () => {
      const { container } = render(<QualityBadge result={mockVerifiedResult} />)
      expect(container.querySelector('.text-sm')).toBeInTheDocument()
    })

    it('should render large size', () => {
      const { container } = render(<QualityBadge result={mockVerifiedResult} size="lg" />)
      expect(container.querySelector('.text-base')).toBeInTheDocument()
    })
  })

  describe('Detailed Breakdown', () => {
    it('should show detailed breakdown when showDetails is true', () => {
      render(<QualityBadge result={mockVerifiedResult} showDetails />)

      // Should show dimension labels
      expect(screen.getByText('Safety')).toBeInTheDocument()
      expect(screen.getByText('Clarity')).toBeInTheDocument()
      expect(screen.getByText('Completeness')).toBeInTheDocument()

      // Should show dimension scores
      expect(screen.getByText('98/100')).toBeInTheDocument()
      expect(screen.getByText('94/100')).toBeInTheDocument()
      expect(screen.getByText('92/100')).toBeInTheDocument()
    })

    it('should not show detailed breakdown by default', () => {
      render(<QualityBadge result={mockVerifiedResult} />)

      // Dimension labels should not be visible in main content
      // (they may be in tooltip, but not in main DOM)
      const safetyElements = screen.queryAllByText('Safety')
      // Should only be in tooltip, not in main content
      expect(safetyElements.length).toBeLessThanOrEqual(1)
    })

    it('should show strengths in detailed view', () => {
      render(<QualityBadge result={mockVerifiedResult} showDetails />)
      expect(screen.getByText('Excellent safety measures')).toBeInTheDocument()
      expect(screen.getByText('Clear documentation')).toBeInTheDocument()
    })

    it('should show weaknesses in detailed view', () => {
      render(<QualityBadge result={mockUnverifiedResult} showDetails />)
      expect(screen.getByText('Missing safety checks')).toBeInTheDocument()
      expect(screen.getByText('Incomplete documentation')).toBeInTheDocument()
    })

    it('should show recommendations in detailed view', () => {
      render(<QualityBadge result={mockUnverifiedResult} showDetails />)
      expect(screen.getByText('Add PAUSE markers')).toBeInTheDocument()
      expect(screen.getByText('Improve documentation')).toBeInTheDocument()
    })
  })

  describe('Color Coding', () => {
    it('should use green colors for excellent scores (>= 90)', () => {
      const { container } = render(<QualityBadge result={mockVerifiedResult} />)
      const element = container.querySelector('.text-green-600')
      expect(element).toBeInTheDocument()
    })

    it('should use yellow colors for good scores (70-89)', () => {
      const { container } = render(<QualityBadge result={mockUnverifiedResult} />)
      const element = container.querySelector('.text-yellow-600')
      expect(element).toBeInTheDocument()
    })

    it('should use orange colors for fair scores (50-69)', () => {
      const result: SemanticValidationResult = {
        score: 60,
        dimensions: { safety: 60, clarity: 60, completeness: 60 },
        strengths: [],
        weaknesses: [],
        recommendations: [],
        isVerified: false,
      }

      const { container } = render(<QualityBadge result={result} />)
      const element = container.querySelector('.text-orange-600')
      expect(element).toBeInTheDocument()
    })

    it('should use red colors for poor scores (< 50)', () => {
      const result: SemanticValidationResult = {
        score: 40,
        dimensions: { safety: 40, clarity: 40, completeness: 40 },
        strengths: [],
        weaknesses: [],
        recommendations: [],
        isVerified: false,
      }

      const { container } = render(<QualityBadge result={result} />)
      const element = container.querySelector('.text-red-600')
      expect(element).toBeInTheDocument()
    })
  })

  describe('Custom Styling', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <QualityBadge result={mockVerifiedResult} className="custom-class" />
      )
      expect(container.querySelector('.custom-class')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should render accessible component', () => {
      const { container } = render(<QualityBadge result={mockVerifiedResult} />)

      // Component should render
      expect(container.firstChild).toBeInTheDocument()

      // Should have score text visible
      expect(screen.getByText('95')).toBeInTheDocument()
    })
  })
})
