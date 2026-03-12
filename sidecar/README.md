# Skill-E AI Sidecar (Python) 🐍

This sidecar provides high-performance AI services (Whisper transcription) for the Skill-E desktop application. It offloads heavy GPU/CPU tasks from the Rust binary to a specialized Python process.

## 🚀 Setup

1. **Create Virtual Environment**:
   ```bash
   python -m venv venv
   source venv/Scripts/activate # Windows
   # or
   source venv/bin/activate # Mac/Linux
   ```

2. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Run Server**:
   ```bash
   python main.py --port 8000 --model base --device cpu
   ```

## 📡 API Endpoints

- `GET /health`: Check if server and model are ready.
- `POST /transcribe?audio_path=path/to/audio.wav`: Transcribes a local audio file.

## 🏗️ Architecture

- **Backend**: FastAPI
- **Model**: Faster Whisper (CTranslate2)
- **Integration**: Tauri calls this process during the recording finalization phase.
