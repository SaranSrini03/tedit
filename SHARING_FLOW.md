# Canvas Sharing Flow

## How It Works

### 1. You Draw Something
```
Your Browser → Canvas Element
    ↓
Convert canvas to PNG data (base64 string)
    ↓
┌─────────────────────────────┐
│ Save in TWO places:         │
│ 1. localStorage (your PC)   │ ← For offline/backup
│ 2. Backend API (server)     │ ← For sharing
└─────────────────────────────┘
```

### 2. Backend Stores It
```
API Route: POST /api/documents/{id}/canvas
    ↓
Server receives canvas data
    ↓
┌─────────────────────────────┐
│ Store in:                   │
│ 1. Memory (Map)             │ ← Fast access
│ 2. File system (.data/)     │ ← Backup
└─────────────────────────────┘
```

### 3. Someone Opens Your Link
```
Their Browser → Opens /document/{id}
    ↓
Canvas component loads
    ↓
Request: GET /api/documents/{id}/canvas
    ↓
Server finds saved data
    ↓
Returns canvas PNG data
    ↓
Their browser draws it on canvas
    ↓
✅ They see your drawing!
```

### 4. Auto-Save Triggers
- ✅ After every brush stroke
- ✅ After importing images
- ✅ Every 5 seconds (backup)
- ✅ Before page closes
- ✅ On window resize (with restore)

### 5. Fallback System
```
Try Backend API first
    ↓ (if fails)
Try localStorage
    ↓ (if fails)
Show empty canvas
```

## Storage Locations

1. **localStorage** (Browser)
   - Unique per browser/device
   - Works offline
   - Not shared between devices

2. **Backend API** (Server)
   - Shared with everyone
   - Accessible via link
   - Currently: in-memory (lost on restart)
   - Future: database (persistent)

## Document ID
- Each document has unique ID: `/document/abc-123-def`
- ID is used as storage key
- Same ID = same canvas data

