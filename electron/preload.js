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
  isElectron: true,
  
  // ── Test function ──────────────────────────────────────────────────────
  testIPC: () => {
    return ipcRenderer.invoke('test-ipc')
  }
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

// ── Enhanced Event Handling Bridge ────────────────────────────────────────
contextBridge.exposeInMainWorld('electronBridge', {
  // Direct test functions for debugging
  testFunction: () => {
    console.log('✅ electronBridge.testFunction called!')
    alert('✅ Click events working via bridge!')
    return true
  },
  
  // Debug info
  getDebugInfo: () => {
    return {
      platform: process.platform,
      nodeVersion: process.version,
      electronVersion: process.versions.electron,
      timestamp: new Date().toISOString()
    }
  }
})

// ── DOM Ready Event Setup ─────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  console.log('🔌 PearSocial preload script loaded - DOM ready')
  
  // Ensure electronAPI is available globally for any inline handlers
  if (window.electronAPI) {
    console.log('✅ electronAPI confirmed available in DOM context')
  } else {
    console.error('❌ electronAPI not available in DOM context!')
  }
  
  // Test functions for debug mode
  window.testElectronAPI = function() {
    console.log('🧪 testElectronAPI called from window scope')
    
    if (!window.electronAPI) {
      alert('❌ electronAPI not available')
      return
    }
    
    alert('✅ electronAPI available with methods: ' + Object.keys(window.electronAPI).join(', '))
  }
  
  window.testFileDialog = async function() {
    console.log('📂 testFileDialog called from window scope')
    
    if (!window.electronAPI || !window.electronAPI.showOpenDialog) {
      alert('❌ showOpenDialog not available')
      return
    }
    
    try {
      const result = await window.electronAPI.showOpenDialog()
      alert('✅ File dialog result: ' + (result.success ? 'File selected!' : 'Cancelled'))
    } catch (err) {
      alert('❌ Error: ' + err.message)
    }
  }
  
  window.basicClickTest = function() {
    alert('✅ Basic click test working!')
  }
  
  // Enhanced logging for debugging
  console.log('🔌 Event handlers and globals setup complete')
})

console.log('🔌 PearSocial preload script loaded')