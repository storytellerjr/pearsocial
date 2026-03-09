# Pear-Electron Desktop App Development Skill

> **Created by**: Storyteller

> **For AI Agents**: Complete guide to building P2P desktop applications using Electron + Pear Runtime (2026)

## 🎯 **What This Skill Covers**

Build modern P2P desktop applications that combine:
- **Electron**: Proven desktop GUI framework
- **Pear Runtime**: Embeddable P2P functionality  
- **Hyperdrive**: Distributed file storage
- **Hyperswarm**: P2P networking
- **HTTP Gateway**: Web compatibility bridge

## 🏗️ **Modern Pear Architecture (2026)**

### **❌ Old Approach (Deprecated)**
```javascript
// Traditional Pear desktop - GUI issues
pear run --dev .  // Often doesn't show GUI window
```

### **✅ New Approach (Recommended)**
```javascript
// Electron + Pear Runtime - Reliable GUI
electron . // + pear-runtime for P2P features
```

**Architecture Pattern:**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Electron GUI   │    │  Pear Worker    │    │  HTTP Gateway   │
│  (Frontend)     │◄──►│  (P2P Backend)  │◄──►│  (Web Bridge)   │
│  Native Window  │    │  Bare Runtime   │    │  Express Server │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 **Step-by-Step Setup**

### **1. Initialize Project**
```bash
mkdir my-pear-app
cd my-pear-app
npm init -y
```

### **2. Install Dependencies**
```bash
# Core dependencies
npm install pear-runtime hyperswarm hyperdrive corestore b4a

# Development dependencies  
npm install --save-dev electron @electron-forge/cli

# Optional: HTTP gateway
npm install express
```

### **3. Configure package.json**
```json
{
  "name": "my-pear-app",
  "version": "1.0.0",
  "main": "electron/main.js",
  "type": "commonjs",
  "scripts": {
    "dev": "NODE_ENV=development electron .",
    "start": "electron .",
    "gateway": "node gateway.js"
  },
  "dependencies": {
    "pear-runtime": "^0.4.3",
    "hyperswarm": "^4.7.6",
    "hyperdrive": "^11.4.1",
    "corestore": "^6.12.1",
    "b4a": "^1.6.3"
  },
  "devDependencies": {
    "electron": "^32.0.0"
  }
}
```

### **4. Create File Structure**
```
my-pear-app/
├── package.json           ✅ Entry point config
├── index.html            ✅ GUI interface  
├── electron/
│   ├── main.js           ✅ Electron main process
│   └── preload.js        ✅ IPC security bridge
├── pear-worker.js        ✅ P2P backend (Bare runtime)
├── gateway.js            ✅ HTTP bridge (optional)
└── runtime-data/         ✅ Pear runtime storage
```

## 📄 **Core Files Templates**

### **electron/main.js** - Electron Main Process
```javascript
const { app, BrowserWindow, ipcMain, shell } = require('electron')
const path = require('path')
const PearRuntime = require('pear-runtime')

// Pear Runtime Setup
const { version = '1.0.0', upgrade } = require('../package.json')

let pear = null
try {
  pear = new PearRuntime({
    dir: path.join(__dirname, '..', 'runtime-data'),
    version,
    upgrade: upgrade || 'pear://dev-placeholder',
    updates: false // Disable for development
  })
} catch (err) {
  console.log('⚠️ Pear Runtime not available:', err.message)
}

let mainWindow = null
let pearWorker = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    show: false
  })

  mainWindow.loadFile('index.html')
  
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
    if (pear) startPearBackend()
  })

  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools()
  }
}

function startPearBackend() {
  pearWorker = pear.run(path.join(__dirname, '..', 'pear-worker.js'))
  
  pearWorker.on('data', (data) => {
    try {
      const message = JSON.parse(data.toString())
      mainWindow.webContents.send('pear-message', message)
    } catch (err) {
      console.error('Worker message error:', err)
    }
  })
}

// IPC Handlers
ipcMain.handle('upload-file', async (event, { filePath, fileName }) => {
  if (pearWorker) {
    const message = JSON.stringify({ type: 'upload-file', filePath, fileName })
    pearWorker.stdin.write(message + '\n')
  }
  return { success: true }
})

ipcMain.handle('open-external', async (event, url) => {
  shell.openExternal(url)
})

app.whenReady().then(createWindow)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', async () => {
  if (pear) await pear.close()
})
```

### **electron/preload.js** - Secure IPC Bridge
```javascript
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  // File operations
  uploadFile: (filePath, fileName) => {
    return ipcRenderer.invoke('upload-file', { filePath, fileName })
  },
  
  // Message handling
  onPearMessage: (callback) => {
    ipcRenderer.on('pear-message', (event, data) => callback(data))
  },
  
  // System integration
  openExternal: (url) => {
    return ipcRenderer.invoke('open-external', url)
  },
  
  // Environment
  isElectron: true,
  platform: process.platform
})
```

### **pear-worker.js** - P2P Backend
```javascript
const Hyperswarm = require('hyperswarm')
const Hyperdrive = require('hyperdrive')
const Corestore = require('corestore')
const b4a = require('b4a')
const fs = require('fs')

let store, swarm, drive, driveKey
const { IPC } = globalThis.Bare || {}

function sendToElectron(type, data = {}) {
  const message = JSON.stringify({ type, ...data })
  if (IPC) {
    IPC.write(message)
  } else {
    process.stdout.write(message + '\n')
  }
}

async function initializePearBackend() {
  try {
    // Initialize storage
    store = new Corestore('./pear-storage')
    
    // Initialize networking
    swarm = new Hyperswarm()
    swarm.on('connection', conn => {
      store.replicate(conn)
      sendToElectron('peer-connected')
    })
    
    // Initialize drive
    drive = new Hyperdrive(store)
    await drive.ready()
    
    // Join swarm
    const discovery = swarm.join(drive.discoveryKey, { server: true, client: true })
    await discovery.flushed()
    
    driveKey = b4a.toString(drive.key, 'hex')
    sendToElectron('ready', { driveKey, pearURL: `pear://${driveKey}` })
    
  } catch (err) {
    sendToElectron('error', { message: err.message })
  }
}

async function handleFileUpload(filePath, fileName) {
  try {
    const buffer = await fs.promises.readFile(filePath)
    const drivePath = `/files/${fileName}`
    
    await drive.put(drivePath, buffer)
    
    const fileEntry = {
      fileName,
      drivePath,
      pearURL: `pear://${driveKey}${drivePath}`,
      size: buffer.length,
      uploadedAt: new Date().toISOString()
    }
    
    sendToElectron('file-uploaded', { file: fileEntry })
  } catch (err) {
    sendToElectron('error', { message: `Upload failed: ${err.message}` })
  }
}

// Message handling
function handleMessage(messageStr) {
  try {
    const { type, ...data } = JSON.parse(messageStr)
    
    switch (type) {
      case 'upload-file':
        handleFileUpload(data.filePath, data.fileName)
        break
      default:
        console.log('Unknown message type:', type)
    }
  } catch (err) {
    console.error('Message handling error:', err)
  }
}

// Setup IPC
if (IPC) {
  IPC.on('data', (data) => {
    data.toString().split('\n').filter(Boolean).forEach(handleMessage)
  })
} else {
  process.stdin.on('data', (data) => {
    data.toString().split('\n').filter(Boolean).forEach(handleMessage)
  })
}

// Cleanup
process.on('SIGINT', async () => {
  if (swarm) await swarm.destroy()
  process.exit(0)
})

// Initialize
initializePearBackend()
```

### **index.html** - GUI Interface
```html
<!DOCTYPE html>
<html>
<head>
  <title>My Pear App</title>
  <style>
    body { font-family: system-ui; padding: 2rem; background: #1a1a1a; color: white; }
    .upload-zone { 
      border: 2px dashed #555; 
      border-radius: 8px; 
      padding: 2rem; 
      text-align: center; 
      cursor: pointer;
      margin: 1rem 0;
    }
    .upload-zone:hover { border-color: #7EC845; }
    .file-list { margin-top: 2rem; }
    .file-item { 
      background: #333; 
      padding: 1rem; 
      margin: 0.5rem 0; 
      border-radius: 4px; 
    }
    .status { 
      background: #2a2a2a; 
      padding: 1rem; 
      border-radius: 4px; 
      margin-bottom: 2rem; 
    }
  </style>
</head>
<body>
  <h1>🍐 My Pear App</h1>
  
  <div class="status" id="status">
    <div id="status-text">Initializing...</div>
    <div id="drive-key"></div>
  </div>

  <div class="upload-zone" id="upload-zone">
    <input type="file" id="file-input" style="display: none;">
    <div>📁 Drop files here or click to browse</div>
  </div>

  <div class="file-list" id="file-list"></div>

  <script>
    const electronAPI = globalThis.electronAPI
    let driveKey = null
    const files = []

    // DOM elements
    const statusText = document.getElementById('status-text')
    const driveKeyEl = document.getElementById('drive-key')
    const uploadZone = document.getElementById('upload-zone')
    const fileInput = document.getElementById('file-input')
    const fileList = document.getElementById('file-list')

    // Handle messages from Pear backend
    if (electronAPI) {
      electronAPI.onPearMessage((data) => {
        switch (data.type) {
          case 'ready':
            driveKey = data.driveKey
            statusText.textContent = 'Connected to P2P network'
            driveKeyEl.textContent = `Drive: ${data.pearURL}`
            break
          case 'file-uploaded':
            addFileToUI(data.file)
            break
          case 'error':
            statusText.textContent = `Error: ${data.message}`
            break
        }
      })
    }

    // File upload handling
    uploadZone.addEventListener('click', () => fileInput.click())
    
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0]
      if (file && electronAPI) {
        electronAPI.uploadFile(file.path, file.name)
        statusText.textContent = `Uploading ${file.name}...`
      }
    })

    // Drag & drop
    uploadZone.addEventListener('dragover', (e) => {
      e.preventDefault()
      uploadZone.style.borderColor = '#7EC845'
    })
    
    uploadZone.addEventListener('dragleave', () => {
      uploadZone.style.borderColor = '#555'
    })
    
    uploadZone.addEventListener('drop', (e) => {
      e.preventDefault()
      uploadZone.style.borderColor = '#555'
      
      const file = e.dataTransfer.files[0]
      if (file && electronAPI) {
        electronAPI.uploadFile(file.path, file.name)
        statusText.textContent = `Uploading ${file.name}...`
      }
    })

    function addFileToUI(file) {
      files.push(file)
      
      const item = document.createElement('div')
      item.className = 'file-item'
      item.innerHTML = `
        <div><strong>${file.fileName}</strong></div>
        <div>Size: ${(file.size/1024/1024).toFixed(2)} MB</div>
        <div>Pear URL: ${file.pearURL}</div>
      `
      
      fileList.appendChild(item)
      statusText.textContent = `${file.fileName} uploaded successfully`
    }
  </script>
</body>
</html>
```

## 🚨 **Common Issues & Solutions**

### **Issue 1: "upgrade link required" Error**
```javascript
// ❌ Problem
const pear = new PearRuntime({ upgrade })  // undefined

// ✅ Solution  
const pear = new PearRuntime({
  upgrade: upgrade || 'pear://dev-placeholder',
  updates: false  // Disable for development
})
```

### **Issue 2: GUI Window Not Showing**
```javascript
// ❌ Old approach
pear run --dev .  // Unreliable GUI

// ✅ New approach
npm run dev  // Electron + Pear Runtime
```

### **Issue 3: Module Import Errors**
```json
// ✅ Use CommonJS for Electron compatibility
{
  "type": "commonjs",
  "main": "electron/main.js"
}
```

### **Issue 4: IPC Communication Issues**
```javascript
// ✅ Always use contextBridge for security
contextBridge.exposeInMainWorld('electronAPI', {
  // Safe API methods only
})
```

### **Issue 5: File Upload Not Working**
```javascript
// ✅ Electron provides file.path automatically
fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0]
  // file.path is available in Electron
  electronAPI.uploadFile(file.path, file.name)
})
```

## 🎯 **Development Workflow**

### **1. Start Development**
```bash
npm run dev  # Launches Electron app with DevTools
```

### **2. Optional: HTTP Gateway**
```bash
npm run gateway  # For web compatibility
```

### **3. Debug Process**
- **Electron Main**: Check terminal output
- **Renderer**: Use Chrome DevTools (F12)
- **Pear Worker**: Check console.log in terminal

### **4. File Structure Check**
```bash
# Verify structure
ls -la electron/     # main.js, preload.js
ls -la pear-worker.js
ls -la index.html
```

## 🏆 **Best Practices**

### **Security**
- ✅ Always use `contextIsolation: true`
- ✅ Always use preload scripts
- ✅ Never enable `nodeIntegration` in renderer

### **Error Handling**
- ✅ Wrap Pear Runtime initialization in try-catch
- ✅ Handle worker communication errors
- ✅ Provide fallbacks for P2P failures

### **Performance**
- ✅ Use workers for P2P operations
- ✅ Implement proper cleanup on app quit
- ✅ Monitor memory usage with many files

### **User Experience**
- ✅ Show loading states during uploads
- ✅ Provide visual feedback for P2P connections
- ✅ Handle drag & drop gracefully

## 📚 **Key Resources**

- **Electron Docs**: https://www.electronjs.org/docs
- **Pear Runtime**: https://github.com/holepunchto/pear-runtime
- **Hello Pear Electron**: https://github.com/holepunchto/hello-pear-electron
- **Hyperdrive**: https://github.com/holepunchto/hyperdrive
- **Hyperswarm**: https://github.com/holepunchto/hyperswarm

## 🔄 **Migration from Old Pear**

If converting from traditional Pear desktop apps:

1. **Install Electron + pear-runtime**
2. **Move P2P logic to worker file** 
3. **Create Electron main process**
4. **Update package.json entry point**
5. **Add secure IPC bridge**
6. **Test GUI window displays**

## 🎉 **Success Checklist**

- [ ] Desktop window opens properly
- [ ] DevTools accessible (F12)
- [ ] Pear worker starts without errors
- [ ] File drag & drop works
- [ ] P2P drive initializes
- [ ] IPC communication functional
- [ ] Error handling robust

---

**This architecture provides the reliability of Electron with the innovation of Pear's P2P technology, giving you the best of both worlds for modern desktop applications.**