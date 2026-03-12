import { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { queryPermissionState } from '../lib/permissions'

export function useInitialization() {
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const init = async () => {
      try {
        console.log('Initializing Skill-E Core...')

        // Check permissions
        await queryPermissionState('microphone')

        // Initialize recording system
        await invoke('initialize_recording')

        setIsReady(true)
        console.log('Skill-E Core initialized successfully')
      } catch (err) {
        console.error('Initialization error:', err)
        setError(String(err))
      }
    }

    init()
  }, [])

  return { isReady, error }
}
