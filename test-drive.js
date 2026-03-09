/**
 * Generate a test Hyperdrive with sample video files
 */
import Hyperdrive from 'hyperdrive'
import Corestore from 'corestore'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const store = new Corestore(path.join(__dirname, '.gateway-store'))

async function createTestDrive() {
  console.log('Creating test Hyperdrive with video files...')
  
  // Create a new drive (this will generate a new key)
  const drive = new Hyperdrive(store)
  await drive.ready()
  
  const driveKey = drive.key.toString('hex')
  console.log('\n✅ Test Drive Created!')
  console.log('Drive Key:', driveKey)
  console.log('Drive Key Length:', driveKey.length, 'characters')
  
  // Create sample video files (dummy data for testing)
  console.log('\n📹 Adding sample video files...')
  
  // Create fake video file data
  const dummyVideoData = Buffer.alloc(1024 * 50, 'sample video data') // 50KB fake video
  
  await drive.put('/videos/sample1.mp4', dummyVideoData)
  await drive.put('/videos/sample2.webm', dummyVideoData)
  await drive.put('/videos/test-video.mov', dummyVideoData)
  
  console.log('✅ Added /videos/sample1.mp4')
  console.log('✅ Added /videos/sample2.webm') 
  console.log('✅ Added /videos/test-video.mov')
  
  console.log('\n🔗 Test URLs:')
  console.log(`Info:     http://localhost:7777/info/${driveKey}`)
  console.log(`Video 1:  http://localhost:7777/video/${driveKey}/sample1.mp4`)
  console.log(`Video 2:  http://localhost:7777/video/${driveKey}/sample2.webm`)
  console.log(`Video 3:  http://localhost:7777/video/${driveKey}/test-video.mov`)
  
  console.log('\n💡 Now the /info endpoint should show these video files!')
  
  await drive.close()
}

createTestDrive().catch(console.error)