import { useCallback, useEffect, useRef } from "react";
import type { ToolId } from "@/lib/types";
import { useRealtimeCanvas } from "./use-realtime-canvas";

interface UseCanvasProps {
  documentId: string;
  activeTool: ToolId;
  brushSize: number;
  strokeColor: string;
  zoom: number;
  canvasWidth: number;
  canvasHeight: number;
  onDrawComplete: (label: string) => void;
  enableRealtime?: boolean;
}

export function useCanvas({
  documentId,
  activeTool,
  brushSize,
  strokeColor,
  zoom,
  canvasWidth,
  canvasHeight,
  onDrawComplete,
  enableRealtime = true,
}: UseCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const isDrawingRef = useRef(false);
  const storageKeyRef = useRef(`tedit:document:${documentId}`);
  const currentPathRef = useRef<Array<{ x: number; y: number }>>([]);
  
  // Real-time collaboration
  const handleRemoteDraw = useCallback((data: {
    type: "draw" | "image";
    dataUrl?: string;
    path?: Array<{ x: number; y: number }>;
    strokeStyle?: string;
    lineWidth?: number;
  }) => {
    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (!canvas || !context) return;
    
    if (data.type === "image" && data.dataUrl) {
      // Full canvas update
      const image = new Image();
      image.onload = () => {
        context.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
        context.fillStyle = "#f8fafc";
        context.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);
        context.drawImage(image, 0, 0, canvas.clientWidth, canvas.clientHeight);
      };
      image.src = data.dataUrl;
    } else if (data.type === "draw" && data.path && data.path.length > 0) {
      // Draw path
      context.strokeStyle = data.strokeStyle || "#000000";
      context.lineWidth = data.lineWidth || 8;
      context.lineCap = "round";
      context.lineJoin = "round";
      context.beginPath();
      context.moveTo(data.path[0].x, data.path[0].y);
      for (let i = 1; i < data.path.length; i++) {
        context.lineTo(data.path[i].x, data.path[i].y);
      }
      context.stroke();
    }
  }, []);
  
  const { broadcastDraw, broadcastCanvasUpdate } = useRealtimeCanvas({
    documentId,
    onRemoteDraw: enableRealtime ? handleRemoteDraw : () => {},
  });

  const prepareCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    const dpr = window.devicePixelRatio || 1;
    const parentWidth = parent.clientWidth || 1;
    const parentHeight = parent.clientHeight || 1;
    const maxCanvasSize = 8192;
    const scaledWidth = parentWidth * dpr;
    const scaledHeight = parentHeight * dpr;
    const largestDimension = Math.max(scaledWidth, scaledHeight);
    const clampFactor =
      largestDimension > maxCanvasSize
        ? maxCanvasSize / largestDimension
        : 1;
    const effectiveScale = dpr * clampFactor;
    canvas.width = scaledWidth * clampFactor;
    canvas.height = scaledHeight * clampFactor;
    canvas.style.width = `${parent.clientWidth}px`;
    canvas.style.height = `${parent.clientHeight}px`;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.scale(effectiveScale, effectiveScale);
    context.fillStyle = "#f8fafc";
    context.fillRect(0, 0, parent.clientWidth, parent.clientHeight);
    contextRef.current = context;
  }, []);

  const persistCanvas = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const dataUrl = canvas.toDataURL("image/png");
      
      // Save to localStorage for offline support
      localStorage.setItem(storageKeyRef.current, dataUrl);
      
      // Broadcast canvas update for real-time sync
      if (enableRealtime) {
        broadcastCanvasUpdate(dataUrl);
      }
      
      // Also save to backend API for sharing (include size metadata)
      try {
        const response = await fetch(`/api/documents/${documentId}/canvas`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            dataUrl,
            width: canvasWidth,
            height: canvasHeight,
          }),
        });
        
        if (!response.ok) {
          console.warn("Failed to save canvas to backend");
        }
      } catch (apiError) {
        // Backend save failed, but localStorage save succeeded
        console.warn("Backend save failed, using localStorage only:", apiError);
      }
    } catch (error) {
      console.warn("Failed to persist canvas", error);
    }
  }, [documentId, enableRealtime, broadcastCanvasUpdate, canvasWidth, canvasHeight]);

  const restoreCanvas = useCallback(async () => {
    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (!canvas || !context) return;
    
    try {
      let dataUrl: string | null = null;
      
      // Try to load from backend API first (for shared documents)
      try {
        const response = await fetch(`/api/documents/${documentId}/canvas`);
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.dataUrl) {
            dataUrl = result.dataUrl;
            // Also save to localStorage for offline access
            localStorage.setItem(storageKeyRef.current, dataUrl);
          }
        }
      } catch (apiError) {
        // API failed, try localStorage
        console.warn("Backend load failed, trying localStorage:", apiError);
      }
      
      // Fallback to localStorage if API didn't return data
      if (!dataUrl) {
        dataUrl = localStorage.getItem(storageKeyRef.current);
      }
      
      if (!dataUrl) return;
      
      const image = new Image();
      image.onload = () => {
        // Ensure context is still available
        const ctx = contextRef.current;
        const canv = canvasRef.current;
        if (!ctx || !canv) return;
        
        // Draw the saved image on top of the white background
        ctx.drawImage(image, 0, 0, canv.clientWidth, canv.clientHeight);
      };
      image.onerror = () => {
        console.warn("Failed to load saved canvas image");
      };
      image.src = dataUrl;
    } catch (error) {
      console.warn("Failed to restore canvas", error);
    }
  }, [documentId]);

  useEffect(() => {
    // Prepare canvas first
    prepareCanvas();
    
    // Restore saved content after canvas is prepared
    const restoreId = requestAnimationFrame(() => {
      restoreCanvas();
    });
    
    // Prepare canvas on resize, then restore
    const handleResize = () => {
      prepareCanvas();
      requestAnimationFrame(() => {
        restoreCanvas();
      });
    };
    window.addEventListener("resize", handleResize);
    
    // Save before page unload
    const handleBeforeUnload = () => {
      persistCanvas();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    
    // Save periodically as backup (every 5 seconds)
    const saveInterval = setInterval(() => {
      persistCanvas();
    }, 5000);
    
    return () => {
      cancelAnimationFrame(restoreId);
      clearInterval(saveInterval);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      // Save on unmount as well
      persistCanvas();
    };
  }, [prepareCanvas, restoreCanvas, persistCanvas]);

  const getPoint = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    
    // Get the canvas element's bounding rect (accounts for all parent transforms)
    const rect = canvas.getBoundingClientRect();
    
    // Get the canvas's actual logical dimensions from the DOM
    // This is more reliable than trusting the passed props
    const logicalWidth = canvas.clientWidth || canvasWidth;
    const logicalHeight = canvas.clientHeight || canvasHeight;
    
    // If canvas dimensions are 0 or invalid, fallback to passed dimensions
    const validWidth = logicalWidth > 0 ? logicalWidth : canvasWidth;
    const validHeight = logicalHeight > 0 ? logicalHeight : canvasHeight;
    
    // Calculate mouse position relative to the canvas's displayed bounding box
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    
    // The displayed dimensions (after CSS transforms)
    const displayedWidth = rect.width;
    const displayedHeight = rect.height;
    
    // Avoid division by zero
    if (displayedWidth <= 0 || displayedHeight <= 0) {
      return { x: 0, y: 0 };
    }
    
    // Convert from displayed coordinates to logical canvas coordinates
    // This accounts for the scale transform applied by WorkspaceContainer
    const x = (mouseX / displayedWidth) * validWidth;
    const y = (mouseY / displayedHeight) * validHeight;
    
    return { x, y };
  };

  const startDrawing = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      if (activeTool !== "brush" && activeTool !== "eraser") return;
      const point = getPoint(event);
      if (!point) return;
      const context = contextRef.current;
      if (!context) return;
      context.strokeStyle = activeTool === "eraser" ? "#f8fafc" : strokeColor;
      context.lineWidth = brushSize;
      context.lineCap = "round";
      context.lineJoin = "round";
      context.beginPath();
      context.moveTo(point.x, point.y);
      isDrawingRef.current = true;
      currentPathRef.current = [point];
    },
    [activeTool, brushSize, strokeColor],
  );

  const draw = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDrawingRef.current) return;
      const point = getPoint(event);
      if (!point) return;
      const context = contextRef.current;
      if (!context) return;
      context.lineTo(point.x, point.y);
      context.stroke();
      
      // Add point to current path for real-time broadcasting
      currentPathRef.current.push(point);
      
      // Broadcast drawing in real-time (debounced)
      if (enableRealtime && currentPathRef.current.length % 3 === 0) {
        broadcastDraw({
          type: "draw",
          path: [...currentPathRef.current],
          strokeStyle: activeTool === "eraser" ? "#f8fafc" : strokeColor,
          lineWidth: brushSize,
        });
      }
    },
    [activeTool, brushSize, strokeColor, enableRealtime, broadcastDraw],
  );

  const stopDrawing = useCallback(() => {
    if (!isDrawingRef.current) return;
    const context = contextRef.current;
    context?.closePath();
    isDrawingRef.current = false;
    
    // Broadcast final path
    if (enableRealtime && currentPathRef.current.length > 0) {
      broadcastDraw({
        type: "draw",
        path: [...currentPathRef.current],
        strokeStyle: activeTool === "eraser" ? "#f8fafc" : strokeColor,
        lineWidth: brushSize,
      });
    }
    
    currentPathRef.current = [];
    onDrawComplete(
      `${activeTool === "eraser" ? "Erased" : "Painted"} stroke (${brushSize}px)`,
    );
    persistCanvas();
  }, [activeTool, brushSize, strokeColor, onDrawComplete, persistCanvas, enableRealtime, broadcastDraw]);

  useEffect(() => {
    const cancel = () => stopDrawing();
    window.addEventListener("pointerup", cancel);
    return () => window.removeEventListener("pointerup", cancel);
  }, [stopDrawing]);

  const drawImageOnCanvas = useCallback(
    (image: HTMLImageElement) => {
      const canvas = canvasRef.current;
      const context = contextRef.current;
      if (!canvas || !context) return;
      const parent = canvas.parentElement;
      const targetWidth = parent?.clientWidth ?? canvas.clientWidth ?? 1;
      const targetHeight = parent?.clientHeight ?? canvas.clientHeight ?? 1;
      const scale = Math.min(targetWidth / image.width, targetHeight / image.height);
      const drawWidth = image.width * scale;
      const drawHeight = image.height * scale;
      const offsetX = (targetWidth - drawWidth) / 2;
      const offsetY = (targetHeight - drawHeight) / 2;
      const widthRatio = canvas.width / (parent?.clientWidth ?? targetWidth);
      const heightRatio = canvas.height / (parent?.clientHeight ?? targetHeight);
      context.drawImage(
        image,
        offsetX * widthRatio,
        offsetY * heightRatio,
        drawWidth * widthRatio,
        drawHeight * heightRatio,
      );
      onDrawComplete("Imported image");
      persistCanvas();
      
      // Broadcast full canvas update for real-time
      if (enableRealtime && canvas) {
        const dataUrl = canvas.toDataURL("image/png");
        broadcastCanvasUpdate(dataUrl);
      }
    },
    [onDrawComplete, persistCanvas, enableRealtime, broadcastCanvasUpdate],
  );

  return {
    canvasRef,
    startDrawing,
    draw,
    stopDrawing,
    prepareCanvas,
    drawImageOnCanvas,
    restoreCanvas,
  };
}

