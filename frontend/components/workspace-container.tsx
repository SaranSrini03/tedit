"use client";

import { useEffect, useMemo, useRef, useState, type PropsWithChildren } from "react";
import { useAutoFit } from "@/hooks/use-auto-fit";

interface WorkspaceContainerProps extends PropsWithChildren {
  docWidth: number;
  docHeight: number;
  userZoom: number;
  handActive: boolean;
  showGrid: boolean;
  onZoomChange: (delta: number) => void;
  onScaleChange?: (scale: number) => void;
}

export function WorkspaceContainer({
  docWidth,
  docHeight,
  userZoom,
  handActive,
  showGrid,
  onZoomChange,
  onScaleChange,
  children,
}: WorkspaceContainerProps) {
  const { scale: fitScale, containerRef } = useAutoFit({
    documentWidth: docWidth,
    documentHeight: docHeight,
  });
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const lastPositionRef = useRef({ x: 0, y: 0 });

  const combinedScale = useMemo(() => fitScale * userZoom, [fitScale, userZoom]);

  useEffect(() => {
    onScaleChange?.(combinedScale);
  }, [combinedScale, onScaleChange]);

  useEffect(() => {
    if (!handActive) {
      setIsPanning(false);
    }
  }, [handActive]);

  useEffect(() => {
    setPan({ x: 0, y: 0 });
  }, [docWidth, docHeight]);

  useEffect(() => {
    const handleWheel = (event: WheelEvent) => {
      const container = containerRef.current;
      if (!container) return;
      const target = event.target as Node | null;
      if (!target || !container.contains(target)) return;

      if (event.ctrlKey || event.metaKey) {
        event.preventDefault();
        const delta = event.deltaY > 0 ? -0.1 : 0.1;
        onZoomChange(delta);
        return;
      }

      setPan((prev) => ({
        x: prev.x - event.deltaX,
        y: prev.y - event.deltaY,
      }));
      event.preventDefault();
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => window.removeEventListener("wheel", handleWheel as EventListener);
  }, [containerRef, onZoomChange]);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!handActive) return;
    event.preventDefault();
    setIsPanning(true);
    lastPositionRef.current = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isPanning) return;
    event.preventDefault();
    const deltaX = event.clientX - lastPositionRef.current.x;
    const deltaY = event.clientY - lastPositionRef.current.y;
    setPan((prev) => ({ x: prev.x + deltaX, y: prev.y + deltaY }));
    lastPositionRef.current = { x: event.clientX, y: event.clientY };
  };

  const stopPanning = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isPanning) return;
    event.preventDefault();
    setIsPanning(false);
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  return (
    <div
      ref={containerRef}
      className="relative flex h-full flex-1 items-center justify-center overflow-hidden bg-[#2b2b2b]"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={stopPanning}
      onPointerLeave={(event) => {
        stopPanning(event);
      }}
    >
      <div className="relative z-10 flex items-center justify-center">
        <div
          className="relative overflow-hidden rounded-2xl border border-[#1f1f1f] bg-black/70 shadow-2xl shadow-black/50"
          style={{
            width: docWidth,
            height: docHeight,
            transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${combinedScale})`,
            transformOrigin: "center center",
            transition: isPanning ? "none" : "transform 200ms ease",
            cursor: handActive ? (isPanning ? "grabbing" : "grab") : "default",
          }}
        >
          {children}
          {showGrid && (
            <div
              className="pointer-events-none absolute inset-0 z-10 rounded-2xl opacity-60"
              style={{
                backgroundImage:
                  "linear-gradient(90deg, rgba(148,163,184,0.4) 1px, transparent 1px), linear-gradient(0deg, rgba(148,163,184,0.4) 1px, transparent 1px)",
                backgroundSize: "32px 32px",
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

