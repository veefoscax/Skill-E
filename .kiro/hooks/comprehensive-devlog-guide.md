# Comprehensive DEVLOG & Spec Updater Guide

## Purpose

This guide ensures that every task completion results in detailed documentation that captures:
- **Actual time spent** vs estimates
- **Detailed struggles and debugging processes**
- **Configuration issues and solutions**
- **Refactoring decisions and their reasons**
- **Lessons learned for future developers**

## Documentation Standards

### DEVLOG.md Structure

Each spec should have this detailed format:

```markdown
### S0X: [Spec Name]
- **Started**: 2026-01-26 17:30
- **Completed**: 2026-01-26 19:45
- **Time**: 2h 15m (originally estimated 45m)
- **Files Modified**:
  - src/lib/recording.ts (core recording logic)
  - **NEW**: src/stores/recording.ts (state management)
  - **CRITICAL FIX**: vite.config.ts (Tauri paths)

#### Major Struggles & Refactorings

**🚨 Critical Issue: [Issue Title]**
- **Problem**: [detailed description]
- **Root Cause**: [why it happened]
- **Discovery Process**:
  1. Noticed issue when...
  2. Investigated...
  3. Found root cause...
- **Solution**: [how fixed]
- **Result**: [outcome]

**🔧 Debugging Process**:
1. **Initial Analysis**: [what was checked first]
2. **Investigation**: [deeper analysis]
3. **Fix Implementation**: [what was changed]
4. **Verification**: [how confirmed working]

**📊 Build Verification**:
- ✅ `npm run build` succeeds
- ✅ `cargo build` succeeds
- ✅ App launches correctly
- ✅ Feature works as expected

**🧪 Testing**:
- Manual testing performed
- Screenshots captured

- **Summary**: [comprehensive summary with key learnings]
- **Time Impact**: [why variance occurred]
```

### Spec File Updates

#### tasks.md Template:
```markdown
# S0X: [Spec Name] - Tasks

## Time Tracking
- **Estimated**: 45 minutes
- **Actual**: 2 hours 15 minutes
- **Variance**: +1h 30m (300% of estimate)
- **Reason**: [why variance occurred]

## Implementation Checklist
[existing tasks...]

## Lessons Learned & Critical Issues

### 🚨 [Issue Title] (Task #XX)
**Issue**: [Description]
**Root Cause**: [Why it happened]
**Solution**: [How it was fixed]
**Impact**: [Time/complexity impact]

### 🔧 [Configuration Insights]
- [Key learnings about the tech stack]
- [Gotchas for future developers]
```

## Writing Guidelines

### Tone and Style
- **Engineering journal style** - detailed, technical, honest about struggles
- **Future developer focused** - write for someone who will face similar issues
- **Process documentation** - show the debugging journey, not just the solution
- **Specific and concrete** - include file paths, error messages, command outputs

### Formatting Standards
- **Emojis for organization**: 🚨 (critical), 🔧 (debugging), 📊 (verification), 🧪 (testing), ✅ (success), ❌ (failure)
- **Bold for emphasis**: **CRITICAL FIX**, **NEW**, **Problem**, **Solution**
- **Code formatting**: Use backticks for file names, commands, and code snippets
- **Structured sections**: Use consistent headings and bullet points

### Content Requirements
Every task completion should document:
1. **What was built** (files, features, configurations)
2. **What went wrong** (errors, misconfigurations, unexpected issues)
3. **How problems were solved** (debugging steps, research, fixes)
4. **What was learned** (insights, gotchas, best practices)
5. **Time impact** (why estimates were wrong, what took longer)
6. **Future guidance** (how to avoid similar issues)

## Manual Trigger

If you need to manually update documentation, use this prompt:

```
Please perform a comprehensive DEVLOG update for the task I just completed. Follow the detailed format from .kiro/hooks/comprehensive-devlog-guide.md, including:

1. Detailed time tracking with variance analysis
2. All files modified with descriptions
3. Major struggles and debugging processes
4. Critical issues with root cause analysis
5. Testing and verification performed
6. Lessons learned and future guidance

Make it read like a detailed engineering journal that captures both successes and struggles.
```

This ensures consistent, comprehensive documentation that will be invaluable for future development and debugging.
