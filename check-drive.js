/**
 * Check what files exist in our test drive
 */
import Hyperdrive from 'hyperdrive'
import Corestore from 'corestore'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const testStore = new Corestore(path.join(__dirname, '.test-videos-store'))
const gatewayStore = new Corestore(path.join(__dirname, '.gateway-store'))

async function checkDrive() {
  const driveKey = process.argv[2] || '3fe1415391a20670cc96e3a73a4c528680ae3a9e8ddf5b4bd2720cad6b58a731'
  console.log('Checking drive:', driveKey)
  
  const keyBuf = Buffer.from(driveKey, 'hex')
  
  // Check both stores
  for (const [storeName, store] of [['test-videos-store', testStore], ['gateway-store', gatewayStore]]) {
    console.log(`\n🏪 Checking ${storeName}:`)
    
    try {
      const drive = new Hyperdrive(store, keyBuf)
      await drive.ready()
      
      console.log('📂 All files:')
      let fileCount = 0
      for await (const entry of drive.list()) {
        console.log(`  ${entry.key} (${entry.value.blob?.byteLength || 0} bytes)`)
        fileCount++
      }
      
      if (fileCount === 0) {
        console.log('  (no files found)')
      }
      
      console.log('📹 Files in /videos:')
      let videoCount = 0
      try {
        for await (const entry of drive.list('/videos')) {
          console.log(`  ${entry.key} (${entry.value.blob?.byteLength || 0} bytes)`)
          videoCount++
        }
        if (videoCount === 0) {
          console.log('  (no video files found)')
        }
      } catch (err) {
        console.log(`  Error: ${err.message}`)
      }
      
      // Check for our specific file
      try {
        const entry = await drive.entry('/videos/tests-sunset.mov')
        if (entry) {
          console.log(`  ✅ tests-sunset.mov exists! (${entry.value.blob?.byteLength || 0} bytes)`)
        } else {
          console.log(`  ❌ tests-sunset.mov not found`)
        }
      } catch (err) {
        console.log(`  ❌ tests-sunset.mov error: ${err.message}`)
      }
      
    } catch (err) {
      console.log(`  Error opening drive in ${storeName}: ${err.message}`)
    }
  }
}

checkDrive().catch(console.error)