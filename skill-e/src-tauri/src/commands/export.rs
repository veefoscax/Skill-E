use std::fs;
use std::path::PathBuf;
use serde::{Deserialize, Serialize};

/// Export options for skill saving
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExportOptions {
    /// Export location path
    pub export_path: String,
    /// Include reference screenshots
    pub include_screenshots: bool,
    /// Include assets/templates
    pub include_assets: bool,
    /// Skill name (for folder creation)
    pub skill_name: String,
}

/// Result of export operation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExportResult {
    /// Full path to the created skill folder
    pub skill_folder_path: String,
    /// Path to the saved SKILL.md file
    pub skill_file_path: String,
    /// Number of screenshots copied
    pub screenshots_copied: usize,
    /// Number of assets copied
    pub assets_copied: usize,
}

/// Save skill to disk with folder structure
/// 
/// Creates:
/// - skill-name/
///   - SKILL.md
///   - references/ (if screenshots included)
///   - assets/ (if assets included)
/// 
/// # Requirements
/// * FR-6.4: Include verification checklist
/// * FR-6.8: Choose export location
/// * FR-6.9: Generate references/ folder with screenshots
/// 
/// # Arguments
/// * `options` - Export options (path, name, includes)
/// * `skill_content` - The SKILL.md markdown content
/// * `screenshot_paths` - Optional list of screenshot file paths to copy
/// * `asset_paths` - Optional list of asset file paths to copy
/// 
/// # Returns
/// * `Ok(ExportResult)` - Export successful with details
/// * `Err(String)` - Error message if export fails
#[tauri::command]
pub async fn save_skill(
    options: ExportOptions,
    skill_content: String,
    screenshot_paths: Option<Vec<String>>,
    asset_paths: Option<Vec<String>>,
) -> Result<ExportResult, String> {
    // Validate skill name
    if options.skill_name.is_empty() {
        return Err("Skill name cannot be empty".to_string());
    }
    
    // Create base export path
    let export_base = PathBuf::from(&options.export_path);
    
    // Create skill folder: export_path/skill-name/
    let skill_folder = export_base.join(&options.skill_name);
    
    // Check if folder already exists
    if skill_folder.exists() {
        return Err(format!(
            "Skill folder already exists: {}. Please choose a different name or delete the existing folder.",
            skill_folder.display()
        ));
    }
    
    // Create skill folder
    fs::create_dir_all(&skill_folder)
        .map_err(|e| format!("Failed to create skill folder: {}", e))?;
    
    println!("Created skill folder: {}", skill_folder.display());
    
    // Save SKILL.md
    let skill_file = skill_folder.join("SKILL.md");
    fs::write(&skill_file, &skill_content)
        .map_err(|e| format!("Failed to write SKILL.md: {}", e))?;
    
    println!("Saved SKILL.md: {}", skill_file.display());
    
    let mut screenshots_copied = 0;
    let mut assets_copied = 0;
    
    // Copy screenshots if requested
    if options.include_screenshots {
        if let Some(screenshots) = screenshot_paths {
            if !screenshots.is_empty() {
                // Create references/ folder
                let references_folder = skill_folder.join("references");
                fs::create_dir_all(&references_folder)
                    .map_err(|e| format!("Failed to create references folder: {}", e))?;
                
                println!("Created references folder: {}", references_folder.display());
                
                // Copy each screenshot
                for (index, screenshot_path) in screenshots.iter().enumerate() {
                    let source = PathBuf::from(screenshot_path);
                    
                    if !source.exists() {
                        println!("Warning: Screenshot not found: {}", screenshot_path);
                        continue;
                    }
                    
                    // Determine file extension
                    let extension = source
                        .extension()
                        .and_then(|e| e.to_str())
                        .unwrap_or("png");
                    
                    // Create destination filename: step1.png, step2.png, etc.
                    let dest_filename = format!("step{}.{}", index + 1, extension);
                    let dest = references_folder.join(&dest_filename);
                    
                    // Copy file
                    fs::copy(&source, &dest)
                        .map_err(|e| format!("Failed to copy screenshot {}: {}", screenshot_path, e))?;
                    
                    screenshots_copied += 1;
                    println!("Copied screenshot: {} -> {}", source.display(), dest.display());
                }
            }
        }
    }
    
    // Copy assets if requested
    if options.include_assets {
        if let Some(assets) = asset_paths {
            if !assets.is_empty() {
                // Create assets/ folder
                let assets_folder = skill_folder.join("assets");
                fs::create_dir_all(&assets_folder)
                    .map_err(|e| format!("Failed to create assets folder: {}", e))?;
                
                println!("Created assets folder: {}", assets_folder.display());
                
                // Copy each asset
                for asset_path in assets.iter() {
                    let source = PathBuf::from(asset_path);
                    
                    if !source.exists() {
                        println!("Warning: Asset not found: {}", asset_path);
                        continue;
                    }
                    
                    // Get filename
                    let filename = source
                        .file_name()
                        .ok_or_else(|| format!("Invalid asset path: {}", asset_path))?;
                    
                    let dest = assets_folder.join(filename);
                    
                    // Copy file
                    fs::copy(&source, &dest)
                        .map_err(|e| format!("Failed to copy asset {}: {}", asset_path, e))?;
                    
                    assets_copied += 1;
                    println!("Copied asset: {} -> {}", source.display(), dest.display());
                }
            }
        }
    }
    
    // Verify SKILL.md was saved successfully
    if !skill_file.exists() {
        return Err("SKILL.md file was not saved successfully".to_string());
    }
    
    // Verify file size is reasonable (not empty, not too large)
    let metadata = fs::metadata(&skill_file)
        .map_err(|e| format!("Failed to verify SKILL.md: {}", e))?;
    
    if metadata.len() == 0 {
        return Err("SKILL.md file is empty".to_string());
    }
    
    if metadata.len() > 10_000_000 {
        return Err("SKILL.md file is too large (>10MB)".to_string());
    }
    
    println!("Export completed successfully!");
    println!("  Skill folder: {}", skill_folder.display());
    println!("  Screenshots copied: {}", screenshots_copied);
    println!("  Assets copied: {}", assets_copied);
    
    Ok(ExportResult {
        skill_folder_path: skill_folder
            .to_str()
            .ok_or_else(|| "Failed to convert skill folder path to string".to_string())?
            .to_string(),
        skill_file_path: skill_file
            .to_str()
            .ok_or_else(|| "Failed to convert skill file path to string".to_string())?
            .to_string(),
        screenshots_copied,
        assets_copied,
    })
}

/// Validate that a skill export path is valid and writable
/// 
/// # Arguments
/// * `export_path` - Path to validate
/// * `skill_name` - Skill name to check for conflicts
/// 
/// # Returns
/// * `Ok(bool)` - true if path is valid and skill doesn't exist
/// * `Err(String)` - Error message if validation fails
#[tauri::command]
pub async fn validate_export_path(
    export_path: String,
    skill_name: String,
) -> Result<bool, String> {
    let export_base = PathBuf::from(&export_path);
    
    // Check if base path exists
    if !export_base.exists() {
        // Try to create it to test writability
        fs::create_dir_all(&export_base)
            .map_err(|e| format!("Export path is not writable: {}", e))?;
    }
    
    // Check if skill folder already exists
    let skill_folder = export_base.join(&skill_name);
    if skill_folder.exists() {
        return Ok(false); // Skill already exists
    }
    
    Ok(true)
}
