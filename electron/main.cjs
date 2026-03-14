const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron')
const path = require('path')
const os = require('os')
const PearRuntime = require('pear-runtime')

// ── Pear Runtime Setup ─────────────────────────────────────────────────────
const { version = '1.0.0', upgrade } = require('../package.json')

// For development, create a minimal runtime without updates if no upgrade link
let pear = null
try {
  pear = new PearRuntime({
    dir: path.join(__dirname, '..', 'runtime-data'),
    version,
    upgrade: upgrade || 'pear://dev-placeholder',
    updates: false // Disable updates for now
  })
  console.log('✅ Pear Runtime initialized')
} catch (err) {
  console.log('⚠️ Pear Runtime not available, running in Electron-only mode:', err.message)
}

// ── Global references ──────────────────────────────────────────────────────
let mainWindow = null
let pearWorker = null

// ── Create main window ─────────────────────────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 780,
    backgroundColor: '#0A0C0E',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    titleBarStyle: 'hiddenInset',
    show: false // Don't show until ready
  })

  // Load the main HTML file
  mainWindow.loadFile(path.join(__dirname, '..', 'index.html'))

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    console.log('🖥️  Main window ready, showing...')
    mainWindow.show()
    
    // Start Pear backend
    if (pear) {
      startPearBackend()
    } else {
      // Electron-only mode
      sendToRenderer('log', { message: '⚠️ Running in Electron-only mode (no P2P features)' })
      sendToRenderer('ready', { pearKey: 'electron-only-mode' })
    }
  })

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // Development tools in dev mode
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools()
  }
}

// ── Start Pear Backend Worker ──────────────────────────────────────────────
function startPearBackend() {
  console.log('🍐 Starting Pear backend worker...')
  
  try {
    // Run our Pear backend logic in a worker
    pearWorker = pear.run(path.join(__dirname, '..', 'pear-worker.js'))
    
    // Handle messages from Pear worker
    pearWorker.on('data', (data) => {
      try {
        const message = JSON.parse(data.toString())
        console.log('📨 Pear worker message:', message.type)
        
        // Forward messages to renderer
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('pear-message', message)
        }
      } catch (err) {
        console.error('Error parsing worker message:', err)
      }
    })
    
    pearWorker.on('error', (err) => {
      console.error('🚨 Pear worker error:', err)
      sendToRenderer('error', { message: `Pear worker error: ${err.message}` })
    })
    
    console.log('✅ Pear backend worker started')
    
  } catch (err) {
    console.error('Failed to start Pear backend:', err)
    sendToRenderer('error', { message: `Failed to start Pear backend: ${err.message}` })
  }
}

// ── IPC Handlers ───────────────────────────────────────────────────────────
ipcMain.handle('show-open-dialog', async () => {
  console.log('📂 Opening file dialog...')
  
  try {
    // First try with minimal config to test if dialog works at all
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile', 'openDirectory'],
      title: 'Select a file to upload'
    })
    
    console.log('📂 Dialog result:', {
      cancelled: result.canceled,
      filePathCount: result.filePaths.length,
      filePaths: result.filePaths
    })
    
    if (!result.canceled && result.filePaths.length > 0) {
      const filePath = result.filePaths[0]
      const fileName = path.basename(filePath)
      console.log(`📁 File selected: ${fileName}`)
      return { filePath, fileName, success: true }
    }
    
    console.log('📁 File dialog cancelled')
    return { success: false }
    
  } catch (err) {
    console.error('📂 File dialog error:', err)
    return { success: false, error: err.message }
  }
})

ipcMain.handle('upload-video', async (event, { filePath, fileName }) => {
  console.log(`📤 Upload request: ${fileName} from ${filePath}`)
  
  if (pearWorker) {
    const message = JSON.stringify({
      type: 'upload-video',
      filePath,
      fileName
    })
    pearWorker.stdin.write(message + '\n')
    console.log('📤 Upload message sent to worker')
  } else {
    console.log('❌ No pear worker available')
    sendToRenderer('error', { message: 'P2P functionality not available' })
  }
  
  return { success: true }
})

ipcMain.handle('get-drive-key', async () => {
  if (pearWorker) {
    const message = JSON.stringify({ type: 'get-drive-key' })
    pearWorker.stdin.write(message + '\n')
  }
  return { success: true }
})

ipcMain.handle('get-videos', async () => {
  if (pearWorker) {
    const message = JSON.stringify({ type: 'get-videos' })
    pearWorker.stdin.write(message + '\n')
  }
  return { success: true }
})

ipcMain.handle('open-external', async (event, url) => {
  shell.openExternal(url)
  return { success: true }
})

ipcMain.handle('test-ipc', async () => {
  console.log('🧪 Test IPC handler called')
  return { success: true, message: 'IPC communication working!' }
})

// ── Helper Functions ───────────────────────────────────────────────────────
function sendToRenderer(type, data) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('pear-message', { type, ...data })
  }
}

// ── App Event Handlers ─────────────────────────────────────────────────────
app.whenReady().then(() => {
  console.log('🚀 Electron app ready, creating window...')
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

app.on('before-quit', async () => {
  console.log('🛑 App shutting down...')
  
  // Close Pear runtime
  if (pear) {
    try {
      await pear.close()
      console.log('✅ Pear runtime closed')
    } catch (err) {
      console.error('Error closing Pear runtime:', err)
    }
  }
})

// ── Handle updates ─────────────────────────────────────────────────────────
if (pear && pear.updater) {
  pear.updater.on('updating', () => {
    console.log('🔄 App updating...')
    sendToRenderer('app-updating', {})
  })

  pear.updater.on('updated', () => {
    console.log('✅ App updated, applying...')
    pear.updater.applyUpdate()
  })
}

console.log('📋 PearSocial Electron main process initialized')