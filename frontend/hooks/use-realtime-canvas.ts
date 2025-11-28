import { useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";

interface UseRealtimeCanvasProps {
  documentId: string;
  onRemoteDraw: (data: {
    type: "draw" | "image";
    dataUrl?: string;
    path?: Array<{ x: number; y: number }>;
    strokeStyle?: string;
    lineWidth?: number;
  }) => void;
  onRequestCanvasState?: (requesterId: string) => void;
}

export function useRealtimeCanvas({
  documentId,
  onRemoteDraw,
  onRequestCanvasState,
}: UseRealtimeCanvasProps) {
  const socketRef = useRef<Socket | null>(null);
  const isConnectedRef = useRef(false);

  useEffect(() => {
    // Connect to WebSocket server (defaults to same origin when env not set)
    const runtimeWsUrl = process.env.NEXT_PUBLIC_WS_URL;
    const fallbackUrl =
      typeof window !== "undefined"
        ? `${window.location.protocol === "https:" ? "https:" : "http:"}//${
            window.location.hostname
          }:3001`
        : "http://localhost:3001";
    const wsUrl = runtimeWsUrl?.length ? runtimeWsUrl : fallbackUrl;
      
    const socket = io(wsUrl, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Connected to real-time server");
      isConnectedRef.current = true;
      
      // Join the document room
      socket.emit("join-document", documentId);
      
      // Request current canvas state from other users
      socket.emit("request-canvas-state", documentId);
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from real-time server");
      isConnectedRef.current = false;
    });

    // Listen for remote drawing events
    socket.on("draw-event", (data: {
      type: "draw" | "image";
      dataUrl?: string;
      path?: Array<{ x: number; y: number }>;
      strokeStyle?: string;
      lineWidth?: number;
      userId?: string;
    }) => {
      // Only handle remote events (not our own)
      if (data.userId !== socket.id) {
        onRemoteDraw(data);
      }
    });

    // Listen for canvas state updates
    socket.on("canvas-update", (data: { dataUrl: string }) => {
      onRemoteDraw({ type: "image", dataUrl: data.dataUrl });
    });

    // Listen for canvas state requests from new joiners
    socket.on("request-canvas-state", (data: { requesterId: string; documentId: string }) => {
      // This will be handled by the component that has access to the canvas
      // We'll expose a callback for this
      if (onRequestCanvasState) {
        onRequestCanvasState(data.requesterId);
      }
    });

    return () => {
      if (socketRef.current) {
        socket.emit("leave-document", documentId);
        socket.disconnect();
      }
    };
  }, [documentId, onRemoteDraw, onRequestCanvasState]);

  const broadcastDraw = useCallback(
    (data: {
      type: "draw" | "image";
      dataUrl?: string;
      path?: Array<{ x: number; y: number }>;
      strokeStyle?: string;
      lineWidth?: number;
    }) => {
      if (socketRef.current && isConnectedRef.current) {
        socketRef.current.emit("draw-event", {
          ...data,
          documentId,
          userId: socketRef.current.id,
        });
      }
    },
    [documentId]
  );

  const broadcastCanvasUpdate = useCallback(
    (dataUrl: string) => {
      if (socketRef.current && isConnectedRef.current) {
        socketRef.current.emit("canvas-update", {
          documentId,
          dataUrl,
        });
      }
    },
    [documentId]
  );

  const sendCanvasStateToUser = useCallback(
    (targetUserId: string, dataUrl: string) => {
      if (socketRef.current && isConnectedRef.current) {
        socketRef.current.emit("send-canvas-state", {
          documentId,
          dataUrl,
          targetUserId,
        });
      }
    },
    [documentId]
  );

  return {
    isConnected: isConnectedRef.current,
    broadcastDraw,
    broadcastCanvasUpdate,
    sendCanvasStateToUser,
  };
}
