# Development Journal

## November 28, 2025 - Thursday

### Project Restructuring

**Time:** 23:08:43 (Evening session)

#### 1. Frontend/Backend Separation
- Reorganized project structure into separate `frontend/` and `backend/` folders
- Moved all Next.js app files to `frontend/`:
  - `app/`, `components/`, `hooks/`, `lib/`, `public/`
  - Configuration files: `next.config.ts`, `tsconfig.json`, `package.json`, etc.
- Created standalone backend in `backend/`:
  - `src/index.ts` - HTTP server entry point
  - `src/websocket-server.ts` - Socket.IO server logic
  - Separate `package.json` and `tsconfig.json` for backend
- Updated `.gitignore` to exclude all `node_modules/` directories
- Updated `README.md` with new project structure

#### 2. Canvas State Synchronization Fix
- **Problem:** New users joining a document didn't see existing drawings
- **Solution:** Implemented peer-to-peer canvas state sync
  - Added `request-canvas-state` event in websocket server
  - New users automatically request current canvas state on connection
  - Existing users respond by sending their canvas state
  - Added `send-canvas-state` event for targeted state delivery
- **Files Modified:**
  - `backend/src/websocket-server.ts` - Added state request/response handlers
  - `frontend/hooks/use-realtime-canvas.ts` - Auto-request state on join
  - `frontend/hooks/use-canvas.ts` - Handle state requests and send canvas data

#### 3. Bug Fixes
Fixed 6 critical bugs:

1. **Type Mismatch** (`use-realtime-canvas.ts`)
   - Added missing `userId?: string` to `draw-event` handler type definition

2. **Missing Dependency** (`use-realtime-canvas.ts`)
   - Added `onRequestCanvasState` to `useEffect` dependency array

3. **Performance Issue** (`use-canvas.ts`)
   - Moved inline `onRequestCanvasState` callback to memoized `useCallback`

4. **Canvas Dimension Bug** (`use-canvas.ts`)
   - Fixed `handleRemoteDraw` to properly handle canvas dimensions
   - Added parent element check and context re-validation after async image load

5. **Missing Error Handling** (`use-canvas.ts`)
   - Added `image.onerror` handler for canvas image loading

6. **Dependency Array** (`use-canvas.ts`)
   - Added `canvasWidth` and `canvasHeight` to `handleRemoteDraw` dependencies

#### 4. Documentation Organization
- Created `MD/` folder for markdown documentation
- Moved documentation files:
  - `FEATURES.md` → `MD/FEATURES.md`
  - `LIVE_COLLABORATION.md` → `MD/LIVE_COLLABORATION.md`
  - `SHARING_FLOW.md` → `MD/SHARING_FLOW.md`
- Updated `README.md` to reflect new documentation structure

### Technical Details

**Backend Changes:**
- WebSocket server now handles:
  - `request-canvas-state` - Broadcasts request to room members
  - `send-canvas-state` - Sends canvas state to specific user or broadcasts

**Frontend Changes:**
- `useRealtimeCanvas` hook:
  - Automatically requests canvas state on connection
  - Exposes `sendCanvasStateToUser` function
  - Handles `onRequestCanvasState` callback

- `useCanvas` hook:
  - Responds to canvas state requests
  - Improved error handling and dimension calculations
  - Better async context validation

### Testing Notes
- Canvas state now properly syncs when new users join
- All linter errors resolved
- No breaking changes to existing functionality

### Next Steps
- Consider adding canvas state caching on server side
- Add rate limiting for canvas state requests
- Consider using Redis for shared canvas state in production

