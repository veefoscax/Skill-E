import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('skillEHost', {
  getStatus: () => ipcRenderer.invoke('host:get-status'),
  wisprTranscribe: audioPath => ipcRenderer.invoke('host:wispr-transcribe', audioPath),
})
