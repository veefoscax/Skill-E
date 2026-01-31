# Skill-E 🧠

> **Turn screen demonstrations into AI agent skills.**

**Dynamous Kiro Hackathon 2026 Submission**

---

## 🏆 What is Skill-E?

Skill-E is a **local-first** Windows application that watches your screen and generates structured **Agent Skills** automatically. Instead of writing prompts or code, you simply *show* the agent what to do.

### How It Works

1. **Record** - Hit record and perform a task (e.g., "Download a report from Salesforce")
2. **Explain** - Talk through what you're doing. Skill-E listens.
3. **Process** - Local Whisper transcribes audio, OCR captures UI elements, AI correlates actions with intent
4. **Generate** - Returns a clean `SKILL.md` ready for your AI Agent to execute

### Demo Video
📺 [Watch on YouTube](https://youtube.com/your-video-link) *(add your link)*

---

## ✨ Key Features

- **👀 Observation Engine** - Captures screen, clicks, keystrokes, and visual context
- **🗣️ Voice-to-Intent** - Uses **Local Whisper** (Privacy-First) to understand spoken explanations
- **🧠 Local Intelligence** - Integrates with **Ollama** for skill synthesis without cloud data
- **⚡ Native Performance** - Built with **Tauri v2** (Rust + React) for lightweight, fast operation
- **🔌 Multi-Provider** - Supports Ollama, OpenAI, Anthropic, OpenRouter, and more

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v20+)
- [Rust](https://www.rust-lang.org/tools/install) (latest stable)
- [Ollama](https://ollama.com/) (for local LLM generation)

### Development

```bash
# Clone repository
git clone https://github.com/veefoscax/Skill-E.git
cd Skill-E/skill-e

# Install dependencies
pnpm install

# Development mode
pnpm tauri dev

# Production build
pnpm tauri build
```

### Windows Installer (Pre-built)

Download from [Releases](../../releases):
1. Unzip `Skill-E-v1.0.0-Setup.zip`
2. Run `Skill-E_1.0.0_x64-setup.exe`
3. Follow onboarding wizard

---

## 📸 Screenshots

*[Add screenshots of: Toolbar, Recording Overlay, Processing Screen, Skill Preview]*

---

## 🛠️ Architecture

### Frontend (React + TypeScript)
- `src/components/Toolbar/` - Recording controls
- `src/components/ProcessingScreen/` - AI processing progress
- `src/components/PreviewScreen/` - Skill preview & execution
- `src/lib/processing.ts` - AI processing pipeline
- `src/lib/cdp/` - Chrome DevTools Protocol integration

### Backend (Rust + Tauri)
- Screen capture commands
- Audio file handling  
- Whisper model management
- Session storage

---

## 📝 Documentation

| File | Purpose |
|------|---------|
| `SUBMISSION.md` | Delivery guide & installation |
| `JUDGE_GUIDE.md` | Quick testing instructions |
| `DEMO_SCRIPT.md` | Video script for YouTube |
| `BUILD.md` | Build from source guide |
| `ONBOARDING.md` | Developer setup guide |
| `DEVLOG.md` | Development timeline & credits |
| `STATUS_ENTREGA.md` | Project status overview |

---

## 🎯 Hackathon Context

**Challenge:** Build real-world applications using Kiro CLI  
**Theme:** Open - solve any genuine problem  
**Prize Pool:** $17,000  

### Our Solution
Skill-E bridges the gap between human expertise and AI agent capabilities. Instead of requiring users to learn prompt engineering or write code, they simply demonstrate - making AI automation accessible to everyone.

---

## 🔒 Privacy First

- 100% local processing (screen, audio, AI)
- No data sent to cloud unless you choose external LLM providers
- Whisper runs locally on your machine
- Optional: Use Ollama for completely offline operation

---

## 🏅 Achievements

- ✅ Screen recording with cursor tracking
- ✅ Local Whisper transcription (offline)
- ✅ OCR text extraction (Tesseract)
- ✅ Multi-provider LLM support
- ✅ CDP execution in Chrome
- ✅ SKILL.md generation & export

---

## 🗺️ Roadmap

### Completed (Hackathon)
- [x] Multi-Window Architecture
- [x] Local Whisper Integration
- [x] Global Input Tracking
- [x] Multi-Provider LLM Support
- [x] CDP Skill Execution

### Future (Post-Hackathon)
- [ ] Python Sidecar for GPU acceleration
- [ ] macOS & Linux support
- [ ] Cloud sync for team sharing
- [ ] Built-in skill player/sandbox

---

## 📄 License

MIT - See [LICENSE](LICENSE)

---

**Built with ❤️ using Kiro CLI for Dynamous Kiro Hackathon 2026**

*Developed on the free plan - proving constraints breed creativity.*
