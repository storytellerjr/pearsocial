import Hyperswarm from 'hyperswarm'
import Hyperdrive from 'hyperdrive'
import Corestore from 'corestore'
import b4a from 'b4a'

// ── Import Pear stdio for GUI support ──────────────────────────────────────
import stdio from 'pear-stdio'
const { Pear } = globalThis

// ── Initialize GUI ──────────────────────────────────────────────────────────
if (Pear?.config?.options?.type === 'desktop') {
  console.log('Initializing desktop GUI...')
  // The index.html file will be automatically loaded as the GUI
}

// ── State ──────────────────────────────────────────────────────────────────
let store, swarm, drive, pearKey
const uploadedVideos = []

// ── Check Pear environment ─────────────────────────────────────────────────
console.log('Pear environment check:')
console.log('- Pear:', typeof Pear)
console.log('- Pear.config:', Pear?.config)
console.log('- GUI enabled:', Pear?.config?.options?.type === 'desktop')

// ── Boot ───────────────────────────────────────────────────────────────────
async function boot () {
  try {
    log('🥾 Starting PearSocial...')
    
    // Initialize Corestore with Pear's storage directory or fallback
    const storagePath = globalThis.Pear?.config?.storage || './storage'
    store = new Corestore(storagePath)
    log('📂 Storage initialized')

    // Initialize Hyperswarm
    swarm = new Hyperswarm()
    
    // Setup teardown if Pear is available
    if (globalThis.Pear?.teardown) {
      globalThis.Pear.teardown(() => swarm.destroy())
    } else {
      process.on('SIGINT', () => swarm.destroy())
    }
    
    swarm.on('connection', conn => {
      store.replicate(conn)
      log('🤝 Peer connected')
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
    console.log('PearKey:', pearKey)
    
    // Load existing videos
    await loadExistingVideos()
    
  } catch (err) {
    console.error('Boot error:', err)
    log(`❌ Boot error: ${err.message}`)
  }
}

// ── Load existing videos from drive ────────────────────────────────────────
async function loadExistingVideos () {
  try {
    log('🔍 Scanning for existing videos...')
    let videoCount = 0
    
    for await (const entry of drive.list('/videos')) {
      if (entry.key.endsWith('.mp4') || entry.key.endsWith('.webm') || entry.key.endsWith('.mov') || entry.key.endsWith('.avi')) {
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
        console.log('Found video:', videoEntry)
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

// ── File upload handler (for future IPC integration) ──────────────────────
async function handleUpload (filePath, fileName) {
  try {
    log(`📤 Uploading ${fileName}...`)
    
    // Read file from filesystem (fallback to Node.js if Pear.fs unavailable)
    const fs = globalThis.Pear?.fs || (await import('fs')).promises
    const buffer = await fs.readFile(filePath)
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
    log(`✅ Uploaded: ${fileName} (${(buffer.length / 1024 / 1024).toFixed(2)} MB)`)
    console.log('Video uploaded successfully:', videoEntry)
    
  } catch (err) {
    console.error('Upload error:', err)
    log(`❌ Upload failed: ${err.message}`)
  }
}

// ── Gateway status checker ─────────────────────────────────────────────────
async function checkGatewayStatus () {
  try {
    const response = await fetch('http://localhost:7777/health')
    if (response.ok) {
      const data = await response.json()
      log(`🌐 Gateway online (${data.drives} drives)`)
    } else {
      throw new Error('Gateway not responding')
    }
  } catch (err) {
    log('⚠️ Gateway not running - start with: npm run gateway')
  }
}

// ── Simple logging function ────────────────────────────────────────────────
function log (msg) {
  console.log(`[PearSocial] ${msg}`)
}

// ── Start the application ──────────────────────────────────────────────────
boot().then(() => {
  // Check gateway status periodically  
  checkGatewayStatus()
  setInterval(checkGatewayStatus, 30000) // Check every 30 seconds
  
  // Keep the process alive
  console.log('PearSocial backend ready!')
}).catch(err => {
  console.error('Fatal error:', err)
  log(`❌ Fatal error: ${err.message}`)
})