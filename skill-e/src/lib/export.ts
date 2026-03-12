import { invoke } from '@tauri-apps/api/core'

/**
 * Export options for skill saving
 */
export interface ExportOptions {
  /** Export location path */
  exportPath: string
  /** Include reference screenshots */
  includeScreenshots: boolean
  /** Include assets/templates */
  includeAssets: boolean
  /** Skill name (for folder creation) */
  skillName: string
}

/**
 * Result of export operation
 */
export interface ExportResult {
  /** Full path to the created skill folder */
  skillFolderPath: string
  /** Path to the saved SKILL.md file */
  skillFilePath: string
  /** Number of screenshots copied */
  screenshotsCopied: number
  /** Number of assets copied */
  assetsCopied: number
}

/**
 * Save skill to disk with folder structure
 *
 * Creates:
 * - skill-name/
 *   - SKILL.md
 *   - references/ (if screenshots included)
 *   - assets/ (if assets included)
 *
 * Requirements: FR-6.4, FR-6.8, FR-6.9
 *
 * @param options - Export options (path, name, includes)
 * @param skillContent - The SKILL.md markdown content
 * @param screenshotPaths - Optional list of screenshot file paths to copy
 * @param assetPaths - Optional list of asset file paths to copy
 * @returns Export result with details
 * @throws Error if export fails
 */
export async function saveSkill(
  options: ExportOptions,
  skillContent: string,
  screenshotPaths?: string[],
  assetPaths?: string[]
): Promise<ExportResult> {
  try {
    const result = await invoke<ExportResult>('save_skill', {
      options,
      skillContent,
      screenshotPaths: screenshotPaths || null,
      assetPaths: assetPaths || null,
    })

    return result
  } catch (error) {
    console.error('Failed to save skill:', error)
    throw new Error(typeof error === 'string' ? error : 'Failed to save skill')
  }
}

/**
 * Validate that a skill export path is valid and writable
 *
 * @param exportPath - Path to validate
 * @param skillName - Skill name to check for conflicts
 * @returns true if path is valid and skill doesn't exist, false if skill already exists
 * @throws Error if path is not writable
 */
export async function validateExportPath(exportPath: string, skillName: string): Promise<boolean> {
  try {
    const isValid = await invoke<boolean>('validate_export_path', {
      exportPath,
      skillName,
    })

    return isValid
  } catch (error) {
    console.error('Failed to validate export path:', error)
    throw new Error(typeof error === 'string' ? error : 'Failed to validate export path')
  }
}
