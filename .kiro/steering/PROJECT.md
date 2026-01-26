# Project Steering

## Vision

SkillScribe enables anyone to create high-quality Agent Skills through demonstration instead of manual writing. By recording screen, voice, and annotations, users can "teach" their agents new capabilities naturally.

## Core Principles

1. **Simplicity First** - Minimal UI during recording, focus on the task
2. **Quality Output** - Generated SKILL.md should be immediately usable
3. **Native Feel** - Fast, lightweight, non-intrusive overlay
4. **AI-Assisted** - LLM distills demonstrations into structured skills

## Success Metrics

- Generate SKILL.md from a 2-minute demo in under 30 seconds
- Output skills work with Claude Code/Bot without modification
- App size under 20MB
- Startup time under 1 second

## Non-Goals (for MVP)

- Mobile support
- Collaboration features
- Skill marketplace
- Video editing

## Tech Constraints

- Must use Tauri 2.0 for desktop framework
- Whisper API for transcription (requires API key)
- Claude/OpenAI API for skill generation (requires API key)
