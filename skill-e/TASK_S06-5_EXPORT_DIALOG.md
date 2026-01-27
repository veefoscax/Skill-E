# Task S06-5: Export Dialog Implementation

## Overview
Implemented the Export Dialog component for selecting export location and options when saving skills.

## Requirements
- **FR-6.4**: Include verification checklist
- **FR-6.8**: Choose export location (custom or workspace/skills)
- **FR-6.9**: Generate references/ folder with screenshots

## Implementation

### Components Created

#### 1. ExportDialog Component (`src/components/ExportDialog/ExportDialog.tsx`)

**Features:**
- Default export path: `workspace/skills` (relative to user's home directory)
- Custom folder selection via Tauri dialog plugin
- Skill name validation and sanitization
- Export options toggles (screenshots, assets)
- Real-time folder structure preview
- Loading states and disabled states during export

**Skill Name Sanitization:**
- Converts to lowercase
- Replaces spaces with hyphens
- Removes special characters
- Limits to 3-64 characters
- Shows validation errors for invalid names

**Export Options:**
- **Include Screenshots**: Toggle to include reference screenshots in `references/` folder
- **Include Assets**: Toggle to include additional files in `assets/` folder

**Folder Structure Preview:**
Shows expected folder structure based on selected options:
```
workspace/skills/skill-name/
├── SKILL.md
├── references/
│   ├── step1.png
│   ├── step2.png
│   └── ...
└── assets/
    └── ...
```

#### 2. ExportDialogTest Component (`src/components/ExportDialogTest.tsx`)

**Test Features:**
- Interactive test interface
- Simulates export process (2-second delay)
- Displays last export configuration
- Shows expected folder structure
- Lists test cases to verify
- Demonstrates name sanitization examples

## Usage

```typescript
import { ExportDialog, type ExportOptions } from '@/components/ExportDialog';

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (options: ExportOptions) => {
    setIsExporting(true);
    
    // Perform export
    await exportSkill(options);
    
    setIsExporting(false);
    setIsOpen(false);
  };

  return (
    <ExportDialog
      open={isOpen}
      onOpenChange={setIsOpen}
      onExport={handleExport}
      defaultSkillName="my-skill"
      isExporting={isExporting}
    />
  );
}
```

## Testing Instructions

### Manual Testing

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Add the test component to your router/app:**
   ```typescript
   import { ExportDialogTest } from '@/components/ExportDialogTest';
   ```

3. **Test Cases to Verify:**

   ✓ **Default Path Loading**
   - Dialog opens with default path `workspace/skills`
   - Path is relative to user's home directory

   ✓ **Custom Folder Selection**
   - Click the folder icon button
   - Tauri dialog opens
   - Selected path updates the input field

   ✓ **Skill Name Validation**
   - Enter "ab" → Shows error (too short)
   - Enter "My Cool Skill" → Sanitizes to "my-cool-skill"
   - Enter "Create User!" → Sanitizes to "create-user"
   - Enter valid name → No error shown

   ✓ **Export Options**
   - Toggle "Reference Screenshots" on/off
   - Toggle "Assets & Templates" on/off
   - Folder preview updates accordingly

   ✓ **Folder Structure Preview**
   - Shows full path with skill name
   - Updates when options change
   - Displays tree structure correctly

   ✓ **Export Process**
   - Click "Export" button
   - Button shows "Exporting..." during process
   - All controls disabled during export
   - Dialog closes on completion

   ✓ **Cancel/Close**
   - Click "Cancel" button → Dialog closes
   - Press ESC key → Dialog closes
   - Click outside dialog → Dialog closes

### Name Sanitization Examples

| Input | Output |
|-------|--------|
| "My Cool Skill" | "my-cool-skill" |
| "Create User Account!" | "create-user-account" |
| "Login@Website.com" | "loginwebsitecom" |
| "  Spaces  Everywhere  " | "spaces-everywhere" |
| "ab" | ❌ Invalid (too short) |
| "a".repeat(100) | "aaa...aaa" (truncated to 64) |

## Integration Points

### With SkillEditor/SkillPreview
The ExportDialog should be triggered from:
- SkillEditor component (after editing)
- SkillPreview component (after generation)

### With File System (Task 6)
The export options will be passed to the save implementation:
```typescript
interface ExportOptions {
  exportPath: string;
  includeScreenshots: boolean;
  includeAssets: boolean;
  skillName: string;
}
```

## Dependencies

- `@tauri-apps/plugin-dialog` - For folder picker
- `@tauri-apps/api/path` - For home directory path
- `shadcn/ui` components:
  - Dialog
  - Button
  - Input
  - Label
- `lucide-react` icons

## Design Decisions

1. **Default Path**: Uses `workspace/skills` relative to home directory for consistency with project structure
2. **Sanitization**: Automatic to prevent filesystem errors and ensure consistency
3. **Preview**: Shows folder structure to set clear expectations
4. **Toggles**: Custom toggle switches instead of checkboxes for premium feel
5. **Validation**: Real-time validation with clear error messages

## Next Steps

- **Task 6**: Implement the actual save functionality that uses these export options
- **Task 7**: Add validation for the exported SKILL.md format
- **Integration**: Connect to SkillEditor and SkillPreview components

## Notes

- The dialog uses Tauri's native folder picker for platform-native feel
- All paths are handled as strings (Tauri returns string paths)
- The component is fully controlled (open state managed by parent)
- Export process is handled by parent component (dialog only collects options)
