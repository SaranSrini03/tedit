"use client";

import type React from "react";
import { useEffect, useRef, useState } from "react";
import type { ToolId, Layer } from "@/lib/types";

interface MultiLayerCanvasRendererProps {
  compositeCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  layers: Layer[];
  activeTool: ToolId;
  brushSize: number;
  isDrawingDisabled: boolean;
  canvasWidth: number;
  canvasHeight: number;
  onStartDrawing: (event: React.PointerEvent<HTMLCanvasElement>) => void;
  onDraw: (event: React.PointerEvent<HTMLCanvasElement>) => void;
  onStopDrawing: () => void;
  onDropImage: (file: File | null) => void;
  onLayerCanvasUpdate: (layerId: string, canvas: HTMLCanvasElement | null) => void;
  onPrepareLayerCanvas: (layerId: string, canvas: HTMLCanvasElement) => void;
}

export function MultiLayerCanvasRenderer({
  compositeCanvasRef,
  layers,
  activeTool,
  brushSize,
  isDrawingDisabled,
  canvasWidth,
  canvasHeight,
  onStartDrawing,
  onDraw,
  onStopDrawing,
  onDropImage,
  onLayerCanvasUpdate,
  onPrepareLayerCanvas,
}: MultiLayerCanvasRendererProps) {
  const [isDragging, setIsDragging] = useState(false);
  const layerCanvasesRef = useRef<Map<string, HTMLCanvasElement>>(new Map());
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Create hidden canvas elements for each layer
  useEffect(() => {
    if (!containerRef.current) return;

    const existingLayers = new Set(Array.from(layerCanvasesRef.current.keys()));
    const currentLayerIds = new Set(layers.map((l) => l.id));

    // Remove canvases for deleted layers
    existingLayers.forEach((layerId) => {
      if (!currentLayerIds.has(layerId)) {
        const canvas = layerCanvasesRef.current.get(layerId);
        if (canvas && canvas.parentElement) {
          canvas.parentElement.removeChild(canvas);
        }
        layerCanvasesRef.current.delete(layerId);
        onLayerCanvasUpdate(layerId, null);
      }
    });

    // Create canvases for new layers
    layers.forEach((layer) => {
      if (!layerCanvasesRef.current.has(layer.id)) {
        const layerCanvas = document.createElement("canvas");
        layerCanvas.style.position = "absolute";
        layerCanvas.style.top = "0";
        layerCanvas.style.left = "0";
        layerCanvas.style.width = "100%";
        layerCanvas.style.height = "100%";
        layerCanvas.style.pointerEvents = "none";
        layerCanvas.style.opacity = "0";
        layerCanvas.style.zIndex = "-1";
        
        containerRef.current?.appendChild(layerCanvas);
        layerCanvasesRef.current.set(layer.id, layerCanvas);
        
        // Add data attribute to identify this canvas's layer
        layerCanvas.setAttribute('data-layer-id', layer.id);
        
        // CRITICAL: Prepare the canvas BEFORE notifying, so it's registered in useMultiLayerCanvas refs
        // This ensures the canvas is ready for drawing immediately when the layer is created
        // Call synchronously to avoid timing issues
        onPrepareLayerCanvas(layer.id, layerCanvas);
        
        // Then notify parent components
        onLayerCanvasUpdate(layer.id, layerCanvas);
      }
    });

    return () => {
      // Cleanup on unmount
      layerCanvasesRef.current.forEach((canvas) => {
        if (canvas.parentElement) {
          canvas.parentElement.removeChild(canvas);
        }
      });
      layerCanvasesRef.current.clear();
    };
  }, [layers, onLayerCanvasUpdate, onPrepareLayerCanvas]);

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    if (event.currentTarget.contains(event.relatedTarget as Node)) return;
    setIsDragging(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0] ?? null;
    onDropImage(file);
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (isDrawingDisabled) return;
    onStartDrawing(event);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (isDrawingDisabled) return;
    onDraw(event);
  };

  const handlePointerUp = () => {
    if (isDrawingDisabled) return;
    onStopDrawing();
  };

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <canvas
        ref={compositeCanvasRef}
        className="h-full w-full rounded-2xl"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={() => {
          onStopDrawing();
        }}
        style={{ width: "100%", height: "100%" }}
      />
      <div className="pointer-events-none absolute left-4 top-4 rounded-full border border-white/10 bg-black/60 px-3 py-1 text-xs font-semibold text-white">
        {activeTool === "eraser"
          ? "Eraser"
          : activeTool === "pencil"
            ? "Pencil"
            : activeTool === "brush"
              ? "Brush"
              : activeTool}{" "}
        • {brushSize}px
      </div>
      {isDragging && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-2xl border-2 border-dashed border-sky-500 bg-black/40 text-sm font-semibold text-white">
          Drop image to import
        </div>
      )}
    </div>
  );
}

