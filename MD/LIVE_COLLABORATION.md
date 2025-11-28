# Live Real-Time Collaboration System

## ✅ What's Implemented

Your canvas now supports **live, real-time collaboration**! Multiple users can draw on the same canvas simultaneously and see each other's changes instantly.

## 🔧 How It Works

### Architecture

1. **WebSocket Server** (`server.ts` + `server/websocket-server.ts`)
   - Runs alongside Next.js server
   - Handles real-time connections via Socket.IO
   - Manages document "rooms" where users collaborate

2. **Real-Time Hook** (`hooks/use-realtime-canvas.ts`)
   - Connects to WebSocket server
   - Broadcasts your drawing events
   - Receives other users' drawing events

3. **Canvas Integration** (`hooks/use-canvas.ts`)
   - Integrated with real-time system
   - Sends drawing paths as you draw
   - Receives and draws remote paths

### Flow

```
User A Draws → WebSocket Broadcast → Server → WebSocket Broadcast → User B Sees It
```

## 🚀 How to Run

1. **Start the server** (uses custom server with WebSocket support):
   ```bash
   npm run dev
   ```

2. **Open two browsers/windows**:
   - Browser 1: `http://localhost:3000/document/abc-123`
   - Browser 2: `http://localhost:3000/document/abc-123`

3. **Draw in Browser 1** - You'll see it appear live in Browser 2!

## 📡 Events

- **`draw-event`**: Drawing paths (brush strokes)
- **`canvas-update`**: Full canvas image updates (for images, large changes)
- **`join-document`**: User joins a document room
- **`leave-document`**: User leaves a document room

## 🎯 Features

✅ Real-time drawing sync
✅ Multiple users on same canvas
✅ Automatic reconnection
✅ Works with existing persistence
✅ Low latency updates

## 🔄 What Happens When You Draw

1. You draw a stroke
2. Path is captured (every 3 points for efficiency)
3. Broadcast via WebSocket to server
4. Server sends to all other users in document room
5. Their browsers draw the same path instantly

## ⚙️ Configuration

The WebSocket server runs on the same port as Next.js (3000 by default).

You can customize:
- Port: Set `PORT` environment variable
- WebSocket URL: Auto-detected from browser location

## 🐛 Troubleshooting

If real-time doesn't work:
1. Check browser console for WebSocket connection messages
2. Ensure server started with `npm run dev` (not `next dev`)
3. Check that Socket.IO is installed: `npm list socket.io`

## 📝 Notes

- Drawing paths are debounced (sent every 3 points) for performance
- Full canvas updates are sent after image imports or major changes
- Each user has a unique socket ID to avoid drawing their own remote events

