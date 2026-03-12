import { useEffect } from 'react'
export function useLogCapture() {
  useEffect(() => {
    const logs: string[] = []
    const originalLog = console.log
    const originalError = console.error
    const originalWarn = console.warn

    console.log = (...args) => {
      logs.push(`[LOG] ${args.join(' ')}`)
      if (logs.length > 1000) logs.shift()
      originalLog(...args)
    }
    console.error = (...args) => {
      logs.push(`[ERROR] ${args.join(' ')}`)
      if (logs.length > 1000) logs.shift()
      originalError(...args)
    }
    console.warn = (...args) => {
      logs.push(`[WARN] ${args.join(' ')}`)
      if (logs.length > 1000) logs.shift()
      originalWarn(...args)
    }

    ;(window as any).__SKILL_E_LOGS__ = () => logs.join('\n')
    ;(window as any).__COPY_LOGS__ = async () => {
      await navigator.clipboard.writeText(logs.join('\n'))
      alert('Logs copied to clipboard!')
    }

    return () => {
      console.log = originalLog
      console.error = originalError
      console.warn = originalWarn
    }
  }, [])
}
