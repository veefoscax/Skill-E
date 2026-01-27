use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindowBuilder};
use tauri::window::{WindowLevel};

/// Create the overlay window
/// 
/// The overlay window is:
/// - Transparent background
/// - Fullscreen
/// - Always on top
/// - Click-through (except for interactive elements)
/// - Skips taskbar
/// 
/// Requirements: NFR-4.1
#[tauri::command]
pub fn create_overlay_window(app: AppHandle) -> Result<(), String> {
    // Check if overlay window already exists
    if app.get_webview_window("overlay").is_some() {
        return Ok(());
    }

    // Get primary monitor dimensions for fullscreen
    let monitor = app
        .primary_monitor()
        .map_err(|e| format!("Failed to get primary monitor: {}", e))?
        .ok_or_else(|| "No primary monitor found".to_string())?;
    
    let size = monitor.size();
    let position = monitor.position();

    // Create overlay window
    let window = WebviewWindowBuilder::new(
        &app,
        "overlay",
        WebviewUrl::App("index.html#/overlay".into())
    )
    .title("Skill-E Overlay")
    .inner_size(size.width as f64, size.height as f64)
    .position(position.x as f64, position.y as f64)
    .resizable(false)
    .decorations(false)
    .transparent(true)
    .always_on_top(true)
    .skip_taskbar(true)
    .visible(false) // Start hidden, show when recording starts
    .build()
    .map_err(|e| format!("Failed to create overlay window: {}", e))?;

    // Set window level to stay above other windows
    window
        .set_window_level(WindowLevel::AlwaysOnTop)
        .map_err(|e| format!("Failed to set window level: {}", e))?;

    // Set click-through behavior
    // Note: Interactive elements in the overlay will need to handle their own click events
    // The window itself will be click-through by default
    #[cfg(target_os = "windows")]
    {
        use windows::Win32::Foundation::HWND;
        use windows::Win32::UI::WindowsAndMessaging::{
            GetWindowLongPtrW, SetWindowLongPtrW, GWL_EXSTYLE, WS_EX_LAYERED, WS_EX_TRANSPARENT,
        };

        let hwnd = window.hwnd().map_err(|e| format!("Failed to get HWND: {}", e))?;
        let hwnd = HWND(hwnd.0 as isize);

        unsafe {
            let ex_style = GetWindowLongPtrW(hwnd, GWL_EXSTYLE);
            SetWindowLongPtrW(
                hwnd,
                GWL_EXSTYLE,
                ex_style | WS_EX_LAYERED.0 as isize | WS_EX_TRANSPARENT.0 as isize,
            );
        }
    }

    #[cfg(target_os = "macos")]
    {
        // On macOS, we'll handle click-through via CSS pointer-events
        // The window itself will accept events, but the transparent areas won't
    }

    println!("Overlay window created successfully");
    Ok(())
}

/// Show the overlay window
#[tauri::command]
pub fn show_overlay(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("overlay") {
        window.show().map_err(|e| format!("Failed to show overlay: {}", e))?;
        window.set_focus().map_err(|e| format!("Failed to focus overlay: {}", e))?;
        println!("Overlay window shown");
        Ok(())
    } else {
        Err("Overlay window not found. Call create_overlay_window first.".to_string())
    }
}

/// Hide the overlay window
#[tauri::command]
pub fn hide_overlay(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("overlay") {
        window.hide().map_err(|e| format!("Failed to hide overlay: {}", e))?;
        println!("Overlay window hidden");
        Ok(())
    } else {
        Err("Overlay window not found".to_string())
    }
}

/// Toggle overlay visibility
#[tauri::command]
pub fn toggle_overlay(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("overlay") {
        let is_visible = window.is_visible().map_err(|e| format!("Failed to check visibility: {}", e))?;
        
        if is_visible {
            hide_overlay(app)
        } else {
            show_overlay(app)
        }
    } else {
        Err("Overlay window not found".to_string())
    }
}

/// Update overlay to match current monitor configuration
/// Useful when monitor setup changes or recording switches monitors
#[tauri::command]
pub fn update_overlay_bounds(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("overlay") {
        let monitor = window
            .current_monitor()
            .map_err(|e| format!("Failed to get current monitor: {}", e))?
            .ok_or_else(|| "No monitor found".to_string())?;
        
        let size = monitor.size();
        let position = monitor.position();

        window
            .set_size(tauri::PhysicalSize::new(size.width, size.height))
            .map_err(|e| format!("Failed to set size: {}", e))?;
        
        window
            .set_position(tauri::PhysicalPosition::new(position.x, position.y))
            .map_err(|e| format!("Failed to set position: {}", e))?;

        println!("Overlay bounds updated: {}x{} at ({}, {})", size.width, size.height, position.x, position.y);
        Ok(())
    } else {
        Err("Overlay window not found".to_string())
    }
}
