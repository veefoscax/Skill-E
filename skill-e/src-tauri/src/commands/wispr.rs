use serde_json::Value;
use std::path::PathBuf;
use std::process::Command;
use tauri::Manager;

use super::whisper::{LocalTranscriptionResult, TranscriptionSegment};

#[tauri::command]
pub async fn transcribe_wispr_bridge(
    audio_path: String,
    app_handle: tauri::AppHandle,
) -> Result<LocalTranscriptionResult, String> {
    let bridge_path = locate_bridge_script(&app_handle)?;
    let (node_executable, node_args) = resolve_node_launcher()?;

    let mut command = Command::new(&node_executable);
    for arg in node_args {
        command.arg(arg);
    }

    command
        .arg(&bridge_path)
        .arg("inject")
        .arg(&audio_path);

    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x08000000;
        command.creation_flags(CREATE_NO_WINDOW);
    }

    let output = command
        .output()
        .map_err(|error| format!("Failed to run Wispr bridge: {}", error))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
        let stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();
        let details = if !stderr.is_empty() { stderr } else { stdout };
        return Err(format!("Wispr bridge failed: {}", details));
    }

    let stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();
    let payload: Value = serde_json::from_str(&stdout)
        .map_err(|error| format!("Failed to parse Wispr bridge output: {}", error))?;

    let text = extract_text(&payload);
    if text.trim().is_empty() {
        return Err("Wispr bridge completed without transcript text".to_string());
    }

    let duration = extract_duration(&payload);

    Ok(LocalTranscriptionResult {
        text: text.clone(),
        segments: vec![TranscriptionSegment {
            id: 0,
            start: 0.0,
            end: duration,
            text,
        }],
        language: "unknown".to_string(),
        duration,
    })
}

fn extract_text(payload: &Value) -> String {
    payload
        .get("formattedText")
        .and_then(|value| value.as_str())
        .filter(|value| !value.trim().is_empty())
        .or_else(|| {
            payload
                .get("asrText")
                .and_then(|value| value.as_str())
                .filter(|value| !value.trim().is_empty())
        })
        .unwrap_or_default()
        .trim()
        .to_string()
}

fn extract_duration(payload: &Value) -> f64 {
    payload
        .get("duration")
        .and_then(|value| value.as_f64())
        .or_else(|| {
            payload
                .get("bridge")
                .and_then(|bridge| bridge.get("current"))
                .and_then(|current| current.get("durationMs"))
                .and_then(|value| value.as_f64())
                .map(|duration_ms| duration_ms / 1000.0)
        })
        .unwrap_or(0.0)
}

fn locate_bridge_script(app_handle: &tauri::AppHandle) -> Result<PathBuf, String> {
    let resource_dir = app_handle
        .path()
        .resource_dir()
        .map_err(|error| error.to_string())?;

    let current_exe_dir = std::env::current_exe()
        .ok()
        .and_then(|path| path.parent().map(|dir| dir.to_path_buf()));
    let current_dir = std::env::current_dir().ok();

    let mut candidate_paths = vec![
        resource_dir.join("sidecar").join("wispr-bridge.mjs"),
        resource_dir.join("wispr-bridge.mjs"),
    ];

    if let Some(dir) = current_exe_dir {
        candidate_paths.push(dir.join("sidecar").join("wispr-bridge.mjs"));
    }

    if let Some(dir) = current_dir {
        candidate_paths.push(dir.join("..").join("sidecar").join("wispr-bridge.mjs"));
        candidate_paths.push(dir.join("..").join("..").join("sidecar").join("wispr-bridge.mjs"));
        candidate_paths.push(dir.join("sidecar").join("wispr-bridge.mjs"));
    }

    candidate_paths
        .into_iter()
        .find(|path| path.exists())
        .ok_or_else(|| "Could not locate sidecar/wispr-bridge.mjs in bundle resources or nearby paths".to_string())
}

fn resolve_node_launcher() -> Result<(String, Vec<String>), String> {
    let mut candidate_paths: Vec<(String, Vec<String>)> = Vec::new();

    if let Ok(program_files) = std::env::var("ProgramFiles") {
        candidate_paths.push((format!(r"{}\nodejs\node.exe", program_files), vec![]));
    }

    if let Ok(program_files_x86) = std::env::var("ProgramFiles(x86)") {
        candidate_paths.push((format!(r"{}\nodejs\node.exe", program_files_x86), vec![]));
    }

    if let Ok(local_app_data) = std::env::var("LOCALAPPDATA") {
        candidate_paths.push((format!(r"{}\Programs\nodejs\node.exe", local_app_data), vec![]));
    }

    candidate_paths.push(("node".to_string(), vec![]));

    for (executable, args) in candidate_paths {
        if is_node_launcher_available(&executable, &args) {
            return Ok((executable, args));
        }
    }

    Err("Could not find a working Node.js runtime for Wispr bridge".to_string())
}

fn is_node_launcher_available(executable: &str, args: &[String]) -> bool {
    let mut command = Command::new(executable);
    for arg in args {
        command.arg(arg);
    }
    command.arg("--version");

    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x08000000;
        command.creation_flags(CREATE_NO_WINDOW);
    }

    command
        .output()
        .map(|output| output.status.success())
        .unwrap_or(false)
}
