"use client";

import type React from "react";
import { useState } from "react";
import type { ToolId } from "@/lib/types";

interface CanvasRendererProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  activeTool: ToolId;
  brushSize: number;
  isDrawingDisabled: boolean;
  onStartDrawing: (event: React.PointerEvent<HTMLCanvasElement>) => void;
  onDraw: (event: React.PointerEvent<HTMLCanvasElement>) => void;
  onStopDrawing: () => void;
  onDropImage: (file: File | null) => void;
}

export function CanvasRenderer({
  canvasRef,
  activeTool,
  brushSize,
  isDrawingDisabled,
  onStartDrawing,
  onDraw,
  onStopDrawing,
  onDropImage,
}: CanvasRendererProps) {
  const [isDragging, setIsDragging] = useState(false);

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
      className="relative h-full w-full"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <canvas
        ref={canvasRef}
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
        {activeTool === "eraser" ? "Eraser" : "Brush"} • {brushSize}px
      </div>
      {isDragging && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-2xl border-2 border-dashed border-sky-500 bg-black/40 text-sm font-semibold text-white">
          Drop image to import
        </div>
      )}
    </div>
  );
}

