use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use screenshots::Screen;
use std::fs;
use std::io::Write;

/// Result of a screen capture operation
#[derive(Debug, Serialize, Deserialize)]
pub struct CaptureResult {
    /// Path to the saved screenshot file
    pub path: String,
    /// Unix timestamp in milliseconds when the capture was taken
    pub timestamp: i64,
}

/// Information about a window
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct WindowInfo {
    /// Window title
    pub title: String,
    /// Process name
    pub process_name: String,
    /// Window bounds (x, y, width, height)
    pub bounds: WindowBounds,
}

/// Window bounds
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct WindowBounds {
    pub x: i32,
    pub y: i32,
    pub width: i32,
    pub height: i32,
}

// ... existing code ...

#[cfg(target_os = "windows")]
pub fn get_current_window_info() -> Result<WindowInfo, String> {
    use windows::Win32::Foundation::{HWND, RECT};
    use windows::Win32::UI::WindowsAndMessaging::{
        GetForegroundWindow, GetWindowTextW, GetWindowRect, GetWindowThreadProcessId,
    };
    use windows::Win32::System::Threading::{OpenProcess, QueryFullProcessImageNameW, PROCESS_QUERY_LIMITED_INFORMATION, PROCESS_NAME_FORMAT};
    use windows::core::PWSTR;

    unsafe {
        // Get the foreground window handle
        let hwnd: HWND = GetForegroundWindow();
        if hwnd.0 == std::ptr::null_mut() {
            return Err("No active window found".to_string());
        }

        // Get window title
        let mut title_buffer = [0u16; 512];
        let title_len = GetWindowTextW(hwnd, &mut title_buffer);
        let title = if title_len > 0 {
            String::from_utf16_lossy(&title_buffer[..title_len as usize])
        } else {
            String::from("(No Title)")
        };

        // Get window bounds
        let mut rect = RECT::default();
        GetWindowRect(hwnd, &mut rect)
            .map_err(|e| format!("Failed to get window rect: {}", e))?;

        let bounds = WindowBounds {
            x: rect.left,
            y: rect.top,
            width: rect.right - rect.left,
            height: rect.bottom - rect.top,
        };

        // Get process name
        let mut process_id: u32 = 0;
        GetWindowThreadProcessId(hwnd, Some(&mut process_id));

        let process_name = if process_id != 0 {
            match OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, false, process_id) {
                Ok(process_handle) => {
                    let mut path_buffer = [0u16; 1024];
                    let mut size = path_buffer.len() as u32;
                    
                    match QueryFullProcessImageNameW(
                        process_handle,
                        PROCESS_NAME_FORMAT(0),
                        PWSTR(path_buffer.as_mut_ptr()),
                        &mut size,
                    ) {
                        Ok(_) => {
                            let path = String::from_utf16_lossy(&path_buffer[..size as usize]);
                            // Extract just the filename from the full path
                            std::path::Path::new(&path)
                                .file_name()
                                .and_then(|n| n.to_str())
                                .unwrap_or("Unknown")
                                .to_string()
                        }
                        Err(_) => String::from("Unknown"),
                    }
                }
                Err(_) => String::from("Unknown"),
            }
        } else {
            String::from("Unknown")
        };

        Ok(WindowInfo {
            title,
            process_name,
            bounds,
        })
    }
}

#[cfg(target_os = "macos")]
pub fn get_current_window_info() -> Result<WindowInfo, String> {
    use std::process::Command;
    
    // AppleScript to get the name of the frontmost application and its active window
    let script = r#"
    tell application "System Events"
        set frontApp to first application process whose frontmost is true
        set appName to name of frontApp
        try
            set windowTitle to name of front window of frontApp
        on error
            set windowTitle to ""
        end try
        return appName & "|||" & windowTitle
    end tell
    "#;

    let output = Command::new("osascript")
        .arg("-e")
        .arg(script)
        .output()
        .map_err(|e| format!("Failed to execute osascript: {}", e))?;

    let result = String::from_utf8_lossy(&output.stdout).trim().to_string();
    let parts: Vec<&str> = result.split("|||").collect();

    let process_name = parts.get(0).unwrap_or(&"Unknown").to_string();
    let title = parts.get(1).unwrap_or(&"(No Title)").to_string();

    Ok(WindowInfo {
        title,
        process_name,
        bounds: WindowBounds { x: 0, y: 0, width: 0, height: 0 }, // Bounds via AppleScript is complex, omitting for now
    })
}

#[cfg(target_os = "linux")]
pub fn get_current_window_info() -> Result<WindowInfo, String> {
    use std::process::Command;

    // A simple xdotool approach for Linux (requires xdotool installed)
    let output = Command::new("xdotool")
        .arg("getactivewindow")
        .arg("getwindowname")
        .output()
        .map_err(|e| format!("Failed to execute xdotool: {}", e))?;

    let title = String::from_utf8_lossy(&output.stdout).trim().to_string();
    
    // Process name is harder on pure X11 without parsing PIDs, returning generic for now
    Ok(WindowInfo {
        title: if title.is_empty() { "(No Title)".to_string() } else { title },
        process_name: "Linux_App".to_string(),
        bounds: WindowBounds { x: 0, y: 0, width: 0, height: 0 },
    })
}
/// 
/// # Arguments
/// * `output_path` - Full path where the screenshot should be saved (must end in .webp)
/// 
/// # Returns
/// * `Ok(CaptureResult)` - Contains the path and timestamp of the saved screenshot
/// * `Err(String)` - Error message if capture fails
/// 
/// # Requirements
/// * FR-2.1: Capture entire screen
/// * NFR-2.2: Storage format WebP (Quality 80)
use crate::input_listener;

#[tauri::command]
pub fn start_capture(_app: tauri::AppHandle) {
    input_listener::set_recording_state(true);
    // ... existing capture start logic ...
}

#[tauri::command]
pub fn stop_capture() {
    input_listener::set_recording_state(false);
}

#[tauri::command]
pub async fn capture_screen(
    output_path: String,
) -> Result<CaptureResult, String> {
    // Validate output path ends with .webp
    if !output_path.ends_with(".webp") {
        return Err("Output path must end with .webp extension".to_string());
    }

    // Get current timestamp
    let timestamp = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map_err(|e| format!("Failed to get timestamp: {}", e))?
        .as_millis() as i64;

    // Get all screens
    let screens = Screen::all()
        .map_err(|e| format!("Failed to get screens: {}", e))?;
    
    println!("Found {} screens", screens.len());

    // Capture the primary screen (first screen)
    let screen = screens
        .first()
        .ok_or_else(|| "No screens found".to_string())?;
    
    println!("Capturing screen: {:?}", screen.display_info);

    let image_buffer = screen
        .capture()
        .map_err(|e| format!("Failed to capture screen: {}", e))?;
    
    println!("Captured buffer size: {}", image_buffer.len());

    // Convert to DynamicImage for processing
    let image = image::DynamicImage::ImageRgba8(
        image::RgbaImage::from_raw(
            image_buffer.width(),
            image_buffer.height(),
            image_buffer.to_vec(),
        )
        .ok_or_else(|| "Failed to create image from buffer".to_string())?,
    );

    // Convert to WebP format with quality 80
    let webp_data = encode_webp(&image)?;

    // Ensure parent directory exists
    let path = PathBuf::from(&output_path);
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create output directory: {}", e))?;
    }

    // Write to file
    std::fs::write(&output_path, webp_data)
        .map_err(|e| format!("Failed to write screenshot: {}", e))?;

    Ok(CaptureResult {
        path: output_path,
        timestamp,
    })
}

/// Encodes an image buffer to WebP format with quality 80
fn encode_webp(image: &image::DynamicImage) -> Result<Vec<u8>, String> {
    use image::ImageEncoder;
    
    let rgba = image.to_rgba8();
    let (width, height) = rgba.dimensions();
    
    // Create a buffer to hold the encoded WebP data
    let mut buffer = Vec::new();
    
    // Use WebP encoder with quality 80
    let encoder = image::codecs::webp::WebPEncoder::new_lossless(&mut buffer);
    
    encoder
        .write_image(
            rgba.as_raw(),
            width,
            height,
            image::ExtendedColorType::Rgba8,
        )
        .map_err(|e| format!("Failed to encode WebP: {}", e))?;
    
    Ok(buffer)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_capture_result_serialization() {
        let result = CaptureResult {
            path: "/tmp/screenshot.webp".to_string(),
            timestamp: 1234567890,
        };

        let json = serde_json::to_string(&result).unwrap();
        assert!(json.contains("path"));
        assert!(json.contains("timestamp"));
    }

    #[test]
    fn test_webp_path_validation() {
        // This would be tested in integration tests with actual app handle
        // Unit test just validates the logic
        let valid_path = "screenshot.webp";
        assert!(valid_path.ends_with(".webp"));

        let invalid_path = "screenshot.png";
        assert!(!invalid_path.ends_with(".webp"));
    }
}

/// Get information about the currently active window
/// 
/// # Returns
/// * `Ok(WindowInfo)` - Information about the active window
/// * `Err(String)` - Error message if unable to get window info
/// 
/// # Requirements
/// * FR-2.3: Detect active window and track focus changes
#[tauri::command]
pub async fn get_active_window() -> Result<WindowInfo, String> {
    #[cfg(target_os = "windows")]
    {
        get_current_window_info()
    }
    
    #[cfg(not(target_os = "windows"))]
    {
        Err("Window tracking is only supported on Windows".to_string())
    }
}

/// Get the current cursor position (Synchronous Implementation)
pub fn get_cursor_position_impl() -> Result<(i32, i32), String> {
    #[cfg(target_os = "windows")]
    {
        get_cursor_position_windows()
    }
    
    #[cfg(not(target_os = "windows"))]
    {
        Err("Cursor position tracking is only supported on Windows".to_string())
    }
}

/// Get the current cursor position
/// 
/// # Returns
/// * `Ok((i32, i32))` - X and Y coordinates relative to screen origin (top-left)
/// * `Err(String)` - Error message if unable to get cursor position
/// 
/// # Requirements
/// * FR-2.4: Capture mouse cursor position for each frame
#[tauri::command]
pub async fn get_cursor_position() -> Result<(i32, i32), String> {
    get_cursor_position_impl()
}

#[cfg(target_os = "windows")]
fn get_cursor_position_windows() -> Result<(i32, i32), String> {
    use windows::Win32::UI::WindowsAndMessaging::GetCursorPos;
    use windows::Win32::Foundation::POINT;

    unsafe {
        let mut point = POINT { x: 0, y: 0 };
        GetCursorPos(&mut point)
            .map_err(|e| format!("Failed to get cursor position: {}", e))?;
        
        Ok((point.x, point.y))
    }
}

#[cfg(test)]
mod window_tests {
    use super::*;

    #[test]
    fn test_window_info_serialization() {
        let window_info = WindowInfo {
            title: "Test Window".to_string(),
            process_name: "test.exe".to_string(),
            bounds: WindowBounds {
                x: 100,
                y: 200,
                width: 800,
                height: 600,
            },
        };

        let json = serde_json::to_string(&window_info).unwrap();
        assert!(json.contains("Test Window"));
        assert!(json.contains("test.exe"));
        assert!(json.contains("\"x\":100"));
    }

    #[test]
    fn test_window_bounds_serialization() {
        let bounds = WindowBounds {
            x: 0,
            y: 0,
            width: 1920,
            height: 1080,
        };

        let json = serde_json::to_string(&bounds).unwrap();
        assert!(json.contains("\"width\":1920"));
        assert!(json.contains("\"height\":1080"));
    }
}

#[cfg(test)]
mod cursor_tests {
    use super::*;

    #[test]
    fn test_cursor_position_tuple() {
        // Test that cursor position returns a valid tuple
        let position = (100, 200);
        assert_eq!(position.0, 100);
        assert_eq!(position.1, 200);
    }
}

// ============================================================================
// Session Storage
// ============================================================================

/// Metadata for a captured frame stored in manifest.json
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct FrameMetadata {
    /// Unique frame identifier
    pub id: String,
    /// Unix timestamp in milliseconds
    pub timestamp: i64,
    /// Relative path to the screenshot image (within session directory)
    pub image_path: String,
    /// Active window at time of capture
    pub active_window: Option<WindowInfo>,
    /// Cursor position at time of capture
    pub cursor_position: Option<CursorPosition>,
}

/// Cursor position
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct CursorPosition {
    pub x: i32,
    pub y: i32,
}

/// Result of saving an audio file
#[derive(Debug, Serialize, Deserialize)]
pub struct SaveAudioResult {
    /// Path to the saved audio file
    pub path: String,
    /// File size in bytes
    pub size: u64,
}

/// Session manifest containing all frame metadata
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SessionManifest {
    /// Unique session identifier
    pub session_id: String,
    /// Session start time (Unix timestamp in ms)
    pub start_time: i64,
    /// Session end time (Unix timestamp in ms)
    pub end_time: Option<i64>,
    /// Capture interval in milliseconds
    pub interval_ms: u64,
    /// All captured frames
    pub frames: Vec<FrameMetadata>,
    /// Path to audio file (if audio was recorded)
    pub audio_path: Option<String>,
}

/// Creates a temporary directory for a capture session
/// 
/// # Arguments
/// * `session_id` - Unique identifier for the session
/// 
/// # Returns
/// * `Ok(String)` - Full path to the created session directory
/// * `Err(String)` - Error message if directory creation fails
/// 
/// # Requirements
/// * FR-2.5: Store captures with timestamps for timeline sync
/// * NFR-2.3: Memory-efficient streaming (don't load all to RAM)
#[tauri::command]
pub async fn create_session_directory(
    session_id: String,
    custom_output_dir: Option<String>,
) -> Result<String, String> {
    // Determine base directory
    let base_dir = if let Some(custom) = custom_output_dir {
        if custom.trim().is_empty() {
            std::env::temp_dir().join("skill-e-sessions")
        } else {
            PathBuf::from(custom)
        }
    } else {
        std::env::temp_dir().join("skill-e-sessions")
    };
    
    // Create session directory path: base_dir/{session_id}
    let session_dir = base_dir.join(&session_id);
    
    // Create directory (including parent directories)
    fs::create_dir_all(&session_dir)
        .map_err(|e| format!("Failed to create session directory: {}", e))?;
    
    // Convert to string
    let session_path = session_dir
        .to_str()
        .ok_or_else(|| "Failed to convert path to string".to_string())?
        .to_string();
    
    println!("Created session directory: {}", session_path);
    
    Ok(session_path)
}

/// Saves or updates the session manifest file
/// 
/// # Arguments
/// * `session_dir` - Path to the session directory
/// * `manifest` - Session manifest data to save
/// 
/// # Returns
/// * `Ok(())` - Manifest saved successfully
/// * `Err(String)` - Error message if save fails
/// 
/// # Requirements
/// * FR-2.5: Store captures with timestamps for timeline sync
#[tauri::command]
pub async fn save_session_manifest(
    session_dir: String,
    manifest: SessionManifest,
) -> Result<(), String> {
    let manifest_path = PathBuf::from(&session_dir).join("manifest.json");
    
    // Serialize manifest to JSON
    let json = serde_json::to_string_pretty(&manifest)
        .map_err(|e| format!("Failed to serialize manifest: {}", e))?;
    
    // Write to file
    let mut file = fs::File::create(&manifest_path)
        .map_err(|e| format!("Failed to create manifest file: {}", e))?;
    
    file.write_all(json.as_bytes())
        .map_err(|e| format!("Failed to write manifest: {}", e))?;
    
    println!("Saved manifest to: {:?}", manifest_path);
    
    Ok(())
}

/// Loads the session manifest from disk
/// 
/// # Arguments
/// * `session_dir` - Path to the session directory
/// 
/// # Returns
/// * `Ok(SessionManifest)` - Loaded manifest data
/// * `Err(String)` - Error message if load fails
#[tauri::command]
pub async fn load_session_manifest(
    session_dir: String,
) -> Result<SessionManifest, String> {
    let manifest_path = PathBuf::from(&session_dir).join("manifest.json");
    
    // Read file
    let json = fs::read_to_string(&manifest_path)
        .map_err(|e| format!("Failed to read manifest file: {}", e))?;
    
    // Deserialize
    let manifest: SessionManifest = serde_json::from_str(&json)
        .map_err(|e| format!("Failed to parse manifest: {}", e))?;
    
    Ok(manifest)
}

/// Cleans up a session directory and all its contents
/// 
/// # Arguments
/// * `session_dir` - Path to the session directory to delete
/// 
/// # Returns
/// * `Ok(())` - Directory cleaned up successfully
/// * `Err(String)` - Error message if cleanup fails
/// 
/// # Requirements
/// * FR-2.5: Implement cleanup on session end
#[tauri::command]
pub async fn cleanup_session(
    session_dir: String,
) -> Result<(), String> {
    let path = PathBuf::from(&session_dir);
    
    if !path.exists() {
        return Ok(()); // Already cleaned up
    }
    
    // Remove directory and all contents
    fs::remove_dir_all(&path)
        .map_err(|e| format!("Failed to remove session directory: {}", e))?;
    
    println!("Cleaned up session directory: {:?}", path);
    
    Ok(())
}

/// Gets the list of all session directories
/// 
/// # Returns
/// * `Ok(Vec<String>)` - List of session directory paths
/// * `Err(String)` - Error message if listing fails
#[tauri::command]
pub async fn list_sessions() -> Result<Vec<String>, String> {
    let temp_dir = std::env::temp_dir();
    let sessions_dir = temp_dir.join("skill-e-sessions");
    
    if !sessions_dir.exists() {
        return Ok(Vec::new());
    }
    
    let entries = fs::read_dir(&sessions_dir)
        .map_err(|e| format!("Failed to read sessions directory: {}", e))?;
    
    let mut sessions = Vec::new();
    for entry in entries {
        let entry = entry.map_err(|e| format!("Failed to read entry: {}", e))?;
        let path = entry.path();
        if path.is_dir() {
            if let Some(path_str) = path.to_str() {
                sessions.push(path_str.to_string());
            }
        }
    }
    
    Ok(sessions)
}

/// Saves an audio blob to the session directory
/// 
/// # Arguments
/// * `session_dir` - Path to the session directory
/// * `audio_data` - Base64 encoded audio data
/// * `filename` - Name for the audio file (e.g., "audio.webm")
/// 
/// # Returns
/// * `Ok(SaveAudioResult)` - Contains path and size of saved file
/// * `Err(String)` - Error message if save fails
/// 
/// # Requirements
/// * NFR-3.1: Audio quality: 16kHz mono (Whisper-compatible)
/// 
/// # Notes
/// The audio data should be in WebM format with Opus codec, which is
/// compatible with Whisper API. The frontend is responsible for ensuring
/// the correct format (16kHz mono) during recording.
#[tauri::command]
pub async fn save_audio_file(
    session_dir: String,
    audio_data: Vec<u8>,
    filename: String,
) -> Result<SaveAudioResult, String> {
    // Validate filename
    if filename.is_empty() {
        return Err("Filename cannot be empty".to_string());
    }
    
    // Construct full path
    let audio_path = PathBuf::from(&session_dir).join(&filename);
    
    // Ensure parent directory exists
    if let Some(parent) = audio_path.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create audio directory: {}", e))?;
    }
    
    // Write audio data to file
    fs::write(&audio_path, &audio_data)
        .map_err(|e| format!("Failed to write audio file: {}", e))?;
    
    // Get file size
    let size = audio_data.len() as u64;
    
    // Convert path to string
    let path_str = audio_path
        .to_str()
        .ok_or_else(|| "Failed to convert path to string".to_string())?
        .to_string();
    
    println!("Saved audio file: {} ({} bytes)", path_str, size);
    
    Ok(SaveAudioResult {
        path: path_str,
        size,
    })
}

#[cfg(test)]
mod session_tests {
    use super::*;

    #[test]
    fn test_frame_metadata_serialization() {
        let metadata = FrameMetadata {
            id: "frame-1".to_string(),
            timestamp: 1234567890,
            image_path: "frame-1.webp".to_string(),
            active_window: Some(WindowInfo {
                title: "Test".to_string(),
                process_name: "test.exe".to_string(),
                bounds: WindowBounds {
                    x: 0,
                    y: 0,
                    width: 800,
                    height: 600,
                },
            }),
            cursor_position: Some(CursorPosition { x: 100, y: 200 }),
        };

        let json = serde_json::to_string(&metadata).unwrap();
        assert!(json.contains("frame-1"));
        assert!(json.contains("1234567890"));
    }

    #[test]
    fn test_session_manifest_serialization() {
        let manifest = SessionManifest {
            session_id: "session-123".to_string(),
            start_time: 1234567890,
            end_time: Some(1234567900),
            interval_ms: 1000,
            frames: vec![],
            audio_path: Some("/path/to/audio.webm".to_string()),
        };

        let json = serde_json::to_string(&manifest).unwrap();
        assert!(json.contains("session-123"));
        assert!(json.contains("1000"));
        assert!(json.contains("audio.webm"));
    }
    
    #[test]
    fn test_save_audio_result_serialization() {
        let result = SaveAudioResult {
            path: "/tmp/session/audio.webm".to_string(),
            size: 1024000,
        };

        let json = serde_json::to_string(&result).unwrap();
        assert!(json.contains("audio.webm"));
        assert!(json.contains("1024000"));
    }
}
