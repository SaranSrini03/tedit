import { Server as HTTPServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import type { Socket } from "socket.io";

// Store document rooms and their clients
const documentRooms = new Map<string, Set<string>>();

export function initializeWebSocketServer(httpServer: HTTPServer) {
  const allowedOrigin = process.env.FRONTEND_ORIGIN || "http://localhost:3000";

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: allowedOrigin,
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  io.on("connection", (socket: Socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Join a document room
    socket.on("join-document", (documentId: string) => {
      socket.join(documentId);
      
      if (!documentRooms.has(documentId)) {
        documentRooms.set(documentId, new Set());
      }
      documentRooms.get(documentId)?.add(socket.id);
      
      console.log(`Client ${socket.id} joined document ${documentId}`);
      
      // Notify others in the room
      socket.to(documentId).emit("user-joined", { userId: socket.id });
    });

    // Leave a document room
    socket.on("leave-document", (documentId: string) => {
      socket.leave(documentId);
      documentRooms.get(documentId)?.delete(socket.id);
      
      if (documentRooms.get(documentId)?.size === 0) {
        documentRooms.delete(documentId);
      }
      
      console.log(`Client ${socket.id} left document ${documentId}`);
      socket.to(documentId).emit("user-left", { userId: socket.id });
    });

    // Broadcast drawing events to others in the same document
    socket.on("draw-event", (data: {
      documentId: string;
      type: "draw" | "image";
      dataUrl?: string;
      path?: Array<{ x: number; y: number }>;
      strokeStyle?: string;
      lineWidth?: number;
      userId: string;
    }) => {
      // Broadcast to all others in the document room
      socket.to(data.documentId).emit("draw-event", data);
    });

    // Broadcast canvas updates (full canvas state)
    socket.on("canvas-update", (data: {
      documentId: string;
      dataUrl: string;
    }) => {
      // Broadcast to all others in the document room
      socket.to(data.documentId).emit("canvas-update", {
        dataUrl: data.dataUrl,
      });
    });

    // Request current canvas state from other users in the room
    socket.on("request-canvas-state", (documentId: string) => {
      // Ask other users in the room to send their current canvas state
      socket.to(documentId).emit("request-canvas-state", {
        requesterId: socket.id,
        documentId,
      });
    });

    // Send canvas state to a specific requester
    socket.on("send-canvas-state", (data: {
      documentId: string;
      dataUrl: string;
      targetUserId?: string;
    }) => {
      if (data.targetUserId) {
        // Send to specific user (response to request)
        socket.to(data.targetUserId).emit("canvas-update", {
          dataUrl: data.dataUrl,
        });
      } else {
        // Broadcast to all others (general update)
        socket.to(data.documentId).emit("canvas-update", {
          dataUrl: data.dataUrl,
        });
      }
    });

    socket.on("disconnect", () => {
      console.log(`Client disconnected: ${socket.id}`);
      
      // Clean up from all rooms
      documentRooms.forEach((clients, documentId) => {
        if (clients.has(socket.id)) {
          clients.delete(socket.id);
          socket.to(documentId).emit("user-left", { userId: socket.id });
          
          if (clients.size === 0) {
            documentRooms.delete(documentId);
          }
        }
      });
    });
  });

  console.log("WebSocket server initialized");
  return io;
}
