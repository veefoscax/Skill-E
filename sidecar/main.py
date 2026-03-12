import os
import argparse
from fastapi import FastAPI, UploadFile, File, HTTPException
from faster_whisper import WhisperModel
import uvicorn
import time

app = FastAPI(title="Skill-E AI Sidecar")

# Global model variable
model = None

def load_model(model_size="base", device="cpu", compute_type="int8"):
    global model
    print(f"Loading Whisper model: {model_size} on {device}...")
    model = WhisperModel(model_size, device=device, compute_type=compute_type)
    print("Model loaded successfully.")

@app.get("/health")
async def health_check():
    return {"status": "healthy", "model_loaded": model is not None}

@app.post("/transcribe")
async def transcribe(audio_path: str):
    if model is None:
        raise HTTPException(status_code=500, detail="Model not loaded")
    
    if not os.path.exists(audio_path):
        raise HTTPException(status_code=404, detail="Audio file not found")

    start_time = time.time()
    segments, info = model.transcribe(audio_path, beam_size=5)
    
    text = ""
    for segment in segments:
        text += segment.text + " "
    
    duration = time.time() - start_time
    
    return {
        "text": text.strip(),
        "language": info.language,
        "language_probability": info.language_probability,
        "duration_seconds": duration
    }

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=8000)
    parser.add_argument("--model", type=str, default="base")
    parser.add_argument("--device", type=str, default="cpu") # or "cuda"
    args = parser.parse_args()

    load_model(args.model, args.device)
    uvicorn.run(app, host="127.0.0.1", port=args.port)
