# PearSocial Gateway - Lessons Learned
> **Created by**: Storyteller


## 1. Port Conflicts (`EADDRINUSE`)

**Problem**: Gateway failed to start with `EADDRINUSE: address already in use :::7777`

**Solution**: 
- Use `lsof -i :7777` to identify processes using the port
- Kill the conflicting process with `kill <PID>`
- Alternatively, use a different port via environment variable: `PORT=8080 node gateway.js`

**Prevention**: Always check for running processes before starting servers, especially during development.

---

## 2. Hyperdrive Key Validation

**Problem**: Gateway returned "ID must be 32-bytes long" error

**Root Cause**: Invalid drive keys being used in URLs

**Requirements for valid drive keys**:
- Exactly **64 characters long**
- **Hexadecimal only** (0-9, a-f)
- Represents 32 bytes when decoded from hex

**Example**:
- ❌ Invalid: `http://localhost:7777/info/test`
- ✅ Valid: `http://localhost:7777/info/3fe1415391a20670cc96e3a73a4c528680ae3a9e8ddf5b4bd2720cad6b58a731`

---

## 3. P2P Network Connectivity Requirements

**Problem**: Gateway connected to drives but returned empty `files: []` arrays

**Root Cause**: Drives must be **actively served** on the P2P network for the gateway to access them.

**Key Insights**:
- The gateway acts as a **client** that connects to **servers** hosting drive content
- Simply creating a drive in local storage isn't enough
- Drives need to be joined to the Hyperswarm network with `server: true`
- Peers must be discoverable and replicating the drive data

**Solution Pattern**:
```javascript
// Server side (content provider)
const swarm = new Hyperswarm()
swarm.join(drive.discoveryKey, { server: true, client: false })

// Gateway side (content consumer) 
swarm.join(drive.discoveryKey, { client: true, server: false })
```

---

## 4. Corestore Directory Isolation

**Problem**: Test scripts and gateway couldn't share drive data

**Cause**: Different Corestore paths create isolated storage environments:
- Gateway: `.gateway-store/`
- Tests: `.test-store/`

**Learning**: Each Corestore instance is completely isolated. For testing P2P functionality, create separate drive servers that communicate over the network rather than trying to share storage.

---

## 5. Gateway Caching Behavior

**Observation**: Gateway caches drive connections in memory (`driveCache`)

**Implications**:
- First access to a drive may be slower (network discovery)
- Subsequent requests are faster (cached connection)
- Changes to drive content may require gateway restart to see updates
- Consider implementing cache invalidation for production use

---

## 6. Testing Strategy Improvements

**Previous approach** (didn't work):
- Create drive in same storage directory as gateway
- Try to access immediately

**Improved approach** (works):
1. Create test drive in separate process/storage
2. Join drive to swarm as server
3. Let gateway discover and connect as client  
4. Verify P2P connection established
5. Test gateway endpoints

**Tools created**:
- `create-test-videos.js` - Creates and serves test drives
- `check-drive.js` - Verifies drive contents locally

---

## 7. Network Discovery Timing

**Learning**: P2P connections aren't instant

**Best practices**:
- Allow time for peer discovery (few seconds)
- Check gateway logs for connection events
- Implement retry logic for production applications
- Consider connection health monitoring

---

## 8. HTTP Range Request Support

**Gateway feature**: Properly implements HTTP Range requests for video streaming

**Benefits**:
- Enables video seeking/scrubbing
- Reduces bandwidth usage
- Better user experience for media playback
- Essential for Nostr client compatibility

---

## 9. CORS Configuration

**Implementation**: Gateway includes proper CORS headers

**Critical for**:
- Browser-based Nostr clients
- Cross-origin video requests
- OPTIONS preflight handling

---

## 10. Error Handling Patterns

**Improvements made**:
- Validate drive key format before processing
- Handle network timeout scenarios
- Provide meaningful error messages
- Log connection events for debugging

**Production considerations**:
- Implement request timeout limits
- Add rate limiting
- Monitor drive connection health
- Handle peer disconnection gracefully

---

## Key Takeaways

1. **P2P is different**: Content must be actively served, not just stored
2. **Network timing matters**: Allow for discovery and connection phases  
3. **Test realistically**: Use separate processes to simulate real P2P scenarios
4. **Monitor connections**: Log swarm events for debugging
5. **Validate inputs**: Proper drive key validation prevents confusing errors

---

## 11. Desktop App Architecture (Pear)

**Key Improvements Made**:

### IPC Communication Pattern
- **Backend (index.js)**: Uses `ipc.send()` to communicate with UI
- **Frontend (index.html)**: Uses `ipc.on()` to receive backend messages
- **Message types**: `ready`, `uploaded`, `log`, `error`, `gateway-status`

### File Upload Flow
1. User selects file in UI
2. Frontend sends `upload-video` message with file path
3. Backend reads file using `Pear.fs.readFile()`
4. Backend stores file in Hyperdrive
5. Backend sends `uploaded` confirmation to UI

### State Management
- Backend maintains authoritative state (videos, drive key)
- UI requests initial state on startup via IPC
- UI updates reactively based on backend messages

### Environment Detection
```javascript
// Detect if running in Pear vs browser
if (globalThis.Pear) {
  // Use real Pear IPC
  const { ipc } = Pear
} else {
  // Browser fallback mode
}
```

---

## 12. Development Tools Integration

**Features Added**:
- **DevTools button**: Opens Pear developer tools when in dev mode
- **Reload button**: Hot-reload during development
- **Gateway status**: Visual indicator with click-to-open
- **File association**: Handle `pear://` URLs passed as arguments

**Developer Experience**:
- Launch script (`./launch.sh`) that starts gateway + app
- Automatic gateway health checking
- Browser fallback for UI development
- Real-time logging from backend to UI

---

## 13. Pear Desktop App Best Practices

**Storage**: Use `Pear.config.storage` for consistent data location
**Teardown**: Always register cleanup with `Pear.teardown()`
**Updates**: Handle app updates gracefully with notifications
**File System**: Use `Pear.fs` instead of Node.js fs for Pear compatibility

**IPC Patterns**:
- Request/Response: UI requests data, backend responds
- Event Broadcasting: Backend sends updates to UI
- Error Handling: Structured error messages via IPC

**UI Considerations**:
- Design for desktop window sizes (1200x780 default)
- Handle both development and production modes
- Provide visual feedback for P2P operations
- Include offline/connection state indicators

---

## 14. Desktop App Development Progress (Current Session)

### **✅ Successfully Completed**:

**Backend Integration (index.js)**:
- ✅ **Pear environment detection** and configuration working
- ✅ **Hyperdrive initialization** with proper Pear storage paths
- ✅ **Hyperswarm P2P networking** functional and connecting peers
- ✅ **Drive key generation** and management working
- ✅ **Video scanning** from existing drives operational
- ✅ **Gateway health monitoring** implemented
- ✅ **Error handling** and logging systems functional

**Configuration & Setup**:
- ✅ **package.json** properly configured for Pear desktop app
- ✅ **GUI configuration** set (1200x780, dark theme)
- ✅ **Development workflow** established with persistent terminals
- ✅ **Storage isolation** resolved using `--unsafeClearAppStorage`
- ✅ **File locking issues** resolved

**Gateway Integration**:
- ✅ **HTTP Gateway** running on localhost:7777
- ✅ **P2P to HTTP bridge** operational
- ✅ **Video streaming endpoints** functional
- ✅ **Health monitoring** between app and gateway

**Testing & Validation**:
- ✅ **Test drive creation** and P2P content sharing working
- ✅ **Multiple drives** connected through gateway
- ✅ **Command line tools** for debugging (check-drive.js, create-test-videos.js)

### **🚧 Current Status**:

**What's Working**:
- **Backend processes**: Hyperdrive, Hyperswarm, gateway all operational
- **P2P networking**: Successfully creating and joining drives
- **Data storage**: Videos can be stored and retrieved from Hyperdrive
- **Gateway bridge**: HTTP access to P2P content functional
- **Drive key**: `8c77b06810fe0ef0ae1b78932a36aed8a6199b18712ed4cb31767097d453336c`

**Current Issue**:
- **❓ GUI Window**: Desktop window not displaying despite correct configuration
- **Root cause**: Backend running successfully but GUI window not opening
- **Pear config shows**: `type: 'desktop'`, `gui: true`, proper window dimensions
- **Missing**: Visual desktop application interface

### **🔧 Debugging Insights**:

**Pear Environment Analysis**:
```javascript
// Working Pear detection
- Pear: object ✅
- Pear.config: [complete configuration] ✅  
- GUI enabled: true ✅
- Type: 'desktop' ✅
- GUI options: {backgroundColor: '#0A0C0E', height: 780, width: 1200} ✅
```

**Process Architecture**:
```
Terminal 1: Gateway (HTTP Bridge) ✅ Running
Terminal 3: Pear Desktop App (Backend) ✅ Running  
GUI Window: Desktop Interface ❓ Missing
```

### **📋 Next Steps Identified**:

**Immediate Actions**:
- [ ] Investigate Pear GUI initialization patterns
- [ ] Verify `pear-stdio` import requirements
- [ ] Test with `--devtools` flag for GUI debugging
- [ ] Check if additional IPC setup needed for frontend communication

**Architecture Questions**:
- Does Pear auto-load `index.html` for desktop apps?
- Is additional GUI initialization code required?
- Should IPC communication be established differently?
- Are there missing dependencies for GUI display?

### **🏗️ Current File Structure**:
```
pearsocial/
├── index.js          ✅ Backend working (P2P, storage, networking)
├── index.html        ✅ Beautiful UI ready (not displaying)
├── gateway.js        ✅ HTTP bridge working
├── package.json      ✅ Pear desktop configuration
├── create-test-videos.js ✅ P2P testing tools
├── check-drive.js    ✅ Drive debugging tools
└── launch.sh         ✅ Easy launcher script
```

### **💡 Key Learning**:
**Pear desktop apps have two parts working independently**:
1. **Backend logic** (index.js) - ✅ **WORKING**
2. **GUI frontend** (index.html) - ✅ **EXISTS** but ❓ **NOT DISPLAYING**

The backend P2P functionality is completely operational, but the visual desktop interface needs additional investigation to display properly.

---

## Future Improvements

- [ ] **PRIORITY**: Resolve GUI window display issue in Pear desktop apps
- [ ] Implement proper IPC communication between backend and frontend
- [ ] Add drag & drop video upload functionality
- [ ] Implement drive cache TTL and refresh logic  
- [ ] Add connection health monitoring
- [ ] Create automated testing suite with P2P scenarios
- [ ] Add metrics and performance monitoring
- [ ] Implement graceful fallbacks for peer discovery failures
- [ ] Add drag & drop from external applications
- [ ] Implement pear:// URL viewing (browse remote drives)
- [ ] Add video thumbnails and preview functionality
- [ ] Implement Nostr key management and real publishing
- [ ] Add update mechanism for live app updates

## ✅ MIGRATION SUCCESS: Electron + Pear Runtime (March 9, 2026)

### 🎉 BREAKTHROUGH ACHIEVED!

**Problem**: Traditional Pear desktop GUI not displaying
**Solution**: Migrated to modern Electron + Pear Runtime architecture  
**Result**: Full desktop application now operational

### Current Working Status:
- ✅ Desktop window displaying properly
- ✅ Electron GUI framework operational  
- ✅ Pear Runtime handling P2P functionality
- ✅ Hyperdrive + Hyperswarm working in worker
- ✅ HTTP Gateway bridge functional
- ✅ Video upload and sharing ready

### Commands:
`npm run dev` - Launch desktop app
`npm run gateway` - Start HTTP bridge

### Architecture:
Electron Main → Desktop GUI → Pear Worker → P2P Network

The PearSocial desktop app is now fully functional! 🚀

