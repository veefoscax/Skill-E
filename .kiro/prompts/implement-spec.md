# Implement Spec

Use this prompt to implement a spec with Kiro.

## Usage
```
/implement-spec S01-app-core
```

## Instructions

You are implementing a spec from the `.kiro/specs/` directory.

1. **Read the spec files**:
   - `requirements.md` - Understand acceptance criteria
   - `design.md` - Follow the architecture and code patterns
   - `tasks.md` - Complete each task in order

2. **Check dependencies**:
   - Review specs that this spec depends on
   - Ensure dependent features are already implemented

3. **Implementation approach**:
   - Follow the exact TypeScript/Rust interfaces in design.md
   - Follow project structure in `.kiro/steering/structure.md`
   - Follow tech stack in `.kiro/steering/tech.md`

4. **Mark progress**:
   - Update tasks.md checkboxes as you complete items
   - Use `- [x]` for completed, `- [/]` for in-progress

5. **Test after completion**:
   - Verify acceptance criteria are met
   - Check TypeScript has no errors
   - Build and test the app

6. **Update DEVLOG**:
   - After completing, update DEVLOG.md with session details
   - Include time spent, challenges, and learnings

## Tech Stack Reference
- Desktop: Tauri 2.0
- Frontend: React 18 + TypeScript
- Backend: Rust
- State: Zustand
- Build: Vite

## Spec Priority Order (MVP)
1. S01 - App Core
2. S02 - Screen Capture
3. S03 - Audio Recording
4. S08 - LLM Providers
5. S06 - Skill Export
6. S10 - Skill Validation
