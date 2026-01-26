# Workflow Guidelines: Skill-E

## Development Process

### Task Execution Workflow

1. **Read Spec Documents** - Always review requirements.md and design.md before implementing
2. **Implement Task** - Focus on one task at a time, follow acceptance criteria
3. **Test Implementation** - Verify functionality works as expected
4. **Update DEVLOG** - Document what was completed (see below)
5. **Mark Complete** - Update task status only after verification

### DEVLOG Updates (CRITICAL)

**The DEVLOG.md is the single source of truth for project progress.**

After completing ANY task or significant work:
- **ALWAYS update DEVLOG.md** with what was accomplished
- **NEVER create separate summary markdown files**
- **Document only after verification** - don't document planned work, only completed work

#### DEVLOG Entry Format

```markdown
## [Date] - [Feature/Task Name]

### Completed
- Specific item 1 that was implemented and verified
- Specific item 2 that was implemented and verified

### Technical Details (optional)
- Implementation notes
- Configuration changes
- Dependencies added

### Next Steps (optional)
- What should be done next
```

#### What to Document
✅ **DO Document:**
- Completed features and tasks
- Configuration changes made
- Dependencies installed
- Bugs fixed
- Design decisions

❌ **DON'T Document:**
- Planned work (use tasks.md for that)
- Incomplete implementations
- Failed attempts (unless they provide learning value)

### Summary Documents

**When completing work, the summary should ALWAYS be a DEVLOG update, not a separate file.**

- ❌ Don't create: `summary.md`, `progress.md`, `completion-report.md`
- ✅ Do update: `DEVLOG.md`

## Testing Guidelines

### Manual Testing Checklist
Before marking a task complete:
1. Run the application
2. Test the specific feature implemented
3. Verify acceptance criteria are met
4. Check for console errors
5. Test on target platform (Windows primary)

### Automated Testing
- Write unit tests for business logic
- Write integration tests for Tauri commands
- Run tests before marking task complete

## Code Quality Standards

### TypeScript/React
- Use TypeScript strict mode
- Prefer functional components with hooks
- Use Zustand for state management
- Follow component naming conventions (PascalCase)

### Rust
- Use idiomatic Rust patterns
- Handle errors properly (Result<T, E>)
- Document public APIs
- Follow Tauri command conventions

### Styling
- Use Tailwind CSS utility classes
- Follow shadcn/ui component patterns
- Maintain consistent spacing and typography
- Test dark mode appearance

## Git Workflow

### Commit Messages
Follow conventional commits format:
```
feat: add screen capture functionality
fix: resolve window positioning bug
docs: update DEVLOG with task completion
chore: update dependencies
```

### When to Commit
- After completing a task
- After fixing a bug
- After updating documentation
- Before starting a new task

## Communication with User

### Progress Updates
- Report completion after each task
- Ask for guidance when blocked
- Clarify requirements when ambiguous
- Suggest improvements when appropriate

### Error Handling
- Explain what went wrong clearly
- Provide context and logs
- Suggest potential solutions
- Ask for user input when needed

## Platform-Specific Considerations

### Windows (Primary)
- Test all features on Windows 11
- Verify system tray behavior
- Check hotkey registration
- Test Mica/Acrylic effects

### macOS (Secondary)
- Test on macOS when possible
- Verify menu bar icon
- Check vibrancy effects
- Test Cmd key bindings

## Performance Guidelines

### Optimization Priorities
1. Startup time < 1 second
2. Memory usage < 100MB idle
3. Smooth UI animations (60fps)
4. Fast screen capture (30fps minimum)

### Monitoring
- Check bundle size after builds
- Profile memory usage during recording
- Monitor CPU usage during capture
- Test on lower-end hardware when possible
