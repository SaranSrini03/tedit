## Tedit – collaborative photo editor

Tedit is a collaborative drawing and layout tool built with Next.js. It gives you a shared canvas where multiple people can draw and edit together in real time.

### tech stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Shadcn UI
- **Realtime**: Socket.IO (client in the frontend, server in a separate backend service)
- **APIs**: Next.js `app/api` routes for saving/loading canvas snapshots
- **Runtime layout**: split into `frontend/` (Next app) and `backend/` (websocket server)

### project structure

- **`frontend/`** – Next.js app  
  - `app/` – routes, layouts, and pages  
    - `document/[id]/page.tsx` – main document canvas screen  
    - `api/documents/[id]/canvas/route.ts` – API to load and save canvas data  
  - `components/` – UI and editor components  
    - `canvas-renderer.tsx` – main canvas rendering and drawing  
    - `tool-sidebar.tsx`, `toolbar.tsx`, `topbar.tsx`, `layers-panel.tsx`, `properties-panel.tsx` – editor chrome and controls  
    - `new-document-view.tsx`, `welcome-screen.tsx`, `workspace-container.tsx` – overall app layout and entry experience  
    - `ui/` – Shadcn components (`button`, `card`, `slider`)  
  - `hooks/`  
    - `use-canvas.ts` – core canvas logic  
    - `use-auto-fit.ts` – fitting the canvas into the viewport  
    - `use-realtime-canvas.ts` – Socket.IO-based realtime sync  
  - `lib/` – shared types, constants, and utilities  
  - `public/` – static assets and icons  
  - `next.config.ts` – Next.js config with Turbopack root and React Compiler  
  - `tsconfig.json` – TypeScript config for the app  
- **`backend/`** – Socket.IO websocket server  
  - `src/websocket-server.ts` – room management, join/leave events, draw and canvas-update broadcast  
  - `src/index.ts` – tiny HTTP server that mounts Socket.IO  
  - `tsconfig.json` – backend TypeScript build config  
  - `package.json` – backend scripts (`dev`, `build`, `start`)  
- **root**  
  - `.gitignore` – ignores all `node_modules`, Next build output, and local canvas data  
  - `FEATURES.md` – detailed feature list and roadmap  
  - `LIVE_COLLABORATION.md`, `SHARING_FLOW.md` – design notes for collaboration and sharing flows  

### key features (current)

- **Document-based canvases**  
  - Each document has its own canvas route (`/document/[id]`).  
  - Canvas metadata (width, height) and current snapshot are stored via API.  
- **Drawing and canvas state**  
  - Freehand drawing paths with stroke color and line width.  
  - Canvas state can be serialized into a data URL and loaded later.  
- **Realtime collaboration**  
  - Socket.IO rooms per document  
  - Events:  
    - `join-document` / `leave-document` with room membership tracking  
    - `draw-event` for streaming strokes and image actions  
    - `canvas-update` for broadcasting full-canvas snapshots  
  - Client hook `use-realtime-canvas` abstracts connection, join/leave, and broadcast helpers.  
- **UI and workflow**  
  - Tool sidebar and toolbar for selecting tools and settings  
  - Layers and properties panels for managing elements on the canvas  
  - New document flow and workspace container for the main app layout  

### local development

You run frontend and backend separately.

- **Backend (realtime server)**  

  ```bash
  cd backend
  npm install        # first time
  npm run dev        # runs Socket.IO server on http://localhost:3001
  ```

  Environment:

  - `PORT` (optional): port for the websocket server, defaults to `3001`.  
  - `HOSTNAME` (optional): listen host, defaults to `0.0.0.0`.  
  - `FRONTEND_ORIGIN`: origin allowed in CORS, e.g. `http://localhost:3000` in dev.  

- **Frontend (Next.js app)**  

  ```bash
  cd frontend
  npm install        # first time
  # .env.local:
  # NEXT_PUBLIC_WS_URL=http://localhost:3001
  npm run dev        # runs Next dev server on http://localhost:3000
  ```

  Environment:

  - `NEXT_PUBLIC_WS_URL`: URL of the websocket backend, e.g. `http://localhost:3001` in dev or your production Socket.IO host in prod.  

Open `http://localhost:3000`, create or open a document, and draw in two browser windows to see realtime updates.

### deployment overview

- **Frontend**: deploy `frontend/` as a Next.js app to Vercel.  
  - Build: `npm run build`  
  - Set `NEXT_PUBLIC_WS_URL` in Vercel project settings to the public URL of the backend.  
- **Backend**: deploy `backend/` to a Node host that supports long-lived processes (Railway, Fly.io, Render, etc.).  
  - Build: `npm run build`  
  - Start: `npm start`  
  - Set `FRONTEND_ORIGIN` to your Vercel URL (for example, `https://your-app.vercel.app`).  

### notes and limitations

- Canvas persistence currently uses in-memory maps plus writes to `.data/canvases` on disk; for real production use, this should move to a cloud database or object storage.  
- Auth is not wired up yet; Better Auth and proper access control are planned for later.  
- Realtime and persistence talk to different services; both need coordinated configuration (`NEXT_PUBLIC_WS_URL`, `FRONTEND_ORIGIN`, and future storage env vars).  
