# 🍐 PearSocial

> **P2P Desktop Video Sharing** — Store videos in **Hyperdrive**, bridge to **HTTP**, compatible with **Nostr clients**

**Created by**: Storyteller

**Architecture**: Modern **Electron + Pear Runtime** desktop application with P2P networking

---

## 🎯 Current Status

### ✅ **Working Components**:
- **🖥️ Electron Desktop App**: Beautiful native window with proper GUI
- **🍐 Pear Runtime**: P2P functionality running in Bare worker  
- **🌐 HTTP Gateway**: Bridge between P2P and web (`localhost:7777`)
- **📡 Hyperswarm Networking**: P2P discovery and replication
- **💾 Hyperdrive Storage**: Distributed video file storage
- **🎨 Beautiful UI**: Dark theme interface with modern design

### ⚠️ **Known Issue**:
- **Click Events**: Currently debugging Electron context isolation issue
- **Upload**: Temporarily non-functional while fixing event handlers
- **Status**: See `issues.md` for detailed debugging information

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

### **Option 2: Desktop App Only**
```bash
npm run dev
# ✅ Result: Desktop app with P2P (no web compatibility)
```

### **Option 3: Production Mode**
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
| `npm run pear-legacy` | Legacy Pear desktop mode (not recommended) |

---

## 🎮 How It Works

### **1. Video Upload Flow**:
```
[User drags video into app]
        ↓
[Electron shows native file picker]
        ↓
[Pear worker stores in Hyperdrive]
        ↓
[Video replicated via Hyperswarm P2P]
        ↓
[pear://key/videos/filename available]
```

### **2. HTTP Gateway Bridge**:
```
[P2P pear://key/videos/file.mp4]
        ↓
[Gateway bridges to HTTP]
        ↓
[http://localhost:7777/video/key/file.mp4]
        ↓
[Compatible with Nostr clients]
```

### **3. Network Architecture**:
- **Desktop App**: User interface and file management
- **Pear Worker**: P2P storage and networking (Bare runtime)
- **HTTP Gateway**: Web compatibility bridge
- **Hyperswarm**: Peer discovery and connection
- **Hyperdrive**: Distributed file storage

---

## 🌐 Gateway Endpoints

| Endpoint | Purpose |
|----------|---------|
| `GET /health` | Gateway status check |
| `GET /info/:driveKey` | Drive metadata and file list |
| `GET /video/:driveKey/:fileName` | Stream video file |

**Example**:
```bash
# Check gateway status
curl http://localhost:7777/health

# List videos in drive
curl http://localhost:7777/info/abc123...

# Stream video
curl http://localhost:7777/video/abc123.../video.mp4
```

---

## 🔗 Integration Examples

### **Nostr Event (NIP-94)**:
```json
{
  "kind": 1063,
  "tags": [
    ["url", "http://localhost:7777/video/driveKey/video.mp4"],
    ["pear", "pear://driveKey/videos/video.mp4"],
    ["m", "video/mp4"],
    ["size", "15728640"],
    ["t", "pearsocial"],
    ["t", "p2p"]
  ],
  "content": "Check out this P2P video!"
}
```

### **Direct Browser Access**:
```html
<!-- Any web browser can access via gateway -->
<video controls>
  <source src="http://localhost:7777/video/driveKey/video.mp4" type="video/mp4">
</video>
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

**1. Click Events Not Working**:
- **Status**: Known issue with Electron context isolation
- **Solution**: Under investigation (see `issues.md`)
- **Workaround**: Use DevTools console to test functions

**2. Port 7777 Already in Use**:
```bash
lsof -i :7777        # Find process using port
kill <PID>           # Kill conflicting process
```

**3. Pear Worker Not Starting**:
- Check terminal output for Pear Runtime errors
- Verify dependencies installed correctly

**4. Gateway Not Accessible**:
- Confirm gateway is running on localhost:7777
- Check firewall settings for port 7777

### **Debug Resources**:
- `issues.md` - Detailed issue tracking
- `lessons_learned.md` - Development insights
- `pear-electron-skill.md` - Architecture guide
- DevTools Console (F12) - Runtime debugging

---

## 🎯 Roadmap

### **Immediate (Current Sprint)**:
- [ ] **Fix click event handling** in Electron context
- [ ] **Restore beautiful UI** after debugging
- [ ] **Complete upload workflow** end-to-end testing
- [ ] **Drag & drop support** for file uploads

### **Short Term**:
- [ ] **File type validation** and conversion
- [ ] **Video thumbnails** and preview
- [ ] **Progress indicators** for uploads
- [ ] **Real Nostr integration** (NIP-94 publishing)

### **Medium Term**:
- [ ] **Multi-drive support** (organize videos)
- [ ] **Peer management** UI (view connections)
- [ ] **Gateway management** (remote gateways)
- [ ] **Update mechanism** (Pear app updates)

### **Future Vision**:
- [ ] **AES encryption** for private content
- [ ] **Lightning payments** (NIP-57 zaps)
- [ ] **Live streaming** support (HLS)
- [ ] **Mobile companion** app
- [ ] **Keet integration** for identity

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