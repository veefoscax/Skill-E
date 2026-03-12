import { useEffect, useCallback } from 'react'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { invoke } from '@tauri-apps/api/core'
import { useSettingsStore } from '@/stores/settings'

/**
 * Hook to manage window position persistence
 * - Restores window position on mount
 * - Saves window position on move
 * - Handles off-screen position correction
 */
export function useWindowPosition() {
  const { windowPosition, setWindowPosition } = useSettingsStore()

  /**
   * Validate if a position is on screen
   */
  const isPositionValid = useCallback(async (x: number, y: number): Promise<boolean> => {
    try {
      const [screenWidth, screenHeight] = await invoke<[number, number]>('get_monitor_size')

      // Window dimensions (from tauri.conf.json)
      const windowWidth = 300
      const windowHeight = 60

      // Check if window is at least partially visible
      // Allow some tolerance (e.g., 50px) to be off-screen
      const tolerance = 50

      const isXValid = x > -windowWidth + tolerance && x < screenWidth - tolerance
      const isYValid = y > -windowHeight + tolerance && y < screenHeight - tolerance

      return isXValid && isYValid
    } catch (error) {
      console.error('Failed to validate position:', error)
      return false
    }
  }, [])

  /**
   * Get centered position as fallback
   */
  const getCenteredPosition = useCallback(async (): Promise<{ x: number; y: number }> => {
    try {
      const [screenWidth, screenHeight] = await invoke<[number, number]>('get_monitor_size')
      const windowWidth = 300
      const windowHeight = 60

      return {
        x: Math.floor((screenWidth - windowWidth) / 2),
        y: Math.floor((screenHeight - windowHeight) / 2),
      }
    } catch (error) {
      console.error('Failed to get centered position:', error)
      // Fallback to reasonable defaults
      return { x: 100, y: 100 }
    }
  }, [])

  /**
   * Restore window position on mount
   */
  useEffect(() => {
    const restorePosition = async () => {
      try {
        if (windowPosition) {
          const { x, y } = windowPosition

          // Validate the saved position
          const isValid = await isPositionValid(x, y)

          if (isValid) {
            // Restore saved position
            await invoke('set_window_position', { x, y })
            console.log(`Restored window position: (${x}, ${y})`)
          } else {
            // Position is off-screen, center the window
            console.warn('Saved position is off-screen, centering window')
            const centered = await getCenteredPosition()
            await invoke('set_window_position', { x: centered.x, y: centered.y })
            setWindowPosition(centered)
          }
        } else {
          // No saved position, center the window
          const centered = await getCenteredPosition()
          await invoke('set_window_position', { x: centered.x, y: centered.y })
          setWindowPosition(centered)
        }
      } catch (error) {
        console.error('Failed to restore window position:', error)
      }
    }

    restorePosition()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run on mount - dependencies are stable callbacks

  /**
   * Save window position when it moves
   */
  useEffect(() => {
    const appWindow = getCurrentWindow()

    const unlistenPromise = appWindow.onMoved(async ({ payload: position }) => {
      try {
        const newPosition = { x: position.x, y: position.y }
        setWindowPosition(newPosition)
        console.log(`Window moved to: (${position.x}, ${position.y})`)
      } catch (error) {
        console.error('Failed to save window position:', error)
      }
    })

    // Cleanup listener on unmount
    return () => {
      unlistenPromise.then(unlisten => unlisten())
    }
  }, [setWindowPosition])

  return {
    windowPosition,
    setWindowPosition,
  }
}
