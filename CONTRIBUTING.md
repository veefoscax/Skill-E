# 🧠 Contributing to Skill-E

Skill-E is an ambitious project to revolutionize how agents interact with the desktop. We are thrilled you're interested in contributing!

---

## 🚀 How to Get Started

1.  **Fork the Repo**: Copy the project to your account.
2.  **Clone Locally**: `git clone https://github.com/your-username/Skill-E.git`
3.  **Install Frontend Deps**: `cd skill-e && npm install`
4.  **Install Rust Deps**: Ensure you have the [Tauri prerequisites](https://tauri.app/v1/guides/getting-started/prerequisites) installed.
5.  **Run Dev Mode**: `npm run tauri dev`
6.  **Create a Branch**: `git checkout -b feature/cool-new-idea`
7.  **Submit a PR**: Push and open a Pull Request.

---

## 📜 Project Structure

- **`/src-tauri`**: Rust backend (window management, capture engine, OS hooks).
- **`/src`**: React frontend (UI, stores, hooks).
- **`/assets`**: Documentation, icons, and media files.

---

## 📜 Coding Standards

- **Rust**: Use `cargo fmt` and `cargo clippy` before committing. Follow idiomatic Rust patterns.
- **TypeScript**: Strictly type your React components and hooks.
- **Commits**: Use [Conventional Commits](https://www.conventionalcommits.org/) (e.g., `feat:`, `fix:`, `refactor:`, `docs:`).
- **Events**: Window communication must use the typed event bus via `listen` and `emit`.

---

## 🧪 Testing

- **Rust Tests**: `cargo test` in the `src-tauri` directory.
- **Frontend Tests**: `npm test` for React components.
- **E2E**: We use Playwright for cross-window testing.

---

## 🐛 Bug Reports

Please report bugs with:
- OS version (Windows/Mac/Linux).
- Skill-E version.
- Detailed steps to reproduce the issue.
- Logs from the processing window or the `file-logger`.

---

## 🛡️ Code of Conduct

Maintainers and contributors are expected to be respectful, inclusive, and professional.

---
*Let's build the bridge between actions and agents together!* 🤝
