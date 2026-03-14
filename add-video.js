/**
 * Add Video to New Drive 
 * Creates a new Hyperdrive and uploads a video file
 * Works alongside running gateway by using separate temporary store
 */

import Hyperdrive from 'hyperdrive'
import Corestore from 'corestore'
import Hyperswarm from 'hyperswarm'
import b4a from 'b4a'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function addVideoToNewDrive() {
  // Get video file path from command line argument
  const videoPath = process.argv[2]
  
  if (!videoPath) {
    console.log('❌ Please provide a video file path!')
    console.log('Usage: node add-video.js /path/to/your/video.mp4')
    console.log('\nExample: node add-video.js ~/Downloads/anothervideo.mp4')
    process.exit(1)
  }
  
  // Check if file exists
  if (!fs.existsSync(videoPath)) {
    console.log(`❌ File not found: ${videoPath}`)
    process.exit(1)
  }
  
  // Get file info
  const stats = fs.statSync(videoPath)
  const fileName = path.basename(videoPath)
  const fileSizeMB = (stats.size / 1024 / 1024).toFixed(2)
  
  console.log(`🎬 Adding new video to PearSocial...`)
  console.log(`📹 Video file: ${fileName}`)
  console.log(`📊 File size: ${fileSizeMB} MB`)
  
  // Create temporary store for this upload
  const tempStorePath = path.join(__dirname, `.temp-store-${Date.now()}`)
  const tempStore = new Corestore(tempStorePath)
  
  // Create new drive
  const drive = new Hyperdrive(tempStore)
  await drive.ready()
  
  const driveKey = b4a.toString(drive.key, 'hex')
  console.log(`📁 New drive created: ${driveKey}`)
  
  // Read and upload video
  console.log('📖 Reading video file...')
  const videoContent = fs.readFileSync(videoPath)
  
  const driveFileName = fileName.toLowerCase().replace(/[^a-z0-9.-]/g, '-')
  const drivePath = `/videos/${driveFileName}`
  
  console.log('📤 Uploading to new Hyperdrive...')
  await drive.put(drivePath, videoContent)
  console.log(`✅ Video uploaded to ${drivePath}`)
  
  // Create metadata
  const metadata = {
    fileName: fileName,
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
  swarm.on('connection', conn => {
    tempStore.replicate(conn)
  })
  
  swarm.join(drive.discoveryKey, { client: false, server: true })
  
  console.log('\n🎯 Your new video URLs:')
  console.log(`   Video Stream:   http://localhost:7777/video/${driveKey}/${driveFileName}`)
  console.log(`   Drive Info:     http://localhost:7777/info/${driveKey}`)
  console.log(`   Pear URL:       pear://${driveKey}`)
  
  console.log('\n📝 Drive Key (save this):')
  console.log(driveKey)
  
  console.log('\n📋 For Primal/Nostr:')
  console.log(`http://localhost:7777/video/${driveKey}/${driveFileName}`)
  
  console.log('\n⚠️  Important: Keep this process running for P2P discovery!')
  console.log('⏳ Keeping discovery running... (Ctrl+C to stop)')
  
  // Keep running to maintain P2P discovery
  process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down...')
    await swarm.destroy()
    
    // Clean up temp store
    try {
      fs.rmSync(tempStorePath, { recursive: true, force: true })
      console.log('🧹 Cleaned up temporary store')
    } catch (err) {
      console.log('⚠️  Could not clean up temp store:', err.message)
    }
    
    process.exit(0)
  })
}

addVideoToNewDrive().catch(console.error)