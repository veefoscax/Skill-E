# Product Vision: Skill-E

## Overview
**Skill-E** is a desktop application that enables creating **Agent Skills** through recorded demonstrations. Instead of writing skills manually, users show what they want to do while narrating.

## Tagline
> "Ensine ao Agente Como Fazer" / "Show Your Agent the Way"

## Design Aesthetics (CRITICAL)

### 💎 The "Premium Native" Look
The UI must feel **expensive, polished, and native**. It should NOT look like a generic web app wrapped in a window.

| Attribute | Guideline |
|-----------|-----------|
| **Vibe** | "iOS Liquid Glass" (Mac) / "Windows 11 Mica" (Win) |
| **Colors** | Minimalist. Use HSL approach. **No generic purple AI gradients**. |
| **Density** | Comfortable. Not cramped, not wasted space. |
| **Motion** | Fluid, subtle physics-based animations (Framer Motion). |
| **Fonts** | **Inter** or System Fonts. Clean, readable, professional. |

### 🚫 "No AI Slop" Policy
- **No** excessive sparkle ✨ emojis in UI.
- **No** "Matrix rain" or cheesy tech backgrounds.
- **No** jagged layout shifts.
- **No** inconsistent padding.

### Components Strategy
- Use **shadcn/ui** as the base system.
- Customize radius to `0.5rem` or `0.75rem`.
- Use `zinc` or `slate` color palette for neutrality.
- **Dark Mode** is first-class citizen (default).

## Core Value Proposition
**"Demonstrate, Don't Describe"** - Create high-quality Agent Skills by recording what you do, not by manually writing complex instructions.

## Key Features

### Must Have (MVP)
1. Screen capture with cursor tracking
2. Audio recording with Whisper transcription
3. Multi-provider LLM support (5 essential providers)
4. SKILL.md generation in AgentSkills format
5. Interactive skill validation with feedback loop

### Should Have
6. Variable detection from speech + actions
7. Conditional workflow detection
8. OCR for text extraction from screenshots
9. Step detection from voice pauses and focus changes
10. Documentation lookup (Context7)

### Innovation (Differentiators)
- **Intelligent variable detection** from natural speech patterns
- **Guardrails built-in** - safety constraints in every skill
- **Human-in-the-loop** at critical points
- **Hybrid browser automation** (DOM + Image)
- **Use existing subscriptions** (Antigravity, Claude Code)

## Success Metrics
- Recording to skill in < 5 minutes
- Generated skills work on first try (80%+)
- Variable detection accuracy > 70%
- Free tier demo works without API keys

## Non-Goals
- Full RPA/macro recording (we're making skills, not scripts)
- Video editing features
- Multi-platform capture (Windows first)
- Complex workflow branching (keep skills simple)
