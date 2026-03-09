/**
 * Check what files exist in our test drive
 */
import Hyperdrive from 'hyperdrive'
import Corestore from 'corestore'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const store = new Corestore(path.join(__dirname, '.test-store'))

async function checkDrive() {
  const driveKey = '25ddb4c88b8383fad8766fd617e5ef9306adebbe311b6357f34119caa3c411c6'
  console.log('Checking drive:', driveKey)
  
  // Open the existing drive
  const keyBuf = Buffer.from(driveKey, 'hex')
  const drive = new Hyperdrive(store, keyBuf)
  await drive.ready()
  
  console.log('\n📂 Listing all files in drive:')
  for await (const entry of drive.list()) {
    console.log(`  ${entry.key} (${entry.value.blob?.byteLength || 0} bytes)`)
  }
  
  console.log('\n📹 Listing files in /videos folder:')
  try {
    for await (const entry of drive.list('/videos')) {
      console.log(`  ${entry.key} (${entry.value.blob?.byteLength || 0} bytes)`)
    }
  } catch (err) {
    console.log('  Error listing /videos:', err.message)
  }
  
  console.log('\n🔍 Checking specific files:')
  const testFiles = ['/videos/sample1.mp4', '/videos/sample2.webm', '/videos/test-video.mov']
  
  for (const filePath of testFiles) {
    try {
      const entry = await drive.entry(filePath)
      if (entry) {
        console.log(`  ✅ ${filePath} exists (${entry.value.blob?.byteLength || 0} bytes)`)
      } else {
        console.log(`  ❌ ${filePath} not found`)
      }
    } catch (err) {
      console.log(`  ❌ ${filePath} error: ${err.message}`)
    }
  }
  
  await drive.close()
}

checkDrive().catch(console.error)