"use client";

import { useMemo } from "react";

interface CursorPosition {
  x: number;
  y: number;
  userName: string;
}

interface CursorOverlayProps {
  cursors: Map<string, CursorPosition>;
  scale: number;
  pan: { x: number; y: number };
  docWidth: number;
  docHeight: number;
  containerRect?: DOMRect | null;
}

export function CursorOverlay({
  cursors,
  scale,
  pan,
  docWidth,
  docHeight,
  containerRect,
}: CursorOverlayProps) {
  const cursorArray = useMemo(
    () => Array.from(cursors.values()),
    [cursors]
  );

  if (cursorArray.length === 0 || !containerRect) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      {cursorArray.map((cursor, index) => {
        // Convert normalized coordinates (0-1) to screen position
        // Cursor coordinates are normalized (0-1) relative to canvas
        // Canvas is centered in container, so calculate offset from center
        const centerX = containerRect.width / 2;
        const centerY = containerRect.height / 2;
        
        // Offset from canvas center (0.5 is center, so subtract 0.5)
        const offsetFromCenterX = (cursor.x - 0.5) * docWidth;
        const offsetFromCenterY = (cursor.y - 0.5) * docHeight;
        
        // Convert to screen coordinates (account for scale and pan)
        const screenX = centerX + (offsetFromCenterX * scale) + pan.x;
        const screenY = centerY + (offsetFromCenterY * scale) + pan.y;

        return (
          <div
            key={`cursor-${index}`}
            className="absolute"
            style={{
              left: `${screenX}px`,
              top: `${screenY}px`,
              transform: "translate(-12px, -12px)",
            }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="drop-shadow-lg"
            >
              <path
                d="M3 3L10.07 19.97L12.58 12.58L19.97 10.07L3 3Z"
                fill="white"
                stroke="#0f172a"
                strokeWidth="1.5"
              />
            </svg>
            <div
              className="absolute left-6 top-4 whitespace-nowrap rounded px-2 py-1 text-xs font-medium text-white shadow-lg"
              style={{
                backgroundColor: `hsl(${(index * 137.5) % 360}, 70%, 50%)`,
              }}
            >
              {cursor.userName}
            </div>
          </div>
        );
      })}
    </div>
  );
}
