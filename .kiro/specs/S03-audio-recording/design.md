# S03: Audio Recording - Design

## Architecture

```
┌──────────────────────────────────────────────────┐
│              Audio Recording Pipeline             │
├──────────────────────────────────────────────────┤
│  WebView (React)                                  │
│  ┌────────────────────────────────────────────┐  │
│  │  getUserMedia() → MediaRecorder → Blob     │  │
│  └────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────┤
│  Tauri Backend                                    │
│  ┌────────────────────────────────────────────┐  │
│  │  Save Blob → File System                   │  │
│  └────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────┤
│  Whisper API                                      │
│  ┌────────────────────────────────────────────┐  │
│  │  Audio File → Transcription + Timestamps   │  │
│  └────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────┘
```

## Data Structures

```typescript
interface AudioSegment {
  id: string;
  startTime: number;
  endTime: number;
  audioPath: string;
  transcription?: string;
}

interface TranscriptionResult {
  text: string;
  segments: Array<{
    start: number;
    end: number;
    text: string;
  }>;
  language: string;
}
```

## Whisper Integration

```typescript
async function transcribeAudio(audioPath: string): Promise<TranscriptionResult> {
  const formData = new FormData();
  formData.append('file', await readFile(audioPath));
  formData.append('model', 'whisper-1');
  formData.append('response_format', 'verbose_json');
  formData.append('timestamp_granularities[]', 'segment');
  
  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}` },
    body: formData
  });
  
  return response.json();
}
```
