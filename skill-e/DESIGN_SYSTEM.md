# Design System Configuration

## Overview
This document confirms the shadcn/ui "Mira" design system configuration for Skill-E.

## Configuration Details

### shadcn/ui Setup (components.json)
```json
{
  "style": "new-york",
  "baseColor": "neutral",
  "radius": 0.5,
  "cssVariables": true,
  "iconLibrary": "lucide"
}
```

### Typography
- **Primary Font**: Nunito Sans (400, 600, 700 weights)
- **Fallback**: system-ui, sans-serif
- **Import**: @fontsource/nunito-sans

### Color Palette
- **Base**: Neutral (zinc/slate based)
- **Theme**: Dark mode first-class citizen
- **Approach**: HSL with CSS variables

### Border Radius
- **Base**: 0.5rem (8px)
- **Medium**: calc(0.5rem - 2px)
- **Small**: calc(0.5rem - 4px)

### Icons
- **Library**: Lucide React
- **Size**: 4x4 (1rem) default
- **Style**: Consistent with new-york aesthetic

## Installed Components

### Core UI Components
- ✅ **Button** - All variants (default, secondary, outline, ghost, destructive)
- ✅ **Tooltip** - With TooltipProvider, TooltipTrigger, TooltipContent
- ✅ **Dropdown Menu** - Full menu system with items, separators, shortcuts
- ✅ **Separator** - Horizontal and vertical dividers

### Component Features
- Radix UI primitives for accessibility
- Tailwind CSS for styling
- CSS variables for theming
- Framer Motion ready for animations

## Path Aliases
```typescript
{
  "@/*": ["./src/*"]
}
```

Configured in:
- `tsconfig.json` (TypeScript)
- `vite.config.ts` (Vite bundler)

## Verification

### Build Status
✅ TypeScript compilation successful
✅ Vite build successful
✅ All components properly imported
✅ Font files bundled correctly

### Visual Test
Run `pnpm dev` and check:
- Font rendering (Nunito Sans)
- Button variants and hover states
- Tooltip animations
- Dropdown menu interactions
- Color consistency (neutral palette)
- Border radius (0.5rem)

## Next Steps

### Platform Integration
- [ ] Add `tauri-plugin-window-vibrancy` for glass effects
- [ ] Configure Mica (Windows) background
- [ ] Configure Vibrancy (macOS) background
- [ ] Test transparency with platform effects

### Additional Components (As Needed)
- Dialog/Modal
- Card
- Input
- Label
- Switch
- Tabs

## Design Principles

### "Premium Native" Look
- ✅ Clean typography (Nunito Sans)
- ✅ Subtle rounded corners (0.5rem)
- ✅ Neutral color palette
- ✅ Consistent spacing
- ⏳ Platform-native glass effects (next task)

### "No AI Slop" Policy
- ✅ No excessive gradients
- ✅ No sparkle emojis in UI
- ✅ No cheesy tech backgrounds
- ✅ Consistent padding and spacing

## References
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Radix UI Primitives](https://www.radix-ui.com)
- [Tailwind CSS](https://tailwindcss.com)
- [Lucide Icons](https://lucide.dev)
