# Product Vision: Skill-E

## Overview
**Skill-E** is a desktop application that enables creating **Agent Skills** through recorded demonstrations. Instead of writing skills manually, users show what they want to do while narrating.

## Tagline
> "Ensine ao Agente Como Fazer" / "Show Your Agent the Way"

## Target Users
- Developers creating automation skills for Claude/GPT
- Teams documenting internal processes
- Power users wanting AI assistance with repetitive tasks
- Anyone who prefers showing over writing

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
