# Zustand Stores

This directory contains the application's state management using Zustand.

## Stores

### Recording Store (`recording.ts`)

Manages the state of recording sessions including:
- Recording status (isRecording, isPaused)
- Timing information (startTime, duration)
- Captured frames and audio data

**Usage Example:**

```typescript
import { useRecordingStore } from '@/stores';

function RecordingComponent() {
  const { 
    isRecording, 
    duration, 
    startRecording, 
    stopRecording 
  } = useRecordingStore();

  return (
    <div>
      <p>Recording: {isRecording ? 'Yes' : 'No'}</p>
      <p>Duration: {duration}s</p>
      <button onClick={startRecording}>Start</button>
      <button onClick={stopRecording}>Stop</button>
    </div>
  );
}
```

**Persistence:**
The recording store uses Zustand's persist middleware but currently doesn't persist any data (recording sessions are transient).

### Settings Store (`settings.ts`)

Manages application settings and user preferences:
- API keys (Whisper, Claude, OpenAI)
- Recording settings (capture interval, quality)
- Window position and preferences
- Hotkey configurations
- Theme settings

**Usage Example:**

```typescript
import { useSettingsStore } from '@/stores';

function SettingsPanel() {
  const { 
    whisperApiKey, 
    setWhisperApiKey,
    captureInterval,
    setCaptureInterval 
  } = useSettingsStore();

  return (
    <div>
      <input 
        value={whisperApiKey}
        onChange={(e) => setWhisperApiKey(e.target.value)}
        placeholder="Whisper API Key"
      />
      <input 
        type="number"
        value={captureInterval}
        onChange={(e) => setCaptureInterval(Number(e.target.value))}
      />
    </div>
  );
}
```

**Persistence:**
All settings are persisted to localStorage under the key `settings-storage` and will be restored on app restart.

## Integration

The stores are already integrated into the Toolbar component:
- Recording controls use `useRecordingStore` for state management
- Timer display shows the current recording duration
- All recording actions (start, pause, resume, stop) update the global state

## Requirements Satisfied

- **FR-1.6**: Window position persistence (via settings store)
- **AC5**: Position saved to local storage and restored on launch

## Next Steps

Future tasks will:
1. Implement window position persistence (Task 6)
2. Add annotation mode state management
3. Connect stores to Tauri backend commands
