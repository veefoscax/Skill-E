# Skill-E Development Log

> The Bridge Between Human Action and Agent Understanding - Development Timeline

---

## Phase 0: The Vision & The OpenCloud Pivot
**Context**: "Agents are smart, but they are blind."
Initially, we were building an **OpenClaw** implementation for the browser. However, we realized that restricting agents to the browser was a limitation. The missing piece was a *Desktop* layer that could orchestrate local apps, not just web pages. Thus, **Skill-E** was born.

## Phase 1: The Multi-Window Challenge
**Challenge**: We quickly realized a single window wasn't enough. We needed a non-intrusive Toolbar, a transparent Overlay, and a Settings window.
**Solution**: We implemented a `Tauri Event` bus. When the Toolbar says "Record", the Overlay wakes up instantly. It feels like one app, but it's three distinct processes orchestrated by Rust.

## Phase 2: The Whisper Saga (GPU vs CPU)
**Challenge**: Compiling `whisper.cpp` directly into the binary with CUDA support caused chaos on CI/CD due to NVIDIA driver versions.
**Solution**: We prioritized **Reliability**. We switched the build to **CPU Mode** for the initial submission.

## Phase 3: Local Intelligence (Ollama)
**Context**: We didn't want users to pay for API keys just to test the app.
**Solution**: We integrated **Ollama** support directly. The app detects if Ollama is running (`localhost:11434`) and auto-configures itself.

## Phase 4: Post-Hackathon Elite Refinements
**Date**: March 2026
**Focus**: Architecture, Code Quality, and Performance

### Completed
- ✅ **Python Sidecar Architecture [E02]**: Offloaded heavy AI inference (Whisper/GPU) to a standalone Python FastAPI process.
- ✅ **Native OS Playback [E03]**: Implemented `enigo` in Rust to physically move the mouse and type keys on the desktop.
- ✅ **Memory Optimization [E10]**: Added a sliding window frame buffer (max 100 frames) to prevent RAM bloating during long sessions.
- ✅ **Testing Infrastructure [E09]**: Configured Vitest, React Testing Library, and Tauri global mocks.
- ✅ **Code Quality [E08]**: Enforced strict ESLint rules (unused imports), Prettier formatting, and Husky hooks.
- ✅ **Cross-Platform Hooks [E05]**: Added native window context hooks for macOS (`osascript`) and Linux (`xdotool`).
- ✅ **Whisper Model Management [E06]**: Added interactive UI for downloading multi-gigabyte models via Tauri IPC channels.

---

## 🛠️ Key Decisions
- **Stack**: Tauri (Rust) + React 18 + Vite + Tailwind CSS
- **AI Processing**: Python Sidecar (Faster Whisper) + Local/Cloud LLMs
- **Desktop Automation**: `rdev` (global input hooks) + `enigo` (native playback)

*Maintained by veefoscax - Skill-E Founder*

---

## 🔭 Future Horizons & Improvements

While we are proud of the v1.0.0 submission, we left some ambitious features for the post-hackathon roadmap:

### 1. Mac & Linux Support
Currently, the `Global Input Hook` (rdev) is tuned for Windows APIs (`user32.dll`). Porting this to MacOS (Accessibility API) and Linux (X11/Wayland) is our top priority to make Skill-E truly cross-platform.

### 2. The Python Sidecar
As mentioned in the "Whisper Saga", we want to bring back GPU acceleration.
Instead of embedding C++, we will bundle a standalone Python executable (PyInstaller) that handles PyTorch and Whisper. This allows us to use the latest SOTA models the day they are released, without recompiling Rust.

### 3. "Play It Back"
Right now, we generate the *Skill Definition*. The dream is to have a "Play" button that immediately instantiates an Agent to execute the task you just taught it, verifying the loop 100%.

---

## 🏁 Conclusion

Skill-E isn't just a tool; it's a new way to program.
We moved from "writing code" to "demonstrating intent".
We hope the judges see the potential of this paradigm shift.

**- The Skill-E Team**

---

## 💰 Kiro Resource Ledger (For Judges)

**Total Credits Available:** 2,500  
**Total Credits Used:** ~2,150 (86%)  
**Remaining:** 350 credits

| Feature | Credits | Notes |
|---------|---------|-------|
| S07 Variable Detection | -380 | Speech patterns, action classification |
| S06 Skill Export | -320 | Provider Factory, XML prompts |
| S04 Overlay UI | -420 | Cursor highlight, step bubbles (later disabled) |
| S05 Processing Pipeline | -350 | OCR, timeline merging |
| S09 Audio Fix | -180 | Session directory persistence |
| S03 Ollama Integration | -120 | Local LLM support |
| OpenRouter Support | -80 | Free tier models |
| S10 Prompt Engineering | -150 | XML tags, few-shot examples |
| S11 Build Optimization | -100 | Windows build scripts |
| S12 Whisper Debug | -50 | Auto-download, enhanced logging |

**Note:** Developed on Kiro's free plan without Opus 4.5. Used Haiku 3.5 requiring more iterations. Constraints breed creativity!
