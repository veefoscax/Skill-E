# Skill-E 🧠

> **The Bridge Between Human Action and Agent Understanding.**

<div align="center">
  <img src=".\assets\skille_bot.PNG" alt="Skill-E Mascot" width="150" />
</div>

**Skill-E** is a local-first application that observes your workflow and automatically generates structured **Skill Definitions** for AI Agents. Instead of writing prompts or code, you simply *show* the agent what to do.

### 🌟 Key Features

- **👀 Observation Engine**: Captures screen clicks, keystrokes, and visual context.
- **🗣️ Voice-to-Intent**: Uses **Local Whisper** (Privacy-First) to understand your spoken explanations.
- **🧠 Local Intelligence**: Integrates with **Ollama** to synthesize observations into semantic skills without sending data to the cloud.
- **⚡ Native Performance**: Built with **Tauri v2** (Rust + React) for a lightweight, blazer-fast footprint.
- **🔋 Battery Included**: Comes with built-in OCR and Computer Vision (Tesseract).

---

## 🚀 How It Works

1.  **Record**: Hit the record button and perform a task (e.g., "How to download a report from Salesforce").
2.  **Explain**: Talk through what you are doing. Skill-E listens.
3.  **Process**:
    *   **Whisper** works locally to transcribe audio.
    *   **Vision Engine** captures UI elements and text (OCR).
    *   **Planner** correlates clicks with intent.
4.  **Generate**: Returns a clean `SKILL.md` or JSON definition ready for your AI Agent to execute.

---

## 📦 Installation & Download

### Windows (Pre-built)
Download the latest artifacts from the [Releases Page](./releases) or check the `dist/` folder if building locally.

**Option 1: Installer** (Recommended)
1.  Run `Skill-E_0.1.0_x64-setup.exe`.
2.  Follow the setup wizard.

**Option 2: Portable** (No Install)
1.  Download `Skill-E-Portable.exe`.
2.  Run directy.
    *   *Note: This is a standalone executable (Single-File).*

### Developer Setup (Build from Source)

Prerequisites:
- [Node.js](https://nodejs.org/en/) (v20+)
- [Rust](https://www.rust-lang.org/tools/install) (latest stable)
- [C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) (Required for Rust on Windows - select "Desktop development with C++")
- [WebView2 Runtime](https://developer.microsoft.com/en-us/microsoft-edge/webview2/) (Usually pre-installed on Windows 10/11)
- [Ollama](https://ollama.com/) (running specifically for LLM generation)

```bash
# 1. Clone the repository
git clone https://github.com/veefoscax/Skill-E.git
cd Skill-E/skill-e

# 2. Install dependencies
npm install

# 3. Development Mode
npm run tauri dev

# 4. Production Build
npm run tauri build
```

---

## 🗺️ Roadmap & Future Improvements

Skill-E is actively developed — here's what's done and what's next.

### ✅ Completed
- [x] Multi-Window Architecture (Toolbar + Overlay).
- [x] Local Whisper Integration (CPU Mode confirmed stable).
- [x] Global Input Keylogging (Privacy-focused).
- [x] Ollama / OpenRouter / Anthropic Support.

### 🚧 Coming Soon
- **Sidecar Architecture**: We plan to decouple the AI Engine into a Python Sidecar to enable full GPU acceleration (CUDA) without complex compilation steps on the client.
- **Mac & Linux Support**: Currently Windows-only. Porting `rdev` and `GlobalHotkey` logic to MacOS is the next priority.
- **Cloud Sync**: Optional syncing of generated skills to a team repository.
- **Agent Sandbox**: A built-in "Player" to verify the generated skill immediately.

---

## 🛠️ Tech Stack

- **Core**: Tauri v2 (Rust)
- **Frontend**: React + TypeScript + Vite
- **Styling**: TailwindCSS
- **AI/Local**: Whisper-RS (Audio), Tesseract.js (OCR), Ollama (LLM)
- **State**: Zustand + Persist

---

## ❤️ Acknowledgements

- **[OpenClaw](https://github.com/openclaw)** — Open-source gateway infrastructure.

*Built with ❤️ for the future of Agentic workflows.*

---

## 🤝 Related Projects

- **[SidePilot](https://github.com/veefoscax/SidePilot)** — AI Co-Pilot Chrome Extension with multi-provider browser automation.

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.
