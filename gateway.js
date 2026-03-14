/**
 * PearSocial Gateway Server
 * ─────────────────────────────────────────────────────
 * Bridges pear:// Hyperdrive content to https:// HTTP
 * so regular Nostr clients (Damus, Primal, Snort) can
 * stream videos stored in a Hyperdrive.
 *
 * Routes:
 *   GET /video/:driveKey/:fileName   → stream video from Hyperdrive
 *   GET /info/:driveKey              → drive metadata JSON
 *   GET /health                      → uptime check
 *
 * Run: node gateway.js
 * Port: 7777 (or PORT env var)
 */

import express from 'express'
import Hyperswarm from 'hyperswarm'
import Hyperdrive from 'hyperdrive'
import Corestore from 'corestore'
import b4a from 'b4a'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = process.env.PORT || 7777
const STORE_PATH = path.join(__dirname, '.gateway-store')

// ── Setup ──────────────────────────────────────────────────────────────────
const app = express()
const store = new Corestore(STORE_PATH)
const swarm = new Hyperswarm()
const driveCache = new Map()

// Replicate all opened cores on connection
swarm.on('connection', conn => {
  console.log('[swarm] peer connected')
  store.replicate(conn)
})

// ── CORS — allow Nostr clients to fetch ───────────────────────────────────
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type')
  if (req.method === 'OPTIONS') return res.sendStatus(204)
  next()
})

// ── Root ───────────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    name: 'PearSocial Gateway Server',
    version: '1.0.0',
    description: 'Bridges pear:// Hyperdrive content to https:// HTTP',
    endpoints: {
      health: '/health',
      video: '/video/:driveKey/:fileName',
      driveInfo: '/info/:driveKey'
    },
    examples: {
      health: `${req.protocol}://${req.get('host')}/health`,
      video: `${req.protocol}://${req.get('host')}/video/DRIVE_KEY_HERE/video.mp4`,
      driveInfo: `${req.protocol}://${req.get('host')}/info/DRIVE_KEY_HERE`
    }
  })
})

// ── Health ─────────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    gateway: 'PearSocial Gateway',
    drives: driveCache.size,
    uptime: process.uptime()
  })
})

// ── Drive info ─────────────────────────────────────────────────────────────
app.get('/info/:driveKey', async (req, res) => {
  try {
    const drive = await getOrOpenDrive(req.params.driveKey)
    const files = []
    for await (const entry of drive.list('/videos')) {
      files.push({
        name: entry.key,
        size: entry.value.blob?.byteLength || 0
      })
    }
    res.json({
      driveKey: req.params.driveKey,
      pearURL: `pear://${req.params.driveKey}`,
      files
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── Video stream ───────────────────────────────────────────────────────────
app.get('/video/:driveKey/:fileName', async (req, res) => {
  const { driveKey, fileName } = req.params
  const filePath = `/videos/${fileName}`

  console.log(`[gateway] request: pear://${driveKey}${filePath}`)

  try {
    const drive = await getOrOpenDrive(driveKey)

    // Check file exists
    const entry = await drive.entry(filePath)
    if (!entry) {
      return res.status(404).json({ error: `File not found: ${filePath}` })
    }

    const totalSize = entry.value.blob?.byteLength || 0
    const ext = path.extname(fileName).toLowerCase()
    const mimeTypes = {
      '.mp4':  'video/mp4',
      '.mov':  'video/quicktime',
      '.webm': 'video/webm',
      '.mkv':  'video/x-matroska',
      '.avi':  'video/x-msvideo'
    }
    const contentType = mimeTypes[ext] || 'video/mp4'

    // ── Range request support (required for video seeking) ──────────────
    const rangeHeader = req.headers.range

    if (rangeHeader && totalSize > 0) {
      const parts = rangeHeader.replace(/bytes=/, '').split('-')
      const start = parseInt(parts[0], 10)
      const end   = parts[1] ? parseInt(parts[1], 10) : totalSize - 1
      const chunkSize = end - start + 1

      res.writeHead(206, {
        'Content-Range':  `bytes ${start}-${end}/${totalSize}`,
        'Accept-Ranges':  'bytes',
        'Content-Length': chunkSize,
        'Content-Type':   contentType
      })

      const stream = drive.createReadStream(filePath, { start, end })
      stream.pipe(res)
      stream.on('error', err => {
        console.error('[gateway] stream error:', err.message)
        if (!res.headersSent) res.status(500).end()
      })
    } else {
      // Full file
      res.writeHead(200, {
        'Content-Length': totalSize,
        'Content-Type':   contentType,
        'Accept-Ranges':  'bytes'
      })
      const stream = drive.createReadStream(filePath)
      stream.pipe(res)
      stream.on('error', err => {
        console.error('[gateway] stream error:', err.message)
        if (!res.headersSent) res.status(500).end()
      })
    }

  } catch (err) {
    console.error('[gateway] error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// ── Open/cache Hyperdrive by key ───────────────────────────────────────────
async function getOrOpenDrive (driveKeyHex) {
  if (driveCache.has(driveKeyHex)) {
    return driveCache.get(driveKeyHex)
  }

  console.log(`[gateway] opening drive: ${driveKeyHex.slice(0,16)}...`)

  const keyBuf = b4a.from(driveKeyHex, 'hex')
  const drive  = new Hyperdrive(store, keyBuf)
  await drive.ready()

  // Join swarm to find peers with this drive
  swarm.join(drive.discoveryKey, { client: true, server: false })
  await swarm.flush()

  driveCache.set(driveKeyHex, drive)
  console.log(`[gateway] drive ready: pear://${driveKeyHex}`)

  return drive
}

// ── Start ──────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════╗
║           PearSocial Gateway Server              ║
╠══════════════════════════════════════════════════╣
║  HTTP:    http://localhost:${PORT}                  ║
║  Video:   /video/:driveKey/:fileName             ║
║  Info:    /info/:driveKey                        ║
║  Health:  /health                                ║
╠══════════════════════════════════════════════════╣
║  Bridges pear:// → https:// for Damus/Primal     ║
╚══════════════════════════════════════════════════╝
  `)
})

// ── Graceful shutdown ──────────────────────────────────────────────────────
process.on('SIGINT', async () => {
  console.log('\n[gateway] shutting down...')
  await swarm.destroy()
  process.exit(0)
})
