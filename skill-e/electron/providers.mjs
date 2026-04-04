import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..')

function run(command, args, options = {}) {
  return spawnSync(command, args, {
    encoding: 'utf8',
    windowsHide: true,
    ...options,
  })
}

function trimOutput(result) {
  return (result.stdout || result.stderr || '').trim()
}

export function getWisprExecutablePath() {
  const localAppData = process.env.LOCALAPPDATA
  if (!localAppData) {
    return null
  }

  const baseDir = path.join(localAppData, 'WisprFlow')
  if (!fs.existsSync(baseDir)) {
    return null
  }

  const candidates = fs
    .readdirSync(baseDir, { withFileTypes: true })
    .filter(entry => entry.isDirectory() && entry.name.startsWith('app-'))
    .map(entry => ({
      version: entry.name,
      executable: path.join(baseDir, entry.name, 'Wispr Flow.exe'),
    }))
    .filter(entry => fs.existsSync(entry.executable))
    .sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }))

  return candidates[0]?.executable ?? null
}

export function resolveNodePath() {
  const candidates = []

  if (process.env.ProgramFiles) {
    candidates.push(path.join(process.env.ProgramFiles, 'nodejs', 'node.exe'))
  }

  if (process.env['ProgramFiles(x86)']) {
    candidates.push(path.join(process.env['ProgramFiles(x86)'], 'nodejs', 'node.exe'))
  }

  if (process.env.LOCALAPPDATA) {
    candidates.push(path.join(process.env.LOCALAPPDATA, 'Programs', 'nodejs', 'node.exe'))
  }

  candidates.push('node')

  for (const candidate of candidates) {
    const result = run(candidate, ['--version'])
    if (result.status === 0) {
      return candidate
    }
  }

  throw new Error('Could not find a working Node.js runtime for Electron shell')
}

function isProcessRunning(imageName) {
  const result = run('powershell', [
    '-NoProfile',
    '-ExecutionPolicy',
    'Bypass',
    '-Command',
    `(Get-Process '${imageName}' -ErrorAction SilentlyContinue | Measure-Object).Count`,
  ])

  if (result.status !== 0) {
    return false
  }

  return Number.parseInt((result.stdout || '').trim(), 10) > 0
}

export function getWorkDiaryHostStatus() {
  const nodePath = (() => {
    try {
      return resolveNodePath()
    } catch (error) {
      return null
    }
  })()

  const screenpipeVersion = run('screenpipe', ['--version'])
  const pythonVersion = run('python', ['--version'])
  const wisprExecutable = getWisprExecutablePath()

  return {
    shell: 'electron',
    transcriptProvider: 'wispr_flow',
    transcriptFallback: 'local_whisper',
    collectorProvider: 'screenpipe',
    checkedAt: new Date().toISOString(),
    providers: [
      {
        id: 'node',
        label: 'Node.js',
        health: nodePath ? 'available' : 'unavailable',
        available: Boolean(nodePath),
        running: true,
        detail: nodePath || 'node.exe not found',
        command: nodePath || 'node',
      },
      {
        id: 'wispr_flow',
        label: 'Wispr Flow',
        health: wisprExecutable
          ? isProcessRunning('Wispr Flow')
            ? 'running'
            : 'available'
          : 'unavailable',
        available: Boolean(wisprExecutable),
        running: isProcessRunning('Wispr Flow'),
        detail: wisprExecutable || 'Wispr Flow.exe not found',
        command: wisprExecutable || undefined,
      },
      {
        id: 'screenpipe',
        label: 'Screenpipe',
        health:
          screenpipeVersion.status === 0
            ? isProcessRunning('screenpipe')
              ? 'running'
              : 'available'
            : 'unavailable',
        available: screenpipeVersion.status === 0,
        running: isProcessRunning('screenpipe'),
        detail:
          screenpipeVersion.status === 0
            ? trimOutput(screenpipeVersion)
            : trimOutput(screenpipeVersion) || 'screenpipe not available on PATH',
        command: 'screenpipe',
      },
      {
        id: 'python',
        label: 'Python',
        health: pythonVersion.status === 0 ? 'available' : 'unavailable',
        available: pythonVersion.status === 0,
        running: false,
        detail:
          pythonVersion.status === 0
            ? trimOutput(pythonVersion)
            : trimOutput(pythonVersion) || 'python not available on PATH',
        command: 'python',
      },
    ],
  }
}

export function getBridgeScriptPath() {
  return path.resolve(repoRoot, '..', 'sidecar', 'wispr-bridge.mjs')
}

export function transcribeWithWisprBridge(audioPath) {
  const nodePath = resolveNodePath()
  const bridgePath = getBridgeScriptPath()

  if (!fs.existsSync(bridgePath)) {
    throw new Error(`Wispr bridge not found at ${bridgePath}`)
  }

  const result = run(nodePath, [bridgePath, 'transcribe', audioPath], {
    maxBuffer: 16 * 1024 * 1024,
  })

  if (result.status !== 0) {
    throw new Error(trimOutput(result) || 'Wispr bridge execution failed')
  }

  return {
    text: (result.stdout || '').trim(),
  }
}
