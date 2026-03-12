import { useEffect } from 'react'
import { getCurrentWindow } from '@tauri-apps/api/window'

/**
 * Hook to handle system tray behavior
 * - Prevents window from closing, hides it instead (minimize to tray)
 * - Window can be shown again via tray icon click or menu
 */
export function useSystemTray() {
  useEffect(() => {
    const appWindow = getCurrentWindow()

    // Prevent window close, hide instead (minimize to tray)
    const unlisten = appWindow.onCloseRequested(async event => {
      event.preventDefault()
      await appWindow.hide()
    })

    return () => {
      unlisten.then(fn => fn())
    }
  }, [])
}
