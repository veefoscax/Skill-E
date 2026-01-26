# React Hooks

Custom React hooks for Skill-E application.

## useWindowPosition

Manages window position persistence across app sessions.

### Features

- **Automatic Restoration**: Restores saved window position on app launch
- **Position Validation**: Checks if saved position is still valid (on-screen)
- **Off-screen Correction**: Centers window if saved position is off-screen
- **Auto-save**: Automatically saves position when window is moved
- **Fallback Handling**: Centers window if no saved position exists

### Usage

```typescript
import { useWindowPosition } from '@/hooks/useWindowPosition';

function App() {
  // Initialize window position persistence
  useWindowPosition();
  
  return <YourComponent />;
}
```

### Implementation Details

The hook uses:
- **Zustand Store**: Persists position to localStorage via `useSettingsStore`
- **Tauri Commands**: Communicates with Rust backend for window operations
- **Event Listeners**: Listens to window move events via Tauri API

### Validation Logic

Position is considered valid if:
- X coordinate: `-250 < x < screenWidth - 50`
- Y coordinate: `-10 < y < screenHeight - 50`

This allows partial off-screen positioning while ensuring the window remains accessible.

### Tauri Commands Used

- `get_monitor_size`: Gets current monitor dimensions
- `set_window_position`: Sets window position
- Window event listener: `onMoved` for tracking position changes
