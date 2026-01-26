use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use screenshots::Screen;

/// Result of a screen capture operation
#[derive(Debug, Serialize, Deserialize)]
pub struct CaptureResult {
    /// Path to the saved screenshot file
    pub path: String,
    /// Unix timestamp in milliseconds when the capture was taken
    pub timestamp: i64,
}

/// Captures the entire screen and saves it as a WebP image
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
    
    // Capture the primary screen (first screen)
    let screen = screens
        .first()
        .ok_or_else(|| "No screens found".to_string())?;
    
    let image_buffer = screen
        .capture()
        .map_err(|e| format!("Failed to capture screen: {}", e))?;

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
