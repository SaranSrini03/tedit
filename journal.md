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

---

## November 29, 2025 - Saturday

### Layer Stack System - Drawing Persistence Issues

**Time:** Evening session

#### Struggles We Faced

**1. Drawings Disappearing After Appearing**
- **Problem:** Drawings would appear briefly when drawn, then immediately disappear from the canvas
- **Root Cause:** The `prepareLayerCanvas` function was being called repeatedly and clearing canvases by resetting their width/height, which automatically clears canvas content
- **Impact:** Users couldn't draw anything that would persist on the canvas

**2. Canvas Initialization with Wrong Dimensions**
- **Problem:** Layer canvases were being created with default HTML canvas dimensions (300x150) instead of proper document dimensions
- **Root Cause:** Canvas elements were created but not properly initialized with correct pixel dimensions before drawing
- **Impact:** Drawing coordinates were misaligned and drawings appeared in wrong positions

**3. Drawing Only Working on Background Layer**
- **Problem:** After creating new layers, drawing would only work on the background layer, not on newly created layers
- **Root Cause:** New layer canvases weren't being registered in `useMultiLayerCanvas`'s `layerCanvasesRef` before drawing attempts
- **Impact:** Users couldn't draw on new layers they created

**4. Canvas Clearing Protection Not Working**
- **Problem:** Even with content tracking, canvases were still being cleared
- **Root Cause:** The content check wasn't happening early enough in `prepareLayerCanvas`, allowing canvas dimensions to be modified before checking for content
- **Impact:** Existing drawings would be lost when canvases were re-initialized

#### Solutions Implemented

**1. Canvas Content Protection System**
- **Solution:** Added early content check at the very start of `prepareLayerCanvas`
- **Implementation:**
  - Created `canvasHasContentRef` to track which canvases have been drawn on
  - Added `hasDrawnRef` as a global flag to prevent any canvas modifications once drawing starts
  - Moved content check to the absolute first line of `prepareLayerCanvas` before any other logic
  - If canvas has content, function returns immediately without touching the canvas
- **Code Location:** `frontend/hooks/use-multi-layer-canvas.ts` lines 111-128
- **Result:** Canvases with drawings are now completely protected from being cleared

**2. Canvas Dimension Initialization Fix**
- **Solution:** Detect default canvas dimensions (300x150) and properly initialize them
- **Implementation:**
  - Added check for default canvas size (`canvas.width === 300 && canvas.height === 150`)
  - Force re-initialization if canvas has default dimensions
  - Ensure canvas dimensions match parent container with proper DPR scaling
  - Only initialize canvases that don't have content
- **Code Location:** `frontend/hooks/use-multi-layer-canvas.ts` lines 136-196
- **Result:** All canvases now have correct dimensions matching the document size

**3. Immediate Canvas Registration**
- **Solution:** Register new layer canvases in refs immediately when created, before initialization
- **Implementation:**
  - Store canvas in `layerCanvasesRef` as soon as `prepareLayerCanvas` is called
  - Call `onLayerCanvasUpdate` immediately to notify parent components
  - Ensure canvas is available for drawing even if initialization hasn't completed
- **Code Location:** `frontend/hooks/use-multi-layer-canvas.ts` lines 132-137
- **Result:** New layers are immediately available for drawing

**4. TypeScript Error Fixes**
- **Solution:** Fixed context type mismatches between `null` and `undefined`
- **Implementation:**
  - Changed context assignments to use temporary variables
  - Properly handle `null` returns from `getContext()`
  - Ensure type consistency throughout the hook
- **Result:** All TypeScript errors resolved, no linter warnings

#### Technical Details

**Canvas Protection Mechanism:**
```
1. Check if canvas has content → Return immediately if yes
2. Store canvas in refs immediately → Available for drawing
3. Check if canvas needs initialization → Only if no content
4. Initialize with proper dimensions → Only for empty/default canvases
```

**Canvas Initialization Flow:**
- New canvas created → Registered in refs → Initialized with dimensions → Context stored → Ready for drawing
- Existing canvas with content → Skip all initialization → Just ensure context exists → Protect content

**Layer Canvas Registration:**
- `MultiLayerCanvasRenderer` creates canvas element
- Calls `onPrepareLayerCanvas` which calls `prepareLayerCanvas`
- Canvas stored in `layerCanvasesRef` immediately
- Canvas initialized with proper dimensions
- Available for drawing operations

#### Key Changes Made

**Files Modified:**
- `frontend/hooks/use-multi-layer-canvas.ts` - Main fixes for canvas protection and initialization
- `frontend/components/document-editor.tsx` - Removed circular dependency in `handleLayerCanvasUpdate`

**Key Functions Modified:**
- `prepareLayerCanvas()` - Added early content check and immediate canvas registration
- `startDrawing()` - Added canvas dimension validation and initialization
- `compositeLayers()` - Simplified drawImage call to use logical dimensions

**Refs Added:**
- `canvasHasContentRef` - Tracks which layer canvases have drawings
- `hasDrawnRef` - Global flag indicating user has started drawing

#### Testing Notes
- ✅ Drawings now persist and stay on canvas
- ✅ Drawing works on all layers, not just background
- ✅ Canvas dimensions are correct for all layers
- ✅ Existing drawings are protected from being cleared
- ✅ New layers can be drawn on immediately after creation
- ✅ No TypeScript or linter errors

#### Lessons Learned

1. **Canvas Dimension Changes Clear Content:** Setting `canvas.width` or `canvas.height` automatically clears the canvas. Always check for content before modifying dimensions.

2. **Early Protection is Critical:** Content checks must happen before any canvas modification logic. Order matters significantly.

3. **Ref Registration Timing:** Canvas elements must be registered in refs immediately when created, not after initialization completes.

4. **State Synchronization:** Multiple components need to know about canvas elements. Ensure proper notification chain between components.

5. **Default Canvas Dimensions:** HTML canvas elements have default 300x150 dimensions. Always detect and re-initialize these.

#### Next Steps
- Layer system is now fully functional
- All drawings persist correctly across layers
- Ready to add more layer features (blending modes, effects, etc.)
- Consider adding layer groups in future
- Add layer thumbnails/previews for better UX

---

