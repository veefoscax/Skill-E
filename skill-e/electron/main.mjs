import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { app, BrowserWindow, ipcMain } from 'electron'

import { getWorkDiaryHostStatus, transcribeWithWisprBridge } from './providers.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const smokeMode = process.argv.includes('--smoke')

let mainWindow = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1080,
    height: 760,
    minWidth: 920,
    minHeight: 620,
    show: !smokeMode,
    backgroundColor: '#0b1020',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })

  const rendererUrl = process.env.SKILL_E_RENDERER_URL
  if (rendererUrl) {
    mainWindow.loadURL(rendererUrl)
  } else {
    mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'))
  }

  if (smokeMode) {
    mainWindow.webContents.once('did-finish-load', () => {
      console.log('electron-shell-smoke: renderer loaded')
      setTimeout(() => {
        app.quit()
      }, 250)
    })
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

ipcMain.handle('host:get-status', async () => getWorkDiaryHostStatus())
ipcMain.handle('host:wispr-transcribe', async (_event, audioPath) =>
  transcribeWithWisprBridge(audioPath)
)

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
