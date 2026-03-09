/**
 * Create a test drive with video files (separate from gateway store)
 */
import Hyperdrive from 'hyperdrive'
import Corestore from 'corestore'
import Hyperswarm from 'hyperswarm'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const store = new Corestore(path.join(__dirname, '.test-videos-store'))
const swarm = new Hyperswarm()

// Replicate cores
swarm.on('connection', conn => {
  console.log('[swarm] peer connected')
  store.replicate(conn)
})

async function createVideoDrive() {
  console.log('🎬 Creating test video drive...')
  
  // Create a new drive
  const drive = new Hyperdrive(store)
  await drive.ready()
  
  const driveKey = drive.key.toString('hex')
  console.log('\n✅ Drive created!')
  console.log('Drive Key:', driveKey)
  
  // Join swarm so gateway can find us
  console.log('📡 Joining swarm...')
  swarm.join(drive.discoveryKey, { server: true, client: false })
  await swarm.flush()
  
  // Create fake video files
  console.log('\n📹 Adding video files...')
  const videoData = Buffer.alloc(1024 * 100, 'fake video content') // 100KB
  
  await drive.put('/videos/demo.mp4', videoData)
  await drive.put('/videos/test.webm', videoData)
  await drive.put('/videos/sample.mov', videoData)
  
  console.log('✅ Added /videos/demo.mp4')
  console.log('✅ Added /videos/test.webm')
  console.log('✅ Added /videos/sample.mov')
  
  console.log('\n🔗 Gateway URLs:')
  console.log(`Info:  http://localhost:7777/info/${driveKey}`)
  console.log(`Video: http://localhost:7777/video/${driveKey}/demo.mp4`)
  
  console.log('\n🌐 This drive is now available on the P2P network!')
  console.log('💡 Keep this script running so the gateway can connect to it.')
  console.log('💡 Press Ctrl+C to stop when done testing.')
  
  // Keep running so peers can connect
  process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down...')
    await swarm.destroy()
    await drive.close()
    process.exit(0)
  })
}

createVideoDrive().catch(console.error)