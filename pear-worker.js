// ── PearSocial Backend Worker ──────────────────────────────────────────────
// This runs in a Bare runtime via pear-runtime and handles all P2P functionality

const Hyperswarm = require('hyperswarm')
const Hyperdrive = require('hyperdrive')
const Corestore = require('corestore')
const b4a = require('b4a')
const fs = require('fs')

// ── State ──────────────────────────────────────────────────────────────────
let store, swarm, drive, pearKey
const uploadedVideos = []

// ── IPC with Electron main process ────────────────────────────────────────
const { IPC } = globalThis.Bare || {}

// ── Helper: Send messages to Electron ─────────────────────────────────────
function sendToElectron(type, data = {}) {
  const message = JSON.stringify({ type, ...data })
  if (IPC) {
    IPC.write(message)
  } else {
    // Fallback for development
    process.stdout.write(message + '\n')
  }
}

// ── Helper: Log messages ──────────────────────────────────────────────────
function log(msg) {
  console.log(`[PearWorker] ${msg}`)
  sendToElectron('log', { message: msg })
}

// ── Boot P2P System ───────────────────────────────────────────────────────
async function boot() {
  try {
    log('🥾 Starting PearSocial P2P backend...')
    
    // Initialize Corestore in current directory
    const storagePath = './pear-storage'
    store = new Corestore(storagePath)
    log('📂 Storage initialized')

    // Initialize Hyperswarm
    swarm = new Hyperswarm()
    
    swarm.on('connection', conn => {
      store.replicate(conn)
      log('🤝 Peer connected')
      sendToElectron('peer-connected', { count: swarm.connections.size })
    })
    
    log('🌐 Swarm initialized')

    // Initialize Hyperdrive
    drive = new Hyperdrive(store)
    await drive.ready()
    
    // Join swarm
    const discovery = swarm.join(drive.discoveryKey, { server: true, client: true })
    await discovery.flushed()

    pearKey = b4a.toString(drive.key, 'hex')
    
    log(`✅ Drive ready — pear://${pearKey}`)
    sendToElectron('ready', { pearKey })
    
    // Load existing videos
    await loadExistingVideos()
    
    // Check gateway periodically
    checkGatewayStatus()
    setInterval(checkGatewayStatus, 30000)
    
  } catch (err) {
    console.error('Boot error:', err)
    log(`❌ Boot error: ${err.message}`)
    sendToElectron('error', { message: `Boot error: ${err.message}` })
  }
}

// ── Load existing videos from drive ───────────────────────────────────────
async function loadExistingVideos() {
  try {
    log('🔍 Scanning for existing videos...')
    let videoCount = 0
    
    for await (const entry of drive.list('/videos')) {
      if (entry.key.match(/\.(mp4|webm|mov|avi)$/i)) {
        const fileName = entry.key.split('/').pop()
        const videoEntry = {
          fileName,
          drivePath: entry.key,
          pearURL: `pear://${pearKey}${entry.key}`,
          gatewayURL: `http://localhost:7777/video/${pearKey}/${fileName}`,
          size: entry.value.blob?.byteLength || 0,
          uploadedAt: new Date().toISOString()
        }
        
        uploadedVideos.push(videoEntry)
        sendToElectron('uploaded', { video: videoEntry })
        videoCount++
      }
    }
    
    if (videoCount > 0) {
      log(`📹 Found ${videoCount} existing video(s)`)
    } else {
      log('📂 No existing videos found')
    }
  } catch (err) {
    console.error('Error loading videos:', err)
    log('⚠️ Error scanning for existing videos')
  }
}

// ── File upload handler ───────────────────────────────────────────────────
async function handleUpload(filePath, fileName) {
  try {
    log(`📤 Uploading ${fileName}...`)
    
    // Read file from filesystem
    const buffer = await fs.promises.readFile(filePath)
    const drivePath = `/videos/${fileName}`
    
    // Store in Hyperdrive
    await drive.put(drivePath, buffer)
    
    const videoEntry = {
      fileName,
      drivePath,
      pearURL: `pear://${pearKey}/videos/${fileName}`,
      gatewayURL: `http://localhost:7777/video/${pearKey}/${fileName}`,
      size: buffer.length,
      uploadedAt: new Date().toISOString()
    }

    uploadedVideos.push(videoEntry)
    sendToElectron('uploaded', { video: videoEntry })
    log(`✅ Uploaded: ${fileName} (${(buffer.length / 1024 / 1024).toFixed(2)} MB)`)
    
    console.log('Video uploaded successfully:', videoEntry)
    
  } catch (err) {
    console.error('Upload error:', err)
    log(`❌ Upload failed: ${err.message}`)
    sendToElectron('error', { message: `Upload failed: ${err.message}` })
  }
}

// ── Gateway status checker ────────────────────────────────────────────────
async function checkGatewayStatus() {
  try {
    const response = await fetch('http://localhost:7777/health')
    if (response.ok) {
      const data = await response.json()
      sendToElectron('gateway-status', { online: true, data })
    } else {
      throw new Error('Gateway not responding')
    }
  } catch (err) {
    sendToElectron('gateway-status', { online: false, error: err.message })
  }
}

// ── Message handler from Electron ─────────────────────────────────────────
function handleMessage(messageStr) {
  try {
    const { type, ...data } = JSON.parse(messageStr)
    
    switch (type) {
      case 'upload-video':
        handleUpload(data.filePath, data.fileName)
        break
        
      case 'get-videos':
        sendToElectron('videos-list', { videos: uploadedVideos })
        break
        
      case 'get-drive-key':
        if (pearKey) {
          sendToElectron('drive-key', { pearKey })
        }
        break
        
      default:
        console.log('Unknown message type:', type)
    }
  } catch (err) {
    console.error('Error handling message:', err)
  }
}

// ── Setup message handling ────────────────────────────────────────────────
if (IPC) {
  // Running in Bare runtime
  IPC.on('data', (data) => {
    const lines = data.toString().split('\n').filter(line => line.trim())
    lines.forEach(handleMessage)
  })
} else {
  // Development fallback - read from stdin
  process.stdin.on('data', (data) => {
    const lines = data.toString().split('\n').filter(line => line.trim())
    lines.forEach(handleMessage)
  })
}

// ── Cleanup on exit ───────────────────────────────────────────────────────
process.on('SIGINT', async () => {
  log('🛑 Shutting down Pear worker...')
  if (swarm) await swarm.destroy()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  log('🛑 Shutting down Pear worker...')
  if (swarm) await swarm.destroy()
  process.exit(0)
})

// ── Start the backend ─────────────────────────────────────────────────────
log('🍐 PearSocial P2P worker initializing...')
boot().catch(err => {
  console.error('Fatal error in Pear worker:', err)
  sendToElectron('error', { message: `Fatal error: ${err.message}` })
  process.exit(1)
})