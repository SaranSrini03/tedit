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
  const hasDrawnRef = useRef(false); // Track if user has drawn anything (reset on mount)
  const restoreCanvasRef = useRef<(() => Promise<void>) | null>(null);
  const canvasHasContentRef = useRef<Set<string>>(new Set()); // Track which canvases have content
  const autoSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null); // For debounced auto-save
  
  // Reset hasDrawnRef on mount - user hasn't drawn anything yet on a fresh page load
  // BUT don't clear canvasHasContentRef - it will be populated after restoration
  useEffect(() => {
    hasDrawnRef.current = false;
    hasRestoredRef.current = false;
    // Don't clear canvasHasContentRef - it will be set during restoration
    // canvasHasContentRef.current.clear();
  }, []);

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


    for (const layer of sortedLayers) {
      const layerCanvas = layerCanvasesRef.current.get(layer.id);
      if (!layerCanvas) {
        continue;
      }

      // Get the actual dimensions of the layer canvas (its internal pixel dimensions)
      const layerWidth = layerCanvas.width;
      const layerHeight = layerCanvas.height;
      
      // Skip if canvas has no size
      if (layerWidth === 0 || layerHeight === 0) {
        continue;
      }

      // Check if layer has content - but always composite if canvas has proper dimensions
      // (restored layers might have content even if not marked yet)
      const hasContent = canvasHasContentRef.current.has(layer.id);
      if (!hasContent && (layerWidth === 300 && layerHeight === 150)) {
        // Likely default/empty canvas - but only skip if truly default size
        // Don't skip if it has proper dimensions (might be restored content)
        continue;
      }

      const opacity = (layer.opacity ?? 100) / 100;
      compositeContext.save();
      compositeContext.globalAlpha = opacity;
      
      // Draw the layer canvas onto composite
      // Both contexts are scaled the same way, so draw the full canvas directly
      compositeContext.drawImage(
        layerCanvas,
        0, 0  // Draw the full layer canvas (both are scaled, so this works correctly)
      );
      compositeContext.restore();
    }
  }, [layers, canvasWidth, canvasHeight]);

  // Prepare a layer canvas (called when canvas element is created)
  const prepareLayerCanvas = useCallback((layerId: string, canvas: HTMLCanvasElement) => {
    if (!canvas) return;
    
    // ABSOLUTE FIRST CHECK: If canvas has been drawn on OR restored, NEVER touch it!
    // This MUST be the very first check - before anything else!
    // Setting canvas.width or canvas.height automatically CLEARS the canvas!
    
    // Check if canvas already has content (drawn or restored)
    const hasContent = canvasHasContentRef.current.has(layerId);
    const hasBeenDrawn = hasDrawnRef.current;
    const hasBeenRestored = hasRestoredRef.current;
    
    // Check if canvas has non-default dimensions (indicates it's been initialized/used)
    const hasValidDimensions = canvas.width > 300 && canvas.height > 150;
    
    if (hasContent || hasBeenDrawn || (hasBeenRestored && hasValidDimensions)) {
      // Canvas has content or has been restored - just ensure context is stored and return immediately
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
      
      // If restored and has valid dimensions, mark as having content to protect it
      if (hasBeenRestored && hasValidDimensions && !hasContent) {
        canvasHasContentRef.current.add(layerId);
      }
      
      return; // CRITICAL: Never modify a canvas that has content!
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
        return;
      }
      
      if (activeTool !== "brush" && activeTool !== "pencil" && activeTool !== "eraser") {
        return;
      }
      
      const activeLayer = layers.find((l) => l.id === activeLayerId);
      if (!activeLayer) {
        return;
      }
      if (activeLayer.locked) {
        return;
      }
      
      const point = getPoint(event);
      if (!point) {
        return;
      }
      
      // Ensure layer canvas exists and is ready
      let layerCanvas = layerCanvasesRef.current.get(activeLayerId);
      let context = layerContextsRef.current.get(activeLayerId);
      
      if (!layerCanvas) {
        // Canvas not found - might be a new layer that hasn't been created yet
        // Try to find it in the layers array
        const activeLayer = layers.find((l) => l.id === activeLayerId);
        if (activeLayer) {
          // Layer exists but canvas not ready yet - try to find it from the DOM
          // This can happen if the layer was just created and React hasn't finished rendering
          const compositeCanvas = compositeCanvasRef.current;
          const container = compositeCanvas?.parentElement;
          if (container) {
            // Look for the canvas element with matching data-layer-id attribute
            const layerCanvasElement = container.querySelector(`canvas[data-layer-id="${activeLayerId}"]`) as HTMLCanvasElement;
            if (layerCanvasElement) {
              // Found the layer canvas - prepare it immediately
              prepareLayerCanvas(activeLayerId, layerCanvasElement);
              layerCanvas = layerCanvasesRef.current.get(activeLayerId);
            }
          }
          
          if (!layerCanvas) {
            // Return early - canvas will be created by MultiLayerCanvasRenderer
            // User will need to try drawing again after a moment
            return;
          }
        } else {
          return;
        }
      }
      
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
        return;
      }
      
      // Get context if we don't have it
      if (!context) {
        const newCtx = layerCanvas.getContext("2d", { willReadFrequently: true });
        if (!newCtx) {
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
        // Auto-save after drawing (debounced) - save after compositing
        if (autoSaveTimeoutRef.current) {
          clearTimeout(autoSaveTimeoutRef.current);
        }
        autoSaveTimeoutRef.current = setTimeout(() => {
          persistCanvas();
        }, 500); // Save 0.5 seconds after last stroke (reduced from 1 second)
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
    if (!compositeCanvas) {
      return;
    }
    
    try {
      // Get layer data from all existing layer canvases
      const layerData: Record<string, string> = {};
      layerCanvasesRef.current.forEach((layerCanvas, layerId) => {
        try {
          // Only save if canvas exists and has valid dimensions
          if (!layerCanvas) {
            return;
          }
          
          if (layerCanvas.width === 0 || layerCanvas.height === 0) {
            return;
          }
          
          // Check if this layer has been marked as having content
          const hasContent = canvasHasContentRef.current.has(layerId);
          
          // Always try to get data URL - save all canvases with valid dimensions
          // Even if empty, we need to save to maintain layer structure
          const dataUrl = layerCanvas.toDataURL("image/png");
          
          if (dataUrl && dataUrl.length > 50) { // Base64 PNG data URLs are at least "data:image/png;base64,"
            layerData[layerId] = dataUrl;
          }
        } catch (e) {
          // Failed to get data URL for layer
        }
      });
      
      const layerIds = Object.keys(layerData);
      if (layerIds.length === 0) {
        return;
      }
      
      try {
        // Save layer data to localStorage
        const storageKey = `${storageKeyRef.current}:layers`;
        localStorage.setItem(storageKey, JSON.stringify(layerData));
      } catch (e) {
        // Failed to save to localStorage
      }
      
      // Also save composite canvas for quick preview
      try {
        const dataUrl = compositeCanvas.toDataURL("image/png");
        localStorage.setItem(storageKeyRef.current, dataUrl);
      } catch (e) {
        // Failed to save composite canvas
      }
      
      // Save to backend API
      try {
        const response = await fetch(`/api/documents/${documentId}/canvas`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            dataUrl: compositeCanvas.toDataURL("image/png"),
            width: canvasWidth,
            height: canvasHeight,
            layers: layerData,
          }),
        });
        
        if (!response.ok) {
          // Failed to save canvas to backend
        }
      } catch (apiError) {
        // Backend save failed
      }
    } catch (error) {
      // Failed to persist canvas
    }
  }, [documentId, canvasWidth, canvasHeight]);

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
      // Persist immediately after compositing
      persistCanvas();
    });
    
    onDrawComplete(
      `${activeTool === "eraser" ? "Erased" : "Painted"} stroke (${brushSize}px)`
    );
  }, [activeLayerId, activeTool, brushSize, compositeLayers, onDrawComplete, persistCanvas]);

  // Restore canvas state - only restore once on mount, never after drawing starts
  const restoreCanvas = useCallback(async () => {
    // Never restore if already restored
    if (hasRestoredRef.current) {
      return;
    }
    
    // Never restore if user has drawn anything - this prevents overwriting drawings
    if (hasDrawnRef.current) {
      return;
    }
    
    try {
      // Wait longer to ensure all layers are loaded from localStorage and canvases are created
      // Layers are loaded in useLayerStack useEffect, which might take a moment
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Wait for all layer canvases to be created (they're created when layers are loaded)
      // Keep checking until we have canvases matching layers or timeout after 5 seconds
      for (let attempt = 0; attempt < 50; attempt++) {
        // Check if we have canvases for all layers
        const allCanvasesReady = layers.every(layer => layerCanvasesRef.current.has(layer.id));
        if (allCanvasesReady || layerCanvasesRef.current.size >= layers.length) {
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
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
        // Backend load failed, trying localStorage
      }
      
      // Fallback to localStorage
      if (!layerData) {
        const stored = localStorage.getItem(`${storageKeyRef.current}:layers`);
        if (stored) {
          try {
            layerData = JSON.parse(stored);
          } catch (e) {
            // Failed to parse stored layer data
          }
        }
      }
      
      if (!layerData || Object.keys(layerData).length === 0) {
        hasRestoredRef.current = true; // Mark as restored even if no data (prevents infinite retries)
        return;
      }
      
      // Restore each layer - iterate through layerData keys to restore all saved layers
      let restoredCount = 0;
      const restorePromises: Promise<void>[] = [];
      
      for (const layerId of Object.keys(layerData)) {
        // Wait for canvas to be created if it doesn't exist yet
        let layerCanvas = layerCanvasesRef.current.get(layerId);
        let layerContext = layerContextsRef.current.get(layerId);
        
        // If canvas doesn't exist, wait a bit and try again (layer might be created later)
        if (!layerCanvas) {
          // Wait up to 3 seconds for canvas to be created
          for (let i = 0; i < 30; i++) {
            await new Promise(resolve => setTimeout(resolve, 100));
            layerCanvas = layerCanvasesRef.current.get(layerId);
            if (layerCanvas) {
              break;
            }
          }
        }
        
        if (!layerCanvas) {
          continue;
        }
        
        // Get context if we don't have it
        if (!layerContext) {
          const newContext = layerCanvas.getContext("2d", { willReadFrequently: true });
          if (newContext) {
            layerContext = newContext;
            layerContextsRef.current.set(layerId, layerContext);
          }
        }
        
        if (!layerContext) {
          continue;
        }
        
        const layerImageData = layerData[layerId];
        if (!layerImageData) continue;
        
        // Always restore - don't check for existing content since this is a fresh load
        const image = new Image();
        
        // Create a promise that resolves when the image loads and is drawn
        const loadPromise = new Promise<void>((resolve) => {
          image.onload = () => {
            try {
              // Double check we still have the context (might have changed during async load)
              const ctx = layerContextsRef.current.get(layerId);
              const canv = layerCanvasesRef.current.get(layerId);
              if (!ctx || !canv) {
                restoredCount++;
                resolve();
                return;
              }
              
              const parent = canv.parentElement;
              const logicalWidth = parent?.clientWidth || canvasWidth;
              const logicalHeight = parent?.clientHeight || canvasHeight;
              
              // Ensure canvas has proper dimensions before drawing
              if (canv.width === 0 || canv.height === 0) {
                const dpr = window.devicePixelRatio || 1;
                const maxCanvasSize = 8192;
                const scaledWidth = logicalWidth * dpr;
                const scaledHeight = logicalHeight * dpr;
                const largestDimension = Math.max(scaledWidth, scaledHeight);
                const clampFactor = largestDimension > maxCanvasSize ? maxCanvasSize / largestDimension : 1;
                
                canv.width = scaledWidth * clampFactor;
                canv.height = scaledHeight * clampFactor;
                canv.style.width = `${logicalWidth}px`;
                canv.style.height = `${logicalHeight}px`;
                
                const effectiveScale = dpr * clampFactor;
                ctx.scale(effectiveScale, effectiveScale);
              }
              
              // Clear and draw the restored image at full canvas size
              ctx.clearRect(0, 0, logicalWidth, logicalHeight);
              
              // Get the DPR and scaling that was used when saving
              const dpr = window.devicePixelRatio || 1;
              const maxCanvasSize = 8192;
              const scaledWidth = logicalWidth * dpr;
              const scaledHeight = logicalHeight * dpr;
              const largestDimension = Math.max(scaledWidth, scaledHeight);
              const clampFactor = largestDimension > maxCanvasSize ? maxCanvasSize / largestDimension : 1;
              
              // Draw the image to fill the canvas at logical size
              // The context is already scaled, so we draw at logical dimensions
              // The saved image should be at logical size
              ctx.drawImage(image, 0, 0, logicalWidth, logicalHeight);
              
              // Force immediate update to ensure image is drawn
              ctx.save();
              ctx.restore();
              
              // CRITICAL: Mark this canvas as having content IMMEDIATELY so prepareLayerCanvas won't clear it
              canvasHasContentRef.current.add(layerId);
              
              restoredCount++;
              
              // Don't composite here - wait for all layers to restore, then composite once at the end
              resolve();
            } catch (e) {
              restoredCount++;
              resolve(); // Resolve anyway to continue
            }
          };
          
          image.onerror = () => {
            restoredCount++;
            resolve(); // Resolve anyway to continue
          };
        });
        
        restorePromises.push(loadPromise);
        image.src = layerImageData;
      }
      
      // Wait for ALL images to load before marking as restored
      await Promise.all(restorePromises);
      
      // Mark as restored after all images have loaded
      hasRestoredRef.current = true;
      
      // Wait a bit to ensure all canvas updates are complete
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Force multiple composites to ensure visibility
      compositeLayers();
      
      // Composite multiple times with delays to ensure it's visible
      requestAnimationFrame(() => {
        compositeLayers();
        setTimeout(() => {
          compositeLayers();
          setTimeout(() => {
            compositeLayers();
          }, 100);
        }, 100);
      });
    } catch (error) {
      hasRestoredRef.current = true; // Mark as restored even on error (prevents infinite retries)
    }
  }, [documentId, canvasWidth, canvasHeight, compositeLayers, layers]);
  
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
  
  // Trigger restoration when layers are loaded from localStorage
  // This ensures canvas data is restored after layers are restored
  useEffect(() => {
    if (hasRestoredRef.current || hasDrawnRef.current) return;
    if (layers.length === 0) return;
    if (!restoreCanvasRef.current) return;
    
    // Wait for layer canvases to be created (they're created by MultiLayerCanvasRenderer)
    const timeoutId = setTimeout(async () => {
      // Wait up to 5 seconds for all canvases to be ready
      for (let attempt = 0; attempt < 50; attempt++) {
        // Check if we have canvases for all layers
        const allCanvasesReady = layers.every(layer => layerCanvasesRef.current.has(layer.id));
        const enoughCanvases = layerCanvasesRef.current.size >= layers.length;
        
        if (allCanvasesReady || enoughCanvases) {
          // All layer canvases are ready
          if (restoreCanvasRef.current && !hasRestoredRef.current) {
            await restoreCanvasRef.current();
          }
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [layers.length]); // Trigger when layers are loaded

  // Initialize composite canvas on mount
  useEffect(() => {
    prepareCompositeCanvas();
    // Note: Restoration is handled by the layers.length effect above
    // which waits for layers to be loaded from localStorage
    
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
          // Failed to persist canvas on unload
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
          // Failed to persist canvas
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



