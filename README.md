# Skill-E

> **"Show Your Agent the Way"** — Create Agent Skills by demonstration, not by manual writing.

<p align="center">
  <img src="./assets/skille_bot.PNG" alt="Skill-E Bot" width="400" />
</p>

<p align="center">
  <strong>🏆 Project for the Kiro Hackathon 2025</strong>
</p>

---

## 🌐 Language Support

**Interface Language**: Choose your preferred language  
**Voice Recording**: Speak in any language - Whisper transcribes it  
**Skill Output**: Generated SKILL.md adapts to your language  

| Supported | Languages |
|-----------|-----------|
| ✅ Full | English, Portuguese |
| 🔜 Planned | Spanish, French, German, Japanese |

---

## 🤔 Why Skill-E?

### The Problem with General Agents

General AI agents are powerful, but have critical limitations:

| Problem | Consequence |
|---------|-------------|
| **Hallucination** | They invent steps that don't exist |
| **Inconsistency** | They do things differently each time |
| **Lack of context** | They don't know YOUR system |
| **No guardrails** | They can do dangerous things |
| **Hard to audit** | You don't know what they'll do |

### The Solution: Specific Skills

**Skills are teaching robots** — you show how to do something, and the AI learns EXACTLY that.

```
❌ General Agent: "Find customer John in the system"
   → May click anywhere
   → May access wrong data
   → May perform destructive actions

✅ Specific Skill: "Find customer {name} in the system"
   → Exact steps defined
   → Specific fields identified
   → Security guardrails
   → Human-in-the-loop when needed
```

### Why Demonstrate is Better than Describe?

| Just Describe to LLM | Demonstrate with Skill-E |
|---------------------|--------------------------|
| ❌ You forget details | ✅ Captures everything automatically |
| ❌ LLM interprets wrong | ✅ Sees exactly what you did |
| ❌ No visual context | ✅ Reference screenshots |
| ❌ Ambiguous variables | ✅ Detects variables from your speech |
| ❌ No validation | ✅ Built-in success verification |

---

## ✨ Key Features (11 Specs - All MVP)

### 🖥️ Cross-Platform Desktop App (S01)
- **Floating toolbar** - Always on top, draggable
- **System tray** - Near the clock (Windows + macOS)
- **Global hotkeys** - Ctrl+Shift+R to record
- **Platforms**: Windows, macOS, Linux

### 📸 Screen Capture (S02)
- **Screenshots** with cursor position tracking
- **OCR** for text extraction
- **Window detection** for context

### 🎤 Audio Recording (S03)
- **Whisper transcription** - Any language
- **Voice level meter** - Visual feedback
- **Noise filtering** - Clear transcriptions

### ✏️ Overlay UI (S04)
- **Click visualization** - Numbered circles (1, 2, 3...)
- **Drawing tools** - Arrows, rectangles, dots
- **3 fixed colors** - Red, Blue, Green (no color picker needed)
- **Keyboard display** - Shows what you type
- **Password redaction** - Auto-hides sensitive input (●●●●●●)
- **Browser element selector** - Optional DOM element picker

### 🔄 Processing (S05)
- **OCR** on screenshots
- **Step detection** from voice pauses and focus changes
- **Timeline** visualization

### 📝 Skill Export (S06)
- **SKILL.md** in AgentSkills format
- **Variables** automatically detected
- **Conditionals** from "if...then" speech
- **Guardrails** and safety constraints
- **Human-in-the-loop** confirmation points

### 🔍 Variable Detection (S07)
- **Speech patterns** - "the customer name" → `{customer_name}`
- **Action correlation** - Field input → variable
- **Smart defaults** - Suggested variable names

### 🤖 LLM Providers (S08)
5 essential providers (simplified for MVP):

| Provider | Type | Cost |
|----------|------|------|
| **OpenRouter** | Aggregator | 🆓 FREE tier |
| **Anthropic** | Claude API | 💰 Paid |
| **OpenAI** | GPT-4 | 💰 Paid |
| **Google** | Gemini | 💰 Paid |
| **Ollama** | Local | 🆓 FREE |

> 💡 Use **OpenRouter free tier** for demo! No payment required.

### 📚 Context Search (S09)
- **Context7 MCP** - Documentation lookup
- **Web fallback** - Search when docs not found
- **Auto-reference** - Adds docs to SKILL.md

### ✅ Skill Validation (S10)
- **Interactive testing** - Execute skill step-by-step
- **DOM + Image automation** - DOM first, image fallback
- **Feedback loop** - Refine skill from test results
- **Visual confirmation** - Screenshots of each step

### 📦 Distribution (S11)
- **Windows** - MSI installer
- **macOS** - DMG (Universal binary)
- **Linux** - AppImage, .deb
- **GitHub Actions** - Automated builds

---

## 🛡️ Security: Built-in Guardrails

Skills created with Skill-E have **security safeguards by design**:

### 1. Scope Restrictions

```markdown
## ⚠️ Limits of this Skill

This skill MUST:
- Operate only in the CRM system
- Access only active customer data

This skill MUST NOT:
- Delete records permanently
- Access financial data
- Export more than 100 records at once
```

### 2. Human-in-the-Loop

```markdown
## 🔒 Confirmation Points

### Before Saving
> **PAUSE**: Confirm with user before saving changes.
> Show what will be changed and wait for approval.

### Before Exporting
> **PAUSE**: Confirm destination and format with user.
```

### 3. Password Protection

| Location | Behavior |
|----------|----------|
| **Keyboard Display** | Auto-detects password fields → shows `●●●●●●` |
| **Skill Export** | Replaces with `${env:FIELD_PASSWORD}` variable |
| **Recording** | Never stores actual password text |
| **Transcription** | Marks as `[REDACTED]` if spoken |

---

## 🔍 Automatic Documentation Search

When you demonstrate something that uses a library or API, Skill-E can **automatically search documentation**:

### Context7 Integration (MCP)

```
You demonstrate: "Here I use pandas to filter..."

Skill-E detects: pandas
       ↓
Searches Context7: pandas documentation
       ↓
Adds to skill: Reference on how to use df.query()
```

### Result in SKILL.md

```markdown
## Technical References

### Pandas DataFrame Filtering
> To filter data, use `df.query()` or `df[df['column'] == value]`.
> Documentation: https://pandas.pydata.org/docs/reference/api/pandas.DataFrame.query.html

This skill uses the following methods:
- `df.query()` - For complex filters
- `df.to_csv()` - For export
```

---

## 📁 Project Structure

```
Skill-E/
├── .kiro/
│   ├── specs/                  # 11 Kiro Specifications
│   │   ├── S01-app-core/       # Tauri, toolbar, hotkeys, tray
│   │   ├── S02-screen-capture/ # Screenshots, OCR, cursor
│   │   ├── S03-audio-recording/# Whisper, transcription
│   │   ├── S04-overlay-ui/     # Clicks, drawing, keyboard
│   │   ├── S05-processing/     # OCR, step detection
│   │   ├── S06-skill-export/   # SKILL.md generation
│   │   ├── S07-variable-detection/ # Smart detection
│   │   ├── S08-llm-providers/  # 5 essential providers
│   │   ├── S09-context-search/ # Context7, docs lookup
│   │   ├── S10-skill-validation/# Interactive testing
│   │   └── S11-distribution/   # Win/Mac/Linux builds
│   ├── hooks/                  # Automation hooks
│   ├── prompts/                # Prompt templates
│   └── steering/               # Project steering
├── src/                        # React Frontend
├── src-tauri/                  # Rust Backend
├── icons/                      # App icons
├── assets/
│   └── skille_bot.PNG          # Skill-E Logo
├── DEVLOG.md                   # Development log
├── OVERVIEW.md                 # Project overview
└── README.md                   # This file
```

---

## 🚀 Getting Started

### Prerequisites
- Rust & Cargo
- Node.js 18+
- pnpm

### Installation

```bash
# Clone repository
git clone https://github.com/veefoscax/Skill-E.git
cd Skill-E

# Install dependencies
pnpm install

# Run in development
pnpm tauri dev

# Build for production
pnpm tauri build
```

### API Keys Configuration

```bash
# OpenRouter (FREE for testing)
OPENROUTER_API_KEY=sk-or-...

# Whisper (for transcription)
OPENAI_API_KEY=sk-...

# Claude (for skill generation)
ANTHROPIC_API_KEY=sk-ant-...
```

---

## 📊 Competitive Advantage

| Feature | Skill-E | Just LLM | Simple Recorders |
|---------|---------|----------|------------------|
| Visual capture | ✅ | ❌ | ✅ |
| Voice transcription | ✅ | ❌ | ⚠️ |
| Variable detection | ✅ | ❌ | ❌ |
| Automatic conditionals | ✅ | ❌ | ❌ |
| Security guardrails | ✅ | ❌ | ❌ |
| Human-in-the-loop | ✅ | ❌ | ❌ |
| Documentation search | ✅ | ❌ | ❌ |
| AgentSkills format | ✅ | ❌ | ❌ |
| Preview and edit | ✅ | ❌ | ⚠️ |
| Skill validation | ✅ | ❌ | ❌ |
| Cross-platform | ✅ | ⚠️ | ⚠️ |
| Multi-language | ✅ | ⚠️ | ❌ |
| Password redaction | ✅ | ❌ | ❌ |

---

## 🎯 Use Cases

### 1. Repetitive Task Automation
```
Problem: Employee spends 2h/day filling reports
Solution: Record demonstration → Skill → Agent executes
```

### 2. System Onboarding
```
Problem: New employee doesn't know how to use internal system
Solution: Skills that teach step-by-step with screenshots
```

### 3. Safe Computer Control
```
Problem: Agent needs to click things, but may make mistakes
Solution: Skill with guardrails + human confirmations
```

### 4. Living Documentation
```
Problem: Outdated documentation
Solution: Skills ARE the documentation + they're executable
```

---

## 📝 Development

This project is being developed for the **Kiro Hackathon** (deadline: Jan 31, 2025).

See [DEVLOG.md](./DEVLOG.md) for timeline and decisions.
See [OVERVIEW.md](./OVERVIEW.md) for complete project overview.

### All 11 Specs (MVP)

1. **S01** - App Core (Tauri, tray, hotkeys)
2. **S02** - Screen Capture
3. **S03** - Audio Recording
4. **S04** - Overlay UI
5. **S05** - Processing
6. **S06** - Skill Export
7. **S07** - Variable Detection
8. **S08** - LLM Providers
9. **S09** - Context Search
10. **S10** - Skill Validation
11. **S11** - Distribution

---

## 📜 License

MIT

---

<p align="center">
  <img src="./assets/skille_bot.PNG" alt="Skill-E" width="150" />
  <br/>
  <em>"The best way to teach an AI is to show it how."</em>
</p>
