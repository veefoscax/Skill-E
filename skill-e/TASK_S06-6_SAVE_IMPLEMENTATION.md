# Task S06-6: Save Implementation - Testing Instructions

## Overview

This task implements the skill save functionality that creates the folder structure and saves the SKILL.md file along with optional reference screenshots and assets.

## Requirements

**FR-6.4**: Save Implementation
- Create skill folder (skill-name/)
- Save SKILL.md inside folder
- Copy reference screenshots if selected
- Validate file was saved successfully

## Implementation Details

### Backend (Rust)

**File**: `src-tauri/src/commands/export.rs`

Two Tauri commands were implemented:

1. **`save_skill`** - Main export function
   - Creates skill folder at specified path
   - Saves SKILL.md content
   - Creates references/ folder and copies screenshots
   - Creates assets/ folder and copies assets
   - Validates file was saved successfully
   - Returns detailed export result

2. **`validate_export_path`** - Path validation
   - Checks if export path is writable
   - Checks if skill folder already exists
   - Returns validation result

### Frontend (TypeScript)

**File**: `src/lib/export.ts`

TypeScript wrapper functions:
- `saveSkill()` - Invokes the Rust command with proper types
- `validateExportPath()` - Validates path before export

**File**: `src/components/SkillSaveTest.tsx`

Comprehensive test component that:
- Uses the ExportDialog component
- Calls the save functionality
- Displays success/error results
- Shows export details
- Allows opening the exported folder

## Testing Instructions

### Setup

1. **Start the development server**:
   ```bash
   cd skill-e
   npm run tauri dev
   ```

2. **Navigate to the test component**:
   - Modify `src/App.tsx` to render `<SkillSaveTest />`
   - Or add a route/button to access the test component

### Test Cases

#### Test 1: Basic Export (Default Settings)

1. Click "Test Skill Export" button
2. Dialog should open with default skill name "create-user-account"
3. Default path should be loaded (e.g., `C:\Users\YourName\workspace\skills`)
4. "Include Screenshots" should be enabled by default
5. Click "Export" button
6. Wait for export to complete
7. **Verify**:
   - Success message appears
   - Skill folder path is shown
   - Screenshots copied count is shown
   - "Open Skill Folder" button appears

#### Test 2: Verify Folder Structure

1. After successful export, click "Open Skill Folder" button
2. File explorer should open to the skill folder
3. **Verify folder structure**:
   ```
   create-user-account/
   ├── SKILL.md
   └── references/
       ├── step1.webp
       ├── step2.webp
       └── step3.webp
   ```
4. Open SKILL.md and verify content matches the sample

#### Test 3: Custom Skill Name

1. Click "Test Skill Export" button
2. Change skill name to "My Test Skill"
3. **Verify**: Name is sanitized to "my-test-skill" (shown below input)
4. Click "Export"
5. **Verify**: Folder is created with sanitized name

#### Test 4: Custom Export Location

1. Click "Test Skill Export" button
2. Click the folder icon next to export path
3. Select a different folder (e.g., Desktop)
4. Click "Export"
5. **Verify**: Skill is saved to the selected location

#### Test 5: Without Screenshots

1. Click "Test Skill Export" button
2. Toggle off "Include Screenshots"
3. Click "Export"
4. **Verify**:
   - Success message shows "Screenshots copied: 0"
   - No references/ folder is created
   - Only SKILL.md exists in the folder

#### Test 6: Duplicate Skill Name (Error Handling)

1. Export a skill with name "test-duplicate"
2. Try to export again with the same name to the same location
3. **Verify**:
   - Error message appears
   - Message says skill already exists
   - Export is not performed
   - Dialog remains open

#### Test 7: Invalid Path (Error Handling)

1. Click "Test Skill Export" button
2. Manually edit the export path to an invalid location (e.g., `Z:\nonexistent\path`)
3. Click "Export"
4. **Verify**:
   - Error message appears
   - Message indicates path is not writable
   - Export is not performed

#### Test 8: Invalid Skill Name

1. Click "Test Skill Export" button
2. Enter a very short name (e.g., "ab")
3. **Verify**:
   - Error message appears below input
   - Export button is disabled
   - Cannot proceed with export

#### Test 9: File Validation

After a successful export:
1. Navigate to the skill folder
2. Check SKILL.md file properties
3. **Verify**:
   - File exists
   - File size is reasonable (not 0 bytes, not > 10MB)
   - File contains the expected content
   - File is readable

#### Test 10: Screenshot Copying

**Note**: This test requires actual screenshot files to exist.

1. Create a test session directory with some .webp files:
   ```
   /tmp/skill-e-sessions/test-session/
   ├── frame_001.webp
   ├── frame_002.webp
   └── frame_003.webp
   ```
2. Run the export with screenshots enabled
3. **Verify**:
   - Screenshots are copied to references/ folder
   - Files are renamed to step1.webp, step2.webp, etc.
   - Original files remain in source location
   - Copied files are readable

## Expected Results

### Success Case

When export succeeds, you should see:

```
✓ Export Successful!
  Skill saved to: C:\Users\YourName\workspace\skills\create-user-account

  Skill Folder: C:\Users\YourName\workspace\skills\create-user-account
  SKILL.md Path: C:\Users\YourName\workspace\skills\create-user-account\SKILL.md
  Screenshots Copied: 3
  Assets Copied: 0

  [Open Skill Folder] button
```

### Error Cases

**Duplicate Skill**:
```
✗ Export Failed
  Skill "create-user-account" already exists in this location. 
  Please choose a different name or delete the existing folder.
```

**Invalid Path**:
```
✗ Export Failed
  Export path is not writable: Permission denied (os error 13)
```

**Empty Skill Name**:
```
✗ Export Failed
  Skill name cannot be empty
```

## Troubleshooting

### Issue: "Failed to create skill folder"

**Possible causes**:
- Export path doesn't exist and can't be created
- No write permissions for the path
- Path contains invalid characters

**Solution**:
- Choose a different export location
- Check folder permissions
- Use a simpler path (e.g., Desktop)

### Issue: "Screenshots not copied"

**Possible causes**:
- Screenshot files don't exist at the specified paths
- Screenshot paths are incorrect
- No read permissions for screenshot files

**Solution**:
- Check that screenshot files exist
- Verify file paths are correct
- Check file permissions

### Issue: "SKILL.md file is empty"

**Possible causes**:
- Skill content is empty
- Write operation failed silently

**Solution**:
- Check that skill content is not empty
- Verify disk space is available
- Check file system permissions

## Code Quality Checks

- [ ] Rust code compiles without warnings
- [ ] TypeScript code has no type errors
- [ ] All error cases are handled gracefully
- [ ] Success and error messages are clear
- [ ] File paths are properly sanitized
- [ ] Folder structure matches specification
- [ ] File validation is performed
- [ ] Export result includes all required information

## Requirements Validation

- [x] **FR-6.4**: Create skill folder (skill-name/)
- [x] **FR-6.4**: Save SKILL.md inside folder
- [x] **FR-6.4**: Copy reference screenshots if selected
- [x] **FR-6.4**: Validate file was saved successfully

## Next Steps

After this task is complete:
1. Test with real session data (not sample data)
2. Integrate with the SkillEditor component
3. Add progress indicators for large exports
4. Implement asset copying (if needed)
5. Add export history/recent exports

## Notes

- The implementation uses Rust's `std::fs` for file operations
- File paths are validated and sanitized
- Screenshots are renamed to step1, step2, etc. for consistency
- The export is atomic - if any step fails, the entire export fails
- Existing folders are not overwritten (prevents data loss)
