use tauri::Manager;
use tauri::{PhysicalPosition, Emitter};
use tray_icon::{TrayIconBuilder, menu::{Menu, MenuItem}};
use tauri_plugin_global_shortcut::ShortcutState;

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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
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
            cancel_recording
        ])
        .setup(|app| {
            // Note: For Tauri v2, window effects (Mica/Vibrancy) are configured in tauri.conf.json
            // The transparent window with backdrop-blur CSS provides the glass effect

            // Setup system tray - use mem::forget to keep it alive
            setup_tray(app)?;

            // Setup global shortcuts
            setup_global_shortcuts(app)?;

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn setup_tray(app: &mut tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    use tray_icon::menu::MenuEvent;
    use tray_icon::Icon;

    println!("Setting up system tray...");

    // Load tray icon
    let icon_bytes = include_bytes!("../icons/32x32.png");
    let icon_image = image::load_from_memory(icon_bytes)?;
    let rgba = icon_image.to_rgba8().into_raw();
    let width = icon_image.width();
    let height = icon_image.height();
    let icon = Icon::from_rgba(rgba, width, height)?;

    println!("Tray icon loaded: {}x{}", width, height);

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

fn setup_global_shortcuts(app: &mut tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    use tauri_plugin_global_shortcut::GlobalShortcutExt;

    println!("Setting up global shortcuts...");

    let _app_handle = app.handle().clone();

    // Register Ctrl+Shift+R (Cmd+Shift+R on macOS) for toggle recording
    #[cfg(target_os = "macos")]
    let record_shortcut = "CommandOrControl+Shift+R";
    #[cfg(not(target_os = "macos"))]
    let record_shortcut = "Ctrl+Shift+R";

    println!("Registering shortcut: {}", record_shortcut);
    app.global_shortcut().on_shortcut(record_shortcut, move |_app, _shortcut, event| {
        if event.state == ShortcutState::Pressed {
            println!("Hotkey pressed: Toggle Recording");
            if let Some(window) = _app.get_webview_window("main") {
                // Emit event to frontend
                let _ = window.emit("hotkey-toggle-recording", ());
            }
        }
    })?;

    // Register Ctrl+Shift+A (Cmd+Shift+A on macOS) for toggle annotation
    #[cfg(target_os = "macos")]
    let annotation_shortcut = "CommandOrControl+Shift+A";
    #[cfg(not(target_os = "macos"))]
    let annotation_shortcut = "Ctrl+Shift+A";

    println!("Registering shortcut: {}", annotation_shortcut);
    app.global_shortcut().on_shortcut(annotation_shortcut, move |_app, _shortcut, event| {
        if event.state == ShortcutState::Pressed {
            println!("Hotkey pressed: Toggle Annotation");
            if let Some(window) = _app.get_webview_window("main") {
                // Emit event to frontend
                let _ = window.emit("hotkey-toggle-annotation", ());
            }
        }
    })?;

    // Register Esc for cancel recording
    println!("Registering shortcut: Escape");
    app.global_shortcut().on_shortcut("Escape", move |_app, _shortcut, event| {
        if event.state == ShortcutState::Pressed {
            println!("Hotkey pressed: Cancel Recording");
            if let Some(window) = _app.get_webview_window("main") {
                // Emit event to frontend
                let _ = window.emit("hotkey-cancel-recording", ());
            }
        }
    })?;

    println!("Global shortcuts registered successfully!");
    Ok(())
}
