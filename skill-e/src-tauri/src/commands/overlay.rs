use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindowBuilder};

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
        println!("Overlay window already exists");
        return Ok(());
    }

    // Get primary monitor dimensions for fullscreen
    let monitor = match app.primary_monitor() {
        Ok(Some(m)) => m,
        Ok(None) => {
            println!("Warning: No primary monitor found, skipping overlay creation");
            return Ok(());
        }
        Err(e) => {
            println!("Warning: Failed to get primary monitor: {}, skipping overlay", e);
            return Ok(());
        }
    };
    
    let size = monitor.size();
    let position = monitor.position();

    // Create overlay window
    let window = match WebviewWindowBuilder::new(
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
    .build() {
        Ok(w) => w,
        Err(e) => {
            println!("Warning: Failed to create overlay window: {}, continuing without overlay", e);
            return Ok(());
        }
    };

    // Set click-through behavior (Windows only)
    #[cfg(target_os = "windows")]
    {
        use windows::Win32::Foundation::HWND;
        use windows::Win32::UI::WindowsAndMessaging::{
            GetWindowLongPtrW, SetWindowLongPtrW, GWL_EXSTYLE, WS_EX_LAYERED, WS_EX_TRANSPARENT,
        };

        if let Ok(hwnd) = window.hwnd() {
            let hwnd = HWND(hwnd.0);
            unsafe {
                let ex_style = GetWindowLongPtrW(hwnd, GWL_EXSTYLE);
                let _ = SetWindowLongPtrW(
                    hwnd,
                    GWL_EXSTYLE,
                    ex_style | WS_EX_LAYERED.0 as isize | WS_EX_TRANSPARENT.0 as isize,
                );
            }
        }
    }

    println!("Overlay window created successfully");
    Ok(())
}

/// Show the overlay window
#[tauri::command]
pub fn show_overlay(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("overlay") {
        // Try to show window, but don't fail if it errors
        match window.show() {
            Ok(_) => println!("Overlay window shown"),
            Err(e) => {
                println!("Warning: Failed to show overlay: {}", e);
                // Continue anyway
            }
        }
        
        // Try to set focus, but don't fail if it errors
        match window.set_focus() {
            Ok(_) => {},
            Err(e) => println!("Warning: Failed to focus overlay: {}", e),
        }
        
        Ok(())
    } else {
        println!("Warning: Overlay window not found");
        // Return Ok anyway - app should continue working
        Ok(())
    }
}

/// Hide the overlay window
#[tauri::command]
pub fn hide_overlay(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("overlay") {
        match window.hide() {
            Ok(_) => println!("Overlay window hidden"),
            Err(e) => println!("Warning: Failed to hide overlay: {}", e),
        }
        Ok(())
    } else {
        println!("Warning: Overlay window not found for hiding");
        Ok(())
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
