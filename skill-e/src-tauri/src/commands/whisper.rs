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
use futures_util::StreamExt;
use tauri::Manager;
use std::process::Command;


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
#[allow(dead_code)]
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
        let num_segments = state.full_n_segments();
        
        let mut segments = Vec::new();
        let mut full_text = String::new();
        
        for i in 0..num_segments {
            let segment = state.get_segment(i)
                .ok_or_else(|| format!("Failed to get segment {}", i))?;
            
            let text = segment.to_str()
                .map_err(|e| format!("Failed to decode segment {}: {}", i, e))?
                .to_string();
            let start = segment.start_timestamp();
            let end = segment.end_timestamp();
            
            // Convert from milliseconds to seconds
            let start_sec = start as f64 / 1000.0;
            let end_sec = end as f64 / 1000.0;
            
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

/// Download a Whisper model from Hugging Face with progress
#[tauri::command]
pub async fn download_model(
    model: String,
    on_progress: tauri::ipc::Channel<u64>
) -> Result<String, String> {
    let whisper_model: WhisperModel = model.into();
    let models_dir = get_models_dir()?;
    
    // Create directory if it doesn't exist
    std::fs::create_dir_all(&models_dir)
        .map_err(|e| format!("Failed to create models directory: {}", e))?;
    
    let model_path = models_dir.join(whisper_model.filename());
    
    // Check if already exists
    if model_path.exists() {
        return Ok(format!("Model already exists at: {}", model_path.display()));
    }
    
    let url = whisper_model.download_url();
    
    println!("Downloading model from: {}", url);
    
    // Download the file
    let client = reqwest::Client::new();
    let response = client
        .get(url)
        .send()
        .await
        .map_err(|e| format!("Failed to download model: {}", e))?;
    
    let total_size = response
        .content_length()
        .ok_or("Failed to get content length")?;
    
    println!("Total size: {} bytes", total_size);
    
    let mut file = std::fs::File::create(&model_path)
        .map_err(|e| format!("Failed to create file: {}", e))?;
    
    let mut downloaded: u64 = 0;
    let mut stream = response.bytes_stream();
    
    while let Some(chunk) = stream.next().await {
        let chunk = chunk.map_err(|e| format!("Download error: {}", e))?;
        std::io::copy(&mut chunk.as_ref(), &mut file)
            .map_err(|e| format!("Failed to write to file: {}", e))?;
        downloaded += chunk.len() as u64;
        
        // Send progress update
        let _ = on_progress.send(downloaded);
    }
    
    println!("Download complete: {}", model_path.display());
    Ok(format!("Model downloaded to: {}", model_path.display()))
}

/// Ensure a model exists, download if needed
#[tauri::command]
pub async fn ensure_model(model: String) -> Result<String, String> {
    let whisper_model: WhisperModel = model.into();
    let models_dir = get_models_dir()?;
    let model_path = models_dir.join(whisper_model.filename());
    
    if model_path.exists() {
        return Ok(format!("Model exists: {}", model_path.display()));
    }
    
    Err("Model not found. Please download it manually.".to_string())
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
        
    }
}

/// Check if the system supports GPU acceleration for Whisper
/// Returns "cuda", "metal", or "cpu" based on available hardware/drivers
#[tauri::command]
pub fn check_compute_capability() -> Result<String, String> {
    #[cfg(target_os = "macos")]
    {
        // On macOS, we check for Apple Silicon which supports Metal
        // or check for high-performance GPU
        use std::process::Command;
        
        let output = Command::new("sysctl")
            .arg("-n")
            .arg("machdep.cpu.brand_string")
            .output()
            .map_err(|e| e.to_string())?;
            
        let cpu_info = String::from_utf8_lossy(&output.stdout).to_lowercase();
        
        if cpu_info.contains("apple") {
            return Ok("metal".to_string());
        }
        
        // For Intel Macs, check system_profiler for GPU
        let gpu_output = Command::new("system_profiler")
            .arg("SPDisplaysDataType")
            .output()
            .map_err(|e| e.to_string())?;
            
        let gpu_info = String::from_utf8_lossy(&gpu_output.stdout).to_lowercase();
        if gpu_info.contains("metal") {
            return Ok("metal".to_string());
        }
        
        Ok("cpu".to_string())
    }

    #[cfg(target_os = "windows")]
    {
        // On Windows, check for NVIDIA GPU for CUDA support
        use std::process::Command;
        use std::os::windows::process::CommandExt;
        
        const CREATE_NO_WINDOW: u32 = 0x08000000;
        
        // Try WMIC first
        let output = Command::new("wmic")
            .args(&["path", "win32_VideoController", "get", "name"])
            .creation_flags(CREATE_NO_WINDOW)
            .output();

        let mut found_gpus = String::new();

        if let Ok(output) = output {
            let info = String::from_utf8_lossy(&output.stdout).to_lowercase();
            if info.contains("nvidia") {
                return Ok("cuda".to_string());
            }
            found_gpus.push_str(&info);
        }

        // Fallback to PowerShell (Get-CimInstance) if WMIC fails or returns empty/weird encoding
        let ps_output = Command::new("powershell")
            .args(&["-NoProfile", "-Command", "Get-CimInstance Win32_VideoController | Select-Object -ExpandProperty Name"])
            .creation_flags(CREATE_NO_WINDOW)
            .output();

        if let Ok(output) = ps_output {
            let info = String::from_utf8_lossy(&output.stdout).to_lowercase();
            if info.contains("nvidia") {
                return Ok("cuda".to_string());
            }
            found_gpus.push_str(" | PS: ");
            found_gpus.push_str(&info);
        }
        
        // Return found names for debugging
        Ok(format!("cpu (No NVIDIA found. Detected: {})", found_gpus.trim()))
    }

    #[cfg(target_os = "linux")]
    {
        // Basic check for nvidia-smi
        use std::process::Command;
        
        if Command::new("nvidia-smi").output().is_ok() {
            return Ok("cuda".to_string());
        }
        
        Ok("cpu".to_string())
    }
}

/// Start the Python AI Sidecar process
#[tauri::command]
pub async fn start_ai_sidecar(
    state: tauri::State<'_, crate::SidecarState>,
    app_handle: tauri::AppHandle,
    port: u16,
    model: String,
    device: Option<String>,
) -> Result<String, String> {
    let mut child_lock = state.child.lock().map_err(|e| e.to_string())?;
    
    // If already running, return
    if child_lock.is_some() {
        return Ok("Sidecar already running".to_string());
    }

    let resource_dir = app_handle
        .path()
        .resource_dir()
        .map_err(|error| error.to_string())?;

    let candidate_paths = vec![
        resource_dir.join("sidecar").join("main.py"),
        resource_dir.join("main.py"),
        std::env::current_exe()
            .ok()
            .and_then(|path| path.parent().map(|dir| dir.join("sidecar").join("main.py")))
            .unwrap_or_default(),
        std::env::current_dir()
            .ok()
            .map(|dir| dir.join("..").join("sidecar").join("main.py"))
            .unwrap_or_default(),
    ];

    let resource_path = candidate_paths
        .into_iter()
        .find(|path| path.exists())
        .ok_or_else(|| "Could not locate sidecar/main.py in bundle resources or nearby paths".to_string())?;

    println!("Starting AI sidecar at: {:?}", resource_path);

    let device = device.unwrap_or_else(|| "cpu".to_string());

    let (python_executable, mut python_args) = resolve_python_launcher()?;
    python_args.extend([
        resource_path.to_string_lossy().to_string(),
        "--port".to_string(),
        port.to_string(),
        "--model".to_string(),
        model,
        "--device".to_string(),
        device,
    ]);

    let child = Command::new(&python_executable)
        .args(&python_args)
        .spawn()
        .map_err(|e| format!("Failed to spawn sidecar: {}", e))?;

    *child_lock = Some(child);
    
    Ok(format!("Sidecar started on port {}", port))
}

/// Stop the Python AI Sidecar process
#[tauri::command]
pub async fn stop_ai_sidecar(
    state: tauri::State<'_, crate::SidecarState>,
) -> Result<String, String> {
    let mut child_lock = state.child.lock().map_err(|e| e.to_string())?;
    
    if let Some(mut child) = child_lock.take() {
        child.kill().map_err(|e| e.to_string())?;
        return Ok("Sidecar stopped".to_string());
    }

    Ok("Sidecar was not running".to_string())
}

/// Transcribe audio using the Python AI Sidecar API
#[tauri::command]
pub async fn transcribe_sidecar(
    audio_path: String,
    port: u16,
) -> Result<serde_json::Value, String> {
    let client = reqwest::Client::new();
    let url = format!("http://127.0.0.1:{}/transcribe?audio_path={}", port, audio_path);

    let response = client.post(&url)
        .send()
        .await
        .map_err(|e| format!("Request to sidecar failed: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("Sidecar returned error: {}", response.status()));
    }

    let response_text = response
        .text()
        .await
        .map_err(|e| format!("Failed to read sidecar response: {}", e))?;

    let result = serde_json::from_str::<serde_json::Value>(&response_text)
        .map_err(|e| format!("Failed to parse sidecar response: {}", e))?;

    Ok(result)
}

fn resolve_python_launcher() -> Result<(String, Vec<String>), String> {
    let mut candidate_paths: Vec<(String, Vec<String>)> = Vec::new();

    if let Ok(local_app_data) = std::env::var("LOCALAPPDATA") {
        candidate_paths.push((
            format!(r"{}\Programs\Python\Python311\python.exe", local_app_data),
            vec![],
        ));
        candidate_paths.push((
            format!(r"{}\Programs\Python\Python312\python.exe", local_app_data),
            vec![],
        ));
        candidate_paths.push((
            format!(r"{}\Programs\Python\Python313\python.exe", local_app_data),
            vec![],
        ));
    }

    candidate_paths.push(("python".to_string(), vec![]));
    candidate_paths.push(("py".to_string(), vec!["-3.11".to_string()]));
    candidate_paths.push(("py".to_string(), vec!["-3".to_string()]));

    for (executable, args) in candidate_paths {
        if is_python_launcher_available(&executable, &args) {
            return Ok((executable, args));
        }
    }

    Err("Could not find a working Python runtime for faster-whisper sidecar".to_string())
}

fn is_python_launcher_available(executable: &str, args: &[String]) -> bool {
    let mut command = Command::new(executable);
    command.arg("--version");

    if !args.is_empty() {
        command = Command::new(executable);
        for arg in args {
            command.arg(arg);
        }
        command.arg("--version");
    }

    command
        .output()
        .map(|output| output.status.success())
        .unwrap_or(false)
}

