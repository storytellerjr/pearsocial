/**
 * Copy Video from Test Store to Gateway Store
 * Copies video from .test-videos-store to .gateway-store so gateway can access it
 */

import Hyperdrive from 'hyperdrive'
import Corestore from 'corestore'
import Hyperswarm from 'hyperswarm'
import b4a from 'b4a'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const TEST_STORE_PATH = path.join(__dirname, '.test-videos-store')
const GATEWAY_STORE_PATH = path.join(__dirname, '.gateway-store')

async function copyVideoToGateway() {
  const driveKey = process.argv[2]
  
  if (!driveKey) {
    console.log('❌ Please provide the drive key!')
    console.log('Usage: node copy-video-to-gateway.js DRIVE_KEY')
    console.log('\nExample: node copy-video-to-gateway.js 3fe1415391a20670cc96e3a73a4c528680ae3a9e8ddf5b4bd2720cad6b58a731')
    process.exit(1)
  }
  
  console.log('📋 Copying video to gateway store...')
  console.log(`Drive Key: ${driveKey}`)
  
  try {
    // Open source drive from test store
    const testStore = new Corestore(TEST_STORE_PATH)
    const keyBuf = b4a.from(driveKey, 'hex')
    const sourceDrive = new Hyperdrive(testStore, keyBuf)
    await sourceDrive.ready()
    
    console.log('✅ Source drive opened from test store')
    
    // Open destination drive in gateway store
    const gatewayStore = new Corestore(GATEWAY_STORE_PATH)
    const destDrive = new Hyperdrive(gatewayStore, keyBuf)
    await destDrive.ready()
    
    console.log('✅ Destination drive opened in gateway store')
    
    // List files in source
    const files = []
    for await (const entry of sourceDrive.list('/videos')) {
      files.push(entry.key)
    }
    
    console.log(`📁 Found ${files.length} files to copy:`)
    files.forEach(file => console.log(`   - ${file}`))
    
    // Copy each file
    for (const filePath of files) {
      console.log(`📤 Copying ${filePath}...`)
      const data = await sourceDrive.get(filePath)
      if (data) {
        await destDrive.put(filePath, data)
        console.log(`✅ Copied ${filePath}`)
      } else {
        console.log(`❌ Failed to read ${filePath}`)
      }
    }
    
    // Copy metadata if it exists
    try {
      const metadata = await sourceDrive.get('/videos/metadata.json')
      if (metadata) {
        await destDrive.put('/videos/metadata.json', metadata)
        console.log('✅ Copied metadata.json')
      }
    } catch (err) {
      console.log('ℹ️  No metadata to copy')
    }
    
    console.log('\n🎉 Video successfully copied to gateway store!')
    console.log('🚀 Now you can start the gateway and test the URL:')
    console.log(`   npm run gateway`)
    console.log(`   http://localhost:7777/video/${driveKey}/tests-sunset.mov`)
    
  } catch (err) {
    console.error('❌ Error copying video:', err.message)
    process.exit(1)
  }
}

copyVideoToGateway().catch(console.error)