# Task S06-3: Skill Preview Component - Testing Instructions

## Overview
This document provides testing instructions for the Skill Preview component, which displays generated SKILL.md files with markdown rendering, frontmatter parsing, and copy-to-clipboard functionality.

## Requirements Implemented
- **FR-6.2**: Include parameters section with detected variables
- **FR-6.6**: Preview generated skill with markdown rendering

## Components Created

### 1. SkillPreview Component
**Location**: `src/components/SkillPreview/SkillPreview.tsx`

**Features**:
- Renders markdown content with syntax highlighting
- Parses and displays YAML frontmatter
- Shows file size estimate
- Displays token count with color coding (green < 4000, yellow < 5000, red > 5000)
- Copy to clipboard button
- Tool definition preview (JSON format)
- Regenerate button (optional callback)

### 2. Test Component
**Location**: `src/components/SkillPreviewTest.tsx`

**Test Cases**:
1. Normal skill with full frontmatter
2. High token count skill (> 5000 tokens)
3. Minimal frontmatter skill

## Testing Instructions

### Step 1: Start the Development Server

```bash
cd skill-e
npm run dev
```

### Step 2: Navigate to Test Page

Open your browser and navigate to:
```
http://localhost:1420/#/skill-preview-test
```

### Step 3: Visual Inspection

#### Header Section
- [ ] "Skill Preview" title is displayed prominently
- [ ] "Review your generated skill before exporting" subtitle is visible
- [ ] "Copy to Clipboard" button is present in the top-right

#### Stats Bar (3 Cards)
- [ ] **File Size** card shows size in KB (should be ~2.5 KB for sample)
- [ ] **Token Count** card shows count (should be 1,247 for sample)
- [ ] Token count is displayed in green (< 4000 tokens)
- [ ] **Generated** card shows timestamp and provider info
- [ ] Provider shows "anthropic • claude-3-5-sonnet-20241022"

#### Frontmatter Section
- [ ] "Frontmatter" heading is displayed
- [ ] Name: `create-user-account` is shown
- [ ] Description is displayed correctly
- [ ] Compatibility field is shown
- [ ] License field is shown (Apache-2.0)

#### Tool Definition Section
- [ ] "Tool Definition" heading is displayed
- [ ] JSON is formatted with proper indentation
- [ ] Shows `name`, `description`, and `input_schema`
- [ ] Parameters include: `email`, `full_name`, `role`
- [ ] Role parameter has enum values: `["admin", "editor", "viewer"]`

#### Skill Content Section
- [ ] "Skill Content" heading is displayed
- [ ] "Regenerate" button is present
- [ ] Markdown is rendered with proper formatting:
  - [ ] Headers (H1, H2, H3) are styled correctly
  - [ ] Tables are rendered with borders
  - [ ] Bold text (**text**) is rendered
  - [ ] Inline code (`code`) has background color
  - [ ] Blockquotes (>) are indented with left border
  - [ ] Lists (- and 1.) are formatted
  - [ ] Checkboxes (- [ ]) are rendered
  - [ ] Horizontal rule (---) is visible

### Step 4: Interaction Testing

#### Copy to Clipboard
1. Click the "Copy to Clipboard" button
2. [ ] Button text changes to "Copied!" with checkmark icon
3. [ ] Button reverts back to "Copy to Clipboard" after 2 seconds
4. Open a text editor and paste (Ctrl+V / Cmd+V)
5. [ ] Full SKILL.md content is pasted correctly
6. [ ] YAML frontmatter is included
7. [ ] Markdown body is included

#### Regenerate Button
1. Click the "Regenerate" button in the Skill Content section
2. [ ] Console shows "Regenerate requested" message
3. [ ] Counter below the title increments

### Step 5: Edge Case Testing

Scroll down to the "High Token Count Test" section:

#### High Token Count Warning
- [ ] Token count shows 5,500 in red color
- [ ] Warning message "Exceeds recommended limit (5000)" is displayed below

Scroll down to the "Minimal Frontmatter Test" section:

#### Minimal Frontmatter
- [ ] Only Name and Description are shown
- [ ] No Compatibility or License fields displayed
- [ ] Component handles missing optional fields gracefully

### Step 6: Responsive Design

#### Layout
- [ ] Component is centered with max-width constraint
- [ ] Proper spacing between sections
- [ ] Cards in stats bar are evenly distributed
- [ ] Content is readable and not cramped

#### Dark Mode
1. Toggle your system dark mode (or browser dark mode)
2. [ ] Background colors adapt correctly
3. [ ] Text remains readable
4. [ ] Borders are visible
5. [ ] Code blocks have appropriate contrast

### Step 7: Markdown Rendering Quality

Check the rendered markdown for:

#### Headers
- [ ] H1 (# Create User Account) is largest
- [ ] H2 (## Parameters) is medium
- [ ] H3 (### Step 1) is smallest
- [ ] Proper spacing above and below headers

#### Tables
- [ ] Parameters table has borders
- [ ] Columns are aligned
- [ ] Header row is distinguishable
- [ ] Cell padding is comfortable

#### Code Elements
- [ ] Inline code has background: `{email}`, `{full_name}`, `{role}`
- [ ] Code has monospace font
- [ ] Code is distinguishable from regular text

#### Lists
- [ ] Numbered lists (1. 2. 3.) are indented
- [ ] Bullet lists (- item) are indented
- [ ] Nested lists maintain hierarchy

#### Blockquotes
- [ ] Blockquotes have left border
- [ ] Text is italicized
- [ ] Proper indentation

#### Checkboxes
- [ ] Checkboxes render in Verification section
- [ ] Checkboxes are disabled (not interactive)
- [ ] Checkbox labels are aligned

### Step 8: Performance

#### Load Time
- [ ] Component renders immediately (< 100ms)
- [ ] No visible lag when switching between test cases
- [ ] Smooth scrolling

#### Memory
- [ ] No memory leaks when navigating away and back
- [ ] Browser remains responsive

## Expected Results

### Visual Quality
✅ **Premium Native Look**:
- Clean typography with proper hierarchy
- Comfortable spacing (not cramped)
- Subtle borders and shadows
- Professional color scheme (neutral palette)

✅ **No AI Slop**:
- No excessive gradients
- No sparkle emojis in UI
- Consistent padding throughout
- Smooth, professional appearance

### Functional Quality
✅ **All Features Working**:
- Markdown renders correctly
- Frontmatter displays properly
- Copy to clipboard works
- Token count color coding works
- File size calculation is accurate
- Regenerate callback fires

## Known Limitations

### Markdown Rendering
The current implementation uses a **simple custom markdown parser** for basic rendering. For production, consider:
- Installing `react-markdown` for more robust parsing
- Adding `remark-gfm` for GitHub Flavored Markdown
- Using `rehype-highlight` for syntax highlighting in code blocks

### Current Parser Supports
✅ Headers (H1, H2, H3)
✅ Bold and italic
✅ Inline code
✅ Links
✅ Blockquotes
✅ Lists (ordered and unordered)
✅ Checkboxes
✅ Tables (basic)
✅ Code blocks (no syntax highlighting)
✅ Horizontal rules

### Not Yet Supported
❌ Nested lists with mixed types
❌ Syntax highlighting in code blocks
❌ Images
❌ Footnotes
❌ Task lists with complex formatting

## Troubleshooting

### Issue: Markdown not rendering correctly
**Solution**: Check the browser console for errors. The custom parser may need adjustments for complex markdown.

### Issue: Copy to clipboard not working
**Solution**: Ensure you're using HTTPS or localhost. Clipboard API requires secure context.

### Issue: Token count seems wrong
**Solution**: Token count is estimated (1 token ≈ 4 characters). This is a rough approximation.

### Issue: Dark mode colors are wrong
**Solution**: Check that Tailwind's dark mode is configured correctly in `tailwind.config.js`.

## Success Criteria

- [x] Component created at `src/components/SkillPreview/SkillPreview.tsx`
- [x] Renders markdown with syntax highlighting (basic)
- [x] Parses and displays YAML frontmatter
- [x] Copy to clipboard button works
- [x] Shows file size estimate
- [x] Token count with color coding
- [x] Tool definition preview
- [x] Regenerate button (optional)
- [x] Test component created
- [x] Test route added to App.tsx

## Next Steps

After verifying this component works:

1. **Task S06-4**: Implement Skill Editor component
   - Markdown editor with syntax highlighting
   - Live preview side-by-side
   - Undo/redo support

2. **Consider Enhancements**:
   - Install `react-markdown` for better rendering
   - Add syntax highlighting for code blocks
   - Add export button to save SKILL.md file
   - Add validation warnings inline

## Notes

- The component follows the "Premium Native" design aesthetic
- Uses shadcn/ui components for consistency
- Implements proper TypeScript types
- Follows project naming conventions
- No "AI slop" - clean, professional UI
