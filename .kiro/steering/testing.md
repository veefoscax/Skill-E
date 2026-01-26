---
inclusion: always
---

# Testing and Verification Rules

## CRITICAL: Never Claim "Fixed" Without User Verification

**RULE**: You MUST NOT claim a bug is "fixed" or "resolved" until the USER confirms it works.

### What This Means

❌ **FORBIDDEN**:
- "I've fixed the drag issue" (without user testing)
- "The X button should work now" (without user clicking it)
- "The tray icon is now visible" (without user seeing it)
- Marking tasks as complete without user confirmation
- Updating DEVLOG with "✅ Fixed" before user tests

✅ **REQUIRED**:
- "I've made changes that should fix the drag issue. Please test by clicking and dragging the timer area."
- "Please click the X button and let me know if it hides the window."
- "Please check if the tray icon is now visible near the clock."
- Wait for user feedback: "It works!" or "Still broken"
- Only mark as fixed AFTER user confirms

### The Problem

Making code changes ≠ fixing the problem. You can:
- Write perfect code that doesn't compile
- Fix one thing and break another
- Misunderstand the root cause
- Have the fix not apply due to caching/hot reload issues

### The Solution

**ALWAYS follow this workflow**:

1. **Identify the problem** (from user description)
2. **Make code changes** (your best attempt at fixing)
3. **Verify compilation** (no syntax errors)
4. **Ask user to test** (explicit request with clear instructions)
5. **Wait for feedback** (user says "works" or "still broken")
6. **Only then claim fixed** (if user confirms)

### Example Interaction

**BAD** ❌:
```
Agent: I've fixed the drag issue by changing the CSS. The window should now be draggable.
[Updates DEVLOG with "✅ Fixed"]
User: It's still not working!
Agent: Oh, let me try again...
```

**GOOD** ✅:
```
Agent: I've changed the CSS to make the toolbar fill the window. 
Please test: Click and hold on the timer (middle of toolbar), then drag. 
Does the entire window move across the screen?

User: Yes! It works now!

Agent: Great! I'll mark this as fixed in the DEVLOG.
```

## Testing Workflow for Runtime Issues

When fixing bugs that require the app to run:

### Step 1: Make Changes
- Modify the code
- Verify syntax (no compilation errors)
- Check hot reload applied (if dev server running)

### Step 2: Explicit Test Request
Ask the user to test with SPECIFIC instructions:
- "Please click the X button in the top-right corner"
- "Please try dragging the window by clicking on the timer area"
- "Please check the system tray near the clock for the Skill-E icon"

### Step 3: Wait for Feedback
DO NOT proceed until user responds with:
- ✅ "It works!" / "Fixed!" / "I can see it now!"
- ❌ "Still broken" / "Not working" / "I don't see it"

### Step 4: Document Accurately
- If user confirms: Mark as ✅ Fixed in DEVLOG
- If user says still broken: Mark as ❌ Still Broken, try different approach

## Multiple Attempts Rule

If you've tried fixing the same issue **3+ times** without success:

1. **STOP** making random changes
2. **ASK** the user for more details:
   - What exactly happens when you try X?
   - Can you describe what you see?
   - Are there any error messages in the console?
3. **RESEARCH** alternative approaches
4. **EXPLAIN** what you think might be wrong and propose a different strategy

## User Frustration Signals

If the user says things like:
- "It's still not working"
- "You're not fixing it"
- "This is the 5th attempt"
- "I don't see any change"

**IMMEDIATELY**:
1. Acknowledge: "You're right, my previous attempts haven't worked."
2. Stop: "Let me take a different approach instead of trying the same thing."
3. Ask: "Can you describe exactly what happens when you [do X]?"
4. Research: Look for alternative solutions or root causes

## DEVLOG Documentation Rules

### Before User Tests
```markdown
**⏳ Awaiting User Verification**:
- Window drag functionality (changes made, not yet tested)
- X button (changes made, not yet tested)
```

### After User Confirms Working
```markdown
**✅ Verified Working** (User confirmed Jan 27, 2026):
- Window drag functionality - User can drag window across screen
- X button - User confirmed window hides when clicked
```

### After User Says Still Broken
```markdown
**❌ Still Broken** (User tested Jan 27, 2026):
- Window drag functionality - User reports "still stuck in place"
- Need different approach: [explain what you'll try next]
```

## Summary

**The Golden Rule**: Code changes are NOT fixes until the user confirms they work.

**Your Job**: 
1. Make changes
2. Ask user to test
3. Wait for confirmation
4. Document accurately

**Not Your Job**:
- Assuming your changes work
- Claiming victory before testing
- Marking things as fixed prematurely
- Moving on without user feedback
