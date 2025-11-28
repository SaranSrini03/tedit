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

---

## November 28, 2025 - Thursday (Continued)

### UI/UX Improvements

**Time:** 23:44:28 (Evening session)

#### 1. Tool Organization - Photoshop-Style Folders
- **Problem:** Too many tools cluttering the sidebar
- **Solution:** Organized tools into logical folders with right-click menus
- **Implementation:**
  - Created `ToolFolderMenu` component for dropdown menus
  - Reorganized `toolGroups` in `constants.ts` into 9 folders:
    - **Drawing**: Brush, Pencil, Eraser
    - **Selection**: Select, Rect Select, Lasso
    - **Shapes**: Rectangle, Ellipse, Line
    - **Paint**: Fill, Eyedropper
    - **Effects**: Blur, Sharpen, Filters
    - **Utility**: Zoom, Move, Transform, Snap
    - **Text**: Text
    - **Magic**: Magic, BG Remove
    - **Adjustments**: Blend
  - Left-click: Cycles through tools in folder
  - Right-click: Opens context menu with all tools
  - Visual indicator: Small dot on folders with multiple tools
- **Files Modified:**
  - `frontend/lib/constants.ts` - Added `ToolGroup` interface and `toolGroups` array
  - `frontend/lib/types.ts` - Updated `ToolId` type with new tool IDs
  - `frontend/components/tool-sidebar.tsx` - Integrated folder menu system
  - `frontend/components/tool-folder-menu.tsx` - New component for folder dropdowns

#### 2. Selection Tools in Toolbar
- Added quick access selection tools to top toolbar
- Three selection buttons: Select, Rect Select, Lasso
- Active tool highlighting with white background
- **Files Modified:**
  - `frontend/components/toolbar.tsx` - Added selection tools section
  - `frontend/components/document-editor.tsx` - Passed `onToolSelect` to Toolbar

#### 3. Text Tool with Smart Color Detection
- **Feature:** Automatic text color adjustment based on background
- **Implementation:**
  - Added `getPixelColor()` - Reads pixel color at specific point
  - Added `isBackgroundWhite()` - Detects white/light backgrounds (RGB > 240)
  - Added `getTextColorForBackground()` - Returns black for white backgrounds, default color otherwise
  - Added `renderText()` - Smart text rendering function
- **Behavior:**
  - Automatically uses **black text** when background is white
  - Uses provided color (or strokeColor) for dark backgrounds
- **Files Modified:**
  - `frontend/hooks/use-canvas.ts` - Added background detection and smart text rendering

#### 4. Folder Menu Styling
- **Problem:** Folder dropdown menu had dark background, hard to read
- **Solution:** Changed to white background with black text
- **Changes:**
  - Background: `bg-black/95` → `bg-white`
  - Border: `border-white/20` → `border-gray-300`
  - Text: All items now use `!text-black` (forced with important)
  - Header: Changed to black text for better contrast
  - Hover states: Gray backgrounds (`bg-gray-100`, `bg-gray-200`)
- **Files Modified:**
  - `frontend/components/tool-folder-menu.tsx` - Complete styling overhaul

### Technical Details

**Tool Organization:**
- Tools grouped by functionality for better UX
- Folder system similar to Photoshop's tool organization
- Right-click context menus for quick tool access
- Visual feedback with active state highlighting

**Text Rendering:**
- Canvas pixel reading for background detection
- Automatic contrast adjustment for readability
- Works with any text rendering function

**UI Improvements:**
- Better visual hierarchy with folder organization
- Improved readability with white background menus
- Consistent styling across tool interfaces

### Testing Notes
- Tool folders work correctly with left and right-click
- Selection tools accessible from both sidebar and toolbar
- Text color detection works for white backgrounds
- Folder menus display correctly with black text on white

### Next Steps
- Implement full text tool with editing capabilities
- Add more tool categories as needed
- Consider adding keyboard shortcuts for tool switching
- Add tooltips for better discoverability

