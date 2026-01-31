use tauri::Manager;
use tauri::PhysicalPosition;
use tray_icon::{TrayIconBuilder, menu::{Menu, MenuItem}};

// Commands module
mod commands;
mod input_listener;
use commands::capture::{
    capture_screen, 
    get_active_window, 
    get_cursor_position,
    create_session_directory,
    save_session_manifest,
    load_session_manifest,
    cleanup_session,
    list_sessions,
    save_audio_file,
};
use commands::whisper::{
    check_model_exists,
    get_model_info,
    get_available_models,
    transcribe_local,
    get_model_download_url,
    get_models_directory,
    check_compute_capability,
    download_model,
    ensure_model,
};
use commands::overlay::{
    create_overlay_window,
    show_overlay,
    hide_overlay,
    toggle_overlay,
    update_overlay_bounds,
};
use commands::export::{
    save_skill,
    validate_export_path,
    save_skill_md,
};

// Recording state for get_recording_data
use std::sync::Mutex;
use std::collections::HashMap;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

/// Get the current window position
#[tauri::command]
fn get_window_position(window: tauri::Window) -> Result<(i32, i32), String> {
    window
        .outer_position()
        .map(|pos| (pos.x, pos.y))
        .map_err(|e| e.to_string())
}

/// Set the window position
#[tauri::command]
fn set_window_position(window: tauri::Window, x: i32, y: i32) -> Result<(), String> {
    window
        .set_position(PhysicalPosition::new(x, y))
        .map_err(|e| e.to_string())
}

/// Get the primary monitor size to validate window position
#[tauri::command]
fn get_monitor_size(window: tauri::Window) -> Result<(u32, u32), String> {
    window
        .current_monitor()
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "No monitor found".to_string())
        .map(|monitor| {
            let size = monitor.size();
            (size.width, size.height)
        })
}

/// Show the main window
#[tauri::command]
fn show_window(window: tauri::Window) -> Result<(), String> {
    window.show().map_err(|e| e.to_string())?;
    window.set_focus().map_err(|e| e.to_string())
}

/// Hide the main window
#[tauri::command]
fn hide_window(window: tauri::Window) -> Result<(), String> {
    window.hide().map_err(|e| e.to_string())
}

/// Toggle window visibility
#[tauri::command]
fn toggle_window(window: tauri::Window) -> Result<(), String> {
    if window.is_visible().map_err(|e| e.to_string())? {
        window.hide().map_err(|e| e.to_string())
    } else {
        window.show().map_err(|e| e.to_string())?;
        window.set_focus().map_err(|e| e.to_string())
    }
}

/// Toggle recording state (called by hotkey)
#[tauri::command]
fn toggle_recording() -> Result<(), String> {
    // This will be handled by the frontend store
    // We just emit an event that the frontend can listen to
    Ok(())
}

/// Toggle annotation mode (called by hotkey)
#[tauri::command]
fn toggle_annotation() -> Result<(), String> {
    // This will be handled by the frontend store
    // We just emit an event that the frontend can listen to
    Ok(())
}

/// Cancel recording (called by hotkey)
#[tauri::command]
fn cancel_recording() -> Result<(), String> {
    // This will be handled by the frontend store
    // We just emit an event that the frontend can listen to
    Ok(())
}

/// Open a folder in the system file manager
#[tauri::command]
fn open_folder(path: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("explorer")
            .arg(&path)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(&path)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(&path)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// Open DevTools for debugging (only works in debug builds or with devtools feature)
#[tauri::command]
fn open_devtools(window: tauri::Window) -> Result<(), String> {
    #[cfg(debug_assertions)]
    {
        window.open_devtools();
    }
    // In release builds, this is a no-op unless the app is built with the devtools feature
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
/// Recording state storage
static RECORDING_STATE: Mutex<Option<RecordingState>> = Mutex::new(None);

#[derive(Default, Clone, serde::Serialize)]
struct RecordingState {
    frames: Vec<FrameData>,
    audio_path: Option<String>,
}

#[derive(Clone, serde::Serialize)]
struct FrameData {
    timestamp: u64,
    path: String,
    cursor_x: Option<i32>,
    cursor_y: Option<i32>,
}

/// Get recording data for processing
#[tauri::command]
fn get_recording_data() -> Result<RecordingState, String> {
    let state = RECORDING_STATE.lock().map_err(|e| e.to_string())?;
    Ok(state.clone().unwrap_or_default())
}

/// Initialize recording (clear previous state)
#[tauri::command]
fn initialize_recording() -> Result<(), String> {
    let mut state = RECORDING_STATE.lock().map_err(|e| e.to_string())?;
    *state = Some(RecordingState::default());
    println!("Recording state initialized");
    Ok(())
}

/// Add a frame to recording state
#[tauri::command]
fn add_recording_frame(
    timestamp: u64, 
    path: String,
    cursor_x: Option<i32>,
    cursor_y: Option<i32>
) -> Result<(), String> {
    let mut state = RECORDING_STATE.lock().map_err(|e| e.to_string())?;
    if let Some(ref mut rec) = *state {
        rec.frames.push(FrameData { timestamp, path, cursor_x, cursor_y });
    }
    Ok(())
}

/// Set audio path in recording state
#[tauri::command]
fn set_recording_audio(path: String) -> Result<(), String> {
    let mut state = RECORDING_STATE.lock().map_err(|e| e.to_string())?;
    if let Some(ref mut rec) = *state {
        rec.audio_path = Some(path);
    }
    Ok(())
}

pub fn run() {
    tauri::Builder::default()
        .manage(Mutex::new(HashMap::<String, String>::new()))
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_screenshots::init())
        .plugin(tauri_plugin_http::init()) // ADDED
        .plugin(tauri_plugin_fs::init())   // ADDED
        .invoke_handler(tauri::generate_handler![
            greet,
            get_window_position,
            set_window_position,
            get_monitor_size,
            show_window,
            hide_window,
            toggle_window,
            toggle_recording,
            toggle_annotation,
            cancel_recording,
            capture_screen,
            get_active_window,
            get_cursor_position,
            // S09 Recording Control
            commands::capture::start_capture,
            commands::capture::stop_capture,
            create_session_directory,
            save_session_manifest,
            load_session_manifest,
            cleanup_session,
            list_sessions,
            save_audio_file,
            // Whisper local transcription commands
            check_model_exists,
            get_model_info,
            get_available_models,
            transcribe_local,
            get_model_download_url,
            get_models_directory,
            check_compute_capability,
            download_model,
            ensure_model,
            // Overlay window commands
            create_overlay_window,
            show_overlay,
            hide_overlay,
            toggle_overlay,
            update_overlay_bounds,
            // Export commands
            save_skill,
            validate_export_path,
            save_skill_md,
            // Recording data
            get_recording_data,
            initialize_recording,
            add_recording_frame,
            set_recording_audio,
            create_settings_window,
            open_folder,
            open_devtools,
        ])
        .setup(|app| {
            // Note: For Tauri v2, window effects (Mica/Vibrancy) are configured in tauri.conf.json
            // The transparent window with backdrop-blur CSS provides the glass effect

            // setup_tray(app)?;
            setup_tray(app)?;
            
            // Start Global Input Listener (S09)
            input_listener::start_input_listener(app.handle().clone());

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
fn create_settings_window(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("settings") {
        window.show().map_err(|e| e.to_string())?;
        window.set_focus().map_err(|e| e.to_string())?;
    } else {
        // Window usually exists but is hidden/created by tauri.conf.json
        // If not, we might need to recreate it, but strictly speaking tauri v2 usually keeps them
        return Err("Settings window not found".to_string());
    }
    Ok(())
}

fn setup_tray(app: &mut tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    use tray_icon::menu::MenuEvent;
    use tray_icon::Icon;

    println!("Setting up system tray...");

    // Load theme-aware tray icon
    // For Windows: Use light icon (white) for dark mode, dark icon (black) for light mode
    // TODO: Detect system theme and switch icons dynamically
    // For now, we'll use the light icon (works better on dark taskbars which are more common)
    let icon_bytes = include_bytes!("../icons/icon.ico");
    
    let icon_image = image::load_from_memory(icon_bytes)?;
    let rgba = icon_image.to_rgba8().into_raw();
    let width = icon_image.width();
    let height = icon_image.height();
    let icon = Icon::from_rgba(rgba, width, height)?;

    println!("Tray icon loaded: {}x{} (theme-aware version coming soon)", width, height);

    // Create menu items with unique IDs
    let show_hide = MenuItem::with_id("show_hide", "Show/Hide", true, None);
    let quit = MenuItem::with_id("quit", "Quit", true, None);

    // Build menu
    let menu = Menu::new();
    menu.append(&show_hide)?;
    menu.append(&quit)?;

    // Build tray icon - use Box::leak to keep it alive forever
    let tray = TrayIconBuilder::new()
        .with_menu(Box::new(menu))
        .with_tooltip("Skill-E")
        .with_icon(icon)
        .build()?;
    
    // Leak the tray icon so it stays alive for the lifetime of the app
    Box::leak(Box::new(tray));

    println!("System tray created successfully!");

    // Handle menu events
    let app_handle = app.handle().clone();
    MenuEvent::set_event_handler(Some(move |event: MenuEvent| {
        println!("Tray menu event: {:?}", event.id);
        if let Some(window) = app_handle.get_webview_window("main") {
            match event.id.0.as_str() {
                "show_hide" => {
                    let _ = if window.is_visible().unwrap_or(false) {
                        println!("Hiding window");
                        window.hide()
                    } else {
                        println!("Showing window");
                        window.show().and_then(|_| window.set_focus())
                    };
                }
                "quit" => {
                    println!("Quitting app");
                    app_handle.exit(0);
                }
                _ => {}
            }
        }
    }));

    // Handle tray icon click (left-click to toggle window)
    let app_handle2 = app.handle().clone();
    tray_icon::TrayIconEvent::set_event_handler(Some(move |event: tray_icon::TrayIconEvent| {
        if let tray_icon::TrayIconEvent::Click { 
            button: tray_icon::MouseButton::Left, 
            .. 
        } = event {
            println!("Tray icon clicked");
            if let Some(window) = app_handle2.get_webview_window("main") {
                let _ = if window.is_visible().unwrap_or(false) {
                    println!("Hiding window");
                    window.hide()
                } else {
                    println!("Showing window");
                    window.show().and_then(|_| window.set_focus())
                };
            }
        }
    }));

    Ok(())
}
