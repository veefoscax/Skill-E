//! Local Whisper transcription using whisper-rs
//!
//! This module provides Tauri commands for local audio transcription
//! using whisper.cpp via the whisper-rs Rust bindings.
//!
//! Requirements:
//! - FR-3.6: Support local Whisper transcription via whisper-rs
//! - NFR-3.4: Local transcription should work offline

use serde::{Deserialize, Serialize};
use std::path::PathBuf;

/// Transcription segment with timestamps
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TranscriptionSegment {
    pub id: i32,
    pub start: f64,  // seconds
    pub end: f64,    // seconds
    pub text: String,
}

/// Result of local transcription
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LocalTranscriptionResult {
    pub text: String,
    pub segments: Vec<TranscriptionSegment>,
    pub language: String,
    pub duration: f64,
}

/// Model download progress
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelDownloadProgress {
    pub model: String,
    pub downloaded_bytes: u64,
    pub total_bytes: u64,
    pub percentage: f32,
}

/// Available Whisper models
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum WhisperModel {
    Tiny,
    Base,
    Small,
    Medium,
    LargeV3,
    Turbo,
}

impl WhisperModel {
    /// Get the model filename
    pub fn filename(&self) -> &'static str {
        match self {
            WhisperModel::Tiny => "ggml-tiny.bin",
            WhisperModel::Base => "ggml-base.bin",
            WhisperModel::Small => "ggml-small.bin",
            WhisperModel::Medium => "ggml-medium.bin",
            WhisperModel::LargeV3 => "ggml-large-v3.bin",
            WhisperModel::Turbo => "ggml-large-v3-turbo.bin",
        }
    }

    /// Get the Hugging Face download URL
    pub fn download_url(&self) -> &'static str {
        match self {
            WhisperModel::Tiny => "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.bin",
            WhisperModel::Base => "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.bin",
            WhisperModel::Small => "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin",
            WhisperModel::Medium => "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-medium.bin",
            WhisperModel::LargeV3 => "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3.bin",
            WhisperModel::Turbo => "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3-turbo.bin",
        }
    }

    /// Get approximate model size in bytes
    pub fn size_bytes(&self) -> u64 {
        match self {
            WhisperModel::Tiny => 75_000_000,      // ~75MB
            WhisperModel::Base => 142_000_000,     // ~142MB
            WhisperModel::Small => 466_000_000,    // ~466MB
            WhisperModel::Medium => 1_500_000_000, // ~1.5GB
            WhisperModel::LargeV3 => 3_100_000_000, // ~3.1GB
            WhisperModel::Turbo => 809_000_000,    // ~809MB
        }
    }
}

impl From<String> for WhisperModel {
    fn from(s: String) -> Self {
        match s.to_lowercase().as_str() {
            "tiny" => WhisperModel::Tiny,
            "base" => WhisperModel::Base,
            "small" => WhisperModel::Small,
            "medium" => WhisperModel::Medium,
            "large-v3" | "largev3" | "large" => WhisperModel::LargeV3,
            "turbo" => WhisperModel::Turbo,
            _ => WhisperModel::Tiny, // Default to tiny
        }
    }
}

/// Get the models directory path
fn get_models_dir() -> Result<PathBuf, String> {
    let app_data = dirs::data_local_dir()
        .ok_or("Could not find local app data directory")?;
    let models_dir = app_data.join("skill-e").join("whisper-models");
    Ok(models_dir)
}

/// Check if a model exists locally
#[tauri::command]
pub fn check_model_exists(model: String) -> Result<bool, String> {
    let whisper_model: WhisperModel = model.into();
    let models_dir = get_models_dir()?;
    let model_path = models_dir.join(whisper_model.filename());
    Ok(model_path.exists())
}

/// Get model info for UI
#[tauri::command]
pub fn get_model_info(model: String) -> Result<serde_json::Value, String> {
    let whisper_model: WhisperModel = model.into();
    let models_dir = get_models_dir()?;
    let model_path = models_dir.join(whisper_model.filename());
    
    Ok(serde_json::json!({
        "filename": whisper_model.filename(),
        "downloadUrl": whisper_model.download_url(),
        "sizeBytes": whisper_model.size_bytes(),
        "exists": model_path.exists(),
        "path": model_path.to_string_lossy(),
    }))
}

/// Get all available models info
#[tauri::command]
pub fn get_available_models() -> Result<Vec<serde_json::Value>, String> {
    let models = vec![
        ("tiny", "Tiny", "~75MB", false),
        ("base", "Base", "~142MB", false),
        ("small", "Small", "~466MB", false),
        ("medium", "Medium", "~1.5GB", true),
        ("large-v3", "Large V3", "~3.1GB", true),
        ("turbo", "Turbo", "~809MB", true),
    ];
    
    let models_dir = get_models_dir()?;
    
    let result: Vec<serde_json::Value> = models
        .iter()
        .map(|(id, name, size, gpu_recommended)| {
            let whisper_model: WhisperModel = id.to_string().into();
            let model_path = models_dir.join(whisper_model.filename());
            serde_json::json!({
                "id": id,
                "name": name,
                "size": size,
                "gpuRecommended": gpu_recommended,
                "exists": model_path.exists(),
            })
        })
        .collect();
    
    Ok(result)
}

/// Transcribe audio file locally using whisper-rs
/// 
/// Note: This command requires the "local-whisper" feature to be enabled
/// at compile time. If not enabled, it will return an error.
#[tauri::command]
pub async fn transcribe_local(
    audio_path: String,
    model: String,
    _use_gpu: bool,
) -> Result<LocalTranscriptionResult, String> {
    #[cfg(feature = "local-whisper")]
    {
        use whisper_rs::{FullParams, SamplingStrategy, WhisperContext, WhisperContextParameters};
        
        let whisper_model: WhisperModel = model.into();
        let models_dir = get_models_dir()?;
        let model_path = models_dir.join(whisper_model.filename());
        
        if !model_path.exists() {
            return Err(format!(
                "Model not found: {}. Please download it first.",
                model_path.display()
            ));
        }
        
        // Load the audio file
        let audio_path = PathBuf::from(&audio_path);
        if !audio_path.exists() {
            return Err(format!("Audio file not found: {}", audio_path.display()));
        }
        
        // Read audio as WAV (need to convert webm to wav first)
        // For now, we expect WAV input or use hound to read it
        let reader = hound::WavReader::open(&audio_path)
            .map_err(|e| format!("Failed to open audio file: {}. Make sure it's a WAV file.", e))?;
        
        let spec = reader.spec();
        let samples: Vec<f32> = if spec.sample_format == hound::SampleFormat::Float {
            reader.into_samples::<f32>()
                .filter_map(Result::ok)
                .collect()
        } else {
            reader.into_samples::<i16>()
                .filter_map(Result::ok)
                .map(|s| s as f32 / 32768.0)
                .collect()
        };
        
        // Convert stereo to mono if needed
        let samples = if spec.channels == 2 {
            whisper_rs::convert_stereo_to_mono_audio(&samples)
                .map_err(|e| format!("Failed to convert stereo to mono: {}", e))?
        } else {
            samples
        };
        
        // Create Whisper context
        let ctx = WhisperContext::new_with_params(
            model_path.to_str().unwrap(),
            WhisperContextParameters::default(),
        ).map_err(|e| format!("Failed to create Whisper context: {}", e))?;
        
        // Create state
        let mut state = ctx.create_state()
            .map_err(|e| format!("Failed to create Whisper state: {}", e))?;
        
        // Set up parameters for transcription
        let mut params = FullParams::new(SamplingStrategy::Greedy { best_of: 1 });
        params.set_print_special(false);
        params.set_print_progress(false);
        params.set_print_realtime(false);
        params.set_print_timestamps(false);
        params.set_translate(false);  // Don't translate, keep original language
        params.set_language(Some("auto"));  // Auto-detect language (multilingual)
        
        // Run transcription
        state.full(params, &samples)
            .map_err(|e| format!("Transcription failed: {}", e))?;
        
        // Extract results
        let num_segments = state.full_n_segments()
            .map_err(|e| format!("Failed to get segment count: {}", e))?;
        
        let mut segments = Vec::new();
        let mut full_text = String::new();
        
        for i in 0..num_segments {
            let text = state.full_get_segment_text(i)
                .map_err(|e| format!("Failed to get segment text: {}", e))?;
            let start = state.full_get_segment_t0(i)
                .map_err(|e| format!("Failed to get segment start: {}", e))?;
            let end = state.full_get_segment_t1(i)
                .map_err(|e| format!("Failed to get segment end: {}", e))?;
            
            // Convert from centiseconds to seconds
            let start_sec = start as f64 / 100.0;
            let end_sec = end as f64 / 100.0;
            
            segments.push(TranscriptionSegment {
                id: i as i32,
                start: start_sec,
                end: end_sec,
                text: text.trim().to_string(),
            });
            
            full_text.push_str(&text);
            full_text.push(' ');
        }
        
        // Get detected language (if available)
        let language = "auto-detected".to_string();
        
        // Calculate duration from last segment
        let duration = segments.last()
            .map(|s| s.end)
            .unwrap_or(0.0);
        
        Ok(LocalTranscriptionResult {
            text: full_text.trim().to_string(),
            segments,
            language,
            duration,
        })
    }
    
    #[cfg(not(feature = "local-whisper"))]
    {
        let _ = (audio_path, model, _use_gpu);
        Err("Local Whisper transcription is not enabled. Compile with --features local-whisper".to_string())
    }
}

/// Download a Whisper model from Hugging Face
/// 
/// This is a placeholder - actual implementation would need async HTTP client
#[tauri::command]
pub fn get_model_download_url(model: String) -> Result<String, String> {
    let whisper_model: WhisperModel = model.into();
    Ok(whisper_model.download_url().to_string())
}

/// Get the path where models should be stored
#[tauri::command]
pub fn get_models_directory() -> Result<String, String> {
    let models_dir = get_models_dir()?;
    
    // Create directory if it doesn't exist
    std::fs::create_dir_all(&models_dir)
        .map_err(|e| format!("Failed to create models directory: {}", e))?;
    
    Ok(models_dir.to_string_lossy().to_string())
}

// Unit tests
#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_model_from_string() {
        let model: WhisperModel = "tiny".to_string().into();
        assert_eq!(model.filename(), "ggml-tiny.bin");
        
        let model: WhisperModel = "turbo".to_string().into();
        assert_eq!(model.filename(), "ggml-large-v3-turbo.bin");
        
        let model: WhisperModel = "large-v3".to_string().into();
        assert_eq!(model.filename(), "ggml-large-v3.bin");
    }
    
    #[test]
    fn test_transcription_result_serialization() {
        let result = LocalTranscriptionResult {
            text: "Hello world".to_string(),
            segments: vec![
                TranscriptionSegment {
                    id: 0,
                    start: 0.0,
                    end: 1.5,
                    text: "Hello".to_string(),
                },
                TranscriptionSegment {
                    id: 1,
                    start: 1.5,
                    end: 3.0,
                    text: "world".to_string(),
                },
            ],
            language: "en".to_string(),
            duration: 3.0,
        };
        
        let json = serde_json::to_string(&result).unwrap();
        assert!(json.contains("Hello world"));
        assert!(json.contains("segments"));
    }
}
