# 🏗️ Skill-E Architecture

Skill-E is a local-first desktop layer for agent skill definition, built with **Tauri (Rust)** and **React**. It transforms human actions into structured "Agent Specs" that can be used by LLMs to automate complex desktop workflows.

---

## 🏗️ Multi-Window Orchestration

Skill-E utilizes Tauri's multi-window capabilities to provide a non-intrusive recording experience:

1.  **Toolbar Window**: A persistent, compact UI for controlling recording state.
2.  **Overlay Window**: A transparent, full-screen canvas for visual feedback (highlighting, drawing).
3.  **Processing/Preview Window**: A centered window for heavy AI processing (OCR, Whisper, LLM) and skill editing.

### Event Bus Logic
Windows communicate through a **Typed Tauri Event Bus**. When the Toolbar triggers a "Record" action, an event is emitted that wakes up the Overlay and starts the capture engine in the Rust backend.

---

## ⚙️ Backend (Rust Core)

The Rust layer handles high-performance tasks that require direct OS access:

- **Global Input Hooks**: Captures keyboard and mouse events using platform-specific APIs.
- **Screen Capture Engine**: High-frequency frame capture and encoding (WebP/MP4).
- **Audio System**: Low-latency PCM capture for voice transcription.
- **OS Contextualization**: Retrieves active window titles, process names, and UI hierarchies (Accessibility API).

---

## 🧠 Processing Pipeline (SOTA AI)

Skill-E is designed to be **AI-Provider Agnostic**:

- **Vision**: OCR and element classification (local or cloud).
- **Audio**: OpenAI Whisper (currently CPU-optimized, transitioning to GPU-accelerated Python Sidecar).
- **Reasoning**: Structured JSON generation for OpenClaw-compatible specifications.

---

## 🚀 The Sidecar Strategy

To maintain high performance without bloating the main Rust binary, Skill-E is transitioning to a **Python Sidecar** architecture:

- **Rust**: Orchestration, UI, and low-level OS hooks.
- **Python**: Bundled PyTorch/Whisper executable for heavy GPU-accelerated inference.
- **Communication**: Local HTTP or gRPC bridge for fast data transfer.

---
*Maintained by veefoscax - Skill-E Founder*
