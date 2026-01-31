# 🎤 Whisper/Transcription Debugging Guide

## Problem
User reports voice not being transcribed in portable mode. Possible causes:

1. **Whisper model not downloaded** (most likely)
2. **Audio not being saved correctly**
3. **Transcription failing silently**

## Solution Implemented

### 1. Auto-Download Model
Added automatic download of Whisper model when not found:
- Location: `src/lib/processing-bridge.ts`
- Model: 'tiny' (~75MB)
- Progress shown in console

### 2. Enhanced Logging
Added detailed logs throughout transcription flow:
- Check model exists
- Download progress
- Audio conversion (WebM → WAV)
- Transcription result
- Fallback chain (if Whisper fails)

### 3. File Logger (NEW)
Created `src/lib/file-logger.ts` to save logs to file:
- Logs saved to: `%TEMP%/skill-e-logs/session-{timestamp}.log`
- Useful for debugging portable mode where console is not visible

## How to Debug

### In Dev Mode (with console):
```bash
pnpm tauri dev
```
Watch console for 🎤 logs during processing.

### In Portable Mode:
1. Run the app
2. Record and process
3. Check logs at: `%TEMP%/skill-e-logs/`
4. Look for files named `session-*.log`

## Expected Log Flow (Success)

```
🎤 AUDIO PATH: C:\Users\...\session-xxx\audio-xxx.webm
🎤 Step 1: Checking if Whisper model 'tiny' exists... (GPU: false)
🎤 Model available: false
🎤 Model 'tiny' not found. Attempting auto-download...
🎤 Download progress: 25% (18MB / 75MB)
🎤 Download progress: 50% (37MB / 75MB)
🎤 Download progress: 75% (56MB / 75MB)
🎤 Download progress: 100% (75MB / 75MB)
🎤 Model available after download: true
🎤 Step 2: Reading WebM file...
🎤 WebM file size: 123456 bytes
🎤 Step 3: Converting WebM to WAV...
🎤 WAV blob size: 246912 bytes
🎤 Step 4: Saving WAV to: ...
🎤 Step 5: Calling transcribe_local...
🎤 Step 6: Transcription result received
🎤 Whisper Local success: "Your actual spoken words..."
```

## Fallback Chain (If Whisper Fails)

1. **Local Whisper** → If model exists, use it
2. **Whisper API** → If API key configured
3. **Web Speech API** → If browser supports it
4. **Session-derived** → Generic message with timestamp

## Manual Model Download

If auto-download fails, manually download:
1. Download: https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.bin
2. Place in: `%LOCALAPPDATA%\skill-e\whisper-models\ggml-tiny.bin`
3. Restart app

## Testing Checklist

- [ ] Audio file is created in session folder
- [ ] Model downloads automatically (first time)
- [ ] Transcription appears in logs
- [ ] SKILL.md contains actual transcribed text

## Credits Used for This Fix
~50 credits - Added logging and auto-download
