/**
 * Create Test Video for Gateway Testing
 * Creates a small test video file and uploads it to Hyperdrive
 * so we can test the gateway streaming with Nostr clients
 */

import Hyperdrive from 'hyperdrive'
import Corestore from 'corestore'
import Hyperswarm from 'hyperswarm'
import b4a from 'b4a'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const STORE_PATH = path.join(__dirname, '.gateway-store')

async function createTestVideo() {
  console.log('🎬 Creating test video in Hyperdrive...')
  
  // Get video file path from command line argument
  const videoPath = process.argv[2]
  
  if (!videoPath) {
    console.log('❌ Please provide a video file path!')
    console.log('Usage: node create-test-video.js /path/to/your/video.mp4')
    console.log('\nExample: node create-test-video.js ~/Movies/sample.mp4')
    process.exit(1)
  }
  
  // Check if file exists
  if (!fs.existsSync(videoPath)) {
    console.log(`❌ File not found: ${videoPath}`)
    console.log('Please check the file path and try again.')
    process.exit(1)
  }
  
  // Get file info
  const stats = fs.statSync(videoPath)
  const fileName = path.basename(videoPath)
  const fileSizeMB = (stats.size / 1024 / 1024).toFixed(2)
  
  console.log(`📹 Video file: ${fileName}`)
  console.log(`📊 File size: ${fileSizeMB} MB`)
  
  // Create store and drive
  const store = new Corestore(STORE_PATH)
  const drive = new Hyperdrive(store)
  await drive.ready()
  
  const driveKey = b4a.toString(drive.key, 'hex')
  console.log(`📁 Drive created: ${driveKey}`)
  console.log(`🔗 Pear URL: pear://${driveKey}`)
  
  // Read the actual video file
  console.log('📖 Reading video file...')
  const videoContent = fs.readFileSync(videoPath)
  console.log(`✅ Video loaded: ${videoContent.length} bytes`)
  
  // Upload to hyperdrive with original filename
  const driveFileName = fileName.toLowerCase().replace(/[^a-z0-9.-]/g, '-') // Clean filename
  const drivePath = `/videos/${driveFileName}`
  
  console.log('📤 Uploading to Hyperdrive...')
  await drive.put(drivePath, videoContent)
  console.log(`✅ Video uploaded to ${drivePath}`)
  
  // Create some metadata
  const metadata = {
    fileName: fileName,
    originalPath: videoPath,
    driveFileName: driveFileName,
    size: videoContent.length,
    sizeMB: fileSizeMB,
    uploadedAt: new Date().toISOString(),
    driveKey: driveKey,
    gatewayURL: `http://localhost:7777/video/${driveKey}/${driveFileName}`,
    pearURL: `pear://${driveKey}${drivePath}`
  }
  
  await drive.put('/videos/metadata.json', Buffer.from(JSON.stringify(metadata, null, 2)))
  console.log('✅ Metadata saved')
  
  // Setup swarm for discovery
  const swarm = new Hyperswarm()
  swarm.join(drive.discoveryKey, { client: false, server: true })
  
  console.log('\n📡 Setting up P2P discovery...')
  console.log('🌐 Announcing drive to network...')
  
  // Wait a moment for announcement
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  console.log('\n🎯 Test URLs:')
  console.log(`   Gateway Health: http://localhost:7777/health`)
  console.log(`   Drive Info:     http://localhost:7777/info/${driveKey}`)
  console.log(`   Video Stream:   http://localhost:7777/video/${driveKey}/${driveFileName}`)
  console.log(`   Pear URL:       pear://${driveKey}`)
  
  console.log('\n🧪 Testing Instructions:')
  console.log('1. Start the gateway: npm run gateway')
  console.log('2. Test in browser: http://localhost:7777/health')
  console.log(`3. Test video URL:  http://localhost:7777/video/${driveKey}/${driveFileName}`)
  console.log('4. Use this URL in your Primal Nostr client')
  
  console.log('\n📝 Drive Key (save this):')
  console.log(driveKey)
  
  // Keep running to maintain P2P discovery
  console.log('\n⏳ Keeping discovery running... (Ctrl+C to stop)')
  
  process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down...')
    await swarm.destroy()
    process.exit(0)
  })
}

createTestVideo().catch(console.error)