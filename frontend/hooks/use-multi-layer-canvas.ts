"use client";

import { useCallback, useEffect, useRef } from "react";
import type { ToolId, Layer } from "@/lib/types";

interface UseMultiLayerCanvasProps {
  documentId: string;
  activeTool: ToolId;
  brushSize: number;
  strokeColor: string;
  zoom: number;
  canvasWidth: number;
  canvasHeight: number;
  layers: Layer[];
  activeLayerId: string | null;
  onDrawComplete: (label: string) => void;
  onLayerCanvasUpdate: (layerId: string, canvas: HTMLCanvasElement | null) => void;
  enableRealtime?: boolean;
}

export function useMultiLayerCanvas({
  documentId,
  activeTool,
  brushSize,
  strokeColor,
  zoom,
  canvasWidth,
  canvasHeight,
  layers,
  activeLayerId,
  onDrawComplete,
  onLayerCanvasUpdate,
  enableRealtime = true,
}: UseMultiLayerCanvasProps) {
  // Main composite canvas (what user sees)
  const compositeCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const compositeContextRef = useRef<CanvasRenderingContext2D | null>(null);
  
  // Layer canvases stored in refs
  const layerCanvasesRef = useRef<Map<string, HTMLCanvasElement>>(new Map());
  const layerContextsRef = useRef<Map<string, CanvasRenderingContext2D>>(new Map());
  
  const isDrawingRef = useRef(false);
  const currentPathRef = useRef<Array<{ x: number; y: number }>>([]);
  const storageKeyRef = useRef(`tedit:document:${documentId}`);
  const hasRestoredRef = useRef(false);
  const hasDrawnRef = useRef(false); // Track if user has drawn anything
  const restoreCanvasRef = useRef<(() => Promise<void>) | null>(null);
  const canvasHasContentRef = useRef<Set<string>>(new Set()); // Track which canvases have content

  // Composite all visible layers onto the main canvas
  const compositeLayers = useCallback(() => {
    const compositeCanvas = compositeCanvasRef.current;
    const compositeContext = compositeContextRef.current;
    if (!compositeCanvas || !compositeContext) return;

    const parent = compositeCanvas.parentElement;
    if (!parent) return;
    
    const logicalWidth = parent.clientWidth || canvasWidth;
    const logicalHeight = parent.clientHeight || canvasHeight;

    // Clear composite canvas and fill with white background
    // The context is already scaled, so use logical dimensions
    compositeContext.clearRect(0, 0, logicalWidth, logicalHeight);
    compositeContext.fillStyle = "#f8fafc";
    compositeContext.fillRect(0, 0, logicalWidth, logicalHeight);
    
    // Draw layers from bottom to top (sorted by order, lower order = bottom)
    const sortedLayers = [...layers]
      .filter((layer) => layer.visible)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)); // Bottom to top

    // Debug: Log to see if we have layers to composite
    if (sortedLayers.length === 0) {
      console.warn("No visible layers to composite");
    }

    for (const layer of sortedLayers) {
      const layerCanvas = layerCanvasesRef.current.get(layer.id);
      if (!layerCanvas) continue;

      // Get the actual dimensions of the layer canvas (its internal pixel dimensions)
      const layerWidth = layerCanvas.width;
      const layerHeight = layerCanvas.height;
      
      // Skip if canvas has no size
      if (layerWidth === 0 || layerHeight === 0) {
        continue;
      }

      const opacity = (layer.opacity ?? 100) / 100;
      compositeContext.save();
      compositeContext.globalAlpha = opacity;
      
      // Draw the layer canvas onto composite
      // Both contexts are scaled, so we draw the full canvas at logical size
      // The layer canvas content is already scaled, so just draw it directly
      compositeContext.drawImage(
        layerCanvas,
        0, 0  // Draw the full canvas at its natural position
      );
      compositeContext.restore();
    }
  }, [layers, canvasWidth, canvasHeight]);

  // Prepare a layer canvas (called when canvas element is created)
  const prepareLayerCanvas = useCallback((layerId: string, canvas: HTMLCanvasElement) => {
    if (!canvas) return;
    
    // ABSOLUTE FIRST CHECK: If canvas has been drawn on, NEVER touch it!
    // This MUST be the very first check - before anything else!
    // Setting canvas.width or canvas.height automatically CLEARS the canvas!
    if (canvasHasContentRef.current.has(layerId) || hasDrawnRef.current) {
      // Canvas has content - just ensure context is stored and return immediately
      // DO NOT touch the canvas at all - not even to check dimensions or parent!
      const existingContext = layerContextsRef.current.get(layerId);
      if (!existingContext) {
        const context = canvas.getContext("2d", { willReadFrequently: true });
        if (context) {
          layerContextsRef.current.set(layerId, context);
        }
      }
      // Ensure canvas is stored in ref even if it already has content
      if (!layerCanvasesRef.current.has(layerId)) {
        layerCanvasesRef.current.set(layerId, canvas);
        onLayerCanvasUpdate(layerId, canvas);
      }
      return; // CRITICAL: Never modify a canvas that has content!
    }
    
    // CRITICAL: Always store canvas in refs, even if we're about to initialize it
    // This ensures the canvas is available for drawing even if initialization hasn't completed
    if (!layerCanvasesRef.current.has(layerId)) {
      layerCanvasesRef.current.set(layerId, canvas);
      onLayerCanvasUpdate(layerId, canvas);
    }
    
    // CRITICAL: Always store canvas in refs immediately, even before initialization
    // This ensures the canvas is available for drawing even if initialization hasn't completed
    if (!layerCanvasesRef.current.has(layerId)) {
      layerCanvasesRef.current.set(layerId, canvas);
      onLayerCanvasUpdate(layerId, canvas);
    }
    
    // Now check parent (safe to do after content check)
    const parent = canvas.parentElement || compositeCanvasRef.current?.parentElement;
    if (!parent) return;
    
    // Check if canvas has default dimensions (300x150) - these need initialization
    const isDefaultSize = canvas.width === 300 && canvas.height === 150;
    const existingCanvas = layerCanvasesRef.current.get(layerId);
    
    // If canvas exists in refs and has proper dimensions (not default), don't modify
    if (existingCanvas && existingCanvas === canvas && canvas.width > 0 && canvas.height > 0 && !isDefaultSize) {
      const existingContext = layerContextsRef.current.get(layerId);
      if (!existingContext) {
        const context = canvas.getContext("2d", { willReadFrequently: true });
        if (context) {
          layerContextsRef.current.set(layerId, context);
        }
      }
      return; // Canvas already initialized - don't modify
    }
    
    // At this point, we only initialize if:
    // 1. Canvas doesn't exist in refs, OR
    // 2. Canvas has default dimensions (300x150) and no content
    
    // Only initialize if canvas has default dimensions (300x150) or no dimensions
    // AND it doesn't have content
    
    // Only initialize NEW empty canvases (width/height are 0)
    // If we get here, the canvas is truly new or empty
    const dpr = window.devicePixelRatio || 1;
    const parentWidth = parent.clientWidth || canvasWidth;
    const parentHeight = parent.clientHeight || canvasHeight;
    
    const maxCanvasSize = 8192;
    const scaledWidth = parentWidth * dpr;
    const scaledHeight = parentHeight * dpr;
    const largestDimension = Math.max(scaledWidth, scaledHeight);
    const clampFactor = largestDimension > maxCanvasSize ? maxCanvasSize / largestDimension : 1;
    const effectiveScale = dpr * clampFactor;
    
    // ONLY set dimensions if canvas has default dimensions (300x150) or no dimensions
    // Setting width/height clears the canvas - this is safe only for new/default canvases
    // CRITICAL: We already checked above - if canvas has content, we returned early
    // So we know this canvas doesn't have content that would be lost
    if (canvas.width === 0 || canvas.height === 0 || isDefaultSize) {
      canvas.width = scaledWidth * clampFactor;
      canvas.height = scaledHeight * clampFactor;
      canvas.style.width = `${parentWidth}px`;
      canvas.style.height = `${parentHeight}px`;
      
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) return;
      
      context.scale(effectiveScale, effectiveScale);
      
      // Initialize with transparent background for new canvas
      context.clearRect(0, 0, parentWidth, parentHeight);
      
      // Canvas should already be in refs from earlier, but ensure it's there
      layerCanvasesRef.current.set(layerId, canvas);
      layerContextsRef.current.set(layerId, context);
      // Only call onLayerCanvasUpdate if we didn't call it earlier
      if (!layerCanvasesRef.current.has(layerId) || layerCanvasesRef.current.get(layerId) !== canvas) {
        onLayerCanvasUpdate(layerId, canvas);
      }
      
      // Re-composite after preparing new layer
      requestAnimationFrame(() => compositeLayers());
    }
  }, [canvasWidth, canvasHeight, onLayerCanvasUpdate, compositeLayers]);

  // Prepare composite canvas
  const prepareCompositeCanvas = useCallback(() => {
    const canvas = compositeCanvasRef.current;
    if (!canvas) return;
    
    const parent = canvas.parentElement;
    if (!parent) return;
    
    const dpr = window.devicePixelRatio || 1;
    const parentWidth = parent.clientWidth || canvasWidth;
    const parentHeight = parent.clientHeight || canvasHeight;
    const maxCanvasSize = 8192;
    const scaledWidth = parentWidth * dpr;
    const scaledHeight = parentHeight * dpr;
    const largestDimension = Math.max(scaledWidth, scaledHeight);
    const clampFactor = largestDimension > maxCanvasSize ? maxCanvasSize / largestDimension : 1;
    const effectiveScale = dpr * clampFactor;
    
    canvas.width = scaledWidth * clampFactor;
    canvas.height = scaledHeight * clampFactor;
    canvas.style.width = `${parent.clientWidth}px`;
    canvas.style.height = `${parent.clientHeight}px`;
    
    const context = canvas.getContext("2d");
    if (!context) return;
    
    context.scale(effectiveScale, effectiveScale);
    compositeContextRef.current = context;
  }, [canvasWidth, canvasHeight]);

  // Get point coordinates relative to canvas
  const getPoint = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = compositeCanvasRef.current;
    if (!canvas) return null;
    
    const rect = canvas.getBoundingClientRect();
    const logicalWidth = canvas.clientWidth || canvasWidth;
    const logicalHeight = canvas.clientHeight || canvasHeight;
    const validWidth = logicalWidth > 0 ? logicalWidth : canvasWidth;
    const validHeight = logicalHeight > 0 ? logicalHeight : canvasHeight;
    
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    const displayedWidth = rect.width;
    const displayedHeight = rect.height;
    
    if (displayedWidth <= 0 || displayedHeight <= 0) {
      return { x: 0, y: 0 };
    }
    
    const x = (mouseX / displayedWidth) * validWidth;
    const y = (mouseY / displayedHeight) * validHeight;
    
    return { x, y };
  };

  // Start drawing on active layer
  const startDrawing = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      // Fix operator precedence - check if tool is valid
      if (!activeLayerId) {
        console.log("startDrawing: No activeLayerId");
        return;
      }
      
      if (activeTool !== "brush" && activeTool !== "pencil" && activeTool !== "eraser") {
        console.log("startDrawing: Invalid tool:", activeTool);
        return;
      }
      
      const activeLayer = layers.find((l) => l.id === activeLayerId);
      if (!activeLayer) {
        console.log("startDrawing: Active layer not found:", activeLayerId);
        return;
      }
      if (activeLayer.locked) {
        console.log("startDrawing: Layer is locked");
        return;
      }
      
      const point = getPoint(event);
      if (!point) {
        console.log("startDrawing: No point from event");
        return;
      }
      
      console.log("startDrawing: Starting draw on layer:", activeLayerId, "at point:", point);
      console.log("startDrawing: Available layer canvases:", Array.from(layerCanvasesRef.current.keys()));
      
      // Ensure layer canvas exists and is ready
      let layerCanvas = layerCanvasesRef.current.get(activeLayerId);
      let context = layerContextsRef.current.get(activeLayerId);
      
      if (!layerCanvas) {
        console.error("Layer canvas not found for layer:", activeLayerId);
        console.error("Available layer canvases:", Array.from(layerCanvasesRef.current.keys()));
        console.error("Current layers:", layers.map(l => l.id));
        return;
      }
      
      console.log("startDrawing: Layer canvas found, dimensions:", layerCanvas.width, "x", layerCanvas.height);
      
      // Ensure canvas has proper dimensions (not just default 300x150)
      const compositeCanvas = compositeCanvasRef.current;
      const parent = compositeCanvas?.parentElement;
      const expectedWidth = parent?.clientWidth || canvasWidth;
      const expectedHeight = parent?.clientHeight || canvasHeight;
      
      // Check if canvas needs initialization or resizing
      const dpr = window.devicePixelRatio || 1;
      const maxCanvasSize = 8192;
      const scaledWidth = expectedWidth * dpr;
      const scaledHeight = expectedHeight * dpr;
      const largestDimension = Math.max(scaledWidth, scaledHeight);
      const clampFactor = largestDimension > maxCanvasSize ? maxCanvasSize / largestDimension : 1;
      const expectedPixelWidth = scaledWidth * clampFactor;
      const expectedPixelHeight = scaledHeight * clampFactor;
      
      // If canvas has wrong dimensions (default 300x150 or mismatched), reinitialize
      if (layerCanvas.width === 0 || layerCanvas.height === 0 || 
          layerCanvas.width === 300 || layerCanvas.height === 150 ||
          Math.abs(layerCanvas.width - expectedPixelWidth) > 10 ||
          Math.abs(layerCanvas.height - expectedPixelHeight) > 10) {
        console.log("Canvas dimensions incorrect, reinitializing...", {
          current: `${layerCanvas.width}x${layerCanvas.height}`,
          expected: `${expectedPixelWidth}x${expectedPixelHeight}`
        });
        prepareLayerCanvas(activeLayerId, layerCanvas);
        // Re-get canvas and context after preparation
        const updatedCanvas = layerCanvasesRef.current.get(activeLayerId);
        if (updatedCanvas) {
          layerCanvas = updatedCanvas;
        }
        context = layerContextsRef.current.get(activeLayerId) || undefined;
        if (!context) {
          const newContext = layerCanvas.getContext("2d", { willReadFrequently: true });
          if (newContext) {
            context = newContext;
            layerContextsRef.current.set(activeLayerId, context);
          }
        }
      }
      
      // Ensure we have context
      if (!context) {
        const newCtx = layerCanvas.getContext("2d", { willReadFrequently: true });
        if (!newCtx) {
          console.error("Failed to get context from layer canvas");
          return;
        }
        context = newCtx;
        layerContextsRef.current.set(activeLayerId, context);
      }
      
      // Ensure context properties are set correctly
      context.strokeStyle = activeTool === "eraser" ? "rgba(0,0,0,0)" : strokeColor;
      context.lineWidth = brushSize;
      
      if (activeTool === "pencil") {
        context.lineCap = "square";
        context.lineJoin = "miter";
        context.globalCompositeOperation = "source-over";
      } else if (activeTool === "eraser") {
        context.globalCompositeOperation = "destination-out";
      } else {
        context.lineCap = "round";
        context.lineJoin = "round";
        context.globalCompositeOperation = "source-over";
      }
      
      context.beginPath();
      context.moveTo(point.x, point.y);
      isDrawingRef.current = true;
      currentPathRef.current = [point];
      hasDrawnRef.current = true;
      
      console.log("✅ Starting draw - canvas:", layerCanvas.width, "x", layerCanvas.height, "point:", point);
    },
    [activeTool, brushSize, strokeColor, activeLayerId, layers, prepareLayerCanvas]
  );

  // Continue drawing on active layer
  const draw = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDrawingRef.current || !activeLayerId) return;
      
      const point = getPoint(event);
      if (!point) return;
      
      // Ensure we have the context and canvas
      let context = layerContextsRef.current.get(activeLayerId);
      const layerCanvas = layerCanvasesRef.current.get(activeLayerId);
      
      if (!layerCanvas) {
        console.warn("Cannot draw - layer canvas not available for layer:", activeLayerId);
        return;
      }
      
      // Get context if we don't have it
      if (!context) {
        const newCtx = layerCanvas.getContext("2d", { willReadFrequently: true });
        if (!newCtx) {
          console.warn("Cannot draw - failed to get layer context");
          return;
        }
        context = newCtx;
        layerContextsRef.current.set(activeLayerId, context);
        // Set up context properties for drawing
        context.strokeStyle = activeTool === "eraser" ? "rgba(0,0,0,0)" : strokeColor;
        context.lineWidth = brushSize;
        context.lineCap = activeTool === "pencil" ? "square" : "round";
        context.lineJoin = activeTool === "pencil" ? "miter" : "round";
        context.globalCompositeOperation = activeTool === "eraser" ? "destination-out" : "source-over";
      }
      
      // Draw on the layer canvas
      context.lineTo(point.x, point.y);
      context.stroke();
      
      // CRITICAL: Mark that we've drawn - this prevents canvas from being cleared
      hasDrawnRef.current = true;
      canvasHasContentRef.current.add(activeLayerId);
      
      currentPathRef.current.push(point);
      
      // Composite immediately to show the stroke - use requestAnimationFrame for better timing
      requestAnimationFrame(() => {
        compositeLayers();
      });
      
      // Broadcast drawing (would integrate with realtime here)
      // if (enableRealtime && currentPathRef.current.length % 3 === 0) {
      //   broadcastDraw(...)
      // }
    },
    [activeLayerId, compositeLayers]
  );

  // Persist canvas state - defined before stopDrawing to avoid reference error
  const persistCanvas = useCallback(async () => {
    const compositeCanvas = compositeCanvasRef.current;
    if (!compositeCanvas) return;
    
    try {
      const dataUrl = compositeCanvas.toDataURL("image/png");
      
      // Save to localStorage
      localStorage.setItem(storageKeyRef.current, dataUrl);
      
      // Save layer data separately
          // Get layer data from all existing layer canvases (don't depend on layers array)
          const layerData: Record<string, string> = {};
          layerCanvasesRef.current.forEach((layerCanvas, layerId) => {
            layerData[layerId] = layerCanvas.toDataURL("image/png");
          });
          localStorage.setItem(`${storageKeyRef.current}:layers`, JSON.stringify(layerData));
      
      // Save to backend API
      try {
        const response = await fetch(`/api/documents/${documentId}/canvas`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            dataUrl,
            width: canvasWidth,
            height: canvasHeight,
            layers: layerData,
          }),
        });
        
        if (!response.ok) {
          console.warn("Failed to save canvas to backend");
        }
      } catch (apiError) {
        console.warn("Backend save failed:", apiError);
      }
    } catch (error) {
      console.warn("Failed to persist canvas", error);
    }
  }, [documentId, canvasWidth, canvasHeight, layers]);

  // Stop drawing
  const stopDrawing = useCallback(() => {
    if (!isDrawingRef.current) return;
    
    const context = layerContextsRef.current.get(activeLayerId || "");
    context?.closePath();
    isDrawingRef.current = false;
    
    currentPathRef.current = [];
    
    // Force composite immediately after drawing stops to show final stroke
    compositeLayers();
    // Composite again after a frame to ensure it's visible
    requestAnimationFrame(() => {
      compositeLayers();
    });
    
    onDrawComplete(
      `${activeTool === "eraser" ? "Erased" : "Painted"} stroke (${brushSize}px)`
    );
    
    // Persist canvas
    persistCanvas();
  }, [activeLayerId, activeTool, brushSize, compositeLayers, onDrawComplete, persistCanvas]);

  // Restore canvas state - only restore once on mount, never after drawing starts
  const restoreCanvas = useCallback(async () => {
    // Never restore if user has drawn anything - this prevents overwriting drawings
    if (hasDrawnRef.current || hasRestoredRef.current) return;
    
    try {
      // Wait a bit to ensure all layer canvases are ready
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Try to load from backend first
      let layerData: Record<string, string> | null = null;
      
      try {
        const response = await fetch(`/api/documents/${documentId}/canvas`);
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.layers) {
            layerData = result.layers;
            localStorage.setItem(`${storageKeyRef.current}:layers`, JSON.stringify(layerData));
          }
        }
      } catch (apiError) {
        console.warn("Backend load failed, trying localStorage:", apiError);
      }
      
      // Fallback to localStorage
      if (!layerData) {
        const stored = localStorage.getItem(`${storageKeyRef.current}:layers`);
        if (stored) {
          try {
            layerData = JSON.parse(stored);
          } catch (e) {
            console.warn("Failed to parse stored layer data:", e);
          }
        }
      }
      
      // Mark as restored BEFORE restoring (prevents race conditions)
      hasRestoredRef.current = true;
      
      if (!layerData || Object.keys(layerData).length === 0) {
        return;
      }
      
      // Restore each layer - only if canvas exists and hasn't been drawn on
      const currentLayers = layerCanvasesRef.current.keys();
      for (const layerId of currentLayers) {
        const layerCanvas = layerCanvasesRef.current.get(layerId);
        const layerContext = layerContextsRef.current.get(layerId);
        if (!layerCanvas || !layerContext) continue;
        
        const layerImageData = layerData[layerId];
        if (!layerImageData) continue;
        
        // Check if canvas is already drawn on (has non-transparent pixels)
        // If so, skip restoring to preserve user drawings
        try {
          const imageData = layerContext.getImageData(0, 0, Math.min(100, layerCanvas.width), Math.min(100, layerCanvas.height));
          let hasContent = false;
          for (let i = 3; i < imageData.data.length; i += 4) {
            if (imageData.data[i] > 0) { // Alpha channel > 0 means content exists
              hasContent = true;
              break;
            }
          }
          if (hasContent) {
            continue; // Skip restoring this layer - it already has drawings
          }
        } catch (e) {
          // If check fails, proceed with restore
        }
        
        const image = new Image();
                    image.onload = () => {
                      // Double check we still have the context (might have changed during async load)
                      const ctx = layerContextsRef.current.get(layerId);
                      const canv = layerCanvasesRef.current.get(layerId);
                      if (!ctx || !canv) return;
                      
                      const parent = canv.parentElement;
                      const logicalWidth = parent?.clientWidth || canvasWidth;
                      const logicalHeight = parent?.clientHeight || canvasHeight;
                      
                      // Only restore if we haven't started drawing yet
                      if (!hasRestoredRef.current) return;
                      
                      ctx.clearRect(0, 0, logicalWidth, logicalHeight);
                      ctx.drawImage(image, 0, 0, logicalWidth, logicalHeight);
                      
                      // Mark this canvas as having content so it won't be cleared
                      canvasHasContentRef.current.add(layerId);
                      
                      // Composite after restoring
                      requestAnimationFrame(() => compositeLayers());
                    };
        image.onerror = () => {
          console.warn(`Failed to load image for layer ${layerId}`);
        };
        image.src = layerImageData;
      }
    } catch (error) {
      console.warn("Failed to restore canvas", error);
      hasRestoredRef.current = true;
    }
  }, [documentId, canvasWidth, canvasHeight, compositeLayers]);
  
  // Store restoreCanvas in ref whenever it changes
  useEffect(() => {
    restoreCanvasRef.current = restoreCanvas;
  }, [restoreCanvas]);

  // Draw image on active layer
  const drawImageOnCanvas = useCallback(
    (image: HTMLImageElement) => {
      if (!activeLayerId) return;
      
      const layerCanvas = layerCanvasesRef.current.get(activeLayerId);
      const layerContext = layerContextsRef.current.get(activeLayerId);
      if (!layerCanvas || !layerContext) return;
      
      const parent = layerCanvas.parentElement;
      const targetWidth = parent?.clientWidth ?? canvasWidth;
      const targetHeight = parent?.clientHeight ?? canvasHeight;
      
      const scale = Math.min(targetWidth / image.width, targetHeight / image.height);
      const drawWidth = image.width * scale;
      const drawHeight = image.height * scale;
      const offsetX = (targetWidth - drawWidth) / 2;
      const offsetY = (targetHeight - drawHeight) / 2;
      
      const dpr = window.devicePixelRatio || 1;
      const widthRatio = layerCanvas.width / (parent?.clientWidth ?? targetWidth) / dpr;
      const heightRatio = layerCanvas.height / (parent?.clientHeight ?? targetHeight) / dpr;
      
      layerContext.drawImage(
        image,
        offsetX * widthRatio,
        offsetY * heightRatio,
        drawWidth * widthRatio,
        drawHeight * heightRatio
      );
      
      compositeLayers();
      onDrawComplete("Imported image");
      persistCanvas();
    },
    [activeLayerId, canvasWidth, canvasHeight, compositeLayers, onDrawComplete, persistCanvas]
  );

  // Re-composite when layers visibility or order changes
  const prevLayersRef = useRef<string>("");
  
  useEffect(() => {
    const currentLayersKey = JSON.stringify(layers.map(l => ({ id: l.id, visible: l.visible, order: l.order })));
    if (prevLayersRef.current !== currentLayersKey) {
      prevLayersRef.current = currentLayersKey;
      compositeLayers();
    }
  }, [layers, compositeLayers]);

  // Initialize composite canvas - restore only once on mount
  useEffect(() => {
    prepareCompositeCanvas();
    
    // Only restore canvas data once on initial mount
    // Use refs to avoid dependency array changes
    const shouldRestore = !hasRestoredRef.current;
    if (shouldRestore && restoreCanvasRef.current) {
      requestAnimationFrame(() => {
        // Only restore if we haven't drawn yet and have canvases ready
        if (!hasDrawnRef.current && layerCanvasesRef.current.size > 0) {
          restoreCanvasRef.current?.();
        }
      });
    }
    
    const handleResize = () => {
      prepareCompositeCanvas();
      requestAnimationFrame(() => {
        compositeLayers();
      });
    };
    
    window.addEventListener("resize", handleResize);
    
    const handleBeforeUnload = () => {
      // Persist canvas data on page unload
      const compositeCanvas = compositeCanvasRef.current;
      if (compositeCanvas) {
        try {
          const dataUrl = compositeCanvas.toDataURL("image/png");
          localStorage.setItem(storageKeyRef.current, dataUrl);
          
          // Get layer data from all existing layer canvases
          const layerData: Record<string, string> = {};
          layerCanvasesRef.current.forEach((layerCanvas, layerId) => {
            layerData[layerId] = layerCanvas.toDataURL("image/png");
          });
          localStorage.setItem(`${storageKeyRef.current}:layers`, JSON.stringify(layerData));
        } catch (error) {
          console.warn("Failed to persist canvas on unload", error);
        }
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    
    const saveInterval = setInterval(() => {
      // Auto-save every 5 seconds
      const compositeCanvas = compositeCanvasRef.current;
      if (compositeCanvas) {
        try {
          const dataUrl = compositeCanvas.toDataURL("image/png");
          localStorage.setItem(storageKeyRef.current, dataUrl);
          
          const layerData: Record<string, string> = {};
          layerCanvasesRef.current.forEach((layerCanvas, layerId) => {
            layerData[layerId] = layerCanvas.toDataURL("image/png");
          });
          localStorage.setItem(`${storageKeyRef.current}:layers`, JSON.stringify(layerData));
        } catch (error) {
          console.warn("Failed to persist canvas", error);
        }
      }
    }, 5000);
    
    return () => {
      clearInterval(saveInterval);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      // Final persist on cleanup
      handleBeforeUnload();
    };
    // Stable dependency array - only include stable callbacks
    // restoreCanvas is accessed via ref to avoid dependency changes
  }, [prepareCompositeCanvas, compositeLayers]);

  return {
    compositeCanvasRef,
    startDrawing,
    draw,
    stopDrawing,
    prepareCompositeCanvas,
    drawImageOnCanvas,
    restoreCanvas,
    compositeLayers,
    prepareLayerCanvas,
    getLayerCanvas: (layerId: string) => layerCanvasesRef.current.get(layerId),
  };
}

