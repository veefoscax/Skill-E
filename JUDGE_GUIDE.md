# 📦 JUDGE TESTING GUIDE - Skill-E

## 🎯 SIMPLIFIED VERSION FOR TESTING

This version works **without installing Rust, LLVM, or compiling native code**.

---

## ✅ OPTION 1: Test Frontend (Recommended)

### Only Node.js Required

1. **Install Node.js** (if not installed):
   - Download: https://nodejs.org/ (LTS version)
   - Or: `winget install OpenJS.NodeJS.LTS`

2. **Navigate to project folder**:
   ```powershell
   cd Skill-E\skill-e
   ```

3. **Install dependencies**:
   ```powershell
   npm install
   ```

4. **Start development mode**:
   ```powershell
   npm run dev
   ```

5. **Open browser**: http://localhost:5173

---

## 🔧 OPTION 2: Full Tauri Version

This version has all features but **requires compilation**.

### Prerequisites:
1. Node.js
2. Rust (https://rustup.rs/)
3. Visual Studio Build Tools
4. LLVM (for Whisper)

See: `ONBOARDING.md` for detailed instructions

---

## 📋 AVAILABLE FEATURES

### ✅ Frontend Version (Node.js only):
- Complete user interface
- Toolbar with recording controls
- Overlay during recording
- Processing screen with progress
- SKILL.md preview
- File export
- CDP execution (if Chrome available)

### ⚠️ Limitations (without compiled Rust):
- Screen capture: uses simulation/mock
- Audio transcription: uses mock (not real Whisper)
- File saving: via browser (not system)

---

## 🧪 RECOMMENDED TEST FLOW

### Test 1: Interface
1. Open http://localhost:5173
2. Click **"Record"**
3. Verify overlay appears with timer
4. Click **"Stop & Process"**
5. See processing screen
6. View generated SKILL.md preview
7. Click **"Download"** to save file

### Test 2: Features
- Navigation between screens
- Interface responsiveness
- Markdown preview
- File export

---

## 🚀 QUICK COMMANDS

```powershell
# Install everything at once (Windows)
winget install OpenJS.NodeJS.LTS
cd Skill-E\skill-e
npm install
npm run dev
```

---

## 📞 SUPPORT

If you encounter issues:
1. Check Node.js is installed: `node --version`
2. Verify port 5173 is free
3. Check browser console (F12) for errors

---

**Note for judges:** This is a simplified version for easy testing. The full version with all native features requires a configured development environment (Rust, LLVM, etc.) as per technical documentation.
