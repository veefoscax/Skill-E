use chrono::Utc;
use serde::Serialize;
use std::fs;
use std::path::PathBuf;
use std::process::Command;

#[derive(Serialize)]
pub struct CodexGenerationResult {
    pub content: String,
    pub model: String,
    pub working_dir: String,
}

fn codex_vendor_exe_candidates() -> Vec<PathBuf> {
    let mut candidates = Vec::new();

    if let Ok(explicit_path) = std::env::var("CODEX_EXE") {
        let explicit = PathBuf::from(explicit_path);
        if explicit.exists() {
            candidates.push(explicit);
        }
    }

    if let Ok(appdata) = std::env::var("APPDATA") {
        let npm_root = PathBuf::from(appdata).join("npm");
        let vendor_suffix = PathBuf::from(
            "node_modules/@openai/codex/node_modules/@openai/codex-win32-x64/vendor/x86_64-pc-windows-msvc/codex/codex.exe",
        );

        let direct_vendor = npm_root.join(&vendor_suffix);
        if direct_vendor.exists() {
            candidates.push(direct_vendor);
        }

        let openai_dir = npm_root.join("node_modules").join("@openai");
        if let Ok(entries) = fs::read_dir(openai_dir) {
            for entry in entries.flatten() {
                let name = entry.file_name();
                if !name.to_string_lossy().starts_with(".codex-") {
                    continue;
                }

                let candidate = entry.path().join(&vendor_suffix);
                if candidate.exists() {
                    candidates.push(candidate);
                }
            }
        }
    }

    candidates
}

fn codex_command() -> String {
    codex_vendor_exe_candidates()
        .into_iter()
        .next()
        .map(|path| path.display().to_string())
        .unwrap_or_else(|| "codex".to_string())
}

fn ensure_codex_login() -> Result<(), String> {
    let output = Command::new(codex_command())
        .args(["login", "status"])
        .output()
        .map_err(|error| format!("failed_to_run_codex_login_status: {error}"))?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    let stderr = String::from_utf8_lossy(&output.stderr);
    let transcript = format!("{}\n{}", stdout, stderr).trim().to_string();

    if output.status.success() && transcript.to_lowercase().contains("logged in using chatgpt") {
        return Ok(());
    }

    Err(format!(
        "codex_not_authenticated_via_chatgpt: {}",
        if transcript.is_empty() {
            "unknown_status"
        } else {
            transcript.as_str()
        }
    ))
}

fn build_temp_path(prefix: &str, extension: &str) -> Result<PathBuf, String> {
    let mut path = std::env::temp_dir();
    let timestamp = Utc::now().timestamp_millis();
    path.push(format!("{prefix}-{timestamp}.{extension}"));
    Ok(path)
}

#[tauri::command]
pub fn codex_generate_text(
    prompt: String,
    model: Option<String>,
    working_dir: Option<String>,
    output_schema_json: Option<String>,
) -> Result<CodexGenerationResult, String> {
    ensure_codex_login()?;

    let selected_model = model
        .map(|value| value.trim().to_string())
        .filter(|value| !value.is_empty())
        .unwrap_or_else(|| "gpt-5.4-mini".to_string());

    let resolved_working_dir = working_dir
        .map(PathBuf::from)
        .filter(|path| path.exists())
        .unwrap_or_else(|| std::env::current_dir().unwrap_or_else(|_| PathBuf::from(".")));

    let output_path = build_temp_path("skill-e-codex-output", "md")?;
    let schema_path = if let Some(schema_json) = output_schema_json {
        let path = build_temp_path("skill-e-codex-schema", "json")?;
        fs::write(&path, schema_json).map_err(|error| format!("failed_to_write_schema_file: {error}"))?;
        Some(path)
    } else {
        None
    };

    let mut command = Command::new(codex_command());
    command.current_dir(&resolved_working_dir);
    command.arg("exec");
    command.arg("--skip-git-repo-check");
    command.arg("--output-last-message");
    command.arg(&output_path);
    command.arg("-m");
    command.arg(&selected_model);
    command.arg("-c");
    command.arg("model_reasoning_effort=\"low\"");

    if let Some(schema_file) = &schema_path {
        command.arg("--output-schema");
        command.arg(schema_file);
    }

    command.arg(prompt);

    let output = command
        .output()
        .map_err(|error| format!("failed_to_run_codex_exec: {error}"))?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    let stderr = String::from_utf8_lossy(&output.stderr);

    if !output.status.success() {
        let _ = fs::remove_file(&output_path);
        if let Some(schema_file) = &schema_path {
            let _ = fs::remove_file(schema_file);
        }
        return Err(format!(
            "codex_exec_failed: status={:?}; stdout={}; stderr={}",
            output.status.code(),
            stdout.trim(),
            stderr.trim()
        ));
    }

    let content = fs::read_to_string(&output_path)
        .map_err(|error| format!("failed_to_read_codex_output: {error}"))?;

    let _ = fs::remove_file(&output_path);
    if let Some(schema_file) = &schema_path {
        let _ = fs::remove_file(schema_file);
    }

    if content.trim().is_empty() {
        return Err(format!(
            "codex_exec_returned_empty_output: stdout={}; stderr={}",
            stdout.trim(),
            stderr.trim()
        ));
    }

    Ok(CodexGenerationResult {
        content,
        model: selected_model,
        working_dir: resolved_working_dir.display().to_string(),
    })
}
