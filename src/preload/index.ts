import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  execute: (...args) => ipcRenderer.invoke('db:execute', ...args),
  generateToken: (id: number, username: string, admin: boolean, ticketPermissions: boolean) => ipcRenderer.invoke('generate-token', id, username, admin, ticketPermissions),
  getConfig: () => ipcRenderer.invoke('get-config'),
  savePdf: (filePath, pdfBuffer) => ipcRenderer.invoke('save-pdf', filePath, pdfBuffer),
  quitApp: () => ipcRenderer.invoke('quit-app'),
  setConfig: (newConfig: any) => ipcRenderer.invoke('set-config', newConfig),
  openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
  onDatabaseUpdated: (callback: () => void) => {
    ipcRenderer.on('database-updated', callback);
    return () => ipcRenderer.removeListener('database-updated', callback);
  },
  openFolderDialog: () => ipcRenderer.invoke('open-folder-dialog'),
  uploadFile: (sourcePath, destinationPath) => ipcRenderer.invoke('upload-file', sourcePath, destinationPath),
  getFiles: (folderPath: string) => ipcRenderer.invoke('get-files', folderPath),
  openFile: (path) => ipcRenderer.invoke('open-file', path),
  deleteFile: (path) => ipcRenderer.invoke('delete-file', path),
  sendEmail: (mailOptions: any) => ipcRenderer.invoke('send-email', mailOptions),
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api

}