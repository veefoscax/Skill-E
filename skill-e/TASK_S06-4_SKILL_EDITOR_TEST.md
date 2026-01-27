# Task S06-4: Skill Editor Testing

## Overview
Testing the Skill Editor component with markdown editing, live preview, undo/redo, and regeneration capabilities.

## Requirements
- FR-6.3: Edit skill inline with live preview
- FR-6.7: Edit skill inline with live preview
- AC5: Editor with markdown editor, live preview, undo/redo, regenerate section button

## Test Component Location
`src/components/SkillEditorTest.tsx`

## Testing Instructions

### 1. Start Development Server
```bash
cd skill-e
npm run dev
```

### 2. Access Test Component
Navigate to the test component in your browser (you'll need to add a route or import it in App.tsx temporarily).

### 3. Manual Test Cases

#### Test Case 1: Basic Editing
- [ ] Type text in the editor
- [ ] Verify live preview updates in real-time (split view)
- [ ] Check that character count and token count update
- [ ] Verify "unsaved changes" indicator appears

#### Test Case 2: View Modes
- [ ] Click "Code" button - verify only editor is shown
- [ ] Click "Split" button - verify side-by-side view
- [ ] Click "Preview" button - verify only preview is shown
- [ ] Verify content persists across view mode changes

#### Test Case 3: Undo/Redo
- [ ] Make several edits to the content
- [ ] Click Undo button - verify content reverts
- [ ] Click Undo multiple times - verify history works
- [ ] Click Redo button - verify content restores
- [ ] Try Ctrl/Cmd + Z keyboard shortcut
- [ ] Try Ctrl/Cmd + Shift + Z keyboard shortcut
- [ ] Verify undo/redo buttons disable appropriately

#### Test Case 4: Save Functionality
- [ ] Make changes to content
- [ ] Click Save button
- [ ] Verify "unsaved changes" indicator disappears
- [ ] Verify Save button becomes disabled
- [ ] Try Ctrl/Cmd + S keyboard shortcut

#### Test Case 5: Reset Functionality
- [ ] Make changes to content
- [ ] Click Reset button
- [ ] Verify content reverts to original
- [ ] Verify "unsaved changes" indicator disappears
- [ ] Verify history is cleared

#### Test Case 6: Regenerate
- [ ] Click Regenerate button
- [ ] Verify callback is triggered (check console)

#### Test Case 7: Markdown Rendering
- [ ] Test headers (# ## ###)
- [ ] Test bold (**text**)
- [ ] Test italic (*text*)
- [ ] Test inline code (`code`)
- [ ] Test code blocks (```code```)
- [ ] Test lists (- item)
- [ ] Test numbered lists (1. item)
- [ ] Test checkboxes (- [ ] and - [x])
- [ ] Test links ([text](url))
- [ ] Test blockquotes (> text)
- [ ] Test tables (| col | col |)
- [ ] Test horizontal rules (---)

#### Test Case 8: Token Count Warning
- [ ] Paste content > 5000 tokens
- [ ] Verify token count turns red
- [ ] Verify warning message appears

#### Test Case 9: Read-Only Mode
- [ ] Enable read-only mode
- [ ] Verify textarea is disabled
- [ ] Verify Save button is disabled
- [ ] Verify Undo/Redo buttons are disabled
- [ ] Verify "Read-only mode" indicator appears

#### Test Case 10: Long Content
- [ ] Paste very long content (10,000+ characters)
- [ ] Verify editor handles it smoothly
- [ ] Verify scrolling works in both panes
- [ ] Verify preview renders correctly

## Expected Results

### Visual Appearance
- Clean, professional editor interface
- Clear separation between editor and preview
- Responsive toolbar with appropriate icons
- Stats bar showing useful metrics
- Proper syntax highlighting in preview

### Functionality
- Smooth editing experience
- Real-time preview updates
- Working undo/redo with history
- Save/reset functionality
- View mode switching
- Keyboard shortcuts work

### Performance
- No lag when typing
- Preview updates quickly
- Smooth scrolling
- No memory leaks

## Success Criteria
- [ ] All test cases pass
- [ ] No console errors
- [ ] Smooth user experience
- [ ] Markdown renders correctly
- [ ] Undo/redo works reliably
- [ ] Keyboard shortcuts work
- [ ] Token count is accurate

## Notes
- The editor uses a simple markdown parser for preview
- For production, consider using a library like react-markdown
- History is limited to 50 entries to prevent memory issues
- Undo/redo is debounced to 1 second intervals
