# DEVLOG - The Building of Skill-E

**Hackathon Year:** 2026
**Team:** Skill-E Devs

---

## 📅 The Journey

### Day 1: The Vision & The OpenCloud Pivot
"Agents are smart, but they are blind."
Initialy, we were building an **OpenClaw** implementation for the browser. However, we realized that restricting agents to the browser was a limitation. The missing piece was a *Desktop* layer that could orchestrate local apps, not just web pages.
Thus, **Skill-E** was born: An OpenClaw-inspired desktop layer that bridges the gap between local OS actions and Agent understanding.

**Special Thanks:**
This project was driven by the energy of the **Dynamous Community** and the vision of **Cole Medin**.
And of course, **Kiro CLI** was our "Player 2" throughout the hackathon. From generating boilerplate to refactoring complex React components, Kiro allowed us to ship a production-grade Tauri app in record time.
*Efficiency Note: Kiro was used for practically everything - architecture generation, code scaffolding, and documentation.*

### Day 2: The Multi-Window Challenge
We quickly realized a single window wasn't enough. We needed:
1.  A non-intrusive **Toolbar** (always visible).
2.  A transparent **Overlay** for drawing on the screen.
3.  A **Settings/Processing** window for heavy lifting.

*Technical Hurdle:* Syncing state between these isolated windows.
*Solution:* We implemented a `Tauri Event` bus. When the Toolbar says "Record", the Overlay wakes up instantly. It feels like one app, but it's three distinct processes orchestrated by Rust.

### Day 3: The Whisper Saga (GPU vs CPU)
This was our biggest battle.
*Attempt 1:* Compile `whisper.cpp` directly into the binary with CUDA support.
*Result:* Success on dev machines, chaos on CI/CD. The dependency on specific NVIDIA driver versions and Visual Studio build tools (v143 vs v145) caused hours of debugging.

*Pivot:* We prioritized **Reliability**. We switched the build to **CPU Mode** for the submission. It's slightly slower, but it works on *every* machine out of the box.
*Future Fix:* The roadmap includes moving the heavy AI compute to a Python Sidecar, which is much easier to manage than embedded C++.

### Day 4: Local Intelligence (Ollama)
We didn't want users to pay for API keys just to test the app.
We integrated **Ollama** support directly. The app detects if Ollama is running (`localhost:11434`) and auto-configures itself.
The "Granite" and "Llama3" models proved surprisingly capable of understanding the structured JSON context we generate.

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
