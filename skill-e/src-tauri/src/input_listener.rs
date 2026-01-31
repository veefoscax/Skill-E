use rdev::{listen, EventType, Button};
use tauri::{AppHandle, Emitter};
use std::thread;
use std::sync::atomic::{AtomicBool, Ordering};
use serde::Serialize;
use std::time::{SystemTime, UNIX_EPOCH};

// Global recording state managed via atomic for thread safety
static IS_RECORDING: AtomicBool = AtomicBool::new(false);

#[derive(Clone, Serialize)]
struct StepPayload {
    label: String,
    #[serde(rename = "type")]
    step_type: String,
    data: StepData,
    timestamp: u128,
}

#[derive(Clone, Serialize)]
struct StepData {
    position: Option<Position>,
    text: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    window: Option<crate::commands::capture::WindowInfo>,
}

#[derive(Clone, Serialize)]
struct Position {
    x: f64,
    y: f64,
}

pub fn set_recording_state(recording: bool) {
    IS_RECORDING.store(recording, Ordering::SeqCst);
}

pub fn start_input_listener(app: AppHandle) {
    println!("DEBUG: Starting Global Input Listener...");
    thread::spawn(move || {
        println!("DEBUG: Input Listener Thread Spawned");
        if let Err(error) = listen(move |event| {
            if !IS_RECORDING.load(Ordering::SeqCst) {
                // Uncomment to debug if listener is alive but ignored
                // println!("DEBUG: Ignored event (not recording)"); 
                return;
            }
            println!("DEBUG: Event detected: {:?}", event.event_type);

            match event.event_type {
                EventType::ButtonPress(Button::Left) => {
                    let timestamp = SystemTime::now()
                        .duration_since(UNIX_EPOCH)
                        .unwrap()
                        .as_millis();

                    // Get Active Window Context (OS Awareness)
                    #[cfg(target_os = "windows")]
                    let window_info = crate::commands::capture::get_current_window_info().ok();
                    #[cfg(not(target_os = "windows"))]
                    let window_info = None;

                    let mut label = "Click".to_string();
                    if let Some(ref w) = window_info {
                        label = format!("Click in {}", w.process_name);
                    }

                    // Get Cursor Position
                    let (x, y) = crate::commands::capture::get_cursor_position_impl()
                        .unwrap_or((0, 0));

                    let payload = StepPayload {
                        label,
                        step_type: "click".to_string(),
                        data: StepData {
                            position: Some(Position { x: x as f64, y: y as f64 }),
                            text: None,
                            window: window_info, // Add window info to data
                        },
                        timestamp,
                    };
                    
                    
                    // Emit event to frontend
                    match app.emit("recording:step-added", &payload) {
                        Ok(_) => println!("DEBUG: Emitted click step to frontend"),
                        Err(e) => println!("DEBUG: Failed to emit click step: {}", e),
                    }
                    
                    // Trigger capture
                    let _ = app.emit("internal:trigger-capture", ());
                },
                EventType::KeyPress(key) => {
                     let timestamp = SystemTime::now()
                        .duration_since(UNIX_EPOCH)
                        .unwrap()
                        .as_millis();
                        
                    let key_str = format!("{:?}", key);
                    
                    // Also Get Active Window for Keys (Optional but good for context)
                    #[cfg(target_os = "windows")]
                    let window_info = crate::commands::capture::get_current_window_info().ok();
                    #[cfg(not(target_os = "windows"))]
                    let window_info = None;

                    let payload = StepPayload {
                        label: format!("Key: {}", key_str),
                        step_type: "keystroke".to_string(),
                        data: StepData {
                            position: None,
                            text: Some(key_str),
                            window: window_info,
                        },
                         timestamp,
                    };
                    let _ = app.emit("recording:step-added", payload);
                },
                _ => {}
            }
        }) {
            println!("Error: {:?}", error);
        }
    });
}
