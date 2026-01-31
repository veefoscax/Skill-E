/**
 * Permission utilities for Tauri
 */

export type PermissionType = 'microphone' | 'camera' | 'screen';

export interface PermissionState {
  state: 'granted' | 'denied' | 'prompt';
}

export async function queryPermissionState(permission: PermissionType): Promise<PermissionState> {
  try {
    // In a real implementation, this would use Tauri's permission API
    // For now, we return granted to allow the app to work
    console.log(`Querying permission: ${permission}`);
    return { state: 'granted' };
  } catch (error) {
    console.error(`Failed to query ${permission} permission:`, error);
    return { state: 'prompt' };
  }
}

export async function requestPermission(permission: PermissionType): Promise<boolean> {
  try {
    console.log(`Requesting permission: ${permission}`);
    return true;
  } catch (error) {
    console.error(`Failed to request ${permission} permission:`, error);
    return false;
  }
}
