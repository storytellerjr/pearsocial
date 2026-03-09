const { contextBridge, ipcRenderer } = require('electron')

// ── Expose safe APIs to renderer ──────────────────────────────────────────
contextBridge.exposeInMainWorld('electronAPI', {
  // ── File upload ──────────────────────────────────────────────────────────
  uploadVideo: (filePath, fileName) => {
    return ipcRenderer.invoke('upload-video', { filePath, fileName })
  },
  
  // ── File dialog ─────────────────────────────────────────────────────────
  showOpenDialog: () => {
    return ipcRenderer.invoke('show-open-dialog')
  },
  
  // ── Data requests ───────────────────────────────────────────────────────
  getDriveKey: () => {
    return ipcRenderer.invoke('get-drive-key')
  },
  
  getVideos: () => {
    return ipcRenderer.invoke('get-videos')
  },
  
  // ── Message handling from Pear backend ─────────────────────────────────
  onPearMessage: (callback) => {
    ipcRenderer.on('pear-message', (event, data) => {
      callback(data)
    })
  },
  
  // ── System integration ─────────────────────────────────────────────────
  openExternal: (url) => {
    return ipcRenderer.invoke('open-external', url)
  },
  
  // ── Environment info ───────────────────────────────────────────────────
  platform: process.platform,
  isElectron: true
})

// ── Pear integration bridge ───────────────────────────────────────────────
contextBridge.exposeInMainWorld('Pear', {
  // Provide a compatibility layer for existing Pear code
  isElectron: true,
  config: {
    type: 'desktop',
    gui: {
      backgroundColor: '#0A0C0E',
      height: 780,
      width: 1200
    }
  }
})

console.log('🔌 PearSocial preload script loaded')