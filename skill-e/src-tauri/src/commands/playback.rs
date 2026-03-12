use enigo::{
    Direction::{Click, Press, Release},
    Enigo, Key, Keyboard, Mouse, Settings,
};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct PlaybackStep {
    pub action_type: String, // "click", "type", "key"
    pub x: Option<i32>,
    pub y: Option<i32>,
    pub text: Option<String>,
}

#[tauri::command]
pub async fn execute_native_playback(steps: Vec<PlaybackStep>) -> Result<String, String> {
    // Initialize Enigo. In enigo 0.2+, it returns a Result on creation.
    let mut enigo = Enigo::new(&Settings::default()).map_err(|e| format!("Failed to init Enigo: {}", e))?;

    for step in steps {
        match step.action_type.as_str() {
            "click" => {
                if let (Some(x), Some(y)) = (step.x, step.y) {
                    // Move the mouse to the absolute coordinates
                    enigo.move_mouse(x, y, enigo::Coordinate::Abs).map_err(|e| e.to_string())?;
                    // Simulate a left click
                    enigo.button(enigo::Button::Left, Click).map_err(|e| e.to_string())?;
                    // Small delay to mimic human behavior
                    std::thread::sleep(std::time::Duration::from_millis(300));
                }
            }
            "type" => {
                if let Some(text) = step.text {
                    enigo.text(&text).map_err(|e| e.to_string())?;
                    std::thread::sleep(std::time::Duration::from_millis(300));
                }
            }
            "key" => {
                if let Some(key_str) = step.text {
                    let key = match key_str.to_lowercase().as_str() {
                        "enter" | "return" => Key::Return,
                        "tab" => Key::Tab,
                        "space" => Key::Space,
                        "backspace" => Key::Backspace,
                        "escape" | "esc" => Key::Escape,
                        "up" | "arrowup" => Key::UpArrow,
                        "down" | "arrowdown" => Key::DownArrow,
                        "left" | "arrowleft" => Key::LeftArrow,
                        "right" | "arrowright" => Key::RightArrow,
                        _ => {
                            // Single character fallback
                            if key_str.len() == 1 {
                                let c = key_str.chars().next().unwrap();
                                Key::Unicode(c)
                            } else {
                                // Ignore unknown keys for now
                                continue;
                            }
                        }
                    };
                    enigo.key(key, Click).map_err(|e| e.to_string())?;
                    std::thread::sleep(std::time::Duration::from_millis(200));
                }
            }
            _ => {
                println!("Unknown playback action: {}", step.action_type);
            }
        }
        
        // General delay between actions
        std::thread::sleep(std::time::Duration::from_millis(500));
    }

    Ok("Playback completed successfully".to_string())
}
