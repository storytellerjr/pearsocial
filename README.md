# 🍐 PearSocial

> **Decentralized video sharing that works TODAY**

**Created by**: Storyteller  
**Architecture**: Modern **Electron + Pear Runtime** desktop application with P2P networking  
**Status**: 🟢 **WORKING** - Real video streaming to Primal tested & functional!

## 🚀 **What Works Right Now**:

✅ **Upload real videos** via command line  
✅ **Stream to Primal** Nostr client (tested with 28MB MOV file)  
✅ **P2P storage** in Hyperdrive with Hyperswarm discovery  
✅ **HTTP gateway** bridges P2P to web with range requests  
✅ **Multiple videos** supported (each gets own drive/URL)  
✅ **All video formats** - MP4, MOV, WebM, MKV, AVI  

**Quick Demo**:
```bash
npm run gateway                           # Start bridge server
node add-video.js ~/Downloads/video.mp4   # Upload your video
# Share the URL in Primal → Video streams from P2P! 🎬
```

---

## 🎯 Current Status

### ✅ **Working Components**:
- **🖥️ Electron Desktop App**: Beautiful native window with proper GUI
- **🍐 Pear Runtime**: P2P functionality running in Bare worker  
- **🌐 HTTP Gateway**: Fully functional P2P-to-HTTP bridge (`localhost:7777`)
- **📡 Hyperswarm Networking**: P2P discovery and replication working
- **💾 Hyperdrive Storage**: Video storage and streaming operational
- **🎨 Beautiful UI**: Dark theme interface restored and functional
- **🎬 Video Streaming**: Real video playback in browsers and Nostr clients
- **📱 Primal Integration**: Tested and working with Primal Nostr client

### ⚠️ **Known Issue**:
- **macOS File Upload**: File dialog issue on macOS 26+ (see `issues.md`)
- **Workaround Available**: Use command-line video upload scripts
- **Status**: Seeking community solutions for macOS compatibility

---

## 🏗️ Architecture

**Modern Pear Desktop App (2026)**:
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Electron GUI   │    │  Pear Worker    │    │  HTTP Gateway   │
│  (Desktop App)  │◄──►│  (P2P Backend)  │◄──►│  (Web Bridge)   │
│  index.html     │    │  pear-worker.js │    │  gateway.js     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

**File Structure**:
```
pearsocial/
├── electron/
│   ├── main.js           ✅ Electron main process + Pear Runtime
│   └── preload.js        ✅ Secure IPC bridge
├── pear-worker.js        ✅ P2P backend (Hyperdrive + Hyperswarm)
├── gateway.js            ✅ HTTP bridge server
├── index.html            ⚠️ Currently debug version
├── index-fixed.html      ✅ Production UI ready
└── package.json          ✅ Electron + Pear Runtime config
```

---

## 🚀 Installation & Setup

### **Prerequisites**:
```bash
npm install -g electron  # Desktop framework
# Pear CLI optional (for legacy pear:// URL generation)
```

### **Install Dependencies**:
```bash
cd pearsocial
npm install
```

### **Dependencies**:
- **`electron`**: Desktop application framework
- **`pear-runtime`**: Embeddable P2P functionality
- **`hyperdrive`**: Distributed file storage
- **`hyperswarm`**: P2P networking and discovery
- **`express`**: HTTP gateway server

---

## 🖥️ Running the App

### **Option 1: Full Stack (Recommended)**
```bash
# Terminal 1: Start HTTP Gateway
npm run gateway

# Terminal 2: Start Desktop App  
npm run dev

# ✅ Result: Desktop window + P2P backend + HTTP bridge
```

### **Option 2: Gateway Only (For Testing)**
```bash
npm run gateway
# ✅ Result: HTTP bridge server for video streaming
```

### **Option 3: Desktop App Only**
```bash
npm run dev
# ✅ Result: Desktop app with P2P (no web compatibility)
```

### **Option 4: Production Mode**
```bash
npm start
# ✅ Result: Optimized build without DevTools
```

---

## 🔧 Development Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Launch Electron app in development mode |
| `npm run gateway` | Start HTTP bridge server |
| `npm start` | Run production Electron app |
| `node add-video.js <path>` | Upload video to new Hyperdrive |
| `node create-test-video.js <path>` | Create test video with discovery |
| `node check-drive.js [key]` | Debug drive contents |
| `npm run pear-legacy` | Legacy Pear desktop mode (not recommended) |

---

## 🎮 How It Works

### **1. Video Upload Flow (Command Line)**:
```bash
# Upload any video file to new Hyperdrive
node add-video.js ~/Downloads/myvideo.mp4

# ✅ Creates new drive, uploads video, starts P2P discovery
# ✅ Returns gateway URL for sharing
```

### **2. Video Streaming Flow**:
```
[Video stored in Hyperdrive P2P]
        ↓
[Gateway bridges pear:// to HTTP]
        ↓
[http://localhost:7777/video/key/file.mp4]
        ↓
[Compatible with Primal, browsers, any Nostr client]
```

### **3. Nostr Integration**:
```
[Share gateway URL in Primal note]
        ↓
[Primal fetches video via HTTP]
        ↓
[Video streams from P2P network]
        ↓
[Decentralized video in centralized client!]
```

### **4. Network Architecture**:
- **Desktop App**: User interface and file management
- **Upload Scripts**: Command-line video upload (macOS workaround)
- **Pear Worker**: P2P storage and networking (Bare runtime)
- **HTTP Gateway**: Web compatibility bridge with streaming support
- **Hyperswarm**: Peer discovery and connection
- **Hyperdrive**: Distributed file storage with range request support

---

## 🌐 Gateway Endpoints

| Endpoint | Purpose | Features |
|----------|---------|----------|
| `GET /` | API documentation | Lists all endpoints |
| `GET /health` | Gateway status check | Shows uptime, drive count |
| `GET /info/:driveKey` | Drive metadata and file list | JSON file listing |
| `GET /video/:driveKey/:fileName` | Stream video file | Range requests, proper MIME types |

**Example Usage**:
```bash
# Check gateway status
curl http://localhost:7777/health

# List videos in drive
curl http://localhost:7777/info/ceb0fd509...

# Stream video (supports range requests for seeking)
curl -H "Range: bytes=0-1024" http://localhost:7777/video/ceb0fd509.../video.mp4
```

**Working Example**:
```bash
# Real working video URL (28MB sunset MOV file)
http://localhost:7777/video/ceb0fd509a129638981484f42f3a4a01a950bcf2249d1a3e84e771ae7e46e636/tests-sunset.mov
```

---

## 🎬 Video Upload & Sharing

### **Quick Start - Upload Your First Video**:

**1. Start the Gateway**:
```bash
npm run gateway
# Keep this running
```

**2. Upload a Video**:
```bash
# Upload any video file (MP4, MOV, WebM, etc.)
node add-video.js ~/Downloads/yourvideo.mp4

# ✅ Output includes gateway URL for sharing
```

**3. Share in Primal**:
```text
Check out this P2P video! 🎬

http://localhost:7777/video/[DRIVE_KEY]/yourvideo.mp4
```

### **Supported Video Formats**:
- **MP4** - Best browser compatibility
- **MOV** - Converted to MP4 MIME type for streaming  
- **WebM** - Chrome/Firefox optimized
- **MKV** - High quality containers
- **AVI** - Legacy format support

### **Upload Multiple Videos**:
```bash
# Each video gets its own Hyperdrive and URL
node add-video.js ~/Movies/video1.mp4
node add-video.js ~/Movies/video2.mov  
node add-video.js ~/Movies/video3.webm

# All work simultaneously with the gateway
```

### **Video Upload Features**:
- ✅ **Real file streaming** - Not just test content
- ✅ **Range request support** - Video seeking/scrubbing works
- ✅ **CORS enabled** - Works with web Nostr clients
- ✅ **Multiple formats** - Auto MIME type detection
- ✅ **P2P discovery** - Automatic peer discovery
- ✅ **No conflicts** - Multiple videos, separate drives
- ✅ **Instant sharing** - URLs ready immediately

---

## 🔗 Integration Examples

### **Tested Nostr Clients**:
- ✅ **Primal** (primal.net) - Full video streaming support
- ✅ **Web browsers** - Direct video playback  
- 🔄 **Others** - Should work with any HTTP-compatible client

### **Nostr Event (NIP-94)**:
```json
{
  "kind": 1063,
  "tags": [
    ["url", "http://localhost:7777/video/ceb0fd509.../tests-sunset.mov"],
    ["pear", "pear://ceb0fd509.../videos/tests-sunset.mov"],
    ["m", "video/mp4"],
    ["size", "29793563"],
    ["t", "pearsocial"],
    ["t", "p2p"],
    ["t", "hyperdrive"]
  ],
  "content": "Sunset video streaming from P2P network! 🌅"
}
```

### **Direct Browser Access**:
```html
<!-- Any web browser can access via gateway -->
<video controls width="100%">
  <source src="http://localhost:7777/video/ceb0fd509.../tests-sunset.mov" type="video/mp4">
  Your browser doesn't support video streaming.
</video>
```

### **Real Working Example** (Primal-tested):
```text
🎬 P2P Video Demo

28MB sunset footage streaming from Hyperdrive:
http://localhost:7777/video/ceb0fd509a129638981484f42f3a4a01a950bcf2249d1a3e84e771ae7e46e636/tests-sunset.mov

#pearsocial #p2p #hyperdrive
```

---

## 🚀 Production Deployment

### **Desktop App Distribution**:
```bash
# Build distributables
npm install -g @electron-forge/cli
electron-forge make

# Creates platform-specific installers in out/
```

### **Gateway Server (VPS/Umbrel)**:
```bash
# On your server
PORT=7777 node gateway.js

# With reverse proxy (nginx)
proxy_pass http://localhost:7777;

# Result: https://your-domain.com/video/:key/:file
```

---

## 📋 Troubleshooting

### **Common Issues**:

**1. macOS File Upload Issue**:
- **Status**: Dialog opens but can't select files on macOS 26+
- **Workaround**: Use `node add-video.js <path>` command
- **Solution**: Under investigation (see `issues.md`)

**2. Port 7777 Already in Use**:
```bash
lsof -i :7777        # Find process using port
kill <PID>           # Kill conflicting process
npm run gateway      # Restart gateway
```

**3. Video Downloads Instead of Streaming**:
- **Solution**: Gateway now sends proper `Content-Disposition: inline` headers
- **Fixed**: Videos stream inline in browsers and Nostr clients

**4. Gateway Not Finding Videos**:
```bash
# Check what's in your drive
node check-drive.js [driveKey]

# Ensure gateway is running
curl http://localhost:7777/health
```

**5. P2P Discovery Issues**:
- Keep upload script running for discovery
- Each video needs its own discovery process
- Gateway handles multiple drives automatically

### **Debug Resources**:
- `issues.md` - Detailed issue tracking
- `lessons_learned.md` - Development insights
- `pear-electron-skill.md` - Architecture guide
- DevTools Console (F12) - Runtime debugging

---

## 🎯 Roadmap

### **Immediate (Current Sprint)**:
- [x] **Video streaming working** ✅ Completed - Primal tested
- [x] **HTTP gateway functional** ✅ Range requests, MIME types
- [x] **Real video upload** ✅ Command-line scripts working
- [ ] **Fix macOS file dialog** for UI uploads
- [ ] **Drag & drop support** in Electron app

### **Short Term**:
- [x] **Multiple video support** ✅ Each gets own drive/URL
- [ ] **File type validation** and conversion
- [ ] **Video thumbnails** and preview generation
- [ ] **Progress indicators** for uploads
- [ ] **Automatic Nostr publishing** (NIP-94)

### **Medium Term**:
- [ ] **Multi-drive management** UI (organize videos)
- [ ] **Peer management** interface (view connections)
- [ ] **Remote gateway support** (deploy on VPS)
- [ ] **Video discovery** (browse P2P videos)
- [ ] **Search functionality** (find videos by tags)

### **Future Vision**:
- [ ] **AES encryption** for private content
- [ ] **Lightning payments** (NIP-57 zaps)
- [ ] **Live streaming** support (HLS over P2P)
- [ ] **Mobile companion** app
- [ ] **Keet integration** for identity/contacts
- [ ] **IPFS bridge** for wider compatibility

---

## 🤝 Contributing

### **Development Setup**:
1. Clone repository
2. `npm install`
3. `npm run dev` (start development)
4. Open DevTools (F12) for debugging

### **Key Files**:
- `electron/main.js` - Electron main process
- `electron/preload.js` - IPC security bridge  
- `pear-worker.js` - P2P backend logic
- `index.html` - UI interface
- `gateway.js` - HTTP bridge server

### **Testing**:
- Upload functionality (once click events fixed)
- P2P drive sharing between instances
- HTTP gateway video streaming
- Cross-platform compatibility

---

## 📚 Resources

- **Electron + Pear Guide**: `pear-electron-skill.md`
- **Architecture Decisions**: `lessons_learned.md`
- **Current Issues**: `issues.md`
- **Pear Runtime**: https://github.com/holepunchto/pear-runtime
- **Electron Docs**: https://www.electronjs.org/docs
- **Hyperdrive**: https://github.com/holepunchto/hyperdrive
- **Hyperswarm**: https://github.com/holepunchto/hyperswarm

---

## 📄 License

MIT License - Feel free to fork and build upon this P2P video sharing foundation!

---

**Created by Storyteller**

**Built with ❤️ using Electron + Pear Runtime**  
*Bridging the gap between P2P innovation and user experience*