# Audio Testing - Quick Start Guide

## 🚀 Quick Start (5 minutes)

### 1. Get API Key
- Go to https://platform.openai.com/api-keys
- Create new key → Copy it

### 2. Run App
```bash
cd skill-e
npm run tauri dev
```

### 3. Configure API Key
- Scroll to "SettingsTest" component
- Paste API key → Click "Save"
- Wait for green checkmark

### 4. Run Tests (Top of Page)
Find **"S03 Audio Recording - Test Suite"**

**Follow the buttons in order:**
1. Click "Request Microphone Permission" → Allow
2. Click "Start Recording" → Speak for 5-10 seconds
3. Click "Pause Recording" → Click "Resume Recording" (repeat 2-3 times)
4. Click "Stop Recording" → Wait for audio blob
5. Click "Transcribe Audio" → Wait for results

### 5. Verify Results
**Test Summary should show:**
- Total: 12
- Passed: 12 ✅
- Failed: 0
- Pending: 0

**You should see:**
- ✅ Audio level meter responding to voice
- ✅ Red recording indicator
- ✅ Audio playback works
- ✅ Transcription matches what you said
- ✅ Timestamps aligned with segments

## ✅ Success Criteria
All 12 tests pass (green checkmarks)

## ❌ Common Issues

**"Permission denied"**
→ Allow microphone in browser settings

**"Invalid API key"**
→ Check key starts with `sk-` and is active

**"No audio in playback"**
→ Check microphone is working, speak louder

**"Transcription failed"**
→ Check internet connection, verify API key has credits

## 📝 What to Report
After testing, please confirm:
- [ ] All 12 tests passed
- [ ] Audio quality is good
- [ ] Transcription is accurate
- [ ] No errors occurred

---

**See TASK_S03-6_AUDIO_TESTING.md for detailed instructions**
