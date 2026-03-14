# PearSocial Issues Log
> **Created by**: Storyteller


## 🚨 Current Critical Issue (March 14, 2026)

### **Problem: File Dialog Opens But Cannot Select Files on macOS 26.3.1**

**Status**: ❌ **BLOCKING** - Upload functionality partially working but cannot select files

**Previous Issue RESOLVED**: ✅ Click events now work after context bridge fixes

**Date**: March 14, 2026  
**Platform**: macOS 26.3.1 (Build: 25D2128)  
**Electron**: v32.0.0  
**Investigation Time**: ~2 hours
=======

### **Current Symptoms**:
- ✅ **Click events working**: Upload zone responds to clicks
- ✅ **JavaScript execution**: All scripts load and run correctly  
- ✅ **IPC communication**: electronAPI calls reach main process
- ✅ **File dialog opens**: Native macOS file picker appears
- ❌ **File selection blocked**: Cannot select any files from dialog
- ❌ **No file path returned**: Dialog returns empty/cancelled result

### **Environment Details**:
- **OS**: macOS 26.3.1 (Build: 25D2128)
- **Electron**: v32.0.0
- **Node.js**: v25.2.1
- **Architecture**: Electron + Pear Runtime

### **What Works**:
✅ **Click event handlers**: Both onclick and addEventListener  
✅ **electronAPI bridge**: Context bridge functioning correctly  
✅ **File dialog display**: Native picker opens successfully  
✅ **IPC communication**: Main ↔ Renderer process communication  
✅ **Console logging**: All debug output visible  

### **What Doesn't Work**:
❌ **File selection**: Cannot pick files from dialog  
❌ **File path access**: No file paths returned from picker  
❌ **Upload workflow**: Cannot proceed past file selection  

### **Debugging History**:

**Test 1 - Context Bridge Fix** ✅:
- Fixed context isolation preventing electronAPI access
- Added proper function exposure in preload script
- Result: Click events now work

**Test 2 - Enhanced File Dialog**:
- Added comprehensive error logging
- Enhanced IPC handler with try/catch
- Added detailed console output
- Result: Dialog opens but file selection fails

**Test 3 - Simplified Dialog Config**:
- Removed file type filters
- Simplified to basic openFile dialog
- Added minimal configuration
- Result: Same issue - dialog opens, no selection

**Test 4 - macOS Security Permissions**:
- Created entitlements.plist with file access permissions
- Added macOS-specific build configuration
- Added file system access entitlements
- Result: No change

**Test 5 - Electron Security Flags**:
- Launched with --no-sandbox
- Added --disable-web-security
- Used --disable-features=VizDisplayCompositor
- Result: No improvement

### **Console Output Analysis**:

**Main Process Logs**:
```
📂 Opening file dialog...
📂 Dialog result: {
  cancelled: true,
  filePathCount: 0,
  filePaths: []
}
📁 File dialog cancelled
```

**Renderer Process Logs**:
```
🔍 openFileDialog called
📂 About to call electronAPI.showOpenDialog()
📂 File dialog result: { success: false }
📁 No file selected or dialog cancelled
```

**Pattern**: Dialog appears to user but immediately returns as "cancelled" even when files are clicked.

### **Technical Investigation**:

**Current File Dialog Implementation**:
```javascript
// Main Process (electron/main.cjs)
const result = await dialog.showOpenDialog(mainWindow, {
  properties: ['openFile', 'openDirectory'],
  title: 'Select a file to upload'
})
```

**Attempted Configurations Tested**:
1. ✅ Basic openFile only
2. ✅ With file type filters  
3. ✅ With defaultPath set to home directory
4. ✅ With multiple properties
5. ✅ With specific titles
6. ✅ Minimal configuration

**macOS Security Entitlements Added**:
```xml
<key>com.apple.security.files.user-selected.read-write</key>
<key>com.apple.security.files.downloads.read-write</key>
<key>com.apple.security.network.client</key>
<key>com.apple.security.network.server</key>
```

### **Hypotheses**:

**Theory 1: macOS 26+ Security Policy** (Most Likely)
- macOS 26.3.1 has new security restrictions  
- Unsigned Electron apps blocked from file system access
- Requires code signing or specific bypass method
- System Integrity Protection (SIP) interference

**Theory 2: Electron Version Compatibility**
- Electron v32.0.0 may have compatibility issues with macOS 26+
- Dialog API changes in newer macOS versions
- Need Electron version upgrade/downgrade

**Theory 3: Pear Runtime Interference**  
- PearRuntime may be conflicting with native dialogs
- P2P networking components affecting file access
- Runtime permissions collision

**Theory 4: Sandboxing Issues**
- Even with --no-sandbox, macOS enforcing restrictions
- App Transport Security blocking file operations
- Need additional bypass flags

### **Next Steps Required**:

**Priority 1: macOS Security Bypass** 
- [ ] Test with older macOS version (if available)
- [ ] Try different Electron versions
- [ ] Research macOS 26+ specific file access requirements
- [ ] Test with properly code-signed build

**Priority 2: Alternative File Selection**
- [ ] Try drag & drop file handling instead of dialog
- [ ] Implement web-based file input as fallback
- [ ] Test with different dialog APIs

**Priority 3: Environment Isolation**
- [ ] Test pure Electron app without Pear Runtime
- [ ] Create minimal reproduction case
- [ ] Test on different macOS versions

### **Attempted Solutions Summary**:

| Solution | Status | Result |
|----------|---------|--------|
| Context bridge fix | ✅ Success | Click events working |
| Enhanced error logging | ✅ Implemented | Better debugging info |
| Simplified dialog config | ✅ Tested | No improvement |  
| File type filter removal | ✅ Tested | No improvement |
| macOS entitlements.plist | ✅ Added | No improvement |
| Electron security flags | ✅ Tested | No improvement |
| Alternative IPC patterns | ❌ Not tried | - |
| Drag & drop fallback | ❌ Not tried | - |
| Different Electron version | ❌ Not tried | - |

### **Impact Assessment**:

**Severity**: 🔥 **CRITICAL**  
**User Impact**: **Cannot upload files - core functionality blocked**  
**Development Impact**: **Cannot test P2P upload workflow**  
**Platform Specific**: **macOS 26+ only - may work on other platforms**  

### **Code Changes Made During Debugging**:

**Files Modified**:
- `electron/main.cjs` - Enhanced file dialog with logging
- `electron/preload.js` - Fixed context bridge and added debug functions  
- `index.html` - Restored full UI, added debug logging
- `entitlements.plist` - Added macOS security permissions
- `package.json` - Attempted build config changes

**All changes preserved** for further investigation.

### **Symptoms**:
- JavaScript loads and executes correctly 
- Basic DOM manipulation works (text updates, etc.)
- **Click event handlers completely non-responsive**
- No error messages in console
- Both `onclick` and `addEventListener` approaches fail

### **What Works**:
✅ **JavaScript execution**: Scripts load and run  
✅ **DOM manipulation**: Elements can be updated  
✅ **Console logging**: `console.log()` works  
✅ **Alert dialogs**: `alert()` displays properly  
✅ **Initial page load**: All content renders correctly

### **What Doesn't Work**:
❌ **Click events**: No response to any click handlers  
❌ **Upload functionality**: File dialog never opens  
❌ **Button interactions**: No click responses  
❌ **ElectronAPI calls**: Cannot test due to click issues

### **Testing History**:

**Test 1 - Basic Click Test**:
- ✅ Created simple red button with `onclick`
- ✅ JavaScript loaded and displayed "click works" alert
- ✅ Confirmed basic JS functionality intact

**Test 2 - ElectronAPI Test**:  
- ❌ Click handlers completely unresponsive
- ❌ Cannot test electronAPI due to click failure
- ❌ Both green buttons non-functional

**Test 3 - Ultra Basic Test**:
- ✅ JavaScript alert appeared on load
- ✅ DOM text updated successfully  
- ✅ Console logging worked
- ❌ **But click events still completely broken**

### **Architecture Context**:

**Successfully Migrated To**:
- ✅ Electron + Pear Runtime architecture
- ✅ Desktop window displaying properly
- ✅ Pear worker running in background
- ✅ IPC handlers setup in main process
- ✅ Preload script configured

**Current File Structure**:
```
✅ electron/main.js      - Electron main process
✅ electron/preload.js   - IPC security bridge  
✅ pear-worker.js        - P2P backend (Bare runtime)
✅ index.html           - GUI interface
❌ Click events broken   - Core interaction failure
```

### **Debugging Attempts**:

**1. Event Handler Testing**:
```javascript
// TRIED: onclick attribute
<div onclick="testFunction()">Click</div>  // ❌ No response

// TRIED: addEventListener  
element.addEventListener('click', handler)  // ❌ No response

// TRIED: Inline handlers
<button onclick="alert('test')">Test</button>  // ❌ No response
```

**2. JavaScript Verification**:
```javascript  
✅ console.log('working')     // Works
✅ alert('test')              // Works  
✅ document.getElementById()  // Works
✅ element.innerHTML = 'text' // Works
❌ element.onclick = handler  // No response
```

**3. Context Isolation Check**:
- Preload script configured with `contextIsolation: true`
- electronAPI should be exposed via `contextBridge.exposeInMainWorld`
- May be context isolation blocking event handlers

### **Potential Root Causes**:

**Theory 1: Context Isolation Issue**
- Electron's context isolation may be preventing event handlers
- Main world vs isolated world event handling problems
- Preload script may not be bridging events correctly

**Theory 2: CSP (Content Security Policy)**  
- Electron may be blocking inline event handlers
- Need to check for CSP headers or restrictions

**Theory 3: Preload Script Timing**
- Event handlers may be attached before preload script loads
- Race condition between DOM ready and preload execution

**Theory 4: Electron Security Settings**
- `nodeIntegration: false` may be too restrictive
- Security settings blocking event propagation

### **Console Errors Observed**:
```
[ERROR:CONSOLE(1)] "Request Autofill.enable failed..."  
[ERROR:CONSOLE(1)] "Request Autofill.setAddresses failed..."
[ERROR:CONSOLE(1)] "Unexpected token 'H', "HTTP/1.1 4"... is not valid JSON"
```
*Note: These appear to be DevTools-related, not app-breaking*

### **Next Steps Required**:

**Priority 1: Fix Click Events**
- [ ] Investigate context isolation settings
- [ ] Test with `nodeIntegration: true` temporarily  
- [ ] Check CSP headers and restrictions
- [ ] Try event delegation from document level
- [ ] Test preload script timing

**Priority 2: ElectronAPI Debug**  
- [ ] Verify contextBridge is working
- [ ] Check if electronAPI is accessible
- [ ] Test IPC communication flow

**Priority 3: Upload Implementation**
- [ ] Fix file dialog integration
- [ ] Implement proper file upload flow
- [ ] Connect to Pear worker backend

### **Working Components To Preserve**:

✅ **P2P Backend**: Pear worker initializing correctly  
✅ **HTTP Gateway**: Running and functional  
✅ **Desktop Window**: Beautiful UI displaying  
✅ **Architecture**: Modern Electron + Pear Runtime setup  
✅ **JavaScript Core**: Basic execution working  

### **Impact Assessment**:

**Severity**: 🔥 **CRITICAL**  
**User Impact**: **Complete inability to upload files**  
**Development Impact**: **Cannot test core P2P functionality**  
**Release Impact**: **App unusable for primary purpose**

---

## 📝 Previous Issues (Resolved)

### ✅ **Issue 1: Traditional Pear Desktop GUI Not Displaying**
**Resolution**: Successfully migrated to Electron + Pear Runtime architecture

### ✅ **Issue 2: Port 7777 EADDRINUSE Error**  
**Resolution**: Kill conflicting processes with `lsof -i :7777` and `kill <PID>`

### ✅ **Issue 3: "upgrade link required" Error**
**Resolution**: Set placeholder upgrade link for development mode

### ✅ **Issue 4: P2P Drive Communication**
**Resolution**: Proper drive creation and swarm networking implemented

---

## 🛠️ Technical Debt

### **Code Quality**:
- Multiple test files created during debugging (cleanup needed)
- Temporary debug code in various files
- Alert() statements need removal after debugging

### **Architecture**:
- Original Pear files preserved but not cleaned up
- Mixed approaches in codebase during migration
- Documentation scattered across multiple files

### **Testing**:  
- No automated tests for Electron integration
- Manual testing only for P2P functionality
- Upload flow not properly tested end-to-end

---

## 📚 References

- **Electron Context Isolation**: https://www.electronjs.org/docs/tutorial/context-isolation
- **Electron Security**: https://www.electronjs.org/docs/tutorial/security  
- **Pear Runtime Integration**: https://github.com/holepunchto/pear-runtime
- **Event Handling in Electron**: https://www.electronjs.org/docs/api/web-contents#event-dom-ready

---

**Last Updated**: March 14, 2026  
**Status**: 🚨 **CRITICAL ISSUE** - File selection blocked on macOS 26+
---

## 📁 Index File Status & Context

### **🔍 Currently Active**: `index.html` (3.4KB)
**Type**: ElectronAPI debug test page  
**Purpose**: Testing electronAPI availability and click events  
**Content**: 
- Basic electronAPI detection  
- Two green test buttons (non-functional due to click issue)
- Debug logging functionality
- Simple styling for testing only

### **📁 Available Index Files**:

**1. `index.html` - ⚠️ CURRENT (3.4KB)**
- ElectronAPI debug test page
- Two green test buttons: "Test ElectronAPI" & "Test File Dialog"
- Debug output area with colored logging
- **Status**: Click events completely broken
- **Purpose**: Isolate and debug the click event issue

**2. `index-fixed.html` - 🎨 FULL UI (17KB)**
- Complete PearSocial interface with production styling
- Beautiful dark theme (#0A0C0E background)
- Upload zone with hover effects and icons
- Drive key display with copy functionality  
- Video list with card layouts
- Status indicators and gateway monitoring
- **Status**: Not currently loaded, ready for restoration
- **Features**: Full upload workflow, P2P status, beautiful UX

**3. `index-pear-original.html` - 🏛️ ORIGINAL (30KB)**
- Original beautiful PearSocial interface before migration
- Full feature set including Nostr integration
- Complete animations and advanced styling
- Right panel with Nostr publishing UI
- Drag & drop functionality (original implementation)
- **Status**: Backup of pre-Electron design
- **Purpose**: Reference for complete feature set

**4. `test-index.html` - 🧪 BASIC TEST (1.6KB)**
- Ultra-basic click testing page
- Red test buttons with simple alerts
- Minimal HTML for debugging JavaScript execution
- **Status**: Confirmed JavaScript works, click events broken
- **Purpose**: Isolate click event handling from complex UI

**5. `electron-index.html` - 📝 PLACEHOLDER (0 bytes)**
- Empty file created during development
- **Status**: Unused, can be deleted
- **Purpose**: None

### **🎯 Recommended Next Steps**:

**Option A - Fix in Debug Context** (Current):
- Continue debugging click events in simple test environment
- Isolate the root cause without UI complexity
- Apply fix to production UI afterward

**Option B - Restore Full UI**:
- Copy `index-fixed.html` → `index.html` 
- Debug click events in production interface context
- More realistic testing environment
- Users see proper interface during debugging

**Option C - Hybrid Approach**:
- Fix click events in current debug page first
- Once resolved, restore beautiful UI
- Test upload functionality end-to-end

### **File Relationships**:
```
index.html              ← Currently loaded by Electron
├── electron/main.js    ← Loads this file via mainWindow.loadFile()
├── index-fixed.html    ← Production UI ready for restoration  
├── index-pear-original.html ← Original design reference
└── test-index.html     ← Basic testing confirmed JS works
```

**Impact**: The debug index file allows focused troubleshooting but users see a basic interface instead of the beautiful PearSocial design. Once click events are fixed, we should restore the full UI.

